'use client';

import React from 'react';
import { Code, ExternalLink, Globe, RefreshCw, PlugZap, Unplug, Loader2, CheckCircle2, AlertTriangle, Star, GitPullRequest, GitCommitHorizontal, GitFork, Zap, Building2, MapPin, Link2, Users, CalendarDays, MessageSquareCode, ThumbsUp, Clock } from 'lucide-react';
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

const relativeTime = (value: string | null | undefined): string => {
  if (!value) return 'Not synced yet';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
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

const LANGUAGE_COLORS: Record<string, string> = {
  Python: '#3572A5',
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Java: '#b07219',
  'C++': '#f34b7d',
  C: '#555555',
  'C#': '#178600',
  Go: '#00ADD8',
  Rust: '#dea584',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Shell: '#89e051',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Vue: '#41b883',
  'Jupyter Notebook': '#DA5B0B',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  Scheme: '#1e4aec',
  Scala: '#c22d40',
  Haskell: '#5e5086',
  Lua: '#000080',
  'Objective-C': '#438eff',
};

const langColor = (lang: string): string => LANGUAGE_COLORS[lang] || '#8b949e';

export const GitHubInsightsCard: React.FC = () => {
  const [statusState, setStatusState] = React.useState<StatusState>('idle');
  const [status, setStatus] = React.useState<any>(null);
  const [statistics, setStatistics] = React.useState<any>(null);
  const [repositories, setRepositories] = React.useState<any[]>([]);
  const [activity, setActivity] = React.useState<any[]>([]);
  const [languages, setLanguages] = React.useState<any[]>([]);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const loadStatus = React.useCallback(async (silent: boolean = false) => {
    if (!getAuthToken() || !getCurrentUserId()) {
      setStatusState('idle');
      return;
    }
    if (!silent) {
      setStatusState((prev) => (prev === 'connected' ? prev : 'loading_status'));
    }
    try {
      const result = await api.getGitHubStatus();
      setStatus(result);
      if (result.connected) {
        if (!silent) setStatusState('loading_data');
        const [statsResult, reposResult, activityResult, langResult] = await Promise.all([
          api.getGitHubStatistics(),
          api.getGitHubRepositories(),
          api.getGitHubActivity(),
          api.getGitHubLanguages(),
        ]);
        setStatistics(statsResult);
        setRepositories(reposResult?.repositories || []);
        setActivity(activityResult?.activity || []);
        setLanguages(langResult?.languages || []);
        setStatusState('connected');
      } else {
        setStatistics(null);
        setRepositories([]);
        setActivity([]);
        setLanguages([]);
        setStatusState('not_connected');
      }
      setErrorMessage(null);
    } catch (err: any) {
      if (!silent) {
        setErrorMessage(err?.message || 'Failed to load GitHub connection state.');
        setStatusState('error');
      }
    }
  }, []);

  React.useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  // Auto-refresh GitHub data in the background so new commits / PRs / issues
  // pushed to GitHub appear on the Super Profile without a page reload or a
  // manual "Sync GitHub" click.
  React.useEffect(() => {
    const timer = window.setInterval(() => {
      if (getAuthToken() && getCurrentUserId()) {
        loadStatus(true);
      }
    }, 30000);
    return () => window.clearInterval(timer);
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
      const [statsResult, reposResult, activityResult, langResult] = await Promise.all([
        api.getGitHubStatistics(),
        api.getGitHubRepositories(),
        api.getGitHubActivity(),
        api.getGitHubLanguages(),
      ]);
      setStatistics(statsResult);
      setRepositories(reposResult?.repositories || []);
      setActivity(activityResult?.activity || []);
      setLanguages(langResult?.languages || []);
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
      setLanguages([]);
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
          <button className="gold-btn-outline" style={{ fontSize: '12px', padding: '4px 12px' }} onClick={() => loadStatus()}>
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
  const topLangs = (languages || []).slice(0, 8);
  const maxLangPct = Math.max(1, ...(topLangs.map((l) => l.percentage || 0)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Profile + Header */}
      <div className="gold-card" style={{ padding: '24px' }}>
        <div className="gold-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '17px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={18} color="var(--gold-primary)" /> GitHub Contribution & Statistics (Real Data)
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="gold-badge green"><CheckCircle2 size={12} /> Connected as @{account?.login}</span>
            <button onClick={runSync} className="gold-btn" style={{ fontSize: '12px', padding: '4px 12px' }}>
              <RefreshCw size={13} className={statusState === 'syncing' ? 'spin' : ''} /> {statusState === 'syncing' ? 'Syncing…' : 'Sync GitHub'}
            </button>
            <button onClick={disconnect} className="gold-btn-outline" style={{ fontSize: '12px', padding: '4px 12px', color: 'var(--danger)' }}>
              <Unplug size={13} /> Disconnect
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginTop: '16px', flexWrap: 'wrap' }}>
          {account?.avatar_url && (
            <img src={account.avatar_url} alt={account?.login} style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--gold-primary)' }} />
          )}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontWeight: 800, fontSize: '18px', color: 'var(--text-main)' }}>
              {account?.name || account?.login}
            </div>
            <a href={account?.html_url} target="_blank" rel="noreferrer" style={{ fontSize: '13px', color: 'var(--blue-primary)', textDecoration: 'underline' }}>
              <Globe size={13} style={{ display: 'inline', marginRight: '4px' }} />github.com/{account?.login} <ExternalLink size={11} />
            </a>
            {account?.bio && <div style={{ fontSize: '13px', color: 'var(--text-soft)', marginTop: '6px', maxWidth: '520px', lineHeight: '1.5' }}>{account.bio}</div>}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', marginTop: '10px', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {account?.company && <span><Building2 size={12} style={{ display: 'inline', marginRight: '4px' }} />{account.company}</span>}
              {account?.location && <span><MapPin size={12} style={{ display: 'inline', marginRight: '4px' }} />{account.location}</span>}
              {account?.blog && (
                <a href={account.blog.startsWith('http') ? account.blog : `https://${account.blog}`} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>
                  <Link2 size={12} style={{ display: 'inline', marginRight: '4px' }} />{account.blog.replace(/^https?:\/\//, '')}
                </a>
              )}
              <span><Users size={12} style={{ display: 'inline', marginRight: '4px' }} />{num(account?.followers)} followers · {num(account?.following)} following</span>
              <span><Star size={12} style={{ display: 'inline', marginRight: '4px' }} />{num(account?.public_repos)} public repos</span>
              {account?.account_created_at && <span><CalendarDays size={12} style={{ display: 'inline', marginRight: '4px' }} />Joined {fmtDate(account.account_created_at)}</span>}
            </div>
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={12} /> Last synced {relativeTime(status?.last_sync_at)}
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
            {totals.reviews_approved !== undefined && (
              <div className="stat-box">
                <div className="num" style={{ color: 'var(--accent-green)' }}>{num(totals.reviews_approved)} <span>approved</span></div>
                <div className="lbl"><ThumbsUp size={12} style={{ display: 'inline', marginRight: '4px' }} /> Reviews Approved</div>
              </div>
            )}
            {totals.reviews_changes_requested !== undefined && (
              <div className="stat-box">
                <div className="num" style={{ color: 'var(--amber-primary)' }}>{num(totals.reviews_changes_requested)} <span>requested</span></div>
                <div className="lbl"><MessageSquareCode size={12} style={{ display: 'inline', marginRight: '4px' }} /> Changes Requested</div>
              </div>
            )}
          </div>

          {/* Top Languages */}
          {topLangs.length > 0 && (
            <div className="gold-card" style={{ padding: '20px' }}>
              <div className="gold-card-header">
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800 }}>
                  <Zap size={14} color="var(--gold-primary)" style={{ display: 'inline', marginRight: '4px' }} />
                  Top Languages (from byte statistics)
                </h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                {topLangs.map((lang) => (
                  <div key={lang.name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontFamily: 'var(--font-mono)', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-main)', fontWeight: 700 }}>{lang.name}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{lang.percentage}%</span>
                    </div>
                    <div style={{ height: '8px', background: 'var(--bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(lang.percentage / maxLangPct) * 100}%`, height: '100%', background: langColor(lang.name), borderRadius: '4px' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="gold-card" style={{ padding: '20px' }}>
            <div className="gold-card-header">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800 }}>GitHub Repositories ({repositories.length})</h3>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Score = commits×10 + merged PRs×35 + issues×20 + reviews×5
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
              {repositories.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No public repositories found. Once you push public code, this list will populate after the next sync.</div>}
              {repositories.slice(0, 20).map((repo) => {
                const rs = repo.statistics || {};
                return (
                  <div key={repo.github_repo_id} style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '10px', padding: '12px 16px', background: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a href={repo.html_url} target="_blank" rel="noreferrer" style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-main)' }}>
                          {repo.full_name} <ExternalLink size={11} />
                        </a>
                        {repo.is_fork && <span className="gold-badge amber" style={{ fontSize: '9px', padding: '1px 6px' }}>fork</span>}
                        {repo.archived && <span className="gold-badge" style={{ fontSize: '9px', padding: '1px 6px' }}>archived</span>}
                      </div>
                      {repo.description && (
                        <div style={{ fontSize: '12px', color: 'var(--text-soft)', marginTop: '3px' }}>{repo.description}</div>
                      )}
                      <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', alignItems: 'center', flexWrap: 'wrap' }}>
                        {repo.primary_language && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: langColor(repo.primary_language), display: 'inline-block' }} />
                            {repo.primary_language}
                          </span>
                        )}
                        <span><Star size={11} style={{ display: 'inline', marginRight: '2px' }} />{repo.stargazers_count || 0}</span>
                        <span><GitFork size={11} style={{ display: 'inline', marginRight: '2px' }} />{repo.forks_count || 0}</span>
                        {repo.open_issues_count > 0 && <span>issues: {repo.open_issues_count}</span>}
                        {repo.license_name && <span>{repo.license_name}</span>}
                        <span>pushed {fmtDate(repo.pushed_at)}</span>
                      </div>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
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
