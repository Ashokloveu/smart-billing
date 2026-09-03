import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { crmService } from '../services/crmService';
import { Lead } from '../types/crm';
import { formatDecimal } from '../../../utils/decimal';

export const LeadManagementPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchLeads = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const res = await crmService.getLeads(currentOrg._id, {
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setLeads(res.items);
    } catch (e) {
      console.error('Failed to load leads', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [currentOrg?._id, statusFilter]);

  const handleConvert = async (id: string) => {
    if (!currentOrg?._id) return;
    if (!window.confirm('Convert this lead to a permanent customer and create an initial sales opportunity?')) {
      return;
    }
    await crmService.convertLead(currentOrg._id, id);
    alert('Lead converted to Customer & Sales Opportunity successfully!');
    fetchLeads();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Lead Management & Inbound Pipeline</h1>
          <p style={styles.subtitle}>
            Capture inbound inquiries, track sources, round-robin assignments, and convert to permanent customers.
          </p>
        </div>
      </div>

      <div style={styles.filterBar}>
        <input
          type="text"
          placeholder="Search by company, contact person, email, or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchLeads()}
          style={styles.searchInput}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={styles.selectFilter}
        >
          <option value="">All Statuses</option>
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="qualified">Qualified</option>
          <option value="proposal_sent">Proposal Sent</option>
          <option value="negotiation">Negotiation</option>
          <option value="won">Won (Converted)</option>
          <option value="lost">Lost</option>
        </select>
        <button onClick={fetchLeads} style={styles.searchBtn}>
          🔍 Search
        </button>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Lead #</th>
              <th style={styles.th}>Company / Prospect</th>
              <th style={styles.th}>Source</th>
              <th style={styles.th}>Assigned Rep</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Est. Value (NPR)</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l._id} style={styles.tr}>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                  {l.leadNumber}
                </td>
                <td style={styles.td}>
                  <strong>{l.companyName}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{l.contactPerson} • {l.phone}</div>
                </td>
                <td style={styles.td}><span style={styles.sourcePill}>{l.source.toUpperCase()}</span></td>
                <td style={styles.td}>{l.assignedTo?.fullName || 'Unassigned'}</td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>
                  NPR {formatDecimal(l.estimatedValue)}
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusPill,
                      backgroundColor:
                        l.status === 'won'
                          ? '#ecfdf5'
                          : l.status === 'lost'
                          ? '#fef2f2'
                          : '#eff6ff',
                      color:
                        l.status === 'won'
                          ? '#059669'
                          : l.status === 'lost'
                          ? '#dc2626'
                          : '#1e3a8a',
                    }}
                  >
                    {l.status.replace('_', ' ').toUpperCase()}
                  </span>
                </td>
                <td style={styles.td}>
                  {l.status !== 'won' && l.status !== 'lost' && (
                    <button style={styles.actionBtn} onClick={() => handleConvert(l._id)}>
                      ⚡ Convert to Customer
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {leads.length === 0 && !loading && (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                  No lead records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  filterBar: { display: 'flex', gap: '10px' },
  searchInput: { flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  selectFilter: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  searchBtn: { padding: '8px 14px', borderRadius: '6px', backgroundColor: '#1e3a8a', color: '#ffffff', border: 'none', fontWeight: 700, cursor: 'pointer' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: '13px' },
  statusPill: { fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' },
  sourcePill: { fontSize: '10px', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 6px', borderRadius: '4px' },
  actionBtn: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' },
};
