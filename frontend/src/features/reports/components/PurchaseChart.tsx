import React from 'react';
import { TrendDataPoint } from '../types/reports';

interface PurchaseChartProps {
  data: TrendDataPoint[];
}

export const PurchaseChart: React.FC<PurchaseChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return <div style={styles.empty}>No vendor purchases recorded for this period.</div>;
  }

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);

  return (
    <div style={styles.container}>
      <h3 style={styles.title}>🛒 Purchase Procurement Trend</h3>
      <div style={styles.chartArea}>
        {data.map((point, index) => {
          const heightPercent = Math.max(8, (point.amount / maxAmount) * 100);
          return (
            <div key={index} style={styles.barGroup}>
              <div style={styles.amountLabel}>NPR {(point.amount / 1000).toFixed(0)}k</div>
              <div style={styles.barTrack}>
                <div style={{ ...styles.barFill, height: `${heightPercent}%` }} />
              </div>
              <div style={styles.axisLabel}>{point.month || point.date || `P${index + 1}`}</div>
            </div>
          );
        })}
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
    height: '320px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 16px 0',
  },
  chartArea: {
    flex: 1,
    display: 'flex',
    alignItems: 'flex-end',
    gap: '16px',
    paddingTop: '20px',
    overflowX: 'auto',
  },
  barGroup: {
    flex: 1,
    minWidth: '45px',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '6px',
  },
  amountLabel: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#059669',
  },
  barTrack: {
    width: '100%',
    height: '180px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#059669',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease',
  },
  axisLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 600,
  },
  empty: {
    padding: '40px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '13px',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
};
