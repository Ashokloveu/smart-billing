import React, { useState } from 'react';
import { Transaction } from '../../types/transaction';
import { formatDecimal } from '../../utils/decimal';
import { numberToEnglishWords, formatBsDateNepali } from '../../utils/nepaliNumber';
import { QrCodeGenerator } from '../../components/common/QrCodeGenerator';

interface InvoicePreviewModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

type TemplateType = 'a4_ird' | 'a4_modern' | 'thermal_80mm';

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ transaction, onClose }) => {
  const [template, setTemplate] = useState<TemplateType>('a4_ird');
  if (!transaction) return null;

  const firmName = typeof transaction.firmId === 'object' ? transaction.firmId.name : 'Smart Billing Store';
  const firmCode = typeof transaction.firmId === 'object' ? transaction.firmId.code : 'Main Branch';
  const firmAddress = typeof transaction.firmId === 'object' && (transaction.firmId as any).address
    ? `${(transaction.firmId as any).address.line1 || ''}, ${(transaction.firmId as any).address.city || 'Kathmandu'}`
    : 'New Road, Kathmandu, Nepal';

  const partyName = transaction.partyName || (typeof transaction.partyId === 'object' ? transaction.partyId.name : 'Walk-in Cash Customer');
  const partyPan = transaction.partyPan || (typeof transaction.partyId === 'object' ? transaction.partyId.panNumber : '');
  const partyPhone = typeof transaction.partyId === 'object' ? transaction.partyId.phone : '';

  // Fonepay Dynamic QR Code Payload
  const qrPaymentPayload = `fonepay://pay?merchant=${encodeURIComponent(firmName)}&pan=601234567&amount=${formatDecimal(transaction.grandTotal)}&ref=${transaction.documentNumber}`;

  // 1-Click WhatsApp Share
  const handleWhatsAppShare = () => {
    const isSales = transaction.type.includes('sale') || transaction.type.includes('pos');
    const docLabel = isSales ? 'Tax Invoice' : 'Purchase Bill';
    const message = `Namaste ${partyName}! 🙏%0AHere is your official *${docLabel} #${transaction.documentNumber}* from *${firmName}*.%0A%0A*Date:* ${transaction.bsDate} BS (${new Date(transaction.date).toLocaleDateString()})%0A*Total Amount:* NPR ${formatDecimal(transaction.grandTotal)}%0A*Paid Amount:* NPR ${formatDecimal(transaction.paidAmount)}%0A*Balance Due:* NPR ${formatDecimal(transaction.balanceDue)}%0A%0AThank you for doing business with us!%0A_Smart Billing ERP_`;
    const cleanPhone = partyPhone ? partyPhone.replace(/[^0-9]/g, '') : '';
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${message}` : `https://wa.me/?text=${message}`;
    window.open(waUrl, '_blank');
  };

  // Email Share Link
  const handleEmailShare = () => {
    const subject = encodeURIComponent(`Tax Invoice #${transaction.documentNumber} from ${firmName}`);
    const body = encodeURIComponent(`Dear ${partyName},\n\nPlease find the details of your tax invoice #${transaction.documentNumber}.\n\nTotal Amount: NPR ${formatDecimal(transaction.grandTotal)}\nDate: ${transaction.bsDate} BS\n\nThank you for choosing ${firmName}.\n\nSmart Billing ERP`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div style={styles.overlay}>
      {/* Print CSS stylesheet injected dynamically */}
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-invoice-sheet, #printable-invoice-sheet * {
              visibility: visible;
            }
            #printable-invoice-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: 100% !important;
              box-shadow: none !important;
              padding: 0 !important;
              margin: 0 !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div style={styles.modal}>
        {/* Actions bar (hidden in print) */}
        <div style={styles.actionsBar} className="no-print">
          <div style={styles.templateSwitcher}>
            <button
              style={{
                ...styles.tabBtn,
                ...(template === 'a4_ird' ? styles.tabBtnActive : {}),
              }}
              onClick={() => setTemplate('a4_ird')}
            >
              🇳🇵 IRD Tax Invoice (अनुसूची-५)
            </button>
            <button
              style={{
                ...styles.tabBtn,
                ...(template === 'a4_modern' ? styles.tabBtnActive : {}),
              }}
              onClick={() => setTemplate('a4_modern')}
            >
              📄 Modern Studio A4
            </button>
            <button
              style={{
                ...styles.tabBtn,
                ...(template === 'thermal_80mm' ? styles.tabBtnActive : {}),
              }}
              onClick={() => setTemplate('thermal_80mm')}
            >
              🧾 80mm POS Thermal
            </button>
          </div>

          <div style={styles.rightActions}>
            <button style={styles.whatsappBtn} onClick={handleWhatsAppShare} title="Share directly on WhatsApp">
              💬 WhatsApp
            </button>
            <button style={styles.emailBtn} onClick={handleEmailShare} title="Share via Email">
              ✉️ Email
            </button>
            <button style={styles.printBtn} onClick={() => window.print()} title="Print or Save as PDF">
              🖨️ Print / PDF
            </button>
            <button style={styles.closeBtn} onClick={onClose} title="Close Preview">
              ✕ Close
            </button>
          </div>
        </div>

        {/* ===================== TEMPLATE 1: NEPAL IRD TAX INVOICE (SCHEDULE 5) ===================== */}
        {template === 'a4_ird' && (
          <div id="printable-invoice-sheet" style={styles.irdSheet}>
            {/* Header / IRD Standard Title */}
            <div style={styles.irdHeader}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', letterSpacing: '0.5px' }}>
                  नेपाल सरकार • आन्तरिक राजस्व विभाग
                </div>
                <h1 style={styles.irdCompanyTitle}>{firmName}</h1>
                <div style={styles.irdSubInfo}>{firmAddress} • फोन: +977-1-4400000</div>
                <div style={styles.irdPanContainer}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginRight: '6px' }}>
                    स्थायी लेखा नम्बर (PAN/VAT No.):
                  </span>
                  <span style={styles.panBadge}>6</span>
                  <span style={styles.panBadge}>0</span>
                  <span style={styles.panBadge}>1</span>
                  <span style={styles.panBadge}>2</span>
                  <span style={styles.panBadge}>3</span>
                  <span style={styles.panBadge}>4</span>
                  <span style={styles.panBadge}>5</span>
                  <span style={styles.panBadge}>6</span>
                  <span style={styles.panBadge}>7</span>
                </div>
              </div>

              <div style={styles.irdDocBanner}>
                <h2 style={{ fontSize: '16px', fontWeight: 900, margin: 0, letterSpacing: '1px' }}>
                  {transaction.type === 'sales_return'
                    ? 'क्रेडिट नोट (CREDIT NOTE)'
                    : transaction.type === 'purchase_return'
                    ? 'डेबिट नोट (DEBIT NOTE)'
                    : transaction.type === 'pos_invoice'
                    ? 'संक्षिप्त कर बिजक (ABBREVIATED TAX INVOICE)'
                    : 'कर बिजक (TAX INVOICE)'}
                </h2>
              </div>
            </div>

            {/* Bill Info & Buyer Grid */}
            <div style={styles.irdMetaGrid}>
              <div style={styles.irdMetaCol}>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>बिजक नं (Invoice #):</span>
                  <strong style={styles.metaVal}>{transaction.documentNumber}</strong>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>जारी मिति (BS Date):</span>
                  <strong style={styles.metaVal}>{transaction.bsDate} BS ({formatBsDateNepali(transaction.bsDate)})</strong>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>अंग्रेजी मिति (AD Date):</span>
                  <span style={styles.metaVal}>{new Date(transaction.date).toLocaleDateString()}</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>शाखा (Branch / Code):</span>
                  <span style={styles.metaVal}>{firmCode}</span>
                </div>
              </div>

              <div style={styles.irdMetaCol}>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>खरिदकर्ता (Buyer):</span>
                  <strong style={{ ...styles.metaVal, fontSize: '13px' }}>{partyName}</strong>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>खरिदकर्ताको प्यान (PAN):</span>
                  <strong style={styles.metaVal}>{partyPan || 'उपभोक्ता (Consumer / Cash)'}</strong>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>सम्पर्क नं (Contact):</span>
                  <span style={styles.metaVal}>{partyPhone || '-'}</span>
                </div>
                <div style={styles.metaRow}>
                  <span style={styles.metaLabel}>भुक्तानी किसिम (Mode):</span>
                  <span style={styles.metaVal}>{(transaction.paymentMode || 'cash').toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Table */}
            <table style={styles.irdTable}>
              <thead>
                <tr>
                  <th style={{ ...styles.irdTh, width: '36px', textAlign: 'center' }}>क्र.सं.</th>
                  <th style={{ ...styles.irdTh, textAlign: 'left' }}>विवरण (Item Description)</th>
                  <th style={{ ...styles.irdTh, width: '60px', textAlign: 'center' }}>एकाई</th>
                  <th style={{ ...styles.irdTh, width: '70px', textAlign: 'right' }}>परिमाण</th>
                  <th style={{ ...styles.irdTh, width: '80px', textAlign: 'right' }}>दर (रु.)</th>
                  <th style={{ ...styles.irdTh, width: '90px', textAlign: 'right' }}>जम्मा रकम</th>
                  <th style={{ ...styles.irdTh, width: '70px', textAlign: 'right' }}>छुट</th>
                  <th style={{ ...styles.irdTh, width: '90px', textAlign: 'right' }}>करयोग्य रकम</th>
                  <th style={{ ...styles.irdTh, width: '80px', textAlign: 'right' }}>१३% भ्याट</th>
                  <th style={{ ...styles.irdTh, width: '100px', textAlign: 'right' }}>कुल जम्मा</th>
                </tr>
              </thead>
              <tbody>
                {transaction.lines.map((line, idx) => (
                  <tr key={idx}>
                    <td style={{ ...styles.irdTd, textAlign: 'center' }}>{idx + 1}</td>
                    <td style={{ ...styles.irdTd, textAlign: 'left' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{line.itemName}</div>
                      {line.itemCode && <div style={{ fontSize: '10px', color: '#64748b' }}>कोड: {line.itemCode}</div>}
                    </td>
                    <td style={{ ...styles.irdTd, textAlign: 'center' }}>थान/PCS</td>
                    <td style={{ ...styles.irdTd, textAlign: 'right', fontFamily: 'monospace' }}>
                      {formatDecimal(line.quantity)}
                    </td>
                    <td style={{ ...styles.irdTd, textAlign: 'right', fontFamily: 'monospace' }}>
                      {formatDecimal(line.rate)}
                    </td>
                    <td style={{ ...styles.irdTd, textAlign: 'right', fontFamily: 'monospace' }}>
                      {formatDecimal(line.grossAmount || Number(line.quantity) * Number(line.rate))}
                    </td>
                    <td style={{ ...styles.irdTd, textAlign: 'right', fontFamily: 'monospace', color: '#16a34a' }}>
                      {formatDecimal(line.discountAmount)}
                    </td>
                    <td style={{ ...styles.irdTd, textAlign: 'right', fontFamily: 'monospace' }}>
                      {formatDecimal(line.taxableAmount || line.grossAmount)}
                    </td>
                    <td style={{ ...styles.irdTd, textAlign: 'right', fontFamily: 'monospace' }}>
                      {formatDecimal(line.taxAmount)}
                    </td>
                    <td style={{ ...styles.irdTd, textAlign: 'right', fontFamily: 'monospace', fontWeight: 700 }}>
                      {formatDecimal(line.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* IRD Summary Breakdown Box */}
            <div style={styles.irdBottomGrid}>
              {/* Left Side: Dynamic Fonepay QR & Remarks */}
              <div style={styles.irdLeftBottom}>
                <div style={styles.qrContainer}>
                  <QrCodeGenerator value={qrPaymentPayload} size={100} label="Fonepay / NepalPay QR" />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', textAlign: 'center' }}>
                    कुनै पनि मोबाइल बैंकिङ वा eSewa बाट भुक्तानी गर्नुहोस्
                  </div>
                </div>

                <div style={styles.irdNoticeBox}>
                  <div style={{ fontWeight: 700, fontSize: '11px', color: '#1e3a8a' }}>
                    आन्तरिक राजस्व ऐन २०५८ बमोजिम जारी गरिएको:
                  </div>
                  <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
                    १. सामान फिर्ता गर्दा सक्कल कर बिजक अनिवार्य पेश गर्नुपर्नेछ।<br />
                    २. यो कर बिजक आधिकारिक कम्प्युटर प्रणालीबाट स्वत: प्रमाणीकरण गरिएको छ।
                  </div>
                </div>
              </div>

              {/* Right Side: Totals Matrix */}
              <div style={styles.irdTotalsCard}>
                <div style={styles.irdTotalLine}>
                  <span>जम्मा रकम (Gross Subtotal):</span>
                  <strong>रु. {formatDecimal(transaction.subtotal)}</strong>
                </div>
                <div style={styles.irdTotalLine}>
                  <span>कुल छुट रकम (Total Discount):</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>- रु. {formatDecimal(transaction.totalDiscount)}</span>
                </div>
                <div style={styles.irdTotalLine}>
                  <span>करयोग्य रकम (Taxable Amount):</span>
                  <strong>रु. {formatDecimal(transaction.totalTaxableAmount)}</strong>
                </div>
                <div style={styles.irdTotalLine}>
                  <span>१३% मूल्य अभिवृद्धि कर (13% VAT):</span>
                  <strong>+ रु. {formatDecimal(transaction.totalTax)}</strong>
                </div>
                <div style={styles.irdGrandTotalLine}>
                  <span style={{ fontWeight: 900, fontSize: '15px' }}>कुल जम्मा (Grand Total):</span>
                  <strong style={{ fontSize: '18px', color: '#0f172a' }}>रु. {formatDecimal(transaction.grandTotal)}</strong>
                </div>
                <div style={styles.irdTotalLine}>
                  <span>अग्रिम भुक्तानी (Paid Amount):</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>रु. {formatDecimal(transaction.paidAmount)}</span>
                </div>
                <div style={styles.irdTotalLine}>
                  <span style={{ fontWeight: 700, color: '#dc2626' }}>बाँकी रकम (Balance Due):</span>
                  <strong style={{ color: '#dc2626', fontSize: '14px' }}>रु. {formatDecimal(transaction.balanceDue)}</strong>
                </div>
              </div>
            </div>

            {/* In Words Banner */}
            <div style={styles.irdWordsBanner}>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>अक्षरेपी (In Words): </span>
              <span style={{ fontWeight: 700, color: '#1e3a8a', fontStyle: 'italic' }}>
                {numberToEnglishWords(transaction.grandTotal)}
              </span>
            </div>

            {/* Signatures */}
            <div style={styles.irdSignaturesRow}>
              <div style={styles.sigBox}>
                <div style={styles.sigLine}></div>
                <div style={styles.sigLabel}>तयार गर्ने (Prepared By)</div>
              </div>
              <div style={styles.sigBox}>
                <div style={styles.sigLine}></div>
                <div style={styles.sigLabel}>बुझिलिनेको दस्तखत (Receiver's Signature)</div>
              </div>
              <div style={styles.sigBox}>
                <div style={styles.sigLine}></div>
                <div style={styles.sigLabel}>आधिकारिक दस्तखत (Authorized Signatory)</div>
              </div>
            </div>

            {/* Mandatory Footer Note */}
            <div style={styles.irdFooterNote}>
              यो कम्प्युटर प्रणालीबाट तयार गरिएको आधिकारिक कर बिजक हो । Smart Billing ERP • Made for Nepal
            </div>
          </div>
        )}

        {/* ===================== TEMPLATE 2: MODERN STUDIO A4 ===================== */}
        {template === 'a4_modern' && (
          <div id="printable-invoice-sheet" style={styles.invoiceSheet}>
            {/* Header */}
            <div style={styles.modernHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={styles.logoBox}>
                  <span>🏢</span>
                </div>
                <div>
                  <h1 style={styles.companyName}>{firmName}</h1>
                  <div style={styles.subText}>{firmAddress} • Branch: {firmCode}</div>
                  <div style={styles.subText}>VAT / PAN: 601234567 • Phone: +977-1-4400000</div>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={styles.docTitle}>TAX INVOICE</div>
                <div style={styles.docNumber}>#{transaction.documentNumber}</div>
                <div style={styles.subText}>Nepali Date: {transaction.bsDate} BS</div>
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

            {/* Parties */}
            <div style={styles.partiesGrid}>
              <div style={styles.partyBox}>
                <div style={styles.boxTitle}>Billed To (Customer):</div>
                <div style={styles.partyName}>{partyName}</div>
                <div style={styles.subText}>
                  <strong>Buyer PAN:</strong> {partyPan || 'N/A (Consumer)'}
                </div>
                {partyPhone && <div style={styles.subText}>Phone: {partyPhone}</div>}
              </div>
              <div style={styles.partyBox}>
                <div style={styles.boxTitle}>Payment & Terms:</div>
                <div style={styles.subText}>
                  <strong>Payment Mode:</strong> {(transaction.paymentMode || 'cash').toUpperCase()}
                </div>
                <div style={styles.subText}>Currency: NPR (रु.) • FY: 2081/82</div>
                <div style={styles.subText}>Place of Supply: Kathmandu, Nepal</div>
              </div>
            </div>

            {/* Table */}
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
                    <td style={styles.tdRight}>{formatDecimal(line.quantity)}</td>
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
                <div style={styles.qrDisclaimer}>Scan with any mobile banking app to pay instantly.</div>
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

            {/* Words */}
            <div style={styles.wordsBanner}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>अक्षरेपी (In Words): </span>
              <span style={{ fontStyle: 'italic', color: '#10b981', fontWeight: 700 }}>
                {numberToEnglishWords(transaction.grandTotal)}
              </span>
            </div>

            {/* Footer */}
            <div style={styles.footerSection}>
              <div style={styles.termsBox}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>Terms & Conditions:</div>
                <ol style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#64748b' }}>
                  <li>Goods once sold will not be returned without valid tax receipt.</li>
                  <li>Payment due within agreed credit terms.</li>
                  <li>Subject to Kathmandu jurisdiction. Nepal IRD Certified Billing.</li>
                </ol>
              </div>

              <div style={styles.signatureBox}>
                <div style={styles.signatureLine}></div>
                <div style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>Authorized Signatory</div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TEMPLATE 3: 80MM POS THERMAL SLIP ===================== */}
        {template === 'thermal_80mm' && (
          <div id="printable-invoice-sheet" style={styles.thermalSheet}>
            <div style={styles.thermalHeader}>
              <div style={styles.thermalTitle}>{firmName}</div>
              <div style={styles.thermalSub}>{firmCode}</div>
              <div style={styles.thermalSub}>PAN: 601234567 • Ph: +977-1-4400000</div>
              <div style={styles.thermalDivider}>----------------------------------------</div>
              <div style={{ fontWeight: 800, fontSize: '13px' }}>
                {transaction.type === 'sales_return' ? 'CREDIT NOTE SLIP' : 'TAX INVOICE (CASH/POS)'}
              </div>
              <div style={styles.thermalSub}>Bill No: #{transaction.documentNumber}</div>
              <div style={styles.thermalSub}>Date: {transaction.bsDate} BS ({new Date(transaction.date).toLocaleDateString()})</div>
              <div style={styles.thermalSub}>Customer: {partyName}</div>
              {partyPan && <div style={styles.thermalSub}>Customer PAN: {partyPan}</div>}
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
                    <td style={{ textAlign: 'left', padding: '3px 0' }}>{line.itemName}</td>
                    <td style={{ textAlign: 'right' }}>{formatDecimal(line.quantity)}</td>
                    <td style={{ textAlign: 'right' }}>{formatDecimal(line.rate)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700 }}>{formatDecimal(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={styles.thermalDivider}>----------------------------------------</div>

            <div style={styles.thermalSummary}>
              <div style={styles.thermalRow}>
                <span>Subtotal:</span>
                <span>NPR {formatDecimal(transaction.subtotal)}</span>
              </div>
              <div style={styles.thermalRow}>
                <span>Discount:</span>
                <span>-NPR {formatDecimal(transaction.totalDiscount)}</span>
              </div>
              <div style={styles.thermalRow}>
                <span>VAT (13%):</span>
                <span>NPR {formatDecimal(transaction.totalTax)}</span>
              </div>
              <div style={{ ...styles.thermalRow, fontWeight: 900, fontSize: '15px', marginTop: '4px' }}>
                <span>GRAND TOTAL:</span>
                <span>NPR {formatDecimal(transaction.grandTotal)}</span>
              </div>
              <div style={{ ...styles.thermalRow, marginTop: '4px' }}>
                <span>Paid Amount:</span>
                <span>NPR {formatDecimal(transaction.paidAmount)}</span>
              </div>
              {Number(formatDecimal(transaction.balanceDue)) > 0 && (
                <div style={{ ...styles.thermalRow, fontWeight: 700, color: '#dc2626' }}>
                  <span>BALANCE DUE:</span>
                  <span>NPR {formatDecimal(transaction.balanceDue)}</span>
                </div>
              )}
            </div>

            <div style={styles.thermalDivider}>----------------------------------------</div>

            <div style={{ textAlign: 'center', margin: '10px 0' }}>
              <QrCodeGenerator value={qrPaymentPayload} size={90} label="Fonepay Scan to Pay" />
            </div>

            <div style={styles.thermalFooter}>
              <div>अक्षरेपी: {numberToEnglishWords(transaction.grandTotal)}</div>
              <div style={{ marginTop: '6px', fontWeight: 700 }}>Thank you for visiting!</div>
              <div style={{ fontSize: '9px', marginTop: '2px' }}>Smart Billing • IRD Compliant Slip</div>
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
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 150,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#f1f5f9',
    borderRadius: '16px',
    maxWidth: '960px',
    width: '100%',
    maxHeight: '94vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
    display: 'flex',
    flexDirection: 'column',
  },
  actionsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '14px 20px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  templateSwitcher: {
    display: 'flex',
    gap: '6px',
    backgroundColor: '#f1f5f9',
    padding: '3px',
    borderRadius: '8px',
  },
  tabBtn: {
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748b',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    color: '#0f172a',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  rightActions: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    color: '#ffffff',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  },
  emailBtn: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
  },
  printBtn: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '6px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
  closeBtn: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },

  /* ===================== IRD SCHEDULE 5 STYLES ===================== */
  irdSheet: {
    backgroundColor: '#ffffff',
    margin: '20px auto',
    padding: '32px 36px',
    maxWidth: '850px',
    width: '100%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    borderRadius: '8px',
    fontFamily: "'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    boxSizing: 'border-box',
    border: '1px solid #cbd5e1',
  },
  irdHeader: {
    borderBottom: '2px solid #0f172a',
    paddingBottom: '12px',
    marginBottom: '16px',
  },
  irdCompanyTitle: {
    fontSize: '22px',
    fontWeight: 900,
    color: '#0f172a',
    margin: '2px 0',
  },
  irdSubInfo: {
    fontSize: '12px',
    color: '#475569',
  },
  irdPanContainer: {
    display: 'inline-flex',
    alignItems: 'center',
    marginTop: '6px',
    padding: '4px 8px',
    backgroundColor: '#f8fafc',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  panBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '20px',
    height: '22px',
    border: '1px solid #0f172a',
    borderRadius: '2px',
    fontSize: '13px',
    fontWeight: 800,
    marginRight: '2px',
    backgroundColor: '#ffffff',
  },
  irdDocBanner: {
    textAlign: 'center',
    backgroundColor: '#f1f5f9',
    padding: '6px',
    borderRadius: '4px',
    marginTop: '10px',
    border: '1px solid #cbd5e1',
  },
  irdMetaGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '16px',
    padding: '10px 14px',
    backgroundColor: '#fafafa',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
  },
  irdMetaCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
  },
  metaLabel: {
    color: '#64748b',
    fontWeight: 600,
  },
  metaVal: {
    color: '#0f172a',
  },
  irdTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '16px',
    border: '1px solid #0f172a',
  },
  irdTh: {
    border: '1px solid #0f172a',
    backgroundColor: '#f1f5f9',
    padding: '6px 8px',
    fontSize: '11px',
    fontWeight: 800,
    color: '#0f172a',
  },
  irdTd: {
    border: '1px solid #cbd5e1',
    padding: '6px 8px',
    fontSize: '12px',
    color: '#0f172a',
  },
  irdBottomGrid: {
    display: 'grid',
    gridTemplateColumns: '1.1fr 1fr',
    gap: '20px',
    marginBottom: '14px',
  },
  irdLeftBottom: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  qrContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '12px',
    border: '1px solid #e2e8f0',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
  },
  irdNoticeBox: {
    padding: '8px 12px',
    border: '1px solid #bfdbfe',
    backgroundColor: '#eff6ff',
    borderRadius: '6px',
  },
  irdTotalsCard: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    padding: '12px 16px',
    border: '1px solid #0f172a',
    borderRadius: '6px',
    backgroundColor: '#fafafa',
  },
  irdTotalLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#334155',
  },
  irdGrandTotalLine: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '2px solid #0f172a',
    borderBottom: '2px solid #0f172a',
    padding: '6px 0',
    margin: '4px 0',
  },
  irdWordsBanner: {
    padding: '10px 14px',
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    fontSize: '12px',
    marginBottom: '28px',
  },
  irdSignaturesRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '24px',
    marginTop: '36px',
    marginBottom: '16px',
    textAlign: 'center',
  },
  sigBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  sigLine: {
    width: '140px',
    borderBottom: '1px dashed #0f172a',
    marginBottom: '6px',
  },
  sigLabel: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#475569',
  },
  irdFooterNote: {
    borderTop: '1px solid #e2e8f0',
    paddingTop: '8px',
    textAlign: 'center',
    fontSize: '10px',
    color: '#94a3b8',
  },

  /* ===================== MODERN A4 STYLES ===================== */
  invoiceSheet: {
    backgroundColor: '#ffffff',
    margin: '20px auto',
    padding: '36px 40px',
    maxWidth: '850px',
    width: '100%',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
    borderRadius: '12px',
    boxSizing: 'border-box',
  },
  modernHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '2px solid #f1f5f9',
    paddingBottom: '20px',
    marginBottom: '20px',
  },
  logoBox: {
    width: '54px',
    height: '54px',
    borderRadius: '12px',
    backgroundColor: '#ecfdf5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px',
    border: '1px solid #a7f3d0',
  },
  companyName: { fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subText: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  docTitle: { fontSize: '20px', fontWeight: 900, color: '#10b981', letterSpacing: '1px' },
  docNumber: { fontSize: '15px', fontWeight: 800, fontFamily: 'monospace', color: '#0f172a' },
  statusBadge: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 800,
    padding: '2px 8px',
    borderRadius: '4px',
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
    padding: '14px 16px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  boxTitle: { fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' },
  partyName: { fontSize: '14px', fontWeight: 800, color: '#0f172a' },
  table: { width: '100%', borderCollapse: 'collapse', marginBottom: '24px' },
  theadRow: { backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0' },
  th: { padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  thCenter: { padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'center' },
  thRight: { padding: '10px 12px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'right' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 12px', fontSize: '13px', color: '#0f172a' },
  tdCenter: { padding: '10px 12px', fontSize: '13px', color: '#64748b', textAlign: 'center' },
  tdRight: { padding: '10px 12px', fontSize: '13px', color: '#0f172a', textAlign: 'right', fontFamily: 'monospace' },
  tdRightBold: { padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: '#0f172a', textAlign: 'right', fontFamily: 'monospace' },
  summarySection: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '20px' },
  qrBlock: {
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrDisclaimer: { fontSize: '11px', color: '#64748b', marginTop: '8px', textAlign: 'center' },
  totalsTable: { display: 'flex', flexDirection: 'column', gap: '6px' },
  totalRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#475569' },
  grandTotalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '16px',
    fontWeight: 800,
    color: '#0f172a',
    borderTop: '2px solid #e2e8f0',
    paddingTop: '8px',
    marginTop: '4px',
  },
  wordsBanner: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '6px',
    padding: '10px 14px',
    fontSize: '12px',
    marginBottom: '24px',
  },
  footerSection: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '20px' },
  termsBox: { maxWidth: '420px' },
  signatureBox: { textAlign: 'center' },
  signatureLine: { width: '160px', borderBottom: '1px solid #cbd5e1', marginBottom: '6px' },

  /* ===================== THERMAL 80MM STYLES ===================== */
  thermalSheet: {
    backgroundColor: '#ffffff',
    margin: '20px auto',
    padding: '20px',
    width: '320px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    borderRadius: '8px',
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '12px',
    color: '#000000',
    boxSizing: 'border-box',
  },
  thermalHeader: { textAlign: 'center' },
  thermalTitle: { fontSize: '16px', fontWeight: 900 },
  thermalSub: { fontSize: '11px', marginTop: '2px' },
  thermalDivider: { fontSize: '11px', margin: '6px 0', letterSpacing: '-1px' },
  thermalTable: { width: '100%', fontSize: '11px', borderCollapse: 'collapse' },
  thermalSummary: { display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '12px' },
  thermalRow: { display: 'flex', justifyContent: 'space-between' },
  thermalFooter: { textAlign: 'center', fontSize: '11px', marginTop: '12px' },
};
