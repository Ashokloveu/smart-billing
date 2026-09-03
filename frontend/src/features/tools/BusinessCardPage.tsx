import React, { useState } from 'react';
import { useOrgStore } from '../../stores/orgStore';

export const BusinessCardPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);

  const [name, setName] = useState('Ashok Singh');
  const [businessName, setBusinessName] = useState(currentOrg?.name || 'Bardibas Smart Tech Pvt. Ltd.');
  const [address, setAddress] = useState('Bardibas-01, Mahottari, Nepal');
  const [contact, setContact] = useState('9800895800');
  const [email, setEmail] = useState('contact@smartbilling.app');
  const [cardColor, setCardColor] = useState('#10b981'); // Emerald green default

  const colors = ['#10b981', '#f97316', '#2563eb', '#06b6d4', '#9333ea'];

  const handleDownload = () => {
    window.print();
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Generate Your Business Card</h1>

      <div style={styles.grid}>
        {/* Left Form */}
        <div style={styles.formCard}>
          <div style={styles.formGroup}>
            <label style={styles.label}>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Business Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Business Address</label>
            <input
              type="text"
              placeholder="Enter business address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Your Contact Number</label>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Business Email</label>
            <input
              type="email"
              placeholder="Enter your business email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Business Logo</label>
            <button type="button" style={styles.logoUploadBtn}>
              📷
            </button>
          </div>
        </div>

        {/* Right Preview Card */}
        <div style={styles.previewSection}>
          <div style={styles.previewCardBox}>
            <div style={styles.sectionLabel}>Select Card Style</div>

            {/* Business Card Canvas */}
            <div style={{ ...styles.cardCanvas, borderColor: cardColor }}>
              {/* Left Color Swatch Section */}
              <div style={{ ...styles.cardLeftSweep, backgroundColor: cardColor }}>
                <h3 style={styles.cardName}>{name}</h3>
                <p style={styles.cardBizName}>{businessName}</p>
                <div style={styles.cardContactRow}>
                  <span>📞 {contact}</span>
                </div>
              </div>

              {/* Right Logo Section */}
              <div style={styles.cardRightSection}>
                <div style={{ ...styles.bizLogoBadge, color: cardColor }}>
                  {businessName.slice(0, 4).toUpperCase()}
                </div>
                <div style={styles.cardEmailText}>{email}</div>
                <div style={styles.cardAddrText}>{address}</div>
              </div>
            </div>

            {/* Color Palette Selector */}
            <div style={{ marginTop: '24px' }}>
              <div style={styles.sectionLabel}>Select Color</div>
              <div style={styles.colorPalette}>
                {colors.map((c) => (
                  <div
                    key={c}
                    style={{
                      ...styles.colorDot,
                      backgroundColor: c,
                      transform: cardColor === c ? 'scale(1.2)' : 'scale(1)',
                      boxShadow: cardColor === c ? '0 0 0 3px #ffffff, 0 0 0 5px ' + c : 'none',
                    }}
                    onClick={() => setCardColor(c)}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={styles.actionRow}>
              <button
                style={styles.restoreBtn}
                onClick={() => {
                  setName('Ashok Singh');
                  setCardColor('#10b981');
                }}
              >
                Restore to Default
              </button>
              <button style={styles.downloadBtn} onClick={handleDownload}>
                ⬇ Download Business Card
              </button>
            </div>
          </div>
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
  title: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '380px 1fr',
    gap: '24px',
    alignItems: 'flex-start',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
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
  logoUploadBtn: {
    width: '54px',
    height: '54px',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '22px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSection: {
    display: 'flex',
    flexDirection: 'column',
  },
  previewCardBox: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
  },
  sectionLabel: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    marginBottom: '12px',
  },
  cardCanvas: {
    width: '100%',
    maxWidth: '480px',
    height: '240px',
    borderRadius: '16px',
    border: '1px solid',
    display: 'flex',
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
  },
  cardLeftSweep: {
    flex: 1.2,
    color: '#ffffff',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    borderRadius: '0 80px 0 0',
  },
  cardName: {
    fontSize: '18px',
    fontWeight: 800,
    margin: 0,
  },
  cardBizName: {
    fontSize: '11px',
    opacity: 0.9,
    margin: '4px 0 0 0',
  },
  cardContactRow: {
    fontSize: '11px',
    fontWeight: 600,
  },
  cardRightSection: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    textAlign: 'right',
  },
  bizLogoBadge: {
    fontSize: '24px',
    fontWeight: 900,
    letterSpacing: '1px',
    marginBottom: '12px',
  },
  cardEmailText: {
    fontSize: '10px',
    color: '#64748b',
    marginBottom: '4px',
  },
  cardAddrText: {
    fontSize: '10px',
    color: '#94a3b8',
    maxWidth: '140px',
  },
  colorPalette: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  colorDot: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '32px',
    paddingTop: '20px',
    borderTop: '1px solid #f1f5f9',
  },
  restoreBtn: {
    padding: '9px 16px',
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  downloadBtn: {
    padding: '10px 24px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
};
