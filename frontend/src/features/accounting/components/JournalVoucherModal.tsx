import React, { useState } from 'react';
import { Account } from '../types/accounting';
import { Firm, FiscalPeriod } from '../../../types/master';

interface JournalVoucherModalProps {
  accounts: Account[];
  firms: Firm[];
  fiscalYears: FiscalPeriod[];
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
}

export const JournalVoucherModal: React.FC<JournalVoucherModalProps> = ({
  accounts,
  firms,
  fiscalYears,
  onClose,
  onSubmit,
}) => {
  const [firmId, setFirmId] = useState(firms.length > 0 ? firms[0]._id : '');
  const [financialYearId, setFinancialYearId] = useState(fiscalYears.length > 0 ? fiscalYears[0]._id : '');
  const [bsDate, setBsDate] = useState('2082-05-18');
  const [narration, setNarration] = useState('');
  const [sourceModule, setSourceModule] = useState('manual');
  const [sourceDocumentNumber, setSourceDocumentNumber] = useState('');
  const [status, setStatus] = useState<'draft' | 'posted'>('posted');

  const [lines, setLines] = useState<Array<{ accountId: string; debit: string; credit: string; narration: string }>>([
    { accountId: accounts[0]?._id || '', debit: '0.00', credit: '0.00', narration: '' },
    { accountId: accounts[1]?._id || '', debit: '0.00', credit: '0.00', narration: '' },
  ]);

  const handleLineChange = (index: number, field: string, value: string) => {
    const updated = [...lines];
    (updated[index] as any)[field] = value;
    setLines(updated);
  };

  const addLine = () => {
    setLines([...lines, { accountId: accounts[0]?._id || '', debit: '0.00', credit: '0.00', narration: '' }]);
  };

  const removeLine = (idx: number) => {
    if (lines.length <= 2) return;
    setLines(lines.filter((_, i) => i !== idx));
  };

  const totalDebit = lines.reduce((acc, l) => acc + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((acc, l) => acc + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBalanced && status === 'posted') {
      alert('Total Debits must equal Total Credits before posting.');
      return;
    }

    await onSubmit({
      firmId,
      financialYearId,
      bsDate,
      narration,
      status,
      sourceModule,
      sourceDocumentNumber: sourceDocumentNumber || undefined,
      lines,
    });
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>New General Journal Voucher</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={styles.grid}>
            <div>
              <label style={styles.label}>Firm / Branch</label>
              <select value={firmId} onChange={(e) => setFirmId(e.target.value)} style={styles.input}>
                {firms.map((f) => (
                  <option key={f._id} value={f._id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={styles.label}>Fiscal Period</label>
              <select value={financialYearId} onChange={(e) => setFinancialYearId(e.target.value)} style={styles.input}>
                {fiscalYears.map((fy) => (
                  <option key={fy._id} value={fy._id}>
                    {fy.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={styles.label}>Nepali Date (BS)</label>
              <input type="text" value={bsDate} onChange={(e) => setBsDate(e.target.value)} style={styles.input} />
            </div>
            <div>
              <label style={styles.label}>Source Module</label>
              <select value={sourceModule} onChange={(e) => setSourceModule(e.target.value)} style={styles.input}>
                <option value="manual">Manual Adjustment</option>
                <option value="expense">Direct Expense</option>
                <option value="sales">Sales Correction</option>
                <option value="purchase">Purchase Correction</option>
                <option value="inventory">Inventory Valuation</option>
              </select>
            </div>
            <div>
              <label style={styles.label}>Ref Document # (Optional)</label>
              <input
                type="text"
                placeholder="e.g. INV-0012, ADJ-004"
                value={sourceDocumentNumber}
                onChange={(e) => setSourceDocumentNumber(e.target.value)}
                style={styles.input}
              />
            </div>
          </div>

          <div>
            <label style={styles.label}>Voucher Narration / Description</label>
            <input
              required
              type="text"
              placeholder="e.g. Adjustment for office petty cash replenishment"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              style={styles.input}
            />
          </div>

          {/* Lines Table */}
          <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>Double-Entry Journal Lines</h4>
              <button type="button" onClick={addLine} style={styles.addLineBtn}>
                + Add Entry Line
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lines.map((line, idx) => (
                <div key={idx} style={styles.lineRow}>
                  <select
                    value={line.accountId}
                    onChange={(e) => handleLineChange(idx, 'accountId', e.target.value)}
                    style={{ ...styles.input, flex: 3 }}
                  >
                    {accounts.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.code} - {a.name} ({a.type.toUpperCase()})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Debit"
                    value={line.debit}
                    onChange={(e) => handleLineChange(idx, 'debit', e.target.value)}
                    style={{ ...styles.input, flex: 1 }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Credit"
                    value={line.credit}
                    onChange={(e) => handleLineChange(idx, 'credit', e.target.value)}
                    style={{ ...styles.input, flex: 1 }}
                  />
                  <input
                    type="text"
                    placeholder="Line Narration"
                    value={line.narration}
                    onChange={(e) => handleLineChange(idx, 'narration', e.target.value)}
                    style={{ ...styles.input, flex: 2 }}
                  />
                  <button type="button" onClick={() => removeLine(idx)} style={styles.removeBtn}>
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Balance Equilibrium Bar */}
          <div
            style={{
              ...styles.balanceBar,
              backgroundColor: isBalanced ? '#ecfdf5' : '#fef2f2',
              borderColor: isBalanced ? '#a7f3d0' : '#fecaca',
            }}
          >
            <div>
              <span>Total Debit: </span>
              <strong>NPR {totalDebit.toFixed(2)}</strong>
            </div>
            <div>
              <span>Total Credit: </span>
              <strong>NPR {totalCredit.toFixed(2)}</strong>
            </div>
            <div>
              <span style={{ fontWeight: 700, color: isBalanced ? '#059669' : '#dc2626' }}>
                {isBalanced ? '✓ VOUCHER IS BALANCED' : '⚠️ IMBALANCE: NPR ' + Math.abs(totalDebit - totalCredit).toFixed(2)}
              </span>
            </div>
          </div>

          <div style={styles.footer}>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} style={styles.statusSelect}>
              <option value="posted">Direct Post to General Ledger</option>
              <option value="draft">Save as Work-in-Progress Draft</option>
            </select>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="button" onClick={onClose} style={styles.btnSecondary}>
                Cancel
              </button>
              <button type="submit" style={styles.btnPrimary}>
                {status === 'posted' ? '⚡ Post Voucher' : 'Save Draft'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modal: { backgroundColor: '#ffffff', borderRadius: '10px', maxWidth: '850px', width: '100%', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' },
  closeBtn: { border: 'none', background: 'none', fontSize: '16px', color: '#64748b', cursor: 'pointer' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' },
  label: { fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: '4px', display: 'block' },
  input: { width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' },
  lineRow: { display: 'flex', gap: '8px', alignItems: 'center' },
  addLineBtn: { fontSize: '12px', color: '#1e3a8a', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' },
  removeBtn: { color: '#dc2626', fontWeight: 800, background: 'none', border: 'none', padding: '6px', cursor: 'pointer' },
  balanceBar: { display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '12px', borderRadius: '6px', border: '1px solid', fontSize: '13px' },
  footer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' },
  statusSelect: { padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', fontWeight: 600 },
  btnPrimary: { backgroundColor: '#1e3a8a', color: '#ffffff', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer' },
  btnSecondary: { backgroundColor: '#f1f5f9', color: '#475569', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', border: '1px solid #cbd5e1', cursor: 'pointer' },
};
