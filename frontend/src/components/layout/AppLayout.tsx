import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { OfflineStatusBanner } from '../common/OfflineStatusBanner';

export const AppLayout: React.FC = () => {
  return (
    <div style={styles.container}>
      <Sidebar />
      <div style={styles.mainWrapper}>
        <OfflineStatusBanner />
        <Header />
        <main style={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    minHeight: '100vh',
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    overflowX: 'hidden',
  },
  content: {
    flex: 1,
    padding: '24px',
    backgroundColor: '#f8fafc',
  },
};
