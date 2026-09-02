import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Transaction } from '../../types/transaction';
import { Party, Item, Firm } from '../../types/master';
import { Warehouse } from '../../types/inventory';
import { formatDecimal } from '../../utils/decimal';
import { DataTable } from '../../components/common/DataTable';
import { Pagination } from '../../components/common/Pagination';
import { InvoicePreviewModal } from './InvoicePreviewModal';

interface TransactionManagerProps {
  moduleType: 'sales' | 'purchases';
}

export const TransactionManager: React.FC<TransactionManagerProps> = ({ moduleType }) => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Preview & Payment Modals
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [paymentTxn, setPaymentTxn] = useState<Transaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');

  // Create Invoice / Bill Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);

  // Form State
  const [txnType, setTxnType] = useState(moduleType === 'sales' ? 'sale_invoice' : 'purchase_bill');
  const [firmId, setFirmId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyPan, setPartyPan] = useState('');
  const [bsDate, setBsDate] = useState('2082-05-18');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'credit' | 'bank' | 'partial'>('credit');
  const [paidAmount, setPaidAmount] = useState('0.00');
  const [notes, setNotes] = useState('');

  // Line items state
  const [lines, setLines] = useState<Array<{ itemId: string; quantity: string; rate: string; discountAmount: string; taxRate: string }>>([
    { itemId: '', quantity: '1', rate: '0.00', discountAmount: '0.00', taxRate: '13.00' },
  ]);

  const fetchDependencies = async () => {
    if (!currentOrg?._id) return;
    try {
      const [fRes, wRes, fyRes, pRes, iRes] = await Promise.all([
        apiClient.get(`/organizations/${currentOrg._id}/firms`),
        apiClient.get(`/organizations/${currentOrg._id}/warehouses`),
        apiClient.get(`/organizations/${currentOrg._id}/fiscal-years`),
        apiClient.get(`/organizations/${currentOrg._id}/parties`, { params: { limit: 100 } }),
        apiClient.get(`/organizations/${currentOrg._id}/items`, { params: { limit: 100 } }),
      ]);

      setFirms(fRes.data.data);
      setWarehouses(wRes.data.data);
      setParties(pRes.data.data);
      setItems(iRes.data.data);

      if (fRes.data.data.length > 0) setFirmId(fRes.data.data[0]._id);
      if (wRes.data.data.length > 0) setWarehouseId(wRes.data.data[0]._id);
      if (fyRes.data.data.length > 0) setFiscalYearId(fyRes.data.data[0]._id);
      if (pRes.data.data.length > 0) {
        setPartyId(pRes.data.data[0]._id);
        setPartyName(pRes.data.data[0].name);
        setPartyPan(pRes.data.data[0].panNumber || '');
      }
      if (iRes.data.data.length > 0) {
        setLines([
          {
            itemId: iRes.data.data[0]._id,
            quantity: '1',
            rate: formatDecimal(moduleType === 'sales' ? iRes.data.data[0].salePrice : iRes.data.data[0].purchasePrice),
            discountAmount: '0.00',
            taxRate: '13.00',
          },
        ]);
      }
    } catch (e) {
      console.error('Failed to load transaction metadata', e);
    }
  };

  const fetchTransactions = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const types = moduleType === 'sales' ? ['sale_invoice', 'pos_invoice', 'sales_return'] : ['purchase_bill', 'purchase_return'];
      const res = await apiClient.get(`/organizations/${currentOrg._id}/transactions`, {
        params: {
          page,
          limit: 10,
          search,
          status: statusFilter,
          type: txnType === 'all' ? undefined : txnType,
        },
      });

      // Filter by module domain
      const filtered = res.data.data.filter((t: Transaction) => types.includes(t.type));
      setTransactions(filtered);
      setTotalPages(res.data.pagination.totalPages);
      setTotalRecords(res.data.pagination.totalRecords);
    } catch (e) {
      console.error('Failed to load transactions', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, [currentOrg?._id]);

  useEffect(() => {
    fetchTransactions();
  }, [currentOrg?._id, page, statusFilter, txnType]);

  const handleLineChange = (index: number, field: string, value: string) => {
    const updated = [...lines];
    (updated[index] as any)[field] = value;

    if (field === 'itemId') {
      const selected = items.find((i) => i._id === value);
      if (selected) {
        updated[index].rate = formatDecimal(moduleType === 'sales' ? selected.salePrice : selected.purchasePrice);
      }
    }
    setLines(updated);
  };

  const addLine = () => {
    if (items.length === 0) return;
    setLines([
      ...lines,
      {
        itemId: items[0]._id,
        quantity: '1',
        rate: formatDecimal(moduleType === 'sales' ? items[0].salePrice : items[0].purchasePrice),
        discountAmount: '0.00',
        taxRate: '13.00',
      },
    ]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?._id) return;
    try {
      await apiClient.post(`/organizations/${currentOrg._id}/transactions`, {
        firmId,
        warehouseId,
        financialYearId: fiscalYearId,
        type: txnType,
        partyId: partyId || undefined,
        partyName,
        partyPan,
        bsDate,
        paymentMode,
        paidAmount,
        notes: notes || undefined,
        lines,
        status: 'posted',
      });
      setShowCreateModal(false);
      fetchTransactions();
      alert('Transaction created and posted successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating transaction');
    }
  };

  const handleCancel = async (txn: Transaction) => {
    const reason = prompt(`Enter cancellation reason for ${txn.documentNumber}:`);
    if (!reason || !currentOrg?._id) return;
    try {
      await apiClient.post(`/organizations/${currentOrg._id}/transactions/${txn._id}/cancel`, { reason });
      fetchTransactions();
      alert('Transaction reversed and cancelled');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error cancelling transaction');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTxn || !currentOrg?._id) return;
    try {
      await apiClient.post(`/organizations/${currentOrg._id}/transactions/${paymentTxn._id}/payment`, {
        amount: paymentAmount,
        paymentMode: 'cash',
      });
      setPaymentTxn(null);
      setPaymentAmount('');
      fetchTransactions();
      alert('Payment booked successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording payment');
    }
  };

  const columns = [
    {
      header: 'Doc #',
      accessor: (t: Transaction) => (
        <span
          onClick={() => setSelectedTxn(t)}
          style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a', cursor: 'pointer', textDecoration: 'underline' }}
        >
          {t.documentNumber}
        </span>
      ),
    },
    {
      header: 'Date (BS)',
      accessor: (t: Transaction) => (
        <div>
          <strong>{t.bsDate}</strong>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(t.date).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      header: 'Party / Counterparty',
      accessor: (t: Transaction) => (
        <div>
          <strong>{t.partyName}</strong>
          {t.partyPan && <div style={{ fontSize: '11px', color: '#64748b' }}>PAN: {t.partyPan}</div>}
        </div>
      ),
    },
    {
      header: 'Grand Total',
      accessor: (t: Transaction) => <strong>NPR {formatDecimal(t.grandTotal)}</strong>,
    },
    {
      header: 'Balance Due',
      accessor: (t: Transaction) => {
        const due = Number(formatDecimal(t.balanceDue));
        return (
          <span style={{ color: due > 0 ? '#dc2626' : '#059669', fontWeight: 600 }}>
            NPR {formatDecimal(t.balanceDue)}
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessor: (t: Transaction) => (
        <span
          style={{
            ...styles.badge,
            backgroundColor: t.status === 'posted' ? '#ecfdf5' : t.status === 'cancelled' ? '#fef2f2' : '#fffbeb',
            color: t.status === 'posted' ? '#059669' : t.status === 'cancelled' ? '#dc2626' : '#d97706',
          }}
        >
          {t.status.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (t: Transaction) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button style={styles.actionBtn} onClick={() => setSelectedTxn(t)}>
            👁️ Preview
          </button>
          {t.status === 'posted' && Number(formatDecimal(t.balanceDue)) > 0 && (
            <button
              style={{ ...styles.actionBtn, backgroundColor: '#ecfdf5', color: '#059669' }}
              onClick={() => {
                setPaymentTxn(t);
                setPaymentAmount(formatDecimal(t.balanceDue));
              }}
            >
              💵 Pay
            </button>
          )}
          {t.status === 'posted' && (
            <button style={{ ...styles.actionBtn, backgroundColor: '#fef2f2', color: '#dc2626' }} onClick={() => handleCancel(t)}>
              ✕ Reverse
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            {moduleType === 'sales' ? 'Sales Invoices & Billing' : 'Purchase Bills & Receiving'}
          </h1>
          <p style={styles.subtitle}>
            {moduleType === 'sales'
              ? 'Issue VAT-compliant tax invoices, manage payments, and dispatch items.'
              : 'Record vendor bills, update cost prices, and receive stock.'}
          </p>
        </div>

        <button style={styles.btnPrimary} onClick={() => setShowCreateModal(true)}>
          + Create {moduleType === 'sales' ? 'Sales Invoice' : 'Purchase Bill'}
        </button>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by doc #, customer, PAN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchTransactions()}
          style={styles.inputSearch}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
          <option value="all">All Statuses</option>
          <option value="posted">Posted</option>
          <option value="draft">Draft</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <DataTable columns={columns} data={transactions} isLoading={loading} />
      <Pagination page={page} totalPages={totalPages} totalRecords={totalRecords} onPageChange={(p) => setPage(p)} />

      {/* Invoice Preview Modal */}
      {selectedTxn && <InvoicePreviewModal transaction={selectedTxn} onClose={() => setSelectedTxn(null)} />}

      {/* Payment Collection Modal */}
      {paymentTxn && (
        <div style={styles.overlay}>
          <div style={styles.modalSmall}>
            <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>
              Record Payment for #{paymentTxn.documentNumber}
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
              Balance Due: NPR {formatDecimal(paymentTxn.balanceDue)}
            </p>
            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600 }}>Payment Amount (NPR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setPaymentTxn(null)} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Save Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Transaction Modal */}
      {showCreateModal && (
        <div style={styles.overlay}>
          <div style={styles.modalLarge}>
            <div style={styles.modalHeader}>
              <h2>New {moduleType === 'sales' ? 'Sales Invoice' : 'Purchase Bill'}</h2>
              <button onClick={() => setShowCreateModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} style={styles.createForm}>
              <div style={styles.formGrid}>
                <div>
                  <label style={styles.label}>Transaction Type</label>
                  <select value={txnType} onChange={(e) => setTxnType(e.target.value)} style={styles.input}>
                    {moduleType === 'sales' ? (
                      <>
                        <option value="sale_invoice">Standard Tax Invoice</option>
                        <option value="pos_invoice">POS Cash Receipt</option>
                        <option value="sales_return">Sales Return (Credit Note)</option>
                      </>
                    ) : (
                      <>
                        <option value="purchase_bill">Purchase Bill</option>
                        <option value="purchase_return">Purchase Return (Debit Note)</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Issuing Firm / Branch</label>
                  <select value={firmId} onChange={(e) => setFirmId(e.target.value)} style={styles.input}>
                    {firms.map((f) => (
                      <option key={f._id} value={f._id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Inventory Storage Location</label>
                  <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} style={styles.input}>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Nepali Date (BS)</label>
                  <input type="text" value={bsDate} onChange={(e) => setBsDate(e.target.value)} style={styles.input} />
                </div>

                <div>
                  <label style={styles.label}>{moduleType === 'sales' ? 'Select Customer' : 'Select Supplier'}</label>
                  <select
                    value={partyId}
                    onChange={(e) => {
                      setPartyId(e.target.value);
                      const p = parties.find((part) => part._id === e.target.value);
                      if (p) {
                        setPartyName(p.name);
                        setPartyPan(p.panNumber || '');
                      }
                    }}
                    style={styles.input}
                  >
                    {parties.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Party Legal Name</label>
                  <input type="text" value={partyName} onChange={(e) => setPartyName(e.target.value)} style={styles.input} />
                </div>
              </div>

              {/* Line Items Builder */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 700 }}>Line Items</h3>
                  <button type="button" onClick={addLine} style={styles.lineAddBtn}>
                    + Add Row
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {lines.map((line, idx) => (
                    <div key={idx} style={styles.lineRow}>
                      <select
                        value={line.itemId}
                        onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                        style={{ ...styles.input, flex: 3 }}
                      >
                        {items.map((i) => (
                          <option key={i._id} value={i._id}>
                            {i.name} ({i.code})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Qty"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                        style={{ ...styles.input, flex: 1 }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Rate"
                        value={line.rate}
                        onChange={(e) => handleLineChange(idx, 'rate', e.target.value)}
                        style={{ ...styles.input, flex: 1 }}
                      />
                      <input
                        type="number"
                        step="0.01"
                        placeholder="Discount"
                        value={line.discountAmount}
                        onChange={(e) => handleLineChange(idx, 'discountAmount', e.target.value)}
                        style={{ ...styles.input, flex: 1 }}
                      />
                      <button type="button" onClick={() => removeLine(idx)} style={styles.lineRemoveBtn}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Settlement summary */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Payment Settlement Mode</label>
                  <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as any)} style={styles.input}>
                    <option value="credit">On Credit (Accounts Receivable)</option>
                    <option value="cash">Full Cash Settlement</option>
                    <option value="bank">Bank / QR Payment</option>
                  </select>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.label}>Immediate Paid Amount (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={styles.label}>Transaction Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Delivered via Transport #TR-402, paid partially by cash"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Post & Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  title: { fontSize: '20px', fontWeight: 700, color: '#0f172a' },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '2px' },
  filterBar: { display: 'flex', gap: '12px', marginBottom: '16px' },
  inputSearch: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '300px', fontSize: '13px' },
  select: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  btnPrimary: { backgroundColor: '#1e3a8a', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600 },
  btnSecondary: { backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', border: '1px solid #cbd5e1' },
  actionBtn: { padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600, border: '1px solid #cbd5e1', backgroundColor: '#ffffff' },
  badge: { fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' },
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '20px' },
  modalSmall: { backgroundColor: '#ffffff', borderRadius: '8px', width: '380px', padding: '24px' },
  modalLarge: { backgroundColor: '#ffffff', borderRadius: '8px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '28px' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: { fontSize: '16px', color: '#64748b' },
  createForm: { display: 'flex', flexDirection: 'column' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' },
  label: { display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '4px' },
  input: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  lineRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  lineAddBtn: { fontSize: '12px', color: '#1e3a8a', fontWeight: 600, background: 'none' },
  lineRemoveBtn: { color: '#dc2626', fontWeight: 700, padding: '6px 10px', background: 'none' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '24px' },
};
