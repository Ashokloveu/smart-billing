import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../stores/orgStore';
import { apiClient } from '../../services/apiClient';
import { Firm, FiscalPeriod, TaxPolicy } from '../../types/master';
import { formatDecimal } from '../../utils/decimal';

export const SettingsPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [firms, setFirms] = useState<Firm[]>([]);
  const [fiscalPeriods, setFiscalPeriods] = useState<FiscalPeriod[]>([]);
  const [taxPolicies, setTaxPolicies] = useState<TaxPolicy[]>([]);

  // New Firm state
  const [firmName, setFirmName] = useState('');
  const [firmCode, setFirmCode] = useState('');
  const [firmPhone, setFirmPhone] = useState('');
  const firmCity = 'Kathmandu';

  // New Fiscal Period state
  const [fpLabel, setFpLabel] = useState('');
  const [fpBsStart, setFpBsStart] = useState('2083-04-01');
  const [fpBsEnd, setFpBsEnd] = useState('2084-03-31');

  const fetchData = async () => {
    if (!currentOrg?._id) return;
    try {
      const [fRes, fpRes, tRes] = await Promise.all([
        apiClient.get(`/organizations/${currentOrg._id}/firms`),
        apiClient.get(`/organizations/${currentOrg._id}/fiscal-years`),
        apiClient.get(`/organizations/${currentOrg._id}/tax-policies`),
      ]);
      setFirms(fRes.data.data);
      setFiscalPeriods(fpRes.data.data);
      setTaxPolicies(tRes.data.data);
    } catch (e) {
      console.error('Failed to load settings data', e);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrg?._id]);

  const handleAddFirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?._id) return;
    try {
      await apiClient.post(`/organizations/${currentOrg._id}/firms`, {
        name: firmName,
        code: firmCode,
        phone: firmPhone,
        address: { line1: 'Branch Office', city: firmCity, district: firmCity, province: 'Bagmati' },
      });
      setFirmName('');
      setFirmCode('');
      setFirmPhone('');
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error creating branch');
    }
  };

  const handleAddFiscalPeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentOrg?._id) return;
    try {
      await apiClient.post(`/organizations/${currentOrg._id}/fiscal-years`, {
        label: fpLabel,
        startDate: new Date('2026-07-16').toISOString(),
        endDate: new Date('2027-07-15').toISOString(),
        bsStartDate: fpBsStart,
        bsEndDate: fpBsEnd,
        isCurrent: true,
      });
      setFpLabel('');
      fetchData();
    } catch (e: any) {
      alert(e.response?.data?.message || 'Error creating fiscal year');
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <h1 style={styles.title}>Organization & Master Settings</h1>
        <p style={styles.subtitle}>
          Configure company details, physical branches, Nepal fiscal years and tax rules.
        </p>
      </div>

      <div style={styles.grid}>
        {/* Company Profile Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Company Tax Identity</h2>
          <div style={styles.detailRow}>
            <strong>Organization Name:</strong> <span>{currentOrg?.name || 'Kathmandu Trading House'}</span>
          </div>
          <div style={styles.detailRow}>
            <strong>Registration Type:</strong> <span>{currentOrg?.taxRegistration?.type || 'VAT'}</span>
          </div>
          <div style={styles.detailRow}>
            <strong>9-Digit PAN/VAT:</strong> <span>{currentOrg?.taxRegistration?.number || '601234567'}</span>
          </div>
          <div style={styles.detailRow}>
            <strong>Currency:</strong> <span>NPR (Nepalese Rupee)</span>
          </div>
          <div style={styles.detailRow}>
            <strong>Calendar Preference:</strong> <span>Bikram Sambat (BS) & Gregorian</span>
          </div>
        </div>

        {/* Tax Policies Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Configured Tax Policies</h2>
          <div style={styles.list}>
            {taxPolicies.map((t) => (
              <div key={t._id} style={styles.listItem}>
                <strong>{t.name}</strong>
                <span>
                  {formatDecimal(t.rate)}% ({t.taxType})
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branches & Firms Section */}
      <div style={{ ...styles.card, marginTop: '20px' }}>
        <h2 style={styles.cardTitle}>Physical Branch Locations (Firms)</h2>
        <div style={styles.branchContainer}>
          <div style={{ flex: 1 }}>
            <div style={styles.list}>
              {firms.map((f) => (
                <div key={f._id} style={styles.listItem}>
                  <div>
                    <strong>{f.name}</strong> ({f.code})
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      {f.address?.city}, {f.address?.district} • {f.phone}
                    </div>
                  </div>
                  {f.isHeadOffice && <span style={styles.headBadge}>Head Office</span>}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddFirm} style={styles.sideForm}>
            <h3 style={{ fontSize: '13px', fontWeight: 600 }}>+ Add Branch / Firm</h3>
            <input
              type="text"
              placeholder="Branch Name (e.g. Pokhara Branch)"
              value={firmName}
              onChange={(e) => setFirmName(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Branch Code (e.g. PKR-01)"
              value={firmCode}
              onChange={(e) => setFirmCode(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Contact Phone"
              value={firmPhone}
              onChange={(e) => setFirmPhone(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" style={styles.btnPrimary}>
              Save Branch
            </button>
          </form>
        </div>
      </div>

      {/* Fiscal Periods Section */}
      <div style={{ ...styles.card, marginTop: '20px' }}>
        <h2 style={styles.cardTitle}>Nepali Fiscal Periods (Shrawan - Ashad)</h2>
        <div style={styles.branchContainer}>
          <div style={{ flex: 1 }}>
            <div style={styles.list}>
              {fiscalPeriods.map((fp) => (
                <div key={fp._id} style={styles.listItem}>
                  <div>
                    <strong>{fp.label}</strong>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      BS: {fp.bsStartDate} to {fp.bsEndDate}
                    </div>
                  </div>
                  {fp.isCurrent && <span style={styles.activeBadge}>Active Year</span>}
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleAddFiscalPeriod} style={styles.sideForm}>
            <h3 style={{ fontSize: '13px', fontWeight: 600 }}>+ Add Fiscal Year</h3>
            <input
              type="text"
              placeholder="Label (e.g. 2083/84 BS)"
              value={fpLabel}
              onChange={(e) => setFpLabel(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="text"
              placeholder="BS Start (e.g. 2083-04-01)"
              value={fpBsStart}
              onChange={(e) => setFpBsStart(e.target.value)}
              required
              style={styles.input}
            />
            <input
              type="text"
              placeholder="BS End (e.g. 2084-03-31)"
              value={fpBsEnd}
              onChange={(e) => setFpBsEnd(e.target.value)}
              required
              style={styles.input}
            />
            <button type="submit" style={styles.btnPrimary}>
              Save Fiscal Year
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: { marginBottom: '20px' },
  title: { fontSize: '20px', fontWeight: 700, color: '#0f172a' },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '2px' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' },
  card: { backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', padding: '20px' },
  cardTitle: { fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' },
  detailRow: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 0', borderBottom: '1px solid #f1f5f9' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  listItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: '6px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '13px' },
  branchContainer: { display: 'flex', gap: '24px' },
  sideForm: { width: '280px', display: 'flex', flexDirection: 'column', gap: '10px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid #e2e8f0' },
  input: { padding: '7px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12px' },
  btnPrimary: { backgroundColor: '#1e3a8a', color: '#ffffff', padding: '8px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600 },
  headBadge: { fontSize: '11px', fontWeight: 600, color: '#0284c7', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '4px' },
  activeBadge: { fontSize: '11px', fontWeight: 600, color: '#059669', backgroundColor: '#ecfdf5', padding: '3px 8px', borderRadius: '4px' },
};
