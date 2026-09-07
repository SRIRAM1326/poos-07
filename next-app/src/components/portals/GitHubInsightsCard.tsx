'use client';

import React from 'react';
import { Code, ExternalLink, Globe, RefreshCw, PlugZap, Unplug, Loader2, CheckCircle2, AlertTriangle, Star, GitPullRequest, GitCommitHorizontal, GitFork } from 'lucide-react';
import { api, getAuthToken, getCurrentUserId } from '@/services/api';

type StatusState =
  | 'idle'
  | 'loading_status'
  | 'not_connected'
  | 'loading_data'
  | 'connected'
  | 'syncing'
  | 'error';

const num = (value: number | null | undefined): string => {
  if (value === null || value === undefined) return '—';
  return value.toLocaleString();
};

const fmtDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const actionLabels: Record<string, string> = {
  PushEvent: 'Pushed to',
  PullRequestEvent: 'Opened / updated PR in',
  PullRequestReviewEvent: 'Reviewed a PR in',
  IssuesEvent: 'Updated an issue in',
  IssueCommentEvent: 'Commented on an issue in',
  CreateEvent: 'Created a branch / tag in',
  ForkEvent: 'Forked',
  WatchEvent: 'Starred',
};

export const GitHubInsightsCard: React.FC = () => {
  const [statusState, setStatusState] = React.useState<StatusState>('idle');
  const [status, setStatus] = React.useState<any>(null);
  const [statistics, setStatistics] = React.useState<any>(null);
  const [repositories, setRepositories] = React.useState<any[]>([]);
  const [activity, setActivity] = React.useState<any[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const connected = !!status?.connected;

  const loadStatus = React.useCallback(async () => {
    if (!getAuthToken() || !getCurrentUserId()) {
      setStatusState('idle');
      return;
    }
    setStatusState((prev) => (prev === 'connected' ? prev : 'loading_status'));
    try {
      const result = await api.getGitHubStatus();
      setStatus(result);
      if (result.connected) {
        setStatusState('loading_data');
        const [statsResult, reposResult, activityResult] = await Promise.all([
          api.getGitHubStatistics(),
          api.getGitHubRepositories(),
          api.getGitHubActivity(),
        ]);
        setStatistics(statsResult);
        setRepositories(reposResult?.repositories || []);
        setActivity(activityResult?.activity || []);
        setStatusState('connected');
      } else {
        setStatistics(null);
        setRepositories([]);
        setActivity([]);
        setStatusState('not_connected');
      }
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load GitHub connection state.');
      setStatusState('error');
    }
  }, []);

  React.useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const connectGithub = async () => {
    try {
      const result = await api.getGitHubAuthUrl();
      window.location.href = result.auth_url;
    } catch (err: any) {
      alert(err?.message || 'GitHub OAuth is not configured on the server.');
    }
  };

  const runSync = async () => {
    setStatusState('syncing');
    try {
      const result = await api.postGitHubSync();
      const statsResult = await api.getGitHubStatistics();
      setStatistics(statsResult);
      setStatus(result);
      setStatusState('connected');
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err?.message || 'GitHub sync failed.');
      setStatusState('error');
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect your GitHub account? Your GitHub statistics will no longer be shown.')) return;
    try {
      await api.deleteGitHubConnection();
      setStatus({ connected: false });
      setStatistics(null);
      setRepositories([]);
      setActivity([]);
      setStatusState('not_connected');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to disconnect GitHub.');
      setStatusState('error');
    }
  };

  if (statusState === 'idle') return null;

  if (statusState === 'error') {
    return (
      <div className="gold-card" style={{ padding: '24px' }}>
        <div className="gold-card-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={18} color="var(--gold-primary)" /> GitHub Contribution & Statistics
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-soft)' }}>
          <AlertTriangle size={20} color="var(--amber-primary)" />
          <span>{errorMessage}</span>
          <button className="gold-btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={loadStatus}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (statusState === 'loading_status' || statusState === 'loading_data') {
    return (
      <div className="gold-card" style={{ padding: '24px' }}>
        <div className="gold-card-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={18} color="var(--gold-primary)" /> GitHub Contribution & Statistics
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
          <Loader2 size={18} className="spin" /> Loading GitHub data from GitHub API…
        </div>
      </div>
    );
  }

  if (statusState === 'not_connected') {
    return (
      <div className="gold-card" style={{ padding: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #fff9e6 100%)' }}>
        <div className="gold-card-header">
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={18} color="var(--gold-primary)" /> GitHub Contribution & Statistics
          </h3>
          <span className="gold-badge amber">Not Connected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-soft)', maxWidth: '520px', lineHeight: '1.6' }}>
            Connect your GitHub account to see <b>real</b> commits, merged pull requests, issues solved, code reviews,
            and your contribution score on My Super Profile. Only your public profile and public repositories are read.
          </div>
          <button onClick={connectGithub} className="gold-btn" style={{ fontSize: '13px', padding: '8px 16px' }}>
            <PlugZap size={15} /> Connect GitHub via OAuth
          </button>
        </div>
      </div>
    );
  }

  const totals = statistics?.totals || {};
  const account = status?.account;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="gold-card" style={{ padding: '24px' }}>
        <div className="gold-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={18} color="var(--gold-primary)" /> GitHub Contribution & Statistics (Real Data)
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="gold-badge green"><CheckCircle2 size={12} /> Connected as @{account?.login}</span>
            <button onClick={runSync} className="gold-btn" style={{ fontSize: '12px', padding: '4px 12px' }}>
              <RefreshCw size={13} /> {statusState === 'syncing' ? 'Syncing…' : 'Sync GitHub'}
            </button>
            <button onClick={disconnect} className="gold-btn-outline" style={{ fontSize: '12px', padding: '4px 12px', color: 'var(--danger)' }}>
              <Unplug size={13} /> Disconnect
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          {account?.avatar_url && (
            <img src={account.avatar_url} alt={account?.login} style={{ width: '52px', height: '52px', borderRadius: '50%', border: '2px solid var(--gold-primary)' }} />
          )}
          <div>
            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-main)' }}>
              {account?.name || account?.login}
            </div>
            <a href={account?.html_url} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: 'var(--blue-primary)', textDecoration: 'underline' }}>
              <Globe size={13} style={{ display: 'inline', marginRight: '4px' }} />github.com/{account?.login} <ExternalLink size={11} />
            </a>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Last synced: {fmtDate(status?.last_sync_at)}
          </span>
        </div>

        {status?.last_sync_error && (
          <div style={{ marginTop: '14px', padding: '10px 14px', background: 'var(--bg-subtle)', borderLeft: '4px solid var(--amber-primary)', borderRadius: '6px', fontSize: '12px', color: 'var(--text-soft)' }}>
            <AlertTriangle size={13} style={{ display: 'inline', marginRight: '6px' }} />
            Latest sync failed: {status.last_sync_error}
          </div>
        )}

        {!totals.computed_at && (
          <div style={{ marginTop: '14px', fontSize: '13px', color: 'var(--text-muted)' }}>
            No statistics have been computed yet. Click <b>Sync GitHub</b> to pull your real contributions.
          </div>
        )}
      </div>

      {totals.computed_at && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
            <div className="stat-box">
              <div className="num" style={{ color: 'var(--gold-dark)' }}>{num(totals.contribution_score)} <span>pts</span></div>
              <div className="lbl"><Star size={12} style={{ display: 'inline', marginRight: '4px' }} /> GitHub Contribution Score</div>
            </div>
            <div className="stat-box">
              <div className="num">{num(totals.commits)} <span>commits</span></div>
              <div className="lbl"><GitCommitHorizontal size={12} style={{ display: 'inline', marginRight: '4px' }} /> Total Commits</div>
            </div>
            <div className="stat-box">
              <div className="num" style={{ color: 'var(--accent-green)' }}>{num(totals.prs_merged)} / {num(totals.prs_total)} <span>merged</span></div>
              <div className="lbl"><GitPullRequest size={12} style={{ display: 'inline', marginRight: '4px' }} /> Pull Requests</div>
            </div>
            <div className="stat-box">
              <div className="num" style={{ color: 'var(--blue-primary)' }}>{num(totals.issues_closed)} <span>solved</span></div>
              <div className="lbl"><CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> Issues Solved</div>
            </div>
            <div className="stat-box">
              <div className="num" style={{ color: 'var(--purple-primary)' }}>{num(totals.code_reviews)} <span>reviews</span></div>
              <div className="lbl"><Code size={12} style={{ display: 'inline', marginRight: '4px' }} /> Code Reviews</div>
            </div>
            <div className="stat-box">
              <div className="num">{num(totals.active_projects)} <span>repos</span></div>
              <div className="lbl"><GitFork size={12} style={{ display: 'inline', marginRight: '4px' }} /> Active Projects (90d)</div>
            </div>
            <div className="stat-box">
              <div className="num">{num(totals.additions)} <span>added</span></div>
              <div className="lbl">+ / − {num(totals.deletions)} Lines</div>
            </div>
            <div className="stat-box">
              <div className="num">{num(totals.prs_open)} <span>open</span></div>
              <div className="lbl">Open PRs / Open Issues: {num(totals.issues_open)}</div>
            </div>
          </div>

          <div className="gold-card" style={{ padding: '20px' }}>
            <div className="gold-card-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800 }}>GitHub Repositories ({repositories.length})</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Score = commits×10 + merged PRs×35 + issues×20 + reviews×5
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {repositories.slice(0, 20).map((repo) => {
                const rs = repo.statistics || {};
                return (
                  <div key={repo.github_repo_id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '10px', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div>
                      <a href={repo.html_url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                        {repo.full_name} <ExternalLink size={11} />
                      </a>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                        <Star size={11} style={{ display: 'inline', marginRight: '2px' }} />{repo.stargazers_count || 0} · pushed {fmtDate(repo.pushed_at)}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-soft)', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>
                      {num(rs.commits)} commits · {num(rs.prs)} PRs · {num(rs.issues_solved)} issues · {num(rs.reviews)} reviews · +{num(rs.additions)}/−{num(rs.deletions)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="gold-card" style={{ padding: '20px' }}>
            <div className="gold-card-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800 }}>Recent GitHub Activity</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {activity.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No recent public activity.</div>}
              {activity.map((ev) => (
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', padding: '10px 14px', background: 'var(--bg-subtle)', borderRadius: '6px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-soft)' }}>
                    <b style={{ color: 'var(--text-main)' }}>{actionLabels[ev.type] || ev.type}</b>{' '}
                    {ev.repo_url ? <a href={ev.repo_url} target="_blank" rel="noreferrer" style={{ color: 'var(--blue-primary)' }}>{ev.repo_name} <ExternalLink size={10} /></a> : ev.repo_name}
                    {ev.action ? ` (${ev.action})` : ''}
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{fmtDate(ev.created_at)}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};