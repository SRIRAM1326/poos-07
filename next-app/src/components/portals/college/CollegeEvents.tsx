import React, { useEffect, useMemo, useState } from 'react';
import { api } from '@/services/api';
import {
  Search, Calendar, CalendarClock, Activity, BadgeCheck, Users,
  UserCheck, Percent, ChevronDown, ChevronUp, X, Globe, Building2, ExternalLink, ShieldCheck,
} from 'lucide-react';

const EVENT_TYPE_OPTIONS = [
  'Hackathons', 'Workshops', 'Technical seminars', 'Competitions',
  'Conferences', 'Project exhibitions', 'Coding events', 'Career events',
];

interface EventsSummary {
  total_events: number;
  upcoming_events: number;
  active_events: number;
  completed_events: number;
  total_registrations: number;
  total_participants: number;
  participation_rate: number;
  by_type: { event_type: string; count: number }[];
}

interface EnrichedEvent {
  id: number;
  title: string;
  event_type: string;
  description?: string | null;
  event_date?: string | null;
  event_time?: string | null;
  end_date?: string | null;
  location?: string | null;
  is_online?: boolean;
  meeting_url?: string | null;
  organizer?: string | null;
  college?: string | null;
  is_own?: boolean;
  college_verified?: boolean;
  registration_deadline?: string | null;
  participants?: number;
  registered_count?: number;
  max_seats?: number;
  seats_left?: number | null;
  registration_status?: string;
  event_status?: string;
  scope?: string | null;
  is_registered?: boolean;
  recent_participants?: { user_id: number; user_name: string; registered_at?: string | null }[];
}

const inputStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)',
  background: 'var(--bg-subtle)', fontSize: '13px', color: 'var(--text-main)',
};

function StatusBadge({ status }: { status?: string }) {
  const cls = status === 'ACTIVE' ? 'green' : status === 'COMPLETED' ? 'blue' : status === 'CANCELLED' ? 'red' : 'orange';
  return <span className={`gold-badge ${cls}`} style={{ fontSize: '11px' }}>{status || '—'}</span>;
}

function RegistrationBadge({ status }: { status?: string }) {
  const cls = status === 'OPEN' ? 'green' : status === 'FULL' ? 'red' : status === 'COMPLETED' ? 'blue' : 'orange';
  return <span className={`gold-badge ${cls}`} style={{ fontSize: '11px' }}>{status === 'OPEN' ? 'Registration Open' : status === 'FULL' ? 'Full' : status || '—'}</span>;
}

const EMPTY_FORM = {
  title: '', event_type: 'Workshops', description: '', event_date: '', event_time: '',
  end_date: '', location: 'Virtual / Hybrid', is_online: false, meeting_url: '',
  registration_deadline: '', max_seats: '', scope: 'Open to Entire PoOS',
};

export const CollegeEvents: React.FC = () => {
  const [events, setEvents] = useState<EnrichedEvent[]>([]);
  const [summary, setSummary] = useState<EventsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [originFilter, setOriginFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState('');

  const loadData = async () => {
    try {
      const data = await api.getCollegeEventsOverview();
      setEvents(data?.events || []);
      setSummary(data?.summary || null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load events.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getCollegeEventsOverview();
        if (!cancelled) {
          setEvents(data?.events || []);
          setSummary(data?.summary || null);
        }
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to load events.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return events.filter(e => {
      if (statusFilter !== 'ALL' && (e.event_status || '') !== statusFilter) return false;
      if (typeFilter !== 'ALL' && e.event_type !== typeFilter) return false;
      if (originFilter === 'MINE' && !e.is_own) return false;
      if (originFilter === 'ECOSYSTEM' && e.is_own) return false;
      if (!term) return true;
      return [e.title, e.description || '', e.organizer || '', e.location || ''].join(' ').toLowerCase().includes(term);
    });
  }, [events, searchTerm, statusFilter, typeFilter, originFilter]);

  const handleRegister = async (event: EnrichedEvent) => {
    try {
      if (event.is_registered) {
        await api.cancelEventRegistration(event.id);
      } else {
        await api.registerForEvent(event.id);
      }
      setLoading(true);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update registration.');
    }
  };

  const handleComplete = async (event: EnrichedEvent) => {
    try {
      await api.updateEvent(event.id, { event_status: 'COMPLETED' });
      setLoading(true);
      await loadData();
    } catch (err: any) {
      alert(err?.message || 'Failed to update event.');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setFormError('');
    try {
      await api.createEvent({
        title: form.title.trim(),
        event_type: form.event_type,
        description: form.description.trim() || undefined,
        event_date: form.event_date,
        event_time: form.event_time || undefined,
        end_date: form.end_date || undefined,
        location: form.location.trim() || 'Virtual / Hybrid',
        is_online: form.is_online,
        meeting_url: form.meeting_url.trim() || undefined,
        registration_deadline: form.registration_deadline || undefined,
        max_seats: form.max_seats ? parseInt(form.max_seats, 10) : 0,
        scope: form.scope,
      });
      setShowCreate(false);
      setForm(EMPTY_FORM);
      setLoading(true);
      await loadData();
    } catch (err: any) {
      setFormError(err?.message || 'Failed to create event.');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Events — College Activities</h2>
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading events...</div>
      </div>
    );
  }

  const statCards = summary ? [
    { icon: <Calendar size={20} color="var(--purple-primary)" />, accent: 'var(--purple-primary)', value: summary.total_events, label: 'Total Events', hint: 'Events conducted or hosted' },
    { icon: <CalendarClock size={20} color="var(--blue-primary)" />, accent: 'var(--blue-primary)', value: summary.upcoming_events, label: 'Upcoming Events', hint: 'Scheduled in the future' },
    { icon: <Activity size={20} color="var(--green-primary)" />, accent: 'var(--green-primary)', value: summary.active_events, label: 'Active Events', hint: 'Happening now' },
    { icon: <BadgeCheck size={20} color="var(--text-muted)" />, accent: 'var(--text-muted)', value: summary.completed_events, label: 'Completed Events', hint: 'Finished events' },
    { icon: <UserCheck size={20} color="var(--purple-primary)" />, accent: 'var(--purple-primary)', value: summary.total_registrations, label: 'Total Registrations', hint: 'POOS user sign-ups tracked' },
    { icon: <Users size={20} color="var(--blue-primary)" />, accent: 'var(--blue-primary)', value: summary.total_participants, label: 'Total Participants', hint: 'Across all events' },
    { icon: <Percent size={20} color="var(--orange-primary)" />, accent: 'var(--orange-primary)', value: `${summary.participation_rate}%`, label: 'Participation Rate', hint: 'Participants vs total capacity' },
  ] : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeIn 0.3s ease' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>Events — College Activities</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', margin: '4px 0 0 0', maxWidth: '720px' }}>
            Create and manage events, and give POOS users opportunities to participate.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="gold-btn" style={{ background: 'var(--purple-primary)', whiteSpace: 'nowrap' }}>
          + Create Event
        </button>
      </div>

      {error ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Failed to load events: {error}</div>
      ) : (
        <>
          <div>
            <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 12px 0' }}>
              Event Statistics
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
              {statCards.map(card => (
                <div key={card.label} className="stat-box" style={{ borderLeftColor: card.accent }}>
                  <div className="num" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>{card.icon} {card.value}</div>
                  <div className="lbl">{card.label}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>{card.hint}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="gold-card">
            <div className="gold-card-header"><h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Event Types</h3></div>
            <div className="gold-card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
              {(summary?.by_type || []).map(t => (
                <div key={t.event_type} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '8px 12px', background: 'var(--bg-subtle)', border: '1px solid var(--border-color)', borderRadius: '6px' }}>
                  <span style={{ fontWeight: 600 }}>{t.event_type}</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>{t.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="gold-card">
            <div className="gold-card-body" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1 1 220px', minWidth: '200px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '10px' }} />
                <input type="text" placeholder="Search by name, organizer, or location..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ ...inputStyle, width: '100%', paddingLeft: '36px' }} />
              </div>
              <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} style={inputStyle}>
                <option value="ALL">All Events</option>
                <option value="MINE">My College Events</option>
                <option value="ECOSYSTEM">Ecosystem Events</option>
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
                <option value="ALL">Status: All</option>
                <option value="UPCOMING">Upcoming</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
              </select>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={inputStyle}>
                <option value="ALL">All Types</option>
                {EVENT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {events.length === 0 ? 'No events have been created yet. Create your first college activity.' : 'No events match your filters.'}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              {filtered.map(ev => {
                const expanded = expandedId === ev.id;
                return (
                  <div key={ev.id} className="gold-card">
                    <div className="gold-card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
                        <div>
                          <span className="gold-badge" style={{ marginBottom: '8px', display: 'inline-block', fontSize: '11px' }}>{ev.event_type}</span>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{ev.title}</h4>
                        </div>
                        <StatusBadge status={ev.event_status} />
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        <RegistrationBadge status={ev.registration_status} />
                        {ev.is_own && <span className="gold-badge blue" style={{ fontSize: '11px' }}>My College</span>}
                        {ev.college_verified && (
                          <span className="gold-badge green" style={{ fontSize: '11px' }} title="This event is hosted by a verified college on POOS">
                            <ShieldCheck size={12} /> College Verified
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Calendar size={14} /> {ev.event_date || '—'}{ev.event_time ? ` · ${ev.event_time}` : ''}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={14} /> {ev.participants ?? 0} Participants
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
                          {ev.scope === 'Open to Entire PoOS' ? <Globe size={14} /> : <Building2 size={14} />}
                          Scope: <strong style={{ color: 'var(--text-main)' }}>{ev.scope || '—'}</strong>
                        </div>
                        {ev.organizer && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', gridColumn: 'span 2' }}>
                            Organizer: <strong style={{ color: 'var(--text-main)' }}>{ev.organizer}</strong>
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                        <button onClick={() => setExpandedId(expanded ? null : ev.id)}
                          style={{ padding: '6px 12px', background: 'transparent', color: 'var(--purple-primary)', border: '1px solid var(--purple-primary)', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          {expanded ? <>Hide <ChevronUp size={12} /></> : <>Details <ChevronDown size={12} /></>}
                        </button>
                      </div>

                      {expanded && (
                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Event Information</div>
                            <div><strong>Event name:</strong> {ev.title}</div>
                            <div><strong>Event type:</strong> {ev.event_type}</div>
                            {ev.description && <div style={{ marginTop: '4px' }}><strong>Description:</strong> {ev.description}</div>}
                            <div><strong>Date &amp; time:</strong> {ev.event_date || '—'}{ev.event_time ? ` · ${ev.event_time}` : ''}{ev.end_date ? ` → ${ev.end_date}` : ''}</div>
                            <div><strong>Location:</strong> {ev.is_online ? 'Online' : (ev.location || '—')}{ev.is_online && ev.meeting_url ? <> · <a href={ev.meeting_url} target="_blank" rel="noreferrer" style={{ color: 'var(--purple-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>Join link <ExternalLink size={12} /></a></> : ''}</div>
                            <div><strong>Organizer:</strong> {ev.organizer || '—'}{ev.college ? ` · ${ev.college}` : ''}</div>
                            <div><strong>Registration deadline:</strong> {ev.registration_deadline || '—'}</div>
                            <div><strong>Participants:</strong> {ev.participants ?? 0}{typeof ev.max_seats === 'number' && (ev.max_seats || 0) > 0 ? ` / ${ev.max_seats} seats` : ''}{typeof ev.seats_left === 'number' ? ` (${ev.seats_left} left)` : ''}</div>
                            <div><strong>Registration status:</strong> {ev.registration_status || '—'}</div>
                            <div><strong>Event status:</strong> {ev.event_status || '—'}</div>
                          </div>

                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Recent Participants</div>
                            {(ev.recent_participants || []).length === 0 ? (
                              <div style={{ color: 'var(--text-muted)' }}>No registrations tracked yet.</div>
                            ) : (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {(ev.recent_participants || []).map(p => (
                                  <div key={p.user_id} style={{ fontSize: '13px' }}>• {p.user_name}</div>
                                ))}
                              </div>
                            )}
                          </div>

                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {ev.registration_status === 'OPEN' && !ev.is_registered && (
                              <button onClick={() => handleRegister(ev)} style={{ padding: '6px 12px', background: 'var(--purple-primary)', color: 'white', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                Register
                              </button>
                            )}
                            {ev.is_registered && (
                              <button onClick={() => handleRegister(ev)} style={{ padding: '6px 12px', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                Cancel Registration
                              </button>
                            )}
                            {ev.is_own && ev.event_status !== 'COMPLETED' && (
                              <button onClick={() => handleComplete(ev)} style={{ padding: '6px 12px', background: 'transparent', color: 'var(--purple-primary)', border: '1px solid var(--purple-primary)', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}>
                                Mark Completed
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {showCreate && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-surface)', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', border: '1px solid var(--border-color)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Create Event</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Give POOS users an opportunity to participate.</p>
              </div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {formError && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', borderRadius: '8px', fontSize: '13px' }}>{formError}</div>}
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>EVENT NAME *</label>
                <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. AI/ML Workshop Series" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>EVENT TYPE *</label>
                  <select value={form.event_type} onChange={(e) => setForm({ ...form, event_type: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                    {EVENT_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SCOPE</label>
                  <select value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} style={{ ...inputStyle, width: '100%' }}>
                    <option value="Open to Entire PoOS">Open to Entire PoOS</option>
                    <option value="College Only">College Only</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>DESCRIPTION</label>
                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What will participants learn or build?" style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>DATE *</label>
                  <input required value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} placeholder="2026-10-10" style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>TIME</label>
                  <input value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} placeholder="10:00 AM" style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>END DATE</label>
                  <input value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} placeholder="2026-10-12" style={{ ...inputStyle, width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>LOCATION</label>
                  <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Campus Hall / Virtual" style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>MEETING URL (IF ONLINE)</label>
                  <input value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} placeholder="https://meet/..." style={{ ...inputStyle, width: '100%' }} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                <input type="checkbox" checked={form.is_online} onChange={(e) => setForm({ ...form, is_online: e.target.checked })} /> Online event
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>REGISTRATION DEADLINE</label>
                  <input value={form.registration_deadline} onChange={(e) => setForm({ ...form, registration_deadline: e.target.value })} placeholder="2026-10-08" style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>MAX SEATS (0 = UNLIMITED)</label>
                  <input value={form.max_seats} onChange={(e) => setForm({ ...form, max_seats: e.target.value.replace(/[^0-9]/g, '') })} placeholder="e.g. 120" style={{ ...inputStyle, width: '100%' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowCreate(false)} className="gold-btn-outline" style={{ fontSize: '13px' }}>Cancel</button>
                <button type="submit" disabled={creating} className="gold-btn" style={{ fontSize: '13px', background: 'var(--purple-primary)', color: '#fff' }}>
                  {creating ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
