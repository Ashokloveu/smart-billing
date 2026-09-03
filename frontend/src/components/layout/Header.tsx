import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { NotificationDropdown } from '../../features/operations/components/NotificationDropdown';
import { OrganizationModal } from './OrganizationModal';
import { GlobalSearchModal } from '../common/GlobalSearchModal';
import { apiClient } from '../../services/apiClient';

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
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
        const orgList = res.data?.data || [];
        setOrganizations(orgList);
        if (orgList.length > 0) {
          setSelectedOrg(orgList[0]);
        }
      } catch (err) {
        // Fallback default organization
        const defaultOrg = {
          _id: 'default-org-1',
          name: 'Himalayan Enterprises Pvt. Ltd.',
          code: 'HQ-KTM',
          plan: 'Enterprise SaaS',
        };
        setOrganizations([defaultOrg]);
        setSelectedOrg(defaultOrg);
      }
    };
    fetchOrgs();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleOrgCreated = (newOrg: any) => {
    setOrganizations((prev) => [...prev, newOrg]);
    setSelectedOrg(newOrg);
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
              <span style={styles.orgNameText}>{selectedOrg?.name || 'My Business'}</span>
              <span style={styles.chevron}>▾</span>
            </div>

            {isOrgDropdownOpen && (
              <div style={styles.orgDropdown}>
                <div style={styles.dropdownHeader}>Switch Business / Branch</div>
                <div style={styles.orgList}>
                  {organizations.map((org) => (
                    <div
                      key={org._id}
                      style={{
                        ...styles.orgItem,
                        ...(selectedOrg?._id === org._id ? styles.orgItemActive : {}),
                      }}
                      onClick={() => {
                        setSelectedOrg(org);
                        setIsOrgDropdownOpen(false);
                      }}
                    >
                      <div style={styles.orgItemName}>🏢 {org.name}</div>
                      <div style={styles.orgItemCode}>{org.code || 'Main Branch'}</div>
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
                    ➕ Add New Shop / Business
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
          <span style={styles.searchPlaceholder}>Search invoice, customer, item, or command...</span>
          <span style={styles.searchKbd}>Ctrl + K</span>
        </div>

        <div style={styles.right}>
          <NotificationDropdown />
          <div style={styles.userInfo}>
            <span style={styles.userName}>{user?.fullName || 'Administrator'}</span>
            <span style={styles.userRole}>Chief Administrator</span>
          </div>
          <button onClick={handleLogout} style={styles.logoutBtn} title="Sign Out">
            Sign Out
          </button>
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
    cursor: 'pointer',
  },
};
