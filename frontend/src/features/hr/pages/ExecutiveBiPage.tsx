import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { hrService } from '../services/hrService';
import { WorkforceBi } from '../types/hr';

export const ExecutiveBiPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [biData, setBiData] = useState<WorkforceBi | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBi = async () => {
      if (!currentOrg?._id) return;
      setLoading(true);
      try {
        const data = await hrService.getWorkforceBi(currentOrg._id);
        setBiData(data);
      } catch (e) {
        console.error('Failed to load BI data', e);
      } finally {
        setLoading(false);
      }
    };
    fetchBi();
  }, [currentOrg?._id]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Executive Business Intelligence & Workforce Analytics</h1>
          <p style={styles.subtitle}>
            High-level operational performance, payroll cost velocity, headcount distribution, and attendance punctuality.
          </p>
        </div>
      </div>

      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>TOTAL WORKFORCE</span>
          <span style={styles.kpiValue}>{biData?.totalEmployees || 0}</span>
          <span style={styles.kpiSub}>Active Headcount: {biData?.activeEmployees || 0}</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>PUNCTUALITY RATING</span>
          <span style={{ ...styles.kpiValue, color: '#059669' }}>{biData?.attendanceRate || '96.8%'}</span>
          <span style={styles.kpiSub}>Late arrivals tracked</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>ANNUAL TURNOVER RATE</span>
          <span style={{ ...styles.kpiValue, color: '#1e3a8a' }}>{biData?.turnoverRate || '2.4%'}</span>
          <span style={styles.kpiSub}>Attrition benchmark low</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>ON LEAVE TODAY</span>
          <span style={styles.kpiValue}>{biData?.onLeaveEmployees || 0}</span>
          <span style={styles.kpiSub}>Approved leaves</span>
        </div>
      </div>

      <div style={styles.grid2}>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🏢 Headcount by Department</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px' }}>
            {biData?.departmentStats.map((dep) => (
              <div key={dep._id} style={styles.depRow}>
                <span style={{ fontWeight: 600 }}>{dep._id}</span>
                <span style={styles.countBadge}>{dep.count} Staff</span>
              </div>
            ))}
            {(!biData?.departmentStats || biData.departmentStats.length === 0) && !loading && (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No department data</div>
            )}
          </div>
        </div>

        <div style={styles.card}>
          <h3 style={styles.cardTitle}>💰 Monthly Payroll Expenditure Trends</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            {biData?.payrollTrend.map((pt, i) => (
              <div key={i} style={styles.trendRow}>
                <div>
                  <strong>{pt.month}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>SSF: NPR {pt.ssf.toLocaleString()} • TDS: NPR {pt.tds.toLocaleString()}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800, color: '#059669' }}>NPR {pt.net.toLocaleString()} Net</div>
                  <div style={{ fontSize: '11px', color: '#94a3b8' }}>Gross: NPR {pt.gross.toLocaleString()}</div>
                </div>
              </div>
            ))}
            {(!biData?.payrollTrend || biData.payrollTrend.length === 0) && !loading && (
              <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No payroll runs posted yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  kpiCard: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' },
  kpiLabel: { fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' },
  kpiValue: { fontSize: '24px', fontWeight: 800, color: '#0f172a' },
  kpiSub: { fontSize: '11px', color: '#94a3b8' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '8px' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' },
  cardTitle: { fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 },
  depRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', backgroundColor: '#f8fafc', borderRadius: '6px' },
  countBadge: { fontSize: '12px', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1e3a8a', padding: '2px 8px', borderRadius: '4px' },
  trendRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderBottom: '1px solid #f1f5f9' },
};
