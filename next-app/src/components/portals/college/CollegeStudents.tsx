import React, { useState } from 'react';
import { collegeMockData } from '@/data/collegeMockData';
import { Search, ShieldCheck, XCircle } from 'lucide-react';

export const CollegeStudents: React.FC = () => {
  const { students } = collegeMockData;
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.rollNo.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-subtle)', textAlign: 'left', fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                <th style={{ padding: '16px' }}>Student</th>
                <th style={{ padding: '16px' }}>Department</th>
                <th style={{ padding: '16px' }}>Skills</th>
                <th style={{ padding: '16px' }}>Contributions</th>
                <th style={{ padding: '16px' }}>Status</th>
                <th style={{ padding: '16px' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(student => (
                <tr key={student.id} style={{ borderTop: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 600 }}>{student.name}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{student.rollNo}</div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '14px' }}>{student.department}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {(student.skills || []).map(skill => (
                        <span key={skill} style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--bg-subtle)', borderRadius: '4px', border: '1px solid var(--border-color)' }}>{skill}</span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontWeight: 600 }}>{student.contributions}</td>
                  <td style={{ padding: '16px' }}>
                    <span className={`gold-badge ${student.status === 'Verified' ? 'green' : 'orange'}`} style={{ fontSize: '11px' }}>
                      {student.status === 'Verified' && <ShieldCheck size={10} style={{ marginRight: '4px' }}/>}
                      {student.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    {student.status !== 'Verified' ? (
                      <button style={{ padding: '6px 12px', background: 'var(--purple-primary)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>Verify</button>
                    ) : (
                      <button style={{ padding: '6px 12px', background: 'transparent', color: 'var(--purple-primary)', border: '1px solid var(--purple-primary)', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>View Profile</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
