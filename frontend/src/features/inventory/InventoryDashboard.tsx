import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Warehouse, StockBalance, StockMovement, LowStockItem } from '../../types/inventory';
import { Item, Firm } from '../../types/master';
import { formatDecimal } from '../../utils/decimal';
import { DataTable } from '../../components/common/DataTable';
import { Pagination } from '../../components/common/Pagination';

export const InventoryDashboard: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [activeTab, setActiveTab] = useState<'positions' | 'warehouses' | 'adjust' | 'transfer' | 'ledger'>('positions');

  // Master lists
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);

  // Positions Tab state
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [selectedWh, setSelectedWh] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Valuation summary
  const [totalValuation, setTotalValuation] = useState<string>('0.00');

  // Low stock alerts
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  // Warehouse Modal state
  const [showWhModal, setShowWhModal] = useState<boolean>(false);
  const [whName, setWhName] = useState<string>('');
  const [whCode, setWhCode] = useState<string>('');
  const [whFirmId, setWhFirmId] = useState<string>('');

  // Opening Stock Modal state
  const [showOpeningModal, setShowOpeningModal] = useState<boolean>(false);
  const [opWhId, setOpWhId] = useState<string>('');
  const [opItemId, setOpItemId] = useState<string>('');
  const [opQty, setOpQty] = useState<string>('100');
  const [opCost, setOpCost] = useState<string>('0.00');

  // Adjustment Form state
  const [adjWhId, setAdjWhId] = useState<string>('');
  const [adjItemId, setAdjItemId] = useState<string>('');
  const [adjReason, setAdjReason] = useState<'damage' | 'loss' | 'correction'>('damage');
  const [adjAction, setAdjAction] = useState<'add' | 'reduce'>('reduce');
  const [adjQty, setAdjQty] = useState<string>('1');
  const [adjCost, setAdjCost] = useState<string>('0.00');
  const [adjRemarks, setAdjRemarks] = useState<string>('');

  // Transfer Form state
  const [trSourceWh, setTrSourceWh] = useState<string>('');
  const [trTargetWh, setTrTargetWh] = useState<string>('');
  const [trItemId, setTrItemId] = useState<string>('');
  const [trQty, setTrQty] = useState<string>('1');
  const [trRemarks, setTrRemarks] = useState<string>('');

  // Ledger Tab state
  const [ledgerItemId, setLedgerItemId] = useState<string>('');
  const [ledgerMovements, setLedgerMovements] = useState<StockMovement[]>([]);

  const fetchBaseMetadata = async () => {
    if (!currentOrg?._id) return;
    try {
      const [whRes, itemRes, firmRes] = await Promise.all([
        apiClient.get(`/organizations/${currentOrg._id}/warehouses`),
        apiClient.get(`/organizations/${currentOrg._id}/items`, { params: { limit: 100 } }),
        apiClient.get(`/organizations/${currentOrg._id}/firms`),
      ]);
      setWarehouses(whRes.data.data);
      setItems(itemRes.data.data);
      setFirms(firmRes.data.data);

      if (whRes.data.data.length > 0) {
        setAdjWhId(whRes.data.data[0]._id);
        setTrSourceWh(whRes.data.data[0]._id);
        if (whRes.data.data.length > 1) {
          setTrTargetWh(whRes.data.data[1]._id);
        }
        setOpWhId(whRes.data.data[0]._id);
      }
      if (itemRes.data.data.length > 0) {
        setAdjItemId(itemRes.data.data[0]._id);
        setTrItemId(itemRes.data.data[0]._id);
        setLedgerItemId(itemRes.data.data[0]._id);
        setOpItemId(itemRes.data.data[0]._id);
      }
      if (firmRes.data.data.length > 0) {
        setWhFirmId(firmRes.data.data[0]._id);
      }
    } catch (e) {
      console.error('Failed to load inventory metadata', e);
    }
  };

  const fetchBalances = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const [balRes, valRes, lowRes] = await Promise.all([
        apiClient.get(`/organizations/${currentOrg._id}/inventory/balances`, {
          params: { page, limit: 10, warehouseId: selectedWh },
        }),
        apiClient.get(`/organizations/${currentOrg._id}/inventory/reports/valuation`),
        apiClient.get(`/organizations/${currentOrg._id}/inventory/reports/low-stock`),
      ]);
      setBalances(balRes.data.data);
      setTotalPages(balRes.data.pagination.totalPages);
      setTotalRecords(balRes.data.pagination.totalRecords);
      setTotalValuation(valRes.data.data.totalValuation);
      setLowStockItems(lowRes.data.data);
    } catch (e) {
      console.error('Failed to load stock positions', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLedger = async () => {
    if (!currentOrg?._id || !ledgerItemId) return;
    try {
      const res = await apiClient.get(`/organizations/${currentOrg._id}/inventory/ledger/${ledgerItemId}`);
      setLedgerMovements(res.data.data);
    } catch (e) {
      console.error('Failed to load ledger', e);
    }
  };

  useEffect(() => {
    fetchBaseMetadata();
  }, [currentOrg?._id]);

  useEffect(() => {
    fetchBalances();
  }, [currentOrg?._id, selectedWh, page]);

  useEffect(() => {
    if (activeTab === 'ledger' && ledgerItemId) {
      fetchLedger();
    }
  }, [activeTab, ledgerItemId]);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?._id) return;
    try {
      await apiClient.post(`/organizations/${currentOrg._id}/warehouses`, {
        name: whName,
        code: whCode,
        firmId: whFirmId,
      });
      setShowWhModal(false);
      setWhName('');
      setWhCode('');
      fetchBaseMetadata();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating warehouse');
    }
  };

  const handleOpeningStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?._id) return;
    try {
      await apiClient.post(`/organizations/${currentOrg._id}/inventory/opening-stock`, {
        warehouseId: opWhId,
        items: [{ itemId: opItemId, quantity: opQty, costRate: opCost }],
      });
      setShowOpeningModal(false);
      fetchBalances();
      alert('Opening stock ingested successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording opening stock');
    }
  };

  const handleAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?._id) return;
    try {
      await apiClient.post(`/organizations/${currentOrg._id}/inventory/adjustments`, {
        warehouseId: adjWhId,
        itemId: adjItemId,
        reason: adjReason,
        action: adjAction,
        quantity: adjQty,
        unitCost: adjCost,
        remarks: adjRemarks,
      });
      setAdjRemarks('');
      fetchBalances();
      alert('Stock adjustment recorded successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording adjustment');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?._id) return;
    try {
      await apiClient.post(`/organizations/${currentOrg._id}/inventory/transfers`, {
        sourceWarehouseId: trSourceWh,
        targetWarehouseId: trTargetWh,
        items: [{ itemId: trItemId, quantity: trQty }],
        remarks: trRemarks,
      });
      setTrRemarks('');
      fetchBalances();
      alert('Stock transferred successfully');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error transferring stock');
    }
  };

  const balanceColumns = [
    {
      header: 'SKU / Item',
      accessor: (b: StockBalance) => (
        <div>
          <div style={{ fontWeight: 600, color: '#0f172a' }}>{b.itemId?.name || 'Item'}</div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
            {b.itemId?.code}
          </div>
        </div>
      ),
    },
    {
      header: 'Warehouse',
      accessor: (b: StockBalance) => (typeof b.warehouseId === 'object' ? b.warehouseId?.name : 'Default Store'),
    },
    {
      header: 'On-Hand Qty',
      accessor: (b: StockBalance) => {
        const qty = Number(formatDecimal(b.quantity));
        const min = Number(formatDecimal(b.itemId?.minimumStock));
        const isLow = qty <= min;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong>{formatDecimal(b.quantity)}</strong>
            {isLow && <span style={styles.lowBadge}>Low Stock</span>}
          </div>
        );
      },
    },
    {
      header: 'WAC Unit Cost',
      accessor: (b: StockBalance) => `NPR ${formatDecimal(b.averageCost)}`,
    },
    {
      header: 'Valuation (NPR)',
      accessor: (b: StockBalance) => (
        <strong style={{ color: '#047857' }}>NPR {formatDecimal(b.totalValuation)}</strong>
      ),
    },
  ];

  const ledgerColumns = [
    {
      header: 'Date',
      accessor: (m: StockMovement) => new Date(m.date).toLocaleDateString(),
    },
    {
      header: 'Type',
      accessor: (m: StockMovement) => (
        <span
          style={{
            ...styles.typeBadge,
            backgroundColor: m.direction === 'IN' ? '#ecfdf5' : '#fef2f2',
            color: m.direction === 'IN' ? '#059669' : '#dc2626',
          }}
        >
          {m.direction}: {m.type}
        </span>
      ),
    },
    {
      header: 'Warehouse',
      accessor: (m: StockMovement) => m.warehouseId?.name || 'Store',
    },
    {
      header: 'Quantity',
      accessor: (m: StockMovement) => (
        <strong>
          {m.direction === 'IN' ? '+' : '-'}
          {formatDecimal(m.quantity)}
        </strong>
      ),
    },
    {
      header: 'Cost Rate',
      accessor: (m: StockMovement) => `NPR ${formatDecimal(m.costRate)}`,
    },
    {
      header: 'Remarks',
      accessor: (m: StockMovement) => m.remarks || '—',
    },
  ];

  return (
    <div>
      {/* Header with KPI cards */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Inventory Management & Stock Subledger</h1>
          <p style={styles.subtitle}>
            Multi-store tracking, append-only ledger, and real-time Weighted Average Costing (NPR).
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={styles.btnSecondary} onClick={() => setShowOpeningModal(true)}>
            📦 Opening Stock
          </button>
          <button style={styles.btnPrimary} onClick={() => setShowWhModal(true)}>
            + Add Warehouse
          </button>
        </div>
      </div>

      {/* KPI Highlights */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Total Inventory Valuation</span>
          <span style={styles.kpiValue}>NPR {totalValuation}</span>
          <span style={styles.kpiSub}>Weighted Average Cost basis</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Active Warehouses</span>
          <span style={styles.kpiValue}>{warehouses.length} Godowns</span>
          <span style={styles.kpiSub}>Across registered branches</span>
        </div>
        <div style={styles.kpiCard}>
          <span style={styles.kpiLabel}>Low Stock Alerts</span>
          <span style={{ ...styles.kpiValue, color: lowStockItems.length > 0 ? '#d97706' : '#0f172a' }}>
            {lowStockItems.length} SKUs
          </span>
          <span style={styles.kpiSub}>Below reorder threshold</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setActiveTab('positions')}
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'positions' ? '2px solid #1e3a8a' : 'none' }}
        >
          📊 Stock Positions
        </button>
        <button
          onClick={() => setActiveTab('warehouses')}
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'warehouses' ? '2px solid #1e3a8a' : 'none' }}
        >
          🏢 Warehouses ({warehouses.length})
        </button>
        <button
          onClick={() => setActiveTab('adjust')}
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'adjust' ? '2px solid #1e3a8a' : 'none' }}
        >
          ✏️ Stock Adjustment
        </button>
        <button
          onClick={() => setActiveTab('transfer')}
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'transfer' ? '2px solid #1e3a8a' : 'none' }}
        >
          🔄 Inter-Store Transfer
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          style={{ ...styles.tabBtn, borderBottom: activeTab === 'ledger' ? '2px solid #1e3a8a' : 'none' }}
        >
          📜 Item Subledger
        </button>
      </div>

      {/* TAB 1: Stock Positions */}
      {activeTab === 'positions' && (
        <div>
          <div style={styles.filterBar}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Filter Location:</label>
            <select
              value={selectedWh}
              onChange={(e) => {
                setSelectedWh(e.target.value);
                setPage(1);
              }}
              style={styles.select}
            >
              <option value="all">All Warehouses & Godowns</option>
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <DataTable columns={balanceColumns} data={balances} isLoading={loading} />
          <Pagination
            page={page}
            totalPages={totalPages}
            totalRecords={totalRecords}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* TAB 2: Warehouses */}
      {activeTab === 'warehouses' && (
        <div style={styles.grid}>
          {warehouses.map((w) => (
            <div key={w._id} style={styles.whCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styles.whCode}>{w.code}</span>
                {w.isDefault && <span style={styles.defaultBadge}>Default Store</span>}
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '8px 0 4px 0' }}>{w.name}</h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Branch: {typeof w.firmId === 'object' ? w.firmId?.name : 'Main Head Office'}
              </p>
              <div style={{ fontSize: '12px', color: '#334155', marginTop: '8px' }}>
                {w.address?.city}, {w.address?.district} • {w.address?.province}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Stock Adjustment */}
      {activeTab === 'adjust' && (
        <div style={styles.formCard}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Record Physical Stock Adjustment</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Book inventory write-offs for damaged goods, transit losses, or reconciliation corrections.
          </p>

          <form onSubmit={handleAdjustment} style={styles.formGrid}>
            <div style={styles.formRow}>
              <label>Warehouse</label>
              <select value={adjWhId} onChange={(e) => setAdjWhId(e.target.value)} style={styles.input}>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formRow}>
              <label>Inventory Item</label>
              <select value={adjItemId} onChange={(e) => setAdjItemId(e.target.value)} style={styles.input}>
                {items.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name} ({i.code})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formRow}>
              <label>Action</label>
              <select
                value={adjAction}
                onChange={(e) => setAdjAction(e.target.value as any)}
                style={styles.input}
              >
                <option value="reduce">Reduce Stock (-)</option>
                <option value="add">Add Stock (+)</option>
              </select>
            </div>

            <div style={styles.formRow}>
              <label>Reason Code</label>
              <select
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value as any)}
                style={styles.input}
              >
                <option value="damage">Damaged Goods</option>
                <option value="loss">Loss / Theft</option>
                <option value="correction">Physical Count Correction</option>
              </select>
            </div>

            <div style={styles.formRow}>
              <label>Quantity</label>
              <input
                type="number"
                step="0.01"
                required
                value={adjQty}
                onChange={(e) => setAdjQty(e.target.value)}
                style={styles.input}
              />
            </div>

            {adjAction === 'add' && (
              <div style={styles.formRow}>
                <label>Unit Cost Rate (NPR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={adjCost}
                  onChange={(e) => setAdjCost(e.target.value)}
                  style={styles.input}
                />
              </div>
            )}

            <div style={{ ...styles.formRow, gridColumn: '1 / -1' }}>
              <label>Adjustment Remarks</label>
              <input
                type="text"
                required
                placeholder="e.g. Broken packaging discovered during Shrawan month-end audit"
                value={adjRemarks}
                onChange={(e) => setAdjRemarks(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" style={{ ...styles.btnPrimary, width: '200px', marginTop: '10px' }}>
              Post Adjustment
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: Inter-Warehouse Transfer */}
      {activeTab === 'transfer' && (
        <div style={styles.formCard}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Inter-Warehouse Stock Transfer</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
            Dispatch items between branches while preserving exact unit cost valuation across stores.
          </p>

          <form onSubmit={handleTransfer} style={styles.formGrid}>
            <div style={styles.formRow}>
              <label>Source Store (From)</label>
              <select value={trSourceWh} onChange={(e) => setTrSourceWh(e.target.value)} style={styles.input}>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formRow}>
              <label>Destination Store (To)</label>
              <select value={trTargetWh} onChange={(e) => setTrTargetWh(e.target.value)} style={styles.input}>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formRow}>
              <label>Product Item</label>
              <select value={trItemId} onChange={(e) => setTrItemId(e.target.value)} style={styles.input}>
                {items.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name} ({i.code})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formRow}>
              <label>Transfer Quantity</label>
              <input
                type="number"
                step="0.01"
                required
                value={trQty}
                onChange={(e) => setTrQty(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.formRow, gridColumn: '1 / -1' }}>
              <label>Transfer Notes / Gate Pass Reference</label>
              <input
                type="text"
                placeholder="e.g. Gate pass #GP-892 dispatched via Truck BA-1-KHA 4567"
                value={trRemarks}
                onChange={(e) => setTrRemarks(e.target.value)}
                style={styles.input}
              />
            </div>

            <button type="submit" style={{ ...styles.btnPrimary, width: '220px', marginTop: '10px' }}>
              Dispatch Transfer
            </button>
          </form>
        </div>
      )}

      {/* TAB 5: Item Movement Subledger */}
      {activeTab === 'ledger' && (
        <div>
          <div style={styles.filterBar}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>Select Item to Inspect:</label>
            <select
              value={ledgerItemId}
              onChange={(e) => setLedgerItemId(e.target.value)}
              style={styles.select}
            >
              {items.map((i) => (
                <option key={i._id} value={i._id}>
                  {i.name} ({i.code})
                </option>
              ))}
            </select>
          </div>

          <DataTable columns={ledgerColumns} data={ledgerMovements} />
        </div>
      )}

      {/* Warehouse Modal */}
      {showWhModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>Add Storage Warehouse / Godown</h2>
              <button onClick={() => setShowWhModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateWarehouse} style={styles.modalForm}>
              <div style={styles.formRow}>
                <label>Warehouse Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balaju Central Godown"
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label>Warehouse Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. WH-BALAJU"
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label>Associated Firm / Branch</label>
                <select value={whFirmId} onChange={(e) => setWhFirmId(e.target.value)} style={styles.input}>
                  {firms.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name} ({f.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowWhModal(false)} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Opening Stock Modal */}
      {showOpeningModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2>Ingest Opening Stock Balance</h2>
              <button onClick={() => setShowOpeningModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>
            <form onSubmit={handleOpeningStock} style={styles.modalForm}>
              <div style={styles.formRow}>
                <label>Destination Warehouse</label>
                <select value={opWhId} onChange={(e) => setOpWhId(e.target.value)} style={styles.input}>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label>Product Item</label>
                <select value={opItemId} onChange={(e) => setOpItemId(e.target.value)} style={styles.input}>
                  {items.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label>Opening Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={opQty}
                  onChange={(e) => setOpQty(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label>Opening Cost Rate (NPR)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={opCost}
                  onChange={(e) => setOpCost(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowOpeningModal(false)} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Ingest Opening Stock
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
    border: '1px solid #cbd5e1',
  },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' },
  kpiCard: { backgroundColor: '#ffffff', padding: '16px 20px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  kpiLabel: { fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' },
  kpiValue: { fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '6px 0 2px 0', display: 'block' },
  kpiSub: { fontSize: '11px', color: '#94a3b8' },
  tabs: { display: 'flex', gap: '8px', borderBottom: '1px solid #e2e8f0', marginBottom: '20px' },
  tabBtn: { padding: '10px 16px', fontSize: '13px', fontWeight: 600, color: '#1e293b', background: 'none' },
  filterBar: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  select: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' },
  whCard: { backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' },
  whCode: { fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a', backgroundColor: '#eff6ff', padding: '2px 6px', borderRadius: '4px' },
  defaultBadge: { fontSize: '11px', fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5', padding: '2px 8px', borderRadius: '4px' },
  lowBadge: { fontSize: '10px', fontWeight: 700, color: '#d97706', backgroundColor: '#fffbeb', padding: '2px 6px', borderRadius: '4px' },
  typeBadge: { fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' },
  formCard: { backgroundColor: '#ffffff', padding: '24px', borderRadius: '8px', border: '1px solid #e2e8f0', maxWidth: '720px' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' },
  formRow: { display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '12px', fontWeight: 600 },
  input: { padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
  modal: { backgroundColor: '#ffffff', borderRadius: '8px', width: '460px', padding: '24px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)' },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  closeBtn: { fontSize: '16px', color: '#64748b' },
  modalForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' },
};
