import React, { useState, useEffect } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';

interface PaymentOutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const PaymentOutModal: React.FC<PaymentOutModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [parties, setParties] = useState<any[]>([]);
  const [partyId, setPartyId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [receiptNumber, setReceiptNumber] = useState('1');
  const [remarks, setRemarks] = useState('');
  const [bsDate, setBsDate] = useState('2083 Bai 15');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen || !currentOrg?._id) return;
    const fetchSuppliers = async () => {
      try {
        const res = await apiClient.get(`/organizations/${currentOrg._id}/parties`);
        setParties(res.data.data || []);
      } catch (e) {
        console.error('Failed to load parties', e);
      }
    };
    fetchSuppliers();
  }, [isOpen, currentOrg?._id]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partyId) {
      alert('Please select a party');
      return;
    }
    setIsSubmitting(true);
    try {
      await apiClient.post(`/organizations/${currentOrg?._id}/transactions`, {
        type: 'payment',
        partyId,
        totalAmount: amount,
        paidAmount: amount,
        paymentMode,
        bsDate: '2081-11-20',
        remarks,
        status: 'posted',
        lines: [],
      });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording payment out');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Add Payment Out</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Row 1: Receipt Number & Date */}
          <div style={styles.twoCol}>
            <div style={styles.formGroup}>
              <div style={styles.labelWithBadge}>
                <label style={styles.label}>Receipt Number</label>
                <span style={styles.manualBadge}>Manual</span>
              </div>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Date</label>
              <div style={styles.dateWrapper}>
                <input
                  type="text"
                  value={bsDate}
                  onChange={(e) => setBsDate(e.target.value)}
                  style={styles.input}
                />
                <span style={styles.calIcon}>📅</span>
              </div>
            </div>
          </div>

          {/* Row 2: Party Name */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Party Name</label>
            <select
              value={partyId}
              onChange={(e) => setPartyId(e.target.value)}
              style={styles.select}
              required
            >
              <option value="">Search for party</option>
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.phone ? `(${p.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Row 3: Paid Amount & Payment Method */}
          <div style={styles.twoCol}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Paid Amount</label>
              <div style={styles.currencyWrapper}>
                <span style={styles.currencyPrefix}>Rs.</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={styles.currencyInput}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Payment Method</label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                style={styles.select}
              >
                <option value="cash">Cash</option>
                <option value="bank">Bank Transfer</option>
                <option value="fonepay">Fonepay QR</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Row 4: Remarks */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Remarks</label>
            <textarea
              placeholder="Enter remarks here..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={styles.textarea}
              rows={3}
            />
          </div>

          {/* Attach Images */}
          <div>
            <button type="button" style={styles.cameraBtn} title="Attach Voucher Photo">
              📷
            </button>
          </div>

          {/* Bottom Action */}
          <div style={styles.footer}>
            <button
              type="submit"
              disabled={isSubmitting}
              style={styles.saveBtn}
            >
              {isSubmitting ? 'Saving...' : 'Save Payment Out'}
            </button>
          </div>
        </form>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '560px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #f1f5f9',
  },
  title: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  form: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  twoCol: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#334155',
  },
  labelWithBadge: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  manualBadge: {
    fontSize: '11px',
    color: '#10b981',
    fontWeight: 700,
  },
  input: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
  },
  select: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  currencyWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  currencyPrefix: {
    position: 'absolute',
    left: '12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
  },
  currencyInput: {
    width: '100%',
    padding: '9px 12px 9px 36px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  dateWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  calIcon: {
    position: 'absolute',
    right: '12px',
    fontSize: '14px',
    pointerEvents: 'none',
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  cameraBtn: {
    width: '44px',
    height: '44px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '8px',
  },
  saveBtn: {
    padding: '10px 24px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
};
