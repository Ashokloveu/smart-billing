import React, { useState } from 'react';
import { useOrgStore } from '../../stores/orgStore';

type SettingsTab =
  | 'general'
  | 'account'
  | 'business_profile'
  | 'subscription'
  | 'parties'
  | 'inventory'
  | 'transactions'
  | 'invoice_print';

export const SettingsPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [activeTab, setActiveTab] = useState<SettingsTab>('invoice_print');
  const [isFeatureSettingsOpen, setIsFeatureSettingsOpen] = useState(true);

  // Print Settings State (Screenshot 1)
  const [printType, setPrintType] = useState<'regular' | 'thermal'>('regular');
  const [pageSize, setPageSize] = useState('A4 (210 × 297 mm)');
  const [invoiceToggles, setInvoiceToggles] = useState({
    showBankQr: false,
    showLogo: true,
    showPhone: true,
    showAddress: true,
    showEmail: true,
    showBankAccount: false,
    showRegNo: false,
    showPartyBalance: false,
    showItemUnit: true,
    hideHsCode: false,
    showNotes: true,
    hideBranding: false,
  });

  // Transaction Settings State (Screenshot 3)
  const [txnToggles, setTxnToggles] = useState({
    enableOtherIncome: true,
    enablePrefixes: true,
    enableAdditionalCharges: true,
    enableRoundOff: false,
  });

  // Party Settings State (Screenshot 4)
  const [partyToggles, setPartyToggles] = useState({
    partyCategory: false,
    uploadPartyImage: true,
  });

  // Inventory Settings State (Screenshot 5)
  const [inventoryToggles, setInventoryToggles] = useState({
    barcodeScan: true,
    uploadItemImage: true,
    wholesalePrice: false,
    mrp: false,
    itemLocation: false,
    partyWiseRate: false,
    lowStockWarning: true,
    defaultUnit: false,
    decimalPlaces: 2,
  });

  const toggleInvoiceSetting = (key: keyof typeof invoiceToggles) => {
    setInvoiceToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleTxnSetting = (key: keyof typeof txnToggles) => {
    setTxnToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const togglePartySetting = (key: keyof typeof partyToggles) => {
    setPartyToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleInventorySetting = (key: keyof typeof inventoryToggles) => {
    if (typeof inventoryToggles[key] === 'boolean') {
      setInventoryToggles((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  // Switch component helper
  const RenderSwitch = ({
    checked,
    onChange,
  }: {
    checked: boolean;
    onChange: () => void;
  }) => (
    <div
      style={{
        ...styles.switchTrack,
        backgroundColor: checked ? '#10b981' : '#e2e8f0',
      }}
      onClick={onChange}
    >
      <div
        style={{
          ...styles.switchThumb,
          transform: checked ? 'translateX(18px)' : 'translateX(2px)',
        }}
      />
    </div>
  );

  return (
    <div style={styles.container}>
      {/* Left Sub-Sidebar Menu */}
      <div style={styles.subSidebar}>
        <div style={styles.settingsTitleRow}>
          <span style={styles.backArrow}>←</span>
          <h2 style={styles.settingsNavTitle}>Settings</h2>
        </div>

        <div style={styles.navList}>
          <button
            style={{
              ...styles.navItem,
              ...(activeTab === 'general' ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveTab('general')}
          >
            <span style={styles.navIcon}>⚙️</span>
            <span>General</span>
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activeTab === 'account' ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveTab('account')}
          >
            <span style={styles.navIcon}>👤</span>
            <span>My Account</span>
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activeTab === 'business_profile' ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveTab('business_profile')}
          >
            <span style={styles.navIcon}>🏢</span>
            <span>Business Profile</span>
          </button>

          <button
            style={{
              ...styles.navItem,
              ...(activeTab === 'subscription' ? styles.navItemActive : {}),
            }}
            onClick={() => setActiveTab('subscription')}
          >
            <span style={styles.navIcon}>💳</span>
            <span>Subscription</span>
          </button>

          {/* Feature Settings Dropdown */}
          <div>
            <button
              style={{
                ...styles.navItem,
                justifyContent: 'space-between',
              }}
              onClick={() => setIsFeatureSettingsOpen(!isFeatureSettingsOpen)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={styles.navIcon}>🧩</span>
                <span>Feature Settings</span>
              </div>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                {isFeatureSettingsOpen ? '▾' : '▸'}
              </span>
            </button>

            {isFeatureSettingsOpen && (
              <div style={styles.subNavList}>
                <button
                  style={{
                    ...styles.subNavItem,
                    ...(activeTab === 'parties' ? styles.subNavItemActive : {}),
                  }}
                  onClick={() => setActiveTab('parties')}
                >
                  Parties
                </button>
                <button
                  style={{
                    ...styles.subNavItem,
                    ...(activeTab === 'inventory' ? styles.subNavItemActive : {}),
                  }}
                  onClick={() => setActiveTab('inventory')}
                >
                  Inventory
                </button>
                <button
                  style={{
                    ...styles.subNavItem,
                    ...(activeTab === 'transactions' ? styles.subNavItemActive : {}),
                  }}
                  onClick={() => setActiveTab('transactions')}
                >
                  Transactions
                </button>
                <button
                  style={{
                    ...styles.subNavItem,
                    ...(activeTab === 'invoice_print' ? styles.subNavItemActive : {}),
                  }}
                  onClick={() => setActiveTab('invoice_print')}
                >
                  Invoice Print
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Content View */}
      <div style={styles.contentArea}>
        {/* ================= INVOICE PRINT SETTINGS (SCREENSHOT 1) ================= */}
        {activeTab === 'invoice_print' && (
          <div style={styles.panel}>
            <h1 style={styles.panelTitle}>Invoice Print Settings</h1>

            {/* Default Print Type */}
            <div style={styles.card}>
              <div style={styles.cardRow}>
                <div>
                  <div style={styles.rowTitle}>Select Default Print Type</div>
                  <div style={styles.rowSub}>
                    You can select printing type as your preferences
                  </div>
                </div>
                <div style={styles.segmentedControl}>
                  <button
                    style={{
                      ...styles.segmentBtn,
                      ...(printType === 'regular' ? styles.segmentBtnActive : {}),
                    }}
                    onClick={() => setPrintType('regular')}
                  >
                    📄 Regular
                  </button>
                  <button
                    style={{
                      ...styles.segmentBtn,
                      ...(printType === 'thermal' ? styles.segmentBtnActive : {}),
                    }}
                    onClick={() => setPrintType('thermal')}
                  >
                    🧾 Thermal
                  </button>
                </div>
              </div>
            </div>

            <div style={styles.sectionHeader}>Invoices</div>
            <div style={styles.cardGroup}>
              <div style={styles.chevronRow}>
                <div>
                  <div style={styles.rowTitle}>Default Invoice Style</div>
                  <div style={styles.rowSub}>
                    Select different invoice type & color options (Modern A4 VAT / Minimal)
                  </div>
                </div>
                <span style={styles.chevron}>›</span>
              </div>
              <div style={styles.chevronRow}>
                <div>
                  <div style={styles.rowTitle}>Signature</div>
                  <div style={styles.rowSub}>
                    Add your signature or create one for Invoices
                  </div>
                </div>
                <span style={styles.chevron}>›</span>
              </div>
              <div style={styles.chevronRow}>
                <div>
                  <div style={styles.rowTitle}>Upload Bank QR</div>
                  <div style={styles.rowSub}>
                    Add your Fonepay / eSewa QR for instant customer payments
                  </div>
                </div>
                <span style={styles.chevron}>›</span>
              </div>
              <div style={{ ...styles.chevronRow, borderBottom: 'none' }}>
                <div>
                  <div style={styles.rowTitle}>Terms & Conditions</div>
                  <div style={styles.rowSub}>
                    Thank you for Doing business with us. Subject to Kathmandu jurisdiction.
                  </div>
                </div>
                <span style={styles.chevron}>›</span>
              </div>
            </div>

            <div style={styles.sectionHeader}>Printer Settings</div>
            <div style={styles.card}>
              <div style={styles.cardRow}>
                <div>
                  <div style={styles.rowTitle}>Page Size</div>
                  <div style={styles.rowSub}>
                    To adjust page size, choose from two preset options
                  </div>
                </div>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value)}
                  style={styles.selectInput}
                >
                  <option value="A4 (210 × 297 mm)">A4 (210 × 297 mm)</option>
                  <option value="80mm Thermal POS">80mm Thermal POS</option>
                  <option value="58mm Mini Thermal">58mm Mini Thermal</option>
                </select>
              </div>
            </div>

            <div style={styles.sectionHeader}>Invoice Customization</div>
            <div style={styles.cardGroup}>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Show Bank QR on Invoice</span>
                <RenderSwitch
                  checked={invoiceToggles.showBankQr}
                  onChange={() => toggleInvoiceSetting('showBankQr')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Show Business Logo on Invoice</span>
                <RenderSwitch
                  checked={invoiceToggles.showLogo}
                  onChange={() => toggleInvoiceSetting('showLogo')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Show Phone Number on Invoice</span>
                <RenderSwitch
                  checked={invoiceToggles.showPhone}
                  onChange={() => toggleInvoiceSetting('showPhone')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Show Address on Invoice</span>
                <RenderSwitch
                  checked={invoiceToggles.showAddress}
                  onChange={() => toggleInvoiceSetting('showAddress')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Show Email on Invoice</span>
                <RenderSwitch
                  checked={invoiceToggles.showEmail}
                  onChange={() => toggleInvoiceSetting('showEmail')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Show Bank Account on Invoice</span>
                <RenderSwitch
                  checked={invoiceToggles.showBankAccount}
                  onChange={() => toggleInvoiceSetting('showBankAccount')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Show Registration No. on Invoice</span>
                <RenderSwitch
                  checked={invoiceToggles.showRegNo}
                  onChange={() => toggleInvoiceSetting('showRegNo')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Show Party Balance on Invoice</span>
                <RenderSwitch
                  checked={invoiceToggles.showPartyBalance}
                  onChange={() => toggleInvoiceSetting('showPartyBalance')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Show Item Unit on Invoice</span>
                <RenderSwitch
                  checked={invoiceToggles.showItemUnit}
                  onChange={() => toggleInvoiceSetting('showItemUnit')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Hide HS Code on Invoice</span>
                <RenderSwitch
                  checked={invoiceToggles.hideHsCode}
                  onChange={() => toggleInvoiceSetting('hideHsCode')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Show Notes on Invoice</span>
                <RenderSwitch
                  checked={invoiceToggles.showNotes}
                  onChange={() => toggleInvoiceSetting('showNotes')}
                />
              </div>
              <div style={{ ...styles.toggleRow, borderBottom: 'none' }}>
                <span style={styles.toggleLabel}>Hide Smart Billing Branding</span>
                <RenderSwitch
                  checked={invoiceToggles.hideBranding}
                  onChange={() => toggleInvoiceSetting('hideBranding')}
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= TRANSACTIONS SETTINGS (SCREENSHOT 3) ================= */}
        {activeTab === 'transactions' && (
          <div style={styles.panel}>
            <h1 style={styles.panelTitle}>Transactions Settings</h1>

            <div style={styles.cardGroup}>
              <div style={styles.toggleRowWithSub}>
                <div>
                  <div style={styles.rowTitle}>Enable Other Income Transaction</div>
                  <div style={styles.rowSub}>
                    By enabling this you can record other non-sales business income.
                  </div>
                </div>
                <RenderSwitch
                  checked={txnToggles.enableOtherIncome}
                  onChange={() => toggleTxnSetting('enableOtherIncome')}
                />
              </div>
              <div style={styles.chevronRow}>
                <div style={styles.rowTitle}>Manage Income Categories</div>
                <span style={styles.chevron}>›</span>
              </div>
              <div style={{ ...styles.chevronRow, borderBottom: 'none' }}>
                <div style={styles.rowTitle}>Manage Expense Categories</div>
                <span style={styles.chevron}>›</span>
              </div>
            </div>

            <div style={styles.sectionHeader}>Numbering & Prefixes</div>
            <div style={styles.cardGroup}>
              <div style={styles.toggleRowWithSub}>
                <div>
                  <div style={styles.rowTitle}>Enable Transaction Prefixes</div>
                  <div style={styles.rowSub}>
                    By enabling prefix, you can manage invoices with distinct numbering (e.g. INV-2081-).
                  </div>
                </div>
                <RenderSwitch
                  checked={txnToggles.enablePrefixes}
                  onChange={() => toggleTxnSetting('enablePrefixes')}
                />
              </div>
              <div style={styles.chevronRow}>
                <div style={styles.rowTitle}>Sales Prefix (INV-)</div>
                <span style={styles.chevron}>›</span>
              </div>
              <div style={styles.chevronRow}>
                <div style={styles.rowTitle}>Sales Return / Credit Note Prefix (CN-)</div>
                <span style={styles.chevron}>›</span>
              </div>
              <div style={styles.chevronRow}>
                <div style={styles.rowTitle}>Payment In Prefix (REC-)</div>
                <span style={styles.chevron}>›</span>
              </div>
              <div style={{ ...styles.chevronRow, borderBottom: 'none' }}>
                <div style={styles.rowTitle}>Quotation Prefix (EST-)</div>
                <span style={styles.chevron}>›</span>
              </div>
            </div>

            <div style={styles.sectionHeader}>Others Settings</div>
            <div style={styles.cardGroup}>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Enable Additional Charges (Freight / Handling)</span>
                <RenderSwitch
                  checked={txnToggles.enableAdditionalCharges}
                  onChange={() => toggleTxnSetting('enableAdditionalCharges')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Enable Round Off</span>
                <RenderSwitch
                  checked={txnToggles.enableRoundOff}
                  onChange={() => toggleTxnSetting('enableRoundOff')}
                />
              </div>
              <div style={{ ...styles.chevronRow, borderBottom: 'none' }}>
                <div style={styles.rowTitle}>Reset Transaction Serial Number ⓘ</div>
                <span style={styles.chevron}>›</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= PARTIES SETTINGS (SCREENSHOT 4) ================= */}
        {activeTab === 'parties' && (
          <div style={styles.panel}>
            <h1 style={styles.panelTitle}>Party Settings</h1>

            <div style={styles.cardGroup}>
              <div style={styles.toggleRowWithSub}>
                <div>
                  <div style={styles.rowTitle}>Party Category</div>
                  <div style={styles.rowSub}>
                    Enable Party Category to effortlessly manage wholesale and retail customers.
                  </div>
                </div>
                <RenderSwitch
                  checked={partyToggles.partyCategory}
                  onChange={() => togglePartySetting('partyCategory')}
                />
              </div>
              <div style={{ ...styles.toggleRowWithSub, borderBottom: 'none' }}>
                <div>
                  <div style={styles.rowTitle}>Upload Party Image</div>
                  <div style={styles.rowSub}>
                    Enable party image uploads to recognize parties easily.
                  </div>
                </div>
                <RenderSwitch
                  checked={partyToggles.uploadPartyImage}
                  onChange={() => togglePartySetting('uploadPartyImage')}
                />
              </div>
            </div>
          </div>
        )}

        {/* ================= INVENTORY SETTINGS (SCREENSHOT 5) ================= */}
        {activeTab === 'inventory' && (
          <div style={styles.panel}>
            <h1 style={styles.panelTitle}>Inventory Settings</h1>

            <div style={styles.cardGroup}>
              <div style={styles.chevronRow}>
                <div style={styles.rowTitle}>Manage Item Categories</div>
                <span style={styles.chevron}>›</span>
              </div>
              <div style={styles.chevronRow}>
                <div style={styles.rowTitle}>Manage Item Units (Pcs, Kg, Box, Litre)</div>
                <span style={styles.chevron}>›</span>
              </div>
              <div style={styles.toggleRowWithSub}>
                <div>
                  <div style={styles.rowTitle}>Enable Barcode Scan</div>
                  <div style={styles.rowSub}>
                    Use barcodes to find and record items quickly.
                  </div>
                </div>
                <RenderSwitch
                  checked={inventoryToggles.barcodeScan}
                  onChange={() => toggleInventorySetting('barcodeScan')}
                />
              </div>
              <div style={{ ...styles.toggleRowWithSub, borderBottom: 'none' }}>
                <div>
                  <div style={styles.rowTitle}>Upload Item Image</div>
                  <div style={styles.rowSub}>
                    Enable item image uploads to recognize item easily.
                  </div>
                </div>
                <RenderSwitch
                  checked={inventoryToggles.uploadItemImage}
                  onChange={() => toggleInventorySetting('uploadItemImage')}
                />
              </div>
            </div>

            <div style={styles.sectionHeader}>Pricing & Inventory Management</div>
            <div style={styles.cardGroup}>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Wholesale Price ⓘ</span>
                <RenderSwitch
                  checked={inventoryToggles.wholesalePrice}
                  onChange={() => toggleInventorySetting('wholesalePrice')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>MRP ⓘ</span>
                <RenderSwitch
                  checked={inventoryToggles.mrp}
                  onChange={() => toggleInventorySetting('mrp')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Item Location / Bin ⓘ</span>
                <RenderSwitch
                  checked={inventoryToggles.itemLocation}
                  onChange={() => toggleInventorySetting('itemLocation')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Party Wise Item Rate ⓘ</span>
                <RenderSwitch
                  checked={inventoryToggles.partyWiseRate}
                  onChange={() => toggleInventorySetting('partyWiseRate')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Low Stock Warning Dialog ⓘ</span>
                <RenderSwitch
                  checked={inventoryToggles.lowStockWarning}
                  onChange={() => toggleInventorySetting('lowStockWarning')}
                />
              </div>
              <div style={styles.toggleRow}>
                <span style={styles.toggleLabel}>Default Unit ⓘ</span>
                <RenderSwitch
                  checked={inventoryToggles.defaultUnit}
                  onChange={() => toggleInventorySetting('defaultUnit')}
                />
              </div>
              <div style={{ ...styles.toggleRow, borderBottom: 'none' }}>
                <span style={styles.toggleLabel}>Quantity (Upto Decimal Places) ⓘ</span>
                <div style={styles.counterControl}>
                  <button
                    style={styles.counterBtn}
                    onClick={() =>
                      setInventoryToggles((p) => ({
                        ...p,
                        decimalPlaces: Math.max(0, p.decimalPlaces - 1),
                      }))
                    }
                  >
                    -
                  </button>
                  <span style={styles.counterValue}>{inventoryToggles.decimalPlaces}</span>
                  <button
                    style={styles.counterBtn}
                    onClick={() =>
                      setInventoryToggles((p) => ({
                        ...p,
                        decimalPlaces: Math.min(4, p.decimalPlaces + 1),
                      }))
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= GENERAL SETTINGS (PAGE 9) ================= */}
        {activeTab === 'general' && (
          <div style={styles.panel}>
            {/* Theme selector */}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
              <div style={styles.themeCardActive}>
                <div style={styles.themeMockupLight} />
                <span style={styles.themeCardLabel}>Light Theme</span>
              </div>
              <div style={styles.themeCard}>
                <div style={styles.themeMockupClassic} />
                <span style={styles.themeCardLabel}>Classic Theme</span>
              </div>
              <div style={styles.themeCard}>
                <div style={styles.themeMockupDark} />
                <span style={styles.themeCardLabel}>Dark Theme</span>
              </div>
            </div>

            <div style={styles.cardGroup}>
              <div style={styles.chevronRow}>
                <div>
                  <div style={styles.rowTitle}>Language</div>
                  <div style={styles.rowSub}>To adjust language, choose from available options</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>🇺🇸 English</span>
                  <span style={styles.chevron}>▾</span>
                </div>
              </div>

              <div style={styles.chevronRow}>
                <div>
                  <div style={styles.rowTitle}>Currency</div>
                  <div style={styles.rowSub}>To adjust currency type, choose from available preset options</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Rs.</span>
                  <span style={styles.chevron}>▾</span>
                </div>
              </div>

              <div style={styles.chevronRow}>
                <div>
                  <div style={styles.rowTitle}>Currency Position</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Start</span>
                  <span style={styles.chevron}>▾</span>
                </div>
              </div>

              <div style={styles.chevronRow}>
                <div>
                  <div style={styles.rowTitle}>Calendar</div>
                  <div style={styles.rowSub}>To adjust calendar type, choose from available options</div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button style={styles.calPillInactive}>AD</button>
                  <button style={styles.calPillActive}>BS</button>
                </div>
              </div>

              <div style={styles.chevronRow}>
                <div>
                  <div style={styles.rowTitle}>Date Format</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>2083 Bai 15</span>
                  <span style={styles.chevron}>▾</span>
                </div>
              </div>

              <div style={styles.chevronRow}>
                <div>
                  <div style={styles.rowTitle}>Time Format</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>10:41 PM</span>
                  <span style={styles.chevron}>▾</span>
                </div>
              </div>

              <div style={styles.chevronRow}>
                <div>
                  <div style={styles.rowTitle}>Number Format</div>
                  <div style={styles.rowSub}>To adjust number format, choose from two preset options</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>10,00,000</span>
                  <span style={styles.chevron}>▾</span>
                </div>
              </div>

              <div style={styles.toggleRowWithSub}>
                <div>
                  <div style={styles.rowTitle}>Privacy Mode</div>
                  <div style={styles.rowSub}>Hides business stats from homepage & item purchase price</div>
                </div>
                <RenderSwitch checked={false} onChange={() => {}} />
              </div>

              <div style={{ ...styles.toggleRowWithSub, borderBottom: 'none' }}>
                <div>
                  <div style={styles.rowTitle}>App Lock</div>
                  <div style={styles.rowSub}>Secure your business access with a lock screen</div>
                </div>
                <RenderSwitch checked={false} onChange={() => {}} />
              </div>
            </div>
          </div>
        )}

        {/* ================= MY ACCOUNT (PAGE 8) ================= */}
        {activeTab === 'account' && (
          <div style={styles.panel}>
            <h1 style={styles.panelTitle}>My Account</h1>

            <div style={styles.card}>
              <div style={styles.sectionHeader}>Basic Information</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '24px', marginTop: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Your Name</label>
                    <input
                      type="text"
                      defaultValue="Ashok Singh"
                      style={styles.karobarInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Your Phone Number</label>
                    <input
                      type="text"
                      defaultValue="+977 9800895800"
                      style={styles.karobarInput}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>Your Email</label>
                    <input
                      type="email"
                      placeholder="Enter your Email"
                      style={styles.karobarInput}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={styles.accountPhotoPlaceholder}>
                    <span style={{ fontSize: '48px', color: '#94a3b8' }}>👤</span>
                  </div>
                  <button type="button" style={styles.uploadPhotoBtn}>Upload Photo</button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  style={styles.logOutRedBtn}
                  onClick={() => window.location.href = '/login'}
                >
                  ↳ Log Out
                </button>
                <button type="button" style={styles.saveGreenBtn}>
                  Update Account
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= BUSINESS PROFILE (PAGE 7) ================= */}
        {activeTab === 'business_profile' && (
          <div style={styles.panel}>
            <div style={styles.sectionHeader}>Address information</div>
            <div style={styles.cardGroup}>
              <div style={styles.twoColGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Province</label>
                  <select style={styles.karobarSelect}>
                    <option>Select Province</option>
                    <option selected>Madhesh Province</option>
                    <option>Bagmati Province</option>
                    <option>Gandaki Province</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>District</label>
                  <select style={styles.karobarSelect}>
                    <option>Select District</option>
                    <option selected>Mahottari</option>
                    <option>Kathmandu</option>
                  </select>
                </div>
              </div>

              <div style={{ ...styles.twoColGrid, marginTop: '16px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Municipality</label>
                  <select style={styles.karobarSelect}>
                    <option>Select Municipality</option>
                    <option selected>Bardibas Municipality</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Street Address</label>
                  <input
                    type="text"
                    placeholder="Enter the name of the Street"
                    defaultValue="Main Road, Ward No. 1"
                    style={styles.karobarInput}
                  />
                </div>
              </div>
            </div>

            <div style={{ ...styles.sectionHeader, marginTop: '24px' }}>Financial Information</div>
            <div style={styles.cardGroup}>
              <div style={styles.twoColGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Registration Number (PAN/VAT)</label>
                  <input
                    type="text"
                    placeholder="Enter registration number"
                    defaultValue={currentOrg?.taxRegistration?.number || '601234567'}
                    style={styles.karobarInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Bank Account</label>
                  <div style={styles.addBankBtnRow}>
                    <span style={{ fontSize: '13px', color: '#10b981', fontWeight: 700 }}>Add Bank Account</span>
                    <span style={styles.chevron}>›</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button style={styles.saveGreenBtn}>Save Details</button>
              </div>
            </div>

            {/* Danger Area (Page 7) */}
            <div style={{ ...styles.sectionHeader, marginTop: '28px', color: '#dc2626' }}>
              Danger Area
            </div>
            <div style={styles.cardGroup}>
              <div style={styles.chevronRow}>
                <div>
                  <div style={styles.rowTitle}>Close Fiscal Year</div>
                  <div style={styles.rowSub}>
                    This business will be archived & a new profile will be created by carrying forward old balance as opening balance.
                  </div>
                </div>
                <span style={styles.chevron}>›</span>
              </div>
              <div style={styles.chevronRow}>
                <div>
                  <div style={styles.rowTitle}>Archive Business Profile</div>
                  <div style={styles.rowSub}>
                    This business profile will be inactive but you will be able to access all data in read-only mode.
                  </div>
                </div>
                <span style={styles.chevron}>›</span>
              </div>
              <div style={{ ...styles.chevronRow, borderBottom: 'none' }}>
                <div>
                  <div style={{ ...styles.rowTitle, color: '#dc2626' }}>Delete Business Profile</div>
                  <div style={styles.rowSub}>
                    Your business profile will be deleted permanently.
                  </div>
                </div>
                <span style={{ ...styles.chevron, color: '#dc2626' }}>🗑️</span>
              </div>
            </div>
          </div>
        )}

        {/* ================= MANAGE SUBSCRIPTION (PAGE 6) ================= */}
        {activeTab === 'subscription' && (
          <div style={styles.panel}>
            <h1 style={styles.panelTitle}>Manage Subscription</h1>

            <div style={styles.subscriptionCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ color: '#eab308', fontSize: '18px' }}>🪙</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Smart Billing Trial
                </span>
              </div>

              <div style={styles.subDaysNumber}>7</div>
              <div style={styles.subDaysLabel}>Days Remaining</div>

              <button
                style={styles.upgradePlanBtn}
                onClick={() => alert('Smart Billing SaaS Subscription: Contact +977-9800000000 to renew license!')}
              >
                Upgrade Plan
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: 'calc(100vh - 110px)',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    animation: 'fadeIn 0.2s ease',
  },
  subSidebar: {
    width: '240px',
    borderRight: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    padding: '20px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  settingsTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 8px 12px 8px',
    borderBottom: '1px solid #e2e8f0',
  },
  backArrow: {
    fontSize: '16px',
    color: '#64748b',
    cursor: 'pointer',
  },
  settingsNavTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  navList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569',
    textAlign: 'left',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.15s ease',
  },
  navItemActive: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontWeight: 700,
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  navIcon: {
    fontSize: '15px',
  },
  subNavList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingLeft: '34px',
    marginTop: '4px',
  },
  subNavItem: {
    padding: '8px 10px',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748b',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  subNavItemActive: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontWeight: 700,
  },
  contentArea: {
    flex: 1,
    padding: '32px 40px',
    overflowY: 'auto',
    backgroundColor: '#ffffff',
  },
  panel: {
    maxWidth: '720px',
  },
  panelTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 24px 0',
  },
  sectionHeader: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginTop: '28px',
    marginBottom: '10px',
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '16px 20px',
  },
  cardGroup: {
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  cardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  rowTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
  },
  rowSub: {
    fontSize: '11px',
    color: '#64748b',
    marginTop: '2px',
  },
  segmentedControl: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    padding: '3px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  segmentBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  segmentBtnActive: {
    backgroundColor: '#ffffff',
    color: '#059669',
    fontWeight: 700,
    boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
  },
  chevronRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
  },
  chevron: {
    fontSize: '18px',
    color: '#94a3b8',
    fontWeight: 600,
  },
  selectInput: {
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    color: '#0f172a',
    fontWeight: 600,
  },
  toggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid #f1f5f9',
  },
  toggleRowWithSub: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    borderBottom: '1px solid #f1f5f9',
    gap: '16px',
  },
  toggleLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#0f172a',
  },
  switchTrack: {
    width: '40px',
    height: '22px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  switchThumb: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#ffffff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s ease',
  },
  counterControl: {
    display: 'flex',
    alignItems: 'center',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  counterBtn: {
    padding: '4px 10px',
    border: 'none',
    backgroundColor: '#f8fafc',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    color: '#0f172a',
  },
  counterValue: {
    padding: '4px 12px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  profileRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid #f1f5f9',
    fontSize: '13px',
  },
  profileLabel: {
    color: '#64748b',
    fontWeight: 600,
  },
  badgePill: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '2px 8px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '11px',
  },
  badgeActive: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    padding: '2px 8px',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '11px',
  },
  inlineInput: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
  },
  addBtn: {
    padding: '8px 16px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  statusPill: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    padding: '4px 12px',
    borderRadius: '12px',
    fontWeight: 700,
    fontSize: '12px',
  },
  themeCard: {
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  themeCardActive: {
    flex: 1,
    padding: '12px',
    borderRadius: '12px',
    border: '2px solid #10b981',
    backgroundColor: '#ecfdf5',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  themeMockupLight: {
    width: '100%',
    height: '60px',
    borderRadius: '6px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
  },
  themeMockupClassic: {
    width: '100%',
    height: '60px',
    borderRadius: '6px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
  },
  themeMockupDark: {
    width: '100%',
    height: '60px',
    borderRadius: '6px',
    backgroundColor: '#0f172a',
  },
  themeCardLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0f172a',
  },
  calPillActive: {
    padding: '4px 12px',
    borderRadius: '6px',
    border: '1px solid #10b981',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  calPillInactive: {
    padding: '4px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  accountPhotoPlaceholder: {
    width: '90px',
    height: '90px',
    borderRadius: '16px',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPhotoBtn: {
    padding: '5px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  logOutRedBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #fee2e2',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  saveGreenBtn: {
    padding: '9px 22px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  twoColGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    padding: '16px 20px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  formLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#334155',
  },
  karobarInput: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  karobarSelect: {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
  },
  addBankBtnRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #a7f3d0',
    backgroundColor: '#ecfdf5',
    cursor: 'pointer',
  },
  subscriptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '28px',
    maxWidth: '340px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  },
  subDaysNumber: {
    fontSize: '36px',
    fontWeight: 900,
    color: '#dc2626',
    margin: '4px 0 0 0',
  },
  subDaysLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '20px',
  },
  upgradePlanBtn: {
    padding: '8px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
