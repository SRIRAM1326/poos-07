import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Search, ShieldCheck, XCircle } from 'lucide-react';

interface StudentRow {
  id: number;
  user_id: number;
  roll_number?: string | null;
  college_name: string;
  department: string;
  year_of_study?: string;
  bio?: string | null;
  github_handle?: string | null;
  reputation_score: number;
  verified_by_college: boolean;
  skills_json?: any[];
}

export const CollegeStudents: React.FC = () => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      try {
        const data = await api.getStudents();
        if (!cancelled) setStudents(data || []);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load students.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadData();
    return () => { cancelled = true; };
  }, []);

  const filteredStudents = students.filter(s => {
    const name = s.github_handle || s.college_name || '';
    const rollNo = s.roll_number || '';
    const term = searchTerm.toLowerCase();
    return name.toLowerCase().includes(term) || rollNo.toLowerCase().includes(term);
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Student Management</h2>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading students...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Student Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0' }}>Search, verify, and view student Super Profiles</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
          <input
            type="text"
            placeholder="Search by name or roll no..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: '8px 12px 8px 36px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-subtle)' }}
          />
        </div>
      </div>

      <div className="gold-card">
        <div className="gold-card-body" style={{ padding: 0 }}>
          {error ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load students: {error}</div>
          ) : filteredStudents.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {searchTerm ? 'No students match your search.' : 'No students registered yet.'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  <th style={{ padding: '16px' }}>Student</th>
                  <th style={{ padding: '16px' }}>Department</th>
                  <th style={{ padding: '16px' }}>Skills</th>
                  <th style={{ padding: '16px' }}>Reputation</th>
                  <th style={{ padding: '16px' }}>Status</th>
                  <th style={{ padding: '16px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const skills = (student.skills_json || [])
                    .map(s => typeof s === 'string' ? s : s?.name)
                    .filter(Boolean);
                  return (
                    <tr key={student.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ fontWeight: 600 }}>{student.github_handle || `Student #${student.id}`}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{student.roll_number || student.college_name}</div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '14px' }}>{student.department}</td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {skills.map(skill => (
                            <span key={skill} style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--bg-subtle)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{skill}</span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontWeight: 600 }}>{student.reputation_score}</td>
                      <td style={{ padding: '16px' }}>
                        <span className={`gold-badge ${student.verified_by_college ? 'green' : 'orange'}`} style={{ fontSize: '11px' }}>
                          {student.verified_by_college ? 'Verified' : 'Pending Verification'}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        {!student.verified_by_college ? (
                          <button
                            onClick={async () => {
                              try {
                                await api.verifyStudent(student.user_id);
                                setStudents(prev => prev.map(s => s.id === student.id ? { ...s, verified_by_college: true } : s));
                              } catch (err: any) {
                                alert(err?.message || 'Failed to verify student.');
                              }
                            }}
                            style={{ padding: '6px 12px', background: 'var(--purple-primary)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Verify
                          </button>
                        ) : (
                          <button style={{ padding: '6px 12px', background: 'transparent', color: 'var(--purple-primary)', border: '1px solid var(--purple-primary)', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>View Profile</button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
