import React from 'react';
import { ReportFilter } from '../types/reports';

interface DateRangeFilterProps {
  filter: ReportFilter;
  onChange: (filter: ReportFilter) => void;
  onRefresh: () => void;
}

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ filter, onChange, onRefresh }) => {
  return (
    <div style={styles.container}>
      <div style={styles.inputsGroup}>
        <div style={styles.field}>
          <label style={styles.label}>Start Date</label>
          <input
            type="date"
            value={filter.startDate || ''}
            onChange={(e) => onChange({ ...filter, startDate: e.target.value || undefined })}
            style={styles.input}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>End Date</label>
          <input
            type="date"
            value={filter.endDate || ''}
            onChange={(e) => onChange({ ...filter, endDate: e.target.value || undefined })}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.actionsGroup}>
        <button
          style={styles.btnSecondary}
          onClick={() => {
            onChange({});
          }}
        >
          Reset Filter
        </button>
        <button style={styles.btnPrimary} onClick={onRefresh}>
          🔄 Apply & Refresh
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: '14px 20px',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
    marginBottom: '20px',
  },
  inputsGroup: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  label: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  input: {
    padding: '6px 10px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    color: '#0f172a',
  },
  actionsGroup: {
    display: 'flex',
    gap: '8px',
  },
  btnSecondary: {
    padding: '8px 14px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    color: '#475569',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  btnPrimary: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#1e3a8a',
    color: '#ffffff',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
  },
};
