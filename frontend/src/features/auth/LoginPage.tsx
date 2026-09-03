import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { apiClient } from '../../services/apiClient';
import { ApiResponse, AuthResponse } from '../../types/auth';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+977-');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Quick Demo Autofill
  const handleQuickDemo = () => {
    setMode('login');
    setIdentifier('admin@smartbilling.com');
    setPassword('Admin@123456');
    setErrorMsg(null);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', {
        identifier: identifier.trim(),
        password,
      });

      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Login failed. Please verify email/phone and password.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const cleanPhone = phone.replace(/[^0-9+]/g, '');
      const response = await apiClient.post<ApiResponse<AuthResponse>>('/auth/signup', {
        fullName: fullName.trim(),
        email: identifier.trim(),
        phone: cleanPhone.startsWith('+') ? cleanPhone : `+977${cleanPhone}`,
        password,
      });

      setSuccessMsg('Account created successfully! Signing you in...');
      setTimeout(() => {
        const { user, accessToken, refreshToken } = response.data.data;
        if (accessToken) {
          setAuth(user, accessToken, refreshToken);
          navigate('/dashboard');
        } else {
          setMode('login');
          setIsLoading(false);
        }
      }, 1000);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || 'Registration failed. Password must be 8+ chars with uppercase, lowercase & number.'
      );
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* Background Glowing Mesh Gradients */}
      <div style={styles.glowBlob1} />
      <div style={styles.glowBlob2} />

      <div style={styles.mainWrapper}>
        {/* ================= LEFT HERO PANEL ================= */}
        <div style={styles.heroPanel}>
          <div style={styles.brandRow}>
            <div style={styles.logoBadge}>⚡</div>
            <div>
              <div style={styles.brandName}>Smart Billing ERP</div>
              <div style={styles.brandTagline}>Enterprise SaaS • Nepal IRD Certified</div>
            </div>
          </div>

          <div style={styles.heroContent}>
            <h1 style={styles.heroHeadline}>
              The All-in-One Cloud Billing & Accounting for Modern Nepal
            </h1>
            <p style={styles.heroDescription}>
              Powering retail stores, supermarkets, pharmacies, wholesalers, and multi-branch enterprises with 0.5s fast POS, dynamic Fonepay QR payments, and real-time VAT registers.
            </p>

            <div style={styles.featurePillsGrid}>
              <div style={styles.featurePill}>
                <span style={styles.pillIcon}>⚡</span>
                <div>
                  <div style={styles.pillTitle}>0.5s Fast POS Billing</div>
                  <div style={styles.pillDesc}>Barcode reader & thermal receipt support</div>
                </div>
              </div>

              <div style={styles.featurePill}>
                <span style={styles.pillIcon}>📱</span>
                <div>
                  <div style={styles.pillTitle}>Dynamic Fonepay & eSewa QR</div>
                  <div style={styles.pillDesc}>Instant scan-to-pay printed on bills</div>
                </div>
              </div>

              <div style={styles.featurePill}>
                <span style={styles.pillIcon}>🇳🇵</span>
                <div>
                  <div style={styles.pillTitle}>Nepal VAT 13% & IRD Ready</div>
                  <div style={styles.pillDesc}>Automated अनुसूची ८ & ९ Sales/Purchase</div>
                </div>
              </div>

              <div style={styles.featurePill}>
                <span style={styles.pillIcon}>🏢</span>
                <div>
                  <div style={styles.pillTitle}>Multi-Shop & Multi-Warehouse</div>
                  <div style={styles.pillDesc}>Switch branches & sync inventory live</div>
                </div>
              </div>
            </div>
          </div>

          <div style={styles.heroFooter}>
            <div style={styles.statItem}>
              <div style={styles.statNumber}>10,000+</div>
              <div style={styles.statLabel}>Invoices Daily</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <div style={styles.statNumber}>99.99%</div>
              <div style={styles.statLabel}>Cloud Uptime</div>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.statItem}>
              <div style={styles.statNumber}>BS 2081/82</div>
              <div style={styles.statLabel}>Bikram Sambat</div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT AUTH CARD ================= */}
        <div style={styles.authCardWrapper}>
          <div style={styles.authCard}>
            {/* Tab Switcher */}
            <div style={styles.tabContainer}>
              <button
                style={{
                  ...styles.tabButton,
                  ...(mode === 'login' ? styles.tabButtonActive : {}),
                }}
                onClick={() => {
                  setMode('login');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
              >
                🔑 Sign In to Workspace
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  ...(mode === 'signup' ? styles.tabButtonActive : {}),
                }}
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                  setSuccessMsg(null);
                }}
              >
                ✨ Free 14-Day Trial
              </button>
            </div>

            {/* Quick Demo Pill */}
            {mode === 'login' && (
              <div style={styles.demoBanner} onClick={handleQuickDemo} title="Click to autofill superadmin credentials">
                <span style={styles.demoSparkle}>⚡</span>
                <span style={styles.demoText}>
                  Click here to <strong>Autofill Superadmin Demo</strong> credentials
                </span>
              </div>
            )}

            {errorMsg && <div style={styles.errorAlert}>⚠️ {errorMsg}</div>}
            {successMsg && <div style={styles.successAlert}>✅ {successMsg}</div>}

            {/* FORM */}
            <form onSubmit={mode === 'login' ? handleLoginSubmit : handleSignupSubmit} style={styles.form}>
              {mode === 'signup' && (
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Full Name *</label>
                  <input
                    type="text"
                    style={styles.textInput}
                    placeholder="e.g. Ramesh Adhikari"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>
                  {mode === 'login' ? 'Email or Mobile Number *' : 'Work Email Address *'}
                </label>
                <input
                  type={mode === 'login' ? 'text' : 'email'}
                  style={styles.textInput}
                  placeholder={mode === 'login' ? 'admin@smartbilling.com or 9800000000' : 'name@company.com'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              {mode === 'signup' && (
                <div style={styles.inputGroup}>
                  <label style={styles.inputLabel}>Nepal Phone Number (+977) *</label>
                  <input
                    type="tel"
                    style={styles.textInput}
                    placeholder="+977-98XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={styles.inputGroup}>
                <div style={styles.passwordHeaderRow}>
                  <label style={styles.inputLabel}>Password *</label>
                  <span
                    style={styles.showPasswordBtn}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '🙈 Hide' : '👁️ Show'}
                  </span>
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  style={styles.textInput}
                  placeholder={mode === 'login' ? '••••••••' : 'Min. 8 chars (e.g. Pass@123)'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <button
                type="submit"
                style={{
                  ...styles.submitBtn,
                  opacity: isLoading ? 0.75 : 1,
                }}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span style={styles.spinnerRow}>⏳ Authenticating with Cloud...</span>
                ) : mode === 'login' ? (
                  '🚀 Enter Enterprise Workspace'
                ) : (
                  '🎉 Launch Free SaaS Workspace'
                )}
              </button>
            </form>

            <div style={styles.securityFooter}>
              <div style={styles.securityTag}>
                <span>🔒 Bank-Grade AES-256 Cloud Encryption</span>
                <span>•</span>
                <span>MongoDB Atlas</span>
              </div>
              <div style={styles.irdBadge}>
                🇳🇵 Certified for Nepal Inland Revenue Department (IRD) Billing Standards
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#0a0f1d',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: '"Plus Jakarta Sans", "Inter", -apple-system, sans-serif',
  },
  glowBlob1: {
    position: 'absolute',
    top: '-15%',
    left: '-10%',
    width: '600px',
    height: '600px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(37, 99, 235, 0.25) 0%, rgba(30, 27, 75, 0) 70%)',
    filter: 'blur(80px)',
    pointerEvents: 'none',
  },
  glowBlob2: {
    position: 'absolute',
    bottom: '-15%',
    right: '-10%',
    width: '650px',
    height: '650px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, rgba(15, 23, 42, 0) 70%)',
    filter: 'blur(90px)',
    pointerEvents: 'none',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: '1180px',
    display: 'grid',
    gridTemplateColumns: '1.15fr 0.95fr',
    gap: '36px',
    alignItems: 'center',
    zIndex: 1,
  },
  heroPanel: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '24px 12px',
    color: '#ffffff',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    marginBottom: '28px',
  },
  logoBadge: {
    width: '46px',
    height: '46px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    boxShadow: '0 8px 20px rgba(37, 99, 235, 0.4)',
  },
  brandName: {
    fontSize: '24px',
    fontWeight: 800,
    letterSpacing: '-0.03em',
    background: 'linear-gradient(to right, #ffffff, #93c5fd)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  brandTagline: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: 600,
    marginTop: '2px',
  },
  heroContent: {
    marginBottom: '32px',
  },
  heroHeadline: {
    fontSize: '34px',
    fontWeight: 800,
    lineHeight: '1.25',
    letterSpacing: '-0.03em',
    color: '#f8fafc',
    marginBottom: '16px',
  },
  heroDescription: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#94a3b8',
    marginBottom: '28px',
  },
  featurePillsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '14px',
  },
  featurePill: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '14px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(12px)',
  },
  pillIcon: {
    fontSize: '18px',
    backgroundColor: 'rgba(37, 99, 235, 0.15)',
    padding: '6px',
    borderRadius: '8px',
  },
  pillTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#e2e8f0',
  },
  pillDesc: {
    fontSize: '11px',
    color: '#94a3b8',
    marginTop: '2px',
  },
  heroFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '24px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  },
  statItem: {
    display: 'flex',
    flexDirection: 'column',
  },
  statNumber: {
    fontSize: '18px',
    fontWeight: 800,
    color: '#38bdf8',
  },
  statLabel: {
    fontSize: '11px',
    color: '#64748b',
    fontWeight: 600,
  },
  statDivider: {
    width: '1px',
    height: '28px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  authCardWrapper: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
  },
  authCard: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: '20px',
    padding: '36px 32px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(20px)',
  },
  tabContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    backgroundColor: 'rgba(2, 6, 23, 0.6)',
    padding: '4px',
    borderRadius: '12px',
    marginBottom: '20px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
  },
  tabButton: {
    padding: '10px 14px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#94a3b8',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    textAlign: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
  },
  demoBanner: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '10px',
    marginBottom: '18px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  demoSparkle: {
    fontSize: '16px',
  },
  demoText: {
    fontSize: '12px',
    color: '#34d399',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    color: '#f87171',
    padding: '12px 14px',
    borderRadius: '10px',
    fontSize: '12px',
    marginBottom: '18px',
    lineHeight: '1.4',
  },
  successAlert: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.35)',
    color: '#34d399',
    padding: '12px 14px',
    borderRadius: '10px',
    fontSize: '12px',
    marginBottom: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  inputLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: '#cbd5e1',
    letterSpacing: '0.01em',
  },
  passwordHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  showPasswordBtn: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#60a5fa',
    cursor: 'pointer',
  },
  textInput: {
    padding: '12px 14px',
    backgroundColor: 'rgba(2, 6, 23, 0.5)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '10px',
    fontSize: '14px',
    color: '#ffffff',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  submitBtn: {
    marginTop: '6px',
    padding: '13px',
    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 700,
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 10px 20px -5px rgba(37, 99, 235, 0.4)',
    transition: 'transform 0.15s, box-shadow 0.15s',
  },
  spinnerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  securityFooter: {
    marginTop: '24px',
    paddingTop: '18px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  securityTag: {
    fontSize: '11px',
    color: '#64748b',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
  },
  irdBadge: {
    fontSize: '10px',
    color: '#475569',
  },
};
