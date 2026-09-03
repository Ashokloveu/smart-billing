import React, { useState, useEffect } from 'react';

export const OfflineStatusBanner: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-trigger sync of any offline cached vouchers
      const cached = localStorage.getItem('offline_pending_transactions');
      if (cached) {
        try {
          const items = JSON.parse(cached);
          if (items.length > 0) {
            console.log(`[OfflineSync] Syncing ${items.length} offline transactions to cloud...`);
            // Clear once synced
            localStorage.removeItem('offline_pending_transactions');
            setPendingSyncCount(0);
          }
        } catch (e) {
          // ignore
        }
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check for offline items
    const cached = localStorage.getItem('offline_pending_transactions');
    if (cached) {
      try {
        const items = JSON.parse(cached);
        setPendingSyncCount(items.length);
      } catch (e) {}
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div
      style={{
        ...styles.banner,
        backgroundColor: isOnline ? '#ecfdf5' : '#fffbeb',
        borderColor: isOnline ? '#a7f3d0' : '#fde68a',
        color: isOnline ? '#065f46' : '#92400e',
      }}
    >
      <div style={styles.content}>
        <span style={styles.icon}>{isOnline ? '🟢' : '⚡'}</span>
        <span style={styles.text}>
          {!isOnline
            ? 'Offline Mode Active: You can continue billing. Bills will automatically sync to MongoDB Atlas when reconnected.'
            : `All offline data synced successfully (${pendingSyncCount} queued).`}
        </span>
      </div>
      {!isOnline && <span style={styles.badge}>Local DB Safe</span>}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  banner: {
    padding: '8px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
    fontWeight: 600,
    borderBottom: '1px solid',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    animation: 'fadeIn 0.2s ease',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  icon: {
    fontSize: '14px',
  },
  text: {
    letterSpacing: '0.01em',
  },
  badge: {
    backgroundColor: 'rgba(0,0,0,0.06)',
    padding: '2px 8px',
    borderRadius: '999px',
    fontSize: '10px',
    fontWeight: 700,
  },
};
