import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Item, Category, Unit } from '../../types/master';
import { formatDecimal } from '../../utils/decimal';
import { DataTable } from '../../components/common/DataTable';
import { Pagination } from '../../components/common/Pagination';

import { BarcodeGeneratorModal } from './BarcodeGeneratorModal';

export const ItemsPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [selectedItemForBarcode, setSelectedItemForBarcode] = useState<any | null>(null);
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
    {
      header: 'Actions',
      accessor: (i: Item) => (
        <button
          onClick={() => setSelectedItemForBarcode({ ...i, sellingPrice: i.salePrice })}
          style={{
            padding: '5px 10px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: '#f1f5f9',
            color: '#1e3a8a',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
          title="Generate Barcode & Price Tag Stickers"
        >
          🏷️ Barcode Tag
        </button>
      ),
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
          <div style={styles.karobarItemModal}>
            {/* Modal Header */}
            <div style={styles.karobarModalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px', cursor: 'pointer', color: '#64748b' }} onClick={() => setShowModal(false)}>
                  ←
                </span>
                <h2 style={styles.karobarModalTitle}>Add New Item</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px', color: '#64748b', cursor: 'pointer' }}>⚙️</span>
                <button onClick={() => setShowModal(false)} style={styles.closeBtn}>
                  ✕
                </button>
              </div>
            </div>

            <form onSubmit={handleCreate} style={{ padding: '24px' }}>
              {/* Item Name */}
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="eg. Noodles"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const code = name.toUpperCase().replace(/[^A-Z0-9]/g, '-').slice(0, 10);
                    setFormData({ ...formData, name, code: formData.code || code });
                  }}
                  style={styles.karobarInput}
                />
              </div>

              {/* Category & Item Type */}
              <div style={{ ...styles.twoColRow, marginTop: '16px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Item Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    style={styles.karobarSelect}
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Item Type</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      style={styles.productTypeActive}
                    >
                      Product
                    </button>
                    <button
                      type="button"
                      style={styles.productTypeInactive}
                    >
                      Service
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabs: Stock Details | Others */}
              <div style={styles.itemModalTabs}>
                <div style={styles.itemTabActive}>Stock Details</div>
                <div style={styles.itemTabInactive}>Others</div>
              </div>

              {/* Opening Stock & Unit */}
              <div style={styles.twoColRow}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Opening Stock</label>
                  <input
                    type="number"
                    placeholder="0"
                    style={styles.karobarInput}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Measuring Unit</label>
                  <select
                    value={formData.primaryUnitId}
                    onChange={(e) => setFormData({ ...formData, primaryUnitId: e.target.value })}
                    style={styles.karobarSelect}
                  >
                    {units.map((u) => (
                      <option key={u._id} value={u._id}>
                        {u.name} ({u.abbreviation})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Sales Price & Purchase Price */}
              <div style={{ ...styles.twoColRow, marginTop: '16px' }}>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Sales Price</label>
                  <div style={styles.currencyInputWrapper}>
                    <span style={styles.currencyPrefix}>Rs.</span>
                    <input
                      type="text"
                      placeholder="0.00"
                      value={formData.salePrice}
                      onChange={(e) => setFormData({ ...formData, salePrice: e.target.value })}
                      style={styles.currencyInput}
                    />
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>Purchase Price</label>
                  <div style={styles.currencyInputWrapper}>
                    <span style={styles.currencyPrefix}>Rs.</span>
                    <input
                      type="text"
                      placeholder="0.00"
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                      style={styles.currencyInput}
                    />
                  </div>
                </div>
              </div>

              {/* Low Stock Alert Toggle Box */}
              <div style={styles.lowStockBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#10b981', fontSize: '16px' }}>🔔</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    Low Stock Alert ⓘ
                  </span>
                </div>
                <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#10b981' }} />
              </div>

              {/* Bottom Bar: Save & New / Add Item */}
              <div style={styles.itemModalFooter}>
                <button
                  type="button"
                  style={styles.saveAndNewBtn}
                  onClick={handleCreate}
                >
                  Save & New
                </button>
                <button type="submit" style={styles.addItemGreenBtn}>
                  Add Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BarcodeGeneratorModal
        item={selectedItemForBarcode}
        onClose={() => setSelectedItemForBarcode(null)}
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
  karobarItemModal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  karobarModalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
  },
  karobarModalTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
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
  twoColRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  productTypeActive: {
    flex: 1,
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1.5px solid #10b981',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  productTypeInactive: {
    flex: 1,
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  itemModalTabs: {
    display: 'flex',
    gap: '24px',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '8px',
    marginTop: '20px',
    marginBottom: '16px',
  },
  itemTabActive: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#10b981',
    borderBottom: '2px solid #10b981',
    paddingBottom: '8px',
    cursor: 'pointer',
  },
  itemTabInactive: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#64748b',
    cursor: 'pointer',
  },
  currencyInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  currencyPrefix: {
    position: 'absolute',
    left: '12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
  },
  currencyInput: {
    width: '100%',
    padding: '9px 12px 9px 36px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  lowStockBox: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    marginTop: '16px',
  },
  itemModalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '24px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
  },
  saveAndNewBtn: {
    padding: '9px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  addItemGreenBtn: {
    padding: '9px 20px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#10b981',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  closeBtn: { fontSize: '16px', color: '#64748b', border: 'none', backgroundColor: 'transparent', cursor: 'pointer' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '10px' },
  formRow: { display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', fontWeight: 600 },
  input: { padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' },
};
