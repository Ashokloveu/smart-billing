import React, { useEffect, useState } from 'react';
import { useOrgStore } from '../../../stores/orgStore';
import { hrService } from '../services/hrService';
import { Employee } from '../types/hr';
import { formatDecimal } from '../../../utils/decimal';

export const EmployeeDirectoryPage: React.FC = () => {
  const currentOrg = useOrgStore((state) => state.currentOrg);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEmployees = async () => {
    if (!currentOrg?._id) return;
    setLoading(true);
    try {
      const data = await hrService.getEmployees(currentOrg._id);
      setEmployees(data);
    } catch (e) {
      console.error('Failed to load employees', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [currentOrg?._id]);

  const handleConfirmProbation = async (empId: string) => {
    if (!currentOrg?._id) return;
    await hrService.updateLifecycle(currentOrg._id, empId, {
      toStatus: 'confirmed',
      remarks: 'Probation completed successfully',
    });
    alert('Employee status updated to Confirmed');
    fetchEmployees();
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Employee Master & Human Capital Directory</h1>
          <p style={styles.subtitle}>
            Manage employee lifecycle, departments, designations, PAN, and SSF profiles.
          </p>
        </div>
      </div>

      <div style={styles.card}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.thRow}>
              <th style={styles.th}>Code</th>
              <th style={styles.th}>Employee Name</th>
              <th style={styles.th}>Department & Role</th>
              <th style={styles.th}>PAN / SSF</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Basic Salary (NPR)</th>
              <th style={styles.th}>Lifecycle</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp._id} style={styles.tr}>
                <td style={{ ...styles.td, fontFamily: 'monospace', fontWeight: 700, color: '#1e3a8a' }}>
                  {emp.employeeCode}
                </td>
                <td style={styles.td}>
                  <strong>{emp.firstName} {emp.lastName}</strong>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>{emp.email} • {emp.phone}</div>
                </td>
                <td style={styles.td}>
                  <div><strong>{emp.department}</strong></div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{emp.designation}</div>
                </td>
                <td style={styles.td}>
                  <div>PAN: {emp.panNumber || 'N/A'}</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>SSF: {emp.ssfNumber || 'N/A'}</div>
                </td>
                <td style={{ ...styles.td, textAlign: 'right', fontWeight: 700 }}>
                  NPR {formatDecimal(emp.salaryStructure.basicSalary)}
                </td>
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.statusPill,
                      backgroundColor:
                        emp.lifecycleStatus === 'confirmed'
                          ? '#ecfdf5'
                          : emp.lifecycleStatus === 'probation'
                          ? '#eff6ff'
                          : '#f8fafc',
                      color:
                        emp.lifecycleStatus === 'confirmed'
                          ? '#059669'
                          : emp.lifecycleStatus === 'probation'
                          ? '#1e3a8a'
                          : '#475569',
                    }}
                  >
                    {emp.lifecycleStatus.toUpperCase()}
                  </span>
                </td>
                <td style={styles.td}>
                  {emp.lifecycleStatus === 'probation' && (
                    <button style={styles.actionBtn} onClick={() => handleConfirmProbation(emp._id)}>
                      Confirm Employee
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {employees.length === 0 && !loading && (
              <tr>
                <td colSpan={7} style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '30px' }}>
                  No employee master records found.
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
  card: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' },
  th: { padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f1f5f9' },
  td: { padding: '10px 14px', fontSize: '13px' },
  statusPill: { fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' },
  actionBtn: { padding: '4px 8px', borderRadius: '4px', border: '1px solid #cbd5e1', backgroundColor: '#ffffff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' },
};
