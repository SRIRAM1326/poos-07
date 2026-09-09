'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Project, ProjectTask, ProjectIssue, Contribution } from '@/types';
import { ArrowLeft, Bot, CheckCircle, Code, ExternalLink, GitPullRequest, Plus } from 'lucide-react';
import { AIAssistantModal } from './AIAssistantModal';

interface ProjectWorkspaceProps {
  projectId: number;
  onBack: () => void;
}

export const ProjectWorkspace: React.FC<ProjectWorkspaceProps> = ({ projectId, onBack }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [issues, setIssues] = useState<ProjectIssue[]>([]);
  const [contributions, setContributions] = useState<Contribution[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'issues' | 'contributions'>('overview');
  const [loading, setLoading] = useState(true);
  const [showAIAssistant, setShowAIAssistant] = useState(false);


  // New task modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('High');

  // New contribution modal state
  const [showContribModal, setShowContribModal] = useState(false);
  const [commitMsg, setCommitMsg] = useState('');
  const [commitHash, setCommitHash] = useState('');
  const [prTitle, setPrTitle] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [errorToast, setErrorToast] = useState('');

  useEffect(() => {
    async function loadWorkspace() {
      try {
        const [proj, taskList, issueList, contribList] = await Promise.all([
          api.getProjectDetails(projectId),
          api.getProjectTasks(projectId),
          api.getProjectIssues(projectId),
          api.getProjectContributions(projectId)
        ]);
        setProject(proj);
        setTasks(taskList);
        setIssues(issueList);
        setContributions(contribList);
      } catch (err) {
        console.error('Failed loading project workspace:', err);
        setErrorToast('Failed to load project workspace.');
        setTimeout(() => setErrorToast(''), 4000);
      } finally {
        setLoading(false);
      }
    }
    loadWorkspace();
  }, [projectId]);

  const handleAddTask = async () => {
    if (!newTaskTitle) return;
    try {
      const task = await api.createProjectTask(projectId, {
        title: newTaskTitle,
        priority: newTaskPriority
      });
      setTasks([...tasks, task]);
      setShowTaskModal(false);
      setNewTaskTitle('');
    } catch (err: any) {
      console.error('Failed adding task:', err);
      setErrorToast(err?.message || 'Failed to add task.');
    } finally {
      setTimeout(() => setErrorToast(''), 4000);
    }
  };

  const handleLogContribution = async () => {
    if (!commitMsg) return;
    try {
      const contrib = await api.logContribution(projectId, {
        commit_hash: commitHash || undefined,
        commit_message: commitMsg,
        pr_title: prTitle || commitMsg
      });
      setContributions([contrib, ...contributions]);
      setShowContribModal(false);
      setCommitMsg('');
      setCommitHash('');
      setPrTitle('');
      setSuccessToast('Merged PR logged.');
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err: any) {
      console.error('Failed logging contribution:', err);
      setErrorToast(err?.message || 'Failed to log contribution.');
      setTimeout(() => setErrorToast(''), 4000);
    }
  };

  if (loading || !project) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Project Workspace...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast */}
      {successToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'var(--gold-dark)',
          color: '#ffffff',
          padding: '14px 24px',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          boxShadow: 'var(--shadow-md)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle size={18} />
          {successToast}
        </div>
      )}

      {/* Error Toast */}
      {errorToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#b91c1c',
          color: '#ffffff',
          padding: '14px 24px',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-heading)',
          fontWeight: 700,
          boxShadow: 'var(--shadow-md)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {errorToast}
        </div>
      )}

      {/* Back Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={onBack} className="gold-btn-outline" style={{ padding: '6px 12px', fontSize: '13px' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
          Next.js Project Workspace #{project.id}
        </span>
      </div>

      {/* Project Workspace Header Card */}
      <div className="gold-card" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '24px', fontWeight: 800 }}>
                {project.title}
              </h1>
              <span className="gold-badge blue">{project.project_type}</span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-soft)', marginTop: '4px' }}>
              {project.tagline}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>Maintainer: <b>{project.owner_name}</b></span>
              <span>Rights Tag: <b style={{ color: 'var(--gold-dark)' }}>{project.rights_tag}</b></span>
              <a href={project.repo_url || '#'} target="_blank" rel="noreferrer" style={{ color: 'var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                <ExternalLink size={12} /> GitHub Repository
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={() => setShowAIAssistant(true)}
              className="gold-btn-outline"
              style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Bot size={16} color="var(--accent-green)" /> AI Workspace Assistant
            </button>
            <button onClick={() => setShowContribModal(true)} className="gold-btn" style={{ fontSize: '13px' }}>
              <GitPullRequest size={16} /> Log Merged PR / Commit
            </button>
          </div>
        </div>

        {showAIAssistant && (
          <AIAssistantModal projectId={projectId} onClose={() => setShowAIAssistant(false)} />
        )}


        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', marginTop: '24px', paddingBottom: '0' }}>
          {[
            { id: 'overview', label: 'Overview & Specs' },
            { id: 'tasks', label: `Kanban Tasks (${tasks.length})` },
            { id: 'issues', label: `Issue Tracker (${issues.length})` },
            { id: 'contributions', label: `Contributions (${contributions.length})` }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderBottom: activeTab === t.id ? '3px solid var(--gold-primary)' : '3px solid transparent',
                background: 'transparent',
                fontFamily: 'var(--font-heading)',
                fontWeight: activeTab === t.id ? 700 : 500,
                color: activeTab === t.id ? 'var(--gold-dark)' : 'var(--text-soft)',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="gold-card" style={{ padding: '24px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, marginBottom: '12px' }}>
            Technical Architecture & Overview
          </h3>
          <p style={{ color: 'var(--text-soft)', lineHeight: '1.7' }}>
            {project.description}
          </p>

          <div style={{ marginTop: '24px' }}>
            <h4 style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', textTransform: 'uppercase', color: 'var(--gold-dark)', marginBottom: '8px' }}>
              Tech Stack & Dependencies
            </h4>
            <div style={{ display: 'flex', gap: '8px' }}>
              {project.tech_stack_json.map((t, i) => (
                <span key={i} className="gold-badge">
                  <Code size={12} /> {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800 }}>
              Interactive Task Board
            </h3>
            <button onClick={() => setShowTaskModal(true)} className="gold-btn" style={{ fontSize: '12px', padding: '6px 12px' }}>
              <Plus size={14} /> Add Task
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            {tasks.map((task) => (
              <div key={task.id} className="gold-card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span className="gold-badge blue" style={{ fontSize: '10px' }}>{task.status}</span>
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--red-primary)', fontWeight: 700 }}>
                    {task.priority} Priority
                  </span>
                </div>
                <h4 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>{task.title}</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '4px' }}>{task.description}</p>
                <div style={{ marginTop: '12px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  Assignee: {task.assignee_name || 'Unassigned'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'contributions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800 }}>
            Merged Pull Requests & Commits History
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {contributions.map((c) => (
              <div key={c.id} className="gold-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <GitPullRequest size={20} color="var(--green-primary)" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                      PR #{c.pr_number}: {c.pr_title || c.commit_message}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      Commit: <span style={{ color: 'var(--gold-dark)' }}>{c.commit_hash}</span> by <b>{c.contributor_name}</b>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--green-primary)', fontWeight: 700 }}>
                    +{c.lines_added} / -{c.lines_deleted} lines
                  </span>
                  <span className="gold-badge green">MERGED</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Log Contribution Modal */}
      {showContribModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="gold-card" style={{ width: '100%', maxWidth: '500px', padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, marginBottom: '6px' }}>
              Log Verified Pull Request / Commit
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '18px' }}>
              Submitting a verified PR updates your student Super Profile and reputation score in Supabase DB.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>PR Title</label>
                <input
                  type="text"
                  value={prTitle}
                  onChange={(e) => setPrTitle(e.target.value)}
                  placeholder="feat(engine): concurrent pgvector embedding indexer"
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Commit Message</label>
                <input
                  type="text"
                  value={commitMsg}
                  onChange={(e) => setCommitMsg(e.target.value)}
                  placeholder="Add lock-free batch vector inserts"
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Commit Hash (optional)</label>
                <input
                  type="text"
                  value={commitHash}
                  onChange={(e) => setCommitHash(e.target.value)}
                  placeholder="e.g. b9e81a3f7c..."
                  style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '13px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button onClick={() => setShowContribModal(false)} className="gold-btn-outline" style={{ fontSize: '13px' }}>
                  Cancel
                </button>
                <button onClick={handleLogContribution} className="gold-btn" style={{ fontSize: '13px' }}>
                  Log & Merge PR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(6px)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div className="gold-card" style={{ width: '100%', maxWidth: '460px', padding: '28px' }}>
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 800, marginBottom: '14px' }}>
              Create New Task
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Task title..."
                style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '13px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button onClick={() => setShowTaskModal(false)} className="gold-btn-outline" style={{ fontSize: '13px' }}>Cancel</button>
                <button onClick={handleAddTask} className="gold-btn" style={{ fontSize: '13px' }}>Create Task</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
