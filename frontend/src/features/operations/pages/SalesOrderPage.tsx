import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { operationsService } from '../services/operationsService';
import { SalesOrder } from '../types/operations';
import { formatDecimal } from '../../../utils/decimal';

export const SalesOrderPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrders = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const res = await operationsService.getSalesOrders(currentOrg._id);
      setOrders(res);
    } catch (e) {
      console.error('Failed to load sales orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentOrg?._id]);

  const handleApprove = async (id: string) => {
    if (!currentOrg?._id) return;
    await operationsService.approveDocument(currentOrg._id, 'sales_order', id);
    alert('Sales order confirmed and approved');
    fetchOrders();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Sales Orders & Quotation Management (O2C)</h1>
          <p style={styles.subtitle}>
            Manage customer sales orders, credit limit breaches, and quotation fulfillment.
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>SO #</th>
              <th style={styles.th}>Customer</th>
              <th style={styles.th}>Order Date</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Grand Total (NPR)</th>
              <th style={styles.th}>Credit Check</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((so) => (
              <tr key={so._id} style={styles.tr}>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                  {so.soNumber}
                </td>
                <td style={styles.td}>
                  <strong>{so.customerName}</strong>
                  {so.customerPan && <div style={{ fontSize: '11px', color: '#64748b' }}>PAN: {so.customerPan}</div>}
                </td>
                <td style={styles.td}>{new Date(so.orderDate).toLocaleDateString()}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>
                  NPR {formatDecimal(so.grandTotal)}
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.creditBadge,
                      backgroundColor: so.creditCheckStatus === 'approved' ? '#ecfdf5' : '#fef2f2',
                      color: so.creditCheckStatus === 'approved' ? '#059669' : '#dc2626',
                    }}
                  >
                    {so.creditCheckStatus.toUpperCase()}
                  </span>
                </td>
                <td style={styles.td}>
                  <span style={styles.statusPill}>{so.status.toUpperCase()}</span>
                </td>
                <td style={styles.td}>
                  {so.status === 'draft' && (
                    <button style={styles.actionBtn} onClick={() => handleApprove(so._id)}>
                      Confirm Order
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {orders.length === 0 && !loading && (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                  No customer sales orders recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: '13px' },
  statusPill: { fontSize: '10px', fontWeight: 800, backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '4px' },
  creditBadge: { fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' },
  actionBtn: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' },
};
