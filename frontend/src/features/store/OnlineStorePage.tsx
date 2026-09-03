import React, { useState, useEffect } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Item } from '../../types/master';
import { formatDecimal } from '../../utils/decimal';
import { QrCodeGenerator } from '../../components/common/QrCodeGenerator';

export const OnlineStorePage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [items, setItems] = useState<Item[]>([]);
  const [isStoreEnabled, setIsStoreEnabled] = useState(true);
  const [storeName, setStoreName] = useState('My Online Store');
  const [whatsappNumber, setWhatsappNumber] = useState('+977-9800000001');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'catalog' | 'preview' | 'settings'>('catalog');

  useEffect(() => {
    if (!currentOrg?._id) return;
    setStoreName(currentOrg.name || 'My Online Store');
    const fetchItems = async () => {
      try {
        const res = await apiClient.get(`/organizations/${currentOrg._id}/items`, { params: { limit: 50 } });
        setItems(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load store items', err);
      }
    };
    fetchItems();
  }, [currentOrg]);

  const storeUrl = `https://smartbilling.app/store/${(currentOrg?.name || 'store').toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Namaste! 🙏 Check out our live online product catalog & place orders directly here:\n${storeUrl}\n\n- ${storeName}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div style={styles.container}>
      {/* Top Banner */}
      <div style={styles.header}>
        <div>
          <div style={styles.badgeRow}>
            <span style={styles.vyaparPill}>Smart Billing Digital Store</span>
            <span style={styles.statusPill}>● Live & Active</span>
          </div>
          <h1 style={styles.title}>🌐 My Digital Online Store & WhatsApp Catalog</h1>
          <p style={styles.subtitle}>
            Turn your inventory into an online storefront. Customers can browse products, see live prices, and order on WhatsApp!
          </p>
        </div>

        {/* Share & Copy Bar */}
        <div style={styles.shareBar}>
          <button style={styles.copyBtn} onClick={handleCopyLink}>
            {copied ? '✅ Link Copied!' : '🔗 Copy Store Link'}
          </button>
          <button style={styles.waShareBtn} onClick={handleShareWhatsApp}>
            💬 Share Store on WhatsApp
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabNav}>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'catalog' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('catalog')}
        >
          📦 Catalog Management ({items.length} Products)
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'preview' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('preview')}
        >
          📱 Customer Mobile Preview
        </button>
        <button
          style={{ ...styles.tabBtn, ...(activeTab === 'settings' ? styles.tabBtnActive : {}) }}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Store Settings & WhatsApp Ordering
        </button>
      </div>

      {/* TAB 1: CATALOG MANAGEMENT */}
      {activeTab === 'catalog' && (
        <div style={styles.contentCard}>
          <div style={styles.cardTop}>
            <div>
              <h3 style={styles.cardTitle}>Live Store Catalog</h3>
              <p style={styles.cardSub}>Toggle items that will appear on your public customer store.</p>
            </div>
            <div style={styles.storeLinkPill}>
              <span>Public URL:</span>
              <strong style={{ color: '#2563eb' }}>{storeUrl}</strong>
            </div>
          </div>

          <div style={styles.productsGrid}>
            {items.map((item) => (
              <div key={item._id} style={styles.productCard}>
                <div style={styles.productImgPlaceholder}>
                  <span>📦</span>
                </div>
                <div style={styles.productInfo}>
                  <span style={styles.productCode}>{item.code}</span>
                  <h4 style={styles.productName}>{item.name}</h4>
                  <div style={styles.productPriceRow}>
                    <span style={styles.priceText}>NPR {formatDecimal(item.salePrice)}</span>
                    <span style={styles.inStockBadge}>In Stock</span>
                  </div>
                </div>
                <div style={styles.productCardFooter}>
                  <span style={styles.onlineStatus}>🟢 Visible in Store</span>
                  <button
                    style={styles.orderTestBtn}
                    onClick={() => {
                      const msg = encodeURIComponent(`Hi ${storeName}, I want to order 1x ${item.name} (NPR ${formatDecimal(item.salePrice)}). Is it available?`);
                      window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
                    }}
                  >
                    Test WhatsApp Order
                  </button>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div style={styles.emptyNotice}>
                No products found. Add items from the <strong>Items & Services</strong> catalog to display them here.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOMER MOBILE PREVIEW */}
      {activeTab === 'preview' && (
        <div style={styles.previewContainer}>
          <div style={styles.phoneFrame}>
            <div style={styles.phoneSpeaker} />
            <div style={styles.phoneScreen}>
              <div style={styles.mobileStoreHeader}>
                <div style={styles.mobileBrandLogo}>⚡</div>
                <div>
                  <div style={styles.mobileStoreTitle}>{storeName}</div>
                  <div style={styles.mobileStoreSub}>Verified Nepal Merchant • Kathmandu</div>
                </div>
              </div>

              <div style={styles.mobileBanner}>
                🔥 100% Genuine Products • WhatsApp Fast Delivery
              </div>

              <div style={styles.mobileSearch}>
                <span>🔍</span>
                <span>Search products in this store...</span>
              </div>

              <div style={styles.mobileList}>
                {items.slice(0, 6).map((item) => (
                  <div key={item._id} style={styles.mobileItemCard}>
                    <div style={styles.mobileItemLeft}>
                      <div style={styles.mobileThumb}>📦</div>
                      <div>
                        <div style={styles.mobileItemName}>{item.name}</div>
                        <div style={styles.mobileItemPrice}>NPR {formatDecimal(item.salePrice)}</div>
                      </div>
                    </div>
                    <button
                      style={styles.mobileOrderBtn}
                      onClick={() => {
                        const msg = encodeURIComponent(`Hello, I would like to purchase ${item.name} for NPR ${formatDecimal(item.salePrice)}.`);
                        window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${msg}`, '_blank');
                      }}
                    >
                      💬 Order
                    </button>
                  </div>
                ))}
              </div>

              <div style={styles.mobileFooter}>
                Powered by <strong>Smart Billing ERP</strong>
              </div>
            </div>
          </div>

          <div style={styles.qrSideCard}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px 0' }}>📲 Counter QR Display</h3>
            <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
              Print this QR code and place it on your retail billing counter. Customers scan it with their phone camera to open your online store!
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
              <QrCodeGenerator value={storeUrl} size={150} label="Scan to Open Digital Store" />
            </div>
            <button style={styles.printQrBtn} onClick={() => window.print()}>
              🖨️ Print Counter Standee QR
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SETTINGS */}
      {activeTab === 'settings' && (
        <div style={styles.contentCard}>
          <h3 style={styles.cardTitle}>Online Store & WhatsApp Ordering Configuration</h3>
          <p style={styles.cardSub}>Set your WhatsApp order destination and business profile</p>

          <div style={styles.settingsForm}>
            <div style={styles.formRow}>
              <label style={styles.formLabel}>Store Status</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={isStoreEnabled}
                  onChange={(e) => setIsStoreEnabled(e.target.checked)}
                  style={{ width: '18px', height: '18px' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>Enable Online Customer Store</span>
              </div>
            </div>

            <div style={styles.formRow}>
              <label style={styles.formLabel}>Store Display Name</label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                style={styles.formInput}
              />
            </div>

            <div style={styles.formRow}>
              <label style={styles.formLabel}>WhatsApp Order Receiving Number</label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                style={styles.formInput}
                placeholder="+977-98XXXXXXXX"
              />
              <span style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                When customers click "Order on WhatsApp", incoming orders will be sent to this phone.
              </span>
            </div>

            <button style={styles.saveSettingsBtn} onClick={() => alert('Store settings saved successfully!')}>
              💾 Save Store Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    animation: 'fadeIn 0.2s ease-out',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '16px',
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
  },
  vyaparPill: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#7c3aed',
    backgroundColor: '#f3e8ff',
    padding: '3px 10px',
    borderRadius: '12px',
  },
  statusPill: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#059669',
    backgroundColor: '#ecfdf5',
    padding: '3px 10px',
    borderRadius: '12px',
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
    maxWidth: '650px',
  },
  shareBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  copyBtn: {
    padding: '10px 16px',
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  waShareBtn: {
    padding: '10px 18px',
    backgroundColor: '#25D366',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
  },
  tabNav: {
    display: 'flex',
    gap: '8px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '10px',
  },
  tabBtn: {
    padding: '8px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#64748b',
    backgroundColor: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
  },
  tabBtnActive: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontWeight: 700,
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  cardSub: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
  },
  storeLinkPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    backgroundColor: '#f8fafc',
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
  },
  productCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.2s ease',
  },
  productImgPlaceholder: {
    height: '110px',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '36px',
  },
  productInfo: {
    padding: '12px',
    flex: 1,
  },
  productCode: {
    fontSize: '10px',
    fontFamily: 'monospace',
    color: '#64748b',
  },
  productName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '4px 0 8px 0',
  },
  productPriceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#2563eb',
    fontFamily: 'JetBrains Mono, monospace',
  },
  inStockBadge: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#059669',
    backgroundColor: '#ecfdf5',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  productCardFooter: {
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #f1f5f9',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  onlineStatus: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#059669',
  },
  orderTestBtn: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#15803d',
    backgroundColor: '#dcfce7',
    padding: '4px 8px',
    borderRadius: '6px',
    border: '1px solid #bbf7d0',
    cursor: 'pointer',
  },
  emptyNotice: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '40px',
    color: '#64748b',
    fontSize: '13px',
  },
  previewContainer: {
    display: 'flex',
    gap: '32px',
    alignItems: 'flex-start',
  },
  phoneFrame: {
    width: '320px',
    height: '620px',
    backgroundColor: '#0f172a',
    borderRadius: '36px',
    padding: '12px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
    border: '4px solid #334155',
  },
  phoneSpeaker: {
    width: '60px',
    height: '4px',
    backgroundColor: '#475569',
    borderRadius: '2px',
    margin: '6px auto 12px auto',
  },
  phoneScreen: {
    backgroundColor: '#f8fafc',
    borderRadius: '26px',
    height: 'calc(100% - 24px)',
    overflowY: 'auto',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  mobileStoreHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  mobileBrandLogo: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  mobileStoreTitle: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#0f172a',
  },
  mobileStoreSub: {
    fontSize: '10px',
    color: '#64748b',
  },
  mobileBanner: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    fontSize: '10px',
    fontWeight: 700,
    padding: '6px 10px',
    borderRadius: '6px',
    textAlign: 'center',
  },
  mobileSearch: {
    backgroundColor: '#ffffff',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11px',
    color: '#94a3b8',
  },
  mobileList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    flex: 1,
  },
  mobileItemCard: {
    backgroundColor: '#ffffff',
    padding: '8px 10px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mobileItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  mobileThumb: {
    fontSize: '18px',
  },
  mobileItemName: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#0f172a',
  },
  mobileItemPrice: {
    fontSize: '11px',
    fontWeight: 800,
    color: '#2563eb',
    fontFamily: 'monospace',
  },
  mobileOrderBtn: {
    padding: '4px 8px',
    backgroundColor: '#25D366',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: 700,
    borderRadius: '6px',
  },
  mobileFooter: {
    textAlign: 'center',
    fontSize: '9px',
    color: '#94a3b8',
    paddingTop: '8px',
    borderTop: '1px solid #e2e8f0',
  },
  qrSideCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
  },
  printQrBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  settingsForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    maxWidth: '520px',
    marginTop: '16px',
  },
  formRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#334155',
  },
  formInput: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
  },
  saveSettingsBtn: {
    padding: '12px 20px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    alignSelf: 'flex-start',
    cursor: 'pointer',
    marginTop: '8px',
  },
};
