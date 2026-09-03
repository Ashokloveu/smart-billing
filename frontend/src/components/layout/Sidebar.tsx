import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLangStore } from '../../stores/langStore';

export const Sidebar: React.FC = () => {
  const { lang, t } = useLangStore();

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <span style={styles.logoIcon}>⚡</span>
        <span style={styles.logoText}>Smart Billing</span>
      </div>

      <nav style={styles.nav}>
        <div style={styles.sectionLabel}>{lang === 'np' ? 'सञ्चालन' : 'OPERATIONS'}</div>
        <NavLink
          to="/dashboard"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          📊 {t('dashboard')}
        </NavLink>
        <NavLink
          to="/online-store"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          🌐 {t('onlineStore')}
        </NavLink>
        <NavLink
          to="/sales"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          🛒 {t('salesInvoicing')}
        </NavLink>
        <NavLink
          to="/sales-orders"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          📑 Sales Orders & O2C
        </NavLink>
        <NavLink
          to="/crm/leads"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          🎯 Leads & Inbound
        </NavLink>
        <NavLink
          to="/crm/opportunities"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          💼 Opportunity Pipeline
        </NavLink>
        <NavLink
          to="/crm/quotations"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          📜 Proposals & Quotes
        </NavLink>
        <NavLink
          to="/crm/customer-360"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          👥 Customer 360°
        </NavLink>
        <NavLink
          to="/crm/targets"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          🎯 Sales Quotas
        </NavLink>
        <NavLink
          to="/portal"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          🌐 Customer Portal
        </NavLink>
        <NavLink
          to="/pos"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          ⚡ {t('posTerminal')}
        </NavLink>
        <NavLink
          to="/purchases"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          📦 {t('purchases')}
        </NavLink>
        <NavLink
          to="/procurement"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          📋 Procurement (PO & GRN)
        </NavLink>

        <div style={styles.sectionLabel}>{lang === 'np' ? 'वस्तु तथा मौज्दात' : 'CATALOG & INVENTORY'}</div>
        <NavLink
          to="/parties"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          👥 {t('parties')}
        </NavLink>
        <NavLink
          to="/items"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          🏷️ {t('items')}
        </NavLink>
        <NavLink
          to="/inventory"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          🏬 {t('warehouses')}
        </NavLink>
        <NavLink
          to="/operations"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          🚚 Transfers & Batches
        </NavLink>

        <div style={styles.sectionLabel}>{lang === 'np' ? 'लेखा तथा कर खाता' : 'FINANCE & BOOKS'}</div>
        <NavLink
          to="/accounting"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          📑 {t('accounting')}
        </NavLink>
        <NavLink
          to="/compliance"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          🇳🇵 {t('compliance')}
        </NavLink>
        <NavLink
          to="/reports"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          📈 {t('reports')}
        </NavLink>

        <div style={styles.sectionLabel}>{lang === 'np' ? 'मानव संशाधन' : 'HUMAN RESOURCES & PAYROLL'}</div>
        <NavLink
          to="/hr/employees"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
         >
          👥 Employee Directory
        </NavLink>
        <NavLink
          to="/hr/attendance"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
         >
          ⏱️ Attendance & Leaves
        </NavLink>
        <NavLink
          to="/payroll"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
         >
          💰 Nepal Payroll & SSF
        </NavLink>

        <div style={styles.sectionLabel}>ENTERPRISE BI & AUDIT</div>
        <NavLink
          to="/bi-analytics"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
         >
          📊 Executive BI Analytics
        </NavLink>

        <div style={styles.sectionLabel}>{lang === 'np' ? 'प्रशासन' : 'ADMINISTRATION'}</div>
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            ...styles.link,
            ...(isActive ? styles.activeLink : {}),
          })}
        >
          ⚙️ {t('settings')}
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
