import React from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <div style={styles.firmBadge}>
          <span style={styles.branchDot}></span>
          <span>Kathmandu Main Branch</span>
        </div>
        <span style={styles.calendarPill}>BS 2082/83</span>
      </div>

      <div style={styles.right}>
        <div style={styles.userInfo}>
          <span style={styles.userName}>{user?.fullName || 'Operator'}</span>
          <span style={styles.userRole}>Administrator</span>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
          Sign Out
        </button>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: '60px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  firmBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    padding: '6px 12px',
    borderRadius: '6px',
  },
  branchDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },
  calendarPill: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#1e3a8a',
    backgroundColor: '#eff6ff',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  userName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
  },
  userRole: {
    fontSize: '11px',
    color: '#64748b',
  },
  logoutBtn: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #fee2e2',
  },
};
