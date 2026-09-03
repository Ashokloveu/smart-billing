import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useOrgStore } from '../../stores/orgStore';
import { useLangStore } from '../../stores/langStore';

export const Sidebar: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const { lang } = useLangStore();
  const location = useLocation();

  const [salesOpen, setSalesOpen] = useState(true);
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const orgInitial = (currentOrg?.name || 'Smart Billing').charAt(0).toUpperCase();

  return (
    <aside style={styles.sidebar}>
      {/* Top Header: Logo + Brand + Hamburger */}
      <div style={styles.brandBar}>
        <div style={styles.brandLeft}>
          <div style={styles.brandLogoBox}>⚡</div>
          <span style={styles.brandName}>Smart Billing</span>
        </div>
        <button style={styles.hamburgerBtn} title="Toggle Menu">
          ☰
        </button>
      </div>

      {/* Organization / Shop Switcher Pill */}
      <div style={styles.orgPill}>
        <div style={styles.orgAvatar}>{orgInitial}</div>
        <span style={styles.orgName}>{currentOrg?.name || 'Bardibas Smart Tech'}</span>
        <span style={styles.orgChevron}>⇅</span>
      </div>

      {/* Navigation Groups */}
      <nav style={styles.navContainer}>
        {/* GROUP 1: Business */}
        <div style={styles.groupHeader}>{lang === 'np' ? 'व्यवसाय' : 'Business'}</div>

        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}
        >
          <span style={styles.navIcon}>⊞</span>
          <span>{lang === 'np' ? 'ड्यासवेार्ड' : 'Dashboard'}</span>
        </NavLink>

        {/* Parties */}
        <NavLink
          to="/parties"
          style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}
        >
          <span style={styles.navIcon}>👥</span>
          <span>{lang === 'np' ? 'ग्राहक तथा पार्टीहरू' : 'Parties'}</span>
        </NavLink>

        {/* Inventory */}
        <NavLink
          to="/items"
          style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}
        >
          <span style={styles.navIcon}>📋</span>
          <span>{lang === 'np' ? 'सामान तथा सेवाहरू' : 'Inventory'}</span>
        </NavLink>

        {/* Collapsible: Sales ▾ */}
        <div style={styles.collapseGroup}>
          <div
            style={{
              ...styles.navItem,
              ...(location.pathname.startsWith('/sales') || location.pathname === '/pos'
                ? styles.navItemActive
                : {}),
              justifyContent: 'space-between',
            }}
            onClick={() => setSalesOpen(!salesOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={styles.navIcon}>🏷️</span>
              <span>{lang === 'np' ? 'बिक्री' : 'Sales'}</span>
            </div>
            <span style={{ fontSize: '11px' }}>{salesOpen ? '▴' : '▾'}</span>
          </div>

          {salesOpen && (
            <div style={styles.subList}>
              <NavLink
                to="/sales"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                {lang === 'np' ? 'बिक्री बिलहरू' : 'Sales Invoices'}
              </NavLink>
              <NavLink
                to="/pos"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                ⚡ Quick POS
              </NavLink>
              <NavLink
                to="/sales/payment-in"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                {lang === 'np' ? 'भुक्तानी प्राप्ति' : 'Payment In'}
              </NavLink>
              <NavLink
                to="/sales/quotations"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                {lang === 'np' ? 'कोटेशन / इस्टिमेट' : 'Quotations'}
              </NavLink>
              <NavLink
                to="/sales/return"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                {lang === 'np' ? 'बिक्री फिर्ता' : 'Sales Return'}
              </NavLink>
            </div>
          )}
        </div>

        {/* Collapsible: Purchase ▾ */}
        <div style={styles.collapseGroup}>
          <div
            style={{
              ...styles.navItem,
              ...(location.pathname.startsWith('/purchase') ? styles.navItemActive : {}),
              justifyContent: 'space-between',
            }}
            onClick={() => setPurchaseOpen(!purchaseOpen)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={styles.navIcon}>🛍️</span>
              <span>{lang === 'np' ? 'खरिद' : 'Purchase'}</span>
            </div>
            <span style={{ fontSize: '11px' }}>{purchaseOpen ? '▴' : '▾'}</span>
          </div>

          {purchaseOpen && (
            <div style={styles.subList}>
              <NavLink
                to="/purchases"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                {lang === 'np' ? 'खरिद बिलहरू' : 'Purchase'}
              </NavLink>
              <NavLink
                to="/purchases/payment-out"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                {lang === 'np' ? 'भुक्तानी भुक्तान' : 'Payment Out'}
              </NavLink>
              <NavLink
                to="/purchases/return"
                style={({ isActive }) => ({
                  ...styles.subItem,
                  ...(isActive ? styles.subItemActive : {}),
                })}
              >
                {lang === 'np' ? 'खरिद फिर्ता' : 'Purchase Return'}
              </NavLink>
            </div>
          )}
        </div>

        {/* Expense */}
        <NavLink
          to="/accounting/daybook"
          style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}
        >
          <span style={styles.navIcon}>💳</span>
          <span>{lang === 'np' ? 'खर्च' : 'Expense'}</span>
        </NavLink>

        {/* Other Income */}
        <NavLink
          to="/accounting/ledger"
          style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}
        >
          <span style={styles.navIcon}>💵</span>
          <span>{lang === 'np' ? 'अन्य आम्दानी' : 'Other Income'}</span>
        </NavLink>

        {/* Manage Accounts */}
        <NavLink
          to="/manage-accounts"
          style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}
        >
          <span style={styles.navIcon}>🏛️</span>
          <span>{lang === 'np' ? 'खाता व्यवस्थापन' : 'Manage Accounts'}</span>
        </NavLink>

        {/* GROUP 2: Management */}
        <div style={{ ...styles.groupHeader, marginTop: '20px' }}>
          {lang === 'np' ? 'व्यवस्थापन' : 'Management'}
        </div>

        {/* Reports */}
        <NavLink
          to="/reports"
          style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}
        >
          <span style={styles.navIcon}>📊</span>
          <span>{lang === 'np' ? 'प्रतिवेदन तथा रिपोर्टहरू' : 'Reports'}</span>
        </NavLink>

        {/* Manage Staffs */}
        <NavLink
          to="/manage-staffs"
          style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}
        >
          <span style={styles.navIcon}>👥</span>
          <span>{lang === 'np' ? 'कर्मचारी व्यवस्थापन' : 'Manage Staffs'}</span>
        </NavLink>

        {/* Import Data */}
        <NavLink
          to="/import/items"
          style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}
        >
          <span style={styles.navIcon}>📥</span>
          <span>{lang === 'np' ? 'डाटा आयात' : 'Import Data'}</span>
        </NavLink>

        {/* Business Tools: Business Cards & Barcode */}
        <NavLink
          to="/tools/business-cards"
          style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}
        >
          <span style={styles.navIcon}>🛠️</span>
          <span>{lang === 'np' ? 'बिजनेस कार्ड तथा बारकोड' : 'Business Tools'}</span>
        </NavLink>

        {/* Online Store */}
        <NavLink
          to="/online-store"
          style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}
        >
          <span style={styles.navIcon}>🌐</span>
          <span>{lang === 'np' ? 'अनलाइन पसल' : 'Digital Store'}</span>
        </NavLink>

        {/* GROUP 3: Others */}
        <div style={{ ...styles.groupHeader, marginTop: '20px' }}>
          {lang === 'np' ? 'अन्य' : 'Others'}
        </div>

        {/* Help & Support */}
        <a
          href="https://wa.me/9779800000000"
          target="_blank"
          rel="noreferrer"
          style={styles.navItem}
        >
          <span style={styles.navIcon}>🎧</span>
          <span>{lang === 'np' ? 'सहायता तथा मद्दत' : 'Help & Support'}</span>
        </a>

        {/* Settings */}
        <NavLink
          to="/settings"
          style={({ isActive }) => ({
            ...styles.navItem,
            ...(isActive ? styles.navItemActive : {}),
          })}
        >
          <span style={styles.navIcon}>⚙️</span>
          <span>{lang === 'np' ? 'सेटिङ्स' : 'Settings'}</span>
        </NavLink>
      </nav>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '240px',
    backgroundColor: '#ffffff',
    borderRight: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    boxSizing: 'border-box',
    userSelect: 'none',
  },
  brandBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 18px',
    borderBottom: '1px solid #f1f5f9',
  },
  brandLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  brandLogoBox: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 800,
  },
  brandName: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  hamburgerBtn: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    color: '#64748b',
    cursor: 'pointer',
  },
  orgPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    margin: '14px 14px 8px 14px',
    padding: '8px 12px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
  },
  orgAvatar: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgName: {
    flex: 1,
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  orgChevron: {
    fontSize: '12px',
    color: '#94a3b8',
  },
  navContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 14px 24px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  groupHeader: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#94a3b8',
    padding: '8px 12px 4px 12px',
    letterSpacing: '0.04em',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '8px',
    color: '#334155',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  navItemActive: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontWeight: 700,
  },
  navIcon: {
    fontSize: '15px',
    width: '20px',
    display: 'flex',
    alignItems: 'center',
  },
  collapseGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  subList: {
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '32px',
    marginTop: '2px',
    marginBottom: '4px',
    gap: '2px',
  },
  subItem: {
    padding: '6px 10px',
    borderRadius: '6px',
    color: '#64748b',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: 500,
    transition: 'all 0.1s ease',
  },
  subItemActive: {
    color: '#10b981',
    fontWeight: 700,
  },
};
