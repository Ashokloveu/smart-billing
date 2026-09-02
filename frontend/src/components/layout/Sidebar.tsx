import React from 'react';
import { NavLink } from 'react-router-dom';

export const Sidebar: React.FC = () => {
  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <span style={styles.logoIcon}>⚡</span>
        <span style={styles.logoText}>Smart Billing</span>
      </div>

      <nav style={styles.nav}>
        <div style={styles.sectionLabel}>OPERATIONS</div>
        <NavLink
          to="/dashboard"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          📊 Dashboard
        </NavLink>
        <NavLink
          to="/sales"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          🛒 Sales & Invoicing
        </NavLink>
        <NavLink
          to="/purchases"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          📦 Purchases & Bills
        </NavLink>

        <div style={styles.sectionLabel}>CATALOG & INVENTORY</div>
        <NavLink
          to="/parties"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          👥 Parties (Customers)
        </NavLink>
        <NavLink
          to="/items"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          🏷️ Items & Services
        </NavLink>
        <NavLink
          to="/inventory"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          🏬 Warehouses & Stock
        </NavLink>

        <div style={styles.sectionLabel}>FINANCE & BOOKS</div>
        <NavLink
          to="/accounting"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          📑 General Journal
        </NavLink>
        <NavLink
          to="/reports"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          📈 VAT & P&L Reports
        </NavLink>

        <div style={styles.sectionLabel}>ADMINISTRATION</div>
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          ⚙️ Organization & Settings
        </NavLink>
      </nav>

      <div style={styles.footer}>
        <div style={styles.badge}>Nepal IRD Ready</div>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '240px',
    backgroundColor: '#0f172a',
    color: '#94a3b8',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
  },
  brand: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    borderBottom: '1px solid #1e293b',
  },
  logoIcon: {
    fontSize: '20px',
  },
  logoText: {
    color: '#ffffff',
    fontWeight: 700,
    fontSize: '17px',
    letterSpacing: '-0.025em',
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    overflowY: 'auto',
  },
  sectionLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#475569',
    letterSpacing: '0.08em',
    padding: '12px 12px 6px 12px',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    padding: '9px 12px',
    borderRadius: '6px',
    color: '#94a3b8',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'background-color 0.15s, color 0.15s',
  },
  activeLink: {
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid #1e293b',
  },
  badge: {
    fontSize: '11px',
    textAlign: 'center',
    backgroundColor: '#1e293b',
    color: '#38bdf8',
    padding: '6px',
    borderRadius: '4px',
  },
};
