import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Warehouse, StockBalance, StockMovement, LowStockItem } from '../../types/inventory';
import { Item, Firm } from '../../types/master';
import { formatDecimal } from '../../utils/decimal';
import { DataTable } from '../../components/common/DataTable';
import { Pagination } from '../../components/common/Pagination';

interface BatchRecord {
  id: string;
  itemId: string;
  itemName: string;
  batchNumber: string;
  mfgDate: string;
  expDate: string;
  warehouseId: string;
  warehouseName: string;
  quantity: number;
  mrp: number;
}

interface TransferGatePass {
  transferNumber: string;
  sourceWhName: string;
  targetWhName: string;
  itemName: string;
  quantity: number;
  date: string;
  vehicleNumber?: string;
  driverName?: string;
  remarks?: string;
}

export const InventoryDashboard: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'positions' | 'warehouses' | 'batches' | 'reorder' | 'adjust' | 'transfer' | 'ledger'>('positions');

  // Master lists
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);

  // Positions Tab state
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [selectedWh, setSelectedWh] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);

  // Valuation summary
  const [totalValuation, setTotalValuation] = useState<string>('0.00');

  // Low stock alerts
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

  // Batches state (Simulated & Local storage synced)
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [bItemId, setBItemId] = useState('');
  const [bWhId, setBWhId] = useState('');
  const [bNumber, setBNumber] = useState('BAT-2026-01');
  const [bMfgDate, setBMfgDate] = useState('2026-01-01');
  const [bExpDate, setBExpDate] = useState('2026-10-30');
  const [bQty, setBQty] = useState('50');
  const [bMrp, setBMrp] = useState('250.00');

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
  const [adjReason, setAdjReason] = useState<'damage' | 'loss' | 'correction' | 'expired'>('damage');
  const [adjAction, setAdjAction] = useState<'add' | 'reduce'>('reduce');
  const [adjQty, setAdjQty] = useState<string>('1');
  const [adjCost, setAdjCost] = useState<string>('0.00');
  const [adjRemarks, setAdjRemarks] = useState<string>('');

  // Physical Count Reconcile state
  const [auditPhysicalQty, setAuditPhysicalQty] = useState<string>('');

  // Transfer Form state
  const [trSourceWh, setTrSourceWh] = useState<string>('');
  const [trTargetWh, setTrTargetWh] = useState<string>('');
  const [trItemId, setTrItemId] = useState<string>('');
  const [trQty, setTrQty] = useState<string>('1');
  const [trVehicle, setTrVehicle] = useState<string>('');
  const [trDriver, setTrDriver] = useState<string>('');
  const [trRemarks, setTrRemarks] = useState<string>('');
  const [lastGatePass, setLastGatePass] = useState<TransferGatePass | null>(null);

  // Ledger Tab state
  const [ledgerItemId, setLedgerItemId] = useState<string>('');
  const [ledgerMovements, setLedgerMovements] = useState<StockMovement[]>([]);

  const fetchBaseMetadata = async () => {
    if (!currentOrg?._id) return;
    try {
      const [whRes, itemRes, firmRes] = await Promise.all([
        apiClient.get(`/organizations/${currentOrg._id}/warehouses`),
        apiClient.get(`/organizations/${currentOrg._id}/items`, { params: { limit: 150 } }),
        apiClient.get(`/organizations/${currentOrg._id}/firms`),
      ]);
      setWarehouses(whRes.data.data || []);
      setItems(itemRes.data.data || []);
      setFirms(firmRes.data.data || []);

      if (whRes.data.data?.length > 0) {
        setAdjWhId(whRes.data.data[0]._id);
        setTrSourceWh(whRes.data.data[0]._id);
        if (whRes.data.data.length > 1) {
          setTrTargetWh(whRes.data.data[1]._id);
        } else {
          setTrTargetWh(whRes.data.data[0]._id);
        }
        setOpWhId(whRes.data.data[0]._id);
        setBWhId(whRes.data.data[0]._id);
      }
      if (itemRes.data.data?.length > 0) {
        setAdjItemId(itemRes.data.data[0]._id);
        setTrItemId(itemRes.data.data[0]._id);
        setLedgerItemId(itemRes.data.data[0]._id);
        setOpItemId(itemRes.data.data[0]._id);
        setBItemId(itemRes.data.data[0]._id);

        // Seed demo batches if empty
        const sampleBatches: BatchRecord[] = [
          {
            id: 'b-1',
            itemId: itemRes.data.data[0]._id,
            itemName: itemRes.data.data[0].name,
            batchNumber: 'LOT-2026/A',
            mfgDate: '2026-01-10',
            expDate: '2026-09-25', // Near expiry (<30 days)
            warehouseId: whRes.data.data[0]?._id || '',
            warehouseName: whRes.data.data[0]?.name || 'Central Godown',
            quantity: 35,
            mrp: Number(formatDecimal(itemRes.data.data[0].salePrice || 120)),
          },
          {
            id: 'b-2',
            itemId: itemRes.data.data[0]._id,
            itemName: itemRes.data.data[0].name,
            batchNumber: 'LOT-2026/B',
            mfgDate: '2026-02-15',
            expDate: '2027-04-30', // Fresh
            warehouseId: whRes.data.data[0]?._id || '',
            warehouseName: whRes.data.data[0]?.name || 'Central Godown',
            quantity: 120,
            mrp: Number(formatDecimal(itemRes.data.data[0].salePrice || 120)),
          },
        ];
        setBatches(sampleBatches);
      }
      if (firmRes.data.data?.length > 0) {
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
          params: { page, limit: 15, warehouseId: selectedWh === 'all' ? undefined : selectedWh },
        }),
        apiClient.get(`/organizations/${currentOrg._id}/inventory/reports/valuation`),
        apiClient.get(`/organizations/${currentOrg._id}/inventory/reports/low-stock`),
      ]);
      setBalances(balRes.data.data || []);
      setTotalPages(balRes.data.pagination?.totalPages || 1);
      setTotalRecords(balRes.data.pagination?.totalRecords || (balRes.data.data || []).length);
      setTotalValuation(valRes.data.data?.totalValuation || '0.00');
      setLowStockItems(lowRes.data.data || []);
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
      setLedgerMovements(res.data.data || []);
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
      alert('Godown / Warehouse created successfully!');
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
      alert('Opening stock ingested successfully!');
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
        reason: adjReason === 'expired' ? 'damage' : adjReason,
        action: adjAction,
        quantity: adjQty,
        unitCost: adjCost,
        remarks: `[${adjReason.toUpperCase()}] ${adjRemarks || 'Physical Stock Reconciliation'}`,
      });
      setAdjRemarks('');
      setAuditPhysicalQty('');
      fetchBalances();
      alert('Stock adjustment recorded & General Ledger updated successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording adjustment');
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?._id) return;
    if (trSourceWh === trTargetWh) {
      alert('Source and destination warehouse cannot be the same!');
      return;
    }

    try {
      await apiClient.post(`/organizations/${currentOrg._id}/inventory/transfers`, {
        sourceWarehouseId: trSourceWh,
        targetWarehouseId: trTargetWh,
        items: [{ itemId: trItemId, quantity: trQty }],
        remarks: `Vehicle: ${trVehicle || 'N/A'}, Driver: ${trDriver || 'N/A'}. ${trRemarks}`,
      });

      const sWh = warehouses.find((w) => w._id === trSourceWh);
      const tWh = warehouses.find((w) => w._id === trTargetWh);
      const it = items.find((i) => i._id === trItemId);

      setLastGatePass({
        transferNumber: `GP-${Date.now().toString().slice(-6)}`,
        sourceWhName: sWh?.name || 'Source Godown',
        targetWhName: tWh?.name || 'Target Godown',
        itemName: it?.name || 'Product',
        quantity: Number(trQty),
        date: new Date().toLocaleDateString(),
        vehicleNumber: trVehicle,
        driverName: trDriver,
        remarks: trRemarks,
      });

      setTrRemarks('');
      setTrVehicle('');
      setTrDriver('');
      fetchBalances();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error transferring stock');
    }
  };

  const handleAddBatch = (e: React.FormEvent) => {
    e.preventDefault();
    const it = items.find((i) => i._id === bItemId);
    const wh = warehouses.find((w) => w._id === bWhId);

    const newBatch: BatchRecord = {
      id: `b-${Date.now()}`,
      itemId: bItemId,
      itemName: it?.name || 'Product',
      batchNumber: bNumber,
      mfgDate: bMfgDate,
      expDate: bExpDate,
      warehouseId: bWhId,
      warehouseName: wh?.name || 'Godown',
      quantity: Number(bQty) || 0,
      mrp: Number(bMrp) || 0,
    };

    setBatches((prev) => [newBatch, ...prev]);
    setShowBatchModal(false);
    alert(`Batch ${bNumber} registered successfully!`);
  };

  // Filtered stock positions
  const displayedBalances = useMemo(() => {
    if (!searchFilter.trim()) return balances;
    const term = searchFilter.toLowerCase();
    return balances.filter(
      (b) =>
        b.itemId?.name?.toLowerCase().includes(term) ||
        b.itemId?.code?.toLowerCase().includes(term) ||
        (typeof b.warehouseId === 'object' && b.warehouseId?.name?.toLowerCase().includes(term))
    );
  }, [balances, searchFilter]);

  // Selected item stock for reconciliation
  const selectedAdjustmentBalance = useMemo(() => {
    return balances.find((b) => b.itemId?._id === adjItemId && (typeof b.warehouseId === 'object' ? b.warehouseId?._id : b.warehouseId) === adjWhId);
  }, [balances, adjItemId, adjWhId]);

  const balanceColumns = [
    {
      header: 'SKU / Item',
      accessor: (b: StockBalance) => (
        <div>
          <div style={{ fontWeight: 700, color: '#0f172a' }}>{b.itemId?.name || 'Item'}</div>
          <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#64748b' }}>
            SKU: {b.itemId?.code}
          </div>
        </div>
      ),
    },
    {
      header: 'Storage Godown',
      accessor: (b: StockBalance) => (
        <span style={styles.godownBadge}>
          🏢 {typeof b.warehouseId === 'object' ? b.warehouseId?.name : 'Main Store'}
        </span>
      ),
    },
    {
      header: 'On-Hand Stock',
      accessor: (b: StockBalance) => {
        const qty = Number(formatDecimal(b.quantity));
        const min = Number(formatDecimal(b.itemId?.minimumStock || 10));
        const isLow = qty <= min;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <strong style={{ fontSize: '14px', fontFamily: 'monospace', color: qty > 0 ? '#0f172a' : '#dc2626' }}>
              {formatDecimal(b.quantity)} {b.itemId?.primaryUnitId?.abbreviation || 'PCS'}
            </strong>
            {isLow && <span style={styles.lowBadge}>⚠️ Low Stock</span>}
          </div>
        );
      },
    },
    {
      header: 'WAC Cost (NPR)',
      accessor: (b: StockBalance) => (
        <span style={{ fontFamily: 'monospace' }}>NPR {formatDecimal(b.averageCost)}</span>
      ),
    },
    {
      header: 'Total Valuation (NPR)',
      accessor: (b: StockBalance) => (
        <strong style={{ color: '#10b981', fontFamily: 'monospace' }}>
          NPR {formatDecimal(b.totalValuation)}
        </strong>
      ),
    },
    {
      header: 'Quick Action',
      accessor: (b: StockBalance) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            style={styles.actionBtn}
            onClick={() => {
              setLedgerItemId(b.itemId?._id);
              setActiveTab('ledger');
            }}
            title="Inspect Stock Ledger"
          >
            📜 Ledger
          </button>
          <button
            style={{ ...styles.actionBtn, backgroundColor: '#f0fdf4', color: '#16a34a' }}
            onClick={() => {
              setAdjItemId(b.itemId?._id);
              setAdjWhId(typeof b.warehouseId === 'object' ? b.warehouseId?._id : b.warehouseId);
              setActiveTab('adjust');
            }}
            title="Reconcile / Adjust Stock"
          >
            ✏️ Reconcile
          </button>
        </div>
      ),
    },
  ];

  const ledgerColumns = [
    {
      header: 'Date',
      accessor: (m: StockMovement) => new Date(m.date).toLocaleDateString(),
    },
    {
      header: 'Movement Type',
      accessor: (m: StockMovement) => (
        <span
          style={{
            ...styles.typeBadge,
            backgroundColor: m.direction === 'IN' ? '#ecfdf5' : '#fef2f2',
            color: m.direction === 'IN' ? '#059669' : '#dc2626',
          }}
        >
          {m.direction === 'IN' ? '↓ IN' : '↑ OUT'}: {m.type.toUpperCase()}
        </span>
      ),
    },
    {
      header: 'Godown',
      accessor: (m: StockMovement) => m.warehouseId?.name || 'Main Godown',
    },
    {
      header: 'Quantity',
      accessor: (m: StockMovement) => (
        <strong style={{ fontFamily: 'monospace', color: m.direction === 'IN' ? '#059669' : '#dc2626' }}>
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
      header: 'Remarks / Reference',
      accessor: (m: StockMovement) => m.remarks || 'Standard transaction movement',
    },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={styles.title}>Smart Inventory & Warehouse Engine</h1>
            <span style={styles.tag}>WAC & FIFO</span>
          </div>
          <p style={styles.subtitle}>
            Multi-godown tracking, Batch & Expiry Radar, inter-store transfer chalans, and automated stock reconciliation.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button style={styles.btnSecondary} onClick={() => setShowOpeningModal(true)}>
            📦 Opening Stock
          </button>
          <button style={styles.btnSecondary} onClick={() => setShowBatchModal(true)}>
            🏷️ Register Batch
          </button>
          <button style={styles.btnPrimary} onClick={() => setShowWhModal(true)}>
            + Add Godown
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Total Inventory Asset Value</span>
            <span style={{ fontSize: '18px' }}>💰</span>
          </div>
          <div style={{ ...styles.kpiValue, color: '#10b981' }}>NPR {formatDecimal(totalValuation)}</div>
          <div style={styles.kpiSub}>Weighted Average Cost basis</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Active Warehouses / Godowns</span>
            <span style={{ fontSize: '18px' }}>🏢</span>
          </div>
          <div style={styles.kpiValue}>{warehouses.length} Locations</div>
          <div style={styles.kpiSub}>Kathmandu & Branch distribution</div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Reorder Alert (Low Stock)</span>
            <span style={{ fontSize: '18px' }}>⚠️</span>
          </div>
          <div style={{ ...styles.kpiValue, color: lowStockItems.length > 0 ? '#ef4444' : '#10b981' }}>
            {lowStockItems.length} SKUs Below Min
          </div>
          <div style={styles.kpiSub}>
            {lowStockItems.length > 0 ? 'Urgent purchase required' : 'Stock levels optimal'}
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiHeader}>
            <span style={styles.kpiLabel}>Batches Monitored</span>
            <span style={{ fontSize: '18px' }}>🏷️</span>
          </div>
          <div style={styles.kpiValue}>{batches.length} Active Lots</div>
          <div style={styles.kpiSub}>Tracked with expiry dates</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={styles.tabsBar}>
        <button
          onClick={() => setActiveTab('positions')}
          style={{ ...styles.tabBtn, ...(activeTab === 'positions' ? styles.tabBtnActive : {}) }}
        >
          📊 Stock Positions ({balances.length})
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          style={{ ...styles.tabBtn, ...(activeTab === 'batches' ? styles.tabBtnActive : {}) }}
        >
          🏷️ Batches & Expiry Radar
        </button>
        <button
          onClick={() => setActiveTab('reorder')}
          style={{ ...styles.tabBtn, ...(activeTab === 'reorder' ? styles.tabBtnActive : {}) }}
        >
          ⚠️ Reorder Desk ({lowStockItems.length})
        </button>
        <button
          onClick={() => setActiveTab('transfer')}
          style={{ ...styles.tabBtn, ...(activeTab === 'transfer' ? styles.tabBtnActive : {}) }}
        >
          🔄 Inter-Store Transfer
        </button>
        <button
          onClick={() => setActiveTab('adjust')}
          style={{ ...styles.tabBtn, ...(activeTab === 'adjust' ? styles.tabBtnActive : {}) }}
        >
          ✏️ Physical Count & Audit
        </button>
        <button
          onClick={() => setActiveTab('warehouses')}
          style={{ ...styles.tabBtn, ...(activeTab === 'warehouses' ? styles.tabBtnActive : {}) }}
        >
          🏢 Godowns ({warehouses.length})
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          style={{ ...styles.tabBtn, ...(activeTab === 'ledger' ? styles.tabBtnActive : {}) }}
        >
          📜 Item Subledger
        </button>
      </div>

      {/* ===================== TAB 1: POSITIONS ===================== */}
      {activeTab === 'positions' && (
        <div>
          <div style={styles.filterBar}>
            <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
              <input
                type="text"
                placeholder="Search by Product Name, Code, Godown..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                style={styles.inputSearch}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>Filter Godown:</label>
              <select
                value={selectedWh}
                onChange={(e) => {
                  setSelectedWh(e.target.value);
                  setPage(1);
                }}
                style={styles.select}
              >
                <option value="all">All Storage Locations</option>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name} ({w.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={styles.tableCard}>
            <DataTable columns={balanceColumns} data={displayedBalances} isLoading={loading} />
            <Pagination
              page={page}
              totalPages={totalPages}
              totalRecords={totalRecords}
              onPageChange={(p) => setPage(p)}
            />
          </div>
        </div>
      )}

      {/* ===================== TAB 2: BATCHES & EXPIRY RADAR ===================== */}
      {activeTab === 'batches' && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Batch & Expiry Date Radar
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Monitors near-expiry FMCG, grocery, and pharmaceutical stocks before they lapse.
              </p>
            </div>
            <button style={styles.btnPrimary} onClick={() => setShowBatchModal(true)}>
              + New Batch Lot
            </button>
          </div>

          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Batch / Lot #</th>
                <th style={styles.th}>Item / SKU</th>
                <th style={styles.th}>Godown</th>
                <th style={styles.th}>MFG Date</th>
                <th style={styles.th}>Expiry Date</th>
                <th style={{ ...styles.th, textAlign: 'center' }}>Shelf Status</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Stock Qty</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>MRP (NPR)</th>
              </tr>
            </thead>
            <tbody>
              {batches.map((b) => {
                const today = new Date();
                const exp = new Date(b.expDate);
                const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isExpired = diffDays <= 0;
                const isNearExpiry = diffDays > 0 && diffDays <= 30;

                return (
                  <tr key={b.id} style={styles.tr}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 800, color: '#10b981' }}>
                      {b.batchNumber}
                    </td>
                    <td style={{ ...styles.td, fontWeight: 700, color: '#0f172a' }}>{b.itemName}</td>
                    <td style={styles.td}>{b.warehouseName}</td>
                    <td style={styles.td}>{b.mfgDate}</td>
                    <td style={{ ...styles.td, fontWeight: 600 }}>{b.expDate}</td>
                    <td style={{ ...styles.td, textAlign: 'center' }}>
                      {isExpired ? (
                        <span style={{ ...styles.statusPill, backgroundColor: '#fef2f2', color: '#dc2626' }}>
                          🔴 EXPIRED
                        </span>
                      ) : isNearExpiry ? (
                        <span style={{ ...styles.statusPill, backgroundColor: '#fffbeb', color: '#d97706' }}>
                          🟡 {diffDays} DAYS LEFT
                        </span>
                      ) : (
                        <span style={{ ...styles.statusPill, backgroundColor: '#ecfdf5', color: '#059669' }}>
                          🟢 FRESH ({diffDays}d)
                        </span>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, fontFamily: 'monospace' }}>
                      {b.quantity} PCS
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>
                      NPR {formatDecimal(b.mrp)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===================== TAB 3: REORDER DESK ===================== */}
      {activeTab === 'reorder' && (
        <div style={styles.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Automated Reorder Desk
              </h2>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                Items that have fallen below safety reorder thresholds. Order replenishment with 1-click.
              </p>
            </div>
            <button
              style={styles.btnPrimary}
              onClick={() => navigate('/purchases')}
            >
              + Create Purchase Bill →
            </button>
          </div>

          {lowStockItems.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎉</div>
              <strong>No Low Stock Items!</strong>
              <div style={{ fontSize: '12px', marginTop: '4px' }}>All item inventory levels are above safety reorder points.</div>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>SKU / Code</th>
                  <th style={styles.th}>Item Name</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Current Stock</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Min Safety Level</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Deficit Units</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Unit Cost</th>
                  <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map((l: any, idx: number) => {
                  const currentQty = Number(l.currentStock || 0);
                  const minQty = Number(l.item?.minimumStock || 10);
                  const deficit = Math.max(0, minQty - currentQty);

                  return (
                    <tr key={idx} style={styles.tr}>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700 }}>{l.item?.code}</td>
                      <td style={{ ...styles.td, fontWeight: 700, color: '#0f172a' }}>{l.item?.name}</td>
                      <td style={{ ...styles.td, textAlign: 'center', color: '#dc2626', fontWeight: 800, fontFamily: 'monospace' }}>
                        {currentQty}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center', fontFamily: 'monospace' }}>{minQty}</td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <span style={{ backgroundColor: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '12px' }}>
                          -{deficit} PCS
                        </span>
                      </td>
                      <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>
                        NPR {formatDecimal(l.item?.purchasePrice || 0)}
                      </td>
                      <td style={{ ...styles.td, textAlign: 'center' }}>
                        <button
                          style={{ ...styles.actionBtn, backgroundColor: '#10b981', color: '#ffffff', border: 'none' }}
                          onClick={() => navigate('/purchases')}
                        >
                          ⚡ Reorder Now
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===================== TAB 4: INTER-STORE TRANSFER ===================== */}
      {activeTab === 'transfer' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
          <div style={styles.formCard}>
            <h2 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px', color: '#0f172a' }}>
              Inter-Warehouse Stock Transfer
            </h2>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '18px' }}>
              Dispatch inventory between branches while preserving exact WAC cost valuation.
            </p>

            <form onSubmit={handleTransfer} style={styles.formGrid}>
              <div style={styles.formRow}>
                <label style={styles.label}>Source Store (From Godown)</label>
                <select value={trSourceWh} onChange={(e) => setTrSourceWh(e.target.value)} style={styles.input}>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Destination Store (To Godown)</label>
                <select value={trTargetWh} onChange={(e) => setTrTargetWh(e.target.value)} style={styles.input}>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Item to Transfer</label>
                <select value={trItemId} onChange={(e) => setTrItemId(e.target.value)} style={styles.input}>
                  {items.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Transfer Quantity</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={trQty}
                  onChange={(e) => setTrQty(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Vehicle Number (गाडी नं)</label>
                <input
                  type="text"
                  placeholder="e.g. BA-1-KHA 4567"
                  value={trVehicle}
                  onChange={(e) => setTrVehicle(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Driver Name / Contact</label>
                <input
                  type="text"
                  placeholder="e.g. Shyam Kumar (9812345678)"
                  value={trDriver}
                  onChange={(e) => setTrDriver(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ ...styles.formRow, gridColumn: '1 / -1' }}>
                <label style={styles.label}>Gate Pass Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Dispatched for weekend replenishment"
                  value={trRemarks}
                  onChange={(e) => setTrRemarks(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
                <button type="submit" style={styles.btnPrimary}>
                  ✓ Dispatch Transfer & Issue Gate Pass
                </button>
              </div>
            </form>
          </div>

          {/* Gate Pass Printable Card */}
          <div style={styles.formCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Transfer Gate Pass (चलानी पुर्जी)
              </h3>
              {lastGatePass && (
                <button style={styles.btnSecondary} onClick={() => window.print()}>
                  🖨️ Print Pass
                </button>
              )}
            </div>

            {lastGatePass ? (
              <div style={styles.gatePassSheet}>
                <div style={{ textAlign: 'center', borderBottom: '1.5px solid #0f172a', paddingBottom: '8px', marginBottom: '12px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981' }}>SMART BILLING ERP</div>
                  <div style={{ fontSize: '15px', fontWeight: 900 }}>अन्तर-गोदाम चलानी पुर्जी (GATE PASS)</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Pass #: {lastGatePass.transferNumber} • Date: {lastGatePass.date}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Source Godown:</span>
                    <strong>{lastGatePass.sourceWhName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Target Godown:</span>
                    <strong>{lastGatePass.targetWhName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Item Description:</span>
                    <strong>{lastGatePass.itemName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Quantity Dispatched:</span>
                    <strong style={{ fontSize: '14px', color: '#10b981' }}>{lastGatePass.quantity} PCS</strong>
                  </div>
                  {lastGatePass.vehicleNumber && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Vehicle No:</span>
                      <span>{lastGatePass.vehicleNumber}</span>
                    </div>
                  )}
                  {lastGatePass.driverName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748b' }}>Driver:</span>
                      <span>{lastGatePass.driverName}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '28px', textAlign: 'center', fontSize: '10px' }}>
                  <div>
                    <div style={{ borderBottom: '1px dashed #0f172a', marginBottom: '4px' }}></div>
                    <span>Dispatched By</span>
                  </div>
                  <div>
                    <div style={{ borderBottom: '1px dashed #0f172a', marginBottom: '4px' }}></div>
                    <span>Received By (Godown Incharge)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '36px 16px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                Fill out the transfer form on the left to dispatch items and preview the official Gate Pass.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 5: PHYSICAL COUNT & AUDIT ===================== */}
      {activeTab === 'adjust' && (
        <div style={styles.formCard}>
          <h2 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '6px', color: '#0f172a' }}>
            Physical Stock Count & Variance Audit
          </h2>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '18px' }}>
            Compare physical counted inventory against system ledger, calculate variance, and post adjustments.
          </p>

          <form onSubmit={handleAdjustment} style={styles.formGrid}>
            <div style={styles.formRow}>
              <label style={styles.label}>Warehouse / Location</label>
              <select value={adjWhId} onChange={(e) => setAdjWhId(e.target.value)} style={styles.input}>
                {warehouses.map((w) => (
                  <option key={w._id} value={w._id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Inventory SKU</label>
              <select value={adjItemId} onChange={(e) => setAdjItemId(e.target.value)} style={styles.input}>
                {items.map((i) => (
                  <option key={i._id} value={i._id}>
                    {i.name} ({i.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Live Ledger Comparison Card */}
            <div style={{ ...styles.formRow, gridColumn: '1 / -1', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>SYSTEM RECORDED STOCK</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a', fontFamily: 'monospace', marginTop: '2px' }}>
                    {selectedAdjustmentBalance ? formatDecimal(selectedAdjustmentBalance.quantity) : '0.00'} Units
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>PHYSICAL COUNT (ACTUAL)</div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter physical count"
                    value={auditPhysicalQty}
                    onChange={(e) => {
                      setAuditPhysicalQty(e.target.value);
                      const physical = Number(e.target.value);
                      const recorded = Number(formatDecimal(selectedAdjustmentBalance?.quantity || 0));
                      const diff = physical - recorded;
                      if (diff < 0) {
                        setAdjAction('reduce');
                        setAdjQty(Math.abs(diff).toString());
                      } else {
                        setAdjAction('add');
                        setAdjQty(diff.toString());
                      }
                    }}
                    style={{ ...styles.input, marginTop: '4px' }}
                  />
                </div>

                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>VARIANCE DISCREPANCY</div>
                  <div
                    style={{
                      fontSize: '18px',
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      marginTop: '2px',
                      color:
                        Number(adjQty) > 0
                          ? adjAction === 'reduce'
                            ? '#dc2626'
                            : '#10b981'
                          : '#64748b',
                    }}
                  >
                    {adjAction === 'reduce' ? '-' : '+'}
                    {adjQty} Units
                  </div>
                </div>
              </div>
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Action</label>
              <select
                value={adjAction}
                onChange={(e) => setAdjAction(e.target.value as any)}
                style={styles.input}
              >
                <option value="reduce">Reduce Stock (-) / Write-off</option>
                <option value="add">Add Stock (+) / Surplus Found</option>
              </select>
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Discrepancy Reason</label>
              <select
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value as any)}
                style={styles.input}
              >
                <option value="damage">Damaged Goods / Broken</option>
                <option value="expired">Expired Stock Disposal</option>
                <option value="loss">Transit Loss / Theft</option>
                <option value="correction">Audit Physical Variance</option>
              </select>
            </div>

            <div style={styles.formRow}>
              <label style={styles.label}>Adjustment Quantity</label>
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
                <label style={styles.label}>Unit Cost Rate (NPR)</label>
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
              <label style={styles.label}>Audit Remarks & Approval</label>
              <input
                type="text"
                required
                placeholder="e.g. Month-end inventory verification audit approved by Manager"
                value={adjRemarks}
                onChange={(e) => setAdjRemarks(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={{ gridColumn: '1 / -1', marginTop: '6px' }}>
              <button type="submit" style={styles.btnPrimary}>
                ✓ Reconcile & Post GL Adjustment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ===================== TAB 6: GODOWNS ===================== */}
      {activeTab === 'warehouses' && (
        <div style={styles.grid}>
          {warehouses.map((w) => (
            <div key={w._id} style={styles.whCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={styles.whCode}>{w.code}</span>
                {w.isDefault && <span style={styles.defaultBadge}>Primary Store</span>}
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '10px 0 4px 0', color: '#0f172a' }}>
                {w.name}
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b' }}>
                Branch: {typeof w.firmId === 'object' ? w.firmId?.name : 'Main Head Office'}
              </p>
              <div style={{ fontSize: '12px', color: '#334155', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                📍 {w.address?.city || 'Kathmandu'}, {w.address?.district || 'Bagmati'}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===================== TAB 7: SUBLEDGER ===================== */}
      {activeTab === 'ledger' && (
        <div style={styles.card}>
          <div style={styles.filterBar}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>Select Item to Inspect Subledger:</label>
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

      {/* ===================== MODAL: CREATE WAREHOUSE ===================== */}
      {showWhModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Add New Godown / Warehouse</h2>
              <button onClick={() => setShowWhModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateWarehouse} style={styles.modalForm}>
              <div style={styles.formRow}>
                <label style={styles.label}>Warehouse Name *</label>
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
                <label style={styles.label}>Godown Code *</label>
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
                <label style={styles.label}>Associated Branch / Firm</label>
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
                  Save Godown
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: OPENING STOCK ===================== */}
      {showOpeningModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Ingest Opening Stock Balance</h2>
              <button onClick={() => setShowOpeningModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>
            <form onSubmit={handleOpeningStock} style={styles.modalForm}>
              <div style={styles.formRow}>
                <label style={styles.label}>Destination Godown</label>
                <select value={opWhId} onChange={(e) => setOpWhId(e.target.value)} style={styles.input}>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name} ({w.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Product SKU</label>
                <select value={opItemId} onChange={(e) => setOpItemId(e.target.value)} style={styles.input}>
                  {items.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Opening Quantity</label>
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
                <label style={styles.label}>Opening Unit Cost (NPR)</label>
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

      {/* ===================== MODAL: REGISTER BATCH ===================== */}
      {showBatchModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Register New Product Batch</h2>
              <button onClick={() => setShowBatchModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>
            <form onSubmit={handleAddBatch} style={styles.modalForm}>
              <div style={styles.formRow}>
                <label style={styles.label}>Product SKU *</label>
                <select value={bItemId} onChange={(e) => setBItemId(e.target.value)} style={styles.input}>
                  {items.map((i) => (
                    <option key={i._id} value={i._id}>
                      {i.name} ({i.code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Storage Godown</label>
                <select value={bWhId} onChange={(e) => setBWhId(e.target.value)} style={styles.input}>
                  {warehouses.map((w) => (
                    <option key={w._id} value={w._id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <label style={styles.label}>Batch / Lot Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BAT-2026-09"
                  value={bNumber}
                  onChange={(e) => setBNumber(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.label}>MFG Date</label>
                  <input
                    type="date"
                    required
                    value={bMfgDate}
                    onChange={(e) => setBMfgDate(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Expiry Date *</label>
                  <input
                    type="date"
                    required
                    value={bExpDate}
                    onChange={(e) => setBExpDate(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={styles.label}>Batch Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={bQty}
                    onChange={(e) => setBQty(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>MRP (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={bMrp}
                    onChange={(e) => setBMrp(e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formActions}>
                <button type="button" onClick={() => setShowBatchModal(false)} style={styles.btnSecondary}>
                  Cancel
                </button>
                <button type="submit" style={styles.btnPrimary}>
                  Save Batch
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
  tabsBar: {
    display: 'flex',
    gap: '6px',
    backgroundColor: '#ffffff',
    padding: '6px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    overflowX: 'auto',
  },
  tabBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#64748b',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  tabBtnActive: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: '#ffffff',
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    marginBottom: '12px',
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
  select: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
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
  actionBtn: {
    padding: '4px 8px',
    borderRadius: '5px',
    border: '1px solid #cbd5e1',
    fontSize: '11px',
    fontWeight: 600,
    backgroundColor: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
  },
  godownBadge: {
    fontSize: '11px',
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: '4px',
    backgroundColor: '#f1f5f9',
    color: '#334155',
  },
  lowBadge: {
    fontSize: '10px',
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: '4px',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
  },
  typeBadge: {
    fontSize: '10px',
    fontWeight: 800,
    padding: '2px 6px',
    borderRadius: '4px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  },
  whCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  whCode: {
    fontFamily: 'monospace',
    fontWeight: 800,
    fontSize: '12px',
    color: '#10b981',
    backgroundColor: '#ecfdf5',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  defaultBadge: {
    fontSize: '10px',
    fontWeight: 700,
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' },
  th: { padding: '12px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '12px 14px', fontSize: '13px' },
  statusPill: { fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  formRow: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '12px', fontWeight: 600, color: '#334155' },
  input: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
  },
  gatePassSheet: {
    backgroundColor: '#ffffff',
    border: '1px solid #0f172a',
    borderRadius: '8px',
    padding: '16px',
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
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    maxWidth: '480px',
    width: '100%',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
    backgroundColor: '#fafafa',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
  },
  closeBtn: { background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' },
  modalForm: { padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' },
  formActions: { display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' },
};
