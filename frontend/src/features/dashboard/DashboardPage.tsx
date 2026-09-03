import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';

export const DashboardPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const [cashflowPeriod, setCashflowPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [hoveredDay, setHoveredDay] = useState<number | null>(6);
  const [copiedLink, setCopiedLink] = useState(false);

  const days = [
    { label: 'Bai 09', in: 0, out: 0 },
    { label: 'Bai 10', in: 0, out: 0 },
    { label: 'Bai 11', in: 0, out: 0 },
    { label: 'Bai 12', in: 0, out: 0 },
    { label: 'Bai 13', in: 0, out: 0 },
    { label: 'Bai 14', in: 0, out: 0 },
    { label: 'Bai 15', in: 0, out: 0 },
  ];

  const handleCopyInvite = () => {
    navigator.clipboard.writeText('https://smartbilling.app/join?ref=ASHOK10');
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div style={styles.container}>
      {/* Top Welcome Bar & Action Buttons */}
      <div style={styles.topHeader}>
        <h1 style={styles.welcomeTitle}>
          Welcome {user?.fullName || 'Ashok Singh'}
        </h1>

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
          <button style={styles.addMoreBtn} onClick={() => navigate('/online-store')}>
            + Add More
          </button>
        </div>
      </div>

      {/* Top 5 Soft Colored Stat Cards */}
      <div style={styles.statCardsGrid}>
        {/* 1. To Receive */}
        <div style={{ ...styles.kpiCard, backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }}>
          <div style={styles.kpiTop}>
            <span style={{ color: '#16a34a', fontSize: '16px', fontWeight: 800 }}>↓</span>
          </div>
          <div style={styles.kpiLabel}>To Receive</div>
          <div style={styles.kpiValue}>Rs. 0</div>
        </div>

        {/* 2. To Give */}
        <div style={{ ...styles.kpiCard, backgroundColor: '#fef2f2', borderColor: '#fee2e2' }}>
          <div style={styles.kpiTop}>
            <span style={{ color: '#dc2626', fontSize: '16px', fontWeight: 800 }}>↑</span>
          </div>
          <div style={styles.kpiLabel}>To Give</div>
          <div style={styles.kpiValue}>Rs. 0</div>
        </div>

        {/* 3. Sales (Baishakh) */}
        <div style={{ ...styles.kpiCard, backgroundColor: '#ecfdf5', borderColor: '#d1fae5' }}>
          <div style={styles.kpiTop}>
            <span style={{ color: '#059669', fontSize: '14px' }}>🏷️</span>
          </div>
          <div style={styles.kpiLabel}>Sales (Baishakh)</div>
          <div style={styles.kpiValue}>Rs. 0</div>
        </div>

        {/* 4. Purchase (Baishakh) */}
        <div style={{ ...styles.kpiCard, backgroundColor: '#eff6ff', borderColor: '#dbeafe' }}>
          <div style={styles.kpiTop}>
            <span style={{ color: '#2563eb', fontSize: '14px' }}>🛒</span>
          </div>
          <div style={styles.kpiLabel}>Purchase (Baishakh)</div>
          <div style={styles.kpiValue}>Rs. 0</div>
        </div>

        {/* 5. Expense (Baishakh) */}
        <div style={{ ...styles.kpiCard, backgroundColor: '#fff1f2', borderColor: '#ffe4e6' }}>
          <div style={styles.kpiTop}>
            <span style={{ color: '#e11d48', fontSize: '14px' }}>💳</span>
          </div>
          <div style={styles.kpiLabel}>Expense (Baishakh)</div>
          <div style={styles.kpiValue}>Rs. 0</div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div style={styles.mainGrid}>
        {/* Left Column: Cashflow Chart */}
        <div style={styles.leftCol}>
          <div style={styles.cardBox}>
            <div style={styles.cardHeader}>
              <div style={styles.cardHeaderTitle}>
                Cashflow <span style={styles.subMuted}>(Last 7 Days)</span>
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
                <text x="25" y="45" fill="#94a3b8" fontSize="11">4</text>
                <text x="25" y="95" fill="#94a3b8" fontSize="11">3</text>
                <text x="25" y="145" fill="#94a3b8" fontSize="11">2</text>
                <text x="25" y="195" fill="#94a3b8" fontSize="11">0</text>

                {/* Baseline Money In line */}
                <path d="M 60 190 L 140 190 L 220 190 L 300 190 L 380 190 L 460 190 L 540 190" fill="none" stroke="#10b981" strokeWidth="2.5" />
                {/* Baseline Money Out line */}
                <path d="M 60 190 L 140 190 L 220 190 L 300 190 L 380 190 L 460 190 L 540 190" fill="none" stroke="#ef4444" strokeWidth="2.5" />

                {/* Interactive Points */}
                {days.map((d, i) => {
                  const x = 60 + i * 80;
                  return (
                    <g key={i} onMouseEnter={() => setHoveredDay(i)} style={{ cursor: 'pointer' }}>
                      <circle cx={x} cy="190" r="4" fill="#10b981" />
                      <circle cx={x} cy="190" r="2" fill="#ffffff" />
                      <text x={x} y="215" textAnchor="middle" fill="#64748b" fontSize="11">
                        {d.label}
                      </text>
                    </g>
                  );
                })}

                {/* Hover Tooltip Card (Matching Screenshot 5) */}
                {hoveredDay !== null && (
                  <g transform={`translate(${Math.min(420, 60 + hoveredDay * 80 - 45)}, 90)`}>
                    <rect width="110" height="60" rx="8" fill="#ffffff" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" stroke="#e2e8f0" />
                    <text x="12" y="18" fill="#0f172a" fontSize="11" fontWeight="700">
                      {days[hoveredDay]?.label || 'Bai 15'}
                    </text>
                    <rect x="12" y="27" width="6" height="6" rx="2" fill="#10b981" />
                    <text x="24" y="34" fill="#64748b" fontSize="10">Money In</text>
                    <text x="75" y="34" fill="#0f172a" fontSize="10" fontWeight="600">Rs. 0</text>
                    <rect x="12" y="43" width="6" height="6" rx="2" fill="#ef4444" />
                    <text x="24" y="50" fill="#64748b" fontSize="10">Money Out</text>
                    <text x="75" y="50" fill="#0f172a" fontSize="10" fontWeight="600">Rs. 0</text>
                  </g>
                )}
              </svg>
            </div>

            {/* Bottom Legend */}
            <div style={styles.chartLegend}>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#10b981' }} />
                <span>Total Money In</span>
                <strong>Rs. 0</strong>
              </div>
              <div style={styles.legendItem}>
                <span style={{ ...styles.legendDot, backgroundColor: '#ef4444' }} />
                <span>Total Money Out</span>
                <strong>Rs. 0</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Cards matching Screenshot 5 */}
        <div style={styles.rightCol}>
          {/* Total Balance Card */}
          <div style={styles.cardBox}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                  Total Balance (Cash & Bank)
                </div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  Rs. 0
                </div>
              </div>
              <span style={{ color: '#94a3b8', fontSize: '14px' }}>⇅</span>
            </div>
          </div>

          {/* Complete your Profile Card */}
          <div style={styles.cardBox}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={styles.progressCircle}>
                <span style={styles.progressText}>30%</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={styles.profileCardTitle}>Complete your Profile</h4>
                <p style={styles.profileCardSub}>
                  You can use more app features after completing your business profile
                </p>
                <button style={styles.completeProfileBtn} onClick={() => navigate('/settings')}>
                  Complete Profile
                </button>
              </div>
            </div>
          </div>

          {/* Upcoming Reminders Card */}
          <div style={styles.cardBox}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
              Upcoming Reminders (0)
            </div>
            <div style={styles.reminderEmptyState}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#1e293b' }}>
                Reminder Not Created Yet!
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', textAlign: 'center', maxWidth: '280px' }}>
                Looks like you haven't created any reminders yet. Click Add New Reminder to create.
              </div>
              <button
                style={styles.addReminderBtn}
                onClick={() => navigate('/parties')}
              >
                + Add New Reminder
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
                  Share your invite link and earn <strong>150 Coins</strong> when your friends join, and <strong>1 Month Premium Free For Both</strong> when your friend upgrades.
                </p>
                <button style={styles.copyInviteBtn} onClick={handleCopyInvite}>
                  {copiedLink ? '✅ Link Copied!' : '🔗 Copy Invite Link'}
                </button>
              </div>
            </div>
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
    gap: '20px',
    animation: 'fadeIn 0.2s ease',
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
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  quickPosBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    backgroundColor: '#ecfdf5',
    color: '#059669',
    border: '1px solid #a7f3d0',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    position: 'relative',
  },
  newBadge: {
    fontSize: '9px',
    fontWeight: 800,
    backgroundColor: '#ef4444',
    color: '#ffffff',
    padding: '1px 5px',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  addSalesBtn: {
    padding: '9px 16px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  addPurchaseBtn: {
    padding: '9px 16px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(37, 99, 235, 0.25)',
  },
  addMoreBtn: {
    padding: '9px 14px',
    backgroundColor: '#ffffff',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  statCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '14px',
  },
  kpiCard: {
    padding: '16px 18px',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  kpiTop: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '4px',
  },
  kpiLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
  },
  kpiValue: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    marginTop: '2px',
    fontFamily: 'JetBrains Mono, monospace',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardBox: {
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  cardHeaderTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
  },
  subMuted: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: 500,
  },
  dropdownSelect: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    fontWeight: 600,
    color: '#475569',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  chartContainer: {
    width: '100%',
    height: '240px',
  },
  chartSvg: {
    width: '100%',
    height: '100%',
    overflow: 'visible',
  },
  chartLegend: {
    display: 'flex',
    justifyContent: 'center',
    gap: '32px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #f1f5f9',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    color: '#64748b',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
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
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  profileCardSub: {
    fontSize: '11px',
    color: '#64748b',
    margin: '3px 0 8px 0',
    lineHeight: 1.4,
  },
  completeProfileBtn: {
    padding: '5px 12px',
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  reminderEmptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 12px',
  },
  addReminderBtn: {
    marginTop: '14px',
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
    padding: '6px 12px',
    backgroundColor: '#f8fafc',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
