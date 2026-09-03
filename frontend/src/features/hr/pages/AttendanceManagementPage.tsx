import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { hrService } from '../services/hrService';
import { AttendanceItem, LeaveRequest } from '../types/hr';
import { formatDecimal } from '../../../utils/decimal';

export const AttendanceManagementPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [activeTab, setActiveTab] = useState<'attendance' | 'leaves'>('attendance');

  const [attendance, setAttendance] = useState<AttendanceItem[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const [attRes, leaveRes] = await Promise.all([
        hrService.getAttendance(currentOrg._id),
        hrService.getLeaves(currentOrg._id),
      ]);
      setAttendance(attRes);
      setLeaves(leaveRes);
    } catch (e) {
      console.error('Failed to load attendance/leave data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentOrg?._id]);

  const handleApproveLeave = async (id: string) => {
    if (!currentOrg?._id) return;
    await hrService.approveLeave(currentOrg._id, id);
    alert('Leave request approved');
    fetchData();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Attendance & Leave Management</h1>
          <p style={styles.subtitle}>
            Daily attendance, biometric import, late arrival tracking, and leave approvals.
          </p>
        </div>
      </div>

      <div style={styles.tabsNav}>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'attendance' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('attendance')}
        >
          ⏱️ Daily Attendance Logs ({attendance.length})
        </button>
        <button
          style={{ ...styles.navBtn, ...(activeTab === 'leaves' ? styles.activeNavBtn : {}) }}
          onClick={() => setActiveTab('leaves')}
        >
          🏖️ Leave Requests ({leaves.length})
        </button>
      </div>

      <div style={styles.content}>
        {activeTab === 'attendance' && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Date (BS)</th>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Check-In</th>
                  <th style={styles.th}>Check-Out</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Hours</th>
                  <th style={styles.th}>Late</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Lock Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((att) => (
                  <tr key={att._id} style={styles.tr}>
                    <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700 }}>
                      {att.bsDate}
                    </td>
                    <td style={styles.td}>
                      <strong>{att.employeeId?.firstName} {att.employeeId?.lastName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{att.employeeId?.employeeCode} • {att.employeeId?.department}</div>
                    </td>
                    <td style={styles.td}>{att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style={styles.td}>{att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>{formatDecimal(att.workingHours)} hrs</td>
                    <td style={styles.td}>
                      {att.lateMinutes > 0 ? (
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>{att.lateMinutes} mins</span>
                      ) : (
                        <span style={{ color: '#059669' }}>On Time</span>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.statusPill}>{att.status.toUpperCase()}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{ ...styles.statusPill, backgroundColor: att.isLocked ? '#fef2f2' : '#ecfdf5', color: att.isLocked ? '#dc2626' : '#059669' }}>
                        {att.isLocked ? '🔒 LOCKED' : 'OPEN'}
                      </span>
                    </td>
                  </tr>
                ))}
                {attendance.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No attendance logs recorded for current period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'leaves' && (
          <div style={styles.card}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.thRow}>
                  <th style={styles.th}>Employee</th>
                  <th style={styles.th}>Type</th>
                  <th style={styles.th}>Start Date</th>
                  <th style={styles.th}>End Date</th>
                  <th style={{ ...styles.th, textAlign: 'right' }}>Days</th>
                  <th style={styles.th}>Reason</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l._id} style={styles.tr}>
                    <td style={styles.td}>
                      <strong>{l.employeeId?.firstName} {l.employeeId?.lastName}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{l.employeeId?.department}</div>
                    </td>
                    <td style={styles.td}><span style={styles.statusPill}>{l.leaveType.toUpperCase()}</span></td>
                    <td style={styles.td}>{new Date(l.startDate).toLocaleDateString()}</td>
                    <td style={styles.td}>{new Date(l.endDate).toLocaleDateString()}</td>
                    <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>{l.totalDays}</td>
                    <td style={styles.td}>{l.reason}</td>
                    <td style={styles.td}><span style={styles.statusPill}>{l.status.toUpperCase()}</span></td>
                    <td style={styles.td}>
                      {l.status === 'submitted' && (
                        <button style={styles.actionBtn} onClick={() => handleApproveLeave(l._id)}>
                          Approve Leave
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {leaves.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                      No leave requests submitted.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '40px' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 },
  subtitle: { fontSize: '13px', color: '#64748b', marginTop: '4px' },
  tabsNav: { display: 'flex', gap: '8px', borderBottom: '2px solid #e2e8f0', paddingBottom: '10px' },
  navBtn: { padding: '8px 14px', borderRadius: '6px', border: 'none', background: 'none', fontSize: '13px', fontWeight: 700, color: '#64748b', cursor: 'pointer' },
  activeNavBtn: { backgroundColor: '#1e3a8a', color: '#ffffff' },
  content: { marginTop: '10px' },
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: '13px' },
  statusPill: { fontSize: '10px', fontWeight: 800, backgroundColor: '#f1f5f9', color: '#334155', padding: '2px 8px', borderRadius: '4px' },
  actionBtn: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' },
};
