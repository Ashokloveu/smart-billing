import React from 'react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalRecords: number;
  onPageChange: (newPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  totalRecords,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div style={styles.container}>
      <span style={styles.text}>
        Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalRecords} items)
      </span>
      <div style={styles.buttons}>
        <button
          style={styles.btn}
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>
        <button
          style={styles.btn}
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e2e8f0',
  },
  text: {
    fontSize: '12px',
    color: '#64748b',
  },
  buttons: {
    display: 'flex',
    gap: '8px',
  },
  btn: {
    padding: '6px 12px',
    borderRadius: '4px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    fontSize: '12px',
    fontWeight: 500,
    color: '#334155',
  },
};
