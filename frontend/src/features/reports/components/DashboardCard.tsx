import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  subText?: string;
  badgeText?: string;
  badgeType?: 'success' | 'warning' | 'info' | 'danger';
  icon?: string;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subText,
  badgeText,
  badgeType = 'info',
  icon,
}) => {
  const getBadgeStyle = () => {
    switch (badgeType) {
      case 'success':
        return { backgroundColor: '#ecfdf5', color: '#059669' };
      case 'warning':
        return { backgroundColor: '#fffbeb', color: '#d97706' };
      case 'danger':
        return { backgroundColor: '#fef2f2', color: '#dc2626' };
      default:
        return { backgroundColor: '#eff6ff', color: '#1e3a8a' };
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.headerRow}>
        <span style={styles.title}>{title}</span>
        {icon && <span style={styles.icon}>{icon}</span>}
      </div>
      <div style={styles.value}>{value}</div>
      <div style={styles.footerRow}>
        {badgeText && <span style={{ ...styles.badge, ...getBadgeStyle() }}>{badgeText}</span>}
        {subText && <span style={styles.subText}>{subText}</span>}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  title: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  icon: {
    fontSize: '16px',
  },
  value: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
    marginBottom: '8px',
  },
  footerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  badge: {
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
  },
  subText: {
    fontSize: '12px',
    color: '#94a3b8',
  },
};
