import React, { useState } from 'react';
import { formatDecimal } from '../../utils/decimal';

interface PaymentRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  firmName?: string;
}

interface Debtor {
  id: string;
  name: string;
  phone: string;
  pan: string;
  dueAmount: number;
  daysOverdue: number;
  lastInvoice: string;
}

export const PaymentRemindersModal: React.FC<PaymentRemindersModalProps> = ({
  isOpen,
  onClose,
  firmName = 'Smart Billing Store',
}) => {
  const [debtors] = useState<Debtor[]>([
    { id: '1', name: 'Lumbini Electronics & Mobile', phone: '+977-9851000001', pan: '601998877', dueAmount: 320000, daysOverdue: 24, lastInvoice: 'INV-2081-0180' },
    { id: '2', name: 'Annapurna Grocery Store', phone: '+977-9841223344', pan: '602114455', dueAmount: 48900, daysOverdue: 12, lastInvoice: 'INV-2081-0181' },
    { id: '3', name: 'Bagmati Hardware Traders', phone: '+977-9801998877', pan: '600332211', dueAmount: 185000, daysOverdue: 42, lastInvoice: 'INV-2081-0165' },
    { id: '4', name: 'Koshi Departmental Store', phone: '+977-9812345678', pan: '604556677', dueAmount: 92400, daysOverdue: 7, lastInvoice: 'INV-2081-0185' },
  ]);

  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const handleSendReminder = (debtor: Debtor) => {
    const message = encodeURIComponent(
      `Namaste ${debtor.name}! 🙏\n\nThis is a gentle payment reminder from *${firmName}*.\n\n*Outstanding Due Balance:* NPR ${formatDecimal(debtor.dueAmount)}\n*Last Invoice Ref:* ${debtor.lastInvoice}\n*Days Overdue:* ${debtor.daysOverdue} days\n\nKindly clear the outstanding amount via Fonepay, ConnectIPS, or Bank transfer at your earliest convenience.\n\nThank you for your continued partnership!\n*${firmName}*`
    );
    const cleanPhone = debtor.phone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
    setSentMap((prev) => ({ ...prev, [debtor.id]: true }));
  };

  const totalOutstanding = debtors.reduce((sum, d) => sum + d.dueAmount, 0);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <div style={styles.badgeRow}>
              <span style={styles.featureBadge}>Smart Billing Recovery Engine</span>
              <span style={styles.whatsappBadge}>💬 WhatsApp Integrated</span>
            </div>
            <h2 style={styles.title}>📢 Automated WhatsApp Payment Reminders</h2>
            <p style={styles.subtitle}>
              Send polite, personalized payment reminders and statement links to debtor parties with 1 click.
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Summary Metric */}
        <div style={styles.summaryBar}>
          <div>
            <span style={styles.metricLabel}>Total Outstanding Receivables:</span>
            <span style={styles.metricValue}>NPR {formatDecimal(totalOutstanding)}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={styles.metricLabel}>Overdue Parties:</span>
            <span style={styles.metricCount}>{debtors.length} Accounts Pending</span>
          </div>
        </div>

        {/* Debtors List */}
        <div style={styles.debtorsList}>
          {debtors.map((debtor) => {
            const isSent = sentMap[debtor.id];
            return (
              <div key={debtor.id} style={styles.debtorRow}>
                <div style={{ flex: 1 }}>
                  <div style={styles.debtorName}>{debtor.name}</div>
                  <div style={styles.debtorMeta}>
                    <span>📱 {debtor.phone}</span>
                    <span>•</span>
                    <span>Ref: #{debtor.lastInvoice}</span>
                    <span>•</span>
                    <span style={{ color: debtor.daysOverdue > 30 ? '#dc2626' : '#d97706', fontWeight: 700 }}>
                      ⚠️ {debtor.daysOverdue} days overdue
                    </span>
                  </div>
                </div>

                <div style={styles.debtorRight}>
                  <div style={styles.dueAmount}>
                    NPR {formatDecimal(debtor.dueAmount)}
                  </div>
                  <button
                    style={{
                      ...styles.sendBtn,
                      backgroundColor: isSent ? '#f1f5f9' : '#25D366',
                      color: isSent ? '#475569' : '#ffffff',
                    }}
                    onClick={() => handleSendReminder(debtor)}
                  >
                    {isSent ? '✅ Reminder Sent' : '💬 Send WhatsApp Alert'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <span style={styles.footerNote}>
            💡 Reminders automatically format amounts, invoice numbers, and company signature.
          </span>
          <button style={styles.doneBtn} onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 300,
    padding: '16px',
    animation: 'fadeIn 0.2s ease',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '720px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '24px 24px 16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid #f1f5f9',
  },
  badgeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '6px',
  },
  featureBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#7c3aed',
    backgroundColor: '#f3e8ff',
    padding: '3px 8px',
    borderRadius: '10px',
  },
  whatsappBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#15803d',
    backgroundColor: '#dcfce7',
    padding: '3px 8px',
    borderRadius: '10px',
  },
  title: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '3px',
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '18px',
    color: '#64748b',
    cursor: 'pointer',
  },
  summaryBar: {
    backgroundColor: '#f8fafc',
    padding: '14px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    display: 'block',
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#dc2626',
    fontFamily: 'monospace',
  },
  metricCount: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
  },
  debtorsList: {
    padding: '16px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    maxHeight: '380px',
    overflowY: 'auto',
  },
  debtorRow: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
  },
  debtorName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
  },
  debtorMeta: {
    fontSize: '11px',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '3px',
  },
  debtorRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  dueAmount: {
    fontSize: '14px',
    fontWeight: 800,
    color: '#0f172a',
    fontFamily: 'monospace',
  },
  sendBtn: {
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #f1f5f9',
    backgroundColor: '#f8fafc',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerNote: {
    fontSize: '11px',
    color: '#64748b',
  },
  doneBtn: {
    padding: '8px 18px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
};
