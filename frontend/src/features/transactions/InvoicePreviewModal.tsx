import React from 'react';
import { Transaction } from '../../types/transaction';
import { formatDecimal } from '../../utils/decimal';

interface InvoicePreviewModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Actions bar */}
        <div style={styles.actionsBar}>
          <button style={styles.printBtn} onClick={() => window.print()}>
            🖨️ Print Invoice
          </button>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕ Close
          </button>
        </div>

        {/* Invoice Printable Sheet */}
        <div style={styles.invoiceSheet}>
          <div style={styles.header}>
            <div>
              <h1 style={styles.companyName}>
                {typeof transaction.firmId === 'object' ? transaction.firmId.name : 'Smart Billing Store'}
              </h1>
              <div style={styles.subText}>Branch: {typeof transaction.firmId === 'object' ? transaction.firmId.code : 'Main'}</div>
              <div style={styles.subText}>VAT / PAN: 601234567</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.docTitle}>
                {transaction.type === 'pos_invoice'
                  ? 'TAX INVOICE (POS)'
                  : transaction.type === 'sale_invoice'
                  ? 'TAX INVOICE'
                  : 'PURCHASE BILL'}
              </div>
              <div style={styles.docNumber}>#{transaction.documentNumber}</div>
              <div style={styles.subText}>Date: {transaction.bsDate} BS ({new Date(transaction.date).toLocaleDateString()})</div>
              <span
                style={{
                  ...styles.statusBadge,
                  backgroundColor:
                    transaction.status === 'posted'
                      ? '#ecfdf5'
                      : transaction.status === 'cancelled'
                      ? '#fef2f2'
                      : '#fffbeb',
                  color:
                    transaction.status === 'posted'
                      ? '#059669'
                      : transaction.status === 'cancelled'
                      ? '#dc2626'
                      : '#d97706',
                }}
              >
                {transaction.status.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={styles.partyBox}>
            <div>
              <div style={styles.partyLabel}>Bill To / Party:</div>
              <div style={styles.partyName}>{transaction.partyName}</div>
              {transaction.partyPan && <div style={styles.subText}>PAN: {transaction.partyPan}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.partyLabel}>Payment Status:</div>
              <div style={{ fontWeight: 600, color: '#0f172a' }}>
                Mode: {transaction.paymentMode.toUpperCase()}
              </div>
            </div>
          </div>

          {/* Line items table */}
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHead}>
                <th style={{ ...styles.th, width: '40px' }}>#</th>
                <th style={styles.th}>Particulars (Item Name & Code)</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Qty</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Rate (NPR)</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Taxable (NPR)</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>VAT (13%)</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Total (NPR)</th>
              </tr>
            </thead>
            <tbody>
              {transaction.lines.map((line, idx) => (
                <tr key={idx} style={styles.tableRow}>
                  <td style={styles.td}>{idx + 1}</td>
                  <td style={styles.td}>
                    <strong>{line.itemName}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{line.itemCode}</div>
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{formatDecimal(line.quantity)}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{formatDecimal(line.rate)}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{formatDecimal(line.taxableAmount)}</td>
                  <td style={{ ...styles.td, textAlign: 'right' }}>{formatDecimal(line.taxAmount)}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>{formatDecimal(line.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div style={styles.totalsWrapper}>
            <div style={{ flex: 1 }}>
              {transaction.notes && (
                <div style={styles.notesBox}>
                  <strong>Notes:</strong> {transaction.notes}
                </div>
              )}
              {transaction.cancellationReason && (
                <div style={styles.cancelBox}>
                  <strong>Cancelled:</strong> {transaction.cancellationReason}
                </div>
              )}
            </div>

            <div style={styles.totalsTable}>
              <div style={styles.totalRow}>
                <span>Subtotal:</span>
                <span>NPR {formatDecimal(transaction.subtotal)}</span>
              </div>
              <div style={styles.totalRow}>
                <span>Total Discount:</span>
                <span>- NPR {formatDecimal(transaction.totalDiscount)}</span>
              </div>
              <div style={styles.totalRow}>
                <span>Taxable Amount:</span>
                <span>NPR {formatDecimal(transaction.totalTaxableAmount)}</span>
              </div>
              <div style={styles.totalRow}>
                <span>Total VAT (13%):</span>
                <span>NPR {formatDecimal(transaction.totalTax)}</span>
              </div>
              <div style={{ ...styles.totalRow, ...styles.grandTotalRow }}>
                <span>Grand Total:</span>
                <span>NPR {formatDecimal(transaction.grandTotal)}</span>
              </div>
              <div style={styles.totalRow}>
                <span>Paid Amount:</span>
                <span style={{ color: '#059669' }}>NPR {formatDecimal(transaction.paidAmount)}</span>
              </div>
              <div style={styles.totalRow}>
                <span>Balance Due:</span>
                <span style={{ color: '#dc2626', fontWeight: 700 }}>NPR {formatDecimal(transaction.balanceDue)}</span>
              </div>
            </div>
          </div>

          <div style={styles.footerNotice}>
            Thank you for your business! This is a system-generated VAT invoice.
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    maxWidth: '850px',
    width: '100%',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  actionsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 24px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  printBtn: {
    padding: '6px 14px',
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
  },
  closeBtn: {
    padding: '6px 14px',
    backgroundColor: '#ffffff',
    color: '#475569',
    borderRadius: '6px',
    fontSize: '13px',
    border: '1px solid #cbd5e1',
  },
  invoiceSheet: {
    padding: '36px',
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
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  docTitle: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#1e3a8a',
  },
  docNumber: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#475569',
    marginTop: '2px',
  },
  subText: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '3px',
  },
  statusBadge: {
    display: 'inline-block',
    fontSize: '11px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    marginTop: '6px',
  },
  partyBox: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: '16px',
    borderRadius: '6px',
    marginBottom: '24px',
    border: '1px solid #e2e8f0',
  },
  partyLabel: {
    fontSize: '11px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: '#64748b',
  },
  partyName: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#0f172a',
    marginTop: '2px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '24px',
  },
  tableHead: {
    backgroundColor: '#f1f5f9',
    borderBottom: '1px solid #cbd5e1',
  },
  th: {
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#334155',
    textTransform: 'uppercase',
  },
  tableRow: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '10px 12px',
    fontSize: '13px',
    color: '#1e293b',
  },
  totalsWrapper: {
    display: 'flex',
    gap: '32px',
    marginBottom: '32px',
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
    color: '#334155',
  },
  grandTotalRow: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0f172a',
    borderTop: '2px solid #0f172a',
    borderBottom: '2px solid #0f172a',
    padding: '8px 0',
    marginTop: '4px',
  },
  notesBox: {
    fontSize: '12px',
    color: '#475569',
    backgroundColor: '#f8fafc',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
  },
  cancelBox: {
    fontSize: '12px',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    padding: '12px',
    borderRadius: '6px',
    border: '1px solid #fee2e2',
    marginTop: '8px',
  },
  footerNotice: {
    textAlign: 'center',
    fontSize: '11px',
    color: '#94a3b8',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
  },
};
