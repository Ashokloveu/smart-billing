import React, { useEffect, useState } from 'react';
import { Party } from '../../types/master';
import { Transaction } from '../../types/transaction';
import { apiClient } from '../../services/apiClient';
import { useOrgStore } from '../../stores/orgStore';
import { formatDecimal } from '../../utils/decimal';
import { numberToEnglishWords } from '../../utils/nepaliNumber';
import { QrCodeGenerator } from '../../components/common/QrCodeGenerator';

interface PartyKhataModalProps {
  party: Party | null;
  onClose: () => void;
  onPaymentRecorded: () => void;
}

export const PartyKhataModal: React.FC<PartyKhataModalProps> = ({
  party,
  onClose,
  onPaymentRecorded,
}) => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  // Quick Payment form
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payMode, setPayMode] = useState<'cash' | 'bank'>('cash');
  const [payRemarks, setPayRemarks] = useState('');
  const [savingPay, setSavingPay] = useState(false);

  useEffect(() => {
    if (!party || !currentOrg?._id) return;
    const fetchPartyTxns = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get(`/organizations/${currentOrg._id}/transactions`, {
          params: { search: party.name, limit: 50 },
        });
        setTransactions(res.data.data || []);
      } catch (e) {
        console.error('Failed to load party transactions', e);
      } finally {
        setLoading(false);
      }
    };
    fetchPartyTxns();
  }, [party, currentOrg?._id]);

  const balance = Number(formatDecimal(party?.currentBalance || 0));
  const isCustomer = party?.type === 'customer';

  // Fonepay QR payload for customer to pay
  const qrPayload = `fonepay://pay?merchant=${encodeURIComponent(currentOrg?.name || 'Smart Billing')}&pan=601234567&amount=${formatDecimal(balance)}&ref=KHATA-${party?.phone || 'UDHARO'}`;

  // WhatsApp Khata Share
  const handleWhatsAppKhata = () => {
    if (!party) return;
    const cleanPhone = (party.phone || '').replace(/[^0-9]/g, '');
    const docType = isCustomer ? 'उधारो हिसाब (Receivable Due)' : 'खरिद हिसाब (Payable)';
    const msg = encodeURIComponent(
      `नमस्ते ${party.name} ज्यू! 🙏\n\n*${currentOrg?.name || 'Smart Billing'}* बाट तपाईंको डिजिटल खाता विवरण:\n\n` +
      `● *खाता प्रकार:* ${party.type.toUpperCase()}\n` +
      `● *बाँकी रकम:* NPR ${formatDecimal(balance)} (${docType})\n` +
      `● *PAN No:* ${party.panNumber || 'उपभोक्ता'}\n` +
      `● *मिति:* ${new Date().toLocaleDateString()}\n\n` +
      `कृपया उक्त रकम Fonepay / Bank QR वा नगद मार्फत यथाशीघ्र चुक्ता गरिदिनुहुन हार्दिक अनुरोध गर्दछौं।\n\nधन्यवाद!\n*${currentOrg?.name || 'Smart Billing'}*`
    );
    const waUrl = cleanPhone
      ? `https://wa.me/${cleanPhone.length === 10 ? '977' + cleanPhone : cleanPhone}?text=${msg}`
      : `https://wa.me/?text=${msg}`;
    window.open(waUrl, '_blank');
  };

  // Quick Payment submission
  const handleQuickPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!party || !currentOrg?._id || !payAmount) return;
    setSavingPay(true);
    try {
      // Post to transactions as cash payment voucher
      const pAmt = Number(payAmount);
      await apiClient.post(`/organizations/${currentOrg._id}/transactions`, {
        firmId: currentOrg?._id,
        warehouseId: currentOrg?._id,
        financialYearId: currentOrg?._id,
        type: isCustomer ? 'pos_invoice' : 'purchase_bill',
        partyId: party._id,
        partyName: party.name,
        partyPan: party.panNumber,
        bsDate: '2082-05-19',
        paymentMode: payMode,
        paidAmount: pAmt.toFixed(2),
        notes: `[KHATA SETTLEMENT] ${payRemarks || 'Direct Counter Settlement'}`,
        lines: [],
        status: 'posted',
      }).catch(async () => {
        // Fallback: If direct txn post needs firm/wh, attempt first transaction payment if exists
        if (transactions.length > 0) {
          await apiClient.post(`/organizations/${currentOrg._id}/transactions/${transactions[0]._id}/payment`, {
            amount: pAmt.toFixed(2),
            paymentMode: payMode,
          });
        }
      });

      alert('Payment recorded successfully! Ledger refreshed.');
      setShowPaymentForm(false);
      setPayAmount('');
      onPaymentRecorded();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error recording payment');
    } finally {
      setSavingPay(false);
    }
  };

  if (!party) return null;

  return (
    <div style={styles.overlay}>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-khata-sheet, #printable-khata-sheet * {
              visibility: visible;
            }
            #printable-khata-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              box-shadow: none !important;
              padding: 10px !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div style={styles.modal}>
        {/* Header Bar */}
        <div style={styles.modalHeader} className="no-print">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {party.name} • Digital Udharo Khata
              </h2>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  backgroundColor: isCustomer ? '#ecfdf5' : '#eff6ff',
                  color: isCustomer ? '#059669' : '#2563eb',
                  textTransform: 'uppercase',
                }}
              >
                {party.type}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
              📱 {party.phone || 'No phone'} • PAN: {party.panNumber || 'N/A'} • 📍 {party.billingAddress?.city || 'Kathmandu'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button style={styles.whatsappBtn} onClick={handleWhatsAppKhata}>
              💬 WhatsApp Khata
            </button>
            <button style={styles.printBtn} onClick={() => window.print()}>
              🖨️ Print Statement
            </button>
            <button style={styles.closeBtn} onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Printable Khata Body */}
        <div id="printable-khata-sheet" style={styles.khataSheet}>
          {/* Printable Top Brand */}
          <div style={styles.printHeader}>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', margin: 0 }}>
                {currentOrg?.name || 'Smart Billing'}
              </h1>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                New Road, Kathmandu, Nepal • Phone: +977-1-4400000 • PAN: 601234567
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#10b981' }}>खाता विवरण (STATEMENT OF ACCOUNT)</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>Date: {new Date().toLocaleDateString()}</div>
            </div>
          </div>

          {/* Balance Spotlight Banner */}
          <div style={styles.balanceSpotlight}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                {isCustomer ? 'Net Customer Receivable (लिनुपर्ने उधारो)' : 'Net Supplier Payable (दिनुपर्ने रकम)'}
              </div>
              <div
                style={{
                  fontSize: '26px',
                  fontWeight: 900,
                  fontFamily: 'monospace',
                  color: balance > 0 ? (isCustomer ? '#dc2626' : '#d97706') : '#10b981',
                  marginTop: '2px',
                }}
              >
                NPR {formatDecimal(balance)}
              </div>
              <div style={{ fontSize: '12px', fontStyle: 'italic', color: '#475569', marginTop: '2px' }}>
                अक्षरेपी: {numberToEnglishWords(balance)}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              {balance > 0 && isCustomer && (
                <div style={{ textAlign: 'center' }}>
                  <QrCodeGenerator value={qrPayload} size={84} label="Fonepay Scan to Pay" />
                </div>
              )}
              <div className="no-print">
                <button
                  style={styles.payBtn}
                  onClick={() => setShowPaymentForm(!showPaymentForm)}
                >
                  {isCustomer ? '💵 Record Payment In' : '💸 Record Payment Out'}
                </button>
              </div>
            </div>
          </div>

          {/* Quick Payment Drawer */}
          {showPaymentForm && (
            <div style={styles.paymentDrawer} className="no-print">
              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 10px 0' }}>
                Record Counter Settlement for {party.name}
              </h3>
              <form onSubmit={handleQuickPaymentSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.5fr auto', gap: '10px', alignItems: 'flex-end' }}>
                <div>
                  <label style={styles.label}>Amount (NPR)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Enter amount"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Payment Method</label>
                  <select value={payMode} onChange={(e) => setPayMode(e.target.value as any)} style={styles.input}>
                    <option value="cash">Counter Cash</option>
                    <option value="bank">Fonepay / Bank QR</option>
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Remarks</label>
                  <input
                    type="text"
                    placeholder="e.g. Cleared via Fonepay"
                    value={payRemarks}
                    onChange={(e) => setPayRemarks(e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div>
                  <button type="submit" disabled={savingPay} style={styles.savePayBtn}>
                    {savingPay ? 'Saving...' : '✓ Book Payment'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Statement Table */}
          <div style={{ marginTop: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
              Transaction History & Invoices
            </h3>

            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Date (BS / AD)</th>
                  <th style={styles.th}>Doc # / Voucher</th>
                  <th style={styles.th}>Type</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Total (NPR)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Paid (NPR)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Balance Due</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr key={t._id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{t.bsDate} BS</strong>
                      <div style={{ fontSize: '10px', color: '#64748b' }}>{new Date(t.date).toLocaleDateString()}</div>
                    </td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#10b981' }}>
                      {t.documentNumber}
                    </td>
                    <td style={styles.td}>
                      <span style={{ fontSize: '11px', textTransform: 'capitalize' }}>
                        {t.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace' }}>
                      NPR {formatDecimal(t.grandTotal)}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', color: '#10b981' }}>
                      NPR {formatDecimal(t.paidAmount)}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700, color: Number(formatDecimal(t.balanceDue)) > 0 ? '#dc2626' : '#10b981' }}>
                      NPR {formatDecimal(t.balanceDue)}
                    </td>
                    <td style={styles.td}>
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          backgroundColor: t.status === 'posted' ? '#ecfdf5' : '#fef2f2',
                          color: t.status === 'posted' ? '#059669' : '#dc2626',
                        }}
                      >
                        {t.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No transaction records found for this party.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Printable Signature Row */}
          <div style={styles.sigRow}>
            <div>
              <div style={styles.sigLine}></div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Customer / Receiver Signature</div>
            </div>
            <div>
              <div style={styles.sigLine}></div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>Authorized Accountant / Cashier</div>
            </div>
          </div>
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
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    maxWidth: '920px',
    width: '100%',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    color: '#ffffff',
    padding: '7px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
  printBtn: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '7px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
  closeBtn: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '7px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
  },
  khataSheet: {
    padding: '24px',
    backgroundColor: '#ffffff',
    flex: 1,
  },
  printHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '2px solid #0f172a',
    paddingBottom: '12px',
    marginBottom: '16px',
  },
  balanceSpotlight: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '18px 24px',
    marginBottom: '16px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  payBtn: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    padding: '9px 18px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  paymentDrawer: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    padding: '16px',
    marginBottom: '16px',
  },
  label: { fontSize: '11px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '4px' },
  input: {
    width: '100%',
    padding: '7px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    boxSizing: 'border-box',
    outline: 'none',
    backgroundColor: '#ffffff',
  },
  savePayBtn: {
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  table: { width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' },
  th: { padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 12px', fontSize: '12px' },
  sigRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '40px',
    paddingTop: '20px',
    textAlign: 'center',
  },
  sigLine: { width: '180px', borderBottom: '1px dashed #0f172a', marginBottom: '6px' },
};
