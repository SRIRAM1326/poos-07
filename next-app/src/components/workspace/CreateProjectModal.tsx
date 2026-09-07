'use client';

import React, { useState } from 'react';
import { X, Code, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '@/services/api';

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: (newProject: any) => void;
}

export function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [projectType, setProjectType] = useState('OPEN_SOURCE');
  const [repoUrl, setRepoUrl] = useState('https://github.com/poos-ecosystem/my-new-project');
  const [rightsTag, setRightsTag] = useState('MIT Open Source');
  const [techStack, setTechStack] = useState('FastAPI, Next.js, PostgreSQL, TypeScript');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || loading) return;

    setLoading(true);
    try {
      const techArray = techStack.split(',').map(s => s.trim()).filter(Boolean);
      const newProj = await api.createProject({
        title,
        tagline,
        description,
        project_type: projectType,
        repo_url: repoUrl,
        rights_tag: rightsTag,
        tech_stack_json: techArray,
        owner_name: 'PoOS Contributor'
      });
      onSuccess(newProj);
      onClose();
    } catch (err) {
      console.error('Failed creating project:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '560px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(201, 162, 39, 0.08) 0%, rgba(0, 245, 212, 0.08) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: 'var(--gold-bg)',
              border: '1px solid var(--gold-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--gold-dark)'
            }}>
              <Code size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                Register New Ecosystem Project
              </h2>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Open Source, College Research, or Industry Collaboration Repository
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', maxHeight: '75vh', overflowY: 'auto' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              PROJECT TITLE
            </label>
            <input
              type="text"
              required
              placeholder="e.g. HyperVector Search Engine"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-base)',
                color: 'var(--text-main)',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              TAGLINE
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sub-millisecond high-dimensional embedding indexer"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-base)',
                color: 'var(--text-main)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                PROJECT TYPE
              </label>
              <select
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-base)',
                  color: 'var(--text-main)',
                  fontSize: '13px'
                }}
              >
                <option value="OPEN_SOURCE">Open Source Project</option>
                <option value="COLLEGE_PROJECT">College Capstone / Lab</option>
                <option value="INDUSTRY_PROJECT">Industry Collaboration</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                RIGHTS & LICENSE TAG
              </label>
              <input
                type="text"
                value={rightsTag}
                onChange={(e) => setRightsTag(e.target.value)}
                placeholder="e.g. MIT License"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-base)',
                  color: 'var(--text-main)',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              GITHUB REPOSITORY URL
            </label>
            <div style={{ position: 'relative' }}>
              <ExternalLink size={16} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--text-muted)' }} />
              <input
                type="url"
                required
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px 10px 38px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-base)',
                  color: 'var(--text-main)',
                  fontSize: '13px'
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              TECH STACK (Comma Separated)
            </label>
            <input
              type="text"
              required
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="FastAPI, Next.js, PostgreSQL, Rust"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-base)',
                color: 'var(--text-main)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
              DETAILED SPECIFICATION / ARCHITECTURE
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe key modules, API routes, and contribution guidelines..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-base)',
                color: 'var(--text-main)',
                fontSize: '13px',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                color: 'var(--text-main)',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, var(--gold-primary) 0%, #e5b82e 100%)',
                color: '#0a0f1d',
                fontWeight: 700,
                fontSize: '14px',
                cursor: loading ? 'wait' : 'pointer'
              }}
            >
              {loading ? 'Creating...' : 'Register Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
