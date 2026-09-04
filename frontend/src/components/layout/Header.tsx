import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { NotificationDropdown } from '../../features/operations/components/NotificationDropdown';
import { OrganizationModal } from './OrganizationModal';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { apiClient } from '../../services/apiClient';
import { useLangStore } from '../../stores/langStore';
import { useOrgStore } from '../../stores/orgStore';
import { Organization } from '../../types/master';

export const Header: React.FC = () => {
  const { user, refreshToken, logout } = useAuthStore();
  const { currentOrg, setCurrentOrg, setOrganizations } = useOrgStore();
  const { lang, toggleLang, t } = useLangStore();
  const navigate = useNavigate();

  const [organizations, setLocalOrganizations] = useState<Organization[]>([]);
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global Ctrl+K / Cmd+K hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    // Fetch user organizations on mount
    const fetchOrgs = async () => {
      try {
        const res = await apiClient.get('/organizations');
        const orgList: Organization[] = res.data?.data || [];
        setLocalOrganizations(orgList);
        setOrganizations(orgList);
        if (orgList.length > 0) {
          const stillAvailable = orgList.find((org) => org._id === currentOrg?._id);
          setCurrentOrg(stillAvailable || orgList[0]);
        }
      } catch (err) {
        setLocalOrganizations([]);
        setOrganizations([]);
      }
    };
    fetchOrgs();
  }, []);

  const handleLogout = async () => {
    if (refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken }).catch(() => undefined);
    }
    logout();
    navigate('/login');
  };

  const handleOrgCreated = (newOrg: Organization) => {
    const updated = [...organizations, newOrg];
    setLocalOrganizations(updated);
    setOrganizations(updated);
    setCurrentOrg(newOrg);
  };

  return (
    <>
      <header style={styles.header}>
        <div style={styles.left}>
          {/* Organization & Shop Switcher Dropdown */}
          <div style={styles.orgSwitcherWrapper}>
            <div
              style={styles.firmBadge}
              onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
              title="Click to switch Shop or Company"
            >
              <span style={styles.branchDot}></span>
              <span style={styles.orgNameText}>{currentOrg?.name || 'Create a business'}</span>
              <span style={styles.chevron}>▾</span>
            </div>

            {isOrgDropdownOpen && (
              <div style={styles.orgDropdown}>
                <div style={styles.dropdownHeader}>{t('switchBusiness')}</div>
                <div style={styles.orgList}>
                  {organizations.map((org) => (
                    <div
                      key={org._id}
                      style={{
                        ...styles.orgItem,
                        ...(currentOrg?._id === org._id ? styles.orgItemActive : {}),
                      }}
                      onClick={() => {
                        setCurrentOrg(org);
                        setIsOrgDropdownOpen(false);
                      }}
                    >
                      <div style={styles.orgItemName}>🏢 {org.name}</div>
                      <div style={styles.orgItemCode}>{org.slug || 'Main business'}</div>
                    </div>
                  ))}
                </div>
                <div style={styles.dropdownFooter}>
                  <button
                    style={styles.addOrgBtn}
                    onClick={() => {
                      setIsOrgDropdownOpen(false);
                      setIsOrgModalOpen(true);
                    }}
                  >
                    {t('newBusiness')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <span style={styles.planBadge}>⚡ Enterprise SaaS</span>
          <span style={styles.calendarPill}>BS 2081/82 (2026 AD)</span>
        </div>

        {/* Global Spotlight Search Trigger */}
        <div style={styles.searchBarTrigger} onClick={() => setIsSearchOpen(true)}>
          <span style={styles.searchIcon}>🔍</span>
          <span style={styles.searchPlaceholder}>{t('searchPlaceholder')}</span>
          <span style={styles.searchKbd}>Ctrl + K</span>
        </div>

        <div style={styles.right}>
          {/* Bilingual Switcher (ENG / NEP) */}
          <div
            style={styles.langTogglePill}
            onClick={toggleLang}
            title="Toggle English / नेपाली भाषा"
          >
            <span>{lang === 'en' ? '🇺🇸' : '🇳🇵'}</span>
          </div>

          {/* Quick Shortcuts Icon */}
          <button style={styles.headerIconButton} title="Keyboard Shortcuts (Ctrl+K)" onClick={() => setIsSearchOpen(true)}>
            ⌨
          </button>

          {/* Notification Bell */}
          <NotificationDropdown />

          {/* Dark/Light Mode Icon */}
          <button style={styles.headerIconButton} title="Theme Switcher">
            ◐
          </button>

          {/* User Profile Pill */}
          <div style={styles.userProfilePill} onClick={handleLogout} title="Click to Sign Out">
            <div style={styles.userInitialAvatar}>
              {(user?.fullName || 'Ashok Singh').charAt(0).toUpperCase()}
            </div>
            <span style={styles.userDisplayName}>{user?.fullName || 'Ashok Singh'}</span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>▾</span>
          </div>
        </div>
      </header>

      <OrganizationModal
        isOpen={isOrgModalOpen}
        onClose={() => setIsOrgModalOpen(false)}
        onCreated={handleOrgCreated}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: '62px',
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
  orgSwitcherWrapper: {
    position: 'relative',
  },
  firmBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    backgroundColor: '#f1f5f9',
    padding: '7px 14px',
    borderRadius: '8px',
    cursor: 'pointer',
    border: '1px solid #e2e8f0',
    transition: 'background-color 0.2s',
  },
  branchDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
  },
  orgNameText: {
    maxWidth: '220px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  chevron: {
    fontSize: '12px',
    color: '#64748b',
  },
  orgDropdown: {
    position: 'absolute',
    top: '110%',
    left: 0,
    width: '280px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    border: '1px solid #e2e8f0',
    zIndex: 50,
    overflow: 'hidden',
  },
  dropdownHeader: {
    padding: '10px 14px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
  },
  orgList: {
    maxHeight: '220px',
    overflowY: 'auto',
  },
  orgItem: {
    padding: '10px 14px',
    cursor: 'pointer',
    borderBottom: '1px solid #f8fafc',
    transition: 'background-color 0.15s',
  },
  orgItemActive: {
    backgroundColor: '#eff6ff',
    borderLeft: '3px solid #2563eb',
  },
  orgItemName: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
  },
  orgItemCode: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
  },
  dropdownFooter: {
    padding: '8px',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
  },
  addOrgBtn: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  planBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#0284c7',
    backgroundColor: '#e0f2fe',
    padding: '4px 10px',
    borderRadius: '20px',
  },
  calendarPill: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '4px',
  },
  searchBarTrigger: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '7px 14px',
    width: '380px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  searchIcon: {
    fontSize: '13px',
    color: '#94a3b8',
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: '12px',
    color: '#94a3b8',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  searchKbd: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#64748b',
    backgroundColor: '#ffffff',
    padding: '2px 6px',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  langTogglePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#f1f5f9',
    padding: '4px 10px',
    borderRadius: '20px',
    cursor: 'pointer',
    border: '1px solid #e2e8f0',
    userSelect: 'none',
    transition: 'all 0.2s ease',
  },
  langActive: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#2563eb',
  },
  langInactive: {
    fontSize: '11px',
    fontWeight: 500,
    color: '#64748b',
  },
  headerIconButton: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userProfilePill: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '4px 10px 4px 6px',
    borderRadius: '20px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
  },
  userInitialAvatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '11px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDisplayName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0f172a',
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
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: 600,
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#dc2626',
    cursor: 'pointer',
  },
};
