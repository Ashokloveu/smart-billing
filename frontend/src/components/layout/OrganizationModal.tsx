import React, { useState } from 'react';
import { apiClient } from '../../services/apiClient';

interface OrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newOrg: any) => void;
}

const INDUSTRY_PRESETS = [
  {
    id: 'retail_grocery',
    name: 'Retail & Grocery Store',
    icon: '🛒',
    desc: 'High-speed POS, Barcode billing, standard units (PCS, KG, PACK).',
  },
  {
    id: 'pharmacy',
    name: 'Pharmacy & Medical',
    icon: '💊',
    desc: 'Batch numbers, FEFO Expiry date alerts, Drug license fields.',
  },
  {
    id: 'wholesale',
    name: 'Wholesale & Distribution',
    icon: '🏢',
    desc: 'Multi-tier pricing (Wholesale/Retail), Credit limits & Aging.',
  },
  {
    id: 'garments',
    name: 'Garments & Footwear',
    icon: '👔',
    desc: 'Size, Color, Brand matrix, Barcode tag printing.',
  },
  {
    id: 'restaurant',
    name: 'Restaurant & Cafe',
    icon: '🍽️',
    desc: 'Table management, KOT, and quick food billing.',
  },
  {
    id: 'service',
    name: 'Service & Consultancy',
    icon: '💼',
    desc: 'Service billing without stock tracking, TDS deduction.',
  },
];

export const OrganizationModal: React.FC<OrganizationModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [industry, setIndustry] = useState('retail_grocery');
  const [currency, setCurrency] = useState('NPR');
  const [city, setCity] = useState('Kathmandu');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
      const res = await apiClient.post('/organizations', {
        name,
        legalName: legalName || name,
        panNumber: panNumber || '600000000',
        slug,
        industry,
        settings: {
          currency,
          dateFormat: 'YYYY-MM-DD',
          calendarSystem: 'bikram_sambat',
          negativeStockAllowed: false,
          taxType: 'VAT',
        },
      });

      onCreated(res.data.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to create organization.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>➕ Create New Business / Shop</h2>
            <p style={styles.subtitle}>Set up a new organization with tailored industry defaults</p>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Industry Preset Selector */}
          <div>
            <label style={styles.label}>Select Business Type / Industry</label>
            <div style={styles.presetGrid}>
              {INDUSTRY_PRESETS.map((preset) => (
                <div
                  key={preset.id}
                  style={{
                    ...styles.presetCard,
                    ...(industry === preset.id ? styles.presetCardActive : {}),
                  }}
                  onClick={() => setIndustry(preset.id)}
                >
                  <div style={styles.presetIcon}>{preset.icon}</div>
                  <div style={styles.presetName}>{preset.name}</div>
                  <div style={styles.presetDesc}>{preset.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.col}>
              <label style={styles.label}>Business / Shop Name *</label>
              <input
                type="text"
                style={styles.input}
                placeholder="e.g. Annapurna Supermart"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div style={styles.col}>
              <label style={styles.label}>Legal / Registered Name</label>
              <input
                type="text"
                style={styles.input}
                placeholder="e.g. Annapurna Supermart Pvt. Ltd."
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.col}>
              <label style={styles.label}>Nepal PAN / VAT Number</label>
              <input
                type="text"
                style={styles.input}
                placeholder="e.g. 601234567"
                value={panNumber}
                onChange={(e) => setPanNumber(e.target.value)}
              />
            </div>
            <div style={styles.col}>
              <label style={styles.label}>Currency</label>
              <select
                style={styles.input}
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="NPR">Nepalese Rupee (NPR)</option>
                <option value="INR">Indian Rupee (INR)</option>
                <option value="USD">US Dollar (USD)</option>
              </select>
            </div>
          </div>

          <div style={styles.row}>
            <div style={styles.col}>
              <label style={styles.label}>Base City / District</label>
              <input
                type="text"
                style={styles.input}
                placeholder="e.g. Kathmandu / Pokhara"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.submitBtn} disabled={isLoading}>
              {isLoading ? 'Creating Business...' : '🚀 Launch Business Workspace'}
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
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    padding: '16px',
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '680px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '28px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
  },
  title: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#0f172a',
    margin: 0,
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
  closeBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    fontSize: '18px',
    color: '#64748b',
    cursor: 'pointer',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '10px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
    marginBottom: '6px',
    display: 'block',
  },
  presetGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px',
    marginBottom: '8px',
  },
  presetCard: {
    border: '1.5px solid #e2e8f0',
    borderRadius: '10px',
    padding: '12px',
    cursor: 'pointer',
    backgroundColor: '#f8fafc',
    transition: 'all 0.2s ease',
  },
  presetCardActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
    boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
  },
  presetIcon: {
    fontSize: '20px',
    marginBottom: '4px',
  },
  presetName: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#0f172a',
  },
  presetDesc: {
    fontSize: '10px',
    color: '#64748b',
    marginTop: '2px',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  col: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '12px',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
  },
  cancelBtn: {
    padding: '10px 18px',
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
