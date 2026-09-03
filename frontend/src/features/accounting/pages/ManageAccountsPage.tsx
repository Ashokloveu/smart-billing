import React, { useState } from 'react';
import { formatDecimal } from '../../../utils/decimal';

interface BankAccount {
  id: string;
  type: 'cash' | 'bank';
  name: string;
  accountNumber?: string;
  holderName?: string;
  balance: number;
}

export const ManageAccountsPage: React.FC = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([
    { id: '1', type: 'cash', name: 'Cash', balance: 0 },
  ]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Modal form
  const [accountType, setAccountType] = useState<'bank' | 'cash'>('bank');
  const [bankName, setBankName] = useState('');
  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');

  const totalBalance = accounts.reduce((acc, a) => acc + a.balance, 0);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const newAcc: BankAccount = {
      id: Date.now().toString(),
      type: accountType,
      name: bankName || 'Bank Account',
      holderName,
      accountNumber,
      balance: Number(openingBalance) || 0,
    };
    setAccounts([...accounts, newAcc]);
    setShowAddModal(false);
    setBankName('');
    setHolderName('');
    setAccountNumber('');
    setOpeningBalance('');
  };

  return (
    <div style={styles.container}>
      {/* Left Column: Account List */}
      <div style={styles.leftCol}>
        <div style={styles.leftHeader}>
          <h2 style={styles.pageTitle}>Manage Accounts ({accounts.length})</h2>
          <button style={styles.addAccountBtn} onClick={() => setShowAddModal(true)}>
            + Add Account
          </button>
        </div>

        <div style={styles.totalBalanceRow}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Total Balance:</span>
          <strong style={{ fontSize: '15px', color: '#0f172a' }}>
            Rs. {formatDecimal(totalBalance)}
          </strong>
        </div>

        <div style={styles.accountList}>
          {accounts.map((acc) => (
            <div
              key={acc.id}
              style={{
                ...styles.accountCard,
                ...(selectedAccountId === acc.id ? styles.accountCardActive : {}),
              }}
              onClick={() => setSelectedAccountId(acc.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>{acc.type === 'cash' ? '💵' : '🏛️'}</span>
                <div>
                  <div style={styles.accName}>{acc.name}</div>
                  {acc.accountNumber && (
                    <div style={styles.accNum}>A/C: {acc.accountNumber}</div>
                  )}
                </div>
              </div>
              <strong style={styles.accBalance}>Rs. {formatDecimal(acc.balance)}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Account Ledger / Empty State */}
      <div style={styles.rightCol}>
        {selectedAccount ? (
          <div style={styles.ledgerCard}>
            <div style={styles.ledgerHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', color: '#0f172a' }}>{selectedAccount.name}</h3>
                {selectedAccount.accountNumber && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                    A/C No: {selectedAccount.accountNumber} • Holder: {selectedAccount.holderName}
                  </p>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Closing Balance</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>
                  Rs. {formatDecimal(selectedAccount.balance)}
                </div>
              </div>
            </div>

            <div style={styles.ledgerEmpty}>
              <span style={{ fontSize: '36px', opacity: 0.6 }}>📄</span>
              <div style={{ fontSize: '14px', fontWeight: 600, color: '#475569', marginTop: '8px' }}>
                No Transactions Recorded Yet
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Payments in and out linked to this account will reflect here.
              </div>
            </div>
          </div>
        ) : (
          <div style={styles.emptyStateContainer}>
            <div style={styles.sheetIllustration}>
              <span style={{ fontSize: '48px', opacity: 0.6 }}>📄</span>
            </div>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '12px 0 4px 0' }}>
              Account Not Selected
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
              Select account to view their transactions
            </p>
          </div>
        )}
      </div>

      {/* Add New Account Modal (Matching Page 16) */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Account</h3>
              <button onClick={() => setShowAddModal(false)} style={styles.closeBtn}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Account Type</label>
                <select
                  value={accountType}
                  onChange={(e: any) => setAccountType(e.target.value)}
                  style={styles.select}
                >
                  <option value="bank">Bank Account</option>
                  <option value="cash">Cash Account</option>
                </select>
              </div>

              {accountType === 'bank' && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Bank Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter name (e.g. Nabil Bank, Global IME)"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Account Holder Name</label>
                    <input
                      type="text"
                      placeholder="Enter account holder name"
                      value={holderName}
                      onChange={(e) => setHolderName(e.target.value)}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Account Number</label>
                    <input
                      type="text"
                      placeholder="Enter account number"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      style={styles.input}
                    />
                  </div>
                </>
              )}

              <div style={styles.formGroup}>
                <label style={styles.label}>Current Account Balance</label>
                <div style={styles.currencyWrapper}>
                  <span style={styles.currencyPrefix}>Rs.</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={openingBalance}
                    onChange={(e) => setOpeningBalance(e.target.value)}
                    style={styles.currencyInput}
                  />
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.saveAccountBtn}>
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '20px',
    height: 'calc(100vh - 110px)',
    animation: 'fadeIn 0.2s ease',
  },
  leftCol: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  leftHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  pageTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  addAccountBtn: {
    padding: '6px 12px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  totalBalanceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 12px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '14px',
    border: '1px solid #e2e8f0',
  },
  accountList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    overflowY: 'auto',
  },
  accountCard: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    transition: 'all 0.1s ease',
  },
  accountCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  accName: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
  },
  accNum: {
    fontSize: '11px',
    color: '#64748b',
  },
  accBalance: {
    fontSize: '13px',
    color: '#0f172a',
  },
  rightCol: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
  },
  ledgerCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  ledgerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '16px',
    borderBottom: '1px solid #f1f5f9',
  },
  ledgerEmpty: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIllustration: {
    width: '80px',
    height: '80px',
    borderRadius: '16px',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
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
    maxWidth: '460px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
  },
  modalTitle: {
    fontSize: '16px',
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
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
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
    outline: 'none',
    backgroundColor: '#ffffff',
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
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    color: '#64748b',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  saveAccountBtn: {
    padding: '8px 20px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '8px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
