import React, { useState } from 'react';

interface IncomeExpenseModalProps {
  type: 'income' | 'expense';
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const IncomeExpenseModal: React.FC<IncomeExpenseModalProps> = ({
  type,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isIncome = type === 'income';
  const [docNumber, setDocNumber] = useState('1');
  const [bsDate, setBsDate] = useState('2083 Bai 15');
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSuccess) onSuccess();
    onClose();
  };

  const incomeCategories = ['Consulting', 'Service Fee', 'Interest Income', 'Commission', 'Other Income'];
  const expenseCategories = ['Rent', 'Electricity & Water', 'Office Supplies', 'Staff Salary', 'Logistics & Travel', 'Miscellaneous'];

  const categories = isIncome ? incomeCategories : expenseCategories;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>{isIncome ? 'Add Income' : 'Add Expense'}</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Row 1: Number & Date */}
          <div style={styles.twoCol}>
            <div style={styles.formGroup}>
              <div style={styles.labelWithBadge}>
                <label style={styles.label}>{isIncome ? 'Income No.' : 'Expense No.'}</label>
                <span style={styles.manualBadge}>Manual</span>
              </div>
              <input
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
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

          {/* Row 2: Category */}
          <div style={styles.formGroup}>
            <label style={styles.label}>{isIncome ? 'Income Category' : 'Expense Category'}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={styles.select}
              required
            >
              <option value="">Search for category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* + Add Item link */}
          <div>
            <button type="button" style={styles.addItemBtn}>
              + {isIncome ? 'Add Income Item' : 'Add Expense Item'}
            </button>
          </div>

          {/* Row 3: Amount & Payment Method */}
          <div style={styles.twoCol}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Total Amount</label>
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
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={styles.select}
              >
                <option value="cash">Cash</option>
                <option value="fonepay">Fonepay QR</option>
                <option value="bank">Bank Transfer</option>
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
            <button type="button" style={styles.cameraBtn} title="Attach Receipt Photo">
              📷
            </button>
          </div>

          {/* Bottom Action */}
          <div style={styles.footer}>
            <button type="submit" style={styles.saveBtn}>
              {isIncome ? 'Save Income' : 'Save Expense'}
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
    padding: '18px 24px',
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
    gap: '14px',
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
  addItemBtn: {
    background: 'none',
    border: 'none',
    color: '#10b981',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    padding: 0,
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
    marginTop: '6px',
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
