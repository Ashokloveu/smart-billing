import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { operationsService } from '../services/operationsService';
import { NotificationItem } from '../types/operations';

export const NotificationDropdown: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!currentOrg?._id) return;
    try {
      const data = await operationsService.getNotifications(currentOrg._id);
      setNotifications(data.items);
      setUnreadCount(data.unreadCount);
    } catch (e) {
      console.error('Failed to fetch notifications', e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // 30s polling
    return () => clearInterval(interval);
  }, [currentOrg?._id]);

  const handleMarkAllRead = async () => {
    if (!currentOrg?._id) return;
    await operationsService.markNotificationsAsRead(currentOrg._id);
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        style={styles.bellBtn}
        onClick={() => setIsOpen(!isOpen)}
        title="System & Operational Notifications"
      >
        🔔
        {unreadCount > 0 && <span style={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div style={styles.dropdown}>
          <div style={styles.header}>
            <strong>Notifications</strong>
            {unreadCount > 0 && (
              <button style={styles.markReadBtn} onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>

          <div style={styles.list}>
            {notifications.map((item) => (
              <div
                key={item._id}
                style={{
                  ...styles.item,
                  backgroundColor: item.isRead ? '#ffffff' : '#f8fafc',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={styles.title}>{item.title}</span>
                  <span style={styles.time}>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p style={styles.message}>{item.message}</p>
                {item.referenceDocument && (
                  <span style={styles.docPill}>{item.referenceDocument}</span>
                )}
              </div>
            ))}

            {notifications.length === 0 && (
              <div style={styles.empty}>No notifications to display</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  bellBtn: { position: 'relative', background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', padding: '6px' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#dc2626', color: '#ffffff', fontSize: '10px', fontWeight: 800, borderRadius: '10px', padding: '2px 5px' },
  dropdown: { position: 'absolute', right: 0, top: '40px', width: '320px', backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', zIndex: 100, overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: '1px solid #e2e8f0', fontSize: '13px' },
  markReadBtn: { fontSize: '11px', color: '#1e3a8a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 },
  list: { maxHeight: '360px', overflowY: 'auto' },
  item: { padding: '10px 14px', borderBottom: '1px solid #f1f5f9' },
  title: { fontSize: '12px', fontWeight: 700, color: '#0f172a' },
  time: { fontSize: '10px', color: '#94a3b8' },
  message: { fontSize: '12px', color: '#475569', margin: '4px 0' },
  docPill: { fontSize: '10px', fontFamily: 'monospace', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1e3a8a', padding: '1px 5px', borderRadius: '3px' },
  empty: { padding: '24px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' },
};
