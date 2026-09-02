import React, { useState } from 'react';
import { Account } from '../types/accounting';

interface OpeningBalanceModalProps {
  accounts: Account[];
  onClose: () => void;
  onSave: (entries: Array<{ accountId: string; openingBalance: string; type: any }>) => Promise<void>;
}

export const OpeningBalanceModal: React.FC<OpeningBalanceModalProps> = ({ accounts, onClose, onSave }) => {
  const [balances, setBalances] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    accounts.forEach((a) => {
      initial[a._id] = a.openingBalance ? a.openingBalance.toString() : '0.00';
    });
    return initial;
  });

  const handleChange = (id: string, val: string) => {
    setBalances((prev) => ({ ...prev, [id]: val }));
  };

  const handleSave = async () => {
    const entries = Object.entries(balances).map(([accountId, bal]) => {
      const acc = accounts.find((a) => a._id === accountId);
      return {
        accountId,
        openingBalance: bal || '0.00',
        type: acc?.type || 'asset',
      };
    });

    await onSave(entries);
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Opening Balance Management</h2>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
              Set initial balances for accounts, debtors, creditors, cash, and bank accounts.
            </p>
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <div style={styles.tableWrapper}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Account Title</th>
                <th style={styles.th}>Type</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Opening Balance (NPR)</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((acc) => (
                <tr key={acc._id} style={styles.tr}>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700 }}>{acc.code}</td>
                  <td style={{ ...styles.td, fontWeight: 600 }}>{acc.name}</td>
                  <td style={styles.td}>
                    <span style={styles.typeBadge}>{acc.type.toUpperCase()}</span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={balances[acc._id] || '0.00'}
                      onChange={(e) => handleChange(acc._id, e.target.value)}
                      style={styles.balInput}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.btnSecondary}>
            Cancel
          </button>
          <button onClick={handleSave} style={styles.btnPrimary}>
            💾 Save All Opening Balances
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { backgroundColor: '#ffffff', borderRadius: '10px', maxWidth: '750px', width: '100%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  closeBtn: { border: 'none', background: 'none', fontSize: '16px', color: '#64748b', cursor: 'pointer' },
  tableWrapper: { flex: 1, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '6px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '8px 14px', fontSize: '13px' },
  typeBadge: { fontSize: '10px', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1e3a8a', padding: '2px 6px', borderRadius: '4px' },
  balInput: { width: '140px', padding: '6px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', textAlign: 'right', fontWeight: 700 },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' },
  btnPrimary: { backgroundColor: '#1e3a8a', color: '#ffffff', padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' },
  btnSecondary: { backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', border: '1px solid #cbd5e1', cursor: 'pointer' },
};
