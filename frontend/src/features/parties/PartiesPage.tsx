import React, { useEffect, useState, useMemo } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Party } from '../../types/master';
import { formatDecimal } from '../../utils/decimal';
import { DataTable } from '../../components/common/DataTable';
import { Pagination } from '../../components/common/Pagination';
import { PaymentRemindersModal } from './PaymentRemindersModal';
import { PartyKhataModal } from './PartyKhataModal';

export const PartiesPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'supplier' | 'debtors'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals State
  const [showModal, setShowModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [selectedKhataParty, setSelectedKhataParty] = useState<Party | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    type: 'customer' as 'customer' | 'supplier',
    phone: '',
    panNumber: '',
    email: '',
    billingAddress: { line1: '', city: 'Kathmandu', district: 'Kathmandu', province: 'Bagmati' },
    creditLimit: '0.00',
    openingBalance: '0.00',
    openingBalanceType: 'receive' as 'receive' | 'give',
  });

  const fetchParties = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/organizations/${currentOrg._id}/parties`, {
        params: {
          page,
          limit: 15,
          search,
          type: typeFilter === 'debtors' || typeFilter === 'all' ? undefined : typeFilter,
        },
      });
      setParties(res.data.data || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setTotalRecords(res.data.pagination?.totalRecords || (res.data.data || []).length);
    } catch (e) {
      console.error('Failed to load parties', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParties();
  }, [currentOrg?._id, page, typeFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?._id) return;
    try {
      const opBal = Number(formData.openingBalance) || 0;
      const finalBalance = formData.openingBalanceType === 'give' ? -Math.abs(opBal) : Math.abs(opBal);

      await apiClient.post(`/organizations/${currentOrg._id}/parties`, {
        ...formData,
        currentBalance: finalBalance.toFixed(2),
      });

      setShowModal(false);
      setFormData({
        name: '',
        type: 'customer',
        phone: '',
        panNumber: '',
        email: '',
        billingAddress: { line1: '', city: 'Kathmandu', district: 'Kathmandu', province: 'Bagmati' },
        creditLimit: '0.00',
        openingBalance: '0.00',
        openingBalanceType: 'receive',
      });
      fetchParties();
      alert('Party registered successfully!');
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error creating party');
    }
  };

  // Filtered list
  const displayedParties = useMemo(() => {
    if (typeFilter === 'debtors') {
      return parties.filter((p) => Number(formatDecimal(p.currentBalance || 0)) > 0);
    }
    return parties;
  }, [parties, typeFilter]);

  // Aggregate KPI metrics
  const kpiStats = useMemo(() => {
    let totalReceivables = 0;
    let totalPayables = 0;
    let customerCount = 0;
    let supplierCount = 0;
    let overdueCount = 0;

    parties.forEach((p) => {
      const bal = Number(formatDecimal(p.currentBalance || 0));
      if (p.type === 'customer') {
        customerCount++;
        if (bal > 0) {
          totalReceivables += bal;
          overdueCount++;
        }
      } else if (p.type === 'supplier') {
        supplierCount++;
        if (bal > 0) {
          totalPayables += bal;
        }
      }
    });

    return { totalReceivables, totalPayables, customerCount, supplierCount, overdueCount };
  }, [parties]);

  const columns = [
    {
      header: 'Party / Trade Name',
      accessor: (p: Party) => (
        <div
          onClick={() => setSelectedKhataParty(p)}
          style={{ cursor: 'pointer' }}
          title="Click to view full Udharo Khata statement"
        >
          <strong style={{ color: '#0f172a', fontSize: '13px' }}>{p.name}</strong>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            📍 {p.billingAddress?.city || 'Kathmandu'} • Ref: {p._id?.slice(-4)}
          </div>
        </div>
      ),
    },
    {
      header: 'Category',
      accessor: (p: Party) => (
        <span
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            fontWeight: 800,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: p.type === 'customer' ? '#ecfdf5' : '#eff6ff',
            color: p.type === 'customer' ? '#059669' : '#2563eb',
          }}
        >
          {p.type}
        </span>
      ),
    },
    {
      header: 'PAN Number',
      accessor: (p: Party) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: p.panNumber ? '#0f172a' : '#94a3b8' }}>
          {p.panNumber || 'Consumer / Cash'}
        </span>
      ),
    },
    {
      header: 'Mobile / WhatsApp',
      accessor: (p: Party) => (
        <span style={{ fontFamily: 'monospace' }}>{p.phone || '—'}</span>
      ),
    },
    {
      header: 'Net Khata Balance',
      accessor: (p: Party) => {
        const bal = Number(formatDecimal(p.currentBalance || 0));
        const isReceivable = p.type === 'customer' && bal > 0;
        const isPayable = p.type === 'supplier' && bal > 0;

        return (
          <div>
            <strong
              style={{
                fontFamily: 'monospace',
                fontSize: '14px',
                color: isReceivable ? '#dc2626' : isPayable ? '#d97706' : '#10b981',
              }}
            >
              NPR {formatDecimal(bal)}
            </strong>
            <div style={{ fontSize: '10px', fontWeight: 700, marginTop: '2px' }}>
              {isReceivable && <span style={{ color: '#dc2626' }}>● To Receive (उधारो)</span>}
              {isPayable && <span style={{ color: '#d97706' }}>● To Pay (तिर्नुपर्ने)</span>}
              {bal === 0 && <span style={{ color: '#10b981' }}>✓ All Settled</span>}
            </div>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      accessor: (p: Party) => (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedKhataParty(p)}
            style={{ ...styles.actionBtn, backgroundColor: '#f8fafc', color: '#10b981', borderColor: '#a7f3d0' }}
            title="Open Digital Udharo Khata Statement"
          >
            📜 Khata
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
              const bal = Number(formatDecimal(p.currentBalance || 0));
              const msg = encodeURIComponent(
                `नमस्ते ${p.name} ज्यू! 🙏\n\n*${currentOrg?.name || 'Smart Billing'}* बाट तपाईंको खाता सम्बन्धी जानकारी:\n` +
                `● बाँकी हिसाब: NPR ${formatDecimal(bal)}\n\n` +
                `कृपया Fonepay QR वा बैंकिङ मार्फत भुक्तानी गरी हिसाब मिलान गरिदिनुहुन अनुरोध गर्दछौं। धन्यवाद!`
              );
              const waUrl = cleanPhone
                ? `https://wa.me/${cleanPhone.length === 10 ? '977' + cleanPhone : cleanPhone}?text=${msg}`
                : `https://wa.me/?text=${msg}`;
              window.open(waUrl, '_blank');
            }}
            style={{ ...styles.actionBtn, backgroundColor: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}
            title="Send WhatsApp Udharo Reminder"
          >
            💬 WhatsApp
          </button>
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
            <h1 style={styles.title}>Parties & Digital Udharo Khata</h1>
            <span style={styles.tag}>Khata & CRM</span>
          </div>
          <p style={styles.subtitle}>
            Customer credit limits, supplier payables, automated WhatsApp payment recovery bot, and digital Khata statements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={styles.btnWhatsapp}
            onClick={() => setShowRemindersModal(true)}
            title="Launch Automated WhatsApp Payment Recovery Bot"
          >
            📢 WhatsApp Recovery Bot
          </button>
          <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>
            + Add New Party
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Total Customer Udharo (Receivable)</span>
            <span style={{ fontSize: '18px' }}>🔴</span>
          </div>
          <div style={{ ...styles.kpiValue, color: '#dc2626' }}>
            NPR {formatDecimal(kpiStats.totalReceivables)}
          </div>
          <div style={styles.kpiSub}>Across {kpiStats.overdueCount} pending customer accounts</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Total Supplier Payables (To Give)</span>
            <span style={{ fontSize: '18px' }}>🟡</span>
          </div>
          <div style={{ ...styles.kpiValue, color: '#d97706' }}>
            NPR {formatDecimal(kpiStats.totalPayables)}
          </div>
          <div style={styles.kpiSub}>Pending vendor bill settlements</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Customer Base</span>
            <span style={{ fontSize: '18px' }}>👥</span>
          </div>
          <div style={styles.kpiValue}>{kpiStats.customerCount} Buyers</div>
          <div style={styles.kpiSub}>Registered customers & retail clients</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Supplier Base</span>
            <span style={{ fontSize: '18px' }}>🏢</span>
          </div>
          <div style={styles.kpiValue}>{kpiStats.supplierCount} Vendors</div>
          <div style={styles.kpiSub}>Registered distributors & wholesalers</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by party name, phone, PAN, city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchParties()}
          style={styles.searchInput}
        />

        <div style={styles.radioGroup}>
          <button
            onClick={() => setTypeFilter('all')}
            style={{
              ...styles.filterBtn,
              backgroundColor: typeFilter === 'all' ? '#10b981' : '#ffffff',
              color: typeFilter === 'all' ? '#ffffff' : '#475569',
            }}
          >
            All Parties
          </button>
          <button
            onClick={() => setTypeFilter('customer')}
            style={{
              ...styles.filterBtn,
              backgroundColor: typeFilter === 'customer' ? '#10b981' : '#ffffff',
              color: typeFilter === 'customer' ? '#ffffff' : '#475569',
            }}
          >
            Customers Only
          </button>
          <button
            onClick={() => setTypeFilter('supplier')}
            style={{
              ...styles.filterBtn,
              backgroundColor: typeFilter === 'supplier' ? '#10b981' : '#ffffff',
              color: typeFilter === 'supplier' ? '#ffffff' : '#475569',
            }}
          >
            Suppliers Only
          </button>
          <button
            onClick={() => setTypeFilter('debtors')}
            style={{
              ...styles.filterBtn,
              backgroundColor: typeFilter === 'debtors' ? '#dc2626' : '#ffffff',
              color: typeFilter === 'debtors' ? '#ffffff' : '#dc2626',
              fontWeight: 700,
            }}
          >
            ⚠️ Pending Udharo (&gt;0)
          </button>
        </div>
      </div>

      {/* Parties Table */}
      <div style={styles.tableCard}>
        <DataTable columns={columns} data={displayedParties} isLoading={loading} />
        <Pagination
          page={page}
          totalPages={totalPages}
          totalRecords={totalRecords}
          onPageChange={(p) => setPage(p)}
        />
      </div>

      {/* ===================== PARTY KHATA MODAL ===================== */}
      {selectedKhataParty && (
        <PartyKhataModal
          party={selectedKhataParty}
          onClose={() => setSelectedKhataParty(null)}
          onPaymentRecorded={() => fetchParties()}
        />
      )}

      {/* ===================== WHATSAPP REMINDERS BOT MODAL ===================== */}
      <PaymentRemindersModal
        isOpen={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
        firmName={currentOrg?.name || 'Smart Billing'}
        parties={parties}
      />

      {/* ===================== CREATE PARTY MODAL ===================== */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.karobarModal}>
            <div style={styles.karobarModalHeader}>
              <h2 style={styles.karobarModalTitle}>Add New Party Account</h2>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Party Full Legal Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Shrestha or Bagmati Traders"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={styles.karobarInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Mobile Phone (for WhatsApp) *</label>
                  <input
                    type="text"
                    required
                    placeholder="98XXXXXXXX"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={styles.karobarInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Party Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    style={styles.karobarInput}
                  >
                    <option value="customer">Customer (ग्राहक)</option>
                    <option value="supplier">Supplier (आपूर्तिकर्ता)</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>PAN / VAT Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="9 Digit PAN"
                    value={formData.panNumber}
                    onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                    style={styles.karobarInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>City / Address</label>
                  <input
                    type="text"
                    placeholder="e.g. New Road, Kathmandu"
                    value={formData.billingAddress.city}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingAddress: { ...formData.billingAddress, city: e.target.value },
                      })
                    }
                    style={styles.karobarInput}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Credit Limit (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                    style={styles.karobarInput}
                  />
                </div>
              </div>

              {/* Opening Balance Box */}
              <div style={styles.openingBalCard}>
                <label style={styles.formLabel}>Opening Balance (प्रारम्भिक मौज्दात)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="NPR 0.00"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: e.target.value })}
                    style={styles.karobarInput}
                  />

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      style={{
                        ...styles.toReceiveBtn,
                        backgroundColor: formData.openingBalanceType === 'receive' ? '#10b981' : '#ffffff',
                        color: formData.openingBalanceType === 'receive' ? '#ffffff' : '#334155',
                      }}
                      onClick={() => setFormData({ ...formData, openingBalanceType: 'receive' })}
                    >
                      To Receive (लिनुपर्ने)
                    </button>
                    <button
                      type="button"
                      style={{
                        ...styles.toGiveBtn,
                        backgroundColor: formData.openingBalanceType === 'give' ? '#dc2626' : '#ffffff',
                        color: formData.openingBalanceType === 'give' ? '#ffffff' : '#334155',
                      }}
                      onClick={() => setFormData({ ...formData, openingBalanceType: 'give' })}
                    >
                      To Give (दिनुपर्ने)
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Save Party Account
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
  btnWhatsapp: {
    backgroundColor: '#25D366',
    color: '#ffffff',
    padding: '9px 18px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(37, 211, 102, 0.3)',
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
  kpiLabel: { fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' },
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
  searchInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    minWidth: '280px',
    fontSize: '13px',
    outline: 'none',
  },
  radioGroup: { display: 'flex', gap: '6px', backgroundColor: '#f1f5f9', padding: '3px', borderRadius: '8px' },
  filterBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    border: 'none',
    cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  actionBtn: {
    padding: '4px 8px',
    borderRadius: '5px',
    border: '1px solid #cbd5e1',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  modalOverlay: {
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
    zIndex: 150,
    padding: '20px',
  },
  karobarModal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '640px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  karobarModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#fafafa',
  },
  karobarModalTitle: { fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
  formLabel: { fontSize: '12px', fontWeight: 600, color: '#334155' },
  karobarInput: {
    padding: '8px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  openingBalCard: {
    backgroundColor: '#f8fafc',
    padding: '14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    marginTop: '16px',
  },
  toReceiveBtn: {
    flex: 1,
    padding: '6px',
    borderRadius: '6px',
    border: '1px solid #10b981',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  toGiveBtn: {
    flex: 1,
    padding: '6px',
    borderRadius: '6px',
    border: '1px solid #dc2626',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
