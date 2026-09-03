import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Party } from '../../types/master';
import { formatDecimal } from '../../utils/decimal';
import { DataTable } from '../../components/common/DataTable';
import { Pagination } from '../../components/common/Pagination';
import { PaymentRemindersModal } from './PaymentRemindersModal';

export const PartiesPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [parties, setParties] = useState<Party[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'customer' | 'supplier'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'customer',
    phone: '',
    panNumber: '',
    email: '',
    billingAddress: { line1: '', city: 'Kathmandu', district: 'Kathmandu', province: 'Bagmati' },
    creditLimit: '0.00',
  });

  const fetchParties = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/organizations/${currentOrg._id}/parties`, {
        params: { page, limit: 10, search, type: typeFilter },
      });
      setParties(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotalRecords(res.data.pagination.totalRecords);
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
      await apiClient.post(`/organizations/${currentOrg._id}/parties`, formData);
      setShowModal(false);
      setFormData({
        name: '',
        type: 'customer',
        phone: '',
        panNumber: '',
        email: '',
        billingAddress: { line1: '', city: 'Kathmandu', district: 'Kathmandu', province: 'Bagmati' },
        creditLimit: '0.00',
      });
      fetchParties();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error creating party');
    }
  };

  const columns = [
    { header: 'Name', accessor: (p: Party) => <strong>{p.name}</strong> },
    {
      header: 'Type',
      accessor: (p: Party) => (
        <span
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '4px',
            backgroundColor: p.type === 'customer' ? '#ecfdf5' : '#eff6ff',
            color: p.type === 'customer' ? '#059669' : '#1e3a8a',
          }}
        >
          {p.type}
        </span>
      ),
    },
    { header: 'PAN Number', accessor: 'panNumber' as keyof Party },
    { header: 'Phone', accessor: 'phone' as keyof Party },
    { header: 'City', accessor: (p: Party) => p.billingAddress?.city },
    {
      header: 'Credit Limit',
      accessor: (p: Party) => `NPR ${formatDecimal(p.creditLimit)}`,
    },
    {
      header: 'Remind',
      accessor: (p: Party) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            const cleanPhone = (p.phone || '').replace(/[^0-9]/g, '');
            const msg = encodeURIComponent(`Namaste ${p.name} ji! 🙏\nThis is a friendly reminder regarding your account balance at ${currentOrg?.name || 'Smart Billing'}.\nPlease contact us to reconcile your ledger. Thank you! ⚡`);
            const waUrl = cleanPhone ? `https://wa.me/${cleanPhone.length === 10 ? '977' + cleanPhone : cleanPhone}?text=${msg}` : `https://wa.me/?text=${msg}`;
            window.open(waUrl, '_blank');
          }}
          style={{
            padding: '4px 8px',
            backgroundColor: '#25D366',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
          title="Send Direct WhatsApp Udharo Reminder"
        >
          💬 WhatsApp
        </button>
      ),
    },
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Parties (Customers & Suppliers)</h1>
          <p style={styles.subtitle}>Manage your buyers, vendors, contact details and PAN.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            style={{
              ...styles.btnSecondary,
              backgroundColor: '#25D366',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onClick={() => setShowRemindersModal(true)}
            title="Send Automated WhatsApp Payment Reminders"
          >
            💬 WhatsApp Reminders
          </button>
          <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>
            + Add Party
          </button>
        </div>
      </div>

      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by name, phone, PAN..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchParties()}
          style={styles.searchInput}
        />
        <div style={styles.radioGroup}>
          {(['all', 'customer', 'supplier'] as const).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTypeFilter(t);
                setPage(1);
              }}
              style={{
                ...styles.filterBtn,
                backgroundColor: typeFilter === t ? '#1e3a8a' : '#ffffff',
                color: typeFilter === t ? '#ffffff' : '#475569',
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <DataTable columns={columns} data={parties} isLoading={loading} />
      <Pagination
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={(p) => setPage(p)}
      />

      {/* Create Party Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.karobarModal}>
            {/* Modal Header */}
            <div style={styles.karobarModalHeader}>
              <h2 style={styles.karobarModalTitle}>Add New Party</h2>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '24px' }}>
              {/* Top Row: Photo Box + Name/Phone */}
              <div style={styles.partyTopRow}>
                {/* Photo Placeholder */}
                <div style={styles.photoContainer}>
                  <div style={styles.photoBox}>
                    <span style={{ fontSize: '44px', color: '#94a3b8' }}>👤</span>
                  </div>
                  <button type="button" style={styles.uploadPhotoBtn}>
                    Upload Photo
                  </button>
                </div>

                {/* Form fields */}
                <div style={styles.partyMainFields}>
                  <div style={styles.twoColRow}>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Full Name*</label>
                      <input
                        type="text"
                        required
                        placeholder="Enter the name of party"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        style={styles.karobarInput}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>Phone Number</label>
                      <input
                        type="text"
                        placeholder="Enter party phone no"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        style={styles.karobarInput}
                      />
                    </div>
                  </div>

                  {/* Party Type Segmented Switcher */}
                  <div style={{ marginTop: '12px' }}>
                    <label style={styles.formLabel}>Party Type</label>
                    <div style={styles.segmentedRow}>
                      <button
                        type="button"
                        style={{
                          ...styles.segmentBtn,
                          ...(formData.type === 'customer' ? styles.segmentBtnActive : {}),
                        }}
                        onClick={() => setFormData({ ...formData, type: 'customer' })}
                      >
                        Customer
                      </button>
                      <button
                        type="button"
                        style={{
                          ...styles.segmentBtn,
                          ...(formData.type === 'supplier' ? styles.segmentBtnActive : {}),
                        }}
                        onClick={() => setFormData({ ...formData, type: 'supplier' })}
                      >
                        Supplier
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs: Credit Info | Additional Info */}
              <div style={styles.partyTabs}>
                <div style={styles.partyTabActive}>Credit Info</div>
                <div style={styles.partyTabInactive}>Additional Info</div>
              </div>

              {/* Credit Info Row */}
              <div style={styles.creditInfoRow}>
                <div style={{ flex: 1 }}>
                  <label style={styles.formLabel}>Opening Balance</label>
                  <input
                    type="text"
                    placeholder="Rs. eg. 0"
                    style={styles.karobarInput}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button type="button" style={styles.toReceiveBtn}>
                      To Receive
                    </button>
                    <button type="button" style={styles.toGiveBtn}>
                      To Give
                    </button>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={styles.formLabel}>As of Date</label>
                  <div style={styles.dateInputWrapper}>
                    <input
                      type="text"
                      defaultValue="2083 Bai 15"
                      style={styles.karobarInput}
                    />
                    <span style={styles.calendarIcon}>📅</span>
                  </div>
                </div>
              </div>

              {/* Bottom Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button type="submit" style={styles.savePartyGreenBtn}>
                  Save Party
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <PaymentRemindersModal
        isOpen={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
        firmName={currentOrg?.name}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: { fontSize: '20px', fontWeight: 700, color: '#0f172a' },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '2px' },
  btnPrimary: {
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
  },
  btnSecondary: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    marginBottom: '16px',
  },
  searchInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    width: '320px',
    fontSize: '13px',
  },
  radioGroup: { display: 'flex', gap: '4px' },
  filterBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '11px',
    fontWeight: 600,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    width: '460px',
    padding: '24px',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
  },
  karobarModal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '620px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  karobarModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px 16px 24px',
    borderBottom: '1px solid #f1f5f9',
  },
  karobarModalTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  partyTopRow: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  photoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  photoBox: {
    width: '84px',
    height: '84px',
    borderRadius: '12px',
    backgroundColor: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadPhotoBtn: {
    padding: '4px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: '11px',
    fontWeight: 600,
    color: '#475569',
    cursor: 'pointer',
  },
  partyMainFields: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  twoColRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
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
  segmentedRow: {
    display: 'flex',
    gap: '8px',
  },
  segmentBtn: {
    padding: '6px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    cursor: 'pointer',
  },
  segmentBtnActive: {
    borderColor: '#10b981',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    fontWeight: 700,
  },
  partyTabs: {
    display: 'flex',
    gap: '24px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '8px',
    marginTop: '16px',
    marginBottom: '16px',
  },
  partyTabActive: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#10b981',
    borderBottom: '2px solid #10b981',
    paddingBottom: '8px',
    cursor: 'pointer',
  },
  partyTabInactive: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748b',
    cursor: 'pointer',
  },
  creditInfoRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
  },
  toReceiveBtn: {
    flex: 1,
    padding: '6px 12px',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    border: '1px solid #a7f3d0',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  toGiveBtn: {
    flex: 1,
    padding: '6px 12px',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  dateInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  calendarIcon: {
    position: 'absolute',
    right: '12px',
    fontSize: '14px',
    pointerEvents: 'none',
  },
  savePartyGreenBtn: {
    padding: '10px 24px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  closeBtn: { fontSize: '16px', color: '#64748b', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  formRow: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600 },
  input: { padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' },
};
