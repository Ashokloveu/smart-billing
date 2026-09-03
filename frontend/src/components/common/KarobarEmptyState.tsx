import React from 'react';

interface KarobarEmptyStateProps {
  title: string;
  subtitle: string;
  buttonText: string;
  onButtonClick: () => void;
  icon?: string;
}

export const KarobarEmptyState: React.FC<KarobarEmptyStateProps> = ({
  title,
  subtitle,
  buttonText,
  onButtonClick,
}) => {
  return (
    <div style={styles.container}>
      <div style={styles.illustrationBox}>
        {/* Document illustration placeholder */}
        <div style={styles.sheetTop} />
        <div style={styles.sheetBody}>
          <div style={styles.line} />
          <div style={{ ...styles.line, width: '60%' }} />
          <div style={{ ...styles.line, width: '40%' }} />
        </div>
      </div>

      <h2 style={styles.title}>{title}</h2>
      <p style={styles.subtitle}>{subtitle}</p>

      <button style={styles.actionBtn} onClick={onButtonClick}>
        + {buttonText}
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '440px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '40px 24px',
    textAlign: 'center',
    animation: 'fadeIn 0.2s ease',
  },
  illustrationBox: {
    width: '120px',
    height: '130px',
    borderRadius: '50%',
    backgroundColor: '#f1f5f9',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    position: 'relative',
  },
  sheetTop: {
    width: '54px',
    height: '14px',
    backgroundColor: '#64748b',
    borderRadius: '4px 4px 0 0',
  },
  sheetBody: {
    width: '54px',
    height: '64px',
    backgroundColor: '#ffffff',
    border: '1.5px solid #cbd5e1',
    borderTop: 'none',
    borderRadius: '0 0 4px 4px',
    padding: '8px 6px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
  },
  line: {
    height: '3px',
    backgroundColor: '#94a3b8',
    borderRadius: '2px',
    width: '100%',
  },
  title: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 8px 0',
    letterSpacing: '-0.01em',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    maxWidth: '420px',
    margin: '0 0 24px 0',
    lineHeight: 1.5,
  },
  actionBtn: {
    padding: '10px 24px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.15s ease',
  },
};
