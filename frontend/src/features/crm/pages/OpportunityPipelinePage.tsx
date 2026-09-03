import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { crmService } from '../services/crmService';
import { Opportunity } from '../types/crm';
import { formatDecimal } from '../../../utils/decimal';

const STAGES = [
  { key: 'prospecting', label: 'Prospecting' },
  { key: 'qualification', label: 'Qualification' },
  { key: 'proposal', label: 'Proposal Sent' },
  { key: 'negotiation', label: 'Negotiation' },
  { key: 'closed_won', label: 'Closed Won' },
  { key: 'closed_lost', label: 'Closed Lost' },
];

export const OpportunityPipelinePage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);

  const fetchOpportunities = async () => {
    if (!currentOrg?._id) return;
    try {
      const data = await crmService.getOpportunities(currentOrg._id);
      setOpportunities(data);
    } catch (e) {
      console.error('Failed to load opportunities', e);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, [currentOrg?._id]);

  const handleStageChange = async (oppId: string, newStage: string) => {
    if (!currentOrg?._id) return;
    await crmService.updateOpportunityStage(currentOrg._id, oppId, newStage);
    fetchOpportunities();
  };

  const totalWeighted = opportunities.reduce(
    (sum, o) => sum + (parseFloat(o.weightedRevenue?.toString() || '0') || 0),
    0
  );

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Sales Opportunities & Kanban Pipeline</h1>
          <p style={styles.subtitle}>
            Visual deal flow, weighted probability revenue, and sales representative quotas.
          </p>
        </div>
        <div style={styles.summaryBadge}>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>WEIGHTED PIPELINE VALUE</span>
          <span style={{ fontSize: '18px', fontWeight: 800, color: '#1e3a8a' }}>
            NPR {totalWeighted.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div style={styles.kanbanGrid}>
        {STAGES.map((stg) => {
          const stageOpps = opportunities.filter((o) => o.stage === stg.key);
          const stageTotal = stageOpps.reduce(
            (sum, o) => sum + (parseFloat(o.expectedRevenue?.toString() || '0') || 0),
            0
          );
          return (
            <div key={stg.key} style={styles.column}>
              <div style={styles.colHeader}>
                <div>
                  <strong>{stg.label}</strong>
                  <span style={styles.countBadge}>{stageOpps.length}</span>
                </div>
                <div style={styles.colSubtotal}>NPR {stageTotal.toLocaleString()}</div>
              </div>

              <div style={styles.cardList}>
                {stageOpps.map((opp) => (
                  <div key={opp._id} style={styles.dealCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '11px', fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                        {opp.opportunityNumber}
                      </span>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669' }}>
                        {opp.probability}%
                      </span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '13px', margin: '4px 0' }}>{opp.title}</div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {opp.customerId?.name || 'Customer'}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 800, marginTop: '6px' }}>
                      NPR {formatDecimal(opp.expectedRevenue)}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                        {opp.salesOwner?.fullName || 'Rep'}
                      </span>
                      <select
                        value={opp.stage}
                        onChange={(e) => handleStageChange(opp._id, e.target.value)}
                        style={styles.stageSelect}
                      >
                        {STAGES.map((s) => (
                          <option key={s.key} value={s.key}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
                {stageOpps.length === 0 && (
                  <div style={styles.emptyCol}>No opportunities</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  summaryBadge: { backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  kanbanGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px', alignItems: 'start', overflowX: 'auto' },
  column: { backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' },
  colHeader: { display: 'flex', flexDirection: 'column', gap: '2px', borderBottom: '1px solid #cbd5e1', paddingBottom: '6px' },
  countBadge: { fontSize: '10px', fontWeight: 800, backgroundColor: '#cbd5e1', padding: '1px 6px', borderRadius: '10px', marginLeft: '6px' },
  colSubtotal: { fontSize: '11px', fontWeight: 700, color: '#475569' },
  cardList: { display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '200px' },
  dealCard: { backgroundColor: '#ffffff', borderRadius: '6px', border: '1px solid #e2e8f0', padding: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' },
  stageSelect: { fontSize: '10px', padding: '2px', borderRadius: '4px', border: '1px solid #cbd5e1' },
  emptyCol: { textAlign: 'center', color: '#94a3b8', fontSize: '11px', marginTop: '30px' },
};
