import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import {
  complianceService,
  VatSalesRegisterResponse,
  VatPurchaseRegisterResponse,
} from '../services/complianceService';

export const VatRegisterPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [activeTab, setActiveTab] = useState<'sales_book' | 'purchase_book' | 'sequences' | 'audit_logs'>('sales_book');

  const [salesRegister, setSalesRegister] = useState<VatSalesRegisterResponse | null>(null);
  const [purchaseRegister, setPurchaseRegister] = useState<VatPurchaseRegisterResponse | null>(null);
  const [sequences, setSequences] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchData = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      if (activeTab === 'sales_book') {
        const res = await complianceService.getSalesRegister(currentOrg._id, { startDate, endDate });
        setSalesRegister(res);
      } else if (activeTab === 'purchase_book') {
        const res = await complianceService.getPurchaseRegister(currentOrg._id, { startDate, endDate });
        setPurchaseRegister(res);
      } else if (activeTab === 'sequences') {
        const res = await complianceService.getSequences(currentOrg._id);
        setSequences(res);
      } else if (activeTab === 'audit_logs') {
        const res = await complianceService.getAuditLogs(currentOrg._id);
        setAuditLogs(res.items);
      }
    } catch (e) {
      console.error('Failed to load compliance data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrg?._id, activeTab, startDate, endDate]);

  const exportCsv = (rows: any[], filename: string) => {
    if (!rows.length) return;
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      '\n' +
      rows
        .map((row) =>
          keys
            .map((k) => {
              let cell = row[k] === null || row[k] === undefined ? '' : row[k];
              cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""');
              if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
              return cell;
            })
            .join(separator)
        )
        .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={styles.container}>
      {/* Top Title Bar */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>🇳🇵 Nepal Tax & Statutory Invoice Compliance</h1>
          <p style={styles.subtitle}>
            Nepal VAT Act 2052 Annex 5 (Sales Book), Annex 7/8 (Purchase Book), Document Sequences, and Audit Trails.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          {activeTab === 'sales_book' && salesRegister && (
            <button
              style={styles.btnSecondary}
              onClick={() => exportCsv(salesRegister.rows, `Nepal_Sales_Book_Annex_5_${currentOrg?.taxRegistration?.number}`)}
            >
              📥 Export Annex 5 CSV
            </button>
          )}
          {activeTab === 'purchase_book' && purchaseRegister && (
            <button
              style={styles.btnSecondary}
              onClick={() => exportCsv(purchaseRegister.rows, `Nepal_Purchase_Book_Annex_7_${currentOrg?.taxRegistration?.number}`)}
            >
              📥 Export Purchase CSV
            </button>
          )}
          <button style={styles.btnPrimary} onClick={() => window.print()}>
            🖨️ Print Statutory Register
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={styles.tabsNav}>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'sales_book' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('sales_book')}
        >
          📜 अनुसूची ९: बिक्री खाता (Annex 9: Sales Register)
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'purchase_book' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('purchase_book')}
        >
          📥 अनुसूची ८: खरिद खाता (Annex 8: Purchase Register)
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'sequences' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('sequences')}
        >
          🔢 कर बिजक नम्बर प्रणाली (Invoice Sequences)
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'audit_logs' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('audit_logs')}
        >
          🛡️ Financial Activity Audit Trail
        </button>
      </div>

      {/* Date Filter Toolbar for Registers */}
      {(activeTab === 'sales_book' || activeTab === 'purchase_book') && (
        <div style={styles.filterBar}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div>
              <label style={styles.filterLabel}>From Date:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={styles.dateInput} />
            </div>
            <div>
              <label style={styles.filterLabel}>To Date:</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={styles.dateInput} />
            </div>
            {(startDate || endDate) && (
              <button
                style={{ ...styles.btnSecondary, alignSelf: 'flex-end', height: '36px' }}
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab 1: Annex 5 Sales Book */}
      {activeTab === 'sales_book' && salesRegister && (
        <div style={styles.card}>
          <div style={styles.regHeader}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>अनुसूची ९: बिक्री खाता (Annex 9: Sales Book / Bikri Khata)</h2>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                करदाता दर्ता नं (PAN): <strong>{salesRegister.organizationPan}</strong> | करदाताको नाम:{' '}
                <strong>{salesRegister.organizationName}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={styles.periodPill}>{salesRegister.periodLabel}</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>मिति (BS)</th>
                  <th style={styles.th}>बिजक नं. (Invoice #)</th>
                  <th style={styles.th}>खरिदकर्ताको नाम (Buyer)</th>
                  <th style={styles.th}>PAN No.</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>कुल बिक्री (Total)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>कर छुट (Exempt)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>करयोग्य (Taxable)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>१३% भ्याट (VAT)</th>
                </tr>
              </thead>
              <tbody>
                {salesRegister.rows.map((row, idx) => (
                  <tr key={idx} style={{ ...styles.tr, ...(row.isCancelled ? { opacity: 0.5, textDecoration: 'line-through' } : {}) }}>
                    <td style={styles.td}>
                      <strong>{row.bsDate}</strong>
                    </td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                      {row.documentNumber}
                    </td>
                    <td style={styles.td}>{row.buyerName}</td>
                    <td style={{ ...styles.td, fontFamily: 'monospace' }}>{row.buyerPan || '-'}</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                      {row.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      {row.exemptSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                      {row.taxableSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                      {row.vatCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr style={styles.totalRow}>
                  <td colSpan={4} style={{ ...styles.td, fontWeight: 800 }}>
                    जम्मा कुल जोड (TOTALS):
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800 }}>
                    NPR {salesRegister.totals.totalSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800 }}>
                    NPR {salesRegister.totals.exemptSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800 }}>
                    NPR {salesRegister.totals.taxableSales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                    NPR {salesRegister.totals.vatCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Purchase Book */}
      {activeTab === 'purchase_book' && purchaseRegister && (
        <div style={styles.card}>
          <div style={styles.regHeader}>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>अनुसूची ८: खरिद खाता (Annex 8: Purchase Book / Kharid Khata)</h2>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                करदाता दर्ता नं (PAN): <strong>{purchaseRegister.organizationPan}</strong> | करदाताको नाम:{' '}
                <strong>{purchaseRegister.organizationName}</strong>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={styles.periodPill}>{purchaseRegister.periodLabel}</span>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>मिति (BS)</th>
                  <th style={styles.th}>बिल नं. (Bill #)</th>
                  <th style={styles.th}>आपूर्तिकर्ताको नाम (Supplier)</th>
                  <th style={styles.th}>Supplier PAN</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>कुल खरिद (Total)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>कर छुट (Exempt)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>करयोग्य (Taxable)</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>१३% भ्याट (VAT Paid)</th>
                </tr>
              </thead>
              <tbody>
                {purchaseRegister.rows.map((row, idx) => (
                  <tr key={idx} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{row.bsDate}</strong>
                    </td>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                      {row.documentNumber}
                    </td>
                    <td style={styles.td}>{row.supplierName}</td>
                    <td style={{ ...styles.td, fontFamily: 'monospace' }}>{row.supplierPan || '-'}</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                      {row.totalPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right' }}>
                      {row.exemptPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 600 }}>
                      {row.taxablePurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                      {row.vatPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                <tr style={styles.totalRow}>
                  <td colSpan={4} style={{ ...styles.td, fontWeight: 800 }}>
                    जम्मा कुल जोड (TOTALS):
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800 }}>
                    NPR {purchaseRegister.totals.totalPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800 }}>
                    NPR {purchaseRegister.totals.exemptPurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800 }}>
                    NPR {purchaseRegister.totals.taxablePurchases.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ ...styles.td, textAlign: 'right', fontWeight: 800, color: '#059669' }}>
                    NPR {purchaseRegister.totals.vatPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Configurable Numbering Sequences */}
      {activeTab === 'sequences' && (
        <div style={styles.card}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>Invoice & Document Numbering Sequences</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
            Configurable continuous serial numbering per branch and fiscal period as mandated by Nepal tax guidelines.
          </p>

          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Document Type</th>
                <th style={styles.th}>Firm / Branch</th>
                <th style={styles.th}>Fiscal Period</th>
                <th style={styles.th}>Current Prefix</th>
                <th style={{ ...styles.th, textAlign: 'right' }}>Next Serial #</th>
              </tr>
            </thead>
            <tbody>
              {sequences.map((seq) => (
                <tr key={seq._id} style={styles.tr}>
                  <td style={{ ...styles.td, fontWeight: 700, textTransform: 'uppercase' }}>{seq.type.replace('_', ' ')}</td>
                  <td style={styles.td}>{seq.firmId?.name || 'All Firms'}</td>
                  <td style={styles.td}>{seq.financialYearId?.label || '-'}</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>{seq.prefix}</td>
                  <td style={{ ...styles.td, textAlign: 'right', fontFamily: 'monospace', fontWeight: 800 }}>{seq.nextNumber}</td>
                </tr>
              ))}
              {sequences.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                    No custom sequences recorded. Default system prefixes (INV, POS, BILL, JV) are active.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab 4: Financial Activity Audit Logs */}
      {activeTab === 'audit_logs' && (
        <div style={styles.card}>
          <h3 style={{ fontSize: '15px', fontWeight: 800, margin: '0 0 14px 0' }}>Financial Activity Audit Trail</h3>
          <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px' }}>
            Immutable audit log capturing actor, timestamp, IP address, and financial state transitions.
          </p>

          <table style={styles.table}>
            <thead>
              <tr style={styles.thRow}>
                <th style={styles.th}>Timestamp</th>
                <th style={styles.th}>Actor</th>
                <th style={styles.th}>Action</th>
                <th style={styles.th}>Entity</th>
                <th style={styles.th}>Document Ref</th>
                <th style={styles.th}>Client IP</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log) => (
                <tr key={log._id} style={styles.tr}>
                  <td style={{ ...styles.td, fontSize: '12px', color: '#64748b' }}>
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td style={styles.td}>
                    <strong>{log.userId?.fullName || 'System'}</strong>
                  </td>
                  <td style={styles.td}>
                    <span style={styles.actionPill}>{log.action}</span>
                  </td>
                  <td style={{ ...styles.td, textTransform: 'uppercase', fontSize: '11px' }}>{log.entityType}</td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                    {log.referenceDocument || '-'}
                  </td>
                  <td style={{ ...styles.td, fontFamily: 'monospace', fontSize: '11px', color: '#64748b' }}>
                    {log.ipAddress || 'internal'}
                  </td>
                </tr>
              ))}
              {auditLogs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                    No audit log events recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  btnPrimary: { backgroundColor: '#1e3a8a', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' },
  btnSecondary: { backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', border: '1px solid #cbd5e1', cursor: 'pointer' },
  tabsNav: { display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' },
  navBtn: { padding: '8px 14px', borderRadius: '6px', border: 'none', background: 'none', fontSize: '13px', fontWeight: 700, color: '#64748b', cursor: 'pointer' },
  activeNavBtn: { backgroundColor: '#1e3a8a', color: '#ffffff' },
  filterBar: { backgroundColor: '#ffffff', padding: '12px 18px', borderRadius: '8px', border: '1px solid #e2e8f0' },
  filterLabel: { fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' },
  dateInput: { padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' },
  regHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #0f172a', paddingBottom: '12px', marginBottom: '16px' },
  periodPill: { fontSize: '11px', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1e3a8a', padding: '4px 10px', borderRadius: '6px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: '13px' },
  totalRow: { backgroundColor: '#f8fafc', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a' },
  actionPill: { fontSize: '10px', fontWeight: 800, backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 6px', borderRadius: '4px' },
};
