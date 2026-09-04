import React, { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Transaction } from '../../types/transaction';
import { Party, Item, Firm } from '../../types/master';
import { Warehouse } from '../../types/inventory';
import { formatDecimal } from '../../utils/decimal';
import { numberToEnglishWords } from '../../utils/nepaliNumber';
import { DataTable } from '../../components/common/DataTable';
import { Pagination } from '../../components/common/Pagination';
import { InvoicePreviewModal } from './InvoicePreviewModal';
import { KarobarEmptyState } from '../../components/common/KarobarEmptyState';

interface TransactionManagerProps {
  moduleType: 'sales' | 'purchases';
}

interface LineItemForm {
  itemId: string;
  quantity: string;
  rate: string;
  discountType: 'flat' | 'percent';
  discountValue: string;
  discountAmount: string;
  taxRate: string;
  isTaxable: boolean;
}

export const TransactionManager: React.FC<TransactionManagerProps> = ({ moduleType }) => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const location = useLocation();

  // Detect route specialization
  const isReturnRoute = location.pathname.includes('/return');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'paid' | 'credit' | 'partial'>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');

  // Modals state
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [paymentTxn, setPaymentTxn] = useState<Transaction | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank'>('cash');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNewPartyModal, setShowNewPartyModal] = useState(false);

  // Metadata
  const [firms, setFirms] = useState<Firm[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [fiscalYearId, setFiscalYearId] = useState('');
  const [parties, setParties] = useState<Party[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});

  // Form State
  const defaultTxnType = moduleType === 'sales'
    ? (isReturnRoute ? 'sales_return' : 'sale_invoice')
    : (isReturnRoute ? 'purchase_return' : 'purchase_bill');

  const [txnType, setTxnType] = useState<string>(defaultTxnType);
  const [firmId, setFirmId] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [partyName, setPartyName] = useState('');
  const [partyPan, setPartyPan] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [bsDate, setBsDate] = useState('2082-05-19');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'credit' | 'bank' | 'partial'>('credit');
  const [paidAmount, setPaidAmount] = useState('0.00');
  const [notes, setNotes] = useState('');

  // Quick Party Form
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyPhone, setNewPartyPhone] = useState('');
  const [newPartyPan, setNewPartyPan] = useState('');
  const [newPartyCity, setNewPartyCity] = useState('');

  // Line Items
  const [lines, setLines] = useState<LineItemForm[]>([
    {
      itemId: '',
      quantity: '1',
      rate: '0.00',
      discountType: 'flat',
      discountValue: '0.00',
      discountAmount: '0.00',
      taxRate: '13.00',
      isTaxable: true,
    },
  ]);

  // Calculations
  const calculatedTotals = useMemo(() => {
    let gross = 0;
    let totalDiscount = 0;
    let taxable = 0;
    let nonTaxable = 0;
    let vat = 0;

    lines.forEach((line) => {
      const q = Math.max(0, Number(line.quantity) || 0);
      const r = Math.max(0, Number(line.rate) || 0);
      const rowGross = q * r;

      let disc = 0;
      if (line.discountType === 'percent') {
        const pct = Math.max(0, Number(line.discountValue) || 0);
        disc = (rowGross * pct) / 100;
      } else {
        disc = Math.max(0, Number(line.discountValue) || 0);
      }
      if (disc > rowGross) disc = rowGross;

      const rowNet = rowGross - disc;
      gross += rowGross;
      totalDiscount += disc;

      if (line.isTaxable) {
        taxable += rowNet;
        vat += rowNet * 0.13;
      } else {
        nonTaxable += rowNet;
      }
    });

    const grand = taxable + vat + nonTaxable;
    const paid = Math.max(0, Number(paidAmount) || 0);
    const balance = Math.max(0, grand - paid);

    return {
      gross,
      totalDiscount,
      taxable,
      nonTaxable,
      vat,
      grand,
      balance,
    };
  }, [lines, paidAmount]);

  // Selected party object
  const selectedParty = useMemo(() => {
    return parties.find((p) => p._id === partyId);
  }, [parties, partyId]);

  // Dependencies Fetch
  const fetchDependencies = async () => {
    if (!currentOrg?._id) return;
    try {
      const [fRes, wRes, fyRes, pRes, iRes, balRes] = await Promise.all([
        apiClient.get(`/organizations/${currentOrg._id}/firms`),
        apiClient.get(`/organizations/${currentOrg._id}/warehouses`),
        apiClient.get(`/organizations/${currentOrg._id}/fiscal-years`),
        apiClient.get(`/organizations/${currentOrg._id}/parties`, { params: { limit: 200 } }),
        apiClient.get(`/organizations/${currentOrg._id}/items`, { params: { limit: 200 } }),
        apiClient.get(`/organizations/${currentOrg._id}/inventory/balances`, { params: { limit: 300 } }).catch(() => ({ data: { data: [] } })),
      ]);

      setFirms(fRes.data.data || []);
      setWarehouses(wRes.data.data || []);
      setParties(pRes.data.data || []);
      setItems(iRes.data.data || []);

      // Build stock map
      const sm: Record<string, number> = {};
      if (balRes.data?.data) {
        balRes.data.data.forEach((b: any) => {
          const itId = typeof b.itemId === 'object' ? b.itemId?._id : b.itemId;
          if (itId) sm[itId] = (sm[itId] || 0) + (Number(b.quantity) || 0);
        });
      }
      setStockMap(sm);

      if (fRes.data.data?.length > 0) setFirmId(fRes.data.data[0]._id);
      if (wRes.data.data?.length > 0) setWarehouseId(wRes.data.data[0]._id);
      if (fyRes.data.data?.length > 0) setFiscalYearId(fyRes.data.data[0]._id);
      if (pRes.data.data?.length > 0) {
        setPartyId(pRes.data.data[0]._id);
        setPartyName(pRes.data.data[0].name);
        setPartyPan(pRes.data.data[0].panNumber || '');
        setPartyPhone(pRes.data.data[0].phone || '');
      }
      if (iRes.data.data?.length > 0) {
        const first = iRes.data.data[0];
        setLines([
          {
            itemId: first._id,
            quantity: '1',
            rate: formatDecimal(moduleType === 'sales' ? first.salePrice : first.purchasePrice),
            discountType: 'flat',
            discountValue: '0.00',
            discountAmount: '0.00',
            taxRate: '13.00',
            isTaxable: true,
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
      const types = moduleType === 'sales'
        ? isReturnRoute ? ['sales_return'] : ['sale_invoice', 'pos_invoice', 'sales_return']
        : isReturnRoute ? ['purchase_return'] : ['purchase_bill', 'purchase_return'];

      const res = await apiClient.get(`/organizations/${currentOrg._id}/transactions`, {
        params: {
          page,
          limit: 15,
          search,
          status: statusFilter === 'all' ? undefined : statusFilter,
          type: txnType === 'all' ? undefined : txnType,
        },
      });

      const filtered = (res.data.data || []).filter((t: Transaction) => types.includes(t.type));
      setTransactions(filtered);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.totalRecords || filtered.length);
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
  }, [currentOrg?._id, page, statusFilter, txnType, isReturnRoute]);

  // Line item field handler
  const handleLineChange = (index: number, field: keyof LineItemForm, value: any) => {
    const updated = [...lines];
    (updated[index] as any)[field] = value;

    if (field === 'itemId') {
      const selected = items.find((i) => i._id === value);
      if (selected) {
        updated[index].rate = formatDecimal(moduleType === 'sales' ? selected.salePrice : selected.purchasePrice);
      }
    }

    // Recompute discountAmount
    const q = Math.max(0, Number(updated[index].quantity) || 0);
    const r = Math.max(0, Number(updated[index].rate) || 0);
    const rowGross = q * r;

    let computedDisc = 0;
    if (updated[index].discountType === 'percent') {
      const pct = Math.max(0, Number(updated[index].discountValue) || 0);
      computedDisc = (rowGross * pct) / 100;
    } else {
      computedDisc = Math.max(0, Number(updated[index].discountValue) || 0);
    }
    if (computedDisc > rowGross) computedDisc = rowGross;
    updated[index].discountAmount = computedDisc.toFixed(2);

    setLines(updated);
  };

  const addLine = () => {
    const defaultItem = items[0]?._id || '';
    const defaultRate = items[0]
      ? formatDecimal(moduleType === 'sales' ? items[0].salePrice : items[0].purchasePrice)
      : '0.00';

    setLines([
      ...lines,
      {
        itemId: defaultItem,
        quantity: '1',
        rate: defaultRate,
        discountType: 'flat',
        discountValue: '0.00',
        discountAmount: '0.00',
        taxRate: '13.00',
        isTaxable: true,
      },
    ]);
  };

  const duplicateLine = (idx: number) => {
    const itemToClone = { ...lines[idx] };
    const updated = [...lines];
    updated.splice(idx + 1, 0, itemToClone);
    setLines(updated);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 1) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  // Quick Party Creation Handler
  const handleCreateParty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?._id || !newPartyName.trim()) return;

    try {
      const res = await apiClient.post(`/organizations/${currentOrg._id}/parties`, {
        name: newPartyName.trim(),
        phone: newPartyPhone.trim() || '9800000000',
        panNumber: newPartyPan.trim() || undefined,
        type: moduleType === 'sales' ? 'customer' : 'supplier',
        billingAddress: {
          city: newPartyCity.trim() || 'Kathmandu',
          district: 'Kathmandu',
          province: 'Bagmati',
        },
      });

      const createdParty = res.data.data;
      setParties((prev) => [createdParty, ...prev]);
      setPartyId(createdParty._id);
      setPartyName(createdParty.name);
      setPartyPan(createdParty.panNumber || '');
      setPartyPhone(createdParty.phone || '');
      setShowNewPartyModal(false);
      setNewPartyName('');
      setNewPartyPhone('');
      setNewPartyPan('');
      setNewPartyCity('');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating party');
    }
  };

  // Create Transaction
  const handleCreate = async (e: React.FormEvent, andPrint = false) => {
    e.preventDefault();
    if (!currentOrg?._id) return;
    if (lines.length === 0 || !lines[0].itemId) {
      alert('Please select at least one item.');
      return;
    }

    try {
      const payloadLines = lines.map((l) => ({
        itemId: l.itemId,
        quantity: l.quantity,
        rate: l.rate,
        discountAmount: l.discountAmount,
        taxRate: l.isTaxable ? '13.00' : '0.00',
      }));

      const res = await apiClient.post(`/organizations/${currentOrg._id}/transactions`, {
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
        lines: payloadLines,
        status: 'posted',
      });

      setShowCreateModal(false);
      fetchTransactions();

      if (andPrint && res.data.data) {
        setSelectedTxn(res.data.data);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating document');
    }
  };

  // Duplicate Existing Transaction
  const handleDuplicateTxn = (txn: Transaction) => {
    const pId = typeof txn.partyId === 'object' ? txn.partyId._id : txn.partyId || '';
    setPartyId(pId);
    setPartyName(txn.partyName || '');
    setPartyPan(txn.partyPan || '');
    setPartyPhone(typeof txn.partyId === 'object' ? txn.partyId.phone || '' : '');
    setPaymentMode(txn.paymentMode || 'credit');
    setPaidAmount('0.00');

    if (txn.lines && txn.lines.length > 0) {
      setLines(
        txn.lines.map((l) => ({
          itemId: l.itemId,
          quantity: formatDecimal(l.quantity),
          rate: formatDecimal(l.rate),
          discountType: 'flat',
          discountValue: formatDecimal(l.discountAmount),
          discountAmount: formatDecimal(l.discountAmount),
          taxRate: formatDecimal(l.taxRate || '13.00'),
          isTaxable: Number(formatDecimal(l.taxRate || '0')) > 0,
        }))
      );
    }
    setShowCreateModal(true);
  };

  const handleCancel = async (txn: Transaction) => {
    const reason = prompt(`Enter cancellation / credit note reason for ${txn.documentNumber}:`);
    if (!reason || !currentOrg?._id) return;
    try {
      await apiClient.post(`/organizations/${currentOrg._id}/transactions/${txn._id}/cancel`, { reason });
      fetchTransactions();
      alert('Transaction reversed and cancelled successfully.');
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
        paymentMode: paymentMethod,
      });
      setPaymentTxn(null);
      setPaymentAmount('');
      fetchTransactions();
      alert('Payment collected & ledger reconciled successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording payment');
    }
  };

  // Quick 1-click WhatsApp share
  const handleQuickWhatsApp = (t: Transaction) => {
    const phone = typeof t.partyId === 'object' ? t.partyId?.phone : '';
    const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
    const docTitle = t.type === 'sale_invoice' ? 'Tax Invoice' : 'Purchase Bill';
    const msg = `Namaste ${t.partyName || 'Customer'}! 🙏%0AHere is your *${docTitle} #${t.documentNumber}* from *Smart Billing*.%0A%0A*Date:* ${t.bsDate} BS%0A*Total:* NPR ${formatDecimal(t.grandTotal)}%0A*Balance Due:* NPR ${formatDecimal(t.balanceDue)}%0A%0AThank you!`;
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
    window.open(url, '_blank');
  };

  // Filtered transactions
  const displayedTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (paymentFilter === 'paid') {
        return Number(formatDecimal(t.balanceDue)) <= 0;
      }
      if (paymentFilter === 'credit' || paymentFilter === 'partial') {
        return Number(formatDecimal(t.balanceDue)) > 0;
      }
      return true;
    });
  }, [transactions, paymentFilter]);

  // Aggregate stats
  const kpiStats = useMemo(() => {
    const totalAmount = transactions.reduce((acc, t) => acc + (Number(formatDecimal(t.grandTotal)) || 0), 0);
    const totalSettled = transactions.reduce((acc, t) => acc + (Number(formatDecimal(t.paidAmount)) || 0), 0);
    const totalDue = transactions.reduce((acc, t) => acc + (Number(formatDecimal(t.balanceDue)) || 0), 0);
    const count = transactions.length;

    return { totalAmount, totalSettled, totalDue, count };
  }, [transactions]);

  const columns = [
    {
      header: 'Doc #',
      accessor: (t: Transaction) => (
        <div>
          <span
            onClick={() => setSelectedTxn(t)}
            style={{ fontFamily: 'monospace', fontWeight: 700, color: '#10b981', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {t.documentNumber}
          </span>
          <div style={{ fontSize: '10px', color: '#64748b' }}>
            {t.type === 'sale_invoice' ? 'Tax Invoice' : t.type === 'pos_invoice' ? 'POS Receipt' : t.type === 'sales_return' ? 'Credit Note' : 'Vendor Bill'}
          </div>
        </div>
      ),
    },
    {
      header: 'Date (BS / AD)',
      accessor: (t: Transaction) => (
        <div>
          <strong style={{ color: '#0f172a' }}>{t.bsDate} BS</strong>
          <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(t.date).toLocaleDateString()}</div>
        </div>
      ),
    },
    {
      header: moduleType === 'sales' ? 'Customer / Buyer' : 'Supplier / Vendor',
      accessor: (t: Transaction) => (
        <div>
          <strong style={{ color: '#1e293b' }}>{t.partyName || 'Walk-in Cash'}</strong>
          {t.partyPan && <div style={{ fontSize: '11px', color: '#64748b' }}>PAN: {t.partyPan}</div>}
        </div>
      ),
    },
    {
      header: 'Grand Total',
      accessor: (t: Transaction) => <strong style={{ color: '#0f172a', fontFamily: 'monospace' }}>NPR {formatDecimal(t.grandTotal)}</strong>,
    },
    {
      header: 'Balance Due',
      accessor: (t: Transaction) => {
        const due = Number(formatDecimal(t.balanceDue));
        return (
          <div>
            <span style={{ color: due > 0 ? '#dc2626' : '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>
              NPR {formatDecimal(t.balanceDue)}
            </span>
            {due > 0 && <div style={{ fontSize: '10px', color: '#dc2626', fontWeight: 600 }}>● Pending Udharo</div>}
          </div>
        );
      },
    },
    {
      header: 'Status',
      accessor: (t: Transaction) => {
        const isPaid = Number(formatDecimal(t.balanceDue)) <= 0;
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                ...styles.badge,
                backgroundColor: t.status === 'posted' ? '#ecfdf5' : t.status === 'cancelled' ? '#fef2f2' : '#fffbeb',
                color: t.status === 'posted' ? '#059669' : t.status === 'cancelled' ? '#dc2626' : '#d97706',
              }}
            >
              {t.status.toUpperCase()}
            </span>
            {t.status === 'posted' && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: '3px',
                  backgroundColor: isPaid ? '#ecfdf5' : '#fef2f2',
                  color: isPaid ? '#059669' : '#dc2626',
                  textAlign: 'center',
                }}
              >
                {isPaid ? 'PAID' : 'DUE'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessor: (t: Transaction) => (
        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          <button style={styles.actionBtn} onClick={() => setSelectedTxn(t)} title="View & Print Invoice">
            👁️ Preview
          </button>
          <button style={{ ...styles.actionBtn, backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }} onClick={() => handleQuickWhatsApp(t)} title="Share via WhatsApp">
            💬 WhatsApp
          </button>
          <button style={styles.actionBtn} onClick={() => handleDuplicateTxn(t)} title="Clone / Duplicate Invoice">
            ⧉ Duplicate
          </button>
          {t.status === 'posted' && Number(formatDecimal(t.balanceDue)) > 0 && (
            <button
              style={{ ...styles.actionBtn, backgroundColor: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}
              onClick={() => {
                setPaymentTxn(t);
                setPaymentAmount(formatDecimal(t.balanceDue));
              }}
              title="Record Balance Collection"
            >
              💵 Collect
            </button>
          )}
          {t.status === 'posted' && (
            <button
              style={{ ...styles.actionBtn, backgroundColor: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}
              onClick={() => handleCancel(t)}
              title="Reverse Transaction"
            >
              ✕ Reverse
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={styles.container}>
      {/* Top Banner & Header */}
      <div style={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={styles.title}>
              {moduleType === 'sales'
                ? isReturnRoute
                  ? 'Sales Returns & Credit Notes'
                  : 'Sales Invoices & Billing Studio'
                : isReturnRoute
                ? 'Purchase Returns & Debit Notes'
                : 'Purchase Bills & Receiving'}
            </h1>
            <span style={styles.proTag}>Smart Studio</span>
          </div>
          <p style={styles.subtitle}>
            {moduleType === 'sales'
              ? 'Issue VAT-compliant tax invoices, track customer Udharo, print thermal slips & share via WhatsApp.'
              : 'Record supplier tax bills, manage cost prices, update warehouse inventory and track payables.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={styles.btnSecondary}
            onClick={() => {
              const headers = ['DocNumber', 'DateBS', 'Party', 'GrandTotal', 'BalanceDue', 'Status'];
              const rows = transactions.map((t) => [
                t.documentNumber,
                t.bsDate,
                `"${t.partyName || ''}"`,
                formatDecimal(t.grandTotal),
                formatDecimal(t.balanceDue),
                t.status,
              ]);
              const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement('a');
              link.setAttribute('href', encodedUri);
              link.setAttribute('download', `SmartBilling_${moduleType}_${Date.now()}.csv`);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            📥 Export CSV
          </button>
          <button
            style={styles.btnPrimary}
            onClick={() => {
              setTxnType(defaultTxnType);
              setShowCreateModal(true);
            }}
          >
            + Create {moduleType === 'sales' ? (isReturnRoute ? 'Sales Return' : 'Sales Invoice') : isReturnRoute ? 'Purchase Return' : 'Purchase Bill'}
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Total {moduleType === 'sales' ? 'Sales Volume' : 'Purchases Volume'}</span>
            <span style={{ fontSize: '18px' }}>📈</span>
          </div>
          <div style={styles.kpiValue}>NPR {formatDecimal(kpiStats.totalAmount)}</div>
          <div style={styles.kpiSub}>Across {kpiStats.count} recorded documents</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Total {moduleType === 'sales' ? 'Collected (Paid)' : 'Paid to Suppliers'}</span>
            <span style={{ fontSize: '18px' }}>💳</span>
          </div>
          <div style={{ ...styles.kpiValue, color: '#10b981' }}>NPR {formatDecimal(kpiStats.totalSettled)}</div>
          <div style={styles.kpiSub}>Instant cash & bank settlements</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Pending {moduleType === 'sales' ? 'Customer Udharo' : 'Supplier Due'}</span>
            <span style={{ fontSize: '18px' }}>⏳</span>
          </div>
          <div style={{ ...styles.kpiValue, color: kpiStats.totalDue > 0 ? '#ef4444' : '#10b981' }}>
            NPR {formatDecimal(kpiStats.totalDue)}
          </div>
          <div style={styles.kpiSub}>{kpiStats.totalDue > 0 ? 'Requires follow-up / reminder' : 'All accounts settled'}</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Active Register</span>
            <span style={{ fontSize: '18px' }}>📑</span>
          </div>
          <div style={styles.kpiValue}>{kpiStats.count} Entries</div>
          <div style={styles.kpiSub}>Fiscal Year 2081/82 Nepal IRD</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
          <input
            type="text"
            placeholder="Search by Document #, Customer, PAN, Mobile..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchTransactions()}
            style={styles.inputSearch}
          />
          <button style={styles.searchBtn} onClick={fetchTransactions}>
            🔍 Search
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Status Filter */}
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={styles.select}>
            <option value="all">All Document Statuses</option>
            <option value="posted">Posted / Confirmed</option>
            <option value="draft">Draft</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Payment Status Filter */}
          <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value as any)} style={styles.select}>
            <option value="all">All Payment Statuses</option>
            <option value="paid">Fully Settled (Paid)</option>
            <option value="credit">Pending Udharo / Due</option>
          </select>

          {/* Time Filter Pills */}
          <div style={styles.timePills}>
            <button
              style={{ ...styles.pillBtn, ...(timeFilter === 'all' ? styles.pillBtnActive : {}) }}
              onClick={() => setTimeFilter('all')}
            >
              All Time
            </button>
            <button
              style={{ ...styles.pillBtn, ...(timeFilter === 'today' ? styles.pillBtnActive : {}) }}
              onClick={() => setTimeFilter('today')}
            >
              Today
            </button>
            <button
              style={{ ...styles.pillBtn, ...(timeFilter === 'week' ? styles.pillBtnActive : {}) }}
              onClick={() => setTimeFilter('week')}
            >
              This Week
            </button>
            <button
              style={{ ...styles.pillBtn, ...(timeFilter === 'month' ? styles.pillBtnActive : {}) }}
              onClick={() => setTimeFilter('month')}
            >
              Baishakh
            </button>
          </div>
        </div>
      </div>

      {displayedTransactions.length === 0 && !loading ? (
        <KarobarEmptyState
          title={moduleType === 'sales' ? 'Create Your First Sales Invoice' : 'Create Your First Purchase Bill'}
          subtitle={
            moduleType === 'sales'
              ? 'Issue professional tax invoices, monitor credit balances, and automate inventory deductions.'
              : 'Add your supplier invoices, track costs, and increase stock in warehouses.'
          }
          buttonText={moduleType === 'sales' ? '+ Create Sales Invoice' : '+ Create Purchase Bill'}
          onButtonClick={() => setShowCreateModal(true)}
        />
      ) : (
        <div style={styles.tableCard}>
          <DataTable columns={columns} data={displayedTransactions} isLoading={loading} />
          <Pagination page={page} totalPages={totalPages} totalRecords={totalRecords} onPageChange={(p) => setPage(p)} />
        </div>
      )}

      {/* Invoice Preview Modal */}
      {selectedTxn && <InvoicePreviewModal transaction={selectedTxn} onClose={() => setSelectedTxn(null)} />}

      {/* Payment Collection Modal */}
      {paymentTxn && (
        <div style={styles.overlay}>
          <div style={styles.modalSmall}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Collect Payment for #{paymentTxn.documentNumber}
              </h2>
              <button style={styles.closeBtn} onClick={() => setPaymentTxn(null)}>
                ✕
              </button>
            </div>
            <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#64748b' }}>Customer: <strong>{paymentTxn.partyName}</strong></div>
              <div style={{ fontSize: '13px', color: '#dc2626', fontWeight: 700, marginTop: '4px' }}>
                Pending Balance Due: NPR {formatDecimal(paymentTxn.balanceDue)}
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={styles.label}>Settlement Amount (NPR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Payment Destination Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  style={styles.input}
                >
                  <option value="cash">Counter Cash Drawer</option>
                  <option value="bank">Bank Account / Fonepay QR</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button type="button" onClick={() => setPaymentTxn(null)} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Save & Reconcile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Add Party Modal */}
      {showNewPartyModal && (
        <div style={{ ...styles.overlay, zIndex: 110 }}>
          <div style={styles.modalSmall}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Quick Add {moduleType === 'sales' ? 'Customer' : 'Supplier'}
              </h3>
              <button style={styles.closeBtn} onClick={() => setShowNewPartyModal(false)}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateParty} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={styles.label}>Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Shrestha or Sunrise Traders"
                  value={newPartyName}
                  onChange={(e) => setNewPartyName(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>Mobile Phone Number</label>
                <input
                  type="text"
                  placeholder="98XXXXXXXX"
                  value={newPartyPhone}
                  onChange={(e) => setNewPartyPhone(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>PAN / VAT Number (Optional)</label>
                <input
                  type="text"
                  placeholder="9 Digit PAN"
                  value={newPartyPan}
                  onChange={(e) => setNewPartyPan(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div>
                <label style={styles.label}>City / Location</label>
                <input
                  type="text"
                  placeholder="e.g. New Road, Kathmandu"
                  value={newPartyCity}
                  onChange={(e) => setNewPartyCity(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowNewPartyModal(false)} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== FULL TRANSACTION STUDIO MODAL ===================== */}
      {showCreateModal && (
        <div style={styles.overlay}>
          <div style={styles.karobarModalLarge}>
            {/* Header */}
            <div style={styles.karobarDocHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.backBtn}>
                  ←
                </button>
                <div>
                  <h2 style={styles.karobarDocTitle}>
                    {moduleType === 'sales'
                      ? txnType === 'sales_return'
                        ? 'Sales Return (Credit Note)'
                        : txnType === 'pos_invoice'
                        ? 'Quick POS Cash Receipt'
                        : 'New Tax Invoice'
                      : txnType === 'purchase_return'
                      ? 'Purchase Return (Debit Note)'
                      : 'New Purchase Bill'}
                  </h2>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Smart Billing Studio • IRD Compliant
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                  Fiscal Year: <strong>2081/82</strong>
                </div>
                <button type="button" onClick={() => setShowCreateModal(false)} style={styles.closeBtn}>
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={(e) => handleCreate(e, false)} style={{ padding: '24px' }}>
              {/* Top Details Grid */}
              <div style={styles.formGrid}>
                <div>
                  <label style={styles.label}>Document Type</label>
                  <select value={txnType} onChange={(e) => setTxnType(e.target.value)} style={styles.input}>
                    {moduleType === 'sales' ? (
                      <>
                        <option value="sale_invoice">Standard Tax Invoice (कर बिजक)</option>
                        <option value="pos_invoice">POS Cash Bill (संक्षिप्त कर बिजक)</option>
                        <option value="sales_return">Sales Return (Credit Note)</option>
                      </>
                    ) : (
                      <>
                        <option value="purchase_bill">Purchase Bill (खरिद बिल)</option>
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
                  <label style={styles.label}>Warehouse / Godown</label>
                  <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)} style={styles.input}>
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={styles.label}>Nepali Date (BS)</label>
                  <input
                    type="text"
                    value={bsDate}
                    onChange={(e) => setBsDate(e.target.value)}
                    placeholder="YYYY-MM-DD"
                    style={styles.input}
                  />
                </div>
              </div>

              {/* Party Selection Card */}
              <div style={styles.partyCardBox}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label style={{ ...styles.label, marginBottom: 0, fontWeight: 700 }}>
                    {moduleType === 'sales' ? 'Customer / Buyer Information' : 'Supplier / Vendor Information'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowNewPartyModal(true)}
                    style={styles.addPartyLinkBtn}
                  >
                    + Add New {moduleType === 'sales' ? 'Customer' : 'Supplier'}
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '12px' }}>
                  <div>
                    <select
                      value={partyId}
                      onChange={(e) => {
                        setPartyId(e.target.value);
                        const p = parties.find((part) => part._id === e.target.value);
                        if (p) {
                          setPartyName(p.name);
                          setPartyPan(p.panNumber || '');
                          setPartyPhone(p.phone || '');
                        }
                      }}
                      style={styles.input}
                    >
                      <option value="">-- Walk-in / Cash Customer --</option>
                      {parties.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name} {p.phone ? `(${p.phone})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="PAN / VAT Number"
                      value={partyPan}
                      onChange={(e) => setPartyPan(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div>
                    <input
                      type="text"
                      placeholder="Mobile Phone (for WhatsApp)"
                      value={partyPhone}
                      onChange={(e) => setPartyPhone(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                </div>

                {/* Live Khata Balance Indicator */}
                {selectedParty && (
                  <div style={styles.partyBalanceBar}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#475569' }}>Current Khata Balance:</span>
                      <strong
                        style={{
                          fontSize: '13px',
                          color: Number(selectedParty.currentBalance) > 0 ? '#dc2626' : '#16a34a',
                        }}
                      >
                        NPR {formatDecimal(selectedParty.currentBalance)}
                        {Number(selectedParty.currentBalance) > 0 ? ' (Udharo / Receivable)' : ' (Advance / Clear)'}
                      </strong>
                    </div>

                    {selectedParty.creditLimit && Number(selectedParty.creditLimit) > 0 && (
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Credit Limit: NPR {formatDecimal(selectedParty.creditLimit)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Line Items Matrix Table */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>Product & Service Line Items</h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>{lines.length} rows</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={styles.karobarItemTable}>
                    <thead>
                      <tr style={styles.karobarTableHead}>
                        <th style={{ width: '36px', padding: '10px 6px', textAlign: 'center' }}>#</th>
                        <th style={{ minWidth: '220px', padding: '10px 10px', textAlign: 'left' }}>Item / Description</th>
                        <th style={{ width: '80px', padding: '10px 6px', textAlign: 'center' }}>Stock</th>
                        <th style={{ width: '90px', padding: '10px 6px', textAlign: 'center' }}>Quantity</th>
                        <th style={{ width: '110px', padding: '10px 6px', textAlign: 'right' }}>Rate (NPR)</th>
                        <th style={{ width: '150px', padding: '10px 6px', textAlign: 'center' }}>Discount</th>
                        <th style={{ width: '70px', padding: '10px 6px', textAlign: 'center' }}>13% VAT</th>
                        <th style={{ width: '110px', padding: '10px 8px', textAlign: 'right' }}>Amount (NPR)</th>
                        <th style={{ width: '70px', padding: '10px 6px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, idx) => {
                        const q = Math.max(0, Number(line.quantity) || 0);
                        const r = Math.max(0, Number(line.rate) || 0);
                        const gross = q * r;

                        let disc = 0;
                        if (line.discountType === 'percent') {
                          disc = (gross * (Math.max(0, Number(line.discountValue) || 0))) / 100;
                        } else {
                          disc = Math.max(0, Number(line.discountValue) || 0);
                        }
                        if (disc > gross) disc = gross;
                        const rowAmount = gross - disc;

                        const currentStock = stockMap[line.itemId] || 0;

                        return (
                          <tr key={idx} style={styles.karobarTableRow}>
                            <td style={{ textAlign: 'center', color: '#64748b', fontSize: '12px' }}>{idx + 1}</td>
                            <td style={{ padding: '6px 8px' }}>
                              <select
                                value={line.itemId}
                                onChange={(e) => handleLineChange(idx, 'itemId', e.target.value)}
                                style={styles.karobarInput}
                              >
                                <option value="">-- Choose Item --</option>
                                {items.map((i) => (
                                  <option key={i._id} value={i._id}>
                                    {i.name} ({i.code})
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Stock availability indicator */}
                            <td style={{ textAlign: 'center', padding: '6px' }}>
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: currentStock > 5 ? '#ecfdf5' : currentStock > 0 ? '#fffbeb' : '#fef2f2',
                                  color: currentStock > 5 ? '#059669' : currentStock > 0 ? '#d97706' : '#dc2626',
                                }}
                              >
                                {currentStock}
                              </span>
                            </td>

                            <td style={{ padding: '6px' }}>
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={line.quantity}
                                onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                                style={{ ...styles.karobarInput, textAlign: 'center' }}
                              />
                            </td>

                            <td style={{ padding: '6px' }}>
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={line.rate}
                                onChange={(e) => handleLineChange(idx, 'rate', e.target.value)}
                                style={{ ...styles.karobarInput, textAlign: 'right' }}
                              />
                            </td>

                            {/* Discount split: Flat / Percent */}
                            <td style={{ padding: '6px' }}>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  value={line.discountValue}
                                  onChange={(e) => handleLineChange(idx, 'discountValue', e.target.value)}
                                  style={{ ...styles.karobarInput, textAlign: 'right', flex: 1 }}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleLineChange(
                                      idx,
                                      'discountType',
                                      line.discountType === 'flat' ? 'percent' : 'flat'
                                    )
                                  }
                                  style={{
                                    padding: '4px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid #cbd5e1',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    backgroundColor: line.discountType === 'percent' ? '#eff6ff' : '#f8fafc',
                                    color: line.discountType === 'percent' ? '#2563eb' : '#475569',
                                  }}
                                  title="Toggle Flat (Rs.) vs Percentage (%) Discount"
                                >
                                  {line.discountType === 'percent' ? '%' : 'Rs'}
                                </button>
                              </div>
                            </td>

                            {/* 13% Taxable Toggle */}
                            <td style={{ textAlign: 'center', padding: '6px' }}>
                              <input
                                type="checkbox"
                                checked={line.isTaxable}
                                onChange={(e) => handleLineChange(idx, 'isTaxable', e.target.checked)}
                                style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                                title="Tick if 13% Nepal VAT is applicable"
                              />
                            </td>

                            <td style={{ padding: '6px 10px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>
                              Rs. {formatDecimal(rowAmount)}
                            </td>

                            <td style={{ textAlign: 'center', padding: '6px' }}>
                              <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => duplicateLine(idx)}
                                  style={styles.lineActionBtn}
                                  title="Duplicate Row"
                                >
                                  ⧉
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeLine(idx)}
                                  style={{ ...styles.lineActionBtn, color: '#dc2626' }}
                                  title="Delete Row"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <button type="button" onClick={addLine} style={styles.addBillingItemBtn}>
                  <span style={{ fontSize: '16px', fontWeight: 800 }}>+</span> Add Line Item
                </button>
              </div>

              {/* Bottom Financial Grid */}
              <div style={styles.docBottomGrid}>
                {/* Notes & Attachments */}
                <div style={styles.docNotesCol}>
                  <label style={styles.label}>Notes, Remarks & Delivery Terms</label>
                  <textarea
                    rows={3}
                    placeholder="Enter dispatch details, vehicle #, payment notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    style={styles.notesTextarea}
                  />

                  {/* Words Banner */}
                  <div style={styles.amountWordsBox}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>अक्षरेपी (In Words):</div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#1e3a8a', fontStyle: 'italic', marginTop: '2px' }}>
                      {numberToEnglishWords(calculatedTotals.grand)}
                    </div>
                  </div>
                </div>

                {/* Tax Breakdown & Settlement */}
                <div style={styles.docTotalsCol}>
                  <div style={styles.totalRow}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Gross Subtotal:</span>
                    <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                      NPR {formatDecimal(calculatedTotals.gross)}
                    </strong>
                  </div>

                  <div style={styles.totalRow}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Item Discounts:</span>
                    <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>
                      - NPR {formatDecimal(calculatedTotals.totalDiscount)}
                    </span>
                  </div>

                  <div style={styles.totalRow}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Taxable Amount:</span>
                    <span style={{ fontSize: '13px', color: '#0f172a' }}>
                      NPR {formatDecimal(calculatedTotals.taxable)}
                    </span>
                  </div>

                  {calculatedTotals.nonTaxable > 0 && (
                    <div style={styles.totalRow}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>Tax-Exempt Amount:</span>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        NPR {formatDecimal(calculatedTotals.nonTaxable)}
                      </span>
                    </div>
                  )}

                  <div style={styles.totalRow}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Nepal VAT (13%):</span>
                    <span style={{ fontSize: '13px', color: '#0f172a', fontWeight: 600 }}>
                      + NPR {formatDecimal(calculatedTotals.vat)}
                    </span>
                  </div>

                  <div style={{ ...styles.totalRow, borderTop: '1.5px solid #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
                    <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>Grand Total:</span>
                    <div style={styles.totalAmountBox}>
                      <span style={{ fontSize: '12px', color: '#64748b', marginRight: '4px' }}>NPR</span>
                      <strong style={{ fontSize: '18px', color: '#0f172a' }}>
                        {formatDecimal(calculatedTotals.grand)}
                      </strong>
                    </div>
                  </div>

                  {/* Payment Settlement Selector */}
                  <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', marginTop: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Settlement Mode:</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMode('cash');
                            setPaidAmount(calculatedTotals.grand.toFixed(2));
                          }}
                          style={styles.quickPayBtn}
                        >
                          100% Cash
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMode('partial');
                            setPaidAmount((calculatedTotals.grand / 2).toFixed(2));
                          }}
                          style={styles.quickPayBtn}
                        >
                          50% Adv
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentMode('credit');
                            setPaidAmount('0.00');
                          }}
                          style={styles.quickPayBtn}
                        >
                          Full Credit
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div>
                        <select
                          value={paymentMode}
                          onChange={(e) => {
                            const m = e.target.value as any;
                            setPaymentMode(m);
                            if (m === 'cash' || m === 'bank') {
                              setPaidAmount(calculatedTotals.grand.toFixed(2));
                            } else if (m === 'credit') {
                              setPaidAmount('0.00');
                            }
                          }}
                          style={styles.input}
                        >
                          <option value="cash">Cash Register</option>
                          <option value="bank">Fonepay / Bank Transfer</option>
                          <option value="credit">Credit (Udharo Khata)</option>
                          <option value="partial">Partial Payment</option>
                        </select>
                      </div>

                      <div>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Paid Amount"
                          value={paidAmount}
                          onChange={(e) => setPaidAmount(e.target.value)}
                          style={{ ...styles.input, textAlign: 'right' }}
                        />
                      </div>
                    </div>

                    {/* Balance Due Notice */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600, color: '#64748b' }}>Remaining Balance Due:</span>
                      <strong
                        style={{
                          color: calculatedTotals.balance > 0 ? '#dc2626' : '#16a34a',
                          fontFamily: 'monospace',
                          fontSize: '14px',
                        }}
                      >
                        NPR {formatDecimal(calculatedTotals.balance)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Footer */}
              <div style={styles.karobarFormFooter}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={styles.btnSecondary}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={(e) => handleCreate(e, true)}
                  style={{ ...styles.btnPrimary, backgroundColor: '#0284c7' }}
                >
                  🖨️ Save & Print Invoice
                </button>

                <button
                  type="submit"
                  style={{ ...styles.btnPrimary, backgroundColor: '#10b981' }}
                >
                  <span>
                    ✓ Save {moduleType === 'sales' ? (isReturnRoute ? 'Sales Return' : 'Sales Invoice') : isReturnRoute ? 'Purchase Return' : 'Purchase Bill'}
                  </span>
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
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
  title: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  proTag: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    fontSize: '11px',
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: '6px',
    border: '1px solid #a7f3d0',
  },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
  },
  kpiHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  kpiLabel: { fontSize: '12px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' },
  kpiValue: { fontSize: '18px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' },
  kpiSub: { fontSize: '11px', color: '#94a3b8', marginTop: '4px' },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#ffffff',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    flexWrap: 'wrap',
  },
  inputSearch: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    minWidth: '280px',
    fontSize: '13px',
    outline: 'none',
  },
  searchBtn: {
    padding: '8px 14px',
    borderRadius: '6px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    cursor: 'pointer',
  },
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  timePills: { display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '2px' },
  pillBtn: {
    padding: '6px 12px',
    borderRadius: '5px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    background: 'none',
    cursor: 'pointer',
  },
  pillBtnActive: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  btnPrimary: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    padding: '9px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer',
  },
  btnSecondary: {
    backgroundColor: '#ffffff',
    color: '#334155',
    padding: '9px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
  },
  actionBtn: {
    padding: '4px 8px',
    borderRadius: '5px',
    fontSize: '11px',
    fontWeight: 600,
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
  },
  badge: { fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px', textAlign: 'center' },
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
    zIndex: 100,
    padding: '20px',
  },
  modalSmall: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '400px',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
  },
  karobarModalLarge: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '960px',
    width: '100%',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
  },
  karobarDocHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#fafafa',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
  },
  backBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' },
  karobarDocTitle: { fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' },
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
  partyCardBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    padding: '14px',
    border: '1px solid #e2e8f0',
    marginTop: '16px',
  },
  addPartyLinkBtn: {
    background: 'none',
    border: 'none',
    fontSize: '12px',
    fontWeight: 700,
    color: '#10b981',
    cursor: 'pointer',
  },
  partyBalanceBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '8px',
    paddingTop: '8px',
    borderTop: '1px dashed #cbd5e1',
  },
  karobarItemTable: {
    width: '100%',
    borderCollapse: 'collapse',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  karobarTableHead: {
    backgroundColor: '#f1f5f9',
    borderBottom: '1.5px solid #e2e8f0',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
  },
  karobarTableRow: { borderBottom: '1px solid #f1f5f9' },
  karobarInput: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: '5px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  lineActionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '2px 4px',
    color: '#475569',
  },
  addBillingItemBtn: {
    marginTop: '10px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#10b981',
    fontWeight: 800,
    fontSize: '13px',
    cursor: 'pointer',
  },
  docBottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1fr',
    gap: '20px',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
  },
  docNotesCol: { display: 'flex', flexDirection: 'column', gap: '10px' },
  notesTextarea: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  amountWordsBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 12px',
  },
  docTotalsCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    backgroundColor: '#f8fafc',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  totalAmountBox: { display: 'flex', alignItems: 'baseline' },
  quickPayBtn: {
    padding: '2px 6px',
    fontSize: '10px',
    fontWeight: 700,
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
  },
  karobarFormFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
  },
};
