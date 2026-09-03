import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { crmService } from '../services/crmService';
import { Quotation } from '../types/crm';
import { formatDecimal } from '../../../utils/decimal';

export const QuotationListPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuotations = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const data = await crmService.getQuotations(currentOrg._id);
      setQuotations(data);
    } catch (e) {
      console.error('Failed to load quotations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotations();
  }, [currentOrg?._id]);

  const handleConvertToOrder = async (id: string) => {
    if (!currentOrg?._id) return;
    if (!window.confirm('Convert this approved quotation into a confirmed Sales Order?')) return;
    await crmService.convertToSalesOrder(currentOrg._id, id);
    alert('Quotation converted to Sales Order successfully!');
    fetchQuotations();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Customer Quotations & Estimates</h1>
          <p style={styles.subtitle}>
            Proposal versioning, line item pricing, customer acceptance, and one-click Sales Order conversion.
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Quotation #</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Valid Until</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Total (NPR)</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((quo) => (
              <tr key={quo._id} style={styles.tr}>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                  {quo.quotationNumber} (v{quo.version})
                </td>
                <td style={styles.td}>
                  <strong>{quo.customerName}</strong>
                  {quo.customerPan && <div style={{ fontSize: '11px', color: '#64748b' }}>PAN: {quo.customerPan}</div>}
                </td>
                <td style={styles.td}>{new Date(quo.quotationDate).toLocaleDateString()}</td>
                <td style={styles.td}>{new Date(quo.validUntil).toLocaleDateString()}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>
                  NPR {formatDecimal(quo.grandTotal)}
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusPill,
                      backgroundColor:
                        quo.status === 'converted'
                          ? '#ecfdf5'
                          : quo.status === 'approved'
                          ? '#eff6ff'
                          : '#f8fafc',
                      color:
                        quo.status === 'converted'
                          ? '#059669'
                          : quo.status === 'approved'
                          ? '#1e3a8a'
                          : '#334155',
                    }}
                  >
                    {quo.status.toUpperCase()}
                  </span>
                </td>
                <td style={styles.td}>
                  {quo.status !== 'converted' && (
                    <button
                      style={{ ...styles.actionBtn, backgroundColor: '#1e3a8a', color: '#ffffff' }}
                      onClick={() => handleConvertToOrder(quo._id)}
                    >
                      ⚡ Convert to Order
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {quotations.length === 0 && !loading && (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                  No customer quotations recorded.
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
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: '13px' },
  statusPill: { fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' },
  actionBtn: { padding: '4px 8px', borderRadius: '4px', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' },
};
