import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { reportService } from '../services/reportService';
import {
  DashboardSummary,
  SalesSummary,
  PurchaseSummary,
  InventorySummary,
  ProfitLoss,
  TopSellingResponse,
  OutstandingSummary,
  ReportFilter,
} from '../types/reports';
import { DashboardCard } from '../components/DashboardCard';
import { SalesChart } from '../components/SalesChart';
import { PurchaseChart } from '../components/PurchaseChart';
import { ProfitChart } from '../components/ProfitChart';
import { InventoryWidget } from '../components/InventoryWidget';
import { LowStockTable } from '../components/LowStockTable';
import { DateRangeFilter } from '../components/DateRangeFilter';

export const ReportsDashboard: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [filter, setFilter] = useState<ReportFilter>({});
  const [loading, setLoading] = useState(true);

  // Analytics states
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sales, setSales] = useState<SalesSummary | null>(null);
  const [purchases, setPurchases] = useState<PurchaseSummary | null>(null);
  const [inventory, setInventory] = useState<InventorySummary | null>(null);
  const [profitLoss, setProfitLoss] = useState<ProfitLoss | null>(null);
  const [topSelling, setTopSelling] = useState<TopSellingResponse | null>(null);
  const [outstanding, setOutstanding] = useState<OutstandingSummary | null>(null);

  const fetchReportData = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const [sumRes, salesRes, purRes, invRes, pnlRes, topRes, outRes] = await Promise.all([
        reportService.getDashboardSummary(currentOrg._id),
        reportService.getSalesSummary(currentOrg._id, filter),
        reportService.getPurchaseSummary(currentOrg._id, filter),
        reportService.getInventorySummary(currentOrg._id, filter),
        reportService.getProfitLoss(currentOrg._id, filter),
        reportService.getTopSellingItems(currentOrg._id, filter),
        reportService.getOutstandingSummary(currentOrg._id),
      ]);

      setSummary(sumRes);
      setSales(salesRes);
      setPurchases(purRes);
      setInventory(invRes);
      setProfitLoss(pnlRes);
      setTopSelling(topRes);
      setOutstanding(outRes);
    } catch (e) {
      console.error('Failed to load dashboard report metrics', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [currentOrg?._id]);

  if (loading && !summary) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#64748b' }}>
        <h2>Loading Executive Financial Metrics...</h2>
        <p style={{ marginTop: '8px', fontSize: '13px' }}>Aggregating real-time transactions and warehouse stock positions.</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Page Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics & Executive Reports</h1>
          <p style={styles.subtitle}>
            Real-time financial positions, sales trends, inventory valuations, and accounts ledger insights.
          </p>
        </div>
        <div style={styles.lastUpdated}>
          <span>Store: {currentOrg?.name || 'Smart Billing'}</span>
        </div>
      </div>

      {/* Date Filter Bar */}
      <DateRangeFilter filter={filter} onChange={setFilter} onRefresh={fetchReportData} />

      {/* Section 1: KPI Cards */}
      <div style={styles.kpiGrid}>
        <DashboardCard
          title="Total Gross Sales"
          value={`NPR ${(summary?.totalSales || 0).toLocaleString()}`}
          subText={`${summary?.totalInvoices || 0} Invoices Issued`}
          badgeText="Active"
          badgeType="info"
          icon="📄"
        />
        <DashboardCard
          title="Total Purchases"
          value={`NPR ${(summary?.totalPurchase || 0).toLocaleString()}`}
          subText={`${summary?.totalSuppliers || 0} Active Suppliers`}
          badgeText="Inbound"
          badgeType="warning"
          icon="🛒"
        />
        <DashboardCard
          title="Gross Operating Profit"
          value={`NPR ${(summary?.totalProfit || 0).toLocaleString()}`}
          subText="Sales vs Cost of Goods"
          badgeText="Positive"
          badgeType="success"
          icon="💰"
        />
        <DashboardCard
          title="Total Stock Valuation"
          value={`NPR ${(summary?.inventoryValuation || 0).toLocaleString()}`}
          subText={`${summary?.lowStockCount || 0} Reorder Alerts`}
          badgeText="Asset"
          badgeType={summary?.lowStockCount ? 'danger' : 'success'}
          icon="📦"
        />
      </div>

      {/* Section 2: Trends Charts */}
      <div style={styles.chartsGrid}>
        <SalesChart data={sales?.monthly || []} />
        <PurchaseChart data={purchases?.trends || []} />
        <ProfitChart data={profitLoss} />
      </div>

      {/* Section 3: Inventory Distribution & Low Stock */}
      <div style={styles.twoColumnGrid}>
        <InventoryWidget data={inventory} />
        <LowStockTable data={inventory} />
      </div>

      {/* Section 4: Sales Analysis (Top Selling & Receivables/Payables) */}
      <div style={styles.twoColumnGrid}>
        {/* Top Selling Products */}
        <div style={styles.cardBox}>
          <h3 style={styles.cardTitle}>🔥 Top Selling Products</h3>
          <div style={styles.rankingList}>
            {topSelling?.byRevenue.slice(0, 5).map((item, idx) => (
              <div key={item.itemId} style={styles.rankingRow}>
                <div style={styles.rankNum}>#{idx + 1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{item.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {item.code} • {item.quantitySold} units sold
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#1e3a8a' }}>
                  NPR {item.revenue.toLocaleString()}
                </div>
              </div>
            ))}
            {(!topSelling || topSelling.byRevenue.length === 0) && (
              <div style={styles.emptyState}>No items sold yet.</div>
            )}
          </div>
        </div>

        {/* Outstanding Receivables & Payables */}
        <div style={styles.cardBox}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={styles.cardTitle}>⚖️ Outstanding Balances</h3>
            <div style={{ fontSize: '12px' }}>
              <span style={{ color: '#059669', fontWeight: 700 }}>
                Rec: NPR {(outstanding?.customerReceivable || 0).toLocaleString()}
              </span>
              <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
              <span style={{ color: '#dc2626', fontWeight: 700 }}>
                Pay: NPR {(outstanding?.supplierPayable || 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div style={styles.rankingList}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b' }}>
              Top Debtors (Receivable)
            </div>
            {outstanding?.topReceivables.slice(0, 3).map((debtor) => (
              <div key={debtor.partyId} style={styles.rankingRow}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px' }}>{debtor.name}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{debtor.phone || 'No phone'}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '13px', color: '#059669' }}>
                  NPR {debtor.balance.toLocaleString()}
                </div>
              </div>
            ))}
            {(!outstanding || outstanding.topReceivables.length === 0) && (
              <div style={styles.emptyState}>No outstanding customer debts.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingBottom: '40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
  lastUpdated: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#1e3a8a',
    backgroundColor: '#eff6ff',
    padding: '6px 12px',
    borderRadius: '6px',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
    gap: '16px',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: '20px',
  },
  cardBox: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    padding: '20px',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 16px 0',
  },
  rankingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  rankingRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    gap: '12px',
  },
  rankNum: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#94a3b8',
    width: '24px',
  },
  emptyState: {
    padding: '16px',
    fontSize: '12px',
    color: '#94a3b8',
    textAlign: 'center',
  },
};
