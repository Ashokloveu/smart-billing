import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Party } from '../../types/master';
import { formatDecimal } from '../../utils/decimal';
import { DataTable } from '../../components/common/DataTable';
import { Pagination } from '../../components/common/Pagination';

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
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Parties (Customers & Suppliers)</h1>
          <p style={styles.subtitle}>Manage your buyers, vendors, contact details and PAN.</p>
        </div>
        <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>
          + Add Party
        </button>
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
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>Add New Party</h2>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} style={styles.modalForm}>
              <div style={styles.formRow}>
                <label>Party Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  style={styles.input}
                >
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                  <option value="both">Both</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <label>Legal Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Himalayan Retailers Pvt. Ltd."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label>Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+977-9841234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label>9-Digit PAN / VAT</label>
                <input
                  type="text"
                  placeholder="e.g. 601234567"
                  value={formData.panNumber}
                  onChange={(e) => setFormData({ ...formData, panNumber: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label>City</label>
                <input
                  type="text"
                  value={formData.billingAddress.city}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      billingAddress: { ...formData.billingAddress, city: e.target.value },
                    })
                  }
                  style={styles.input}
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Save Party
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
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  closeBtn: { fontSize: '16px', color: '#64748b' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  formRow: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px', fontWeight: 600 },
  input: { padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' },
};
