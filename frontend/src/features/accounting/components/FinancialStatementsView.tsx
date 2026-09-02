import React, { useEffect, useState } from 'react';
import {
  TrialBalanceResponse,
  ProfitLossStatement,
  BalanceSheetStatement,
  CashFlowStatement,
} from '../types/accounting';
import { accountingService } from '../services/accountingService';
import { useOrgStore } from '../../../stores/orgStore';

export const FinancialStatementsView: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [activeTab, setActiveTab] = useState<'trial_balance' | 'pnl' | 'balance_sheet' | 'cash_flow'>('trial_balance');

  const [tb, setTb] = useState<TrialBalanceResponse | null>(null);
  const [pnl, setPnl] = useState<ProfitLossStatement | null>(null);
  const [bs, setBs] = useState<BalanceSheetStatement | null>(null);
  const [cf, setCf] = useState<CashFlowStatement | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatements = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const [tbRes, pnlRes, bsRes, cfRes] = await Promise.all([
        accountingService.getTrialBalance(currentOrg._id),
        accountingService.getProfitLoss(currentOrg._id),
        accountingService.getBalanceSheet(currentOrg._id),
        accountingService.getCashFlow(currentOrg._id),
      ]);
      setTb(tbRes);
      setPnl(pnlRes);
      setBs(bsRes);
      setCf(cfRes);
    } catch (e) {
      console.error('Failed to load financial statements', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatements();
  }, [currentOrg?._id]);

  if (loading && !tb) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
        <h3>Loading Statutory Financial Statements...</h3>
        <p style={{ fontSize: '13px', marginTop: '6px' }}>Computing Trial Balance and Balance Sheet equilibrium.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>📊 Statutory Financial Statements</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Nepal NFRS/NAS compliant Trial Balance, Profit & Loss, Balance Sheet, and Cash Flow.
          </p>
        </div>
        <button style={styles.printBtn} onClick={() => window.print()}>
          🖨️ Print Statement
        </button>
      </div>

      {/* Tabs */}
      <div style={styles.tabsBar}>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'trial_balance' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('trial_balance')}
        >
          ⚖️ Trial Balance
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'pnl' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('pnl')}
        >
          📈 Profit & Loss
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'balance_sheet' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('balance_sheet')}
        >
          🏛️ Balance Sheet
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'cash_flow' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('cash_flow')}
        >
          💵 Cash Flow Statement
        </button>
      </div>

      {/* 1. Trial Balance Tab */}
      {activeTab === 'trial_balance' && tb && (
        <div style={styles.sheet}>
          <div style={styles.sheetHeader}>
            <h3>Trial Balance Statement</h3>
            <span
              style={{
                ...styles.badge,
                backgroundColor: tb.isBalanced ? '#ecfdf5' : '#fef2f2',
                color: tb.isBalanced ? '#059669' : '#dc2626',
              }}
            >
              {tb.isBalanced ? '✓ DEBITS EQUAL CREDITS' : '⚠️ IMBALANCED'}
            </span>
          </div>

          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Account Title</th>
                <th style={styles.th}>Classification</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Debit (NPR)</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Credit (NPR)</th>
              </tr>
            </thead>
            <tbody>
              {tb.rows.map((row) => (
                <tr key={row.accountId} style={styles.tr}>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700 }}>{row.code}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{row.name}</td>
                  <td style={styles.td}>{row.group}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                    {row.debit > 0 ? row.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                    {row.credit > 0 ? row.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                  </td>
                </tr>
              ))}
              <tr style={styles.totalRow}>
                <td colSpan={3} style={{ ...styles.td, fontWeight: 800 }}>
                  TOTAL TRIAL BALANCE EQUILIBRIUM:
                </td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800 }}>
                  NPR {tb.totalDebit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800 }}>
                  NPR {tb.totalCredit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Profit & Loss Tab */}
      {activeTab === 'pnl' && pnl && (
        <div style={styles.sheet}>
          <div style={styles.sheetHeader}>
            <h3>Statement of Profit or Loss</h3>
            <span
              style={{
                ...styles.badge,
                backgroundColor: pnl.netProfit >= 0 ? '#ecfdf5' : '#fef2f2',
                color: pnl.netProfit >= 0 ? '#059669' : '#dc2626',
              }}
            >
              Net Margin: NPR {pnl.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div style={styles.pnlSection}>
            <h4 style={styles.sectionHeader}>I. Operating & Other Revenue</h4>
            {pnl.income.map((grp) => (
              <div key={grp.group} style={styles.groupBlock}>
                <div style={styles.groupHead}>
                  <strong>{grp.group}</strong>
                  <span>NPR {grp.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {grp.accounts.map((acc) => (
                  <div key={acc.code} style={styles.lineItem}>
                    <span>
                      {acc.code} - {acc.name}
                    </span>
                    <span>NPR {acc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={styles.totalBar}>
              <span>TOTAL REVENUE:</span>
              <span>NPR {pnl.totalIncome.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div style={styles.pnlSection}>
            <h4 style={styles.sectionHeader}>II. Direct & Operating Expenses</h4>
            {pnl.expenses.map((grp) => (
              <div key={grp.group} style={styles.groupBlock}>
                <div style={styles.groupHead}>
                  <strong>{grp.group}</strong>
                  <span>NPR {grp.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {grp.accounts.map((acc) => (
                  <div key={acc.code} style={styles.lineItem}>
                    <span>
                      {acc.code} - {acc.name}
                    </span>
                    <span>NPR {acc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                ))}
              </div>
            ))}
            <div style={styles.totalBar}>
              <span>TOTAL EXPENSES:</span>
              <span>NPR {pnl.totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div
            style={{
              ...styles.netProfitBar,
              backgroundColor: pnl.netProfit >= 0 ? '#ecfdf5' : '#fef2f2',
              color: pnl.netProfit >= 0 ? '#059669' : '#dc2626',
            }}
          >
            <span>NET PROFIT / (LOSS) FOR THE PERIOD:</span>
            <span>NPR {pnl.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

      {/* 3. Balance Sheet Tab */}
      {activeTab === 'balance_sheet' && bs && (
        <div style={styles.sheet}>
          <div style={styles.sheetHeader}>
            <h3>Statement of Financial Position (Balance Sheet)</h3>
            <span
              style={{
                ...styles.badge,
                backgroundColor: bs.isBalanced ? '#ecfdf5' : '#fef2f2',
                color: bs.isBalanced ? '#059669' : '#dc2626',
              }}
            >
              {bs.isBalanced ? '✓ ASSETS = LIABILITIES + EQUITY' : '⚠️ OUT OF BALANCE'}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Left: Assets */}
            <div>
              <h4 style={styles.sectionHeader}>ASSETS</h4>
              {bs.assets.map((grp) => (
                <div key={grp.group} style={styles.groupBlock}>
                  <div style={styles.groupHead}>
                    <strong>{grp.group}</strong>
                    <span>NPR {grp.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {grp.accounts.map((acc) => (
                    <div key={acc.code} style={styles.lineItem}>
                      <span>
                        {acc.code} - {acc.name}
                      </span>
                      <span>NPR {acc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              ))}
              <div style={styles.totalBar}>
                <span>TOTAL ASSETS:</span>
                <span>NPR {bs.totalAssets.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            </div>

            {/* Right: Liabilities & Equity */}
            <div>
              <h4 style={styles.sectionHeader}>LIABILITIES</h4>
              {bs.liabilities.map((grp) => (
                <div key={grp.group} style={styles.groupBlock}>
                  <div style={styles.groupHead}>
                    <strong>{grp.group}</strong>
                    <span>NPR {grp.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {grp.accounts.map((acc) => (
                    <div key={acc.code} style={styles.lineItem}>
                      <span>
                        {acc.code} - {acc.name}
                      </span>
                      <span>NPR {acc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              ))}

              <h4 style={{ ...styles.sectionHeader, marginTop: '20px' }}>EQUITY & CAPITAL</h4>
              {bs.equity.map((grp) => (
                <div key={grp.group} style={styles.groupBlock}>
                  <div style={styles.groupHead}>
                    <strong>{grp.group}</strong>
                    <span>NPR {grp.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </div>
                  {grp.accounts.map((acc) => (
                    <div key={acc.code} style={styles.lineItem}>
                      <span>
                        {acc.code} - {acc.name}
                      </span>
                      <span>NPR {acc.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              ))}

              <div style={styles.totalBar}>
                <span>TOTAL LIABILITIES & EQUITY:</span>
                <span>
                  NPR {(bs.totalLiabilities + bs.totalEquity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Cash Flow Tab */}
      {activeTab === 'cash_flow' && cf && (
        <div style={styles.sheet}>
          <div style={styles.sheetHeader}>
            <h3>Statement of Cash Flows</h3>
            <span style={{ ...styles.badge, backgroundColor: '#eff6ff', color: '#1e3a8a' }}>
              Net Flow: NPR {cf.netCashFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div style={styles.groupBlock}>
            <div style={styles.groupHead}>
              <strong>I. Operating Cash Activities</strong>
            </div>
            {cf.operatingActivities.map((act, i) => (
              <div key={i} style={styles.lineItem}>
                <span>{act.title}</span>
                <span>NPR {act.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>

          <div style={styles.groupBlock}>
            <div style={styles.groupHead}>
              <strong>II. Investing Activities</strong>
            </div>
            {cf.investingActivities.map((act, i) => (
              <div key={i} style={styles.lineItem}>
                <span>{act.title}</span>
                <span>NPR {act.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>

          <div style={styles.groupBlock}>
            <div style={styles.groupHead}>
              <strong>III. Financing Activities</strong>
            </div>
            {cf.financingActivities.map((act, i) => (
              <div key={i} style={styles.lineItem}>
                <span>{act.title}</span>
                <span>NPR {act.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
              </div>
            ))}
          </div>

          <div style={{ ...styles.totalBar, marginTop: '20px' }}>
            <span>OPENING CASH & BANK EQUIVALENTS:</span>
            <span>NPR {cf.openingCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div style={{ ...styles.totalBar, backgroundColor: '#eff6ff', color: '#1e3a8a' }}>
            <span>CLOSING CASH & BANK EQUIVALENTS:</span>
            <span>NPR {cf.closingCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  printBtn: { padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  tabsBar: { display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' },
  tabBtn: { padding: '8px 14px', borderRadius: '6px', border: 'none', background: 'none', fontSize: '13px', fontWeight: 600, color: '#64748b', cursor: 'pointer' },
  activeTab: { backgroundColor: '#1e3a8a', color: '#ffffff' },
  sheet: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '24px' },
  sheetHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '20px' },
  badge: { fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: '13px' },
  totalRow: { backgroundColor: '#f8fafc', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' },
  pnlSection: { marginBottom: '20px' },
  sectionHeader: { fontSize: '13px', fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', margin: '0 0 10px 0' },
  groupBlock: { backgroundColor: '#f8fafc', borderRadius: '6px', padding: '12px', marginBottom: '8px' },
  groupHead: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' },
  lineItem: { display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#475569', padding: '2px 0' },
  totalBar: { display: 'flex', justifyContent: 'space-between', padding: '12px 16px', backgroundColor: '#f1f5f9', fontWeight: 800, fontSize: '14px', borderRadius: '6px' },
  netProfitBar: { display: 'flex', justifyContent: 'space-between', padding: '16px', fontWeight: 800, fontSize: '16px', borderRadius: '6px', marginTop: '16px' },
};
