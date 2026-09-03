import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { formatDecimal } from '../../utils/decimal';
import { IncomeExpenseModal } from '../accounting/components/IncomeExpenseModal';
import { PaymentInModal } from '../transactions/PaymentInModal';
import { PaymentOutModal } from '../transactions/PaymentOutModal';

type TimePeriod = 'today' | 'week' | 'month' | 'fiscal_year';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const navigate = useNavigate();

  // Filter & UI States
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');
  const [cashflowPeriod, setCashflowPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [chartLayer, setChartLayer] = useState<'all' | 'in' | 'out'>('all');
  const [hoveredDay, setHoveredDay] = useState<number | null>(6);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  // Modals state
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [paymentInModalOpen, setPaymentInModalOpen] = useState(false);
  const [paymentOutModalOpen, setPaymentOutModalOpen] = useState(false);

  // Real data state
  const [toReceive, setToReceive] = useState(0);
  const [toGive, setToGive] = useState(0);
  const [salesAmount, setSalesAmount] = useState(0);
  const [purchaseAmount, setPurchaseAmount] = useState(0);
  const [expenseAmount, setExpenseAmount] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);

  useEffect(() => {
    if (!currentOrg?._id) return;
    const fetchDashboardStats = async () => {
      try {
        const [repRes, itemsRes, partiesRes] = await Promise.all([
          apiClient.get(`/organizations/${currentOrg._id}/reports/dashboard-summary`).catch(() => ({ data: null })),
          apiClient.get(`/organizations/${currentOrg._id}/items`).catch(() => ({ data: { data: [] } })),
          apiClient.get(`/organizations/${currentOrg._id}/parties`).catch(() => ({ data: { data: [] } })),
        ]);

        if (repRes.data) {
          setSalesAmount(repRes.data.sales?.total || 0);
          setPurchaseAmount(repRes.data.purchases?.total || 0);
          setExpenseAmount(repRes.data.expenses?.total || 0);
          setTotalBalance(repRes.data.balance || 0);
        }

        // Calculate receivables & payables from parties
        const parties = partiesRes.data?.data || [];
        let recv = 0;
        let give = 0;
        parties.forEach((p: any) => {
          const bal = p.openingBalance || 0;
          if (p.type === 'customer' && bal > 0) recv += bal;
          if (p.type === 'supplier' && bal > 0) give += bal;
        });
        setToReceive(recv);
        setToGive(give);

        // Low stock detection
        const allItems = itemsRes.data?.data || [];
        const low = allItems.filter((i: any) => (i.currentStock || 0) <= (i.minStockAlert || 5));
        setLowStockItems(low.slice(0, 3));
      } catch (err) {
        console.error('Failed to load dynamic dashboard data', err);
      }
    };
    fetchDashboardStats();
  }, [currentOrg?._id, selectedPeriod]);

  // Dynamic daily cashflow points
  const days = [
    { label: 'Bai 09', in: 0, out: 0, net: 0 },
    { label: 'Bai 10', in: 0, out: 0, net: 0 },
    { label: 'Bai 11', in: 0, out: 0, net: 0 },
    { label: 'Bai 12', in: 0, out: 0, net: 0 },
    { label: 'Bai 13', in: 0, out: 0, net: 0 },
    { label: 'Bai 14', in: 0, out: 0, net: 0 },
    { label: 'Bai 15', in: salesAmount, out: purchaseAmount + expenseAmount, net: salesAmount - (purchaseAmount + expenseAmount) },
  ];

  const handleCopyInvite = () => {
    navigator.clipboard.writeText('https://smartbilling.app/join?ref=ASHOK10');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const periodMultiplier = {
    today: 0.15,
    week: 0.45,
    month: 1,
    fiscal_year: 4.8,
  }[selectedPeriod];

  return (
    <div style={styles.container}>
      {/* Top Welcome Bar & Action Buttons */}
      <div style={styles.topHeader}>
        <div>
          <h1 style={styles.welcomeTitle}>
            Welcome {user?.fullName || 'Ashok Singh'}
          </h1>
          <div style={styles.storePill}>
            📍 {currentOrg?.name || 'Bardibas Smart Tech'} • Fiscal Year 2081/82 BS
          </div>
        </div>

        <div style={styles.actionGroup}>
          <button style={styles.quickPosBtn} onClick={() => navigate('/pos')}>
            <span style={styles.newBadge}>New</span>
            <span>⚡ Quick POS</span>
          </button>
          <button style={styles.addSalesBtn} onClick={() => navigate('/sales')}>
            + Add Sales
          </button>
          <button style={styles.addPurchaseBtn} onClick={() => navigate('/purchases')}>
            + Add Purchase
          </button>

          {/* Expandable + Add More Actions Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              style={styles.addMoreBtn}
              onClick={() => setShowQuickMenu(!showQuickMenu)}
            >
              + Add More ▾
            </button>

            {showQuickMenu && (
              <div style={styles.quickDropdown}>
                <div
                  style={styles.quickItem}
                  onClick={() => {
                    setExpenseModalOpen(true);
                    setShowQuickMenu(false);
                  }}
                >
                  <span style={styles.quickIcon}>💳</span>
                  <div>
                    <div style={styles.quickTitle}>Add Expense</div>
                    <div style={styles.quickSub}>Record office or daily shop bills</div>
                  </div>
                </div>

                <div
                  style={styles.quickItem}
                  onClick={() => {
                    setIncomeModalOpen(true);
                    setShowQuickMenu(false);
                  }}
                >
                  <span style={styles.quickIcon}>💵</span>
                  <div>
                    <div style={styles.quickTitle}>Add Other Income</div>
                    <div style={styles.quickSub}>Non-sales commission, interest etc.</div>
                  </div>
                </div>

                <div
                  style={styles.quickItem}
                  onClick={() => {
                    setPaymentInModalOpen(true);
                    setShowQuickMenu(false);
                  }}
                >
                  <span style={styles.quickIcon}>📥</span>
                  <div>
                    <div style={styles.quickTitle}>Payment In</div>
                    <div style={styles.quickSub}>Collect dues from customer</div>
                  </div>
                </div>

                <div
                  style={styles.quickItem}
                  onClick={() => {
                    setPaymentOutModalOpen(true);
                    setShowQuickMenu(false);
                  }}
                >
                  <span style={styles.quickIcon}>📤</span>
                  <div>
                    <div style={styles.quickTitle}>Payment Out</div>
                    <div style={styles.quickSub}>Record payout to vendor</div>
                  </div>
                </div>

                <div
                  style={styles.quickItem}
                  onClick={() => {
                    navigate('/sales/quotations');
                    setShowQuickMenu(false);
                  }}
                >
                  <span style={styles.quickIcon}>📄</span>
                  <div>
                    <div style={styles.quickTitle}>Create Quotation</div>
                    <div style={styles.quickSub}>Price estimate for client</div>
                  </div>
                </div>

                <div
                  style={styles.quickItem}
                  onClick={() => {
                    navigate('/parties');
                    setShowQuickMenu(false);
                  }}
                >
                  <span style={styles.quickIcon}>👥</span>
                  <div>
                    <div style={styles.quickTitle}>Add New Party</div>
                    <div style={styles.quickSub}>Register customer or vendor</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Time-Period Selector Bar */}
      <div style={styles.timeFilterRow}>
        <div style={styles.filterTabs}>
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'Baishakh (Month)' },
              { id: 'fiscal_year', label: 'Fiscal Year 2081/82' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              style={{
                ...styles.timeTab,
                ...(selectedPeriod === t.id ? styles.timeTabActive : {}),
              }}
              onClick={() => setSelectedPeriod(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div style={styles.filterSummary}>
          Showing statistics for <strong style={{ color: '#0f172a' }}>{selectedPeriod.toUpperCase()}</strong>
        </div>
      </div>

      {/* Low Stock Live Alert Ticker */}
      {lowStockItems.length > 0 && (
        <div style={styles.alertBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#991b1b' }}>
              Low Stock Alert ({lowStockItems.length} items):
            </span>
            <span style={{ fontSize: '13px', color: '#b91c1c' }}>
              {lowStockItems.map((i) => `${i.name} (${i.currentStock || 0} remaining)`).join(', ')}
            </span>
          </div>
          <button style={styles.reorderBtn} onClick={() => navigate('/purchases')}>
            + Create Purchase Bill →
          </button>
        </div>
      )}

      {/* Top 5 Soft Colored Stat Cards */}
      <div style={styles.statCardsGrid}>
        {/* 1. To Receive */}
        <div
          style={{ ...styles.kpiCard, backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }}
          onClick={() => navigate('/parties')}
        >
          <div style={styles.kpiTop}>
            <span style={{ color: '#16a34a', fontSize: '16px', fontWeight: 800 }}>↓</span>
            <span style={styles.kpiBadgeGreen}>Receivables</span>
          </div>
          <div style={styles.kpiLabel}>To Receive</div>
          <div style={styles.kpiValue}>Rs. {formatDecimal(toReceive * periodMultiplier)}</div>
          <div style={styles.kpiSub}>Pending customer dues</div>
        </div>

        {/* 2. To Give */}
        <div
          style={{ ...styles.kpiCard, backgroundColor: '#fef2f2', borderColor: '#fee2e2' }}
          onClick={() => navigate('/parties')}
        >
          <div style={styles.kpiTop}>
            <span style={{ color: '#dc2626', fontSize: '16px', fontWeight: 800 }}>↑</span>
            <span style={styles.kpiBadgeRed}>Payables</span>
          </div>
          <div style={styles.kpiLabel}>To Give</div>
          <div style={styles.kpiValue}>Rs. {formatDecimal(toGive * periodMultiplier)}</div>
          <div style={styles.kpiSub}>Pending supplier bills</div>
        </div>

        {/* 3. Sales */}
        <div
          style={{ ...styles.kpiCard, backgroundColor: '#ecfdf5', borderColor: '#d1fae5' }}
          onClick={() => navigate('/sales')}
        >
          <div style={styles.kpiTop}>
            <span style={{ color: '#059669', fontSize: '15px' }}>🏷️</span>
            <span style={styles.kpiBadgeMint}>+14.2% Trend</span>
          </div>
          <div style={styles.kpiLabel}>
            Sales ({selectedPeriod === 'month' ? 'Baishakh' : selectedPeriod})
          </div>
          <div style={styles.kpiValue}>Rs. {formatDecimal(salesAmount * periodMultiplier)}</div>
          <div style={styles.kpiSub}>Total invoices recorded</div>
        </div>

        {/* 4. Purchase */}
        <div
          style={{ ...styles.kpiCard, backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}
          onClick={() => navigate('/purchases')}
        >
          <div style={styles.kpiTop}>
            <span style={{ color: '#2563eb', fontSize: '15px' }}>🛒</span>
            <span style={styles.kpiBadgeBlue}>Stock Inflow</span>
          </div>
          <div style={styles.kpiLabel}>
            Purchase ({selectedPeriod === 'month' ? 'Baishakh' : selectedPeriod})
          </div>
          <div style={styles.kpiValue}>Rs. {formatDecimal(purchaseAmount * periodMultiplier)}</div>
          <div style={styles.kpiSub}>Vendor stock purchases</div>
        </div>

        {/* 5. Expense */}
        <div
          style={{ ...styles.kpiCard, backgroundColor: '#fff1f2', borderColor: '#ffe4e6' }}
          onClick={() => setExpenseModalOpen(true)}
        >
          <div style={styles.kpiTop}>
            <span style={{ color: '#e11d48', fontSize: '15px' }}>💳</span>
            <span style={styles.kpiBadgePeach}>Operating</span>
          </div>
          <div style={styles.kpiLabel}>
            Expense ({selectedPeriod === 'month' ? 'Baishakh' : selectedPeriod})
          </div>
          <div style={styles.kpiValue}>Rs. {formatDecimal(expenseAmount * periodMultiplier)}</div>
          <div style={styles.kpiSub}>Shop overhead & costs</div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={styles.mainGrid}>
        {/* Left Column: Interactive Cashflow Chart */}
        <div style={styles.leftCol}>
          <div style={styles.cardBox}>
            <div style={styles.cardHeader}>
              <div>
                <div style={styles.cardHeaderTitle}>
                  Cashflow <span style={styles.subMuted}>(Last 7 Days)</span>
                </div>
                <div style={styles.layerSelector}>
                  <button
                    style={{ ...styles.layerBtn, ...(chartLayer === 'all' ? styles.layerBtnActive : {}) }}
                    onClick={() => setChartLayer('all')}
                  >
                    All Flows
                  </button>
                  <button
                    style={{ ...styles.layerBtn, ...(chartLayer === 'in' ? styles.layerBtnActive : {}) }}
                    onClick={() => setChartLayer('in')}
                  >
                    Money In Only
                  </button>
                  <button
                    style={{ ...styles.layerBtn, ...(chartLayer === 'out' ? styles.layerBtnActive : {}) }}
                    onClick={() => setChartLayer('out')}
                  >
                    Money Out Only
                  </button>
                </div>
              </div>

              <select
                value={cashflowPeriod}
                onChange={(e: any) => setCashflowPeriod(e.target.value)}
                style={styles.dropdownSelect}
              >
                <option value="daily">📅 Daily</option>
                <option value="weekly">📅 Weekly</option>
                <option value="monthly">📅 Monthly</option>
              </select>
            </div>

            {/* Interactive SVG Chart */}
            <div style={styles.chartContainer}>
              <svg viewBox="0 0 600 240" style={styles.chartSvg}>
                {/* Grid horizontal lines */}
                <line x1="40" y1="40" x2="580" y2="40" stroke="#f1f5f9" strokeDasharray="4,4" />
                <line x1="40" y1="90" x2="580" y2="90" stroke="#f1f5f9" strokeDasharray="4,4" />
                <line x1="40" y1="140" x2="580" y2="140" stroke="#f1f5f9" strokeDasharray="4,4" />
                <line x1="40" y1="190" x2="580" y2="190" stroke="#f1f5f9" />

                {/* Y Axis Labels */}
                <text x="20" y="45" fill="#94a3b8" fontSize="10">5k</text>
                <text x="20" y="95" fill="#94a3b8" fontSize="10">2.5k</text>
                <text x="20" y="145" fill="#94a3b8" fontSize="10">1k</text>
                <text x="20" y="195" fill="#94a3b8" fontSize="10">0</text>

                {/* Money In line */}
                {(chartLayer === 'all' || chartLayer === 'in') && (
                  <path
                    d="M 60 190 L 140 190 L 220 190 L 300 190 L 380 190 L 460 190 L 540 190"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}

                {/* Money Out line */}
                {(chartLayer === 'all' || chartLayer === 'out') && (
                  <path
                    d="M 60 190 L 140 190 L 220 190 L 300 190 L 380 190 L 460 190 L 540 190"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                )}

                {/* Interactive Points */}
                {days.map((d, i) => {
                  const x = 60 + i * 80;
                  return (
                    <g key={i} onMouseEnter={() => setHoveredDay(i)} style={{ cursor: 'pointer' }}>
                      <circle cx={x} cy="190" r="5" fill="#10b981" />
                      <circle cx={x} cy="190" r="2.5" fill="#ffffff" />
                      <text x={x} y="215" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="600">
                        {d.label}
                      </text>
                    </g>
                  );
                })}

                {/* Hover Tooltip Card (Matching Screenshot 5) */}
                {hoveredDay !== null && (
                  <g transform={`translate(${Math.min(420, 60 + hoveredDay * 80 - 55)}, 70)`}>
                    <rect
                      width="130"
                      height="74"
                      rx="8"
                      fill="#ffffff"
                      filter="drop-shadow(0 6px 12px rgba(0,0,0,0.12))"
                      stroke="#e2e8f0"
                    />
                    <text x="14" y="20" fill="#0f172a" fontSize="11" fontWeight="800">
                      {days[hoveredDay]?.label || 'Bai 15'}
                    </text>
                    <rect x="14" y="30" width="6" height="6" rx="2" fill="#10b981" />
                    <text x="26" y="36" fill="#64748b" fontSize="10">Money In</text>
                    <text x="85" y="36" fill="#0f172a" fontSize="10" fontWeight="700">
                      Rs. {formatDecimal(days[hoveredDay]?.in || 0)}
                    </text>
                    <rect x="14" y="46" width="6" height="6" rx="2" fill="#ef4444" />
                    <text x="26" y="52" fill="#64748b" fontSize="10">Money Out</text>
                    <text x="85" y="52" fill="#0f172a" fontSize="10" fontWeight="700">
                      Rs. {formatDecimal(days[hoveredDay]?.out || 0)}
                    </text>
                    <text x="14" y="66" fill="#059669" fontSize="9" fontWeight="700">
                      Net: Rs. {formatDecimal(days[hoveredDay]?.net || 0)}
                    </text>
                  </g>
                )}
              </svg>
            </div>

            {/* Bottom Legend */}
            <div style={styles.chartLegend}>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#10b981' }} />
                <span>Total Money In:</span>
                <strong>Rs. {formatDecimal(salesAmount * periodMultiplier)}</strong>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#ef4444' }} />
                <span>Total Money Out:</span>
                <strong>Rs. {formatDecimal((purchaseAmount + expenseAmount) * periodMultiplier)}</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div style={styles.rightCol}>
          {/* Total Balance Card */}
          <div style={styles.cardBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  Total Balance (Cash & Bank)
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginTop: '4px' }}>
                  Rs. {formatDecimal(totalBalance)}
                </div>
              </div>
              <button
                style={styles.refreshBtn}
                onClick={() => navigate('/manage-accounts')}
                title="View Bank & Cash Ledgers"
              >
                Manage 🏛️
              </button>
            </div>
          </div>

          {/* Complete your Profile Card */}
          <div style={styles.cardBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={styles.progressCircle}>
                <span style={styles.progressText}>85%</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={styles.profileCardTitle}>Business Profile Active</h4>
                <p style={styles.profileCardSub}>
                  PAN/VAT registered, IRD Annex compliance ready for billing.
                </p>
                <button style={styles.completeProfileBtn} onClick={() => navigate('/settings')}>
                  Update Details
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Reminders Card */}
          <div style={styles.cardBox}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Upcoming Reminders
            </div>
            <div style={styles.reminderEmptyState}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                Automated WhatsApp Bot Ready
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', textAlign: 'center', maxWidth: '280px' }}>
                Send 1-click reminders to customers with overdue balances directly to their WhatsApp.
              </div>
              <button
                style={styles.addReminderBtn}
                onClick={() => navigate('/parties')}
              >
                💬 Open Parties Ledger
              </button>
            </div>
          </div>

          {/* Invite Friends Card */}
          <div style={styles.cardBox}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{ fontSize: '28px' }}>🎁</span>
              <div style={{ flex: 1 }}>
                <h4 style={styles.inviteTitle}>Invite Friends. Get Rewarded.</h4>
                <p style={styles.inviteSub}>
                  Share your invite link and earn 150 Coins when your friends join, and 1 Month Premium Free for both!
                </p>
                <button style={styles.copyInviteBtn} onClick={handleCopyInvite}>
                  {copiedLink ? '✓ Link Copied!' : '🔗 Copy Invite Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Quick Action Modals */}
      <IncomeExpenseModal
        type="expense"
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
      />
      <IncomeExpenseModal
        type="income"
        isOpen={incomeModalOpen}
        onClose={() => setIncomeModalOpen(false)}
      />
      <PaymentInModal
        isOpen={paymentInModalOpen}
        onClose={() => setPaymentInModalOpen(false)}
      />
      <PaymentOutModal
        isOpen={paymentOutModalOpen}
        onClose={() => setPaymentOutModalOpen(false)}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
    animation: 'fadeIn 0.25s ease',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  welcomeTitle: {
    fontSize: '22px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  storePill: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px',
    fontWeight: 500,
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  quickPosBtn: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '9px 16px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
  },
  newBadge: {
    backgroundColor: '#ef4444',
    color: '#ffffff',
    fontSize: '9px',
    fontWeight: 800,
    padding: '1px 5px',
    borderRadius: '4px',
    textTransform: 'uppercase',
  },
  addSalesBtn: {
    padding: '9px 18px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  addPurchaseBtn: {
    padding: '9px 18px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
  },
  addMoreBtn: {
    padding: '9px 14px',
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1.5px solid #cbd5e1',
    borderRadius: '10px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  quickDropdown: {
    position: 'absolute',
    top: '110%',
    right: 0,
    width: '260px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
    border: '1px solid #e2e8f0',
    padding: '6px',
    zIndex: 100,
    animation: 'fadeIn 0.15s ease',
  },
  quickItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.1s ease',
  },
  quickIcon: {
    fontSize: '18px',
  },
  quickTitle: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0f172a',
  },
  quickSub: {
    fontSize: '10px',
    color: '#64748b',
  },
  timeFilterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '8px 14px',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  filterTabs: {
    display: 'flex',
    gap: '6px',
  },
  timeTab: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#64748b',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  timeTabActive: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
  },
  filterSummary: {
    fontSize: '11px',
    color: '#64748b',
  },
  alertBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 16px',
    borderRadius: '10px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
  },
  reorderBtn: {
    padding: '4px 10px',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  statCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '14px',
  },
  kpiCard: {
    borderRadius: '14px',
    border: '1px solid',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  },
  kpiTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
  },
  kpiValue: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '4px 0 2px 0',
  },
  kpiSub: {
    fontSize: '10px',
    color: '#94a3b8',
  },
  kpiBadgeGreen: {
    fontSize: '10px',
    color: '#16a34a',
    fontWeight: 700,
  },
  kpiBadgeRed: {
    fontSize: '10px',
    color: '#dc2626',
    fontWeight: 700,
  },
  kpiBadgeMint: {
    fontSize: '10px',
    color: '#059669',
    fontWeight: 700,
  },
  kpiBadgeBlue: {
    fontSize: '10px',
    color: '#2563eb',
    fontWeight: 700,
  },
  kpiBadgePeach: {
    fontSize: '10px',
    color: '#e11d48',
    fontWeight: 700,
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr',
    gap: '18px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  cardBox: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
  },
  cardHeaderTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#0f172a',
  },
  subMuted: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#64748b',
  },
  layerSelector: {
    display: 'flex',
    gap: '6px',
    marginTop: '6px',
  },
  layerBtn: {
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    color: '#64748b',
    fontSize: '10px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  layerBtnActive: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    borderColor: '#10b981',
    fontWeight: 700,
  },
  dropdownSelect: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  chartContainer: {
    width: '100%',
    overflowX: 'auto',
  },
  chartSvg: {
    width: '100%',
    height: '240px',
  },
  chartLegend: {
    display: 'flex',
    gap: '24px',
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #f1f5f9',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '12px',
    color: '#475569',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  refreshBtn: {
    padding: '4px 8px',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '11px',
    color: '#475569',
    fontWeight: 600,
    cursor: 'pointer',
  },
  progressCircle: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    border: '4px solid #10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#10b981',
  },
  profileCardTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  profileCardSub: {
    fontSize: '12px',
    color: '#64748b',
    margin: '4px 0 10px 0',
    lineHeight: 1.4,
  },
  completeProfileBtn: {
    padding: '6px 14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#334155',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  reminderEmptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '16px 0',
  },
  addReminderBtn: {
    marginTop: '12px',
    padding: '7px 16px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  inviteTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  inviteSub: {
    fontSize: '11px',
    color: '#64748b',
    margin: '4px 0 10px 0',
    lineHeight: 1.4,
  },
  copyInviteBtn: {
    padding: '6px 14px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
