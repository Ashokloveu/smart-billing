import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { operationsService } from '../services/operationsService';
import { StockTransfer, StockBatch } from '../types/operations';
import { formatDecimal } from '../../../utils/decimal';

export const WarehouseOperationsPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [activeTab, setActiveTab] = useState<'transfers' | 'batches' | 'scan'>('transfers');

  const [transfers, setTransfers] = useState<StockTransfer[]>([]);
  const [batches, setBatches] = useState<StockBatch[]>([]);
  const [loading, setLoading] = useState(false);

  // Scanner state
  const [barcodeInput, setBarcodeInput] = useState('');
  const [scannedLogs, setScannedLogs] = useState<Array<{ code: string; time: string; status: string }>>([]);

  const fetchData = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const [trRes, btRes] = await Promise.all([
        operationsService.getTransfers(currentOrg._id),
        operationsService.getBatches(currentOrg._id),
      ]);
      setTransfers(trRes);
      setBatches(btRes);
    } catch (e) {
      console.error('Failed to load warehouse operations data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrg?._id]);

  const handleDispatch = async (id: string) => {
    if (!currentOrg?._id) return;
    await operationsService.dispatchTransfer(currentOrg._id, id);
    alert('Stock transfer dispatched and inventory set to in-transit');
    fetchData();
  };

  const handleReceive = async (id: string) => {
    if (!currentOrg?._id) return;
    await operationsService.receiveTransfer(currentOrg._id, id);
    alert('Stock transfer received into destination warehouse');
    fetchData();
  };

  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const matchedBatch = batches.find((b) => b.barcode === barcodeInput.trim() || b.batchNumber === barcodeInput.trim());
    setScannedLogs((prev) => [
      {
        code: barcodeInput.trim(),
        time: new Date().toLocaleTimeString(),
        status: matchedBatch ? `Found Batch: ${matchedBatch.batchNumber}` : 'Item code logged',
      },
      ...prev,
    ]);
    setBarcodeInput('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Warehouse Operations, Transfers & Batches</h1>
          <p style={styles.subtitle}>
            Multi-warehouse transfers, lot expiry tracking, and barcode/QR verification.
          </p>
        </div>
      </div>

      <div style={styles.tabsNav}>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'transfers' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('transfers')}
        >
          🚚 Inter-Warehouse Transfers ({transfers.length})
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'batches' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('batches')}
        >
          🏷️ Lot & Batch Tracking ({batches.length})
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'scan' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('scan')}
        >
          📷 Barcode & QR Scanner Tool
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'transfers' && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Transfer #</th>
                  <th style={styles.th}>Source Store</th>
                  <th style={styles.th}>Destination Store</th>
                  <th style={styles.th}>Date (BS)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Items</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((tr) => (
                  <tr key={tr._id} style={styles.tr}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                      {tr.transferNumber}
                    </td>
                    <td style={styles.td}>{tr.sourceWarehouseId?.name || 'Source'}</td>
                    <td style={styles.td}>{tr.destinationWarehouseId?.name || 'Destination'}</td>
                    <td style={styles.td}>
                      <strong>{tr.bsDate}</strong>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{tr.items.length} items</td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusPill,
                          backgroundColor:
                            tr.status === 'received'
                              ? '#ecfdf5'
                              : tr.status === 'in_transit'
                              ? '#eff6ff'
                              : '#f8fafc',
                          color:
                            tr.status === 'received'
                              ? '#059669'
                              : tr.status === 'in_transit'
                              ? '#1e3a8a'
                              : '#475569',
                        }}
                      >
                        {tr.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {tr.status === 'draft' && (
                        <button style={styles.actionBtn} onClick={() => handleDispatch(tr._id)}>
                          Dispatch OUT
                        </button>
                      )}
                      {tr.status === 'in_transit' && (
                        <button style={{ ...styles.actionBtn, backgroundColor: '#1e3a8a', color: '#ffffff' }} onClick={() => handleReceive(tr._id)}>
                          Receive IN
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {transfers.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No inter-warehouse transfers recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'batches' && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Batch / Lot #</th>
                  <th style={styles.th}>Item</th>
                  <th style={styles.th}>Warehouse</th>
                  <th style={styles.th}>Expiry Date</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Cost Rate</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Available Qty</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b._id} style={styles.tr}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                      {b.batchNumber}
                    </td>
                    <td style={styles.td}>
                      <strong>{typeof b.itemId === 'object' ? b.itemId.name : 'Item'}</strong>
                    </td>
                    <td style={styles.td}>
                      {typeof b.warehouseId === 'object' ? b.warehouseId.name : 'Warehouse'}
                    </td>
                    <td style={styles.td}>
                      {b.expiryDate ? (
                        <span style={{ color: new Date(b.expiryDate) < new Date() ? '#dc2626' : '#334155' }}>
                          {new Date(b.expiryDate).toLocaleDateString()}
                          {new Date(b.expiryDate) < new Date() && ' (EXPIRED)'}
                        </span>
                      ) : (
                        'N/A'
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>NPR {formatDecimal(b.costPrice)}</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800 }}>
                      {formatDecimal(b.currentQuantity)}
                    </td>
                  </tr>
                ))}
                {batches.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No stock batches recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'scan' && (
          <div style={styles.scanWrapper}>
            <div style={styles.scanCard}>
              <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 10px 0' }}>📷 Barcode & QR Scanner Interface</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
                Scan with USB barcode wedge, Bluetooth scanner, or type manually for instant stock audits.
              </p>

              <form onSubmit={handleScanSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Scan or enter Barcode / Batch QR..."
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  autoFocus
                  style={styles.scanInput}
                />
                <button type="submit" style={styles.scanBtn}>
                  ⚡ Scan Code
                </button>
              </form>
            </div>

            <div style={styles.scanCard}>
              <h4 style={{ fontSize: '13px', fontWeight: 700, margin: '0 0 10px 0' }}>Recent Scan Activity Log</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {scannedLogs.map((log, i) => (
                  <div key={i} style={styles.logRow}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{log.code}</span>
                    <span style={{ color: '#059669', fontSize: '12px' }}>{log.status}</span>
                    <span style={{ color: '#94a3b8', fontSize: '11px' }}>{log.time}</span>
                  </div>
                ))}
                {scannedLogs.length === 0 && (
                  <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                    Ready for scanning input.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  tabsNav: { display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' },
  navBtn: { padding: '8px 14px', borderRadius: '6px', border: 'none', background: 'none', fontSize: '13px', fontWeight: 700, color: '#64748b', cursor: 'pointer' },
  activeNavBtn: { backgroundColor: '#1e3a8a', color: '#ffffff' },
  content: { marginTop: '10px' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: '13px' },
  statusPill: { fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' },
  actionBtn: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' },
  scanWrapper: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  scanCard: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' },
  scanInput: { flex: 1, padding: '10px 14px', borderRadius: '6px', border: '2px solid #1e3a8a', fontSize: '14px', fontFamily: 'monospace' },
  scanBtn: { padding: '10px 18px', borderRadius: '6px', backgroundColor: '#1e3a8a', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' },
  logRow: { display: 'flex', justifyContent: 'space-between', padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px', alignItems: 'center' },
};
