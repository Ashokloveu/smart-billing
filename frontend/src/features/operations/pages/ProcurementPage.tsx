import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { operationsService } from '../services/operationsService';
import { PurchaseOrder, GoodsReceipt, PurchaseRequisition } from '../types/operations';
import { formatDecimal } from '../../../utils/decimal';

export const ProcurementPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [activeTab, setActiveTab] = useState<'po' | 'grn' | 'pr'>('po');

  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [grns, setGrns] = useState<GoodsReceipt[]>([]);
  const [requisitions, setRequisitions] = useState<PurchaseRequisition[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const [poRes, grnRes, prRes] = await Promise.all([
        operationsService.getPurchaseOrders(currentOrg._id),
        operationsService.getGoodsReceipts(currentOrg._id),
        operationsService.getRequisitions(currentOrg._id),
      ]);
      setOrders(poRes);
      setGrns(grnRes);
      setRequisitions(prRes);
    } catch (e) {
      console.error('Failed to load procurement data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrg?._id]);

  const handleApprove = async (docType: string, id: string) => {
    if (!currentOrg?._id) return;
    await operationsService.approveDocument(currentOrg._id, docType, id);
    alert('Document approved successfully');
    fetchData();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Procurement Management (P2P)</h1>
          <p style={styles.subtitle}>
            Purchase Requisitions, Purchase Orders, Goods Receipt Notes (GRN), and Inspection.
          </p>
        </div>
      </div>

      <div style={styles.tabsNav}>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'po' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('po')}
        >
          📄 Purchase Orders ({orders.length})
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'grn' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('grn')}
        >
          📥 Goods Receipts (GRN) ({grns.length})
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'pr' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('pr')}
        >
          📝 Purchase Requisitions ({requisitions.length})
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'po' && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>PO #</th>
                  <th style={styles.th}>Supplier</th>
                  <th style={styles.th}>Date</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Items</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Total (NPR)</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((po) => (
                  <tr key={po._id} style={styles.tr}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                      {po.poNumber}
                    </td>
                    <td style={styles.td}>
                      <strong>{po.supplierName}</strong>
                      {po.supplierPan && <div style={{ fontSize: '11px', color: '#64748b' }}>PAN: {po.supplierPan}</div>}
                    </td>
                    <td style={styles.td}>{new Date(po.orderDate).toLocaleDateString()}</td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>{po.items.length} lines</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>
                      NPR {formatDecimal(po.grandTotal)}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.statusPill}>{po.status.toUpperCase()}</span>
                    </td>
                    <td style={styles.td}>
                      {po.status === 'draft' && (
                        <button
                          style={styles.actionBtn}
                          onClick={() => handleApprove('purchase_order', po._id)}
                        >
                          Approve PO
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No purchase orders recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'grn' && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>GRN #</th>
                  <th style={styles.th}>Warehouse</th>
                  <th style={styles.th}>Supplier</th>
                  <th style={styles.th}>Received Date</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Total Cost (NPR)</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {grns.map((grn) => {
                  const total = grn.items.reduce((acc, i) => acc + (parseFloat(i.totalCost?.toString() || '0') || 0), 0);
                  return (
                    <tr key={grn._id} style={styles.tr}>
                      <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                        {grn.grnNumber}
                      </td>
                      <td style={styles.td}>
                        <strong>{typeof grn.warehouseId === 'object' ? grn.warehouseId.name : 'Store'}</strong>
                      </td>
                      <td style={styles.td}>
                        {typeof grn.supplierId === 'object' ? grn.supplierId.name : 'Supplier'}
                      </td>
                      <td style={styles.td}>{new Date(grn.receivedDate).toLocaleDateString()}</td>
                      <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>
                        NPR {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={styles.td}>
                        <span style={{ ...styles.statusPill, backgroundColor: '#ecfdf5', color: '#059669' }}>
                          {grn.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {grns.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No goods receipt notes recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'pr' && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>PR #</th>
                  <th style={styles.th}>Department</th>
                  <th style={styles.th}>Requested By</th>
                  <th style={styles.th}>Required By Date</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requisitions.map((pr) => (
                  <tr key={pr._id} style={styles.tr}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                      {pr.requisitionNumber}
                    </td>
                    <td style={styles.td}>
                      <strong>{pr.department}</strong>
                    </td>
                    <td style={styles.td}>{pr.requestedBy?.fullName || 'User'}</td>
                    <td style={styles.td}>{new Date(pr.requiredByDate).toLocaleDateString()}</td>
                    <td style={styles.td}>
                      <span style={styles.statusPill}>{pr.status.toUpperCase()}</span>
                    </td>
                    <td style={styles.td}>
                      {pr.status === 'draft' && (
                        <button
                          style={styles.actionBtn}
                          onClick={() => handleApprove('purchase_requisition', pr._id)}
                        >
                          Approve PR
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {requisitions.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No purchase requisitions recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
  statusPill: { fontSize: '10px', fontWeight: 800, backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '4px' },
  actionBtn: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' },
};
