import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { crmService } from '../services/crmService';
import { Customer360 } from '../types/crm';
import { formatDecimal } from '../../../utils/decimal';
import { apiClient } from '../../../services/apiClient';

export const Customer360ViewPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [parties, setParties] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [c360, setC360] = useState<Customer360 | null>(null);

  useEffect(() => {
    const fetchCustomers = async () => {
      if (!currentOrg?._id) return;
      try {
        const res = await apiClient.get(`/organizations/${currentOrg._id}/parties`, { params: { type: 'customer' } });
        const list = res.data.data?.parties || res.data.data || [];
        setParties(list);
        if (list.length > 0) {
          setSelectedCustomerId(list[0]._id);
        }
      } catch (e) {
        console.error('Failed to load customers', e);
      }
    };
    fetchCustomers();
  }, [currentOrg?._id]);

  useEffect(() => {
    const fetch360 = async () => {
      if (!currentOrg?._id || !selectedCustomerId) return;
      try {
        const data = await crmService.getCustomer360(currentOrg._id, selectedCustomerId);
        setC360(data);
      } catch (e) {
        console.error('Failed to load Customer 360', e);
      }
    };
    fetch360();
  }, [currentOrg?._id, selectedCustomerId]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Customer 360° Intelligence View</h1>
          <p style={styles.subtitle}>
            Unified customer profile merging invoices, available credit, active opportunities, and interaction timeline.
          </p>
        </div>
        <div>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            style={styles.customerSelect}
          >
            {parties.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} {p.panNumber ? `(PAN: ${p.panNumber})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {c360 && (
        <>
          <div style={styles.kpiGrid}>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>CREDIT LIMIT</span>
              <span style={styles.kpiValue}>NPR {c360.credit.creditLimit.toLocaleString()}</span>
              <span style={styles.kpiSub}>Authorized credit</span>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>CURRENT OUTSTANDING</span>
              <span style={{ ...styles.kpiValue, color: c360.credit.status === 'breached' ? '#dc2626' : '#0f172a' }}>
                NPR {c360.credit.currentBalance.toLocaleString()}
              </span>
              <span style={styles.kpiSub}>{c360.credit.status === 'breached' ? '⚠️ CREDIT BREACHED' : 'Within Limit'}</span>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>AVAILABLE CREDIT</span>
              <span style={{ ...styles.kpiValue, color: '#059669' }}>
                NPR {c360.credit.availableCredit.toLocaleString()}
              </span>
              <span style={styles.kpiSub}>Ready for new orders</span>
            </div>
            <div style={styles.kpiCard}>
              <span style={styles.kpiLabel}>LIFETIME TRANSACTIONS</span>
              <span style={{ ...styles.kpiValue, color: '#1e3a8a' }}>{c360.invoices.length}</span>
              <span style={styles.kpiSub}>Issued Tax Invoices</span>
            </div>
          </div>

          <div style={styles.grid2}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📑 Recent Tax Invoices & Sales</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                {c360.invoices.map((inv) => (
                  <div key={inv._id} style={styles.listRow}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                        {inv.documentNumber}
                      </span>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {new Date(inv.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong>NPR {formatDecimal(inv.grandTotal)}</strong>
                      <div style={{ fontSize: '11px', color: '#059669' }}>{inv.status.toUpperCase()}</div>
                    </div>
                  </div>
                ))}
                {c360.invoices.length === 0 && (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No invoice history</div>
                )}
              </div>
            </div>

            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📜 Quotations & Proposals</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '14px' }}>
                {c360.quotations.map((quo) => (
                  <div key={quo._id} style={styles.listRow}>
                    <div>
                      <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                        {quo.quotationNumber}
                      </span>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        Valid until {new Date(quo.validUntil).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong>NPR {formatDecimal(quo.grandTotal)}</strong>
                      <div style={{ fontSize: '11px', color: '#1e3a8a' }}>{quo.status.toUpperCase()}</div>
                    </div>
                  </div>
                ))}
                {c360.quotations.length === 0 && (
                  <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>No quotation records</div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  customerSelect: { padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 700 },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' },
  kpiCard: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', display: 'flex', flexDirection: 'column', gap: '4px' },
  kpiLabel: { fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' },
  kpiValue: { fontSize: '22px', fontWeight: 800, color: '#0f172a' },
  kpiSub: { fontSize: '11px', color: '#94a3b8' },
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '8px' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' },
  cardTitle: { fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 },
  listRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', backgroundColor: '#f8fafc', borderRadius: '6px' },
};
