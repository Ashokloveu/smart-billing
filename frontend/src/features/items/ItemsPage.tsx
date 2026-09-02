import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Item, Category, Unit, TaxPolicy } from '../../types/master';
import { formatDecimal } from '../../utils/decimal';
import { DataTable } from '../../components/common/DataTable';
import { Pagination } from '../../components/common/Pagination';

export const ItemsPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [taxPolicies, setTaxPolicies] = useState<TaxPolicy[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    barcode: '',
    type: 'product',
    categoryId: '',
    primaryUnitId: '',
    taxPolicyId: '',
    salePrice: '0.00',
    purchasePrice: '0.00',
    minimumStock: '10.00',
    isStockTracked: true,
  });

  const fetchDependencies = async () => {
    if (!currentOrg?._id) return;
    try {
      const [catRes, unitRes, taxRes] = await Promise.all([
        apiClient.get(`/organizations/${currentOrg._id}/categories`),
        apiClient.get(`/organizations/${currentOrg._id}/units`),
        apiClient.get(`/organizations/${currentOrg._id}/tax-policies`),
      ]);
      setCategories(catRes.data.data);
      setUnits(unitRes.data.data);
      setTaxPolicies(taxRes.data.data);

      if (catRes.data.data.length > 0) setFormData((f) => ({ ...f, categoryId: catRes.data.data[0]._id }));
      if (unitRes.data.data.length > 0) setFormData((f) => ({ ...f, primaryUnitId: unitRes.data.data[0]._id }));
      if (taxRes.data.data.length > 0) setFormData((f) => ({ ...f, taxPolicyId: taxRes.data.data[0]._id }));
    } catch (e) {
      console.error('Failed to load metadata', e);
    }
  };

  const fetchItems = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/organizations/${currentOrg._id}/items`, {
        params: { page, limit: 10, search },
      });
      setItems(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotalRecords(res.data.pagination.totalRecords);
    } catch (e) {
      console.error('Failed to load items', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencies();
  }, [currentOrg?._id]);

  useEffect(() => {
    fetchItems();
  }, [currentOrg?._id, page]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?._id) return;
    try {
      await apiClient.post(`/organizations/${currentOrg._id}/items`, formData);
      setShowModal(false);
      setFormData((prev) => ({
        ...prev,
        name: '',
        code: '',
        barcode: '',
        salePrice: '0.00',
        purchasePrice: '0.00',
      }));
      fetchItems();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error creating item');
    }
  };

  const columns = [
    { header: 'SKU / Code', accessor: (i: Item) => <span style={{ fontFamily: 'monospace' }}>{i.code}</span> },
    { header: 'Item Name', accessor: (i: Item) => <strong>{i.name}</strong> },
    { header: 'Category', accessor: (i: Item) => (typeof i.categoryId === 'object' ? i.categoryId?.name : 'General') },
    {
      header: 'Primary Unit',
      accessor: (i: Item) => (typeof i.primaryUnitId === 'object' ? i.primaryUnitId?.abbreviation : 'PCS'),
    },
    {
      header: 'Selling Price',
      accessor: (i: Item) => `NPR ${formatDecimal(i.salePrice)}`,
    },
    {
      header: 'Cost Price',
      accessor: (i: Item) => `NPR ${formatDecimal(i.purchasePrice)}`,
    },
  ];

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Items & Services Catalog</h1>
          <p style={styles.subtitle}>Manage product SKUs, default rates, units, and tax classifications.</p>
        </div>
        <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>
          + Add Item / SKU
        </button>
      </div>

      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by SKU, Name, Barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchItems()}
          style={styles.searchInput}
        />
      </div>

      <DataTable columns={columns} data={items} isLoading={loading} />
      <Pagination
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={(p) => setPage(p)}
      />

      {/* Create Item Modal */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>Add New Item</h2>
              <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreate} style={styles.modalForm}>
              <div style={styles.formRow}>
                <label>SKU / Item Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CEM-OPC-50"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label>Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhairahawa OPC Cement 50kg"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label>Category</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  style={styles.input}
                >
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label>Primary Unit</label>
                <select
                  value={formData.primaryUnitId}
                  onChange={(e) => setFormData({ ...formData, primaryUnitId: e.target.value })}
                  style={styles.input}
                >
                  {units.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name} ({u.abbreviation})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label>Tax Policy</label>
                <select
                  value={formData.taxPolicyId}
                  onChange={(e) => setFormData({ ...formData, taxPolicyId: e.target.value })}
                  style={styles.input}
                >
                  {taxPolicies.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} ({formatDecimal(t.rate)}%)
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <div style={{ flex: 1, ...styles.formRow }}>
                  <label>Sale Price (NPR)</label>
                  <input
                    type="text"
                    value={formData.salePrice}
                    onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                    style={styles.input}
                  />
                </div>
                <div style={{ flex: 1, ...styles.formRow }}>
                  <label>Cost Price (NPR)</label>
                  <input
                    type="text"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowModal(false)} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Save Product
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
  filterBar: { display: 'flex', gap: '12px', marginBottom: '16px' },
  searchInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    width: '320px',
    fontSize: '13px',
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
  modalForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
  formRow: { display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', fontWeight: 600 },
  input: { padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' },
};
