import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Item } from '../../types/master';
import { formatDecimal } from '../../utils/decimal';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { Transaction } from '../../types/transaction';

interface CartItem {
  item: Item;
  quantity: number;
  rate: number;
}

export const PosTerminal: React.FC = () => {
  const navigate = useNavigate();
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [items, setItems] = useState<Item[]>([]);
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Selected contexts
  const [firmId, setFirmId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('Cash Walk-in Customer');

  // Multi-Cart Parking System (Cart 1, Cart 2, Cart 3)
  const [activeCartIndex, setActiveCartIndex] = useState<number>(0);
  const [carts, setCarts] = useState<Record<number, CartItem[]>>({
    0: [],
    1: [],
    2: [],
  });

  const cart = carts[activeCartIndex] || [];

  const [receivedCash, setReceivedCash] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'fonepay_qr'>('cash');
  const [createdTxn, setCreatedTxn] = useState<Transaction | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Play subtle feedback beep on barcode scan or item add
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 tone
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch (e) {
      // AudioContext not allowed before user gesture
    }
  };

  useEffect(() => {
    if (!currentOrg?._id) return;
    const fetchMeta = async () => {
      try {
        const [iRes, wRes, fRes, fyRes] = await Promise.all([
          apiClient.get(`/organizations/${currentOrg._id}/items`, { params: { limit: 100 } }),
          apiClient.get(`/organizations/${currentOrg._id}/warehouses`),
          apiClient.get(`/organizations/${currentOrg._id}/firms`),
          apiClient.get(`/organizations/${currentOrg._id}/fiscal-years`),
        ]);
        setItems(iRes.data.data || []);

        if (fRes.data?.data?.length > 0) setFirmId(fRes.data.data[0]._id);
        if (wRes.data?.data?.length > 0) setWarehouseId(wRes.data.data[0]._id);
        if (fyRes.data?.data?.length > 0) setFiscalYearId(fyRes.data.data[0]._id);
      } catch (err) {
        console.error('Failed to load POS meta', err);
      }
    };
    fetchMeta();
  }, [currentOrg?._id]);

  const updateActiveCart = (newCart: CartItem[]) => {
    setCarts((prev) => ({
      ...prev,
      [activeCartIndex]: newCart,
    }));
  };

  const addToCart = (item: Item) => {
    playBeep();
    const existingIdx = cart.findIndex((c) => c.item._id === item._id);
    const rate = Number(formatDecimal(item.salePrice));
    if (existingIdx > -1) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      updateActiveCart(updated);
    } else {
      updateActiveCart([...cart, { item, quantity: 1, rate }]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const updated = cart
      .map((c) => {
        if (c.item._id === itemId) {
          const newQty = c.quantity + delta;
          return newQty > 0 ? { ...c, quantity: newQty } : null;
        }
        return c;
      })
      .filter(Boolean) as CartItem[];
    updateActiveCart(updated);
  };

  const subtotal = cart.reduce((acc, c) => acc + c.quantity * c.rate, 0);
  const vatAmount = (subtotal * 13) / 100;
  const grandTotal = subtotal + vatAmount;
  const changeDue = Math.max(0, Number(receivedCash || 0) - grandTotal);

  const handleCheckout = async () => {
    if (cart.length === 0 || !currentOrg?._id || isProcessing) return;
    setIsProcessing(true);

    try {
      const res = await apiClient.post(`/organizations/${currentOrg._id}/transactions`, {
        firmId,
        warehouseId,
        financialYearId: fiscalYearId,
        type: 'pos_invoice',
        partyName: customerName,
        bsDate: '2081-11-20',
        paymentMode: paymentMode === 'fonepay_qr' ? 'bank' : 'cash',
        paidAmount: grandTotal.toFixed(2),
        status: 'posted',
        lines: cart.map((c) => ({
          itemId: c.item._id,
          itemName: c.item.name,
          itemCode: c.item.code,
          quantity: c.quantity.toString(),
          rate: c.rate.toString(),
          discountAmount: '0.00',
          taxRate: '13.00',
        })),
      });

      setCreatedTxn(res.data.data);
      updateActiveCart([]);
      setReceivedCash('');
      setCustomerName('Cash Walk-in Customer');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error processing POS sale');
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredItems = items.filter(
    (i) =>
      i.name.toLowerCase().includes(search.toLowerCase()) ||
      i.code.toLowerCase().includes(search.toLowerCase()) ||
      (i.barcode && i.barcode.includes(search))
  );

  return (
    <div style={styles.container}>
      {/* Left: Product Catalog & Barcode Bar */}
      <div style={styles.catalogSection}>
        {/* Karobar Quick POS Header */}
        <div style={styles.quickPosTopBar}>
          <h2 style={styles.quickPosTitle}>Quick POS</h2>
          <div style={styles.quickPosSearch}>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search items..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.quickPosSearchInput}
            />
          </div>
          <button style={styles.quickPosAddBtn} onClick={() => navigate('/items')}>
            + Add New Item
          </button>
        </div>

        {/* Category Pills */}
        <div style={styles.categoryPillsBar}>
          {[
            { id: 'all', label: 'All Categories' },
            { id: 'general', label: 'General' },
            { id: 'grocery', label: 'Grocery' },
            { id: 'beverages', label: 'Beverages' },
          ].map((cat) => (
            <button
              key={cat.id}
              style={{
                ...styles.categoryPill,
                ...(selectedCategory === cat.id ? styles.categoryPillActive : {}),
              }}
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Product Cards Grid / Empty State */}
        {filteredItems.length > 0 ? (
          <div style={styles.itemGrid}>
            {filteredItems.map((item) => (
              <div
                key={item._id}
                style={styles.itemCard}
                onClick={() => addToCart(item)}
                title="Click to add to bill"
              >
                <div style={styles.itemCardTop}>
                  <span style={styles.itemCode}>{item.code}</span>
                  <span style={styles.itemUnit}>
                    {typeof item.primaryUnitId === 'object' ? item.primaryUnitId.abbreviation : 'PCS'}
                  </span>
                </div>
                <h4 style={styles.itemName}>{item.name}</h4>
                <div style={styles.itemCardBottom}>
                  <div style={styles.itemPrice}>NPR {formatDecimal(item.salePrice)}</div>
                  <button style={styles.addPillBtn}>+ Add</button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Karobar Clean Empty State (Screenshot 2) */
          <div style={styles.emptyCatalogContainer}>
            <div style={styles.emptyIllustrationBox}>
              <span style={{ fontSize: '56px', opacity: 0.7 }}>📁</span>
            </div>
            <h3 style={styles.emptyTitle}>No Items Found</h3>
            <p style={styles.emptySubtitle}>
              You can add a new item & select it for billing
            </p>
            <button style={styles.emptyAddBtn} onClick={() => navigate('/items')}>
              + Add New Item
            </button>
          </div>
        )}
      </div>

      {/* Right: Counter Cart, Multi-Cart Parking & Checkout */}
      <div style={styles.cartSection}>
        {/* Cart Header & Hold Tabs */}
        <div style={styles.cartHeaderTop}>
          <div>
            <h2 style={styles.cartTitle}>⚡ POS Counter Register</h2>
            <div style={styles.vatPill}>Nepal IRD 13% VAT Auto-Calculated</div>
          </div>

          {/* Multi-Cart Parking Tabs */}
          <div style={styles.cartTabs}>
            {[0, 1, 2].map((idx) => {
              const count = carts[idx]?.length || 0;
              return (
                <button
                  key={idx}
                  style={{
                    ...styles.cartTabBtn,
                    ...(activeCartIndex === idx ? styles.cartTabBtnActive : {}),
                  }}
                  onClick={() => setActiveCartIndex(idx)}
                >
                  Cart {idx + 1} {count > 0 && <span style={styles.tabBadge}>{count}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Customer Input */}
        <div style={{ marginBottom: '12px' }}>
          <label style={styles.inputLabel}>Customer Name or Phone</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={styles.customerInput}
            placeholder="Cash Walk-in Customer"
          />
        </div>

        {/* Cart Item List */}
        <div style={styles.cartList}>
          {cart.map((c) => (
            <div key={c.item._id} style={styles.cartItem}>
              <div style={{ flex: 1 }}>
                <div style={styles.cartItemTitle}>{c.item.name}</div>
                <div style={styles.cartItemRate}>@ NPR {formatDecimal(c.rate)}</div>
              </div>
              <div style={styles.qtyControls}>
                <button style={styles.qtyBtn} onClick={() => updateQuantity(c.item._id, -1)}>
                  -
                </button>
                <span style={styles.qtyText}>{c.quantity}</span>
                <button style={styles.qtyBtn} onClick={() => updateQuantity(c.item._id, 1)}>
                  +
                </button>
              </div>
              <div style={styles.cartItemTotal}>
                NPR {formatDecimal(c.quantity * c.rate)}
              </div>
            </div>
          ))}
          {cart.length === 0 && (
            <div style={styles.emptyCart}>
              <div style={{ fontSize: '48px', opacity: 0.6, marginBottom: '12px' }}>📄</div>
              <div style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>No Billing Items</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Select items to record a sale
              </div>
            </div>
          )}
        </div>

        {/* Totals Summary */}
        <div style={styles.cartTotals}>
          <div style={styles.totalsRow}>
            <span>Taxable Subtotal:</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>NPR {formatDecimal(subtotal)}</span>
          </div>
          <div style={styles.totalsRow}>
            <span>Nepal VAT (13%):</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>NPR {formatDecimal(vatAmount)}</span>
          </div>
          <div style={styles.grandTotal}>
            <span>Grand Total:</span>
            <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>NPR {formatDecimal(grandTotal)}</span>
          </div>

          {/* Payment Method Switcher */}
          <div style={styles.paymentMethodTabs}>
            <button
              style={{
                ...styles.pmTab,
                ...(paymentMode === 'cash' ? styles.pmTabActive : {}),
              }}
              onClick={() => setPaymentMode('cash')}
            >
              💵 Cash Tender
            </button>
            <button
              style={{
                ...styles.pmTab,
                ...(paymentMode === 'fonepay_qr' ? styles.pmTabActive : {}),
              }}
              onClick={() => {
                setPaymentMode('fonepay_qr');
                setReceivedCash(grandTotal.toFixed(2));
              }}
            >
              📱 Fonepay / eSewa QR
            </button>
          </div>

          {/* Quick Cash Denomination Shortcuts */}
          {paymentMode === 'cash' && (
            <div style={{ marginTop: '10px' }}>
              <div style={styles.denomRow}>
                <button style={styles.denomBtn} onClick={() => setReceivedCash(grandTotal.toFixed(2))}>
                  Exact
                </button>
                <button style={styles.denomBtn} onClick={() => setReceivedCash('500')}>
                  500
                </button>
                <button style={styles.denomBtn} onClick={() => setReceivedCash('1000')}>
                  1000
                </button>
                <button style={styles.denomBtn} onClick={() => setReceivedCash('2000')}>
                  2000
                </button>
              </div>

              <input
                type="number"
                placeholder="Tendered Amount (NPR)"
                value={receivedCash}
                onChange={(e) => setReceivedCash(e.target.value)}
                style={styles.cashInput}
              />

              {Number(receivedCash) > 0 && (
                <div style={styles.changeDue}>
                  Change Return: <strong>NPR {formatDecimal(changeDue)}</strong>
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            style={{
              ...styles.checkoutBtn,
              opacity: cart.length === 0 || isProcessing ? 0.6 : 1,
            }}
          >
            {isProcessing ? 'Processing Bill...' : '⚡ Complete Sale & Instant Bill (F2)'}
          </button>
        </div>
      </div>

      {createdTxn && (
        <InvoicePreviewModal
          transaction={createdTxn}
          onClose={() => setCreatedTxn(null)}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '20px',
    height: 'calc(100vh - 110px)',
    animation: 'fadeIn 0.2s ease-out',
  },
  catalogSection: {
    flex: 3,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '18px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  quickPosTopBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
    marginBottom: '14px',
  },
  quickPosTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  quickPosSearch: {
    flex: 1,
    maxWidth: '420px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0 12px',
  },
  quickPosSearchInput: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    outline: 'none',
    fontSize: '13px',
    color: '#0f172a',
  },
  quickPosAddBtn: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  categoryPillsBar: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    overflowX: 'auto',
    paddingBottom: '4px',
  },
  categoryPill: {
    padding: '6px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  categoryPillActive: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderColor: '#10b981',
    fontWeight: 700,
  },
  emptyCatalogContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: '40px',
  },
  emptyIllustrationBox: {
    width: '100px',
    height: '100px',
    borderRadius: '24px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  emptySubtitle: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 16px 0',
  },
  emptyAddBtn: {
    padding: '8px 18px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  catalogHeader: {
    display: 'flex',
    gap: '12px',
    marginBottom: '16px',
  },
  searchWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: '#f8fafc',
    border: '1.5px solid #cbd5e1',
    borderRadius: '10px',
    padding: '0 12px',
  },
  barcodeIcon: {
    fontSize: '16px',
  },
  searchBar: {
    flex: 1,
    padding: '10px 0',
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    backgroundColor: 'transparent',
  },
  whSelect: {
    padding: '10px 14px',
    borderRadius: '10px',
    border: '1.5px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: 600,
    backgroundColor: '#ffffff',
  },
  itemGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '12px',
    overflowY: 'auto',
    flex: 1,
    paddingRight: '4px',
  },
  itemCard: {
    padding: '14px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  itemCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  itemCode: {
    fontSize: '10px',
    fontFamily: 'monospace',
    color: '#64748b',
    backgroundColor: '#ffffff',
    padding: '2px 5px',
    borderRadius: '4px',
    border: '1px solid #e2e8f0',
  },
  itemUnit: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#0284c7',
  },
  itemName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 10px 0',
    lineHeight: '1.3',
  },
  itemCardBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemPrice: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#2563eb',
    fontFamily: 'JetBrains Mono, monospace',
  },
  addPillBtn: {
    padding: '4px 8px',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '6px',
    border: '1px solid #bfdbfe',
  },
  cartSection: {
    flex: 2,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cartHeaderTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '14px',
  },
  cartTitle: {
    fontSize: '17px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  vatPill: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#059669',
    marginTop: '2px',
  },
  cartTabs: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#f1f5f9',
    padding: '3px',
    borderRadius: '8px',
  },
  cartTabBtn: {
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  cartTabBtnActive: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  tabBadge: {
    fontSize: '9px',
    fontWeight: 700,
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '1px 5px',
    borderRadius: '999px',
  },
  inputLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    display: 'block',
    marginBottom: '4px',
  },
  customerInput: {
    width: '100%',
    padding: '8px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
  },
  cartList: {
    flex: 1,
    overflowY: 'auto',
    borderTop: '1px solid #f1f5f9',
    borderBottom: '1px solid #f1f5f9',
    padding: '8px 0',
  },
  cartItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f8fafc',
    gap: '10px',
  },
  cartItemTitle: {
    fontWeight: 700,
    fontSize: '13px',
    color: '#0f172a',
  },
  cartItemRate: {
    fontSize: '11px',
    color: '#64748b',
    fontFamily: 'JetBrains Mono, monospace',
  },
  qtyControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  qtyBtn: {
    width: '26px',
    height: '26px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '14px',
  },
  qtyText: {
    fontWeight: 700,
    fontSize: '13px',
    minWidth: '20px',
    textAlign: 'center',
  },
  cartItemTotal: {
    fontWeight: 700,
    fontSize: '13px',
    width: '85px',
    textAlign: 'right',
    fontFamily: 'JetBrains Mono, monospace',
    color: '#0f172a',
  },
  emptyCart: {
    textAlign: 'center',
    color: '#94a3b8',
    padding: '40px 0',
  },
  cartTotals: {
    paddingTop: '12px',
  },
  totalsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '4px',
  },
  grandTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '18px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '6px 0',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '8px',
  },
  paymentMethodTabs: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '6px',
    margin: '10px 0',
  },
  pmTab: {
    padding: '8px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
    textAlign: 'center',
  },
  pmTabActive: {
    backgroundColor: '#eff6ff',
    borderColor: '#2563eb',
    color: '#2563eb',
    fontWeight: 700,
  },
  denomRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '6px',
    marginBottom: '8px',
  },
  denomBtn: {
    padding: '6px 4px',
    fontSize: '12px',
    fontWeight: 700,
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    cursor: 'pointer',
    fontFamily: 'JetBrains Mono, monospace',
  },
  cashInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '16px',
    fontWeight: 700,
    fontFamily: 'JetBrains Mono, monospace',
    outline: 'none',
  },
  changeDue: {
    marginTop: '6px',
    fontSize: '12px',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    padding: '6px 10px',
    borderRadius: '6px',
    textAlign: 'center',
    fontFamily: 'JetBrains Mono, monospace',
  },
  checkoutBtn: {
    width: '100%',
    marginTop: '12px',
    padding: '13px',
    backgroundColor: '#059669',
    color: '#ffffff',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
  },
};
