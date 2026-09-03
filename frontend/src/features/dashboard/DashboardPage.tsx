import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { formatDecimal } from '../../utils/decimal';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [activeRange, setActiveRange] = useState<'month' | 'quarter' | 'year'>('month');

  // Sample dynamic monthly data for Nepal Fiscal Year 2081/82
  const monthlyData = [
    { month: 'Shrawan', sales: 1240000, purchases: 810000, profit: 430000 },
    { month: 'Bhadra', sales: 1480000, purchases: 920000, profit: 560000 },
    { month: 'Ashwin (Dashain)', sales: 2650000, purchases: 1680000, profit: 970000 },
    { month: 'Kartik (Tihar)', sales: 2200000, purchases: 1390000, profit: 810000 },
    { month: 'Mangsir', sales: 1560000, purchases: 980000, profit: 580000 },
    { month: 'Poush', sales: 1380000, purchases: 890000, profit: 490000 },
    { month: 'Magh', sales: 1450000, purchases: 910000, profit: 540000 },
    { month: 'Falgun (Current)', sales: 1720000, purchases: 1040000, profit: 680000 },
  ];

  const recentInvoices = [
    { id: '1', number: 'INV-2081-0182', party: 'Sagarmatha Traders Pvt Ltd', amount: 142500, date: '2081/11/20', status: 'paid', mode: 'Fonepay QR' },
    { id: '2', number: 'INV-2081-0181', party: 'Annapurna Grocery Store', amount: 48900, date: '2081/11/20', status: 'partial', mode: 'Cash / Credit' },
    { id: '3', number: 'POS-2081-0849', party: 'Walk-in Cash Customer', amount: 8450, date: '2081/11/20', status: 'paid', mode: 'Cash Counter' },
    { id: '4', number: 'INV-2081-0180', party: 'Lumbini Electronics & Mobile', amount: 320000, date: '2081/11/19', status: 'overdue', mode: 'Credit (30d)' },
    { id: '5', number: 'POS-2081-0848', party: 'Walk-in Cash Customer', amount: 12600, date: '2081/11/19', status: 'paid', mode: 'eSewa Pay' },
  ];

  const lowStockItems = [
    { name: 'Wai Wai Chicken Noodles 75g (Carton)', sku: 'NOOD-001', current: 6, min: 25, unit: 'Carton' },
    { name: 'Paracetamol 500mg (10x10 Strips)', sku: 'MED-PARA-500', current: 12, min: 50, unit: 'Boxes' },
    { name: 'Dettol Antiseptic Liquid 500ml', sku: 'DETT-500', current: 3, min: 15, unit: 'PCS' },
  ];

  return (
    <div style={styles.container}>
      {/* Top Welcome & Quick Actions Bar */}
      <div style={styles.topHeader}>
        <div>
          <h1 style={styles.title}>Welcome back, {user?.fullName || 'Administrator'}! 👋</h1>
          <p style={styles.subtitle}>
            Executive Financial & Operations Overview • Fiscal Year <strong>BS 2081/82</strong>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={styles.actionHub}>
          <button style={styles.actionBtnPrimary} onClick={() => navigate('/pos')}>
            ⚡ Express POS Bill (F2)
          </button>
          <button style={styles.actionBtnSecondary} onClick={() => navigate('/sales')}>
            🧾 + Tax Invoice (F3)
          </button>
          <button style={styles.actionBtnSecondary} onClick={() => navigate('/purchases')}>
            📦 + Purchase (F4)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={styles.kpiGrid}>
        <div style={styles.kpiCard}>
          <div style={styles.kpiTop}>
            <span style={styles.kpiLabel}>Today's Invoiced Sales</span>
            <span style={styles.kpiIcon}>💰</span>
          </div>
          <div style={styles.kpiValue}>NPR 1,48,500.00</div>
          <div style={styles.kpiBottom}>
            <span style={styles.badgeSuccess}>▲ +14.2% vs yesterday</span>
            <span style={styles.kpiSub}>24 Invoices posted</span>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiTop}>
            <span style={styles.kpiLabel}>Accounts Receivable</span>
            <span style={styles.kpiIcon}>⏳</span>
          </div>
          <div style={styles.kpiValue}>NPR 12,40,000.00</div>
          <div style={styles.kpiBottom}>
            <span style={styles.badgeWarning}>⚠️ 18 Overdue Bills</span>
            <span style={styles.kpiSub}>Avg. collection 24 days</span>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiTop}>
            <span style={styles.kpiLabel}>Supplier Payables</span>
            <span style={styles.kpiIcon}>📦</span>
          </div>
          <div style={styles.kpiValue}>NPR 8,20,000.00</div>
          <div style={styles.kpiBottom}>
            <span style={styles.badgeInfo}>8 Bills due this week</span>
            <span style={styles.kpiSub}>All vendor credit active</span>
          </div>
        </div>

        <div style={styles.kpiCard}>
          <div style={styles.kpiTop}>
            <span style={styles.kpiLabel}>Net Cash & Bank</span>
            <span style={styles.kpiIcon}>🏦</span>
          </div>
          <div style={styles.kpiValue}>NPR 31,55,400.00</div>
          <div style={styles.kpiBottom}>
            <span style={styles.badgeSuccess}>NIC Asia & Nabil active</span>
            <span style={styles.kpiSub}>Fonepay QR linked</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Analytics Grid */}
      <div style={styles.analyticsGrid}>
        {/* Sales & Profit Chart Panel */}
        <div style={styles.chartCard}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>📈 Sales vs. Purchases vs. Net Profit</h2>
              <p style={styles.cardSubtitle}>Monthly performance trends for BS 2081/82 (Amounts in NPR)</p>
            </div>
            <div style={styles.rangeTabs}>
              <button
                style={{ ...styles.rangeTab, ...(activeRange === 'month' ? styles.rangeTabActive : {}) }}
                onClick={() => setActiveRange('month')}
              >
                Monthly
              </button>
              <button
                style={{ ...styles.rangeTab, ...(activeRange === 'quarter' ? styles.rangeTabActive : {}) }}
                onClick={() => setActiveRange('quarter')}
              >
                Quarterly
              </button>
              <button
                style={{ ...styles.rangeTab, ...(activeRange === 'year' ? styles.rangeTabActive : {}) }}
                onClick={() => setActiveRange('year')}
              >
                Full Year
              </button>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div style={styles.chartWrapper}>
            <div style={styles.chartBarsContainer}>
              {monthlyData.map((item, idx) => {
                const maxVal = 2800000;
                const salesHeight = (item.sales / maxVal) * 160;
                const purchaseHeight = (item.purchases / maxVal) * 160;
                const profitHeight = (item.profit / maxVal) * 160;

                return (
                  <div key={idx} style={styles.barGroup}>
                    <div style={styles.barsStack}>
                      <div
                        style={{ ...styles.bar, height: `${salesHeight}px`, backgroundColor: '#2563eb' }}
                        title={`Sales: NPR ${formatDecimal(item.sales)}`}
                      />
                      <div
                        style={{ ...styles.bar, height: `${purchaseHeight}px`, backgroundColor: '#94a3b8' }}
                        title={`Purchases: NPR ${formatDecimal(item.purchases)}`}
                      />
                      <div
                        style={{ ...styles.bar, height: `${profitHeight}px`, backgroundColor: '#10b981' }}
                        title={`Profit: NPR ${formatDecimal(item.profit)}`}
                      />
                    </div>
                    <span style={styles.barMonthLabel}>{item.month.split(' ')[0]}</span>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={styles.chartLegend}>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#2563eb' }} />
                <span>Total Invoiced Sales</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#94a3b8' }} />
                <span>Supplier Purchases</span>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#10b981' }} />
                <span>Net Business Margin</span>
              </div>
            </div>
          </div>
        </div>

        {/* Low Stock & Reorder Radar */}
        <div style={styles.sideCard}>
          <div style={styles.cardHeader}>
            <div>
              <h2 style={styles.cardTitle}>⚠️ Low Stock & Reorder Radar</h2>
              <p style={styles.cardSubtitle}>Items reaching critical inventory levels</p>
            </div>
            <button style={styles.linkActionBtn} onClick={() => navigate('/inventory')}>
              All Stock →
            </button>
          </div>

          <div style={styles.lowStockList}>
            {lowStockItems.map((item, idx) => (
              <div key={idx} style={styles.stockItemRow}>
                <div style={styles.stockItemInfo}>
                  <div style={styles.stockItemName}>{item.name}</div>
                  <div style={styles.stockItemSku}>SKU: {item.sku}</div>
                </div>
                <div style={styles.stockItemRight}>
                  <div style={styles.stockRemaining}>
                    <strong style={{ color: '#dc2626' }}>{item.current}</strong> / {item.min} {item.unit}
                  </div>
                  <button
                    style={styles.reorderBtn}
                    onClick={() => navigate('/purchases')}
                    title="Generate Purchase Order"
                  >
                    + Reorder
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={styles.complianceNoticeBox}>
            <div style={{ fontWeight: 700, fontSize: '12px', color: '#0f172a' }}>
              🇳🇵 Nepal IRD Tax Certified
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              VAT 13% • अनुसूची ८ (Purchase) & अनुसूची ९ (Sales) sync active.
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Feed */}
      <div style={styles.tableCard}>
        <div style={styles.cardHeader}>
          <div>
            <h2 style={styles.cardTitle}>📋 Recent Transactions & Invoices</h2>
            <p style={styles.cardSubtitle}>Real-time journal of sales, POS receipts, and payments</p>
          </div>
          <button style={styles.linkActionBtn} onClick={() => navigate('/sales')}>
            View All Invoices →
          </button>
        </div>

        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th}>Invoice #</th>
              <th style={styles.th}>Customer / Party</th>
              <th style={styles.th}>Date (BS)</th>
              <th style={styles.th}>Payment Mode</th>
              <th style={styles.thRight}>Grand Total (NPR)</th>
              <th style={styles.thCenter}>Status</th>
              <th style={styles.thCenter}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {recentInvoices.map((inv) => (
              <tr key={inv.id} style={styles.tr}>
                <td style={styles.tdBold}>{inv.number}</td>
                <td style={styles.td}>{inv.party}</td>
                <td style={styles.tdMuted}>{inv.date} BS</td>
                <td style={styles.td}>
                  <span style={styles.modeBadge}>{inv.mode}</span>
                </td>
                <td style={styles.tdAmount}>NPR {formatDecimal(inv.amount)}</td>
                <td style={styles.tdCenter}>
                  <span
                    style={{
                      ...styles.statusPill,
                      ...(inv.status === 'paid'
                        ? styles.pillPaid
                        : inv.status === 'partial'
                        ? styles.pillPartial
                        : styles.pillOverdue),
                    }}
                  >
                    {inv.status.toUpperCase()}
                  </span>
                </td>
                <td style={styles.tdCenter}>
                  <button
                    style={styles.viewBtn}
                    onClick={() => navigate('/sales')}
                    title="View & Print Bill"
                  >
                    👁️ View Bill
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    animation: 'fadeIn 0.2s ease-out',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.03em',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
  actionHub: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  actionBtnPrimary: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    padding: '10px 18px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
    cursor: 'pointer',
  },
  actionBtnSecondary: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #e2e8f0',
    padding: '10px 16px',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '16px',
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  kpiTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  kpiIcon: {
    fontSize: '18px',
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    fontFamily: 'JetBrains Mono, monospace',
  },
  kpiBottom: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
  },
  kpiSub: {
    fontSize: '11px',
    color: '#94a3b8',
  },
  badgeSuccess: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#059669',
    backgroundColor: '#ecfdf5',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  badgeWarning: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#d97706',
    backgroundColor: '#fffbeb',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  badgeInfo: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#0284c7',
    backgroundColor: '#e0f2fe',
    padding: '2px 8px',
    borderRadius: '6px',
  },
  analyticsGrid: {
    display: 'grid',
    gridTemplateColumns: '1.6fr 1fr',
    gap: '20px',
  },
  chartCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  sideCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  cardSubtitle: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '3px',
  },
  rangeTabs: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#f1f5f9',
    padding: '3px',
    borderRadius: '8px',
  },
  rangeTab: {
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  rangeTabActive: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  chartWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  chartBarsContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '180px',
    paddingTop: '16px',
    borderBottom: '1px solid #e2e8f0',
  },
  barGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
  },
  barsStack: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '3px',
  },
  bar: {
    width: '10px',
    borderRadius: '4px 4px 0 0',
    transition: 'height 0.3s ease',
    cursor: 'pointer',
  },
  barMonthLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#64748b',
  },
  chartLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px',
    fontSize: '12px',
    color: '#64748b',
    fontWeight: 500,
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '10px',
    height: '10px',
    borderRadius: '3px',
  },
  lowStockList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  stockItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    border: '1px solid #f1f5f9',
  },
  stockItemInfo: {
    maxWidth: '180px',
  },
  stockItemName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0f172a',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  stockItemSku: {
    fontSize: '10px',
    color: '#64748b',
    fontFamily: 'JetBrains Mono, monospace',
  },
  stockItemRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  stockRemaining: {
    fontSize: '11px',
    color: '#475569',
  },
  reorderBtn: {
    padding: '4px 8px',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    border: '1px solid #bfdbfe',
    cursor: 'pointer',
  },
  complianceNoticeBox: {
    marginTop: '16px',
    padding: '12px',
    borderRadius: '10px',
    backgroundColor: '#eff6ff',
    border: '1px solid #dbeafe',
  },
  linkActionBtn: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#2563eb',
    cursor: 'pointer',
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  theadRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '12px 14px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    textAlign: 'left',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  thRight: {
    padding: '12px 14px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    textAlign: 'right',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  thCenter: {
    padding: '12px 14px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.15s ease',
  },
  td: {
    padding: '12px 14px',
    fontSize: '13px',
    color: '#334155',
  },
  tdBold: {
    padding: '12px 14px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    fontFamily: 'JetBrains Mono, monospace',
  },
  tdMuted: {
    padding: '12px 14px',
    fontSize: '12px',
    color: '#64748b',
  },
  tdAmount: {
    padding: '12px 14px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'right',
    fontFamily: 'JetBrains Mono, monospace',
  },
  tdCenter: {
    padding: '12px 14px',
    fontSize: '13px',
    textAlign: 'center',
  },
  modeBadge: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#475569',
    backgroundColor: '#f1f5f9',
    padding: '3px 8px',
    borderRadius: '4px',
  },
  statusPill: {
    fontSize: '10px',
    fontWeight: 800,
    padding: '3px 8px',
    borderRadius: '12px',
    letterSpacing: '0.02em',
  },
  pillPaid: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
  },
  pillPartial: {
    backgroundColor: '#fffbeb',
    color: '#d97706',
  },
  pillOverdue: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
  },
  viewBtn: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#2563eb',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    padding: '4px 10px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
};
