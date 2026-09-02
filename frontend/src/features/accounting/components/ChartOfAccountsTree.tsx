import React, { useState } from 'react';
import { Account } from '../types/accounting';
import { formatDecimal } from '../../../utils/decimal';

interface ChartOfAccountsTreeProps {
  accounts: Account[];
  onSelectAccount?: (account: Account) => void;
  onCreateAccount: (data: any) => Promise<void>;
}

export const ChartOfAccountsTree: React.FC<ChartOfAccountsTreeProps> = ({
  accounts,
  onSelectAccount,
  onCreateAccount,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState<'asset' | 'liability' | 'equity' | 'income' | 'expense'>('asset');
  const [group, setGroup] = useState('Current Assets');
  const [parentAccountId, setParentAccountId] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0.00');

  const categories: Array<'asset' | 'liability' | 'equity' | 'income' | 'expense'> = [
    'asset',
    'liability',
    'equity',
    'income',
    'expense',
  ];

  const categoryTitles: Record<string, string> = {
    asset: '1xxx Assets',
    liability: '2xxx Liabilities',
    equity: '3xxx Equity & Capital',
    income: '4xxx Operating & Other Income',
    expense: '5xxx Direct & Operating Expenses',
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateAccount({
      code,
      name,
      type,
      group,
      parentAccountId: parentAccountId || undefined,
      openingBalance,
    });
    setShowModal(false);
    setCode('');
    setName('');
    setOpeningBalance('0.00');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>🌲 Standard Chart of Accounts (COA)</h2>
          <p style={styles.subtitle}>Standard 5-tier classification under Nepal Accounting Standards (NAS/NFRS)</p>
        </div>
        <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>
          + Create Custom Account
        </button>
      </div>

      <div style={styles.treeGrid}>
        {categories.map((cat) => {
          const catAccounts = accounts.filter((a) => a.type === cat);
          return (
            <div key={cat} style={styles.categoryCard}>
              <div style={styles.categoryHeader}>
                <span style={styles.catTitle}>{categoryTitles[cat]}</span>
                <span style={styles.countPill}>{catAccounts.length} accounts</span>
              </div>

              <div style={styles.accountList}>
                {catAccounts.map((acc) => (
                  <div
                    key={acc._id}
                    style={styles.accountRow}
                    onClick={() => onSelectAccount && onSelectAccount(acc)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={styles.accCode}>{acc.code}</span>
                      <span style={styles.accName}>{acc.name}</span>
                      {acc.isSystem && <span style={styles.systemBadge}>SYS</span>}
                    </div>
                    <div style={styles.balanceVal}>NPR {formatDecimal(acc.currentBalance)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Create New Ledger Account</h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={styles.label}>Account Code (e.g. 1250, 5290)</label>
                <input required type="text" value={code} onChange={(e) => setCode(e.target.value)} style={styles.input} />
              </div>
              <div>
                <label style={styles.label}>Account Title / Name</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} style={styles.input} />
              </div>
              <div>
                <label style={styles.label}>Account Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as any)} style={styles.input}>
                  <option value="asset">Asset (1xxx)</option>
                  <option value="liability">Liability (2xxx)</option>
                  <option value="equity">Equity (3xxx)</option>
                  <option value="income">Income (4xxx)</option>
                  <option value="expense">Expense (5xxx)</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Sub-Group / Classification</label>
                <input required type="text" value={group} onChange={(e) => setGroup(e.target.value)} style={styles.input} />
              </div>
              <div>
                <label style={styles.label}>Parent Account (Optional)</label>
                <select value={parentAccountId} onChange={(e) => setParentAccountId(e.target.value)} style={styles.input}>
                  <option value="">None (Top-Level Account)</option>
                  {accounts.map((a) => (
                    <option key={a._id} value={a._id}>
                      {a.code} - {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label}>Opening Balance (NPR)</label>
                <input
                  type="number"
                  step="0.01"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '14px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '12px', color: '#64748b', marginTop: '4px' },
  btnPrimary: { backgroundColor: '#1e3a8a', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' },
  btnSecondary: { backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', border: '1px solid #cbd5e1', cursor: 'pointer' },
  treeGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' },
  categoryCard: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' },
  categoryHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '10px', marginBottom: '12px' },
  catTitle: { fontSize: '14px', fontWeight: 800, color: '#0f172a' },
  countPill: { fontSize: '11px', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#64748b', padding: '2px 8px', borderRadius: '12px' },
  accountList: { display: 'flex', flexDirection: 'column', gap: '6px' },
  accountRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: '6px', backgroundColor: '#f8fafc', cursor: 'pointer' },
  accCode: { fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: '#1e3a8a', width: '45px' },
  accName: { fontSize: '13px', fontWeight: 600, color: '#334155' },
  systemBadge: { fontSize: '9px', fontWeight: 800, backgroundColor: '#e2e8f0', color: '#475569', padding: '1px 4px', borderRadius: '3px' },
  balanceVal: { fontSize: '13px', fontWeight: 700, color: '#0f172a' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { backgroundColor: '#ffffff', borderRadius: '10px', width: '440px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' },
  label: { fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' },
  input: { width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
};
