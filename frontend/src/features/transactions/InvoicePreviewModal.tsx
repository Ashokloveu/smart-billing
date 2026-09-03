import React, { useState } from 'react';
import { Transaction } from '../../types/transaction';
import { formatDecimal } from '../../utils/decimal';
import { numberToEnglishWords, formatBsDateNepali } from '../../utils/nepaliNumber';
import { QrCodeGenerator } from '../../components/common/QrCodeGenerator';

interface InvoicePreviewModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

type TemplateType = 'a4_modern' | 'thermal_80mm';

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ transaction, onClose }) => {
  const [template, setTemplate] = useState<TemplateType>('a4_modern');
  if (!transaction) return null;

  const firmName = typeof transaction.firmId === 'object' ? transaction.firmId.name : 'Smart Billing Store';
  const firmCode = typeof transaction.firmId === 'object' ? transaction.firmId.code : 'Main Branch';
  const partyName = transaction.partyName || (typeof transaction.partyId === 'object' ? transaction.partyId.name : 'Cash Customer');
  const partyPan = transaction.partyPan || (typeof transaction.partyId === 'object' ? transaction.partyId.panNumber : '');
  const partyPhone = typeof transaction.partyId === 'object' ? transaction.partyId.phone : '';

  // Dynamic Fonepay/eSewa QR Payload: Includes Merchant, Invoice number, and amount
  const qrPaymentPayload = `fonepay://pay?merchant=${encodeURIComponent(firmName)}&pan=601234567&amount=${formatDecimal(transaction.grandTotal)}&ref=${transaction.documentNumber}`;

  // WhatsApp Share Link Generator
  const handleWhatsAppShare = () => {
    const message = `Namaste ${partyName}! 🙏%0AHere is your invoice *#${transaction.documentNumber}* from *${firmName}*.%0A%0A*Total Amount:* NPR ${formatDecimal(transaction.grandTotal)}%0A*Date:* ${transaction.bsDate} BS%0A*Payment Mode:* ${(transaction.paymentMode || 'CASH').toUpperCase()}%0A%0AThank you for doing business with us!`;
    const cleanPhone = partyPhone ? partyPhone.replace(/[^0-9]/g, '') : '';
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  };

  // Email Share Link Generator
  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Tax Invoice #${transaction.documentNumber} from ${firmName}`);
    const body = encodeURIComponent(`Dear ${partyName},\n\nPlease find the details for your tax invoice #${transaction.documentNumber}.\n\nTotal Amount: NPR ${formatDecimal(transaction.grandTotal)}\nDate: ${transaction.bsDate} BS\n\nThank you for choosing ${firmName}.\n\nSmart Billing ERP`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  // SMS Share Link Generator
  const handleSmsShare = () => {
    const message = encodeURIComponent(`Namaste ${partyName}, your bill #${transaction.documentNumber} from ${firmName} for NPR ${formatDecimal(transaction.grandTotal)} is generated. Thank you!`);
    const cleanPhone = partyPhone ? partyPhone.replace(/[^0-9]/g, '') : '';
    window.open(`sms:${cleanPhone}?body=${message}`, '_blank');
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Actions bar */}
        <div style={styles.actionsBar}>
          <div style={styles.templateSwitcher}>
            <button
              style={{
                ...styles.tabBtn,
                ...(template === 'a4_modern' ? styles.tabBtnActive : {}),
              }}
              onClick={() => setTemplate('a4_modern')}
            >
              📄 Modern A4 Invoice
            </button>
            <button
              style={{
                ...styles.tabBtn,
                ...(template === 'thermal_80mm' ? styles.tabBtnActive : {}),
              }}
              onClick={() => setTemplate('thermal_80mm')}
            >
              🧾 80mm Thermal POS
            </button>
          </div>

          <div style={styles.rightActions}>
            <button style={styles.whatsappBtn} onClick={handleWhatsAppShare} title="Share on WhatsApp">
              💬 WhatsApp
            </button>
            <button style={styles.emailBtn} onClick={handleEmailShare} title="Share via Email">
              ✉️ Email
            </button>
            <button style={styles.smsBtn} onClick={handleSmsShare} title="Share via SMS">
              📱 SMS
            </button>
            <button style={styles.printBtn} onClick={() => window.print()}>
              🖨️ Print
            </button>
            <button style={styles.closeBtn} onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* ===================== A4 MODERN TEMPLATE ===================== */}
        {template === 'a4_modern' ? (
          <div style={styles.invoiceSheet}>
            <div style={styles.header}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={styles.logoBox}>
                  <span>🏢</span>
                </div>
                <div>
                  <h1 style={styles.companyName}>{firmName}</h1>
                  <div style={styles.subText}>Branch: {firmCode} • Head Office Kathmandu</div>
                  <div style={styles.subText}>VAT / PAN: 601234567 • Phone: +977-1-4400000</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={styles.docTitle}>
                  {transaction.type === 'pos_invoice'
                    ? 'संक्षिप्त कर बिजक (ABBREVIATED TAX INVOICE)'
                    : transaction.type === 'sale_invoice'
                    ? 'कर बिजक (TAX INVOICE)'
                    : 'खरिद बिल (PURCHASE BILL)'}
                </div>
                <div style={styles.docNumber}>बिजक नं (Invoice #): {transaction.documentNumber}</div>
                <div style={styles.subText}>मिति (Date): {transaction.bsDate} BS ({formatBsDateNepali(transaction.bsDate)})</div>
                <div style={styles.subText}>AD Date: {new Date(transaction.date).toLocaleDateString()}</div>
                <span
                  style={{
                    ...styles.statusBadge,
                    backgroundColor:
                      transaction.status === 'posted' ? '#ecfdf5' : transaction.status === 'cancelled' ? '#fef2f2' : '#fffbeb',
                    color:
                      transaction.status === 'posted' ? '#059669' : transaction.status === 'cancelled' ? '#dc2626' : '#d97706',
                  }}
                >
                  {transaction.status.toUpperCase()}
                </span>
              </div>
            </div>

            <div style={styles.partiesGrid}>
              <div style={styles.partyBox}>
                <div style={styles.boxTitle}>खरिदकर्ताको विवरण (Billed To):</div>
                <div style={styles.partyName}>{partyName}</div>
                <div style={styles.subText}>
                  <strong>स्थायी लेखा नं (Buyer PAN):</strong> {partyPan || 'उपभोक्ता (Consumer)'}
                </div>
                {partyPhone && <div style={styles.subText}>सम्पर्क (Phone): {partyPhone}</div>}
              </div>
              <div style={styles.partyBox}>
                <div style={styles.boxTitle}>भुक्तानी तथा चलानी (Payment & Terms):</div>
                <div style={styles.subText}>
                  <strong>भुक्तानीको किसिम (Mode):</strong> {(transaction.paymentMode || 'cash').toUpperCase()}
                </div>
                <div style={styles.subText}>मुद्रा (Currency): NPR (रु.) • आ.व. (FY): 2081/82</div>
                <div style={styles.subText}>निकासी स्थान: काठमाडौँ, नेपाल</div>
              </div>
            </div>

            {/* Line Items Table */}
            <table style={styles.table}>
              <thead>
                <tr style={styles.theadRow}>
                  <th style={styles.th}>#</th>
                  <th style={styles.th}>Item Description</th>
                  <th style={styles.thCenter}>Code</th>
                  <th style={styles.thRight}>Qty</th>
                  <th style={styles.thRight}>Rate (NPR)</th>
                  <th style={styles.thRight}>Discount</th>
                  <th style={styles.thRight}>VAT (13%)</th>
                  <th style={styles.thRight}>Amount (NPR)</th>
                </tr>
              </thead>
              <tbody>
                {transaction.lines.map((line, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.td}>{idx + 1}</td>
                    <td style={styles.td}>
                      <div style={{ fontWeight: 600 }}>{line.itemName}</div>
                    </td>
                    <td style={styles.tdCenter}>{line.itemCode || '-'}</td>
                    <td style={styles.tdRight}>
                      {formatDecimal(line.quantity)}
                    </td>
                    <td style={styles.tdRight}>{formatDecimal(line.rate)}</td>
                    <td style={styles.tdRight}>{formatDecimal(line.discountAmount)}</td>
                    <td style={styles.tdRight}>{formatDecimal(line.taxAmount)}</td>
                    <td style={styles.tdRightBold}>{formatDecimal(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Summary & QR Section */}
            <div style={styles.summarySection}>
              <div style={styles.qrBlock}>
                <QrCodeGenerator value={qrPaymentPayload} size={110} label="Fonepay / eSewa Scan to Pay" />
                <div style={styles.qrDisclaimer}>Scan with any mobile banking or wallet to pay instantly.</div>
              </div>

              <div style={styles.totalsTable}>
                <div style={styles.totalRow}>
                  <span>Subtotal:</span>
                  <span>NPR {formatDecimal(transaction.subtotal)}</span>
                </div>
                <div style={styles.totalRow}>
                  <span>Item Discounts:</span>
                  <span>- NPR {formatDecimal(transaction.totalDiscount)}</span>
                </div>
                <div style={styles.totalRow}>
                  <span>Taxable Amount:</span>
                  <span>NPR {formatDecimal(transaction.totalTaxableAmount)}</span>
                </div>
                <div style={styles.totalRow}>
                  <span>Nepal VAT (13%):</span>
                  <span>NPR {formatDecimal(transaction.totalTax)}</span>
                </div>
                <div style={styles.grandTotalRow}>
                  <span>Grand Total:</span>
                  <span>NPR {formatDecimal(transaction.grandTotal)}</span>
                </div>
                <div style={{ ...styles.totalRow, marginTop: '8px', color: '#16a34a' }}>
                  <span>Amount Paid:</span>
                  <span>NPR {formatDecimal(transaction.paidAmount)}</span>
                </div>
                <div style={{ ...styles.totalRow, color: '#dc2626', fontWeight: 600 }}>
                  <span>Due Balance:</span>
                  <span>NPR {formatDecimal(transaction.balanceDue)}</span>
                </div>
              </div>
            </div>

            {/* Amount in Words Banner (IRD Requirement) */}
            <div style={styles.wordsBanner}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>अक्षरेपी (In Words): </span>
              <span style={{ fontStyle: 'italic', color: '#1e3a8a', fontWeight: 600 }}>
                {numberToEnglishWords(transaction.grandTotal)}
              </span>
            </div>

            {/* Terms & Footer */}
            <div style={styles.footerSection}>
              <div style={styles.termsBox}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Terms & Conditions:</div>
                <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#64748b' }}>
                  <li>Goods once sold will not be returned without valid tax receipt.</li>
                  <li>Interest @ 18% p.a. will be charged on overdue payments beyond 30 days.</li>
                  <li>Subject to Kathmandu jurisdiction. Nepal IRD Certified Billing.</li>
                </ol>
              </div>

              <div style={styles.signatureBox}>
                <div style={styles.signatureLine}></div>
                <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Authorized Signatory</div>
              </div>
            </div>
          </div>
        ) : (
          /* ===================== 80MM THERMAL RECEIPT ===================== */
          <div style={styles.thermalSheet}>
            <div style={styles.thermalHeader}>
              <div style={styles.thermalTitle}>{firmName}</div>
              <div style={styles.thermalSub}>{firmCode}</div>
              <div style={styles.thermalSub}>PAN: 601234567 • Ph: +977-1-4400000</div>
              <div style={styles.thermalDivider}>----------------------------------------</div>
              <div style={{ fontWeight: 700, fontSize: '13px' }}>TAX INVOICE (CASH/POS)</div>
              <div style={styles.thermalSub}>Bill No: #{transaction.documentNumber}</div>
              <div style={styles.thermalSub}>Date: {transaction.bsDate} BS ({new Date(transaction.date).toLocaleDateString()})</div>
              <div style={styles.thermalSub}>Customer: {partyName}</div>
              <div style={styles.thermalDivider}>----------------------------------------</div>
            </div>

            <table style={styles.thermalTable}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>Item</th>
                  <th style={{ textAlign: 'right' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Rate</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {transaction.lines.map((line, idx) => (
                  <tr key={idx}>
                    <td style={{ textAlign: 'left', padding: '2px 0' }}>{line.itemName}</td>
                    <td style={{ textAlign: 'right' }}>{formatDecimal(line.quantity)}</td>
                    <td style={{ textAlign: 'right' }}>{formatDecimal(line.rate)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatDecimal(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.thermalDivider}>----------------------------------------</div>

            <div style={styles.thermalSummary}>
              <div style={styles.thermalRow}>
                <span>Subtotal:</span>
                <span>{formatDecimal(transaction.subtotal)}</span>
              </div>
              <div style={styles.thermalRow}>
                <span>Discount:</span>
                <span>-{formatDecimal(transaction.totalDiscount)}</span>
              </div>
              <div style={styles.thermalRow}>
                <span>VAT (13%):</span>
                <span>{formatDecimal(transaction.totalTax)}</span>
              </div>
              <div style={{ ...styles.thermalRow, fontWeight: 700, fontSize: '14px', marginTop: '4px' }}>
                <span>GRAND TOTAL:</span>
                <span>NPR {formatDecimal(transaction.grandTotal)}</span>
              </div>
              <div style={styles.thermalRow}>
                <span>Paid:</span>
                <span>NPR {formatDecimal(transaction.paidAmount)}</span>
              </div>
              <div style={styles.thermalRow}>
                <span>Change/Due:</span>
                <span>NPR {formatDecimal(transaction.balanceDue)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
              <QrCodeGenerator value={qrPaymentPayload} size={100} label="Scan to Pay via Fonepay" />
            </div>

            <div style={styles.thermalFooter}>
              <div>*** Thank You! Visit Again ***</div>
              <div>Bikram Sambat 2081/82 • IRD Compliant</div>
            </div>
          </div>
        )}
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
    zIndex: 100,
    padding: '16px',
    overflowY: 'auto',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '850px',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  actionsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  templateSwitcher: {
    display: 'flex',
    gap: '6px',
    backgroundColor: '#e2e8f0',
    padding: '3px',
    borderRadius: '8px',
  },
  tabBtn: {
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  rightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  whatsappBtn: {
    padding: '8px 14px',
    backgroundColor: '#25D366',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  emailBtn: {
    padding: '8px 14px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  smsBtn: {
    padding: '8px 14px',
    backgroundColor: '#475569',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  printBtn: {
    padding: '8px 14px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  closeBtn: {
    padding: '8px 14px',
    backgroundColor: '#e2e8f0',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  logoBox: {
    width: '48px',
    height: '48px',
    borderRadius: '10px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  invoiceSheet: {
    padding: '36px',
    backgroundColor: '#ffffff',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    borderBottom: '2px solid #0f172a',
    paddingBottom: '20px',
    marginBottom: '20px',
  },
  companyName: {
    fontSize: '22px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  subText: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
  },
  docTitle: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#2563eb',
    letterSpacing: '0.05em',
  },
  docNumber: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
    marginTop: '4px',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 700,
    marginTop: '6px',
  },
  partiesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '24px',
  },
  partyBox: {
    backgroundColor: '#f8fafc',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  boxTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  partyName: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#0f172a',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '24px',
  },
  theadRow: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
  },
  th: {
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'left',
  },
  thCenter: {
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'center',
  },
  thRight: {
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 600,
    textAlign: 'right',
  },
  tr: {
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#334155',
  },
  tdCenter: {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#334155',
    textAlign: 'center',
  },
  tdRight: {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#334155',
    textAlign: 'right',
  },
  tdRightBold: {
    padding: '10px 12px',
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    textAlign: 'right',
  },
  summarySection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    padding: '16px 0',
    borderTop: '1px solid #e2e8f0',
  },
  qrBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  qrDisclaimer: {
    fontSize: '10px',
    color: '#64748b',
    textAlign: 'center',
    maxWidth: '140px',
  },
  totalsTable: {
    width: '320px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#475569',
  },
  grandTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: 800,
    color: '#0f172a',
    borderTop: '2px solid #0f172a',
    borderBottom: '2px solid #0f172a',
    padding: '8px 0',
    marginTop: '4px',
  },
  wordsBanner: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  footerSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTop: '1px solid #e2e8f0',
    paddingTop: '24px',
  },
  termsBox: {
    maxWidth: '450px',
  },
  signatureBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  signatureLine: {
    width: '180px',
    borderBottom: '1px dashed #94a3b8',
  },
  // Thermal 80mm styles
  thermalSheet: {
    width: '320px',
    margin: '20px auto',
    padding: '16px',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    fontFamily: 'monospace',
    fontSize: '12px',
  },
  thermalHeader: {
    textAlign: 'center',
    marginBottom: '8px',
  },
  thermalTitle: {
    fontSize: '15px',
    fontWeight: 700,
    textTransform: 'uppercase',
  },
  thermalSub: {
    fontSize: '11px',
  },
  thermalDivider: {
    letterSpacing: '-1px',
    margin: '4px 0',
  },
  thermalTable: {
    width: '100%',
    fontSize: '11px',
  },
  thermalSummary: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    fontSize: '12px',
  },
  thermalRow: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  thermalFooter: {
    textAlign: 'center',
    fontSize: '10px',
    marginTop: '12px',
    color: '#475569',
  },
};
