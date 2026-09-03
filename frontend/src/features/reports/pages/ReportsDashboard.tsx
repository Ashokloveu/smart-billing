import React from 'react';
import { useNavigate } from 'react-router-dom';

export const ReportsDashboard: React.FC = () => {
  const navigate = useNavigate();

  const reportSections = [
    {
      title: '', // Top standalone cards
      items: [
        { id: 'daybook', title: 'Day Book', desc: 'View all of your daily transactions', icon: '📖', path: '/accounting' },
        { id: 'all_txn', title: 'All Transactions', desc: 'View all party transactions in a given time', icon: '📋', path: '/sales' },
        { id: 'pnl', title: 'Profit And Loss', desc: 'View your profit & loss in a given time', icon: '📈', path: '/reports' },
      ],
    },
    {
      title: 'Party Report',
      items: [
        { id: 'party_stmt', title: 'Party Statement', desc: 'Check the transactions of certain party', icon: '👤', path: '/parties' },
        { id: 'all_party', title: 'All Party Report', desc: 'Receivable/payable dues of every party', icon: '👥', badge: 'View Report →', path: '/parties' },
      ],
    },
    {
      title: 'Inventory Report',
      items: [
        { id: 'item_detail', title: 'Item Details Report', desc: 'Check stock, transaction of individual item', icon: '📦', path: '/items' },
        { id: 'item_list', title: 'Item List Report', desc: 'Shows all the item rates like, sales, purchase, MRP price etc.', icon: '📑', path: '/items' },
        { id: 'low_stock', title: 'Low Stock Summary Report', desc: 'View all items which are getting low on quantity', icon: '⚠️', path: '/inventory' },
        { id: 'stock_qty', title: 'Stock Quantity Report', desc: 'View opening & closing quantity of each item', icon: '📊', path: '/inventory' },
      ],
    },
    {
      title: 'Income Expense Report',
      items: [
        { id: 'inc_exp', title: 'Income Expense Report', desc: 'Check all the income expense report', icon: '💳', path: '/accounting' },
        { id: 'exp_cat', title: 'Expense Category', desc: 'Check the categorized expense report in a given date', icon: '📂', path: '/accounting' },
        { id: 'inc_cat', title: 'Income Category', desc: 'Check the categorized income report in a given date', icon: '📥', path: '/accounting' },
      ],
    },
    {
      title: 'Business Status',
      items: [
        { id: 'cash_stmt', title: 'Cash in Hand Statement', desc: 'Check all transaction made with cash', icon: '💵', path: '/accounting' },
        { id: 'bank_stmt', title: 'Bank Statement', desc: 'Check all the transaction made with bank', icon: '🏛️', path: '/accounting' },
        { id: 'disc_rep', title: 'Discount Report', desc: 'Check the total discounted amount made by each parties in purchase & sales', icon: '🏷️', path: '/sales' },
        { id: 'tax_sales', title: 'Tax Sales', desc: 'Check report of all Tax applicable sales', icon: '🇳🇵', path: '/compliance' },
        { id: 'tax_pur', title: 'Tax Purchase', desc: 'Check report of all Tax applicable purchase', icon: '🧾', path: '/compliance' },
      ],
    },
  ];

  return (
    <div style={styles.container}>
      {reportSections.map((sec, sIdx) => (
        <div key={sIdx} style={styles.sectionBlock}>
          {sec.title && <h3 style={styles.sectionTitle}>{sec.title}</h3>}
          <div style={styles.cardsGrid}>
            {sec.items.map((item) => (
              <div
                key={item.id}
                style={styles.reportCard}
                onClick={() => {
                  if (item.path) navigate(item.path);
                  else alert(`Report: ${item.title}`);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={styles.cardTitle}>{item.title}</div>
                  {item.badge && <span style={styles.viewBadge}>{item.badge}</span>}
                </div>
                <div style={styles.cardDesc}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    animation: 'fadeIn 0.2s ease',
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#64748b',
    margin: '4px 0 0 0',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '14px',
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '16px 20px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: '70px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '4px',
  },
  cardDesc: {
    fontSize: '12px',
    color: '#64748b',
    lineHeight: 1.4,
  },
  viewBadge: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: 700,
  },
};
