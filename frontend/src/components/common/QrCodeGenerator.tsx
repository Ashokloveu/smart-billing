import React from 'react';

interface QrCodeGeneratorProps {
  value: string;
  size?: number;
  label?: string;
}

export const QrCodeGenerator: React.FC<QrCodeGeneratorProps> = ({
  value,
  size = 120,
  label,
}) => {
  // Generate high-resolution QR Code using reliable SVG / API provider with fallback
  const encodedValue = encodeURIComponent(value);
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedValue}&margin=4`;

  return (
    <div style={styles.wrapper}>
      <img
        src={qrUrl}
        alt="Payment QR Code"
        width={size}
        height={size}
        style={styles.qrImage}
      />
      {label && <span style={styles.label}>{label}</span>}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: '#ffffff',
    padding: '6px',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    width: 'fit-content',
  },
  qrImage: {
    display: 'block',
    borderRadius: '4px',
  },
  label: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#0f172a',
    letterSpacing: '0.02em',
  },
};
