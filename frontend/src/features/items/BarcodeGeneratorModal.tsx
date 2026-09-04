import React, { useState } from 'react';
import { Item } from '../../types/master';
import { formatDecimal } from '../../utils/decimal';
import { QrCodeGenerator } from '../../components/common/QrCodeGenerator';

interface BarcodeGeneratorModalProps {
  item: Item | null;
  onClose: () => void;
}

export const BarcodeGeneratorModal: React.FC<BarcodeGeneratorModalProps> = ({ item, onClose }) => {
  const [labelCount, setLabelCount] = useState(12);
  const [batchNo, setBatchNo] = useState('B-2026/01');
  const [mfgDate, setMfgDate] = useState('2026-01');
  const [expDate, setExpDate] = useState('2027-12');
  const [showBatchInfo, setShowBatchInfo] = useState(true);

  if (!item) return null;

  const barcodeValue = item.barcode || item.code || '890123456789';
  const price = (item as any).salePrice || (item as any).sellingPrice || '0.00';

  // SVG Simulated Barcode Generator (Code 128 / EAN format)
  const renderSimulatedBarcode = (code: string) => {
    // Generate distinct bar pattern based on char codes
    const bars: boolean[] = [];
    bars.push(true, false, true); // start guard
    for (let i = 0; i < code.length; i++) {
      const charVal = code.charCodeAt(i);
      bars.push(
        (charVal & 1) !== 0,
        (charVal & 2) !== 0,
        (charVal & 4) !== 0,
        (charVal & 8) !== 0,
        false
      );
    }
    bars.push(true, false, true); // stop guard

    return (
      <svg width="140" height="38" style={{ display: 'block', margin: '0 auto' }}>
        {bars.map((isBlack, i) => (
          <rect
            key={i}
            x={i * 2}
            y="0"
            width={isBlack ? 2 : 0}
            height="38"
            fill="#0f172a"
          />
        ))}
      </svg>
    );
  };

  return (
    <div style={styles.overlay}>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-barcode-sheet, #printable-barcode-sheet * {
              visibility: visible;
            }
            #printable-barcode-sheet {
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
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
        {/* Controls Bar */}
        <div style={styles.actionsBar} className="no-print">
          <div>
            <h2 style={styles.title}>🏷️ Smart Billing Barcode & Price Tag Designer</h2>
            <p style={styles.subtitle}>Print adhesive labels and shelf tags for <strong>{item.name}</strong></p>
          </div>

          <div style={styles.controls}>
            <div style={styles.controlGroup}>
              <label style={styles.controlLabel}>Label Copies:</label>
              <input
                type="number"
                min="1"
                max="120"
                value={labelCount}
                onChange={(e) => setLabelCount(Math.max(1, Number(e.target.value)))}
                style={styles.numberInput}
              />
            </div>

            <button style={styles.printBtn} onClick={() => window.print()}>
              🖨️ Print Labels
            </button>
            <button style={styles.closeBtn} onClick={onClose}>
              ✕ Close
            </button>
          </div>
        </div>

        {/* Customization Options Bar */}
        <div style={styles.customOptionsBar} className="no-print">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: '#334155' }}>
            <input
              type="checkbox"
              checked={showBatchInfo}
              onChange={(e) => setShowBatchInfo(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            Include Batch & Expiry Date
          </label>

          {showBatchInfo && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Batch #"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                style={styles.optInput}
              />
              <input
                type="text"
                placeholder="MFG: YYYY-MM"
                value={mfgDate}
                onChange={(e) => setMfgDate(e.target.value)}
                style={styles.optInput}
              />
              <input
                type="text"
                placeholder="EXP: YYYY-MM"
                value={expDate}
                onChange={(e) => setExpDate(e.target.value)}
                style={styles.optInput}
              />
            </div>
          )}
        </div>

        {/* Printable Label Grid */}
        <div id="printable-barcode-sheet" style={styles.sheet}>
          <div style={styles.grid}>
            {Array.from({ length: labelCount }).map((_, idx) => (
              <div key={idx} style={styles.tag}>
                <div style={styles.storeName}>SMART BILLING</div>
                <div style={styles.itemName}>{item.name}</div>
                <div style={styles.skuText}>SKU: {item.code}</div>

                <div style={styles.itemPrice}>
                  MRP: NPR {formatDecimal(price)}
                </div>

                {showBatchInfo && (
                  <div style={styles.batchInfoRow}>
                    <span>B: {batchNo}</span>
                    <span>EXP: {expDate}</span>
                  </div>
                )}

                <div style={styles.barcodeBox}>
                  {renderSimulatedBarcode(barcodeValue)}
                  <div style={styles.barcodeText}>{barcodeValue}</div>
                </div>

                <div style={styles.qrCorner}>
                  <QrCodeGenerator value={barcodeValue} size={36} />
                </div>
              </div>
            ))}
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
    zIndex: 150,
    padding: '20px',
  },
  modal: {
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '92vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  actionsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    borderTopLeftRadius: '16px',
    borderTopRightRadius: '16px',
    flexWrap: 'wrap',
    gap: '12px',
  },
  title: { fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '12px', color: '#64748b', marginTop: '2px' },
  controls: { display: 'flex', alignItems: 'center', gap: '10px' },
  controlGroup: { display: 'flex', alignItems: 'center', gap: '6px' },
  controlLabel: { fontSize: '12px', fontWeight: 600, color: '#475569' },
  numberInput: {
    width: '60px',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    textAlign: 'center',
    outline: 'none',
  },
  printBtn: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    padding: '7px 16px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
  },
  closeBtn: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    padding: '7px 14px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    border: '1px solid #cbd5e1',
    cursor: 'pointer',
  },
  customOptionsBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 24px',
    backgroundColor: '#f1f5f9',
    borderBottom: '1px solid #e2e8f0',
    flexWrap: 'wrap',
    gap: '10px',
  },
  optInput: {
    padding: '4px 8px',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    fontSize: '11px',
    outline: 'none',
    width: '90px',
  },
  sheet: { padding: '24px', backgroundColor: '#ffffff', minHeight: '400px' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '14px',
  },
  tag: {
    border: '1px dashed #0f172a',
    borderRadius: '6px',
    padding: '10px 12px',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '170px',
    boxSizing: 'border-box',
  },
  storeName: {
    fontSize: '10px',
    fontWeight: 900,
    letterSpacing: '1px',
    color: '#10b981',
  },
  itemName: {
    fontSize: '12px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '2px 0',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  skuText: { fontSize: '10px', fontFamily: 'monospace', color: '#64748b' },
  itemPrice: {
    fontSize: '14px',
    fontWeight: 900,
    color: '#0f172a',
    margin: '4px 0',
  },
  batchInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '9px',
    color: '#475569',
    borderTop: '1px dotted #cbd5e1',
    paddingTop: '2px',
    margin: '2px 0',
  },
  barcodeBox: { marginTop: '4px' },
  barcodeText: {
    fontSize: '10px',
    fontFamily: 'monospace',
    letterSpacing: '2px',
    color: '#0f172a',
    marginTop: '2px',
    fontWeight: 700,
  },
  qrCorner: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    opacity: 0.85,
  },
};
