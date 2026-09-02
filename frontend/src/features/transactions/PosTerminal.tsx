import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Item } from '../../types/master';
import { Warehouse } from '../../types/inventory';
import { formatDecimal } from '../../utils/decimal';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { Transaction } from '../../types/transaction';

export const PosTerminal: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [items, setItems] = useState<Item[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [fiscalYearId, setFiscalYearId] = useState('');

  // Selected contexts
  const [firmId, setFirmId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('Cash Walk-in Customer');

  // Cart
  const [cart, setCart] = useState<Array<{ item: Item; quantity: number; rate: number }>>([]);
  const [receivedCash, setReceivedCash] = useState<string>('');
  const [createdTxn, setCreatedTxn] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!currentOrg?._id) return;
    const fetchMeta = async () => {
      const [iRes, wRes, fRes, fyRes] = await Promise.all([
        apiClient.get(`/organizations/${currentOrg._id}/items`, { params: { limit: 100 } }),
        apiClient.get(`/organizations/${currentOrg._id}/warehouses`),
        apiClient.get(`/organizations/${currentOrg._id}/firms`),
        apiClient.get(`/organizations/${currentOrg._id}/fiscal-years`),
      ]);
      setItems(iRes.data.data);
      setWarehouses(wRes.data.data);

      if (fRes.data.data.length > 0) setFirmId(fRes.data.data[0]._id);
      if (wRes.data.data.length > 0) setWarehouseId(wRes.data.data[0]._id);
      if (fyRes.data.data.length > 0) setFiscalYearId(fyRes.data.data[0]._id);
    };
    fetchMeta();
  }, [currentOrg?._id]);

  const addToCart = (item: Item) => {
    const existingIdx = cart.findIndex((c) => c.item._id === item._id);
    const rate = Number(formatDecimal(item.salePrice));
    if (existingIdx > -1) {
      const updated = [...cart];
      updated[existingIdx].quantity += 1;
      setCart(updated);
    } else {
      setCart([...cart, { item, quantity: 1, rate }]);
    }
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(
      cart
        .map((c) => {
          if (c.item._id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as any
    );
  };

  const subtotal = cart.reduce((acc, c) => acc + c.quantity * c.rate, 0);
  const vatAmount = (subtotal * 13) / 100;
  const grandTotal = subtotal + vatAmount;
  const changeDue = Math.max(0, Number(receivedCash || 0) - grandTotal);

  const handleCheckout = async () => {
    if (cart.length === 0 || !currentOrg?._id) return;
    try {
      const res = await apiClient.post(`/organizations/${currentOrg._id}/transactions`, {
        firmId,
        warehouseId,
        financialYearId: fiscalYearId,
        type: 'pos_invoice',
        partyName: customerName,
        bsDate: '2082-05-18',
        paymentMode: 'cash',
        paidAmount: grandTotal.toFixed(2),
        status: 'posted',
        lines: cart.map((c) => ({
          itemId: c.item._id,
          quantity: c.quantity.toString(),
          rate: c.rate.toString(),
          discountAmount: '0.00',
          taxRate: '13.00',
        })),
      });

      setCreatedTxn(res.data.data);
      setCart([]);
      setReceivedCash('');
      alert(`POS Invoice ${res.data.data.documentNumber} generated successfully!`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error processing POS sale');
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
      {/* Catalog Grid */}
      <div style={styles.catalogSection}>
        <div style={styles.catalogHeader}>
          <input
            type="text"
            placeholder="Scan barcode or search SKU/Item..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchBar}
          />
          <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} style={styles.whSelect}>
            {warehouses.map((w) => (
              <option key={w._id} value={w._id}>
                Store: {w.name}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.itemGrid}>
          {filteredItems.map((item) => (
            <div key={item._id} style={styles.itemCard} onClick={() => addToCart(item)}>
              <span style={styles.itemCode}>{item.code}</span>
              <h4 style={styles.itemName}>{item.name}</h4>
              <div style={styles.itemPrice}>NPR {formatDecimal(item.salePrice)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Cart & Billing Section */}
      <div style={styles.cartSection}>
        <div style={styles.cartHeader}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>POS Register</h2>
          <span style={styles.vatPill}>Nepal 13% VAT</span>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>Customer</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            style={styles.customerInput}
          />
        </div>

        {/* Cart Item List */}
        <div style={styles.cartList}>
          {cart.map((c) => (
            <div key={c.item._id} style={styles.cartItem}>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '13px' }}>{c.item.name}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>@ NPR {c.rate.toFixed(2)}</div>
              </div>
              <div style={styles.qtyControls}>
                <button style={styles.qtyBtn} onClick={() => updateQuantity(c.item._id, -1)}>
                  -
                </button>
                <span style={{ fontWeight: 700 }}>{c.quantity}</span>
                <button style={styles.qtyBtn} onClick={() => updateQuantity(c.item._id, 1)}>
                  +
                </button>
              </div>
              <div style={{ fontWeight: 700, fontSize: '13px', width: '80px', textAlign: 'right' }}>
                NPR {(c.quantity * c.rate).toFixed(2)}
              </div>
            </div>
          ))}
          {cart.length === 0 && <div style={styles.emptyCart}>Cart is empty. Tap items on the left to bill.</div>}
        </div>

        {/* Totals Summary */}
        <div style={styles.cartTotals}>
          <div style={styles.totalsRow}>
            <span>Subtotal:</span>
            <span>NPR {subtotal.toFixed(2)}</span>
          </div>
          <div style={styles.totalsRow}>
            <span>VAT (13%):</span>
            <span>NPR {vatAmount.toFixed(2)}</span>
          </div>
          <div style={styles.grandTotal}>
            <span>Grand Total:</span>
            <span>NPR {grandTotal.toFixed(2)}</span>
          </div>

          <div style={{ marginTop: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600 }}>Tendered Cash (NPR)</label>
            <input
              type="number"
              placeholder="e.g. 1000"
              value={receivedCash}
              onChange={(e) => setReceivedCash(e.target.value)}
              style={styles.cashInput}
            />
          </div>

          {Number(receivedCash) > 0 && (
            <div style={styles.changeDue}>
              Change to Return: <strong>NPR {changeDue.toFixed(2)}</strong>
            </div>
          )}

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            style={{ ...styles.checkoutBtn, opacity: cart.length === 0 ? 0.6 : 1 }}
          >
            ⚡ Complete Sale & Print (Cash)
          </button>
        </div>
      </div>

      {createdTxn && <InvoicePreviewModal transaction={createdTxn} onClose={() => setCreatedTxn(null)} />}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', gap: '20px', height: 'calc(100vh - 120px)' },
  catalogSection: { flex: 3, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '16px' },
  catalogHeader: { display: 'flex', gap: '12px', marginBottom: '16px' },
  searchBar: { flex: 1, padding: '10px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px' },
  whSelect: { padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  itemGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '12px', overflowY: 'auto', flex: 1 },
  itemCard: { padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', cursor: 'pointer', transition: 'transform 0.1s' },
  itemCode: { fontSize: '11px', fontFamily: 'monospace', color: '#64748b' },
  itemName: { fontSize: '13px', fontWeight: 700, color: '#0f172a', margin: '4px 0 8px 0' },
  itemPrice: { fontSize: '14px', fontWeight: 700, color: '#1e3a8a' },
  cartSection: { flex: 2, display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' },
  cartHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' },
  vatPill: { fontSize: '11px', fontWeight: 700, color: '#1e3a8a', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '4px' },
  customerInput: { width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  cartList: { flex: 1, overflowY: 'auto', borderTop: '1px solid #f1f5f9', borderBottom: '1px solid #f1f5f9', padding: '10px 0' },
  cartItem: { display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f8fafc' },
  qtyControls: { display: 'flex', alignItems: 'center', gap: '8px' },
  qtyBtn: { width: '26px', height: '26px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', cursor: 'pointer', fontWeight: 700 },
  emptyCart: { textAlign: 'center', color: '#94a3b8', fontSize: '13px', padding: '40px 0' },
  cartTotals: { paddingTop: '14px' },
  totalsRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginBottom: '4px' },
  grandTotal: { display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '8px 0', borderTop: '1px solid #e2e8f0', paddingTop: '8px' },
  cashInput: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '16px', fontWeight: 700, marginTop: '4px' },
  changeDue: { marginTop: '8px', fontSize: '13px', color: '#059669', backgroundColor: '#ecfdf5', padding: '8px', borderRadius: '6px', textAlign: 'center' },
  checkoutBtn: { width: '100%', marginTop: '12px', padding: '14px', backgroundColor: '#059669', color: '#ffffff', borderRadius: '8px', fontSize: '15px', fontWeight: 700, border: 'none', cursor: 'pointer' },
};
