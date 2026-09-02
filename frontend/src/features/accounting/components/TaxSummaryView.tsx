import React, { useEffect, useState } from 'react';
import { TaxSummaryReport } from '../types/accounting';
import { accountingService } from '../services/accountingService';
import { useOrgStore } from '../../../stores/orgStore';

export const TaxSummaryView: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [taxReport, setTaxReport] = useState<TaxSummaryReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTaxReport = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const res = await accountingService.getTaxSummary(currentOrg._id);
      setTaxReport(res);
    } catch (e) {
      console.error('Failed to load tax report', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxReport();
  }, [currentOrg?._id]);

  if (loading || !taxReport) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Nepal IRD VAT Summary...</div>;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>🇳🇵 Nepal IRD Tax & VAT Summary (Annex 5 Prep)</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748b' }}>
            Consolidated Output VAT liability, claimable Input VAT, and TDS withholding positions.
          </p>
        </div>
        <button style={styles.printBtn} onClick={() => window.print()}>
          🖨️ Print Tax Return
        </button>
      </div>

      <div style={styles.grid}>
        {/* Output VAT Column */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Sales & Output VAT Collected</h3>
          <div style={styles.row}>
            <span>Total Taxable Sales (13%):</span>
            <strong>NPR {taxReport.taxableSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={styles.row}>
            <span>Tax-Exempt Sales:</span>
            <strong>NPR {taxReport.exemptSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={{ ...styles.row, ...styles.highlightRow, color: '#1e3a8a' }}>
            <span>Output VAT Liability (2120):</span>
            <strong>NPR {taxReport.outputVatCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>

        {/* Input VAT Column */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>Purchases & Input VAT Claimable</h3>
          <div style={styles.row}>
            <span>Total Taxable Purchases:</span>
            <strong>NPR {taxReport.taxablePurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={styles.row}>
            <span>Tax-Exempt Purchases:</span>
            <strong>NPR {taxReport.exemptPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
          <div style={{ ...styles.row, ...styles.highlightRow, color: '#059669' }}>
            <span>Claimable Input VAT Credit (1150):</span>
            <strong>NPR {taxReport.inputVatClaimable.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
          </div>
        </div>
      </div>

      {/* Net Payable Banner */}
      <div style={styles.netCard}>
        <div>
          <span style={{ fontSize: '12px', textTransform: 'uppercase', fontWeight: 700, color: '#64748b' }}>
            Net Nepal IRD VAT Position (Output VAT - Input VAT)
          </span>
          <div style={{ fontSize: '24px', fontWeight: 800, color: taxReport.netVatPayable >= 0 ? '#dc2626' : '#059669' }}>
            {taxReport.netVatPayable >= 0 ? 'NET VAT PAYABLE TO IRD: ' : 'NET VAT REFUNDABLE / CREDIT: '}
            NPR {Math.abs(taxReport.netVatPayable).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>TDS Withheld Payable (2130):</span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
            NPR {taxReport.tdsWithheldPayable.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '20px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  printBtn: { padding: '8px 14px', borderRadius: '6px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  cardTitle: { fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0', borderBottom: '1px solid #f1f5f9', paddingBottom: '8px' },
  row: { display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#334155' },
  highlightRow: { borderTop: '2px solid #e2e8f0', paddingTop: '10px', marginTop: '6px', fontSize: '15px' },
  netCard: { backgroundColor: '#ffffff', borderRadius: '10px', border: '2px solid #0f172a', padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
};
