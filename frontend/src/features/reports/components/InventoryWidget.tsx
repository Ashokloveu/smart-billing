import React from 'react';
import { InventorySummary } from '../types/reports';

interface InventoryWidgetProps {
  data: InventorySummary | null;
}

export const InventoryWidget: React.FC<InventoryWidgetProps> = ({ data }) => {
  if (!data) return null;

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🏢 Warehouse Stock Distribution</h3>
      <div style={styles.list}>
        {data.warehouseWise.map((wh) => (
          <div key={wh.warehouseId} style={styles.whRow}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{wh.warehouseName}</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Total Units: {wh.totalQuantity.toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e3a8a' }}>
                NPR {wh.valuation.toLocaleString()}
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>Valuation</div>
            </div>
          </div>
        ))}
        {data.warehouseWise.length === 0 && (
          <div style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
            No warehouses mapped yet.
          </div>
        )}
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
  title: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 16px 0',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  whRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #f1f5f9',
  },
};
