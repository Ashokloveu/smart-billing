import React, { useState } from 'react';

interface Staff {
  id: string;
  name: string;
  phone: string;
  role: string;
  status: 'Accepted' | 'Pending';
  joinedDate: string;
}

export const ManageStaffsPage: React.FC = () => {
  const [staffs, setStaffs] = useState<Staff[]>([
    {
      id: '1',
      name: 'Ashok Singh',
      phone: '+977-9800895800',
      role: 'Admin',
      status: 'Accepted',
      joinedDate: '2083 Bai 15',
    },
  ]);

  const [showBanner, setShowBanner] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('+977-');
  const [staffRole, setStaffRole] = useState('Counter Cashier');

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: Staff = {
      id: Date.now().toString(),
      name: staffName,
      phone: staffPhone,
      role: staffRole,
      status: 'Accepted',
      joinedDate: '2083 Bai 15',
    };
    setStaffs([...staffs, newStaff]);
    setShowAddModal(false);
    setStaffName('');
    setStaffPhone('+977-');
  };

  return (
    <div style={styles.container}>
      {/* Top Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>Manage Staffs ({staffs.length})</h1>
        <button style={styles.addBtn} onClick={() => setShowAddModal(true)}>
          + Add New Staff
        </button>
      </div>

      {/* Multi Users Promo Banner (Matching Page 14) */}
      {showBanner && (
        <div style={styles.banner}>
          <div style={{ flex: 1 }}>
            <h3 style={styles.bannerTitle}>Multi Users</h3>
            <p style={styles.bannerDesc}>
              Add your business staffs to manage your business together. You can customize their roles & permission access as needed.
            </p>
            <button style={styles.bannerCloseBtn} onClick={() => setShowBanner(false)}>
              Close
            </button>
          </div>
          <div style={styles.bannerIllustration}>
            <span style={{ fontSize: '48px' }}>👥</span>
          </div>
        </div>
      )}

      {/* Staffs Table */}
      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.theadRow}>
              <th style={styles.th}>Staff Name</th>
              <th style={styles.th}>Role</th>
              <th style={styles.th}>Status</th>
              <th style={styles.th}>Joined Date</th>
              <th style={{ ...styles.th, textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {staffs.map((s) => (
              <tr key={s.id} style={styles.tr}>
                <td style={styles.td}>
                  <strong>{s.name}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{s.phone}</div>
                </td>
                <td style={styles.td}>
                  <span style={styles.roleBadge}>{s.role}</span>
                </td>
                <td style={styles.td}>
                  <span style={styles.acceptedBadge}>{s.status}</span>
                </td>
                <td style={styles.td}>{s.joinedDate}</td>
                <td style={{ ...styles.td, textAlign: 'center' }}>
                  <button style={styles.editBtn} title="Edit Staff Permissions">
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>Add New Staff</h3>
              <button onClick={() => setShowAddModal(false)} style={styles.closeBtn}>✕</button>
            </div>
            <form onSubmit={handleAddStaff} style={styles.form}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Thapa"
                  value={staffName}
                  onChange={(e) => setStaffName(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Mobile Number</label>
                <input
                  type="text"
                  required
                  placeholder="+977-9841234567"
                  value={staffPhone}
                  onChange={(e) => setStaffPhone(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Role & Permissions</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  style={styles.select}
                >
                  <option value="Admin">Admin (Full Control)</option>
                  <option value="Counter Cashier">Counter Cashier (POS & Sales only)</option>
                  <option value="Accountant">Accountant (Daybook & VAT Books)</option>
                  <option value="Store Manager">Store Manager (Inventory & Purchases)</option>
                  <option value="Delivery Partner">Delivery Partner (Order Dispatch)</option>
                </select>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" onClick={() => setShowAddModal(false)} style={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" style={styles.saveStaffBtn}>
                  Send Staff Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    animation: 'fadeIn 0.2s ease',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '20px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  addBtn: {
    padding: '9px 18px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.25)',
  },
  banner: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: '15px',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 6px 0',
  },
  bannerDesc: {
    fontSize: '13px',
    color: '#64748b',
    margin: '0 0 12px 0',
    maxWidth: '560px',
    lineHeight: 1.4,
  },
  bannerCloseBtn: {
    padding: '4px 12px',
    backgroundColor: '#ffffff',
    color: '#475569',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  bannerIllustration: {
    width: '64px',
    height: '64px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  theadRow: {
    backgroundColor: '#f8fafc',
    borderBottom: '1px solid #e2e8f0',
  },
  th: {
    padding: '12px 16px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#475569',
    textAlign: 'left',
  },
  tr: {
    borderBottom: '1px solid #f1f5f9',
  },
  td: {
    padding: '14px 16px',
    fontSize: '13px',
    color: '#1e293b',
  },
  roleBadge: {
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  acceptedBadge: {
    backgroundColor: '#ecfdf5',
    color: '#059669',
    padding: '3px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 700,
  },
  editBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
  },
  modal: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderBottom: '1px solid #f1f5f9',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '16px',
    color: '#94a3b8',
    cursor: 'pointer',
  },
  form: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#334155',
  },
  input: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
  },
  select: {
    padding: '9px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#ffffff',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
    marginTop: '10px',
  },
  cancelBtn: {
    padding: '8px 16px',
    backgroundColor: '#ffffff',
    color: '#64748b',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  saveStaffBtn: {
    padding: '8px 20px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderRadius: '8px',
    border: 'none',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
