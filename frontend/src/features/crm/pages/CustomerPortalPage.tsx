import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { crmService } from '../services/crmService';
import { Quotation } from '../types/crm';
import { formatDecimal } from '../../../utils/decimal';

export const CustomerPortalPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPortalData = async () => {
      if (!currentOrg?._id) return;
      setLoading(true);
      try {
        const data = await crmService.getQuotations(currentOrg._id);
        setQuotations(data);
      } catch (e) {
        console.error('Failed to load portal data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPortalData();
  }, [currentOrg?._id]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🌐 Customer Self-Service Portal</h1>
          <p style={styles.subtitle}>
            Client access to active proposals, tax invoice downloads, and statement balance.
          </p>
        </div>
        <div style={styles.clientBadge}>
          <span>Client Account: <strong>Apex Himalayan Corp</strong></span>
        </div>
      </div>

      <div style={styles.card}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 16px 0' }}>📜 Proposals & Quotations For Your Review</h3>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Estimate #</th>
              <th style={styles.th}>Issue Date</th>
              <th style={styles.th}>Valid Until</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Total Amount</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((quo) => (
              <tr key={quo._id} style={styles.tr}>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                  {quo.quotationNumber}
                </td>
                <td style={styles.td}>{new Date(quo.quotationDate).toLocaleDateString()}</td>
                <td style={styles.td}>{new Date(quo.validUntil).toLocaleDateString()}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>
                  NPR {formatDecimal(quo.grandTotal)}
                </td>
                <td style={styles.td}>
                  <span style={styles.statusPill}>{quo.status.toUpperCase()}</span>
                </td>
                <td style={styles.td}>
                  <button
                    style={styles.acceptBtn}
                    onClick={() => alert(`Quotation ${quo.quotationNumber} accepted!`)}
                  >
                    ✓ Accept Proposal
                  </button>
                </td>
              </tr>
            ))}
            {quotations.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                  No proposals awaiting review.
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
  clientBadge: { backgroundColor: '#eff6ff', color: '#1e3a8a', padding: '8px 14px', borderRadius: '6px', fontSize: '12px' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: '13px' },
  statusPill: { fontSize: '10px', fontWeight: 800, backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '4px' },
  acceptBtn: { padding: '4px 10px', borderRadius: '4px', backgroundColor: '#059669', color: '#ffffff', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' },
};
