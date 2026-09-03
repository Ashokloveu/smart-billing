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

  if (!item) return null;

  const barcodeValue = item.barcode || item.code || '890123456789';
  const price = (item as any).salePrice || (item as any).sellingPrice || '0.00';

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.actionsBar}>
          <div>
            <h2 style={styles.title}>🏷️ Barcode & Price Tag Sticker Designer</h2>
            <p style={styles.subtitle}>Print adhesive labels for {item.name}</p>
          </div>

          <div style={styles.controls}>
            <div style={styles.controlGroup}>
              <label style={styles.controlLabel}>Copies:</label>
              <input
                type="number"
                min="1"
                max="100"
                value={labelCount}
                onChange={(e) => setLabelCount(Number(e.target.value))}
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

        {/* Printable Label Grid */}
        <div style={styles.sheet}>
          <div style={styles.grid}>
            {Array.from({ length: labelCount }).map((_, idx) => (
              <div key={idx} style={styles.tag}>
                <div style={styles.storeName}>SMART STORE</div>
                <div style={styles.itemName}>{item.name}</div>
                <div style={styles.itemPrice}>
                  MRP: NPR {formatDecimal(price)}
                </div>
                <div style={styles.barcodeBox}>
                  <QrCodeGenerator value={barcodeValue} size={64} />
                  <div style={styles.barcodeText}>{barcodeValue}</div>
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 150,
    padding: '16px',
    overflowY: 'auto',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  actionsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  title: {
    fontSize: '18px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  subtitle: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '2px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  controlGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  controlLabel: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#475569',
  },
  numberInput: {
    width: '60px',
    padding: '6px 8px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
  },
  printBtn: {
    padding: '8px 16px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  closeBtn: {
    padding: '8px 14px',
    backgroundColor: '#e2e8f0',
    color: '#475569',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  sheet: {
    padding: '24px',
    backgroundColor: '#ffffff',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  tag: {
    border: '1px dashed #94a3b8',
    borderRadius: '8px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    backgroundColor: '#ffffff',
  },
  storeName: {
    fontSize: '9px',
    fontWeight: 700,
    color: '#64748b',
    letterSpacing: '0.05em',
  },
  itemName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0f172a',
    margin: '4px 0',
    maxWidth: '180px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemPrice: {
    fontSize: '13px',
    fontWeight: 800,
    color: '#16a34a',
    marginBottom: '6px',
  },
  barcodeBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  barcodeText: {
    fontSize: '10px',
    fontFamily: 'monospace',
    color: '#334155',
    marginTop: '2px',
  },
};
