import React from 'react';

interface Column<T> {
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  width?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { _id: string }>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No records found.',
  onRowClick,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div style={styles.loadingBox}>
        <div style={styles.spinner}></div>
        <span>Loading records...</span>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <div style={styles.emptyBox}>{emptyMessage}</div>;
  }

  return (
    <div style={styles.tableWrapper}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.headerRow}>
            {columns.map((col, idx) => (
              <th key={idx} style={{ ...styles.th, width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr
              key={row._id}
              style={styles.row}
              onClick={() => onRowClick && onRowClick(row)}
            >
              {columns.map((col, idx) => {
                const cellContent =
                  typeof col.accessor === 'function'
                    ? col.accessor(row)
                    : col.accessor
                    ? (row[col.accessor] as any)
                    : null;
                return (
                  <td key={idx} style={styles.td}>
                    {cellContent}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  tableWrapper: {
    width: '100%',
    overflowX: 'auto',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px',
  },
  headerRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '12px 16px',
    fontWeight: 600,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontSize: '11px',
  },
  row: {
    borderBottom: '1px solid #f1f5f9',
    transition: 'background-color 0.1s',
  },
  td: {
    padding: '12px 16px',
    color: '#1e293b',
  },
  loadingBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    color: '#64748b',
    fontSize: '14px',
  },
  emptyBox: {
    textAlign: 'center',
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    color: '#94a3b8',
    fontSize: '14px',
  },
  spinner: {
    width: '16px',
    height: '16px',
    border: '2px solid #cbd5e1',
    borderTopColor: '#1e3a8a',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
};
