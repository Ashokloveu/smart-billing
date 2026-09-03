import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { crmService } from '../services/crmService';
import { SalesTarget } from '../types/crm';
import { formatDecimal } from '../../../utils/decimal';

export const SalesTargetsPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [targets, setTargets] = useState<SalesTarget[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTargets = async () => {
      if (!currentOrg?._id) return;
      setLoading(true);
      try {
        const data = await crmService.getSalesTargets(currentOrg._id);
        setTargets(data);
      } catch (e) {
        console.error('Failed to load sales targets', e);
      } finally {
        setLoading(false);
      }
    };
    fetchTargets();
  }, [currentOrg?._id]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Sales Targets & Quota Performance</h1>
          <p style={styles.subtitle}>
            Monthly and quarterly sales representative targets vs actual invoiced revenue.
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Salesperson</th>
              <th style={styles.th}>Period</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Quota Target (NPR)</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Achieved (NPR)</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Attainment %</th>
              <th style={styles.th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {targets.map((tgt) => {
              const target = parseFloat(tgt.targetAmount?.toString() || '0');
              const achieved = parseFloat(tgt.achievedAmount?.toString() || '0');
              const percent = target > 0 ? ((achieved / target) * 100).toFixed(1) : '0.0';

              return (
                <tr key={tgt._id} style={styles.tr}>
                  <td style={styles.td}>
                    <strong>{tgt.userId?.fullName || 'Sales Rep'}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>{tgt.userId?.email}</div>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.periodBadge}>{tgt.periodName}</span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>
                    NPR {formatDecimal(tgt.targetAmount)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                    NPR {formatDecimal(tgt.achievedAmount)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800 }}>
                    {percent}%
                  </td>
                  <td style={styles.td}>
                    <span style={styles.statusPill}>{tgt.status.toUpperCase()}</span>
                  </td>
                </tr>
              );
            })}
            {targets.length === 0 && !loading && (
              <tr>
                <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                  No sales target quotas defined for current period.
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
  periodBadge: { fontSize: '11px', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1e3a8a', padding: '2px 8px', borderRadius: '4px' },
  statusPill: { fontSize: '10px', fontWeight: 800, backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '4px' },
};
