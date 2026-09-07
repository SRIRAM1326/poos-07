'use client';

import React, { useMemo, useState } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle, ExternalLink, ShieldCheck, Zap } from 'lucide-react';

interface Skill {
  name: string;
  level: string; // 'Expert' | 'Advanced' | 'Intermediate'
  category: string;
  verified: boolean;
  evidence_project?: string;
  evidence_link?: string;
  evidence_summary?: string;
}

interface RadarSkillChartProps {
  skills: Skill[];
}

export const RadarSkillChart: React.FC<RadarSkillChartProps> = ({ skills }) => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Process data for the Radar Chart
  const radarData = useMemo(() => {
    const categoryScores: Record<string, number> = {};
    
    skills.forEach(skill => {
      if (!categoryScores[skill.category]) {
        categoryScores[skill.category] = 0;
      }
      // Add points based on level
      if (skill.level === 'Expert') categoryScores[skill.category] += 30;
      else if (skill.level === 'Advanced') categoryScores[skill.category] += 20;
      else categoryScores[skill.category] += 10;
      
      // Bonus for verification
      if (skill.verified) categoryScores[skill.category] += 10;
    });

    // Format for Recharts, cap at 100
    return Object.keys(categoryScores).map(cat => ({
      subject: cat,
      score: Math.min(categoryScores[cat], 100),
      fullMark: 100
    }));
  }, [skills]);

  // Filter skills based on hovered category on the radar (or show all verified)
  const displaySkills = useMemo(() => {
    if (activeCategory) {
      return skills.filter(s => s.category === activeCategory);
    }
    // Default: Show top verified skills
    return skills.filter(s => s.verified).slice(0, 5);
  }, [skills, activeCategory]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px', padding: '16px' }}>
      
      {/* LEFT SIDE: The Glowing Radar Chart */}
      <div style={{ 
        background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)', 
        borderRadius: '24px', 
        padding: '24px',
        border: '1px solid var(--border-gold, #e2e8f0)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }}>
        <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b' }}>Domain Mastery</h4>
          <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Algorithmically calculated from PRs</p>
        </div>

        <div style={{ width: '100%', height: '350px', marginTop: '30px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis 
                dataKey="subject" 
                tick={{ fill: '#475569', fontSize: 12, fontWeight: 600 }} 
              />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontWeight: 700 }}
                itemStyle={{ color: '#c9a227' }}
              />
              <Radar 
                name="Mastery Score" 
                dataKey="score" 
                stroke="#c9a227" 
                strokeWidth={3}
                fill="url(#goldGradient)" 
                fillOpacity={0.6} 
                onMouseEnter={(e: any) => setActiveCategory(e.subject)}
                onMouseLeave={() => setActiveCategory(null)}
              />
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#c9a227" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* RIGHT SIDE: The Ultra-Clean Proof List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ paddingBottom: '12px', borderBottom: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Zap size={18} color="#f59e0b" />
            {activeCategory ? `${activeCategory} Skills` : 'Top Verified Skills'}
          </h4>
          <span style={{ fontSize: '11px', background: '#ecfdf5', color: '#059669', padding: '4px 10px', borderRadius: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShieldCheck size={14} /> ZERO-TRUST VERIFIED
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {displaySkills.map((skill, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '16px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#c9a227';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(201,162,39,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#e2e8f0';
              e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
            }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h5 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{skill.name}</h5>
                    {skill.verified && <CheckCircle size={14} color="#059669" />}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>
                    {skill.level} · {skill.category}
                  </div>
                </div>
                
                {skill.evidence_link && (
                  <a href={skill.evidence_link} target="_blank" rel="noreferrer" style={{ 
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 700, color: '#4f46e5',
                    background: '#e0e7ff', padding: '4px 8px', borderRadius: '6px', textDecoration: 'none'
                  }}>
                    View Code <ExternalLink size={12} />
                  </a>
                )}
              </div>

              {skill.evidence_project && (
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
                  <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 700, letterSpacing: '0.5px' }}>Proof of Work</div>
                  <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 600, marginTop: '2px' }}>{skill.evidence_project}</div>
                  {skill.evidence_summary && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
                      {skill.evidence_summary}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
          
          {displaySkills.length === 0 && (
            <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px', border: '1px dashed #e2e8f0', borderRadius: '12px' }}>
              No verified skills found for this category.
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
