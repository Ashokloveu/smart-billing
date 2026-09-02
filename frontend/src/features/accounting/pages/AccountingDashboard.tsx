import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { Account, JournalEntry } from '../types/accounting';
import { Firm, FiscalPeriod } from '../../../types/master';
import { accountingService } from '../services/accountingService';
import { apiClient } from '../../../services/apiClient';
import { ChartOfAccountsTree } from '../components/ChartOfAccountsTree';
import { JournalVoucherModal } from '../components/JournalVoucherModal';
import { OpeningBalanceModal } from '../components/OpeningBalanceModal';
import { AccountLedgerView } from '../components/AccountLedgerView';
import { DayBookView } from '../components/DayBookView';
import { FinancialStatementsView } from '../components/FinancialStatementsView';
import { TaxSummaryView } from '../components/TaxSummaryView';
import { formatDecimal } from '../../../utils/decimal';

export const AccountingDashboard: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [activeTab, setActiveTab] = useState<
    'coa' | 'journals' | 'opening' | 'ledger' | 'daybook' | 'statements' | 'tax'
  >('coa');

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [fiscalYears, setFiscalYears] = useState<FiscalPeriod[]>([]);
  const [loading, setLoading] = useState(false);

  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showOpeningModal, setShowOpeningModal] = useState(false);
  const [selectedLedgerAccountId, setSelectedLedgerAccountId] = useState<string | undefined>(undefined);

  const fetchData = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const [accRes, jrnRes, fRes, fyRes] = await Promise.all([
        accountingService.getAccounts(currentOrg._id),
        accountingService.getJournals(currentOrg._id),
        apiClient.get(`/organizations/${currentOrg._id}/firms`),
        apiClient.get(`/organizations/${currentOrg._id}/fiscal-years`),
      ]);

      setAccounts(accRes);
      setJournals(jrnRes.items);
      setFirms(fRes.data.data);
      setFiscalYears(fyRes.data.data);
    } catch (e) {
      console.error('Failed to load accounting data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrg?._id]);

  const handleCreateAccount = async (data: any) => {
    if (!currentOrg?._id) return;
    await accountingService.createAccount(currentOrg._id, data);
    fetchData();
  };

  const handleCreateJournal = async (data: any) => {
    if (!currentOrg?._id) return;
    await accountingService.createJournal(currentOrg._id, data);
    fetchData();
    alert('Journal Voucher posted successfully');
  };

  const handleOpeningSave = async (entries: any[]) => {
    if (!currentOrg?._id) return;
    await accountingService.setOpeningBalances(currentOrg._id, entries);
    fetchData();
    alert('Opening balances recorded successfully');
  };

  const handleApprove = async (id: string) => {
    if (!currentOrg?._id) return;
    await accountingService.approveJournal(currentOrg._id, id);
    fetchData();
    alert('Voucher approved');
  };

  const handlePost = async (id: string) => {
    if (!currentOrg?._id) return;
    await accountingService.postJournal(currentOrg._id, id);
    fetchData();
    alert('Voucher posted to General Ledger');
  };

  const handleReverse = async (journal: JournalEntry) => {
    const reason = prompt(`Enter reversal reason for ${journal.entryNumber}:`);
    if (!reason || !currentOrg?._id) return;
    await accountingService.reverseJournal(currentOrg._id, journal._id, reason);
    fetchData();
    alert(`Reversal voucher generated successfully`);
  };

  const handleReject = async (journal: JournalEntry) => {
    const reason = prompt(`Enter rejection reason for ${journal.entryNumber}:`);
    if (!reason || !currentOrg?._id) return;
    await accountingService.rejectJournal(currentOrg._id, journal._id, reason);
    fetchData();
    alert('Voucher rejected');
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Financial Accounting & General Ledger</h1>
          <p style={styles.subtitle}>
            Double-entry bookkeeping, Chart of Accounts, Journal Vouchers, and Statutory Financial Statements.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={styles.btnSecondary} onClick={() => setShowOpeningModal(true)}>
            ⚖️ Opening Balances
          </button>
          <button style={styles.btnPrimary} onClick={() => setShowVoucherModal(true)}>
            + New Journal Voucher
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={styles.tabsNav}>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'coa' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('coa')}
        >
          🌲 Chart of Accounts
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'journals' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('journals')}
        >
          ✍️ General Journal (Vouchers)
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'ledger' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('ledger')}
        >
          📖 Account Ledgers
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'daybook' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('daybook')}
        >
          📅 Day Book
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'statements' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('statements')}
        >
          ⚖️ Financial Statements
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'tax' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('tax')}
        >
          🇳🇵 Nepal IRD Tax Summary
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: '16px' }}>
        {activeTab === 'coa' && (
          <ChartOfAccountsTree
            accounts={accounts}
            onCreateAccount={handleCreateAccount}
            onSelectAccount={(acc) => {
              setSelectedLedgerAccountId(acc._id);
              setActiveTab('ledger');
            }}
          />
        )}

        {activeTab === 'journals' && (
          <div style={styles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Voucher Register</h3>
              <button style={styles.btnPrimary} onClick={() => setShowVoucherModal(true)}>
                + Create Voucher
              </button>
            </div>

            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Voucher #</th>
                  <th style={styles.th}>Date (BS)</th>
                  <th style={styles.th}>Narration</th>
                  <th style={styles.th}>Source Document</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Total Amount (NPR)</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {journals.map((j) => (
                  <tr key={j._id} style={styles.tr}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                      {j.entryNumber}
                    </td>
                    <td style={styles.td}>
                      <strong>{j.bsDate}</strong>
                    </td>
                    <td style={styles.td}>{j.narration}</td>
                    <td style={styles.td}>
                      {j.sourceDocumentNumber ? (
                        <span style={styles.docPill}>{j.sourceDocumentNumber}</span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>Manual</span>
                      )}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>
                      NPR {formatDecimal(j.totalDebit)}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor:
                            j.status === 'posted'
                              ? '#ecfdf5'
                              : j.status === 'submitted'
                              ? '#eff6ff'
                              : j.status === 'reversed'
                              ? '#fef2f2'
                              : '#fffbeb',
                          color:
                            j.status === 'posted'
                              ? '#059669'
                              : j.status === 'submitted'
                              ? '#1e3a8a'
                              : j.status === 'reversed'
                              ? '#dc2626'
                              : '#d97706',
                        }}
                      >
                        {j.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {j.status === 'submitted' && (
                          <>
                            <button style={styles.actionBtn} onClick={() => handleApprove(j._id)}>
                              Approve
                            </button>
                            <button style={{ ...styles.actionBtn, color: '#dc2626' }} onClick={() => handleReject(j)}>
                              Reject
                            </button>
                          </>
                        )}
                        {j.status === 'approved' && (
                          <button style={styles.actionBtn} onClick={() => handlePost(j._id)}>
                            Post
                          </button>
                        )}
                        {j.status === 'posted' && (
                          <button style={{ ...styles.actionBtn, color: '#dc2626' }} onClick={() => handleReverse(j)}>
                            Reverse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {journals.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No journal vouchers posted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'ledger' && (
          <AccountLedgerView accounts={accounts} initialAccountId={selectedLedgerAccountId} />
        )}

        {activeTab === 'daybook' && <DayBookView />}

        {activeTab === 'statements' && <FinancialStatementsView />}

        {activeTab === 'tax' && <TaxSummaryView />}
      </div>

      {/* Modals */}
      {showVoucherModal && (
        <JournalVoucherModal
          accounts={accounts}
          firms={firms}
          fiscalYears={fiscalYears}
          onClose={() => setShowVoucherModal(false)}
          onSubmit={handleCreateJournal}
        />
      )}

      {showOpeningModal && (
        <OpeningBalanceModal
          accounts={accounts}
          onClose={() => setShowOpeningModal(false)}
          onSave={handleOpeningSave}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  btnPrimary: { backgroundColor: '#1e3a8a', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' },
  btnSecondary: { backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', border: '1px solid #cbd5e1', cursor: 'pointer' },
  tabsNav: { display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' },
  navBtn: { padding: '8px 14px', borderRadius: '6px', border: 'none', background: 'none', fontSize: '13px', fontWeight: 700, color: '#64748b', cursor: 'pointer' },
  activeNavBtn: { backgroundColor: '#1e3a8a', color: '#ffffff' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: '13px' },
  docPill: { backgroundColor: '#eff6ff', color: '#1e3a8a', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' },
  statusBadge: { fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '4px' },
  actionBtn: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' },
};
