import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { hrService } from '../services/hrService';
import { PayrollRun } from '../types/hr';
import { formatDecimal } from '../../../utils/decimal';

export const PayrollProcessingPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPayroll = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const data = await hrService.getPayrollRuns(currentOrg._id);
      setRuns(data);
    } catch (e) {
      console.error('Failed to load payroll batches', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayroll();
  }, [currentOrg?._id]);

  const handlePostPayroll = async (id: string) => {
    if (!currentOrg?._id) return;
    if (!window.confirm('Post this payroll batch to the General Ledger? This will lock attendance and create balanced accounting entries.')) {
      return;
    }
    await hrService.postPayroll(currentOrg._id, id);
    alert('Payroll posted successfully to GL!');
    fetchPayroll();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Nepal Statutory Payroll Processing (TDS & SSF)</h1>
          <p style={styles.subtitle}>
            Social Security Fund (31%), Nepal Progressive TDS, Salary Sheets, and GL Posting.
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Payroll #</th>
              <th style={styles.th}>Month (BS)</th>
              <th style={styles.th}>Fiscal Year</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Total Gross (NPR)</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>SSF (31%)</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>TDS (Tax)</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Net Payable (NPR)</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((pr) => {
              const totalSsf =
                parseFloat(pr.totalEmployerSsf?.toString() || '0') +
                parseFloat(pr.totalEmployeeSsf?.toString() || '0');
              return (
                <tr key={pr._id} style={styles.tr}>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                    {pr.payrollNumber}
                  </td>
                  <td style={styles.td}>
                    <strong>{pr.month}</strong>
                  </td>
                  <td style={styles.td}>{pr.fiscalYear}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>
                    NPR {formatDecimal(pr.totalGross)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', color: '#1e3a8a' }}>
                    NPR {totalSsf.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', color: '#b45309' }}>
                    NPR {formatDecimal(pr.totalTaxTds)}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                    NPR {formatDecimal(pr.totalNetSalary)}
                  </td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusPill,
                        backgroundColor: pr.status === 'posted' ? '#ecfdf5' : '#f8fafc',
                        color: pr.status === 'posted' ? '#059669' : '#334155',
                      }}
                    >
                      {pr.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={styles.td}>
                    {pr.status === 'draft' && (
                      <button
                        style={{ ...styles.actionBtn, backgroundColor: '#1e3a8a', color: '#ffffff' }}
                        onClick={() => handlePostPayroll(pr._id)}
                      >
                        ⚡ Post to GL
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {runs.length === 0 && !loading && (
              <tr>
                <td colSpan={9} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                  No payroll batches processed yet.
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
