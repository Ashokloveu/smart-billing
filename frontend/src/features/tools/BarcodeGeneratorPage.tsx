import React, { useState, useEffect } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';

interface BarcodeItemRow {
  id: string;
  name: string;
  code: string;
  qty: number;
}

export const BarcodeGeneratorPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [items, setItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<BarcodeItemRow[]>([]);
  const [printerType, setPrinterType] = useState('Regular Printer');
  const [paperSize, setPaperSize] = useState('65 Labels (38 × 21mm)');

  // Checkbox customization
  const [includeBizName, setIncludeBizName] = useState(true);
  const [includeItemName, setIncludeItemName] = useState(true);
  const [includePrice, setIncludePrice] = useState(true);
  const [includeMrp, setIncludeMrp] = useState(false);
  const [includeCurrency, setIncludeCurrency] = useState(true);

  useEffect(() => {
    if (!currentOrg?._id) return;
    const fetchItems = async () => {
      try {
        const res = await apiClient.get(`/organizations/${currentOrg._id}/items`);
        setItems(res.data.data || []);
      } catch (e) {
        console.error('Failed to load items for barcode generator', e);
      }
    };
    fetchItems();
  }, [currentOrg?._id]);

  const handleAddItem = (item: any) => {
    setSelectedItems((prev) => [
      ...prev,
      { id: item._id, name: item.name, code: item.code, qty: 10 },
    ]);
  };

  const handleGenerate = () => {
    if (selectedItems.length === 0) {
      alert('Please add at least one item to generate barcode sheet');
      return;
    }
    window.print();
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.topHeader}>
        <h1 style={styles.title}>Barcode Generator</h1>
        <div style={styles.topControls}>
          <div style={styles.selectWrapper}>
            <span style={styles.selectLabel}>Printer Type:</span>
            <select
              value={printerType}
              onChange={(e) => setPrinterType(e.target.value)}
              style={styles.select}
            >
              <option value="Regular Printer">Regular Printer</option>
              <option value="Thermal Printer">Thermal Printer (TSC / Xprinter)</option>
            </select>
          </div>

          <div style={styles.selectWrapper}>
            <span style={styles.selectLabel}>Paper Size:</span>
            <select
              value={paperSize}
              onChange={(e) => setPaperSize(e.target.value)}
              style={styles.select}
            >
              <option value="65 Labels (38 × 21mm)">65 Labels (38 × 21mm)</option>
              <option value="24 Labels (70 × 36mm)">24 Labels (70 × 36mm)</option>
              <option value="Single Thermal Roll">Single Thermal Roll</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customize Barcode Checkboxes */}
      <div style={styles.card}>
        <div style={styles.sectionHeading}>Customize Barcode:</div>
        <div style={styles.checkboxGroup}>
          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={includeBizName}
              onChange={(e) => setIncludeBizName(e.target.checked)}
              style={styles.checkbox}
            />
            Business Name
          </label>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={includeItemName}
              onChange={(e) => setIncludeItemName(e.target.checked)}
              style={styles.checkbox}
            />
            Item Name
          </label>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={includePrice}
              onChange={(e) => setIncludePrice(e.target.checked)}
              style={styles.checkbox}
            />
            Price
          </label>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={includeMrp}
              onChange={(e) => setIncludeMrp(e.target.checked)}
              style={styles.checkbox}
            />
            MRP
          </label>

          <label style={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={includeCurrency}
              onChange={(e) => setIncludeCurrency(e.target.checked)}
              style={styles.checkbox}
            />
            Currency
          </label>
        </div>

        {/* Selected Items Table */}
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={{ width: '60px', padding: '12px 14px' }}>S.N.</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Item</th>
              <th style={{ padding: '12px 14px', textAlign: 'left' }}>Item Code</th>
              <th style={{ width: '120px', padding: '12px 14px', textAlign: 'center' }}>Qty</th>
              <th style={{ width: '40px' }}></th>
            </tr>
          </thead>
          <tbody>
            {selectedItems.map((row, idx) => (
              <tr key={idx} style={styles.tr}>
                <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                <td style={{ padding: '12px 14px' }}><strong>{row.name}</strong></td>
                <td style={{ padding: '12px 14px', fontFamily: 'JetBrains Mono, monospace' }}>{row.code}</td>
                <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                  <input
                    type="number"
                    value={row.qty}
                    onChange={(e) => {
                      const updated = [...selectedItems];
                      updated[idx].qty = Number(e.target.value);
                      setSelectedItems(updated);
                    }}
                    style={styles.qtyInput}
                  />
                </td>
                <td>
                  <button
                    onClick={() => setSelectedItems(selectedItems.filter((_, i) => i !== idx))}
                    style={styles.trashBtn}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* + Select Item Link */}
        <div style={{ marginTop: '16px' }}>
          <select
            onChange={(e) => {
              const item = items.find((i) => i._id === e.target.value);
              if (item) handleAddItem(item);
            }}
            style={styles.addItemSelect}
          >
            <option value="">+ Select Item to Generate Barcode</option>
            {items.map((i) => (
              <option key={i._id} value={i._id}>
                {i.name} ({i.code})
              </option>
            ))}
          </select>
        </div>

        {/* Bottom Actions */}
        <div style={styles.footerRow}>
          <button style={styles.resetBtn} onClick={() => setSelectedItems([])}>
            Reset
          </button>
          <button style={styles.generateBtn} onClick={handleGenerate}>
            Generate Code
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    animation: 'fadeIn 0.2s ease',
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  topControls: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  selectWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  selectLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: 600,
  },
  select: {
    padding: '6px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '12px',
    outline: 'none',
    backgroundColor: '#ffffff',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  sectionHeading: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#0f172a',
    marginBottom: '12px',
  },
  checkboxGroup: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #f1f5f9',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#334155',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    accentColor: '#10b981',
    cursor: 'pointer',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e2e8f0',
  },
  theadRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1.5px solid #e2e8f0',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  qtyInput: {
    width: '60px',
    padding: '6px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    textAlign: 'center',
    fontSize: '13px',
  },
  trashBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  addItemSelect: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    color: '#10b981',
    fontWeight: 700,
    fontSize: '13px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    outline: 'none',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '32px',
    paddingTop: '20px',
    borderTop: '1px solid #f1f5f9',
  },
  resetBtn: {
    padding: '9px 18px',
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  generateBtn: {
    padding: '9px 24px',
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
