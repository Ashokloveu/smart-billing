import React, { useEffect, useState } from 'react';
import { Account, AccountLedgerResponse } from '../types/accounting';
import { accountingService } from '../services/accountingService';
import { useOrgStore } from '../../../stores/orgStore';

interface AccountLedgerViewProps {
  accounts: Account[];
  initialAccountId?: string;
}

export const AccountLedgerView: React.FC<AccountLedgerViewProps> = ({ accounts, initialAccountId }) => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [selectedAccountId, setSelectedAccountId] = useState(initialAccountId || (accounts[0]?._id || ''));
  const [ledgerData, setLedgerData] = useState<AccountLedgerResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchLedger = async () => {
    if (!currentOrg?._id || !selectedAccountId) return;
    setLoading(true);
    try {
      const res = await accountingService.getAccountLedger(currentOrg._id, selectedAccountId);
      setLedgerData(res);
    } catch (e) {
      console.error('Failed to load ledger', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [selectedAccountId, currentOrg?._id]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>📖 General Ledger & Account Statement</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Detailed debit/credit audit trail with running balances.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            style={styles.select}
          >
            {accounts.map((a) => (
              <option key={a._id} value={a._id}>
                {a.code} - {a.name} ({a.group})
              </option>
            ))}
          </select>
          <button style={styles.printBtn} onClick={() => window.print()}>
            🖨️ Print Statement
          </button>
        </div>
      </div>

      {/* Balance Summary Header */}
      {ledgerData && (
        <div style={styles.summaryBar}>
          <div>
            <span style={styles.sumLabel}>Opening Balance:</span>
            <strong style={styles.sumVal}>NPR {ledgerData.openingBalance.toLocaleString()}</strong>
          </div>
          <div>
            <span style={styles.sumLabel}>Account Classification:</span>
            <strong style={styles.sumVal}>{ledgerData.account.group}</strong>
          </div>
          <div>
            <span style={styles.sumLabel}>Closing Ledger Balance:</span>
            <strong style={{ ...styles.sumVal, color: '#1e3a8a', fontSize: '15px' }}>
              NPR {ledgerData.closingBalance.toLocaleString()}
            </strong>
          </div>
        </div>
      )}

      {/* Ledger Table */}
      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Date (BS)</th>
              <th style={styles.th}>Voucher #</th>
              <th style={styles.th}>Source Document</th>
              <th style={styles.th}>Particulars / Narration</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Debit (NPR)</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Credit (NPR)</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {ledgerData?.items.map((item, idx) => (
              <tr key={idx} style={styles.tr}>
                <td style={styles.td}>
                  <strong>{item.bsDate}</strong>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {new Date(item.date).toLocaleDateString()}
                  </div>
                </td>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                  {item.entryNumber}
                </td>
                <td style={{ ...styles.td, fontSize: '12px' }}>
                  {item.sourceDocumentNumber ? (
                    <span style={styles.docBadge}>{item.sourceDocumentNumber}</span>
                  ) : (
                    '-'
                  )}
                </td>
                <td style={styles.td}>{item.narration}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                  {item.debit > 0 ? item.debit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                </td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                  {item.credit > 0 ? item.credit.toLocaleString(undefined, { minimumFractionDigits: 2 }) : '-'}
                </td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, color: item.runningBalance >= 0 ? '#0f172a' : '#dc2626' }}>
                  NPR {item.runningBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
            {(!ledgerData || ledgerData.items.length === 0) && !loading && (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                  No accounting entries posted to this ledger yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  select: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', minWidth: '280px', fontWeight: 600 },
  printBtn: { padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  summaryBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px 20px' },
  sumLabel: { fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginRight: '8px' },
  sumVal: { fontSize: '13px', color: '#0f172a' },
  tableWrapper: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: '13px' },
  docBadge: { backgroundColor: '#eff6ff', color: '#1e3a8a', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700 },
};
