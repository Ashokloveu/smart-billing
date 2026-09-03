import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { KarobarEmptyState } from '../../components/common/KarobarEmptyState';
import { PaymentInModal } from './PaymentInModal';
import { formatDecimal } from '../../utils/decimal';

export const PaymentInPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const fetchPayments = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/organizations/${currentOrg._id}/transactions`, {
        params: { type: 'receipt' },
      });
      setPayments(res.data.data || []);
    } catch (e) {
      console.error('Failed to load receipts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentOrg?._id]);

  return (
    <div>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Payment In (Receipts)</h1>
          <p style={styles.subtitle}>Track incoming cash, QR payments, and bank deposits from customers.</p>
        </div>
        <button style={styles.btnPrimary} onClick={() => setShowModal(true)}>
          + Add Payment In
        </button>
      </div>

      {payments.length === 0 && !loading ? (
        <KarobarEmptyState
          title="Record Your First Payment In"
          subtitle="Record payment received from customers via cash, Fonepay QR, or bank transfer."
          buttonText="Add Payment In"
          onButtonClick={() => setShowModal(true)}
        />
      ) : (
        <div style={styles.card}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.theadRow}>
                <th style={styles.th}>Receipt #</th>
                <th style={styles.th}>Date</th>
                <th style={styles.th}>Party Name</th>
                <th style={styles.th}>Payment Method</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Amount Received</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} style={styles.tr}>
                  <td style={styles.td}><strong>{p.documentNumber || 'REC-001'}</strong></td>
                  <td style={styles.td}>{p.bsDate || '2081-11-20'}</td>
                  <td style={styles.td}>{p.partyName || 'Customer'}</td>
                  <td style={styles.td}>
                    <span style={styles.methodBadge}>{(p.paymentMode || 'cash').toUpperCase()}</span>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: '#10b981' }}>
                    Rs. {formatDecimal(p.paidAmount || p.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <PaymentInModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={fetchPayments}
      />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  title: { fontSize: '20px', fontWeight: 800, color: '#0f172a' },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '2px' },
  btnPrimary: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    padding: '9px 18px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
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
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '12px 16px',
    fontSize: '13px',
    color: '#1e293b',
  },
  methodBadge: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
};
