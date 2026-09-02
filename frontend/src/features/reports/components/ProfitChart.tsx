import React from 'react';
import { ProfitLoss } from '../types/reports';

interface ProfitChartProps {
  data: ProfitLoss | null;
}

export const ProfitChart: React.FC<ProfitChartProps> = ({ data }) => {
  if (!data) {
    return <div style={styles.empty}>Loading profit metrics...</div>;
  }

  const { salesRevenue, purchaseCost, grossProfit, profitPercentage } = data;
  const maxVal = Math.max(salesRevenue, purchaseCost, 1);
  const salesHeight = (salesRevenue / maxVal) * 100;
  const costHeight = (purchaseCost / maxVal) * 100;
  const profitHeight = (Math.max(0, grossProfit) / maxVal) * 100;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>💰 Profit & Loss Breakdown</h3>
        <span
          style={{
            ...styles.badge,
            backgroundColor: grossProfit >= 0 ? '#ecfdf5' : '#fef2f2',
            color: grossProfit >= 0 ? '#059669' : '#dc2626',
          }}
        >
          Margin: {profitPercentage.toFixed(1)}%
        </span>
      </div>

      <div style={styles.chartArea}>
        <div style={styles.barGroup}>
          <div style={styles.label}>Sales Revenue</div>
          <div style={styles.track}>
            <div style={{ ...styles.fill, height: `${salesHeight}%`, backgroundColor: '#1e3a8a' }} />
          </div>
          <div style={styles.val}>NPR {(salesRevenue / 1000).toFixed(1)}k</div>
        </div>

        <div style={styles.barGroup}>
          <div style={styles.label}>Purchase Cost</div>
          <div style={styles.track}>
            <div style={{ ...styles.fill, height: `${costHeight}%`, backgroundColor: '#e11d48' }} />
          </div>
          <div style={styles.val}>NPR {(purchaseCost / 1000).toFixed(1)}k</div>
        </div>

        <div style={styles.barGroup}>
          <div style={styles.label}>Gross Profit</div>
          <div style={styles.track}>
            <div
              style={{
                ...styles.fill,
                height: `${profitHeight}%`,
                backgroundColor: grossProfit >= 0 ? '#059669' : '#dc2626',
              }}
            />
          </div>
          <div style={{ ...styles.val, color: grossProfit >= 0 ? '#059669' : '#dc2626', fontWeight: 800 }}>
            NPR {(grossProfit / 1000).toFixed(1)}k
          </div>
        </div>
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
    padding: '3px 8px',
    borderRadius: '4px',
  },
  chartArea: {
    flex: 1,
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingTop: '20px',
  },
  barGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    height: '100%',
    justifyContent: 'flex-end',
    width: '90px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    textAlign: 'center',
  },
  track: {
    width: '44px',
    height: '160px',
    backgroundColor: '#f1f5f9',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'flex-end',
    overflow: 'hidden',
  },
  fill: {
    width: '100%',
    borderRadius: '6px 6px 0 0',
    transition: 'height 0.3s ease',
  },
  val: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0f172a',
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
