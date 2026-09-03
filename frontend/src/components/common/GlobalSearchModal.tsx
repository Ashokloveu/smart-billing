import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchItem {
  id: string;
  category: 'Actions' | 'Navigation' | 'Recent Records' | 'Reports';
  title: string;
  subtitle: string;
  icon: string;
  action: () => void;
  shortcut?: string;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const allItems: SearchItem[] = [
    // Quick Actions
    {
      id: 'action-pos',
      category: 'Actions',
      title: 'Open POS Express Terminal',
      subtitle: 'Fast 0.5s barcode counter billing with thermal print',
      icon: '⚡',
      shortcut: 'F2',
      action: () => { navigate('/pos'); onClose(); },
    },
    {
      id: 'action-new-sale',
      category: 'Actions',
      title: 'Create New Tax Invoice',
      subtitle: 'B2B/B2C sale invoice with VAT 13% & Fonepay QR',
      icon: '🧾',
      shortcut: 'F3',
      action: () => { navigate('/sales'); onClose(); },
    },
    {
      id: 'action-new-purchase',
      category: 'Actions',
      title: 'Record Purchase Bill / Vendor Voucher',
      subtitle: 'Add supplier stock and auto-credit ledger',
      icon: '📦',
      shortcut: 'F4',
      action: () => { navigate('/purchases'); onClose(); },
    },
    {
      id: 'action-add-item',
      category: 'Actions',
      title: 'Add New Product or SKU',
      subtitle: 'Define item price, unit, category, and barcode',
      icon: '🏷️',
      action: () => { navigate('/items'); onClose(); },
    },
    {
      id: 'action-add-party',
      category: 'Actions',
      title: 'Add Customer or Vendor Party',
      subtitle: 'Create party profile with Nepal PAN/VAT & phone',
      icon: '👥',
      action: () => { navigate('/parties'); onClose(); },
    },
    // Navigation
    {
      id: 'nav-dashboard',
      category: 'Navigation',
      title: 'Executive Dashboard',
      subtitle: 'Live KPIs, cash flow analytics & sales charts',
      icon: '📊',
      action: () => { navigate('/dashboard'); onClose(); },
    },
    {
      id: 'nav-inventory',
      category: 'Navigation',
      title: 'Inventory & Stock Transfers',
      subtitle: 'Multi-warehouse stock levels, adjustments & batches',
      icon: '🏢',
      action: () => { navigate('/inventory'); onClose(); },
    },
    {
      id: 'nav-daybook',
      category: 'Reports',
      title: 'Daily Daybook & Cashbook',
      subtitle: 'Chronological journal of all receipts & payments',
      icon: '📖',
      action: () => { navigate('/accounting/daybook'); onClose(); },
    },
    {
      id: 'nav-vat-sales',
      category: 'Reports',
      title: 'VAT Sales Register (अनुसूची ९)',
      subtitle: 'Official Nepal IRD Annex 9 monthly sales tax report',
      icon: '🇳🇵',
      action: () => { navigate('/compliance/sales-register'); onClose(); },
    },
    {
      id: 'nav-vat-purchases',
      category: 'Reports',
      title: 'VAT Purchase Register (अनुसूची ८)',
      subtitle: 'Official Nepal IRD Annex 8 purchase tax credit report',
      icon: '🇳🇵',
      action: () => { navigate('/compliance/purchase-register'); onClose(); },
    },
    {
      id: 'nav-settings',
      category: 'Navigation',
      title: 'Company & Tax Settings',
      subtitle: 'Fiscal year BS 2081/82, print styles, and users',
      icon: '⚙️',
      action: () => { navigate('/settings'); onClose(); },
    },
  ];

  const filteredItems = query.trim() === ''
    ? allItems
    : allItems.filter(
        item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation inside modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredItems.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % (filteredItems.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].action();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, filteredItems, onClose]);

  if (!isOpen) return null;

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Search Input Box */}
        <div style={styles.searchBar}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            autoFocus
            type="text"
            placeholder="Type a command, customer, invoice, or report... (Press Esc to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={styles.input}
          />
          <span style={styles.escBadge}>ESC</span>
        </div>

        {/* Results List */}
        <div style={styles.resultsList}>
          {filteredItems.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>🔍</div>
              <div style={{ fontWeight: 600, color: '#334155' }}>No commands or records found</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Try searching for "POS", "Invoice", "VAT", or "Customer"
              </div>
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <div
                key={item.id}
                style={{
                  ...styles.itemRow,
                  ...(selectedIndex === index ? styles.itemRowActive : {}),
                }}
                onMouseEnter={() => setSelectedIndex(index)}
                onClick={item.action}
              >
                <div style={styles.itemLeft}>
                  <div style={styles.itemIcon}>{item.icon}</div>
                  <div>
                    <div style={styles.itemTitle}>{item.title}</div>
                    <div style={styles.itemSubtitle}>{item.subtitle}</div>
                  </div>
                </div>

                <div style={styles.itemRight}>
                  {item.shortcut && (
                    <span style={styles.shortcutKey}>{item.shortcut}</span>
                  )}
                  <span style={styles.categoryBadge}>{item.category}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div style={styles.footer}>
          <div style={styles.footerHint}>
            <span>Use <strong>↑</strong> <strong>↓</strong> to navigate</span>
            <span>•</span>
            <span><strong>Enter</strong> to select</span>
            <span>•</span>
            <span><strong>Ctrl + K</strong> to trigger anytime</span>
          </div>
          <span style={styles.footerBrand}>Smart Billing ERP</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '10vh',
    zIndex: 9999,
  },
  modal: {
    width: '100%',
    maxWidth: '640px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeIn 0.18s ease-out',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    gap: '12px',
    backgroundColor: '#ffffff',
  },
  searchIcon: {
    fontSize: '18px',
    color: '#64748b',
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '16px',
    fontWeight: 500,
    color: '#0f172a',
    backgroundColor: 'transparent',
  },
  escBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  resultsList: {
    maxHeight: '380px',
    overflowY: 'auto',
    padding: '8px',
  },
  itemRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  itemRowActive: {
    backgroundColor: '#eff6ff',
    transform: 'translateX(3px)',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  itemIcon: {
    fontSize: '20px',
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid #e2e8f0',
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#0f172a',
  },
  itemSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '1px',
  },
  itemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  shortcutKey: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#2563eb',
    backgroundColor: '#dbeafe',
    padding: '3px 7px',
    borderRadius: '5px',
    fontFamily: 'monospace',
  },
  categoryBadge: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    padding: '3px 8px',
    borderRadius: '12px',
    textTransform: 'uppercase',
  },
  emptyState: {
    padding: '36px 20px',
    textAlign: 'center',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    fontSize: '11px',
    color: '#64748b',
  },
  footerHint: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  footerBrand: {
    fontWeight: 700,
    color: '#2563eb',
  },
};
