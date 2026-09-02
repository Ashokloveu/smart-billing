import React from 'react';
import { InventorySummary } from '../types/reports';

interface LowStockTableProps {
  data: InventorySummary | null;
}

export const LowStockTable: React.FC<LowStockTableProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>⚠️ Critical Low Stock Alerts</h3>
        <span style={styles.badge}>{data.lowStockItems.length} items reorder needed</span>
      </div>

      <div style={styles.tableWrapper}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHead}>
              <th style={styles.th}>SKU</th>
              <th style={styles.th}>Product Name</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Current Stock</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Min Threshold</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Deficit</th>
            </tr>
          </thead>
          <tbody>
            {data.lowStockItems.map((item) => (
              <tr key={item.itemId} style={styles.tr}>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 600 }}>{item.code}</td>
                <td style={{ ...styles.td, fontWeight: 700, color: '#0f172a' }}>{item.name}</td>
                <td style={{ ...styles.td, textAlign: 'right', color: '#dc2626', fontWeight: 700 }}>
                  {item.currentQuantity}
                </td>
                <td style={{ ...styles.td, textAlign: 'right', color: '#64748b' }}>{item.minimumStock}</td>
                <td style={{ ...styles.td, textAlign: 'right', color: '#dc2626', fontWeight: 800 }}>
                  -{item.deficit}
                </td>
              </tr>
            ))}
            {data.lowStockItems.length === 0 && (
              <tr>
                <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#059669', padding: '24px' }}>
                  ✓ All tracked items are currently stocked above their minimum threshold.
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
  container: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  badge: {
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHead: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '10px 12px',
    fontSize: '13px',
  },
};
