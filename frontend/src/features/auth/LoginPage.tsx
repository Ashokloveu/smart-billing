import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../services/apiClient';
import { ApiResponse, AuthResponse } from '../../types/auth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
        identifier,
        password,
      });

      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>Smart Billing ERP</h1>
          <p style={styles.subtitle}>Nepal Enterprise Billing & Bookkeeping</p>
        </div>

        {errorMsg && <div style={styles.errorBox}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label}>Email or Phone Number</label>
            <input
              type="text"
              style={styles.input}
              placeholder="e.g. suman@ktmtrading.com.np"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              style={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            style={{
              ...styles.button,
              opacity: isLoading ? 0.7 : 1,
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In to Workspace'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>Bikram Sambat 2082/83 • Nepal IRD Compliant</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#0f172a',
    padding: '16px',
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    padding: '36px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1e3a8a',
    letterSpacing: '-0.025em',
  },
  subtitle: {
    fontSize: '13px',
    color: '#64748b',
    marginTop: '4px',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '20px',
    border: '1px solid #fecaca',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: 600,
    color: '#334155',
  },
  input: {
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    marginTop: '6px',
    padding: '12px',
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    borderRadius: '8px',
    transition: 'background-color 0.2s',
  },
  footer: {
    marginTop: '28px',
    textAlign: 'center',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '16px',
  },
  footerText: {
    fontSize: '11px',
    color: '#94a3b8',
  },
};
