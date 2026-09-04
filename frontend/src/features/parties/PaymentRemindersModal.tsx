import React, { useState, useMemo } from 'react';
import { Party } from '../../types/master';
import { formatDecimal } from '../../utils/decimal';

interface PaymentRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  firmName?: string;
  parties?: Party[];
}

export const PaymentRemindersModal: React.FC<PaymentRemindersModalProps> = ({
  isOpen,
  onClose,
  firmName = 'Smart Billing Store',
  parties = [],
}) => {
  const [tone, setTone] = useState<'friendly' | 'standard' | 'urgent'>('friendly');
  const [sentMap, setSentMap] = useState<Record<string, boolean>>({});

  // Fallback demo debtors if parties list has no debtors yet
  const debtors = useMemo(() => {
    const realDebtors = parties
      .filter((p) => Number(formatDecimal(p.currentBalance || 0)) > 0)
      .map((p) => ({
        id: p._id,
        name: p.name,
        phone: p.phone || '',
        pan: p.panNumber || 'Consumer',
        dueAmount: Number(formatDecimal(p.currentBalance)),
        daysOverdue: 14,
        lastInvoice: `INV-${p.phone?.slice(-4) || '2081'}`,
      }));

    if (realDebtors.length > 0) return realDebtors;

    return [
      { id: '1', name: 'Lumbini Electronics & Mobile', phone: '+977-9851000001', pan: '601998877', dueAmount: 320000, daysOverdue: 24, lastInvoice: 'INV-2081-0180' },
      { id: '2', name: 'Annapurna Grocery Store', phone: '+977-9841223344', pan: '602114455', dueAmount: 48900, daysOverdue: 12, lastInvoice: 'INV-2081-0181' },
      { id: '3', name: 'Bagmati Hardware Traders', phone: '+977-9801998877', pan: '600332211', dueAmount: 185000, daysOverdue: 42, lastInvoice: 'INV-2081-0165' },
      { id: '4', name: 'Koshi Departmental Store', phone: '+977-9812345678', pan: '604556677', dueAmount: 92400, daysOverdue: 7, lastInvoice: 'INV-2081-0185' },
    ];
  }, [parties]);

  if (!isOpen) return null;

  const getReminderMessage = (debtor: any) => {
    if (tone === 'friendly') {
      return (
        `नमस्ते ${debtor.name} ज्यू! 🙏\n\n` +
        `यो *${firmName}* बाट तपाईंको खाता सम्बन्धी विनम्र ताकेता हो।\n\n` +
        `● *बाँकी रकम:* NPR ${formatDecimal(debtor.dueAmount)}\n` +
        `● *सन्दर्भ बिल:* #${debtor.lastInvoice}\n\n` +
        `कृपया अनुकूल समयमा उक्त रकम Fonepay, मोबाइल बैंकिङ वा नगद मार्फत भुक्तानी गरी खाता मिलान गरिदिनुहुन अनुरोध छ।\n\n` +
        `हार्दिक धन्यवाद!\n*${firmName}*`
      );
    } else if (tone === 'standard') {
      return (
        `नमस्ते ${debtor.name} ज्यू! ⚠️\n\n` +
        `*${firmName}* बाट तपाईंको उधारो भुक्तानी भाका नाघेको सम्बन्धमा सूचना:\n\n` +
        `● *कुल बाँकी रकम:* NPR ${formatDecimal(debtor.dueAmount)}\n` +
        `● *भाका नाघेको दिन:* ${debtor.daysOverdue} दिन\n` +
        `● *बिल नं:* #${debtor.lastInvoice}\n\n` +
        `समयमै भुक्तानी गरी थप जरिवानाबाट बच्न र नयाँ अर्डर निरन्तरता दिन अनुरोध छ।\n\n` +
        `*${firmName} (Smart Billing Recovery)*`
      );
    } else {
      return (
        `जरुरी सूचना: ${debtor.name}! 🚨\n\n` +
        `*${firmName}* को खातामा तपाईंको *NPR ${formatDecimal(debtor.dueAmount)}* भुक्तानी लामो समयदेखि रोकिएको छ।\n\n` +
        `खाता रोक्का हुनबाट जोगिन आजै Fonepay वा बैंकिङ मार्फत रकम दाखिला गर्नुहोला।\n\n` +
        `*${firmName} Finance Dept*`
      );
    }
  };

  const handleSendReminder = (debtor: any) => {
    const rawMsg = getReminderMessage(debtor);
    const encoded = encodeURIComponent(rawMsg);
    const cleanPhone = debtor.phone.replace(/[^0-9]/g, '');
    const url = cleanPhone
      ? `https://wa.me/${cleanPhone.length === 10 ? '977' + cleanPhone : cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
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
              <span style={styles.featureBadge}>Smart Billing Recovery Bot</span>
              <span style={styles.whatsappBadge}>💬 WhatsApp Automated</span>
            </div>
            <h2 style={styles.title}>📢 Automated WhatsApp Payment Reminders</h2>
            <p style={styles.subtitle}>
              Send polite, personalized Nepali payment reminders and Fonepay links to debtor parties with 1 click.
            </p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Tone Switcher */}
        <div style={styles.toneBar}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>Message Tone (शैली):</span>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              style={{ ...styles.toneBtn, ...(tone === 'friendly' ? styles.toneBtnActive : {}) }}
              onClick={() => setTone('friendly')}
            >
              🤝 विनम्र (Friendly)
            </button>
            <button
              style={{ ...styles.toneBtn, ...(tone === 'standard' ? styles.toneBtnActive : {}) }}
              onClick={() => setTone('standard')}
            >
              ⚠️ भाका नाघेको (Standard)
            </button>
            <button
              style={{ ...styles.toneBtn, ...(tone === 'urgent' ? styles.toneBtnActive : {}) }}
              onClick={() => setTone('urgent')}
            >
              🚨 अन्तिम ताकेता (Urgent)
            </button>
          </div>
        </div>

        {/* Summary Metric */}
        <div style={styles.summaryBar}>
          <div>
            <span style={styles.metricLabel}>Total Outstanding Udharo:</span>
            <span style={styles.metricValue}>NPR {formatDecimal(totalOutstanding)}</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={styles.metricLabel}>Pending Accounts:</span>
            <span style={styles.metricCount}>{debtors.length} Parties Due</span>
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
                    <span>📱 {debtor.phone || 'No phone'}</span>
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
                    {isSent ? '✅ Reminder Dispatched' : '💬 Send WhatsApp Alert'}
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
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '750px',
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
    color: '#10b981',
    backgroundColor: '#ecfdf5',
    padding: '3px 8px',
    borderRadius: '6px',
    border: '1px solid #a7f3d0',
  },
  whatsappBadge: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#15803d',
    backgroundColor: '#dcfce7',
    padding: '3px 8px',
    borderRadius: '6px',
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
  toneBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 24px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '8px',
  },
  toneBtn: {
    padding: '5px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '11px',
    fontWeight: 700,
    backgroundColor: '#ffffff',
    color: '#475569',
    cursor: 'pointer',
  },
  toneBtnActive: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderColor: '#10b981',
  },
  summaryBar: {
    backgroundColor: '#ffffff',
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
    marginTop: '3px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  debtorRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  dueAmount: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#dc2626',
    fontFamily: 'monospace',
  },
  sendBtn: {
    padding: '7px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  footer: {
    padding: '16px 24px',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerNote: {
    fontSize: '11px',
    color: '#64748b',
  },
  doneBtn: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '8px 20px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
};
