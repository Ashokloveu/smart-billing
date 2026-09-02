import React, { useEffect, useState } from 'react';
import { DayBookItem } from '../types/accounting';
import { accountingService } from '../services/accountingService';
import { useOrgStore } from '../../../stores/orgStore';

export const DayBookView: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<DayBookItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDayBook = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const res = await accountingService.getDayBook(currentOrg._id, date);
      setItems(res);
    } catch (e) {
      console.error('Failed to load day book', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayBook();
  }, [date, currentOrg?._id]);

  const totalDaily = items.reduce((acc, curr) => acc + curr.totalAmount, 0);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>📅 Daily Accounting Day Book</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Daily journal of financial vouchers and transactions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.dateInput} />
          <button style={styles.refreshBtn} onClick={fetchDayBook}>
            🔄 Refresh
          </button>
        </div>
      </div>

      <div style={styles.summaryBar}>
        <span>Total Daily Turnout: </span>
        <strong style={{ fontSize: '16px', color: '#1e3a8a' }}>
          NPR {totalDaily.toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </strong>
        <span style={{ fontSize: '12px', color: '#64748b' }}>({items.length} vouchers recorded)</span>
      </div>

      <div style={styles.list}>
        {items.map((item, idx) => (
          <div key={idx} style={styles.voucherCard}>
            <div style={styles.voucherHeader}>
              <div>
                <span style={styles.voucherNum}>{item.entryNumber}</span>
                <span style={styles.timeLabel}>{item.time}</span>
                {item.sourceDocumentNumber && (
                  <span style={styles.refPill}>Ref: {item.sourceDocumentNumber}</span>
                )}
              </div>
              <span style={styles.statusPill}>{item.status.toUpperCase()}</span>
            </div>

            <p style={styles.narration}>{item.narration}</p>

            <div style={styles.linesTable}>
              {item.lines.map((l, lIdx) => (
                <div key={lIdx} style={styles.lineItem}>
                  <div style={{ flex: 1 }}>
                    <span style={styles.code}>{l.accountCode}</span> - <strong>{l.accountName}</strong>
                  </div>
                  <div style={{ width: '120px', textAlign: 'right', fontWeight: 600 }}>
                    {l.debit > 0 ? `Dr. NPR ${l.debit.toFixed(2)}` : ''}
                  </div>
                  <div style={{ width: '120px', textAlign: 'right', fontWeight: 600 }}>
                    {l.credit > 0 ? `Cr. NPR ${l.credit.toFixed(2)}` : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {items.length === 0 && !loading && (
          <div style={styles.empty}>No accounting vouchers posted on {date}.</div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  dateInput: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  refreshBtn: { padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  summaryBar: { backgroundColor: '#ffffff', padding: '12px 18px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' },
  list: { display: 'flex', flexDirection: 'column', gap: '12px' },
  voucherCard: { backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' },
  voucherHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  voucherNum: { fontFamily: 'monospace', fontWeight: 800, color: '#1e3a8a', fontSize: '14px', marginRight: '10px' },
  timeLabel: { fontSize: '11px', color: '#94a3b8', marginRight: '10px' },
  refPill: { fontSize: '10px', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px' },
  statusPill: { fontSize: '10px', fontWeight: 800, backgroundColor: '#ecfdf5', color: '#059669', padding: '2px 8px', borderRadius: '4px' },
  narration: { fontSize: '13px', color: '#334155', margin: '0 0 10px 0' },
  linesTable: { borderTop: '1px solid #f1f5f9', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' },
  lineItem: { display: 'flex', fontSize: '12px', color: '#1e293b' },
  code: { fontFamily: 'monospace', color: '#64748b' },
  empty: { padding: '40px', textAlign: 'center', color: '#94a3b8', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px' },
};
