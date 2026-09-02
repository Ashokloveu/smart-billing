import React from 'react';
import { useAuthStore } from '../../stores/authStore';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Welcome back, {user?.fullName || 'User'}!</h1>
        <p style={styles.subtitle}>
          Here is your executive business summary for Shrawan 2082 (NPR).
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Today's Invoiced Sales</span>
          <span style={styles.kpiValue}>NPR 1,48,500.00</span>
          <span style={styles.badgeSuccess}>+14.2% vs yesterday</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Accounts Receivable</span>
          <span style={styles.kpiValue}>NPR 12,40,000.00</span>
          <span style={styles.badgeWarning}>48 Overdue Invoices</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Accounts Payable</span>
          <span style={styles.kpiValue}>NPR 8,20,000.00</span>
          <span style={styles.badgeMuted}>12 Bills due this week</span>
        </div>

        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Net Cash & Bank</span>
          <span style={styles.kpiValue}>NPR 31,55,400.00</span>
          <span style={styles.badgeInfo}>NIC Asia: NPR 28.4L</span>
        </div>
      </div>

      {/* Operational Overview Section */}
      <div style={styles.infoCard}>
        <h2 style={styles.cardTitle}>System Status & Nepal Compliance</h2>
        <div style={styles.statusRow}>
          <div>
            <strong>Jurisdiction:</strong> Nepal Inland Revenue Department (IRD)
          </div>
          <div>
            <strong>VAT Mode:</strong> 13% Standard Output/Input Tax Credit
          </div>
          <div>
            <strong>Calendar:</strong> Dual (Bikram Sambat 2082/83 & Gregorian 2026)
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '24px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  badgeSuccess: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#059669',
    backgroundColor: '#ecfdf5',
    padding: '3px 8px',
    borderRadius: '4px',
    alignSelf: 'flex-start',
  },
  badgeWarning: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#d97706',
    backgroundColor: '#fffbeb',
    padding: '3px 8px',
    borderRadius: '4px',
    alignSelf: 'flex-start',
  },
  badgeMuted: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '3px 8px',
    borderRadius: '4px',
    alignSelf: 'flex-start',
  },
  badgeInfo: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#0284c7',
    backgroundColor: '#f0f9ff',
    padding: '3px 8px',
    borderRadius: '4px',
    alignSelf: 'flex-start',
  },
  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '20px',
  },
  cardTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '14px',
  },
  statusRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
    fontSize: '13px',
    color: '#334155',
  },
};
