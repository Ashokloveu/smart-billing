import React, { useEffect, useState, useMemo } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { crmService } from '../services/crmService';
import { Quotation } from '../types/crm';
import { Party, Item } from '../../../types/master';
import { apiClient } from '../../../services/apiClient';
import { formatDecimal } from '../../../utils/decimal';
import { numberToEnglishWords } from '../../../utils/nepaliNumber';

export const QuotationListPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);

  // Metadata for creation
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  // Create form state
  const [customerId, setCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPan, setCustomerPan] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [validDays, setValidDays] = useState('15');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<Array<{ itemId: string; quantity: string; rate: string; discountAmount: string }>>([
    { itemId: '', quantity: '1', rate: '0.00', discountAmount: '0.00' },
  ]);

  const fetchDependencies = async () => {
    if (!currentOrg?._id) return;
    try {
      const [pRes, iRes] = await Promise.all([
        apiClient.get(`/organizations/${currentOrg._id}/parties`, { params: { limit: 100 } }),
        apiClient.get(`/organizations/${currentOrg._id}/items`, { params: { limit: 100 } }),
      ]);
      setParties(pRes.data.data || []);
      setItems(iRes.data.data || []);

      if (pRes.data.data?.length > 0) {
        setCustomerId(pRes.data.data[0]._id);
        setCustomerName(pRes.data.data[0].name);
        setCustomerPan(pRes.data.data[0].panNumber || '');
        setCustomerPhone(pRes.data.data[0].phone || '');
      }
      if (iRes.data.data?.length > 0) {
        setLines([
          {
            itemId: iRes.data.data[0]._id,
            quantity: '1',
            rate: formatDecimal(iRes.data.data[0].salePrice),
            discountAmount: '0.00',
          },
        ]);
      }
    } catch (e) {
      console.error('Failed to load quotation dependencies', e);
    }
  };

  const fetchQuotations = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const data = await crmService.getQuotations(currentOrg._id);
      setQuotations(data || []);
    } catch (e) {
      console.error('Failed to load quotations', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
    fetchQuotations();
  }, [currentOrg?._id]);

  // Aggregate stats
  const kpiStats = useMemo(() => {
    const totalVal = quotations.reduce((acc, q) => acc + (Number(formatDecimal(q.grandTotal)) || 0), 0);
    const convertedCount = quotations.filter((q) => q.status === 'converted').length;
    const pendingCount = quotations.filter((q) => q.status !== 'converted').length;
    return {
      totalVal,
      convertedCount,
      pendingCount,
      totalCount: quotations.length,
    };
  }, [quotations]);

  // Form row calculations
  const formSubtotal = useMemo(() => {
    return lines.reduce((acc, l) => {
      const q = Math.max(0, Number(l.quantity) || 0);
      const r = Math.max(0, Number(l.rate) || 0);
      const d = Math.max(0, Number(l.discountAmount) || 0);
      return acc + Math.max(0, q * r - d);
    }, 0);
  }, [lines]);

  const handleLineChange = (index: number, field: string, value: string) => {
    const updated = [...lines];
    (updated[index] as any)[field] = value;

    if (field === 'itemId') {
      const selected = items.find((i) => i._id === value);
      if (selected) {
        updated[index].rate = formatDecimal(selected.salePrice);
      }
    }
    setLines(updated);
  };

  const addLine = () => {
    const defaultItem = items[0]?._id || '';
    const defaultRate = items[0] ? formatDecimal(items[0].salePrice) : '0.00';
    setLines([
      ...lines,
      { itemId: defaultItem, quantity: '1', rate: defaultRate, discountAmount: '0.00' },
    ]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?._id) return;
    if (lines.length === 0 || !lines[0].itemId) {
      alert('Please add at least one item to the estimate.');
      return;
    }

    try {
      const today = new Date();
      const validUntilDate = new Date();
      validUntilDate.setDate(today.getDate() + (Number(validDays) || 15));

      const payloadItems = lines.map((l) => {
        const it = items.find((i) => i._id === l.itemId);
        const q = Number(l.quantity) || 1;
        const r = Number(l.rate) || 0;
        const d = Number(l.discountAmount) || 0;
        const sub = Math.max(0, q * r - d);
        return {
          itemId: l.itemId,
          itemName: it?.name || 'Item',
          quantity: q,
          rate: r,
          discountAmount: d,
          taxRate: 13,
          lineTotal: sub * 1.13,
        };
      });

      await crmService.createQuotation(currentOrg._id, {
        customerId,
        customerName,
        customerPan,
        quotationDate: today.toISOString(),
        validUntil: validUntilDate.toISOString(),
        items: payloadItems,
        notes,
      });

      setShowCreateModal(false);
      fetchQuotations();
      alert('Quotation & Estimate created successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating quotation');
    }
  };

  const handleConvertToOrder = async (id: string) => {
    if (!currentOrg?._id) return;
    if (!window.confirm('Convert this approved quotation directly into a confirmed Sales Order / Tax Invoice?')) return;
    try {
      await crmService.convertToSalesOrder(currentOrg._id, id);
      alert('✓ Quotation converted to Sales Order successfully! You can view it under Sales.');
      fetchQuotations();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error converting quotation');
    }
  };

  const handleWhatsAppShare = (quo: Quotation) => {
    const cleanPhone = customerPhone ? customerPhone.replace(/[^0-9]/g, '') : '';
    const message = `Namaste ${quo.customerName}! 🙏%0AHere is your official Estimate / Quotation *#${quo.quotationNumber}* from *Smart Billing*.%0A%0A*Total Amount:* NPR ${formatDecimal(quo.grandTotal)}%0A*Valid Until:* ${new Date(quo.validUntil).toLocaleDateString()}%0A%0APlease feel free to contact us to confirm your order!`;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(url, '_blank');
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={styles.title}>Customer Quotations & Estimates Studio</h1>
            <span style={styles.tag}>Smart CRM</span>
          </div>
          <p style={styles.subtitle}>
            Create professional cost estimates, track customer proposals, share directly on WhatsApp, and convert to Tax Invoices with 1-click.
          </p>
        </div>

        <button style={styles.btnPrimary} onClick={() => setShowCreateModal(true)}>
          + Create Quotation / Estimate
        </button>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Total Quotations</div>
          <div style={styles.kpiVal}>{kpiStats.totalCount}</div>
          <div style={styles.kpiSub}>Proposals generated</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Pending Acceptance</div>
          <div style={{ ...styles.kpiVal, color: '#f59e0b' }}>{kpiStats.pendingCount}</div>
          <div style={styles.kpiSub}>Under review by clients</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Converted to Orders</div>
          <div style={{ ...styles.kpiVal, color: '#10b981' }}>{kpiStats.convertedCount}</div>
          <div style={styles.kpiSub}>Confirmed business</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiLabel}>Estimated Pipeline Value</div>
          <div style={styles.kpiVal}>NPR {formatDecimal(kpiStats.totalVal)}</div>
          <div style={styles.kpiSub}>Gross proposal sum</div>
        </div>
      </div>

      {/* Table */}
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Quotation #</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Date</th>
              <th style={styles.th}>Valid Until</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Total (NPR)</th>
              <th style={styles.th}>Status</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotations.map((quo) => (
              <tr key={quo._id} style={styles.tr}>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 800, color: '#10b981' }}>
                  {quo.quotationNumber} (v{quo.version})
                </td>
                <td style={styles.td}>
                  <strong style={{ color: '#0f172a' }}>{quo.customerName}</strong>
                  {quo.customerPan && <div style={{ fontSize: '11px', color: '#64748b' }}>PAN: {quo.customerPan}</div>}
                </td>
                <td style={styles.td}>{new Date(quo.quotationDate).toLocaleDateString()}</td>
                <td style={styles.td}>
                  <span style={{ color: new Date(quo.validUntil) < new Date() ? '#dc2626' : '#475569' }}>
                    {new Date(quo.validUntil).toLocaleDateString()}
                  </span>
                </td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, fontFamily: 'monospace' }}>
                  NPR {formatDecimal(quo.grandTotal)}
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusPill,
                      backgroundColor:
                        quo.status === 'converted'
                          ? '#ecfdf5'
                          : quo.status === 'approved'
                          ? '#eff6ff'
                          : '#fffbeb',
                      color:
                        quo.status === 'converted'
                          ? '#059669'
                          : quo.status === 'approved'
                          ? '#2563eb'
                          : '#d97706',
                    }}
                  >
                    {quo.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                    <button
                      style={{ ...styles.actionBtn, backgroundColor: '#f0fdf4', color: '#16a34a' }}
                      onClick={() => handleWhatsAppShare(quo)}
                      title="Send via WhatsApp"
                    >
                      💬 WhatsApp
                    </button>
                    <button
                      style={styles.actionBtn}
                      onClick={() => setSelectedQuotation(quo)}
                      title="View Estimate"
                    >
                      👁️ View
                    </button>
                    {quo.status !== 'converted' && (
                      <button
                        style={{ ...styles.actionBtn, backgroundColor: '#10b981', color: '#ffffff', border: 'none' }}
                        onClick={() => handleConvertToOrder(quo._id)}
                        title="Convert into Confirmed Order / Invoice"
                      >
                        ⚡ Convert to Invoice
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {quotations.length === 0 && !loading && (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '36px' }}>
                  No customer quotations or estimates recorded yet. Click above to create your first quote.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ===================== CREATE QUOTATION MODAL ===================== */}
      {showCreateModal && (
        <div style={styles.overlay}>
          <div style={styles.modalLarge}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Create Customer Quotation / Estimate
                </h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Smart Billing CRM</div>
              </div>
              <button style={styles.closeBtn} onClick={() => setShowCreateModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateQuotation} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={styles.label}>Select Customer</label>
                  <select
                    value={customerId}
                    onChange={(e) => {
                      setCustomerId(e.target.value);
                      const p = parties.find((part) => part._id === e.target.value);
                      if (p) {
                        setCustomerName(p.name);
                        setCustomerPan(p.panNumber || '');
                        setCustomerPhone(p.phone || '');
                      }
                    }}
                    style={styles.input}
                  >
                    {parties.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} {p.phone ? `(${p.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Customer PAN / VAT</label>
                  <input
                    type="text"
                    value={customerPan}
                    onChange={(e) => setCustomerPan(e.target.value)}
                    placeholder="PAN Number"
                    style={styles.input}
                  />
                </div>

                <div>
                  <label style={styles.label}>Validity Period</label>
                  <select value={validDays} onChange={(e) => setValidDays(e.target.value)} style={styles.input}>
                    <option value="7">7 Days</option>
                    <option value="15">15 Days</option>
                    <option value="30">30 Days</option>
                    <option value="60">60 Days</option>
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div style={{ marginBottom: '16px' }}>
                <table style={styles.itemTable}>
                  <thead>
                    <tr style={styles.itemTableHead}>
                      <th style={{ width: '40px', padding: '8px', textAlign: 'center' }}>#</th>
                      <th style={{ padding: '8px', textAlign: 'left' }}>Item / Service</th>
                      <th style={{ width: '90px', padding: '8px', textAlign: 'center' }}>Quantity</th>
                      <th style={{ width: '120px', padding: '8px', textAlign: 'right' }}>Rate (NPR)</th>
                      <th style={{ width: '110px', padding: '8px', textAlign: 'right' }}>Discount</th>
                      <th style={{ width: '120px', padding: '8px', textAlign: 'right' }}>Amount (NPR)</th>
                      <th style={{ width: '40px', padding: '8px', textAlign: 'center' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, idx) => {
                      const q = Number(l.quantity) || 0;
                      const r = Number(l.rate) || 0;
                      const d = Number(l.discountAmount) || 0;
                      const amount = Math.max(0, q * r - d);
                      return (
                        <tr key={idx} style={styles.itemTableRow}>
                          <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                          <td style={{ padding: '6px' }}>
                            <select
                              value={l.itemId}
                              onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                              style={styles.tableInput}
                            >
                              <option value="">-- Choose Item --</option>
                              {items.map((it) => (
                                <option key={it._id} value={it._id}>
                                  {it.name} ({it.code})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={{ padding: '6px' }}>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={l.quantity}
                              onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                              style={{ ...styles.tableInput, textAlign: 'center' }}
                            />
                          </td>
                          <td style={{ padding: '6px' }}>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={l.rate}
                              onChange={(e) => handleLineChange(idx, 'rate', e.target.value)}
                              style={{ ...styles.tableInput, textAlign: 'right' }}
                            />
                          </td>
                          <td style={{ padding: '6px' }}>
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={l.discountAmount}
                              onChange={(e) => handleLineChange(idx, 'discountAmount', e.target.value)}
                              style={{ ...styles.tableInput, textAlign: 'right' }}
                            />
                          </td>
                          <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                            NPR {formatDecimal(amount)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => removeLine(idx)}
                              style={styles.lineTrashBtn}
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <button type="button" onClick={addLine} style={styles.addItemBtn}>
                  + Add Item Row
                </button>
              </div>

              {/* Subtotal & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <div>
                  <label style={styles.label}>Notes & Payment Terms</label>
                  <textarea
                    rows={3}
                    placeholder="e.g. 50% advance upon order confirmation, balance on delivery..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={styles.textarea}
                  />
                </div>

                <div style={styles.totalSummaryCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Subtotal:</span>
                    <strong>NPR {formatDecimal(formSubtotal)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span>Estimated 13% VAT:</span>
                    <strong>NPR {formatDecimal(formSubtotal * 0.13)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, borderTop: '2px solid #e2e8f0', paddingTop: '6px', marginTop: '4px' }}>
                    <span>Grand Estimate:</span>
                    <span style={{ color: '#10b981' }}>NPR {formatDecimal(formSubtotal * 1.13)}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Save & Issue Quotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== VIEW QUOTATION MODAL ===================== */}
      {selectedQuotation && (
        <div style={styles.overlay}>
          <div style={styles.modalLarge}>
            <div style={styles.modalHeader}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Quotation #{selectedQuotation.quotationNumber}
                </h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Issued: {new Date(selectedQuotation.quotationDate).toLocaleDateString()} • Valid Until: {new Date(selectedQuotation.validUntil).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  style={{ ...styles.actionBtn, backgroundColor: '#25D366', color: '#ffffff', border: 'none', padding: '6px 12px' }}
                  onClick={() => handleWhatsAppShare(selectedQuotation)}
                >
                  💬 WhatsApp
                </button>
                <button style={styles.closeBtn} onClick={() => setSelectedQuotation(null)}>
                  ✕
                </button>
              </div>
            </div>

            <div style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Quoted For:</div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{selectedQuotation.customerName}</div>
                  {selectedQuotation.customerPan && <div style={{ fontSize: '12px', color: '#64748b' }}>PAN: {selectedQuotation.customerPan}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Status:</div>
                  <span style={{ ...styles.statusPill, backgroundColor: '#eff6ff', color: '#2563eb', marginTop: '4px', display: 'inline-block' }}>
                    {selectedQuotation.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Items */}
              <table style={styles.itemTable}>
                <thead>
                  <tr style={styles.itemTableHead}>
                    <th style={{ padding: '8px', textAlign: 'left' }}>Item Description</th>
                    <th style={{ width: '80px', padding: '8px', textAlign: 'center' }}>Qty</th>
                    <th style={{ width: '100px', padding: '8px', textAlign: 'right' }}>Rate</th>
                    <th style={{ width: '90px', padding: '8px', textAlign: 'right' }}>Discount</th>
                    <th style={{ width: '110px', padding: '8px', textAlign: 'right' }}>Total (NPR)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedQuotation.items?.map((it, idx) => (
                    <tr key={idx} style={styles.itemTableRow}>
                      <td style={{ padding: '8px', fontWeight: 600 }}>{it.itemName}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{formatDecimal(it.quantity)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatDecimal(it.rate)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontFamily: 'monospace' }}>{formatDecimal(it.discountAmount)}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>{formatDecimal(it.totalAmount || (it as any).lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '2px solid #f1f5f9', paddingTop: '16px' }}>
                <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#10b981', fontWeight: 600 }}>
                  In Words: {numberToEnglishWords(selectedQuotation.grandTotal)}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>
                  Grand Total: NPR {formatDecimal(selectedQuotation.grandTotal)}
                </div>
              </div>

              {selectedQuotation.status !== 'converted' && (
                <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    style={{ ...styles.btnPrimary, backgroundColor: '#10b981' }}
                    onClick={() => {
                      handleConvertToOrder(selectedQuotation._id);
                      setSelectedQuotation(null);
                    }}
                  >
                    ⚡ Convert this Quotation into Sales Invoice
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  tag: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    fontSize: '11px',
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid #a7f3d0',
  },
  btnPrimary: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    padding: '9px 18px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    color: '#334155',
    padding: '9px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  kpiLabel: { fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' },
  kpiVal: { fontSize: '18px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', margin: '4px 0' },
  kpiSub: { fontSize: '11px', color: '#94a3b8' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' },
  th: { padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 14px', fontSize: '13px' },
  statusPill: { fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' },
  actionBtn: {
    padding: '4px 8px',
    borderRadius: '5px',
    border: '1px solid #cbd5e1',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(3px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 120,
    padding: '20px',
  },
  modalLarge: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '860px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#fafafa',
  },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' },
  input: {
    width: '100%',
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    boxSizing: 'border-box',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  itemTable: {
    width: '100%',
    borderCollapse: 'collapse',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  itemTableHead: { backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', fontSize: '11px', fontWeight: 700, color: '#475569' },
  itemTableRow: { borderBottom: '1px solid #f1f5f9' },
  tableInput: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: '5px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    boxSizing: 'border-box',
    outline: 'none',
  },
  lineTrashBtn: { background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#dc2626' },
  addItemBtn: {
    marginTop: '10px',
    background: 'none',
    border: 'none',
    color: '#10b981',
    fontWeight: 700,
    fontSize: '13px',
    cursor: 'pointer',
  },
  totalSummaryCard: {
    backgroundColor: '#f8fafc',
    padding: '16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
};
