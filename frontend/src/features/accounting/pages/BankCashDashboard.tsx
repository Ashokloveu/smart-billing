import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { formatDecimal } from '../../../utils/decimal';
import { treasuryService } from '../services/treasuryService';

// ─── Types ────────────────────────────────────────────────────────────────────

type AccountType = 'bank' | 'cash' | 'ewallet';
type ChequeStatus = 'pending' | 'cleared' | 'bounced' | 'deposited' | 'cancelled';

interface BankAccount {
  id: string;
  name: string;
  accountNumber?: string;
  bankName?: string;
  type: AccountType;
  balance: number;
  color: string;
  icon: string;
  ifsc?: string;
  branch?: string;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  ref?: string;
  reconciled: boolean;
}

interface PostDatedCheque {
  id: string;
  chequeNo: string;
  amount: number;
  date: string;        // cheque date
  party: string;
  bank: string;
  type: 'receive' | 'issue';
  status: ChequeStatus;
  remarks?: string;
}

const EMPTY_ACCOUNT: BankAccount = {
  id: '', name: 'No treasury account', type: 'cash', balance: 0,
  color: '#64748b', icon: '💼',
};



// ─── Sub-components ───────────────────────────────────────────────────────────

const AccountCard: React.FC<{ account: BankAccount; selected: boolean; onClick: () => void }> = ({ account, selected, onClick }) => (
  <div onClick={onClick} style={{
    background: selected ? `linear-gradient(135deg, ${account.color}22, ${account.color}44)` : 'rgba(255,255,255,0.04)',
    border: `1.5px solid ${selected ? account.color : 'rgba(255,255,255,0.1)'}`,
    borderRadius: 14, padding: '16px 18px', cursor: 'pointer',
    transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden',
    boxShadow: selected ? `0 4px 24px ${account.color}33` : 'none',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <div style={{ fontSize: 20, marginBottom: 4 }}>{account.icon}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{account.name}</div>
        {account.accountNumber && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
            ····{account.accountNumber.slice(-4)}
          </div>
        )}
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>
          {account.type === 'bank' ? 'BANK' : account.type === 'cash' ? 'CASH' : 'E-WALLET'}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: account.color }}>
          रू {account.balance.toLocaleString()}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Current Balance</div>
      </div>
    </div>
    {selected && <div style={{
      position: 'absolute', top: 0, right: 0, background: account.color,
      color: '#fff', fontSize: 9, padding: '3px 8px', borderBottomLeftRadius: 8,
      fontWeight: 700, letterSpacing: 1,
    }}>SELECTED</div>}
  </div>
);

const StatusBadge: React.FC<{ status: ChequeStatus }> = ({ status }) => {
  const cfg: Record<ChequeStatus, { color: string; bg: string; label: string }> = {
    pending:   { color: '#f39c12', bg: '#f39c1222', label: 'Pending' },
    cleared:   { color: '#27ae60', bg: '#27ae6022', label: 'Cleared ✓' },
    bounced:   { color: '#e74c3c', bg: '#e74c3c22', label: 'Bounced ✗' },
    deposited: { color: '#3498db', bg: '#3498db22', label: 'Deposited' },
    cancelled: { color: '#94a3b8', bg: '#94a3b822', label: 'Cancelled' },
  };
  const c = cfg[status];
  return (
    <span style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}44`, borderRadius: 6, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
      {c.label}
    </span>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const BankCashDashboard: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [activeTab, setActiveTab] = useState<'accounts' | 'transfer' | 'pdc' | 'brs'>('accounts');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<BankAccount>(EMPTY_ACCOUNT);
  const [cheques, setCheques] = useState<PostDatedCheque[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const [pdcFilter, setPdcFilter] = useState<'all' | ChequeStatus>('all');

  // Transfer form state
  const [transfer, setTransfer] = useState({ from: '', to: '', amount: '', narration: '', date: '' });
  const [showTransferSuccess, setShowTransferSuccess] = useState(false);

  // Add Account modal
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newAccount, setNewAccount] = useState({ name: '', accountNumber: '', bankName: '', type: 'bank' as AccountType, balance: '', branch: '', color: '#3498db' });

  // PDC modal
  const [showAddPdc, setShowAddPdc] = useState(false);
  const [newPdc, setNewPdc] = useState({ chequeNo: '', amount: '', date: '', party: '', bank: '', type: 'receive' as 'receive' | 'issue', remarks: '' });

  // BRS state
  const [brsStatementBalance, setBrsStatementBalance] = useState('');
  const [reconciledIds, setReconciledIds] = useState<Set<string>>(new Set(transactions.filter(t => t.reconciled).map(t => t.id)));

  const mapAccount = (value: any): BankAccount => ({
    id: value._id,
    name: value.name,
    accountNumber: value.accountNumber,
    bankName: value.bankName,
    type: value.type,
    balance: Number(formatDecimal(value.ledgerAccountId?.currentBalance)),
    color: value.color,
    icon: value.type === 'bank' ? '🏦' : value.type === 'cash' ? '💵' : '📱',
    branch: value.branch,
  });
  const mapCheque = (value: any): PostDatedCheque => ({
    id: value._id,
    chequeNo: value.chequeNumber,
    amount: Number(formatDecimal(value.amount)),
    date: String(value.chequeDate).slice(0, 10),
    party: value.partyName,
    bank: value.bankName,
    type: value.type,
    status: value.status,
    remarks: value.remarks,
  });

  const loadDashboard = async () => {
    if (!currentOrg?._id) return;
    try {
      setError('');
      const [accountRows, chequeRows] = await Promise.all([
        treasuryService.getAccounts(currentOrg._id),
        treasuryService.getCheques(currentOrg._id),
      ]);
      const mapped = accountRows.map(mapAccount);
      setAccounts(mapped);
      setCheques(chequeRows.map(mapCheque));
      setSelectedAccount((existing) => mapped.find((item: BankAccount) => item.id === existing.id) || mapped[0] || EMPTY_ACCOUNT);
      if (mapped.length > 1) setTransfer((value) => ({ ...value, from: value.from || mapped[0].id, to: value.to || mapped[1].id }));
    } catch (requestError: any) {
      setError(requestError.response?.data?.message || 'Unable to load bank and cash data.');
    }
  };

  useEffect(() => { void loadDashboard(); }, [currentOrg?._id]);
  useEffect(() => {
    if (!currentOrg?._id || !selectedAccount.id) { setTransactions([]); return; }
    treasuryService.getLedger(currentOrg._id, selectedAccount.id).then((rows) => {
      const mapped = rows.map((value: any) => ({
        id: value.id,
        date: String(value.date).slice(0, 10),
        description: value.description,
        debit: Number(formatDecimal(value.debit)),
        credit: Number(formatDecimal(value.credit)),
        balance: Number(formatDecimal(value.balance)),
        ref: value.ref,
        reconciled: value.reconciled,
      }));
      setTransactions(mapped);
      setReconciledIds(new Set(mapped.filter((item: Transaction) => item.reconciled).map((item: Transaction) => item.id)));
    }).catch(() => setTransactions([]));
  }, [currentOrg?._id, selectedAccount?.id]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const bankBalance = accounts.filter(a => a.type === 'bank').reduce((sum, a) => sum + a.balance, 0);
  const cashBalance = accounts.filter(a => a.type === 'cash').reduce((sum, a) => sum + a.balance, 0);
  const liquidityShare = totalBalance > 0 ? Math.min((selectedAccount.balance / totalBalance) * 100, 100) : 0;

  const filteredCheques = pdcFilter === 'all' ? cheques : cheques.filter(c => c.status === pdcFilter);
  const pendingPdcTotal = cheques.filter(c => c.status === 'pending' && c.type === 'receive').reduce((s, c) => s + c.amount, 0);

  const handleTransfer = async () => {
    if (!currentOrg?._id || !transfer.from || !transfer.to || !transfer.amount || transfer.from === transfer.to) return;
    const amt = parseFloat(transfer.amount);
    if (isNaN(amt) || amt <= 0) return;
    try {
      setError('');
      await treasuryService.createTransfer(currentOrg._id, {
        fromAccountId: transfer.from, toAccountId: transfer.to, amount: amt.toFixed(2),
        date: transfer.date ? `${transfer.date}T00:00:00.000Z` : undefined,
        bsDate: transfer.date || new Date().toISOString().slice(0, 10),
        narration: transfer.narration || 'Internal fund transfer',
      });
      await loadDashboard();
      setShowTransferSuccess(true);
      setTransfer(t => ({ ...t, amount: '', narration: '' }));
      setTimeout(() => setShowTransferSuccess(false), 3000);
    } catch (requestError: any) { setError(requestError.response?.data?.message || 'Fund transfer failed.'); }
  };

  const handleAddAccount = async () => {
    if (!currentOrg?._id || !newAccount.name) return;
    try {
      setError('');
      await treasuryService.createAccount(currentOrg._id, { ...newAccount, openingBalance: (parseFloat(newAccount.balance) || 0).toFixed(2) });
      await loadDashboard();
      setShowAddAccount(false);
      setNewAccount({ name: '', accountNumber: '', bankName: '', type: 'bank', balance: '', branch: '', color: '#3498db' });
    } catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to create account.'); }
  };

  const handleAddPdc = async () => {
    if (!currentOrg?._id || !newPdc.chequeNo || !newPdc.amount || !newPdc.party || !newPdc.bank || !newPdc.date) return;
    try {
      const saved = await treasuryService.createCheque(currentOrg._id, {
        chequeNumber: newPdc.chequeNo, amount: Number(newPdc.amount).toFixed(2),
        chequeDate: `${newPdc.date}T00:00:00.000Z`, partyName: newPdc.party,
        bankName: newPdc.bank, type: newPdc.type, remarks: newPdc.remarks,
      });
      setCheques(prev => [...prev, mapCheque(saved)]);
      setShowAddPdc(false);
      setNewPdc({ chequeNo: '', amount: '', date: '', party: '', bank: '', type: 'receive', remarks: '' });
    } catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to save cheque.'); }
  };

  const handleChequeStatusChange = async (id: string, status: ChequeStatus) => {
    if (!currentOrg?._id) return;
    try {
      const saved = await treasuryService.updateChequeStatus(currentOrg._id, id, status);
      setCheques(prev => prev.map(c => c.id === id ? mapCheque(saved) : c));
    } catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to update cheque.'); }
  };

  const toggleReconcile = async (id: string) => {
    if (!currentOrg?._id || !selectedAccount.id) return;
    const shouldReconcile = !reconciledIds.has(id);
    try { await treasuryService.setReconciled(currentOrg._id, selectedAccount.id, id, shouldReconcile); }
    catch (requestError: any) { setError(requestError.response?.data?.message || 'Unable to update reconciliation.'); return; }
    setReconciledIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const unreconciledTotal = transactions.filter(t => !reconciledIds.has(t.id)).reduce((s, t) => s + (t.credit - t.debit), 0);
  const brsResult = brsStatementBalance ? (parseFloat(brsStatementBalance) + unreconciledTotal) : null;

  const tabs = [
    { key: 'accounts', label: '🏦 Accounts', desc: 'Multi-account overview' },
    { key: 'transfer', label: '🔄 Fund Transfer', desc: 'Contra entries' },
    { key: 'pdc', label: '📋 PDC Ledger', desc: 'Post-dated cheques' },
    { key: 'brs', label: '🔍 Reconciliation', desc: 'Bank statement match' },
  ] as const;

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8, color: '#fff', padding: '10px 14px', fontSize: 13, width: '100%', boxSizing: 'border-box',
    outline: 'none',
  };
  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.8 };
  const btnPrimary: React.CSSProperties = {
    background: 'linear-gradient(135deg, #667eea, #764ba2)', border: 'none', color: '#fff',
    borderRadius: 10, padding: '11px 24px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a0a1a 0%, #0d1b2a 50%, #0a0a1a 100%)', padding: '28px 32px', fontFamily: "'Inter', sans-serif", color: '#fff' }}>

      {/* ── Header ── */}
      {error && <div role="alert" style={{ background: 'rgba(231,76,60,0.15)', border: '1px solid #e74c3c', color: '#fecaca', padding: '10px 14px', borderRadius: 10, marginBottom: 16 }}>{error}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🏦</div>
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, background: 'linear-gradient(90deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Bank & Cash Management
              </h1>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                Fund Transfers · PDC Ledger · Bank Reconciliation · Multi-Account
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowAddAccount(true)} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #27ae60, #1e8449)', fontSize: 12 }}>
            + Add Account
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Liquid Assets', value: `रू ${totalBalance.toLocaleString()}`, sub: 'All accounts combined', color: '#a78bfa', icon: '💎' },
          { label: 'Bank Balances', value: `रू ${bankBalance.toLocaleString()}`, sub: `${accounts.filter(a => a.type === 'bank').length} bank accounts`, color: '#60a5fa', icon: '🏦' },
          { label: 'Cash & Petty Cash', value: `रू ${cashBalance.toLocaleString()}`, sub: 'Physical cash drawers', color: '#f39c12', icon: '💵' },
          { label: 'PDC Receivable', value: `रू ${pendingPdcTotal.toLocaleString()}`, sub: `${cheques.filter(c => c.status === 'pending' && c.type === 'receive').length} pending cheques`, color: '#27ae60', icon: '📋' },
        ].map(k => (
          <div key={k.label} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -10, right: -10, fontSize: 48, opacity: 0.07 }}>{k.icon}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{k.label}</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: k.color, marginBottom: 4 }}>{k.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 6, width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            background: activeTab === t.key ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
            border: 'none', color: activeTab === t.key ? '#fff' : 'rgba(255,255,255,0.5)',
            borderRadius: 10, padding: '9px 20px', fontWeight: activeTab === t.key ? 700 : 500,
            fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 1: ACCOUNTS OVERVIEW
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'accounts' && (
        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}>
          {/* Account List */}
          <div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              {accounts.length} Accounts
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {accounts.map(a => (
                <AccountCard key={a.id} account={a} selected={selectedAccount.id === a.id} onClick={() => setSelectedAccount(a)} />
              ))}
            </div>
          </div>

          {/* Account Detail */}
          <div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{selectedAccount.icon} {selectedAccount.name}</div>
                  {selectedAccount.bankName && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{selectedAccount.bankName}</div>}
                  {selectedAccount.branch && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>📍 {selectedAccount.branch}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: selectedAccount.color }}>रू {selectedAccount.balance.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Available Balance</div>
                  {selectedAccount.accountNumber && (
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                      A/C: {selectedAccount.accountNumber}
                    </div>
                  )}
                </div>
              </div>

              {/* Mini balance bar */}
              <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 8, height: 6, marginBottom: 4 }}>
                <div style={{ background: selectedAccount.color, borderRadius: 8, height: '100%', width: `${liquidityShare}%`, transition: 'width 0.4s' }} />
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
                {liquidityShare.toFixed(1)}% of total liquidity
              </div>
            </div>

            {/* Transaction History for selected account */}
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: '#fff' }}>Recent Transactions</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    {['Date', 'Description', 'Ref', 'Money In (Dr)', 'Money Out (Cr)', 'Balance'].map(h => (
                      <th key={h} style={{ textAlign: 'left', padding: '8px 10px', color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                      <td style={{ padding: '10px 10px', color: 'rgba(255,255,255,0.6)' }}>{t.date}</td>
                      <td style={{ padding: '10px 10px', color: '#fff' }}>{t.description}</td>
                      <td style={{ padding: '10px 10px', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', fontSize: 11 }}>{t.ref}</td>
                      <td style={{ padding: '10px 10px', color: '#27ae60', fontWeight: 700 }}>{t.debit ? `रू ${t.debit.toLocaleString()}` : '—'}</td>
                      <td style={{ padding: '10px 10px', color: '#e74c3c', fontWeight: 700 }}>{t.credit ? `रू ${t.credit.toLocaleString()}` : '—'}</td>
                      <td style={{ padding: '10px 10px', color: '#60a5fa', fontWeight: 700 }}>रू {t.balance.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 2: FUND TRANSFER (CONTRA ENTRIES)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'transfer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '440px 1fr', gap: 24 }}>
          {/* Transfer Form */}
          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 28 }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>🔄 New Fund Transfer</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>Contra Entry — credits the source and debits the destination</div>

            {showTransferSuccess && (
              <div style={{ background: '#27ae6020', border: '1px solid #27ae60', borderRadius: 10, padding: '12px 16px', marginBottom: 20, color: '#27ae60', fontWeight: 700, fontSize: 13 }}>
                ✅ Transfer recorded successfully! Balances updated.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={labelStyle}>From Account</label>
                <select value={transfer.from} onChange={e => setTransfer(t => ({ ...t, from: e.target.value }))} style={{ ...inputStyle }}>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} style={{ background: '#1a1a2e' }}>
                      {a.icon} {a.name} — रू {a.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ textAlign: 'center', fontSize: 22, color: 'rgba(255,255,255,0.3)' }}>⬇️</div>

              <div>
                <label style={labelStyle}>To Account</label>
                <select value={transfer.to} onChange={e => setTransfer(t => ({ ...t, to: e.target.value }))} style={{ ...inputStyle }}>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} style={{ background: '#1a1a2e' }}>
                      {a.icon} {a.name} — रू {a.balance.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Amount (NPR)</label>
                <input type="number" placeholder="0.00" value={transfer.amount} onChange={e => setTransfer(t => ({ ...t, amount: e.target.value }))} style={{ ...inputStyle }} />
              </div>

              <div>
                <label style={labelStyle}>Transfer Date</label>
                <input type="date" value={transfer.date} onChange={e => setTransfer(t => ({ ...t, date: e.target.value }))} style={{ ...inputStyle }} />
              </div>

              <div>
                <label style={labelStyle}>Narration / Remarks</label>
                <input type="text" placeholder="e.g. Weekly cash deposit" value={transfer.narration} onChange={e => setTransfer(t => ({ ...t, narration: e.target.value }))} style={{ ...inputStyle }} />
              </div>

              {transfer.from && transfer.to && transfer.amount && transfer.from !== transfer.to && (
                <div style={{ background: 'rgba(102,126,234,0.15)', border: '1px solid rgba(102,126,234,0.3)', borderRadius: 10, padding: '14px 16px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Contra Entry Preview</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: '#e74c3c' }}>DR: {accounts.find(a => a.id === transfer.to)?.name}</span>
                    <span style={{ fontSize: 12, color: '#e74c3c', fontWeight: 700 }}>रू {parseFloat(transfer.amount || '0').toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#27ae60' }}>CR: {accounts.find(a => a.id === transfer.from)?.name}</span>
                    <span style={{ fontSize: 12, color: '#27ae60', fontWeight: 700 }}>रू {parseFloat(transfer.amount || '0').toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button onClick={handleTransfer} style={{ ...btnPrimary, padding: '13px', fontSize: 14 }}>
                🔄 Execute Transfer
              </button>
            </div>
          </div>

          {/* Live Account Balances */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Live Account Balances</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {accounts.map(a => (
                <div key={a.id} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${a.color}22`, border: `1px solid ${a.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{a.icon}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700 }}>{a.name}</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase' }}>{a.type}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: a.color }}>रू {a.balance.toLocaleString()}</div>
                    <div style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, height: 4, width: 120, marginTop: 6 }}>
                      <div style={{ background: a.color, borderRadius: 6, height: '100%', width: `${Math.min((a.balance / totalBalance) * 100, 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 3: PDC LEDGER
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pdc' && (
        <div>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
            {(['pending', 'cleared', 'bounced', 'deposited', 'cancelled'] as ChequeStatus[]).map(s => {
              const cfg: Record<ChequeStatus, { color: string; icon: string; label: string }> = { pending: { color: '#f39c12', icon: '⏳', label: 'Pending' }, cleared: { color: '#27ae60', icon: '✅', label: 'Cleared' }, bounced: { color: '#e74c3c', icon: '❌', label: 'Bounced' }, deposited: { color: '#3498db', icon: '🏦', label: 'Deposited' }, cancelled: { color: '#94a3b8', icon: '⊘', label: 'Cancelled' } };
              const c = cfg[s];
              const count = cheques.filter(ch => ch.status === s).length;
              const total = cheques.filter(ch => ch.status === s).reduce((sum, ch) => sum + ch.amount, 0);
              return (
                <div key={s} onClick={() => setPdcFilter(pdcFilter === s ? 'all' : s)} style={{ background: pdcFilter === s ? `${c.color}22` : 'rgba(255,255,255,0.04)', border: `1px solid ${pdcFilter === s ? c.color : 'rgba(255,255,255,0.08)'}`, borderRadius: 14, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{c.icon}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>{c.label}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: c.color }}>{count} cheques</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>रू {total.toLocaleString()}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {pdcFilter === 'all' ? 'All Cheques' : `${pdcFilter.charAt(0).toUpperCase() + pdcFilter.slice(1)} Cheques`}
              <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>({filteredCheques.length})</span>
            </div>
            <button onClick={() => setShowAddPdc(true)} style={{ ...btnPrimary, fontSize: 12, padding: '8px 16px' }}>+ Add Cheque</button>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  {['Cheque No.', 'Party', 'Bank', 'Type', 'Date', 'Amount', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 14px', color: 'rgba(255,255,255,0.5)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredCheques.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px 14px', fontFamily: 'monospace', color: '#a78bfa', fontWeight: 700 }}>{c.chequeNo}</td>
                    <td style={{ padding: '12px 14px', color: '#fff' }}>{c.party}</td>
                    <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)' }}>{c.bank}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ background: c.type === 'receive' ? '#27ae6022' : '#e74c3c22', color: c.type === 'receive' ? '#27ae60' : '#e74c3c', border: `1px solid ${c.type === 'receive' ? '#27ae6044' : '#e74c3c44'}`, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>
                        {c.type === 'receive' ? '↙ Receive' : '↗ Issue'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)' }}>{c.date}</td>
                    <td style={{ padding: '12px 14px', fontWeight: 700, color: c.type === 'receive' ? '#27ae60' : '#e74c3c' }}>
                      रू {c.amount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px 14px' }}><StatusBadge status={c.status} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.status === 'pending' && (
                          <>
                            <button onClick={() => handleChequeStatusChange(c.id, 'cleared')} style={{ background: '#27ae6020', border: '1px solid #27ae6040', color: '#27ae60', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Clear</button>
                            <button onClick={() => handleChequeStatusChange(c.id, 'deposited')} style={{ background: '#3498db20', border: '1px solid #3498db40', color: '#3498db', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Deposit</button>
                            <button onClick={() => handleChequeStatusChange(c.id, 'bounced')} style={{ background: '#e74c3c20', border: '1px solid #e74c3c40', color: '#e74c3c', borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', fontWeight: 700 }}>Bounce</button>
                          </>
                        )}
                        {c.status !== 'pending' && <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Settled</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCheques.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)' }}>No cheques found for this filter.</div>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════
          TAB 4: BANK RECONCILIATION STATEMENT (BRS)
      ═══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'brs' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24 }}>
          {/* Transactions to reconcile */}
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>🔍 Bank Reconciliation Statement</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>
              Check/uncheck transactions that appear on your bank statement. The tool will compute the reconciled balance.
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                    <th style={{ padding: '12px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>✓</th>
                    {['Date', 'Description', 'Ref', 'Debit', 'Credit', 'Balance'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => {
                    const isReconciled = reconciledIds.has(t.id);
                    return (
                      <tr key={t.id} onClick={() => toggleReconcile(t.id)} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', background: isReconciled ? 'rgba(39,174,96,0.05)' : 'transparent', transition: 'background 0.15s' }}>
                        <td style={{ padding: '12px 14px' }}>
                          <div style={{ width: 18, height: 18, borderRadius: 4, background: isReconciled ? '#27ae60' : 'rgba(255,255,255,0.1)', border: `1px solid ${isReconciled ? '#27ae60' : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#fff', fontWeight: 700 }}>
                            {isReconciled ? '✓' : ''}
                          </div>
                        </td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.6)' }}>{t.date}</td>
                        <td style={{ padding: '12px 14px', color: isReconciled ? '#fff' : 'rgba(255,255,255,0.5)' }}>{t.description}</td>
                        <td style={{ padding: '12px 14px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace', fontSize: 11 }}>{t.ref}</td>
                        <td style={{ padding: '12px 14px', color: '#e74c3c', fontWeight: 700 }}>{t.debit ? `रू ${t.debit.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#27ae60', fontWeight: 700 }}>{t.credit ? `रू ${t.credit.toLocaleString()}` : '—'}</td>
                        <td style={{ padding: '12px 14px', color: '#60a5fa', fontWeight: 700 }}>रू {t.balance.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* BRS Summary Panel */}
          <div>
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, position: 'sticky', top: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 20 }}>📊 BRS Summary</div>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Bank Statement Closing Balance (NPR)</label>
                <input type="number" placeholder="Enter balance from bank statement" value={brsStatementBalance} onChange={e => setBrsStatementBalance(e.target.value)} style={{ ...inputStyle }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Balance as per Bank Statement</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>{brsStatementBalance ? `रू ${parseFloat(brsStatementBalance).toLocaleString()}` : '—'}</span>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Unreconciled Entries</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: unreconciledTotal >= 0 ? '#27ae60' : '#e74c3c' }}>
                      {unreconciledTotal >= 0 ? '+' : ''}रू {unreconciledTotal.toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
                    {transactions.length - reconciledIds.size} of {transactions.length} entries unmatched
                  </div>
                </div>
                <div style={{ background: brsResult !== null && Math.abs(brsResult - selectedAccount.balance) < 1 ? 'rgba(39,174,96,0.15)' : 'rgba(255,255,255,0.04)', border: `1px solid ${brsResult !== null && Math.abs(brsResult - selectedAccount.balance) < 1 ? '#27ae60' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>Adjusted Book Balance</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: brsResult !== null && Math.abs(brsResult - selectedAccount.balance) < 1 ? '#27ae60' : '#a78bfa' }}>
                    {brsResult !== null ? `रू ${brsResult.toLocaleString()}` : '—'}
                  </span>
                </div>
              </div>

              {brsResult !== null && (
                <div style={{ background: Math.abs(brsResult - selectedAccount.balance) < 1 ? 'rgba(39,174,96,0.15)' : 'rgba(231,76,60,0.15)', border: `1px solid ${Math.abs(brsResult - selectedAccount.balance) < 1 ? '#27ae60' : '#e74c3c'}`, borderRadius: 10, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{Math.abs(brsResult - selectedAccount.balance) < 1 ? '✅' : '⚠️'}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: Math.abs(brsResult - selectedAccount.balance) < 1 ? '#27ae60' : '#e74c3c' }}>
                    {Math.abs(brsResult - selectedAccount.balance) < 1 ? 'Accounts Reconciled!' : 'Difference Detected'}
                  </div>
                  {Math.abs(brsResult - selectedAccount.balance) >= 1 && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                      Difference: रू {Math.abs(brsResult - selectedAccount.balance).toLocaleString()}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>Reconciliation Status</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1, background: '#27ae6033', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#27ae60' }}>{reconciledIds.size}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Reconciled</div>
                  </div>
                  <div style={{ flex: 1, background: '#e74c3c33', borderRadius: 6, padding: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: 16, fontWeight: 800, color: '#e74c3c' }}>{transactions.length - reconciledIds.size}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Unmatched</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Add Account ═══ */}
      {showAddAccount && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#12121f', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 32, width: 440, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>🏦 Add New Account</div>
              <button onClick={() => setShowAddAccount(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Account Type</label>
                <select value={newAccount.type} onChange={e => setNewAccount(a => ({ ...a, type: e.target.value as AccountType }))} style={{ ...inputStyle }}>
                  <option value="bank" style={{ background: '#12121f' }}>🏦 Bank Account</option>
                  <option value="cash" style={{ background: '#12121f' }}>💵 Cash / Petty Cash</option>
                  <option value="ewallet" style={{ background: '#12121f' }}>📱 Digital Wallet (eSewa / Khalti)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Account Name *</label>
                <input value={newAccount.name} onChange={e => setNewAccount(a => ({ ...a, name: e.target.value }))} placeholder="e.g. Siddhartha Bank" style={{ ...inputStyle }} />
              </div>
              {newAccount.type === 'bank' && <>
                <div>
                  <label style={labelStyle}>Bank Name</label>
                  <input value={newAccount.bankName} onChange={e => setNewAccount(a => ({ ...a, bankName: e.target.value }))} placeholder="e.g. Siddhartha Bank Ltd." style={{ ...inputStyle }} />
                </div>
                <div>
                  <label style={labelStyle}>Account Number</label>
                  <input value={newAccount.accountNumber} onChange={e => setNewAccount(a => ({ ...a, accountNumber: e.target.value }))} placeholder="e.g. 0012345678" style={{ ...inputStyle }} />
                </div>
                <div>
                  <label style={labelStyle}>Branch</label>
                  <input value={newAccount.branch} onChange={e => setNewAccount(a => ({ ...a, branch: e.target.value }))} placeholder="e.g. Thamel, Kathmandu" style={{ ...inputStyle }} />
                </div>
              </>}
              {newAccount.type === 'ewallet' && (
                <div>
                  <label style={labelStyle}>Mobile / Wallet Number</label>
                  <input value={newAccount.accountNumber} onChange={e => setNewAccount(a => ({ ...a, accountNumber: e.target.value }))} placeholder="e.g. 9841234567" style={{ ...inputStyle }} />
                </div>
              )}
              <div>
                <label style={labelStyle}>Opening Balance (NPR)</label>
                <input type="number" value={newAccount.balance} onChange={e => setNewAccount(a => ({ ...a, balance: e.target.value }))} placeholder="0.00" style={{ ...inputStyle }} />
              </div>
              <div>
                <label style={labelStyle}>Color Tag</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['#e74c3c', '#3498db', '#27ae60', '#f39c12', '#8e44ad', '#16a085', '#e67e22', '#1abc9c'].map(c => (
                    <div key={c} onClick={() => setNewAccount(a => ({ ...a, color: c }))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: newAccount.color === c ? '3px solid #fff' : '2px solid transparent', transition: 'border 0.15s' }} />
                  ))}
                </div>
              </div>
              <button onClick={handleAddAccount} style={{ ...btnPrimary, marginTop: 8, padding: '12px' }}>✓ Add Account</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Add PDC ═══ */}
      {showAddPdc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#12121f', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: 32, width: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>📋 Add Post-Dated Cheque</div>
              <button onClick={() => setShowAddPdc(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Type</label>
                <select value={newPdc.type} onChange={e => setNewPdc(p => ({ ...p, type: e.target.value as 'receive' | 'issue' }))} style={{ ...inputStyle }}>
                  <option value="receive" style={{ background: '#12121f' }}>↙ Received from Party</option>
                  <option value="issue" style={{ background: '#12121f' }}>↗ Issued to Party</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Cheque Number *</label>
                <input value={newPdc.chequeNo} onChange={e => setNewPdc(p => ({ ...p, chequeNo: e.target.value }))} placeholder="e.g. NBL-001234" style={{ ...inputStyle }} />
              </div>
              <div>
                <label style={labelStyle}>Party Name *</label>
                <input value={newPdc.party} onChange={e => setNewPdc(p => ({ ...p, party: e.target.value }))} placeholder="e.g. Ram Traders Pvt. Ltd." style={{ ...inputStyle }} />
              </div>
              <div>
                <label style={labelStyle}>Bank</label>
                <input value={newPdc.bank} onChange={e => setNewPdc(p => ({ ...p, bank: e.target.value }))} placeholder="e.g. Nabil Bank" style={{ ...inputStyle }} />
              </div>
              <div>
                <label style={labelStyle}>Cheque Date</label>
                <input type="date" value={newPdc.date} onChange={e => setNewPdc(p => ({ ...p, date: e.target.value }))} style={{ ...inputStyle }} />
              </div>
              <div>
                <label style={labelStyle}>Amount (NPR) *</label>
                <input type="number" value={newPdc.amount} onChange={e => setNewPdc(p => ({ ...p, amount: e.target.value }))} placeholder="0.00" style={{ ...inputStyle }} />
              </div>
              <div>
                <label style={labelStyle}>Remarks</label>
                <input value={newPdc.remarks} onChange={e => setNewPdc(p => ({ ...p, remarks: e.target.value }))} placeholder="e.g. Invoice #INV-001" style={{ ...inputStyle }} />
              </div>
              <button onClick={handleAddPdc} style={{ ...btnPrimary, marginTop: 8, padding: '12px' }}>✓ Save Cheque</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
