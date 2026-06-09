/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';

// ── Brand ──────────────────────────────────────────────────────────────────
const BRAND = {
  purple: '#6B21A8',
  plum: '#0F0620',
  sage: '#8FA382',
  silver: '#C0C6CC',
  white: '#FFFFFF',
  bg: '#F9FAFB',
};

const LOGOS = {
  silver: 'https://cjnzizyxjoqmmnksfitd.supabase.co/storage/v1/object/public/church-logos/FloremusSilverLogo.png',
  noTagline: 'https://cjnzizyxjoqmmnksfitd.supabase.co/storage/v1/object/public/church-logos/FloremusLogoNoTagline.png',
  withTagline: 'https://cjnzizyxjoqmmnksfitd.supabase.co/storage/v1/object/public/church-logos/FloremusLogoWithTagline.png',
  seal: 'https://cjnzizyxjoqmmnksfitd.supabase.co/storage/v1/object/public/church-logos/ChatGPT%20Image%20Jun%202,%202026,%2011_55_40%20PM.png',
};

// ── Types ──────────────────────────────────────────────────────────────────
interface Church {
  id: string;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoInitials: string;
  logoUrl?: string;
  subscriptionStatus?: string;
  subscriptionTier?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'group_leader' | 'children_worker' | 'member';
  points: number;
  streak: number;
  church: Church;
  avatarUrl?: string;
  directoryOptIn?: boolean;
  bio?: string;
  phone?: string;
}

interface Message {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  group_id?: string | null;
}

interface GivingFund {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  is_default: boolean;
}

interface TheologySettings {
  denomination: string; statement_of_faith: string;
  bible_translation: string; worship_style: string;
  theological_positions: string; restricted_topics: string;
  translation_1: string; translation_2: string; translation_3: string;
  writing_tone: string;
}

interface SermonDraft {
  id?: string;
  sermon_outline: string;
  generated_devotionals?: any[];
  generated_questions?: string[];
  generated_challenge?: any;
  generated_prayer?: string;
  generated_announcement?: string;
  generated_social?: Record<string, string>;
  admin_notes?: string;
  status: string;
}

// ── Helper Components ──────────────────────────────────────────────────────
function FloremusLogo({ size = 80, variant = 'silver' }: { size?: number; variant?: keyof typeof LOGOS }) {
  return (
    <img
      src={LOGOS[variant]}
      alt="Floremus"
      style={{ width: size, height: size, objectFit: 'contain' }}
    />
  );
}

function Avatar({ url, name, size = 36, color }: { url?: string; name: string; size?: number; color?: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        className="rounded-full object-cover flex-shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color || BRAND.purple, fontSize: Math.max(10, size * 0.35) }}
    >
      {(name || '?').charAt(0).toUpperCase()}
    </div>
  );
}

// ── Login Screen ───────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pastorName, setPastorName] = useState('');
  const [churchName, setChurchName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const criteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character (!@#$%)', met: /[!@#$%^&*]/.test(password) },
  ];
  const pwMatch = password === confirm && confirm.length > 0;
  const pwReady = criteria.every(c => c.met);

  const inputCls = 'w-full px-4 py-3 rounded-xl text-white border focus:outline-none focus:border-purple-400';
  const inputSty = { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' };

  async function login() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    setLoading(false);
  }

  async function signup() {
    if (!email || !password || !churchName || !pastorName) {
      alert('Please fill in all fields');
      return;
    }
    if (!pwReady) { alert('Password does not meet all requirements'); return; }
    if (!pwMatch) { alert('Passwords do not match'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { alert(error.message); setLoading(false); return; }
    if (data.user) {
      const initials = churchName.split(' ').map((w: string) => w[0] || '').join('').slice(0, 2).toUpperCase();
      const { data: church, error: ce } = await supabase
        .from('churches')
        .insert({ name: churchName, tagline: '', primary_color: BRAND.purple, logo_initials: initials, subscription_status: 'trial', subscription_tier: 'starter' })
        .select()
        .single();
      if (ce || !church) { alert('Church setup failed. Please contact support.'); setLoading(false); return; }
      await supabase.from('profiles').insert({ id: data.user.id, church_id: church.id, full_name: pastorName, role: 'super_admin', points: 0, streak: 0 });
      await supabase.from('giving_funds').insert({ church_id: church.id, name: 'General Offering', description: 'General church giving', is_default: true, is_active: true });
      alert('Account created! Please sign in.');
      setIsSignUp(false);
    }
    setLoading(false);
  }

  async function resetPassword() {
    if (!email) { alert('Enter your email first'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) alert(error.message);
    else setResetSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ backgroundColor: BRAND.plum }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <FloremusLogo size={180} variant="withTagline" />
        </div>

        {isReset ? (
          <div className="space-y-4">
            {resetSent ? (
              <div className="text-center p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <p className="text-white font-semibold mb-2">Reset email sent</p>
                <p className="text-gray-400 text-sm mb-4">Check your inbox for the reset link.</p>
                <button onClick={() => { setIsReset(false); setResetSent(false); }} className="text-sm" style={{ color: BRAND.sage }}>
                  Back to sign in
                </button>
              </div>
            ) : (
              <>
                <input type="email" placeholder="Email address" value={email}
                  onChange={e => setEmail(e.target.value)} className={inputCls} style={inputSty} />
                <button onClick={resetPassword} disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: BRAND.purple }}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <button onClick={() => setIsReset(false)} className="w-full text-sm text-center" style={{ color: BRAND.sage }}>
                  Back to sign in
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {isSignUp && (
              <>
                <input type="text" placeholder="Your full name" value={pastorName}
                  onChange={e => setPastorName(e.target.value)} className={inputCls} style={inputSty} />
                <input type="text" placeholder="Church name" value={churchName}
                  onChange={e => setChurchName(e.target.value)} className={inputCls} style={inputSty} />
              </>
            )}
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} className={inputCls} style={inputSty} />
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} className={inputCls + ' pr-16'} style={inputSty} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: BRAND.sage }}>
                {showPw ? 'Hide' : 'Show'}
              </button>
            </div>
            {isSignUp && password.length > 0 && (
              <div className="rounded-xl p-3 space-y-1" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: BRAND.silver }}>Password requirements:</p>
                {criteria.map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: c.met ? '#4ade80' : '#6b7280' }}>{c.met ? '✓' : '○'}</span>
                    <span className="text-xs" style={{ color: c.met ? '#4ade80' : '#6b7280' }}>{c.label}</span>
                  </div>
                ))}
              </div>
            )}
            {isSignUp && (
              <div>
                <div className="relative">
                  <input type={showCf ? 'text' : 'password'} placeholder="Confirm password" value={confirm}
                    onChange={e => setConfirm(e.target.value)} className={inputCls + ' pr-16'}
                    style={{ ...inputSty, borderColor: confirm.length > 0 ? (pwMatch ? '#4ade80' : '#f87171') : 'rgba(255,255,255,0.15)' }} />
                  <button type="button" onClick={() => setShowCf(!showCf)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: BRAND.sage }}>
                    {showCf ? 'Hide' : 'Show'}
                  </button>
                </div>
                {confirm.length > 0 && (
                  <p className="text-xs mt-1 ml-1" style={{ color: pwMatch ? '#4ade80' : '#f87171' }}>
                    {pwMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>
            )}
            <button onClick={isSignUp ? signup : login} disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-lg"
              style={{ backgroundColor: BRAND.purple, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Please wait...' : isSignUp ? 'Create Church Account' : 'Sign In'}
            </button>
            {!isSignUp && (
              <button onClick={() => setIsReset(true)} className="w-full text-sm text-center" style={{ color: BRAND.silver }}>
                Forgot your password?
              </button>
            )}
            <p className="text-center text-sm" style={{ color: BRAND.silver }}>
              {isSignUp ? 'Already have an account? ' : 'New to Floremus? '}
              <span className="font-semibold cursor-pointer" style={{ color: BRAND.sage }}
                onClick={() => { setIsSignUp(!isSignUp); setPassword(''); setConfirm(''); }}>
                {isSignUp ? 'Sign in' : 'Create church account'}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Bottom Navigation ──────────────────────────────────────────────────────
function BottomNav({ active, setActive, color }: { active: string; setActive: (t: string) => void; color: string }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'sunday', label: 'Sunday', icon: '📖' },
    { id: 'community', label: 'Community', icon: '🙏' },
    { id: 'groups', label: 'Groups', icon: '👥' },
    { id: 'more', label: 'More', icon: '☰' },
  ];
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex max-w-md mx-auto z-20">
      {tabs.map(t => (
        <button key={t.id} onClick={() => setActive(t.id)} className="flex-1 py-2 flex flex-col items-center gap-0.5">
          <span className="text-lg">{t.icon}</span>
          <span className="text-xs font-medium" style={{ color: active === t.id ? color : '#9CA3AF' }}>{t.label}</span>
          {active === t.id && <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />}
        </button>
      ))}
    </div>
  );
}

// ── Home Screen ────────────────────────────────────────────────────────────
function HomeScreen({ user, setActiveTab, setMoreSub }: { user: User; setActiveTab: (t: string) => void; setMoreSub: (s: string) => void }) {
  const [events, setEvents] = useState<any[]>([]);
  const [devotional, setDevotional] = useState<any>(null);
  const [pinned, setPinned] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { data: ev } = await supabase.from('events').select('*')
        .eq('church_id', user.church.id)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true }).limit(3);
      if (ev) setEvents(ev);

      const day = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];
      const { data: dv } = await supabase.from('devotionals').select('*')
        .eq('church_id', user.church.id).eq('day_of_week', day)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (dv) setDevotional(dv);

      const { data: an } = await supabase.from('announcements').select('*')
.eq('church_id', user.church.id).eq('approved', true).order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(5);
      if (an) setPinned(an);
    })();
  }, [user.church.id]);

  const links = [
    { icon: '📖', title: "Today's Devotional", sub: devotional?.title || 'No devotional today', tab: 'community' },
    { icon: '🙏', title: 'Prayer Wall', sub: 'Share and receive prayer', tab: 'community' },
    { icon: '⚡', title: 'Challenges', sub: 'View active challenges', tab: 'community' },
    { icon: '💳', title: 'Give', sub: 'Support your church', tab: 'more' },
  ];

  return (
    <div className="p-4 space-y-4" style={{ backgroundColor: BRAND.bg, minHeight: '100vh' }}>
      <div className="rounded-2xl p-5 text-white shadow-lg"
        style={{ background: `linear-gradient(135deg, ${user.church.primaryColor}, ${BRAND.plum})` }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm opacity-80">Welcome back,</p>
            <h2 className="text-2xl font-bold">{user.name || user.email}</h2>
            <p className="text-xs opacity-70 mt-1">{user.church.name}</p>
          </div>
          <Avatar url={user.avatarUrl} name={user.name || user.email} size={50} color={BRAND.silver} />
        </div>
        <div className="flex gap-6 mt-2 pt-3 border-t border-white/20">
          <div><p className="text-xs opacity-70">Points</p><p className="text-xl font-bold">{user.points.toLocaleString()}</p></div>
          <div><p className="text-xs opacity-70">Streak</p><p className="text-xl font-bold">{user.streak} days 🔥</p></div>
          <div><p className="text-xs opacity-70">Role</p><p className="text-sm font-semibold capitalize">{user.role.replace('_', ' ')}</p></div>
        </div>
      </div>

     {pinned.map((a, i) => (
        <button key={i} onClick={() => { setMoreSub('ann'); setActiveTab('more'); }}
          className="w-full rounded-xl p-3 border-l-4 bg-white text-left"
          style={{ borderColor: user.church.primaryColor }}>
          <p className="font-semibold text-gray-800 text-sm">📣 {a.title}</p>
          {a.body && <p className="text-gray-500 text-xs mt-1">{a.body}</p>}
          <p className="text-xs mt-1 font-semibold" style={{ color: user.church.primaryColor }}>Tap to view all announcements →</p>
        </button>
      ))}

      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-3">Quick Access</h3>
        <div className="space-y-2">
          {links.map((l, i) => (
            <button key={i} onClick={() => setActiveTab(l.tab)}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-left">
              <span className="text-xl">{l.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{l.title}</p>
                <p className="text-gray-500 text-xs">{l.sub}</p>
              </div>
              <span className="text-gray-400">›</span>
            </button>
          ))}
        </div>
      </div>

      {events.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">Upcoming Events</h3>
          <div className="space-y-3">
            {events.map((ev, i) => {
              const d = new Date(ev.event_date);
              return (
                    <button key={i} onClick={() => { setMoreSub('events'); setActiveTab('more'); }} className="w-full flex items-center gap-3 text-left">
                    <div className="w-12 h-12 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0"
                    style={{ backgroundColor: user.church.primaryColor }}>
                    <span className="text-lg font-bold leading-none">{d.getDate()}</span>
                    <span className="text-xs">{d.toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm">{ev.title}</p>
                    <p className="text-gray-500 text-xs">{ev.location || d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span className="text-gray-400 text-sm">›</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function SundayScreen({ user }: { user: User }) {
  const [tab, setTab] = useState('notes');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [privateNotes, setPrivateNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [shared, setShared] = useState<any[]>([]);
  const [sermon, setSermon] = useState<any>(null);
  const isAdmin = user.role === 'super_admin' || user.role === 'admin';

  useEffect(() => {
    (async () => {
      const { data: sn } = await supabase.from('sermon_notes')
        .select('*, profiles(full_name, avatar_url)')
        .eq('church_id', user.church.id).eq('shared', true)
        .order('created_at', { ascending: false }).limit(10);
      if (sn) setShared(sn);
      const { data: ws } = await supabase.from('weekly_sermon').select('*')
        .eq('church_id', user.church.id).eq('published', true).maybeSingle();
      if (ws) setSermon(ws);
    })();
  }, [user.church.id]);

  async function submitNotes() {
    await supabase.from('sermon_notes').insert({
      church_id: user.church.id, member_id: user.id,
      answers, shared: false, points_awarded: 50,
      private_notes: privateNotes,
    });
    await supabase.from('profiles').update({ points: user.points + 50 }).eq('id', user.id);
    setSubmitted(true);
  }

  function printNotes() {
    const printContent = `
      <html>
      <head>
        <title>Sermon Notes - ${sermon?.title || 'Sunday Service'}</title>
        <style>
          body { font-family: Georgia, serif; max-width: 700px; margin: 40px auto; padding: 20px; color: #1a1a1a; }
          h1 { font-size: 24px; margin-bottom: 4px; }
          .scripture { color: #6B21A8; font-style: italic; margin-bottom: 20px; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 8px; }
          .question { margin-bottom: 12px; }
          .question-text { font-size: 14px; margin-bottom: 4px; }
          .answer-line { border-bottom: 1px solid #ccc; min-height: 24px; padding-bottom: 4px; font-size: 14px; color: #333; }
          .private { background: #f9f9f9; border: 1px solid #eee; padding: 12px; border-radius: 8px; min-height: 80px; }
          .footer { margin-top: 40px; font-size: 11px; color: #999; text-align: center; }
        </style>
      </head>
      <body>
        <h1>${sermon?.title || 'Sermon Notes'}</h1>
        <p class="scripture">${sermon?.scripture || ''}</p>
        ${sermon?.series ? `<p style="font-size:12px;color:#888;">Series: ${sermon.series}</p>` : ''}
        ${sermon?.blanks?.length > 0 ? `
        <div class="section">
          <div class="section-title">Fill in the Blanks</div>
          ${sermon.blanks.map((b: any, i: number) => `
            <div class="question">
              <div class="question-text">${b.label}</div>
              <div class="answer-line">${answers[`blank_${i}`] || ''}</div>
            </div>
          `).join('')}
        </div>` : ''}
        ${sermon?.open_ended?.length > 0 ? `
        <div class="section">
          <div class="section-title">Questions</div>
          ${sermon.open_ended.map((q: string, i: number) => `
            <div class="question">
              <div class="question-text">${q}</div>
              <div class="answer-line">${answers[`open_${i}`] || ''}</div>
            </div>
          `).join('')}
        </div>` : ''}
        ${sermon?.reflections?.length > 0 ? `
        <div class="section">
          <div class="section-title">Reflections</div>
          ${sermon.reflections.map((r: string, i: number) => `
            <div class="question">
              <div class="question-text">${r}</div>
              <div class="answer-line">${answers[`ref_${i}`] || ''}</div>
            </div>
          `).join('')}
        </div>` : ''}
        ${privateNotes ? `
        <div class="section">
          <div class="section-title">My Private Notes</div>
          <div class="private">${privateNotes}</div>
        </div>` : ''}
        <div class="footer">${user.church.name} · ${new Date().toLocaleDateString()} · Powered by Floremus</div>
      </body>
      </html>
    `;
    const win = window.open('', '_blank');
    if (win) { win.document.write(printContent); win.document.close(); win.print(); }
  }

  const tabs = ['notes', 'community', ...(isAdmin ? ['ai assistant'] : [])];

  return (
    <div className="p-4 space-y-4" style={{ backgroundColor: BRAND.bg, minHeight: '100vh' }}>
      <div className="flex gap-2">
        {tabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold capitalize"
            style={{ backgroundColor: tab === t ? user.church.primaryColor : BRAND.white, color: tab === t ? BRAND.white : '#6B7280' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'notes' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            {sermon?.series && (
              <span className="text-xs font-semibold px-2 py-1 rounded-full text-white"
                style={{ backgroundColor: user.church.primaryColor }}>
                {sermon.series}
              </span>
            )}
            <h2 className="text-xl font-bold text-gray-800 mt-2">{sermon?.title || 'Sermon Notes'}</h2>
            <p className="text-gray-500 text-sm">{sermon?.scripture || ''}</p>
          </div>

          {submitted ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-3xl mb-2">🎉</p>
              <p className="font-bold text-gray-800">Notes submitted! +50 points earned</p>
              <button onClick={printNotes}
                className="mt-4 w-full py-3 rounded-xl text-white font-bold"
                style={{ backgroundColor: user.church.primaryColor }}>
                🖨️ Print or Save My Notes
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">

             {sermon?.key_scriptures?.length > 0 ? (
                <div className="space-y-3">
                  {sermon.key_scriptures.map((s: any, i: number) => (
                    <div key={i} className="rounded-xl p-4 border-l-4"
                      style={{ backgroundColor: '#F5F0FF', borderColor: user.church.primaryColor }}>
                      <p className="text-sm font-bold mb-3" style={{ color: user.church.primaryColor }}>{s.reference}</p>
                      {s.versions ? (
                        <div className="space-y-3">
                          {s.versions.map((v: any, j: number) => (
                            <div key={j} className="pt-2 border-t border-purple-100 first:border-0 first:pt-0">
                              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white mb-1 inline-block"
                                style={{ backgroundColor: user.church.primaryColor, opacity: 0.7 }}>
                                {v.translation}
                              </span>
                              <p className="text-gray-700 text-sm italic leading-relaxed mt-1">"{v.text}"</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-800 text-sm italic">"{s.text}"</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : !sermon ? (
                <div className="rounded-xl p-3 border-l-4"
                  style={{ backgroundColor: '#F5F0FF', borderColor: user.church.primaryColor }}>
                  <p className="text-xs font-semibold text-gray-500 mb-1">KEY VERSE</p>
                  <p className="text-gray-800 text-sm italic">"Walk by the Spirit, and you will not gratify the desires of the flesh." — Galatians 5:16</p>
                </div>
              ) : null}

              {sermon?.blanks?.length > 0 && (
                <div>
<p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: user.church.primaryColor }}>Fill in the Blanks</p>
                  {sermon.blanks.map((b: any, i: number) => (
                    <div key={i} className="mb-3">
                      <p className="text-sm text-gray-700 mb-1">{b.label}</p>
                      <input type="text" placeholder="Your answer..."
                        value={answers[`blank_${i}`] || ''}
                        onChange={e => setAnswers({ ...answers, [`blank_${i}`]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                    </div>
                  ))}
                </div>
              )}

              {sermon?.open_ended?.length > 0 && (
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: user.church.primaryColor }}>Questions</p>
                  {sermon.open_ended.map((q: string, i: number) => (
                    <div key={i} className="mb-3">
                      <p className="text-sm text-gray-700 mb-1">{q}</p>
                      <textarea placeholder="Your answer..."
                        value={answers[`open_${i}`] || ''}
                        onChange={e => setAnswers({ ...answers, [`open_${i}`]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none h-20 resize-none" />
                    </div>
                  ))}
                </div>
              )}

              {sermon?.reflections?.length > 0 && (
                <div>
<p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: user.church.primaryColor }}>Reflections</p>
                  {sermon.reflections.map((r: string, i: number) => (
                    <div key={i} className="mb-3">
                      <p className="text-sm text-gray-700 mb-1">{r}</p>
                      <textarea placeholder="Your reflection..."
                        value={answers[`ref_${i}`] || ''}
                        onChange={e => setAnswers({ ...answers, [`ref_${i}`]: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none h-20 resize-none" />
                    </div>
                  ))}
                </div>
              )}

              <div>
<p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: user.church.primaryColor }}>My Private Notes</p>
                <textarea placeholder="Personal notes just for you. These are never shared..."
                  value={privateNotes}
                  onChange={e => setPrivateNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none h-24 resize-none" />
                <p className="text-xs text-gray-400 mt-1">Private and visible only to you</p>
              </div>

              <div className="flex gap-2">
                <button onClick={printNotes}
                  className="flex-1 py-3 rounded-xl font-bold border text-sm"
                  style={{ color: user.church.primaryColor, borderColor: user.church.primaryColor }}>
                  🖨️ Print Notes
                </button>
                <button onClick={submitNotes}
                  className="flex-1 py-3 rounded-xl text-white font-bold"
                  style={{ backgroundColor: user.church.primaryColor }}>
                  Submit (+50 pts)
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'community' && (
        <div className="space-y-3">
          {shared.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No shared notes yet.</p>
            </div>
          ) : (
            shared.map((note, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar url={note.profiles?.avatar_url} name={note.profiles?.full_name || 'Member'} size={32} color={user.church.primaryColor} />
                  <p className="font-semibold text-gray-800 text-sm">{note.profiles?.full_name || 'Anonymous'}</p>
                </div>
                {note.answers && Object.values(note.answers).map((a: any, j: number) =>
                  a && <p key={j} className="text-gray-600 text-sm mt-1">"{a}"</p>
                )}
                {isAdmin && (
                  <button onClick={async () => {
                    await supabase.from('sermon_notes').update({ shared: false }).eq('id', note.id);
                    setShared(shared.filter(n => n.id !== note.id));
                  }} className="mt-2 text-xs text-red-400">Remove</button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'ai assistant' && isAdmin && <AISermonAssistant user={user} />}
    </div>
  );
}

function SermonNotesEditor({ user }: { user: User }) {
  const [sermon, setSermon] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('weekly_sermon').select('*')
        .eq('church_id', user.church.id).maybeSingle();
      if (data) setSermon(data);
    })();
  }, [user.church.id]);

  async function save(published: boolean) {
    if (!sermon) return;
    setSaving(true);
    await supabase.from('weekly_sermon').upsert({
      ...sermon,
      church_id: user.church.id,
      published,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'church_id' });
    setSaving(false);
    alert(published ? 'Notes published to members!' : 'Notes saved as draft.');
  }

  if (!sermon) return (
    <div className="p-3 rounded-xl bg-gray-50 text-center">
      <p className="text-gray-400 text-xs">Generate content first to see sermon notes here.</p>
    </div>
  );

  return (
    <div className="space-y-3 p-3 rounded-xl border border-gray-100">
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Sermon Title</label>
        <input type="text" value={sermon.title || ''}
          onChange={e => setSermon({ ...sermon, title: e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scripture</label>
        <input type="text" value={sermon.scripture || ''}
          onChange={e => setSermon({ ...sermon, scripture: e.target.value })}
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Fill in the Blanks</label>
        {(sermon.blanks || []).map((b: any, i: number) => (
          <div key={i} className="mb-2">
            <input type="text" value={b.label || ''}
              onChange={e => {
                const updated = [...sermon.blanks];
                updated[i] = { ...updated[i], label: e.target.value };
                setSermon({ ...sermon, blanks: updated });
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        ))}
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Open Ended Questions</label>
        {(sermon.open_ended || []).map((q: string, i: number) => (
          <div key={i} className="mb-2">
            <input type="text" value={q}
              onChange={e => {
                const updated = [...sermon.open_ended];
                updated[i] = e.target.value;
                setSermon({ ...sermon, open_ended: updated });
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        ))}
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">Reflection Questions</label>
        {(sermon.reflections || []).map((r: string, i: number) => (
          <div key={i} className="mb-2">
            <input type="text" value={r}
              onChange={e => {
                const updated = [...sermon.reflections];
                updated[i] = e.target.value;
                setSermon({ ...sermon, reflections: updated });
              }}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <button onClick={() => save(false)} disabled={saving}
          className="flex-1 py-2 rounded-xl border text-sm font-semibold text-gray-500">
          Save Draft
        </button>
        <button onClick={() => save(true)} disabled={saving}
          className="flex-1 py-2 rounded-xl text-white text-sm font-semibold"
          style={{ backgroundColor: user.church.primaryColor }}>
          Publish Notes
        </button>
      </div>
    </div>
  );
}

// ── AI Sermon Assistant ────────────────────────────────────────────────────
function AISermonAssistant({ user }: { user: User }) {
  const [step, setStep] = useState<'theology' | 'input' | 'draft'>('theology');
  const [theology, setTheology] = useState<TheologySettings>({
    denomination: '', statement_of_faith: '', bible_translation: 'KJV',
    worship_style: '', theological_positions: '', restricted_topics: '',
    translation_1: 'KJV', translation_2: '', translation_3: '',
    writing_tone: 'Conversational',
  });
  const [outline, setOutline] = useState('');
  const [generating, setGenerating] = useState(false);
  const [draft, setDraft] = useState<SermonDraft | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('theology_settings')
        .select('*').eq('church_id', user.church.id).maybeSingle();
      if (data) { setTheology(data); setStep('input'); }
    })();
  }, [user.church.id]);

  async function saveTheology() {
    await supabase.from('theology_settings').upsert(
      { church_id: user.church.id, ...theology, updated_at: new Date().toISOString() },
      { onConflict: 'church_id' }
    );
    setStep('input');
  }

  async function generate() {
    if (!outline.trim()) { alert('Please enter your sermon outline'); return; }
    setGenerating(true);

    const selectedTranslations = [theology.translation_1, theology.translation_2, theology.translation_3].filter(Boolean);
    const translationsStr = selectedTranslations.length > 0 ? selectedTranslations.join(', ') : 'KJV';

    try {
      // ── CALL 1: Weekly content ─────────────────────────────────────────
      const res1 = await fetch('https://cjnzizyxjoqmmnksfitd.supabase.co/functions/v1/sermon-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline, theology, call: 'weekly' }),
      });
      const data1 = await res1.json();
      const text1 = (data1.text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const match1 = text1.match(/\{[\s\S]*\}/);
      if (!match1) { alert('Could not generate weekly content. Please try again.'); setGenerating(false); return; }
      let p1: any;
      try { p1 = JSON.parse(match1[0]); } catch { alert('Could not parse weekly content. Please try again.'); setGenerating(false); return; }

      // ── CALL 2: Sermon notes and key scriptures ────────────────────────
      const res2 = await fetch('https://cjnzizyxjoqmmnksfitd.supabase.co/functions/v1/sermon-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ outline, theology, call: 'notes' }),
      });
      const data2 = await res2.json();
      const text2 = (data2.text || '').replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const match2 = text2.match(/\{[\s\S]*\}/);
      if (!match2) { alert('Could not generate sermon notes. Please try again.'); setGenerating(false); return; }
      let p2: any;
      try { p2 = JSON.parse(match2[0]); } catch { alert('Could not parse sermon notes. Please try again.'); setGenerating(false); return; }

      // ── Save sermon notes to weekly_sermon ─────────────────────────────
      await supabase.from('weekly_sermon').upsert({
        church_id: user.church.id,
        title: p2.sermon_notes?.title || '',
        scripture: p2.sermon_notes?.scripture || '',
        series: p2.sermon_notes?.series || null,
        blanks: p2.sermon_notes?.blanks || [],
        open_ended: p2.sermon_notes?.open_ended || [],
        reflections: p2.sermon_notes?.reflections || [],
        key_scriptures: p2.key_scriptures || [],
        bible_translations: translationsStr,
        published: false,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'church_id' });

      // ── Save draft ─────────────────────────────────────────────────────
      const nd: SermonDraft = {
        sermon_outline: outline,
        generated_devotionals: p1.devotionals,
        generated_questions: p1.small_group_questions,
        generated_challenge: p1.challenge,
        generated_prayer: p1.prayer_prompt,
        generated_announcement: p1.announcement,
        generated_social: p1.social_captions,
        admin_notes: '',
        status: 'draft',
      };
      const { data: saved } = await supabase.from('sermon_drafts')
        .insert({ church_id: user.church.id, created_by: user.id, ...nd })
        .select().single();
      setDraft({ ...nd, id: saved?.id });
      setStep('draft');

    } catch (e) {
      alert('Generation failed. Check your connection and try again.');
      console.error(e);
    }
    setGenerating(false);
  }

  async function updateField(field: string, value: any) {
    if (!draft?.id) return;
    await supabase.from('sermon_drafts').update({ [field]: value }).eq('id', draft.id);
    setDraft(prev => prev ? { ...prev, [field]: value } : null);
  }

async function publish() {
    if (!draft?.id) return;

    await supabase.from('sermon_drafts').update({ status: 'published' }).eq('id', draft.id);

    if (draft.generated_devotionals) {
      for (const d of draft.generated_devotionals) {
        await supabase.from('devotionals').insert({
          church_id: user.church.id,
          author_id: user.id,
          title: d.title,
          scripture: d.scripture,
          body: d.body,
          day_of_week: d.day,
        });
      }
    }

    await supabase.from('weekly_sermon').update({ published: true }).eq('church_id', user.church.id);

    alert('Content published!');
    setStep('input');
    setDraft(null);
    setOutline('');
  }

 const theologyFields = [
    { label: 'Denomination', key: 'denomination', ph: 'e.g. Pentecostal, Baptist, Non-denominational', ta: false },
    { label: 'Worship Style', key: 'worship_style', ph: 'e.g. Contemporary, Traditional, Blended', ta: false },
    { label: 'Statement of Faith', key: 'statement_of_faith', ph: 'Brief summary of your core beliefs...', ta: true },
    { label: 'Key Theological Positions', key: 'theological_positions', ph: 'Doctrinal positions the AI should reflect...', ta: true },
    { label: 'Topics to Never Include', key: 'restricted_topics', ph: 'Topics or positions the AI should avoid...', ta: true },
  ];

  return (
    <div className="space-y-4">
      {step === 'theology' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <h3 className="font-bold text-gray-800 text-lg">Theology Settings</h3>
          <p className="text-gray-500 text-sm">Configure your church doctrine so all AI content aligns with your beliefs.</p>
          {theologyFields.map((f, i) => (
            <div key={i}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
              {f.ta ? (
                <textarea placeholder={f.ph} value={(theology as any)[f.key]}
                  onChange={e => setTheology({ ...theology, [f.key]: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none h-20 resize-none" />
              ) : (
                <input type="text" placeholder={f.ph} value={(theology as any)[f.key]}
                  onChange={e => setTheology({ ...theology, [f.key]: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
              )}
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Writing Tone</label>
            <p className="text-xs text-gray-400 mb-2">How should the AI write content for your church?</p>
            <select value={theology.writing_tone}
              onChange={e => setTheology({ ...theology, writing_tone: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
              {['Expository','Conversational','Prophetic','Teaching','Evangelistic','Devotional','Encouraging'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bible Translations (up to 3)</label>
            <p className="text-xs text-gray-400 mb-2">Each selected translation will appear on Sunday notes.</p>
            {[
              { label: 'Translation 1', key: 'translation_1' },
              { label: 'Translation 2 (optional)', key: 'translation_2' },
              { label: 'Translation 3 (optional)', key: 'translation_3' },
            ].map((f, i) => (
              <div key={i} className="mb-2">
                <label className="text-xs text-gray-400">{f.label}</label>
                <select value={(theology as any)[f.key]}
                  onChange={e => setTheology({ ...theology, [f.key]: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                  <option value="">None</option>
                  {['KJV','NKJV','NIV','ESV','NLT','AMP','NASB','CSB','MSG','NCV','HCSB','RSV','NRSV','TLB','GNT','NET','WEB','ASV','YLT','DBY'].map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
          <button onClick={saveTheology}
            className="w-full py-3 rounded-xl text-white font-bold"
            style={{ backgroundColor: user.church.primaryColor }}>
            Save and Continue
          </button>
        </div>
      )}

      {step === 'input' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-lg">AI Sermon Assistant</h3>
            <button onClick={() => setStep('theology')}
              className="text-xs px-3 py-1 rounded-full border"
              style={{ color: user.church.primaryColor, borderColor: user.church.primaryColor }}>
              Edit Theology
            </button>
          </div>
          <textarea
            placeholder="Paste your sermon title, scripture, main points, illustrations, and notes here..."
            value={outline} onChange={e => setOutline(e.target.value)}
            className="w-full px-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none resize-none h-40" />
          <div className="rounded-xl p-3" style={{ backgroundColor: '#F5F0FF' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: user.church.primaryColor }}>Will generate:</p>
            <div className="grid grid-cols-2 gap-1">
              {['5 Daily Devotionals','Small Group Questions','Weekly Challenge','Prayer Prompt','Announcement','3 Social Captions'].map((x, i) => (
                <p key={i} className="text-xs text-gray-600">✓ {x}</p>
              ))}
            </div>
          </div>
          <button onClick={generate} disabled={generating}
            className="w-full py-3 rounded-xl text-white font-bold"
            style={{ backgroundColor: user.church.primaryColor, opacity: generating ? 0.7 : 1 }}>
            {generating ? 'Generating...' : 'Generate Content'}
          </button>
        </div>
      )}

      {step === 'draft' && draft && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Generated Content</h3>
            <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Draft</span>
          </div>
          <p className="text-gray-500 text-xs">Review and edit before publishing. Nothing goes live until you click Publish.</p>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Daily Devotionals</p>
            {(draft.generated_devotionals || []).map((dv: any, i: number) => (
              <div key={i} className="mb-3 p-3 rounded-xl border border-gray-100">
                <p className="text-xs font-bold mb-1" style={{ color: user.church.primaryColor }}>{dv.day}</p>
                <input type="text" defaultValue={dv.title || ''}
                  onBlur={e => {
                    const u = [...(draft.generated_devotionals || [])];
                    u[i] = { ...u[i], title: e.target.value };
                    updateField('generated_devotionals', u);
                  }}
                  className="w-full font-semibold text-gray-800 text-sm border-0 focus:outline-none" />
                <textarea defaultValue={dv.body || ''}
                  onBlur={e => {
                    const u = [...(draft.generated_devotionals || [])];
                    u[i] = { ...u[i], body: e.target.value };
                    updateField('generated_devotionals', u);
                  }}
                  className="w-full text-gray-600 text-xs border-0 focus:outline-none resize-none h-16 mt-1" />
              </div>
            ))}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Small Group Questions</p>
            {(draft.generated_questions || []).map((q: string, i: number) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="text-xs text-gray-400 mt-2 flex-shrink-0">{i + 1}.</span>
                <input type="text" defaultValue={q}
                  onBlur={e => {
                    const u = [...(draft.generated_questions || [])];
                    u[i] = e.target.value;
                    updateField('generated_questions', u);
                  }}
                  className="flex-1 text-sm text-gray-700 border-b border-gray-200 focus:outline-none pb-1" />
              </div>
            ))}
            <button onClick={() => updateField('generated_questions', [...(draft.generated_questions || []), 'New question'])}
              className="text-xs mt-1" style={{ color: user.church.primaryColor }}>+ Add question</button>
          </div>

          {draft.generated_social && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Social Captions</p>
              {Object.entries(draft.generated_social).map(([key, val]) => (
                <div key={key} className="mb-2">
                  <p className="text-xs text-gray-400 capitalize mb-1">{key}:</p>
                  <textarea defaultValue={val as string}
                    onBlur={e => updateField('generated_social', { ...draft.generated_social, [key]: e.target.value })}
                    className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-2 focus:outline-none resize-none h-16" />
                </div>
              ))}
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Prayer Prompt</p>
           <textarea defaultValue={draft.generated_prayer || ''}
              onBlur={e => updateField('generated_prayer', e.target.value)}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-2 focus:outline-none resize-none h-16" />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Announcement</p>
          <textarea defaultValue={draft.generated_announcement || ''}
              onBlur={e => updateField('generated_announcement', e.target.value)}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-2 focus:outline-none resize-none h-16" />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Personal Notes</p>
            <textarea defaultValue={draft.admin_notes || ''}
              onBlur={e => updateField('admin_notes', e.target.value)}
              placeholder="Add notes, reminders, or additional context..."
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl p-2 focus:outline-none resize-none h-20" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Sunday Sermon Notes</p>
            <SermonNotesEditor user={user} />
          </div>

          <div className="flex gap-2">
            <button onClick={() => { setStep('input'); setDraft(null); }}
              className="flex-1 py-3 rounded-xl font-bold border"
              style={{ color: user.church.primaryColor, borderColor: user.church.primaryColor }}>
              Discard
            </button>
            <button onClick={publish}
              className="flex-1 py-3 rounded-xl font-bold text-white"
              style={{ backgroundColor: user.church.primaryColor }}>
              Publish All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
function DevotionalAccordion({ user, devotionals }: { user: User; devotionals: any[] }) {
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [read, setRead] = useState<Record<string, boolean>>({});
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()];

  const byDay = days.reduce((acc: Record<string, any>, day) => {
    const dv = devotionals.find(d => d.day_of_week === day);
    if (dv) acc[day] = dv;
    return acc;
  }, {});

  if (devotionals.length === 0) return (
    <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
      <p className="text-gray-400 text-sm">No devotionals posted yet.</p>
    </div>
  );

  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-400 text-center mb-2">Tap a day to read</p>
      {days.filter(day => byDay[day]).map((day, i) => {
        const dv = byDay[day];
        const isOpen = openDay === day;
        const isToday = day === today;
        const isRead = read[day];
        return (
          <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button onClick={() => setOpenDay(isOpen ? null : day)}
              className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: isRead ? '#4ade80' : isToday ? user.church.primaryColor : '#E5E7EB', color: isRead || isToday ? BRAND.white : '#6B7280' }}>
                  {isRead ? '✓' : day.slice(0, 2)}
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800 text-sm">{day}</p>
                  <p className="text-xs text-gray-500">{dv.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isToday && !isRead && (
                  <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold"
                    style={{ backgroundColor: user.church.primaryColor }}>Today</span>
                )}
                <span className="text-gray-400 text-lg">{isOpen ? '∧' : '∨'}</span>
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-4 border-t border-gray-50">
                <div className="mt-3 mb-3 p-3 rounded-xl border-l-4"
                  style={{ backgroundColor: '#F5F0FF', borderColor: user.church.primaryColor }}>
                  <p className="text-xs font-semibold mb-1" style={{ color: user.church.primaryColor }}>SCRIPTURE</p>
                  <p className="text-gray-700 text-sm italic">{dv.scripture}</p>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">{dv.body}</p>
                {dv.reflection && (
                  <div className="p-3 rounded-xl bg-gray-50 mb-4">
                    <p className="text-xs font-semibold text-gray-500 mb-1">REFLECT</p>
                    <p className="text-gray-600 text-sm italic">{dv.reflection}</p>
                  </div>
                )}
                {!isRead && (
                  <button onClick={async () => {
                    await supabase.from('profiles').update({ points: user.points + 20 }).eq('id', user.id);
                    setRead({ ...read, [day]: true });
                    setOpenDay(null);
                  }} className="w-full py-3 rounded-xl text-white text-sm font-semibold"
                    style={{ backgroundColor: user.church.primaryColor }}>
                    Mark as Read (+20 pts)
                  </button>
                )}
                {isRead && (
                  <p className="text-center text-green-600 text-sm font-semibold">✓ Completed</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
function ChallengeCard({ challenge: c, user }: { challenge: any; user: User }) {
  const [expanded, setExpanded] = useState(false);
  const [joined, setJoined] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('challenge_participants')
        .select('*').eq('challenge_id', c.id).eq('member_id', user.id).maybeSingle();
      if (data) { setJoined(true); setProgress(data.progress || 0); }
    })();
  }, [c.id, user.id]);

  async function join() {
    setLoading(true);
    await supabase.from('challenge_participants').insert({
      challenge_id: c.id, member_id: user.id, progress: 0,
    });
    setJoined(true);
    setLoading(false);
  }

  async function logProgress() {
    if (!joined) return;
    const newProgress = Math.min(progress + 1, c.total_days || 1);
    await supabase.from('challenge_participants')
      .update({ progress: newProgress, completed: newProgress >= (c.total_days || 1) })
      .eq('challenge_id', c.id).eq('member_id', user.id);
    if (newProgress >= (c.total_days || 1)) {
      await supabase.from('profiles').update({ points: user.points + (c.points || 100) }).eq('id', user.id);
      alert(`Challenge complete! +${c.points || 100} points earned!`);
    } else {
      alert(`Day ${newProgress} logged! Keep going!`);
    }
    setProgress(newProgress);
  }

  const totalDays = c.total_days || 7;
  const pct = Math.round((progress / totalDays) * 100);

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <button onClick={() => setExpanded(!expanded)} className="w-full p-4 text-left">
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-gray-800 text-sm flex-1 pr-2">{c.title}</h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: user.church.primaryColor }}>{c.type}</span>
            <span className="text-gray-400">{expanded ? '∧' : '∨'}</span>
          </div>
        </div>
        <p className="text-xs text-gray-500">{c.points} points · {totalDays} days</p>
        {joined && (
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progress</span>
              <span>{progress}/{totalDays} days</span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: user.church.primaryColor }} />
            </div>
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-50 space-y-3">
          {c.description && (
            <p className="text-gray-600 text-sm pt-3 leading-relaxed">{c.description}</p>
          )}
          {c.type === 'Streak' && (
            <div className="flex gap-1">
              {Array.from({ length: totalDays }).map((_, d) => (
                <div key={d} className="flex-1 h-2 rounded-full"
                  style={{ backgroundColor: d < progress ? user.church.primaryColor : '#E5E7EB' }} />
              ))}
            </div>
          )}
          {!joined ? (
            <button onClick={join} disabled={loading}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: user.church.primaryColor, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Joining...' : 'Join Challenge'}
            </button>
          ) : progress >= totalDays ? (
            <div className="text-center py-2">
              <p className="text-2xl mb-1">🏆</p>
              <p className="font-bold text-green-600 text-sm">Challenge Complete!</p>
            </div>
          ) : (
            <button onClick={logProgress}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: user.church.primaryColor }}>
              Log Today's Progress (+{Math.round((c.points || 100) / totalDays)} pts)
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Community Screen ───────────────────────────────────────────────────────
function CommunityScreen({ user }: { user: User }) {
  const [tab, setTab] = useState('prayer');
  const [prayers, setPrayers] = useState<any[]>([]);
  const [challenges, setChallenges] = useState<any[]>([]);
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [msgs, setMsgs] = useState<Message[]>([]);
  const [prayerText, setPrayerText] = useState('');
  const [chatText, setChatText] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function load() {
    const { data: pr } = await supabase.from('prayer_requests')
      .select('*, profiles(full_name, avatar_url)')
      .eq('church_id', user.church.id).eq('is_private', false).eq('is_answered', false)
      .order('created_at', { ascending: false }).limit(10);
    if (pr) setPrayers(pr);

    const { data: ch } = await supabase.from('challenges').select('*')
      .eq('church_id', user.church.id).order('created_at', { ascending: false }).limit(5);
    if (ch) setChallenges(ch);

    const { data: dv } = await supabase.from('devotionals').select('*')
      .eq('church_id', user.church.id).order('created_at', { ascending: false }).limit(5);
    if (dv) setDevotionals(dv);

    const { data: cm } = await supabase.from('chat_messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('church_id', user.church.id).is('group_id', null).eq('is_deleted', false)
      .order('created_at', { ascending: true }).limit(50);
    if (cm) setMsgs(cm.map((m: any) => ({
      id: m.id, content: m.content, author_id: m.author_id,
      author_name: m.profiles?.full_name || 'Member',
      author_avatar: m.profiles?.avatar_url,
      created_at: m.created_at, group_id: null,
    })));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
    const channel = supabase.channel('community-chat')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `church_id=eq.${user.church.id}`,
      }, (payload: any) => {
        setMsgs(prev => [...prev, {
          id: payload.new.id, content: payload.new.content,
          author_id: payload.new.author_id, author_name: 'Member',
          created_at: payload.new.created_at, group_id: null,
        }]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user.church.id]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => { setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }, [msgs]);

  async function postPrayer() {
    if (!prayerText.trim()) return;
    await supabase.from('prayer_requests').insert({
      church_id: user.church.id, author_id: user.id,
      body: prayerText, is_private: isPrivate,
    });
    setPrayerText(''); load();
  }

  async function sendChat() {
    if (!chatText.trim()) return;
    await supabase.from('chat_messages').insert({
      church_id: user.church.id, author_id: user.id, content: chatText, group_id: null,
    });
    setChatText('');
  }

  return (
    <div className="p-4 space-y-4" style={{ backgroundColor: BRAND.bg, minHeight: '100vh' }}>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {['prayer', 'challenges', 'devotional', 'chat'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-sm font-semibold capitalize"
            style={{ backgroundColor: tab === t ? user.church.primaryColor : BRAND.white, color: tab === t ? BRAND.white : '#6B7280' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'prayer' && (
        <div className="space-y-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <textarea placeholder="Share a prayer request with your church..."
              value={prayerText} onChange={e => setPrayerText(e.target.value)}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-xl px-3 py-2 h-20 resize-none focus:outline-none" />
            <div className="flex items-center justify-between mt-2">
              <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="rounded" />
                Private (admin only)
              </label>
              <button onClick={postPrayer}
                className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: user.church.primaryColor }}>Post</button>
            </div>
          </div>
          {prayers.map((p, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <Avatar url={p.profiles?.avatar_url} name={p.profiles?.full_name || 'Member'} size={32} color={user.church.primaryColor} />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{p.profiles?.full_name || 'Anonymous'}</p>
                  <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="text-gray-600 text-sm mb-3">{p.body}</p>
              <div className="flex gap-3">
                <button onClick={async () => {
                  await supabase.from('prayer_requests').update({ pray_count: (p.pray_count || 0) + 1 }).eq('id', p.id);
                  load();
                }} className="text-sm font-semibold" style={{ color: user.church.primaryColor }}>
                  🙏 Pray ({p.pray_count || 0})
                </button>
                {(user.id === p.author_id || user.role === 'super_admin' || user.role === 'admin') && (
                  <button onClick={async () => {
                    await supabase.from('prayer_requests').update({ is_answered: true }).eq('id', p.id);
                    load();
                  }} className="text-sm text-green-600 font-semibold">✓ Answered</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'challenges' && (
        <div className="space-y-3">
          {challenges.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No active challenges yet.</p>
            </div>
          ) : challenges.map((c, i) => (
            <ChallengeCard key={i} challenge={c} user={user} />
          ))}
        </div>
      )}

     {tab === 'devotional' && (
        <DevotionalAccordion user={user} devotionals={devotionals} />
      )}

      {tab === 'chat' && (
        <div className="bg-white rounded-2xl shadow-sm flex flex-col" style={{ height: '60vh' }}>
          <div className="p-3 border-b border-gray-100">
            <h3 className="font-bold text-gray-800 text-sm">Church Chat</h3>
            <p className="text-xs text-gray-400">All members</p>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {msgs.map((m, i) => {
              const own = m.author_id === user.id;
              return (
                <div key={i} className={`flex gap-2 ${own ? 'flex-row-reverse' : ''}`}>
                  {!own && <Avatar url={m.author_avatar} name={m.author_name} size={28} color={user.church.primaryColor} />}
                  <div className={`max-w-xs flex flex-col ${own ? 'items-end' : 'items-start'}`}>
                    {!own && <p className="text-xs text-gray-400 mb-1">{m.author_name}</p>}
                    <div className="px-3 py-2 rounded-2xl text-sm"
                      style={{ backgroundColor: own ? user.church.primaryColor : '#F3F4F6', color: own ? BRAND.white : '#1F2937' }}>
                      {m.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input type="text" placeholder="Type a message..." value={chatText}
              onChange={e => setChatText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendChat(); }}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            <button onClick={sendChat}
              className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: user.church.primaryColor }}>Send</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Groups Screen ──────────────────────────────────────────────────────────
function GroupsScreen({ user }: { user: User }) {
  const [tab, setTab] = useState('groups');
  const [groups, setGroups] = useState<any[]>([]);
  const [board, setBoard] = useState<any[]>([]);
  const [selGroup, setSelGroup] = useState<any>(null);
  const [gMsgs, setGMsgs] = useState<Message[]>([]);
  const [chatText, setChatText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: g } = await supabase.from('groups')
        .select('*')
        .eq('church_id', user.church.id).order('created_at', { ascending: false });
      if (g) setGroups(g);
      const { data: lb } = await supabase.from('profiles')
        .select('id, full_name, avatar_url, points, streak')
        .eq('church_id', user.church.id).order('points', { ascending: false }).limit(10);
      if (lb) setBoard(lb);
    })();
  }, [user.church.id]);

  useEffect(() => {
    if (!selGroup) return;
    (async () => {
      const { data } = await supabase.from('chat_messages')
        .select('*, profiles(full_name, avatar_url)')
        .eq('group_id', selGroup.id).eq('is_deleted', false)
        .order('created_at', { ascending: true }).limit(50);
      if (data) setGMsgs(data.map((m: any) => ({
        id: m.id, content: m.content, author_id: m.author_id,
        author_name: m.profiles?.full_name || 'Member',
        author_avatar: m.profiles?.avatar_url,
        created_at: m.created_at, group_id: m.group_id,
      })));
    })();
    const channel = supabase.channel(`group-${selGroup.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `group_id=eq.${selGroup.id}`,
      }, (payload: any) => {
        setGMsgs(prev => [...prev, {
          id: payload.new.id, content: payload.new.content,
          author_id: payload.new.author_id, author_name: 'Member',
          created_at: payload.new.created_at, group_id: payload.new.group_id,
        }]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selGroup]);

useEffect(() => { setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100); }, [gMsgs]);

  async function sendMsg() {
    if (!chatText.trim() || !selGroup) return;
    await supabase.from('chat_messages').insert({
      church_id: user.church.id, group_id: selGroup.id,
      author_id: user.id, content: chatText,
    });
    setChatText('');
  }

  if (selGroup) return (
    <div className="p-4" style={{ backgroundColor: BRAND.bg, minHeight: '100vh' }}>
      <div className="bg-white rounded-2xl shadow-sm flex flex-col" style={{ height: '70vh' }}>
        <div className="p-3 border-b border-gray-100 flex items-center gap-2">
          <button onClick={() => setSelGroup(null)} className="text-gray-400 text-lg">‹</button>
          <div>
            <h3 className="font-bold text-gray-800 text-sm">{selGroup.name}</h3>
            <p className="text-xs text-gray-400">Group Chat</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {gMsgs.map((m, i) => {
            const own = m.author_id === user.id;
            return (
              <div key={i} className={`flex gap-2 ${own ? 'flex-row-reverse' : ''}`}>
                {!own && <Avatar url={m.author_avatar} name={m.author_name} size={28} color={user.church.primaryColor} />}
                <div className={`max-w-xs flex flex-col ${own ? 'items-end' : 'items-start'}`}>
                  {!own && <p className="text-xs text-gray-400 mb-1">{m.author_name}</p>}
                  <div className="px-3 py-2 rounded-2xl text-sm"
                    style={{ backgroundColor: own ? user.church.primaryColor : '#F3F4F6', color: own ? BRAND.white : '#1F2937' }}>
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <div className="p-3 border-t border-gray-100 flex gap-2">
          <input type="text" placeholder="Type a message..." value={chatText}
            onChange={e => setChatText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') sendMsg(); }}
            className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          <button onClick={sendMsg}
            className="px-4 py-2 rounded-xl text-white text-sm font-semibold"
            style={{ backgroundColor: user.church.primaryColor }}>Send</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 space-y-4" style={{ backgroundColor: BRAND.bg, minHeight: '100vh' }}>
      <div className="flex gap-2">
        {['groups', 'leaderboard'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold capitalize"
            style={{ backgroundColor: tab === t ? user.church.primaryColor : BRAND.white, color: tab === t ? BRAND.white : '#6B7280' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'groups' && (
        <div className="space-y-3">
          {groups.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
              <p className="text-gray-400 text-sm">No groups yet.</p>
            </div>
          ) : groups.map((g, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                  style={{ backgroundColor: user.church.primaryColor }}>
                  {g.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{g.name}</p>
                  <p className="text-xs text-gray-500">Leader: {g.profiles?.full_name || 'TBD'}</p>
                </div>
              </div>
              <button onClick={() => setSelGroup(g)}
                className="px-3 py-1 rounded-xl text-white text-xs font-semibold"
                style={{ backgroundColor: user.church.primaryColor }}>Chat</button>
            </div>
          ))}
        </div>
      )}

      {tab === 'leaderboard' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4">Points Leaderboard</h3>
          <div className="space-y-3">
            {board.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-xl"
                style={{ backgroundColor: m.id === user.id ? '#F5F0FF' : 'transparent' }}>
                <span className="w-7 text-center font-bold">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </span>
                <Avatar url={m.avatar_url} name={m.full_name || 'Member'} size={36} color={user.church.primaryColor} />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{m.full_name || 'Member'}</p>
                  <p className="text-xs text-gray-500">{m.streak || 0} day streak 🔥</p>
                </div>
                <p className="font-bold text-sm" style={{ color: user.church.primaryColor }}>
                  {(m.points || 0).toLocaleString()} pts
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── More Screen ────────────────────────────────────────────────────────────
function MoreScreen({ user, initialSub, onSubChange }: { user: User; initialSub?: string; onSubChange?: (s: string) => void }) {
  const [sub, setSub] = useState(initialSub || 'menu');
  const isAdmin = user.role === 'super_admin' || user.role === 'admin';
const back = () => { setSub('menu'); onSubChange?.('menu'); };

  const items = [
    { icon: '💳', label: 'Give', tab: 'giving' },
    { icon: '📅', label: 'Events', tab: 'events' },
    { icon: '🏢', label: 'Business Directory', tab: 'biz' },
    { icon: '👤', label: 'Member Directory', tab: 'members' },
    { icon: '📣', label: 'Announcements', tab: 'ann' },
    { icon: '📍', label: 'Check In', tab: 'checkin' },
    { icon: '👶', label: "Children's Check-In", tab: 'children' },
    { icon: '⚙️', label: 'My Profile', tab: 'profile' },
    ...(isAdmin ? [
      { icon: '🔧', label: 'Admin Panel', tab: 'admin' },
      { icon: '💰', label: 'Pricing', tab: 'pricing' },
    ] : []),
  ];

  return (
    <div className="p-4 space-y-4" style={{ backgroundColor: BRAND.bg, minHeight: '100vh' }}>
      {sub === 'menu' && (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4" style={{ background: `linear-gradient(135deg, ${user.church.primaryColor}, ${BRAND.plum})` }}>
            <div className="flex items-center gap-3">
              <Avatar url={user.avatarUrl} name={user.name || user.email} size={48} />
              <div>
                <p className="font-bold text-white">{user.name || user.email}</p>
                <p className="text-xs text-white/70">{user.church.name}</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map((item, i) => (
              <button key={i} onClick={() => setSub(item.tab)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left">
                <span className="text-xl w-8">{item.icon}</span>
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className="ml-auto text-gray-400">›</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {sub === 'giving' && <GivingScreen user={user} onBack={back} />}
      {sub === 'events' && <EventsScreen user={user} onBack={back} />}
      {sub === 'biz' && <BusinessDirectoryScreen user={user} onBack={back} />}
      {sub === 'members' && <MemberDirectoryScreen user={user} onBack={back} />}
      {sub === 'ann' && <AnnouncementsScreen user={user} onBack={back} />}
      {sub === 'checkin' && <CheckInScreen user={user} onBack={back} />}
      {sub === 'children' && <ChildrenCheckInScreen user={user} onBack={back} />}
      {sub === 'profile' && <ProfileScreen user={user} onBack={back} />}
      {sub === 'admin' && <AdminScreen user={user} onBack={back} />}
      {sub === 'pricing' && <PricingScreen user={user} onBack={back} />}
    </div>
  );
}

// ── Giving Screen ──────────────────────────────────────────────────────────
function GivingScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [tab, setTab] = useState('give');
  const [funds, setFunds] = useState<GivingFund[]>([]);
  const [sel, setSel] = useState('');
  const [amount, setAmount] = useState('');
  const [txns, setTxns] = useState<any[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const isAdmin = user.role === 'super_admin' || user.role === 'admin';

  async function loadFunds() {
    const { data } = await supabase.from('giving_funds').select('*')
      .eq('church_id', user.church.id).eq('is_active', true)
      .order('is_default', { ascending: false });
    if (data) {
      setFunds(data);
      const def = data.find((f: GivingFund) => f.is_default);
      if (def) setSel(def.id);
    }
  }

  async function loadTxns() {
    const { data } = await supabase.from('giving_transactions')
      .select('*, giving_funds(name)').eq('member_id', user.id)
      .order('created_at', { ascending: false }).limit(10);
    if (data) setTxns(data);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadFunds(); loadTxns(); }, [user.church.id]);
  // eslint-disable-next-line react-hooks/exhaustive-deps

  async function addFund() {
    if (!newName.trim()) return;
    await supabase.from('giving_funds').insert({
      church_id: user.church.id, name: newName,
      description: newDesc, is_active: true, is_default: false,
    });
    setNewName(''); setNewDesc(''); setAddOpen(false); loadFunds();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 text-xl">‹</button>
        <h2 className="font-bold text-gray-800 text-lg">Give</h2>
      </div>
      <div className="flex gap-2">
        {['give', 'history', ...(isAdmin ? ['manage funds'] : [])].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 rounded-xl text-xs font-semibold capitalize"
            style={{ backgroundColor: tab === t ? user.church.primaryColor : BRAND.white, color: tab === t ? BRAND.white : '#6B7280' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'give' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <p className="text-sm font-semibold text-gray-700">Select Fund</p>
          <div className="space-y-2">
            {funds.map(f => (
              <button key={f.id} onClick={() => setSel(f.id)}
                className="w-full p-3 rounded-xl border-2 text-left"
                style={{ borderColor: sel === f.id ? user.church.primaryColor : '#E5E7EB', backgroundColor: sel === f.id ? '#F5F0FF' : BRAND.white }}>
                <p className="font-semibold text-gray-800 text-sm">{f.name}</p>
                {f.description && <p className="text-xs text-gray-500">{f.description}</p>}
              </button>
            ))}
          </div>
          <p className="text-sm font-semibold text-gray-700">Amount</p>
          <div className="flex gap-2 flex-wrap">
            {[25, 50, 100, 250, 500].map(a => (
              <button key={a} onClick={() => setAmount(String(a))}
                className="px-3 py-2 rounded-xl text-sm font-semibold border-2"
                style={{
                  borderColor: amount === String(a) ? user.church.primaryColor : '#E5E7EB',
                  backgroundColor: amount === String(a) ? '#F5F0FF' : BRAND.white,
                  color: amount === String(a) ? user.church.primaryColor : '#374151',
                }}>
                ${a}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
            <input type="number" placeholder="Custom amount" value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <button onClick={() => {
            if (!amount || !sel) { alert('Select a fund and enter an amount'); return; }
            window.open('https://buy.stripe.com/28E8wPevd5si2P09aub3q00', '_blank');
          }} className="w-full py-4 rounded-xl text-white font-bold text-lg"
            style={{ backgroundColor: user.church.primaryColor }}>
            Give {amount ? `$${amount}` : 'Now'}
          </button>
          <p className="text-center text-xs text-gray-400">Secure payment via Stripe. 0.5% platform fee applies.</p>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-3">Giving History</h3>
          {txns.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">No giving history yet.</p>
          ) : (
            <div className="space-y-3">
              {txns.map((t, i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-gray-50">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{t.giving_funds?.name}</p>
                    <p className="text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold" style={{ color: user.church.primaryColor }}>${t.amount}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'manage funds' && isAdmin && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800">Giving Funds</h3>
            <button onClick={() => setAddOpen(!addOpen)}
              className="text-xs px-3 py-1 rounded-xl text-white font-semibold"
              style={{ backgroundColor: user.church.primaryColor }}>+ Add Fund</button>
          </div>
          {addOpen && (
            <div className="p-3 rounded-xl border border-gray-200 space-y-2">
              <input type="text" placeholder="Fund name" value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
              <input type="text" placeholder="Description (optional)" value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
              <div className="flex gap-2">
                <button onClick={() => setAddOpen(false)}
                  className="flex-1 py-2 rounded-xl border text-sm font-semibold text-gray-500">Cancel</button>
                <button onClick={addFund}
                  className="flex-1 py-2 rounded-xl text-white text-sm font-semibold"
                  style={{ backgroundColor: user.church.primaryColor }}>Save</button>
              </div>
            </div>
          )}
          {funds.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{f.name}</p>
                {f.is_default && <span className="text-xs text-green-600">Default</span>}
              </div>
              <button onClick={async () => {
                await supabase.from('giving_funds').update({ is_active: !f.is_active }).eq('id', f.id);
                loadFunds();
              }} className="text-xs px-3 py-1 rounded-xl"
                style={{ backgroundColor: f.is_active ? '#F0FFF4' : '#FFF5F5', color: f.is_active ? '#166534' : '#991B1B' }}>
                {f.is_active ? 'Active' : 'Inactive'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Events Screen ──────────────────────────────────────────────────────────
function EventsScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [events, setEvents] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', location: '', event_date: '' });
  const isAdmin = user.role === 'super_admin' || user.role === 'admin';

  async function load() {
    const { data } = await supabase.from('events').select('*')
      .eq('church_id', user.church.id).order('event_date', { ascending: true });
    if (data) setEvents(data);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user.church.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-gray-400 text-xl">‹</button>
          <h2 className="font-bold text-gray-800 text-lg">Events</h2>
        </div>
        {isAdmin && (
          <button onClick={() => setAddOpen(!addOpen)}
            className="text-xs px-3 py-1 rounded-xl text-white font-semibold"
            style={{ backgroundColor: user.church.primaryColor }}>+ Add</button>
        )}
      </div>
      {addOpen && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <input type="text" placeholder="Event title" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          <input type="text" placeholder="Location" value={form.location}
            onChange={e => setForm({ ...form, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          <input type="datetime-local" value={form.event_date}
            onChange={e => setForm({ ...form, event_date: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          <textarea placeholder="Description (optional)" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none h-20 resize-none" />
          <div className="flex gap-2">
            <button onClick={() => setAddOpen(false)}
              className="flex-1 py-2 rounded-xl border text-sm font-semibold text-gray-500">Cancel</button>
            <button onClick={async () => {
              if (!form.title || !form.event_date) return;
              await supabase.from('events').insert({ ...form, church_id: user.church.id, created_by: user.id });
              setAddOpen(false); setForm({ title: '', description: '', location: '', event_date: '' }); load();
            }} className="flex-1 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: user.church.primaryColor }}>Save</button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {events.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-gray-400 text-sm">No events yet.</p>
          </div>
        ) : events.map((ev, i) => {
          const d = new Date(ev.event_date);
          return (
            <div key={i} className="bg-white rounded-2xl p-4 shadow-sm flex gap-3">
              <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0"
                style={{ backgroundColor: user.church.primaryColor }}>
                <span className="text-xl font-bold leading-none">{d.getDate()}</span>
                <span className="text-xs">{d.toLocaleString('default', { month: 'short' })}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{ev.title}</p>
                <p className="text-xs text-gray-500">{ev.location} · {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                {ev.description && <p className="text-xs text-gray-600 mt-1">{ev.description}</p>}
                <button onClick={async () => {
                  await supabase.from('event_rsvps').insert({ event_id: ev.id, member_id: user.id });
                  alert('RSVP confirmed!');
                }} className="mt-2 px-3 py-1 rounded-xl text-white text-xs font-semibold"
                  style={{ backgroundColor: user.church.primaryColor }}>RSVP</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Business Directory ─────────────────────────────────────────────────────
function BusinessDirectoryScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [listings, setListings] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ business_name: '', category: '', description: '', phone: '', website: '' });
  const cats = ['Food & Restaurant','Health & Wellness','Home Services','Professional Services','Beauty & Personal Care','Technology','Education','Other'];

  async function load() {
    const { data } = await supabase.from('business_listings').select('*')
      .eq('church_id', user.church.id).eq('approved', true).order('created_at', { ascending: false });
    if (data) setListings(data);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user.church.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-gray-400 text-xl">‹</button>
          <h2 className="font-bold text-gray-800 text-lg">Business Directory</h2>
        </div>
        <button onClick={() => setAddOpen(!addOpen)}
          className="text-xs px-3 py-1 rounded-xl text-white font-semibold"
          style={{ backgroundColor: user.church.primaryColor }}>+ List</button>
      </div>
      {addOpen && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <input type="text" placeholder="Business name" value={form.business_name}
            onChange={e => setForm({ ...form, business_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
            <option value="">Select category</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea placeholder="Description" value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none h-20 resize-none" />
          <input type="text" placeholder="Phone (optional)" value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          <input type="text" placeholder="Website (optional)" value={form.website}
            onChange={e => setForm({ ...form, website: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          <div className="flex gap-2">
            <button onClick={() => setAddOpen(false)}
              className="flex-1 py-2 rounded-xl border text-sm font-semibold text-gray-500">Cancel</button>
            <button onClick={async () => {
              if (!form.business_name) return;
              await supabase.from('business_listings').insert({ ...form, church_id: user.church.id, member_id: user.id, approved: false });
              alert('Submitted for review!');
              setAddOpen(false); setForm({ business_name: '', category: '', description: '', phone: '', website: '' });
            }} className="flex-1 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: user.church.primaryColor }}>Submit</button>
          </div>
        </div>
      )}
      <div className="space-y-3">
        {listings.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-gray-400 text-sm">No listings yet.</p>
          </div>
        ) : listings.map((l, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="font-bold text-gray-800">{l.business_name}</p>
            <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: BRAND.sage }}>{l.category}</span>
            {l.description && <p className="text-gray-600 text-sm mt-2">{l.description}</p>}
            <div className="flex gap-3 mt-2">
              {l.phone && <a href={`tel:${l.phone}`} className="text-xs font-semibold" style={{ color: user.church.primaryColor }}>📞 Call</a>}
              {l.website && <a href={l.website} target="_blank" rel="noreferrer" className="text-xs font-semibold" style={{ color: user.church.primaryColor }}>🌐 Website</a>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Member Directory ───────────────────────────────────────────────────────
function MemberDirectoryScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [members, setMembers] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*')
        .eq('church_id', user.church.id).eq('directory_opt_in', true)
        .order('full_name', { ascending: true });
      if (data) setMembers(data);
    })();
  }, [user.church.id]);

  const filtered = members.filter(m => (m.full_name || '').toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 text-xl">‹</button>
        <h2 className="font-bold text-gray-800 text-lg">Member Directory</h2>
      </div>
      <input type="text" placeholder="Search members..." value={q}
        onChange={e => setQ(e.target.value)}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none bg-white" />
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm">
            <p className="text-gray-400 text-sm">No members in directory yet.</p>
          </div>
        ) : filtered.map((m, i) => (
          <div key={i} className="bg-white rounded-2xl p-3 shadow-sm flex items-center gap-3">
            <Avatar url={m.avatar_url} name={m.full_name || 'Member'} size={44} color={user.church.primaryColor} />
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm">{m.full_name}</p>
              <p className="text-xs text-gray-500 capitalize">{(m.role || '').replace('_', ' ')}</p>
              {m.bio && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{m.bio}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold" style={{ color: user.church.primaryColor }}>{m.points || 0} pts</p>
              <p className="text-xs text-gray-400">{m.streak || 0}d streak</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Announcements Screen ───────────────────────────────────────────────────
function AnnouncementsScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [anns, setAnns] = useState<any[]>([]);
  const [pending, setPending] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', body: '', category: 'General' });
  const isAdmin = user.role === 'super_admin' || user.role === 'admin';

  async function load() {
    const { data } = await supabase.from('announcements')
      .select('*, profiles(full_name)')
      .eq('church_id', user.church.id).eq('approved', true)
      .order('pinned', { ascending: false }).order('created_at', { ascending: false });
    if (data) setAnns(data);
    if (isAdmin) {
      const { data: p } = await supabase.from('announcements')
        .select('*, profiles(full_name)')
        .eq('church_id', user.church.id).eq('approved', false)
        .order('created_at', { ascending: false });
      if (p) setPending(p);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [user.church.id]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="text-gray-400 text-xl">‹</button>
          <h2 className="font-bold text-gray-800 text-lg">Announcements</h2>
        </div>
        <button onClick={() => setAddOpen(!addOpen)}
          className="text-xs px-3 py-1 rounded-xl text-white font-semibold"
          style={{ backgroundColor: user.church.primaryColor }}>+ Post</button>
      </div>
      {addOpen && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
          <input type="text" placeholder="Title" value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
            {['General','Event','Volunteer','Prayer','Lost and Found'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea placeholder="Details (optional)" value={form.body}
            onChange={e => setForm({ ...form, body: e.target.value })}
            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none h-20 resize-none" />
          <div className="flex gap-2">
            <button onClick={() => setAddOpen(false)}
              className="flex-1 py-2 rounded-xl border text-sm font-semibold text-gray-500">Cancel</button>
            <button onClick={async () => {
              if (!form.title) return;
              await supabase.from('announcements').insert({
                ...form, church_id: user.church.id, author_id: user.id,
                approved: isAdmin, pinned: false,
              });
              alert(isAdmin ? 'Posted!' : 'Submitted for review!');
              setAddOpen(false); setForm({ title: '', body: '', category: 'General' }); load();
            }} className="flex-1 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: user.church.primaryColor }}>Submit</button>
          </div>
        </div>
      )}
      {isAdmin && pending.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h3 className="font-bold text-amber-600 mb-3">Pending Review ({pending.length})</h3>
          {pending.map((a, i) => (
            <div key={i} className="p-3 rounded-xl bg-amber-50 border border-amber-200 mb-2">
              <p className="font-semibold text-gray-800 text-sm">{a.title}</p>
              <p className="text-xs text-gray-500 mb-2">by {a.profiles?.full_name}</p>
              <div className="flex gap-2">
                <button onClick={async () => { await supabase.from('announcements').update({ approved: true }).eq('id', a.id); load(); }}
                  className="px-3 py-1 rounded-xl text-white text-xs font-semibold"
                  style={{ backgroundColor: user.church.primaryColor }}>Approve</button>
                <button onClick={async () => { await supabase.from('announcements').delete().eq('id', a.id); load(); }}
                  className="px-3 py-1 rounded-xl bg-red-100 text-red-700 text-xs font-semibold">Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-3">
        {anns.map((a, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border-l-4"
            style={{ borderColor: a.pinned ? user.church.primaryColor : 'transparent' }}>
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: BRAND.sage }}>{a.category}</span>
              {isAdmin && (
                <button onClick={async () => { await supabase.from('announcements').update({ pinned: !a.pinned }).eq('id', a.id); load(); }}
                  className="text-xs text-gray-400">{a.pinned ? 'Unpin' : 'Pin'}</button>
              )}
            </div>
            <p className="font-bold text-gray-800 mt-1">{a.pinned ? '📌 ' : ''}{a.title}</p>
            {a.body && <p className="text-gray-600 text-sm mt-1">{a.body}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Check In Screen ────────────────────────────────────────────────────────
function CheckInScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [done, setDone] = useState(false);
  const [type, setType] = useState<'in-person' | 'livestream'>('in-person');

  async function checkIn() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data: existing } = await supabase
      .from('attendance')
      .select('id')
      .eq('church_id', user.church.id)
      .eq('member_id', user.id)
      .gte('checked_in_at', today.toISOString())
      .maybeSingle();

    if (existing) {
      alert('You have already checked in today!');
      setDone(true);
      return;
    }

    await supabase.from('attendance').insert({
      church_id: user.church.id, member_id: user.id, check_in_type: type,
    });
    await supabase.from('profiles').update({ points: user.points + 25, streak: user.streak + 1 }).eq('id', user.id);
    setDone(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 text-xl">‹</button>
        <h2 className="font-bold text-gray-800 text-lg">Check In</h2>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
        <div className="flex justify-center mb-4">
          <FloremusLogo size={80} variant="noTagline" />
        </div>
        <h3 className="font-bold text-gray-800 text-xl mb-2">{user.church.name}</h3>
        <p className="text-gray-500 text-sm mb-6">Check in to earn points and keep your streak going</p>
        {done ? (
          <div>
            <p className="text-4xl mb-2">✅</p>
            <p className="font-bold text-green-600 text-xl">Checked In!</p>
            <p className="text-gray-500 text-sm mt-1">+25 points earned</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              {(['in-person', 'livestream'] as const).map(t => (
                <button key={t} onClick={() => setType(t)}
                  className="flex-1 py-3 rounded-xl font-semibold text-sm"
                  style={{ backgroundColor: type === t ? user.church.primaryColor : '#F3F4F6', color: type === t ? BRAND.white : '#6B7280' }}>
                  {t === 'in-person' ? '🏛️ In Person' : '📺 Livestream'}
                </button>
              ))}
            </div>
            <button onClick={checkIn}
              className="w-full py-4 rounded-xl text-white font-bold text-lg"
              style={{ backgroundColor: user.church.primaryColor }}>
              Check In Now (+25 pts)
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Children's Check-In ────────────────────────────────────────────────────
function ChildrenCheckInScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [tab, setTab] = useState('checkin');
  const [form, setForm] = useState({ child_name: '', room: '', allergy_info: '', medical_info: '', authorized_pickups: '', custody_flag: false });
  const [result, setResult] = useState<any>(null);
  const [code, setCode] = useState('');
  const [lookup, setLookup] = useState('');
  const [found, setFound] = useState<any>(null);
  const [log, setLog] = useState<any[]>([]);
  const isWorker = user.role === 'super_admin' || user.role === 'admin' || user.role === 'children_worker';
  const rooms = ['Nursery (0-2)','Toddlers (2-3)','Pre-K (4-5)','K-2nd Grade','3rd-5th Grade'];

  async function checkInChild() {
    if (!form.child_name.trim()) { alert("Enter the child's name"); return; }
    const pk = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data } = await supabase.from('children_checkin').insert({
      church_id: user.church.id, child_name: form.child_name, parent_id: user.id,
      pickup_code: pk, room: form.room || 'General',
      allergy_info: form.allergy_info, medical_info: form.medical_info,
      custody_flag: form.custody_flag,
      authorized_pickups: form.authorized_pickups.split(',').map((s: string) => s.trim()).filter(Boolean),
    }).select().single();
    if (data) { setResult(data); setCode(pk); }
  }

  async function verifyCode() {
    if (!lookup.trim()) return;
    const { data } = await supabase.from('children_checkin').select('*')
      .eq('pickup_code', lookup.toUpperCase()).is('checked_out_at', null).maybeSingle();
    setFound(data || null);
    if (!data) alert('No active check-in found for this code');
  }

  async function checkout(id: string, name: string) {
    await supabase.from('children_checkin').update({
      checked_out_at: new Date().toISOString(), checked_out_by: user.name || user.email,
    }).eq('id', id);
    alert(`${name} has been checked out.`);
    setFound(null); setLookup('');
  }

  async function loadLog() {
    const { data } = await supabase.from('children_checkin').select('*')
      .eq('church_id', user.church.id).order('checked_in_at', { ascending: false }).limit(20);
    if (data) setLog(data);
  }

  const tabList = ['checkin', 'pickup', ...(isWorker ? ['audit log'] : [])];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 text-xl">‹</button>
        <h2 className="font-bold text-gray-800 text-lg">Children's Check-In</h2>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {tabList.map(t => (
          <button key={t} onClick={() => { setTab(t); if (t === 'audit log') loadLog(); }}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-sm font-semibold capitalize"
            style={{ backgroundColor: tab === t ? user.church.primaryColor : BRAND.white, color: tab === t ? BRAND.white : '#6B7280' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'checkin' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          {result ? (
            <div className="text-center py-4">
              <p className="text-5xl mb-3">✅</p>
              <h3 className="font-bold text-gray-800 text-xl">{result.child_name}</h3>
              <p className="text-gray-500 text-sm">Room: {result.room}</p>
              <div className="mt-4 p-4 rounded-2xl" style={{ backgroundColor: '#F5F0FF' }}>
                <p className="text-xs text-gray-500 mb-1">PICKUP CODE</p>
                <p className="text-4xl font-bold tracking-widest" style={{ color: user.church.primaryColor }}>{code}</p>
                <p className="text-xs text-gray-400 mt-1">Valid for today's service only</p>
              </div>
              <button onClick={() => {
                setResult(null); setCode('');
                setForm({ child_name: '', room: '', allergy_info: '', medical_info: '', authorized_pickups: '', custody_flag: false });
              }} className="mt-4 w-full py-3 rounded-xl text-white font-bold"
                style={{ backgroundColor: user.church.primaryColor }}>Check In Another</button>
            </div>
          ) : (
            <>
              {[
                { label: "Child's Name", key: 'child_name', ph: 'First and last name' },
                { label: 'Allergy Information', key: 'allergy_info', ph: 'List allergies or none' },
                { label: 'Medical Information', key: 'medical_info', ph: 'Any conditions or special needs' },
                { label: 'Authorized Pickups', key: 'authorized_pickups', ph: 'Names separated by commas' },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{f.label}</label>
                  <input type="text" placeholder={f.ph} value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Room</label>
                <select value={form.room} onChange={e => setForm({ ...form, room: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                  <option value="">Select room</option>
                  {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-200 cursor-pointer">
                <input type="checkbox" checked={form.custody_flag}
                  onChange={e => setForm({ ...form, custody_flag: e.target.checked })} className="rounded" />
                <div>
                  <p className="font-semibold text-red-700 text-sm">Custody Alert</p>
                  <p className="text-xs text-red-500">Flag for custody restrictions</p>
                </div>
              </label>
              <button onClick={checkInChild}
                className="w-full py-4 rounded-xl text-white font-bold text-lg"
                style={{ backgroundColor: user.church.primaryColor }}>
                Check In and Generate Code
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'pickup' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <p className="text-gray-500 text-sm">Enter the pickup code to verify and release a child.</p>
          <div className="flex gap-2">
            <input type="text" placeholder="PICKUP CODE" value={lookup}
              onChange={e => setLookup(e.target.value.toUpperCase())}
              className="flex-1 px-3 py-3 border border-gray-200 rounded-xl text-center font-bold tracking-widest text-lg uppercase focus:outline-none" />
            <button onClick={verifyCode}
              className="px-4 py-3 rounded-xl text-white font-bold"
              style={{ backgroundColor: user.church.primaryColor }}>Verify</button>
          </div>
          {found && (
            <div className="p-4 rounded-2xl border-2"
              style={{ borderColor: found.custody_flag ? '#EF4444' : '#4ade80' }}>
              {found.custody_flag && (
                <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200">
                  <p className="font-bold text-red-700">⚠️ CUSTODY ALERT</p>
                  <p className="text-sm text-red-600">Contact pastor or admin before releasing this child.</p>
                </div>
              )}
              {found.allergy_info && found.allergy_info !== 'none' && (
                <div className="mb-3 p-3 rounded-xl bg-orange-50 border border-orange-200">
                  <p className="font-bold text-orange-700">🚨 ALLERGY: {found.allergy_info}</p>
                </div>
              )}
              <p className="font-bold text-gray-800 text-xl">{found.child_name}</p>
              <p className="text-gray-500 text-sm">Room: {found.room}</p>
              <p className="text-gray-500 text-sm">In: {new Date(found.checked_in_at).toLocaleTimeString()}</p>
              {found.authorized_pickups?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-gray-500">AUTHORIZED PICKUPS:</p>
                  <p className="text-sm text-gray-700">{found.authorized_pickups.join(', ')}</p>
                </div>
              )}
              <button onClick={() => checkout(found.id, found.child_name)}
                className="w-full mt-4 py-3 rounded-xl text-white font-bold"
                style={{ backgroundColor: found.custody_flag ? '#EF4444' : user.church.primaryColor }}>
                {found.custody_flag ? 'Contact Admin Before Releasing' : 'Confirm Pickup'}
              </button>
            </div>
          )}
        </div>
      )}

      {tab === 'audit log' && isWorker && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <h3 className="font-bold text-gray-800 mb-2">Audit Log</h3>
          {log.map((e, i) => (
            <div key={i} className="p-3 rounded-xl border border-gray-100 text-sm">
              <div className="flex justify-between">
                <p className="font-semibold text-gray-800">{e.child_name}</p>
                {e.custody_flag && <span className="text-red-500 text-xs font-bold">CUSTODY</span>}
              </div>
              <p className="text-xs text-gray-500">Room: {e.room}</p>
              <p className="text-xs text-gray-500">In: {new Date(e.checked_in_at).toLocaleString()}</p>
              {e.checked_out_at && (
                <p className="text-xs text-green-600">Out: {new Date(e.checked_out_at).toLocaleString()} by {e.checked_out_by}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Profile Screen ─────────────────────────────────────────────────────────
function ProfileScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [optIn, setOptIn] = useState(user.directoryOptIn || false);
  const [avatar, setAvatar] = useState(user.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    const ext = f.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, f, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setAvatar(data.publicUrl);
      await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user.id);
    }
    setUploading(false);
  }

  async function save() {
    await supabase.from('profiles').update({
      full_name: name, bio, phone, directory_opt_in: optIn,
    }).eq('id', user.id);
    alert('Profile saved!');
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 text-xl">‹</button>
        <h2 className="font-bold text-gray-800 text-lg">My Profile</h2>
      </div>
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <Avatar url={avatar} name={name || user.email} size={80} color={user.church.primaryColor} />
            <button onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs"
              style={{ backgroundColor: user.church.primaryColor }}>
              {uploading ? '…' : '📷'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
          <p className="text-xs text-gray-400 mt-2">Tap camera to upload photo (optional)</p>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)}
              placeholder="Tell your church community about yourself..."
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none h-20 resize-none" />
          </div>
          <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer">
            <input type="checkbox" checked={optIn} onChange={e => setOptIn(e.target.checked)} className="rounded" />
            <div>
              <p className="font-semibold text-gray-700 text-sm">Appear in Member Directory</p>
              <p className="text-xs text-gray-400">Let other members find you</p>
            </div>
          </label>
          <button onClick={save}
            className="w-full py-3 rounded-xl text-white font-bold"
            style={{ backgroundColor: user.church.primaryColor }}>
            Save Profile
          </button>
        </div>
        <div className="mt-4 space-y-2">
          {[
            { l: 'Points', v: user.points.toLocaleString() },
            { l: 'Streak', v: `${user.streak} days 🔥` },
            { l: 'Role', v: user.role.replace(/_/g, ' ') },
          ].map((s, i) => (
            <div key={i} className="flex justify-between p-3 rounded-xl bg-gray-50">
              <span className="text-sm text-gray-600">{s.l}</span>
              <span className="font-bold text-gray-800 capitalize">{s.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
function InviteGenerator({ user }: { user: User }) {
  const [inviteLink, setInviteLink] = useState('');
  const [generating, setGenerating] = useState(false);

  async function generateInvite() {
    setGenerating(true);
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    await supabase.from('invites').insert({
      church_id: user.church.id,
      code,
      created_by: user.id,
      active: true,
    });
    const link = `${window.location.origin}/join/${code}`;
    setInviteLink(link);
    setGenerating(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied!');
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <h3 className="font-bold text-gray-800 mb-1">Invite Members</h3>
      <p className="text-gray-500 text-xs mb-3">Generate a link to share with your congregation. Anyone with the link can join your church.</p>
      {inviteLink ? (
        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
            <p className="text-xs text-gray-500 break-all">{inviteLink}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={copyLink}
              className="flex-1 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: user.church.primaryColor }}>
              Copy Link
            </button>
            <button onClick={() => setInviteLink('')}
              className="flex-1 py-2 rounded-xl border text-sm font-semibold text-gray-500">
              Generate New
            </button>
          </div>
        </div>
      ) : (
        <button onClick={generateInvite} disabled={generating}
          className="w-full py-3 rounded-xl text-white font-semibold"
          style={{ backgroundColor: user.church.primaryColor, opacity: generating ? 0.7 : 1 }}>
          {generating ? 'Generating...' : 'Generate Invite Link'}
        </button>
      )}
    </div>
  );
}
function NotificationSender({ user }: { user: User }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

async function sendNotification() {
    if (!title || !message) { alert('Please enter a title and message'); return; }
    setSending(true);
    try {
      const response = await fetch('https://cjnzizyxjoqmmnksfitd.supabase.co/functions/v1/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_id: 'ff657d60-a65d-4ec7-aa26-ccdd92ec81bb',
          title,
          message,
        }),
      });
      const data = await response.json();
      if (data.id) {
        setSent(true);
        setTitle('');
        setMessage('');
        setTimeout(() => setSent(false), 3000);
      } else {
        alert('Failed to send. Please try again.');
      }
    } catch {
      alert('Failed to send notification.');
    }
    setSending(false);
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
      <h3 className="font-bold text-gray-800">Send Push Notification</h3>
      <p className="text-gray-500 text-xs">Send a push notification to all subscribed members instantly.</p>
      {sent ? (
        <div className="text-center py-6">
          <p className="text-3xl mb-2">✅</p>
          <p className="font-bold text-green-600">Notification sent!</p>
        </div>
      ) : (
        <>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</label>
            <input type="text" placeholder="e.g. Service starts in 30 minutes" value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Message</label>
            <textarea placeholder="Type your message here..." value={message}
              onChange={e => setMessage(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none h-24 resize-none" />
          </div>
          <button onClick={sendNotification} disabled={sending}
            className="w-full py-3 rounded-xl text-white font-bold"
            style={{ backgroundColor: user.church.primaryColor, opacity: sending ? 0.7 : 1 }}>
            {sending ? 'Sending...' : 'Send to All Members'}
          </button>
        </>
      )}
    </div>
  );
}
function GroupManager({ user }: { user: User }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const [leaderId2, setLeaderId2] = useState('');

  async function load() {
    const { data: g } = await supabase.from('groups')
      .select('*, profiles!groups_leader_id_fkey(full_name), leader2:profiles!groups_leader_id_2_fkey(full_name)')
      .eq('church_id', user.church.id).order('created_at', { ascending: false });
    if (g) setGroups(g);
    const { data: m } = await supabase.from('profiles').select('id, full_name')
      .eq('church_id', user.church.id).order('full_name', { ascending: true });
    if (m) setMembers(m);
  }

  useEffect(() => { load(); }, [user.church.id]);

  async function createGroup() {
    if (!name.trim()) return;
    await supabase.from('groups').insert({
      church_id: user.church.id,
      name,
      description,
      leader_id: leaderId || null,
      leader_id_2: leaderId2 || null,
      member_count: 0,
    });
    setName(''); setDescription(''); setLeaderId(''); setLeaderId2(''); setAddOpen(false); load();
  }

  async function deleteGroup(id: string) {
    if (!window.confirm('Delete this group?')) return;
    await supabase.from('groups').delete().eq('id', id);
    load();
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Small Groups</h3>
        <button onClick={() => setAddOpen(!addOpen)}
          className="text-xs px-3 py-1 rounded-xl text-white font-semibold"
          style={{ backgroundColor: user.church.primaryColor }}>+ Add Group</button>
      </div>
      {addOpen && (
        <div className="p-3 rounded-xl border border-gray-200 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Group Name</label>
            <input type="text" placeholder="e.g. Men's Bible Study" value={name}
              onChange={e => setName(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description (optional)</label>
            <textarea placeholder="What is this group about?" value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none h-16 resize-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Leader 1</label>
            <select value={leaderId} onChange={e => setLeaderId(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
              <option value="">Select a leader</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Leader 2 (optional)</label>
            <select value={leaderId2} onChange={e => setLeaderId2(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
              <option value="">Select a second leader</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setAddOpen(false)}
              className="flex-1 py-2 rounded-xl border text-sm font-semibold text-gray-500">Cancel</button>
            <button onClick={createGroup}
              className="flex-1 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: user.church.primaryColor }}>Create Group</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {groups.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No groups yet. Create your first one.</p>
        ) : groups.map((g, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
            <div>
              <p className="font-semibold text-gray-800 text-sm">{g.name}</p>
<p className="text-xs text-gray-500">Leader 1: {g.profiles?.full_name || 'None'} · Leader 2: {g.leader2?.full_name || 'None'}</p>              {g.description && <p className="text-xs text-gray-400 mt-0.5">{g.description}</p>}
            </div>
            <button onClick={() => deleteGroup(g.id)}
              className="text-xs text-red-400 font-semibold">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChallengeManager({ user }: { user: User }) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'Streak', points: '100', total_days: '7' });

  async function load() {
    const { data } = await supabase.from('challenges').select('*')
      .eq('church_id', user.church.id).order('created_at', { ascending: false });
    if (data) setChallenges(data);
  }

  useEffect(() => { load(); }, [user.church.id]);

  async function createChallenge() {
    if (!form.title.trim()) return;
    await supabase.from('challenges').insert({
      church_id: user.church.id,
      title: form.title,
      description: form.description,
      type: form.type,
      points: parseInt(form.points),
      total_days: parseInt(form.total_days),
      is_active: true,
    });
    setForm({ title: '', description: '', type: 'Streak', points: '100', total_days: '7' });
    setAddOpen(false); load();
  }

  async function toggleChallenge(id: string, isActive: boolean) {
    await supabase.from('challenges').update({ is_active: !isActive }).eq('id', id);
    load();
  }

  async function deleteChallenge(id: string) {
    if (!window.confirm('Delete this challenge?')) return;
    await supabase.from('challenges').delete().eq('id', id);
    load();
  }

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-gray-800">Challenges</h3>
        <button onClick={() => setAddOpen(!addOpen)}
          className="text-xs px-3 py-1 rounded-xl text-white font-semibold"
          style={{ backgroundColor: user.church.primaryColor }}>+ Add Challenge</button>
      </div>
      {addOpen && (
        <div className="p-3 rounded-xl border border-gray-200 space-y-3">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Title</label>
            <input type="text" placeholder="e.g. 7 Day Prayer Challenge" value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Description</label>
            <textarea placeholder="Describe the challenge..." value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none h-16 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Type</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                <option value="Streak">Streak</option>
                <option value="Achievement">Achievement</option>
                <option value="Community">Community</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Points</label>
              <input type="number" value={form.points}
                onChange={e => setForm({ ...form, points: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
          </div>
          {form.type === 'Streak' && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Duration (days)</label>
              <input type="number" value={form.total_days}
                onChange={e => setForm({ ...form, total_days: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={() => setAddOpen(false)}
              className="flex-1 py-2 rounded-xl border text-sm font-semibold text-gray-500">Cancel</button>
            <button onClick={createChallenge}
              className="flex-1 py-2 rounded-xl text-white text-sm font-semibold"
              style={{ backgroundColor: user.church.primaryColor }}>Create Challenge</button>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {challenges.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">No challenges yet. Create your first one.</p>
        ) : challenges.map((c, i) => (
          <div key={i} className="p-3 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 text-sm">{c.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: user.church.primaryColor }}>{c.type}</span>
                  <span className="text-xs text-gray-500">{c.points} pts</span>
                  {c.total_days && <span className="text-xs text-gray-500">{c.total_days} days</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleChallenge(c.id, c.is_active)}
                  className="text-xs px-2 py-1 rounded-lg"
                  style={{ backgroundColor: c.is_active ? '#F0FFF4' : '#FFF5F5', color: c.is_active ? '#166534' : '#991B1B' }}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </button>
                <button onClick={() => deleteChallenge(c.id)}
                  className="text-xs text-red-400 font-semibold">Delete</button>
              </div>
            </div>
            {c.description && <p className="text-xs text-gray-400 mt-1">{c.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
function PublishedContentViewer({ user }: { user: User }) {
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('sermon_drafts').select('*')
        .eq('church_id', user.church.id).eq('status', 'published')
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data) setDraft(data);
      setLoading(false);
    })();
  }, [user.church.id]);

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  if (loading) return <div className="bg-white rounded-2xl p-6 text-center shadow-sm"><p className="text-gray-400 text-sm">Loading...</p></div>;
  if (!draft) return <div className="bg-white rounded-2xl p-6 text-center shadow-sm"><p className="text-gray-400 text-sm">No published content yet. Generate and publish from the AI Assistant.</p></div>;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-1">Published Content</h3>
        <p className="text-xs text-gray-400">Most recent published sermon content. Tap any section to copy.</p>
      </div>

      {draft.generated_announcement && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold uppercase tracking-wide" style={{ color: user.church.primaryColor }}>Announcement</p>
            <button onClick={() => copy(draft.generated_announcement, 'announcement')}
              className="text-xs px-3 py-1 rounded-xl text-white font-semibold"
              style={{ backgroundColor: copied === 'announcement' ? '#4ade80' : user.church.primaryColor }}>
              {copied === 'announcement' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{draft.generated_announcement}</p>
        </div>
      )}

      {draft.generated_prayer && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold uppercase tracking-wide" style={{ color: user.church.primaryColor }}>Prayer Prompt</p>
            <button onClick={() => copy(draft.generated_prayer, 'prayer')}
              className="text-xs px-3 py-1 rounded-xl text-white font-semibold"
              style={{ backgroundColor: copied === 'prayer' ? '#4ade80' : user.church.primaryColor }}>
              {copied === 'prayer' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">{draft.generated_prayer}</p>
        </div>
      )}

      {draft.generated_questions?.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold uppercase tracking-wide" style={{ color: user.church.primaryColor }}>Small Group Questions</p>
            <button onClick={() => copy(draft.generated_questions.join('\n'), 'questions')}
              className="text-xs px-3 py-1 rounded-xl text-white font-semibold"
              style={{ backgroundColor: copied === 'questions' ? '#4ade80' : user.church.primaryColor }}>
              {copied === 'questions' ? 'Copied!' : 'Copy All'}
            </button>
          </div>
          {draft.generated_questions.map((q: string, i: number) => (
            <div key={i} className="flex gap-2 mb-2">
              <span className="text-xs text-gray-400 mt-0.5 flex-shrink-0">{i + 1}.</span>
              <p className="text-gray-700 text-sm">{q}</p>
            </div>
          ))}
        </div>
      )}

      {draft.generated_social && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-bold uppercase tracking-wide mb-3" style={{ color: user.church.primaryColor }}>Social Media Captions</p>
          {Object.entries(draft.generated_social).map(([key, val]) => (
            <div key={key} className="mb-3 p-3 rounded-xl bg-gray-50">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold text-gray-500 capitalize">{key}</p>
                <button onClick={() => copy(val as string, key)}
                  className="text-xs px-2 py-0.5 rounded-lg text-white font-semibold"
                  style={{ backgroundColor: copied === key ? '#4ade80' : user.church.primaryColor }}>
                  {copied === key ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{val as string}</p>
            </div>
          ))}
        </div>
      )}

      {draft.generated_challenge && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-bold uppercase tracking-wide" style={{ color: user.church.primaryColor }}>Weekly Challenge</p>
            <button onClick={() => copy(`${draft.generated_challenge.title}\n${draft.generated_challenge.description}`, 'challenge')}
              className="text-xs px-3 py-1 rounded-xl text-white font-semibold"
              style={{ backgroundColor: copied === 'challenge' ? '#4ade80' : user.church.primaryColor }}>
              {copied === 'challenge' ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="font-semibold text-gray-800 mb-1">{draft.generated_challenge.title}</p>
          <p className="text-gray-600 text-sm">{draft.generated_challenge.description}</p>
          <div className="flex gap-3 mt-2">
            <span className="text-xs px-2 py-1 rounded-full text-white" style={{ backgroundColor: user.church.primaryColor }}>{draft.generated_challenge.type}</span>
            <span className="text-xs text-gray-500">{draft.generated_challenge.duration_days} days</span>
          </div>
        </div>
      )}
    </div>
  );
}
// ── Admin Screen ───────────────────────────────────────────────────────────
function AdminScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState({ members: 0, active: 0, attendance: 0 });
  const [pendingListings, setPendingListings] = useState<any[]>([]);
  const [brandName, setBrandName] = useState(user.church.name);
  const [brandTagline, setBrandTagline] = useState(user.church.tagline);
  const [brandColor, setBrandColor] = useState(user.church.primaryColor);
  const [brandInitials, setBrandInitials] = useState(user.church.logoInitials);
  const [logoUrl, setLogoUrl] = useState(user.church.logoUrl || '');
  const [autoReset, setAutoReset] = useState(false);
  const [resetFreq, setResetFreq] = useState('monthly');
  const [members, setMembers] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const isSA = user.role === 'super_admin';

  useEffect(() => {
    (async () => {
      const { count: mc } = await supabase.from('profiles')
        .select('*', { count: 'exact', head: true }).eq('church_id', user.church.id);
      const wk = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count: ac } = await supabase.from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', user.church.id).gte('checked_in_at', wk);
      const ms = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: atc } = await supabase.from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('church_id', user.church.id).gte('checked_in_at', ms);
      setStats({ members: mc || 0, active: ac || 0, attendance: atc || 0 });

      const { data: pl } = await supabase.from('business_listings')
        .select('*, profiles(full_name)')
        .eq('church_id', user.church.id).eq('approved', false);
      if (pl) setPendingListings(pl);

      const { data: ps } = await supabase.from('points_settings')
        .select('*').eq('church_id', user.church.id).maybeSingle();
      if (ps) { setAutoReset(ps.auto_reset); setResetFreq(ps.reset_frequency); }

      if (isSA) {
        const { data: mb } = await supabase.from('profiles').select('*')
          .eq('church_id', user.church.id).order('full_name', { ascending: true });
        if (mb) setMembers(mb);
      }
    })();
  }, [user.church.id, isSA]);

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop();
    const path = `${user.church.id}/logo.${ext}`;
    const { error } = await supabase.storage.from('church-logos').upload(path, f, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from('church-logos').getPublicUrl(path);
      setLogoUrl(data.publicUrl);
    }
  }

  const adminTabs = ['overview', 'content', 'branding', 'points', 'notifications', 'groups', 'challenges', ...(isSA ? ['members'] : [])];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 text-xl">‹</button>
        <h2 className="font-bold text-gray-800 text-lg">Admin Panel</h2>
      </div>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {adminTabs.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-shrink-0 px-3 py-2 rounded-xl text-xs font-semibold capitalize"
            style={{ backgroundColor: tab === t ? user.church.primaryColor : BRAND.white, color: tab === t ? BRAND.white : '#6B7280' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[
              { l: 'Total Members', v: stats.members, icon: '👥' },
              { l: 'Active This Week', v: stats.active, icon: '⚡' },
              { l: 'Attendance MTD', v: stats.attendance, icon: '📍' },
              { l: 'Giving MTD', v: '$0', icon: '💳' },
            ].map((s, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-2xl mb-1">{s.icon}</p>
                <p className="text-2xl font-bold text-gray-800">{s.v}</p>
                <p className="text-xs text-gray-500">{s.l}</p>
              </div>
            ))}
          </div>
          {pendingListings.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <h3 className="font-bold text-gray-800 mb-3">Pending Business Listings</h3>
              {pendingListings.map((pl, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{pl.business_name}</p>
                    <p className="text-xs text-gray-500">by {pl.profiles?.full_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => {
                      await supabase.from('business_listings').update({ approved: true }).eq('id', pl.id);
                      setPendingListings(pendingListings.filter(x => x.id !== pl.id));
                    }} className="px-3 py-1 rounded-xl text-white text-xs font-semibold"
                      style={{ backgroundColor: user.church.primaryColor }}>Approve</button>
                    <button onClick={async () => {
                      await supabase.from('business_listings').delete().eq('id', pl.id);
                      setPendingListings(pendingListings.filter(x => x.id !== pl.id));
                    }} className="px-3 py-1 rounded-xl bg-gray-200 text-gray-600 text-xs font-semibold">Decline</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <InviteGenerator user={user} />
        </div>)}

      {tab === 'branding' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800">Church Branding</h3>
          {[
            { l: 'Church Name', v: brandName, s: setBrandName },
            { l: 'Tagline', v: brandTagline, s: setBrandTagline },
          ].map((f, i) => (
            <div key={i}>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{f.l}</label>
              <input type="text" value={f.v} onChange={e => f.s(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
          ))}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Logo Initials</label>
            <input type="text" value={brandInitials} maxLength={3}
              onChange={e => setBrandInitials(e.target.value.toUpperCase())}
              className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Primary Color</label>
            <div className="flex gap-3 items-center mt-1">
              <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer" />
              <input type="text" value={brandColor} onChange={e => setBrandColor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Church Logo (Optional)</label>
            <div className="flex items-center gap-3 mt-1">
              {logoUrl && (
                <img src={logoUrl} alt="logo" className="w-12 h-12 rounded-xl object-contain border border-gray-200" />
              )}
              <button onClick={() => fileRef.current?.click()}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">
                Upload Logo
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Replaces initials if uploaded. PNG or SVG recommended.</p>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: brandColor + '20' }}>
            <p className="text-xs font-semibold text-gray-500 mb-2">Preview</p>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: brandColor }}>{brandInitials}</div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{brandName}</p>
                <p className="text-xs text-gray-500">{brandTagline}</p>
              </div>
            </div>
          </div>
          <button onClick={async () => {
            await supabase.from('churches').update({
              name: brandName, tagline: brandTagline,
              primary_color: brandColor, logo_initials: brandInitials,
              logo_url: logoUrl || null,
            }).eq('id', user.church.id);
            alert('Branding saved! Refresh to see changes.');
          }} className="w-full py-3 rounded-xl text-white font-bold"
            style={{ backgroundColor: user.church.primaryColor }}>
            Save Branding
          </button>
        </div>
      )}

      {tab === 'points' && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800">Points Management</h3>
          <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50">
            <p className="font-bold text-red-700 mb-1">Manual Reset</p>
            <p className="text-xs text-red-500 mb-3">Resets all member points to zero immediately. Cannot be undone.</p>
            <button onClick={async () => {
              if (!window.confirm('Reset all points to zero? This cannot be undone.')) return;
              await supabase.from('profiles').update({ points: 0 }).eq('church_id', user.church.id);
              await supabase.from('points_settings').upsert(
                { church_id: user.church.id, last_reset_at: new Date().toISOString() },
                { onConflict: 'church_id' }
              );
              alert('All points have been reset.');
            }} className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold">
              Reset All Points Now
            </button>
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={autoReset} onChange={e => setAutoReset(e.target.checked)} className="rounded" />
            <p className="font-semibold text-gray-700 text-sm">Enable Automatic Reset</p>
          </label>
          {autoReset && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reset Frequency</label>
              <select value={resetFreq} onChange={e => setResetFreq(e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none">
                {['weekly','biweekly','monthly','quarterly','semi-annually','annually'].map(f => (
                  <option key={f} value={f} className="capitalize">{f.charAt(0).toUpperCase() + f.slice(1)}</option>
                ))}
              </select>
            </div>
          )}
          <button onClick={async () => {
            await supabase.from('points_settings').upsert(
              { church_id: user.church.id, auto_reset: autoReset, reset_frequency: resetFreq },
              { onConflict: 'church_id' }
            );
            alert('Settings saved.');
          }} className="w-full py-3 rounded-xl text-white font-bold"
            style={{ backgroundColor: user.church.primaryColor }}>
            Save Points Settings
          </button>
        </div>
      )}
      {tab === 'content' && (
        <PublishedContentViewer user={user} />
      )}
{tab === 'notifications' && (
        <NotificationSender user={user} />
      )}
{tab === 'groups' && (
        <GroupManager user={user} />
      )}

      {tab === 'challenges' && (
        <ChallengeManager user={user} />
      )}

      {tab === 'members' && isSA && (
        <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
          <h3 className="font-bold text-gray-800 mb-2">Member Management</h3>
          {members.map((m, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-gray-100">
              <div className="flex items-center gap-2">
                <Avatar url={m.avatar_url} name={m.full_name || 'Member'} size={32} color={user.church.primaryColor} />
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{m.full_name || 'Unnamed'}</p>
                  <p className="text-xs text-gray-500">{m.points || 0} pts</p>
                </div>
              </div>
              <select value={m.role}
                onChange={async e => {
                  await supabase.from('profiles').update({ role: e.target.value }).eq('id', m.id);
                  setMembers(members.map(x => x.id === m.id ? { ...x, role: e.target.value } : x));
                }}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none">
                {['member','admin','super_admin','group_leader','children_worker'].map(r => (
                  <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pricing Screen ─────────────────────────────────────────────────────────
function PricingScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const plans = [
    {
      name: 'Starter', price: '$69', desc: 'Perfect for small churches',
      link: 'https://buy.stripe.com/28E8wPevd5si2P09aub3q00', popular: false,
      features: ['Up to 75 members','5 admin seats','10 small groups','Push notifications','QR attendance check-in','Prayer wall','Challenges and leaderboard'],
    },
    {
      name: 'Growth', price: '$147', desc: 'For growing churches ready to go deeper',
      link: 'https://buy.stripe.com/14AaEXdr94oedtE0DYb3q01', popular: true,
      features: ['Up to 250 members','10 admin seats','25 small groups','Everything in Starter',"Children's check-in add-on",'AI Sermon Assistant add-on'],
    },
    {
      name: 'Kingdom', price: '$247', desc: 'Everything included for thriving churches',
      link: 'https://buy.stripe.com/7sY00j1Ir1c261c9aub3q02', popular: false,
      features: ['Up to 1,000 members','Unlimited seats and groups','AI Sermon Assistant included',"Children's check-in included",'Analytics Pro','Multi-campus','Everything in Growth'],
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button onClick={onBack} className="text-gray-400 text-xl">‹</button>
        <h2 className="font-bold text-gray-800 text-lg">Choose Your Plan</h2>
      </div>
      <div className="flex justify-center">
        <FloremusLogo size={80} variant="seal" />
      </div>
      <p className="text-center text-gray-500 text-sm">30-day money back guarantee on all plans</p>

      {plans.map((p, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border-2 relative"
          style={{ borderColor: p.popular ? user.church.primaryColor : '#F3F4F6' }}>
          {p.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-white text-xs font-bold px-3 py-1 rounded-full"
                style={{ backgroundColor: user.church.primaryColor }}>MOST POPULAR</span>
            </div>
          )}
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-xl font-bold text-gray-800">{p.name}</h3>
              <p className="text-gray-500 text-xs mt-1">{p.desc}</p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-gray-800">{p.price}</span>
              <span className="text-gray-500 text-sm">/mo</span>
            </div>
          </div>
          <div className="space-y-1 mb-4">
            {p.features.map((f, j) => (
              <div key={j} className="flex items-center gap-2">
                <span className="text-green-500 text-sm font-bold">✓</span>
                <span className="text-gray-600 text-sm">{f}</span>
              </div>
            ))}
          </div>
          <button onClick={() => window.open(p.link, '_blank')}
            className="w-full py-3 rounded-xl text-white font-bold"
            style={{ backgroundColor: user.church.primaryColor }}>
            Subscribe to {p.name}
          </button>
        </div>
      ))}

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-gray-800 text-lg">Enterprise</h3>
            <p className="text-gray-500 text-xs">For churches of 1,000 or more members</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-800">$597+</span>
            <p className="text-gray-500 text-xs">/month</p>
          </div>
        </div>
        <div className="space-y-1 mb-4">
          {['Dedicated account manager','Native iOS and Android app','4-hour support SLA','Quarterly strategy calls','Custom feature review','Everything in Kingdom'].map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-green-500 text-sm font-bold">✓</span>
              <span className="text-gray-600 text-sm">{f}</span>
            </div>
          ))}
        </div>
        <a href="mailto:enterprise@floremus.church?subject=Enterprise Pricing Inquiry&body=Hi, I am interested in Floremus Enterprise pricing for our church."
          className="block w-full py-3 rounded-xl text-center font-bold text-white"
          style={{ backgroundColor: BRAND.plum }}>
          Contact Us for Enterprise Pricing
        </a>
      </div>

      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-bold text-gray-800">Concierge Launch</h3>
            <p className="text-gray-500 text-xs">Hands-on onboarding with a dedicated rep</p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-bold text-gray-800">$199</span>
            <p className="text-gray-500 text-xs">one time</p>
          </div>
        </div>
        <button onClick={() => window.open('https://buy.stripe.com/6oUcN5dr99IyfBMdqKb3q04', '_blank')}
          className="w-full py-2 rounded-xl font-bold text-sm border"
          style={{ color: user.church.primaryColor, borderColor: user.church.primaryColor }}>
          Add Concierge Launch
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 pb-4">All plans include a 30-day money back guarantee. Cancel anytime.</p>
    </div>
  );
}
function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function updatePassword() {
    if (password !== confirm) { alert('Passwords do not match'); return; }
    if (password.length < 8) { alert('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) alert(error.message);
    else setDone(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ backgroundColor: BRAND.plum }}>
      <div className="w-full max-w-md space-y-4">
        <div className="flex justify-center mb-6">
          <FloremusLogo size={120} variant="withTagline" />
        </div>
        {done ? (
          <div className="text-center p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <p className="text-white font-semibold mb-2">Password updated!</p>
            <p className="text-gray-400 text-sm mb-4">You can now sign in with your new password.</p>
            <button onClick={() => window.location.href = '/'}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ backgroundColor: BRAND.purple }}>
              Go to Sign In
            </button>
          </div>
        ) : (
          <>
            <p className="text-center text-gray-400 text-sm">Enter your new password below.</p>
            <input type="password" placeholder="New password" value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white border focus:outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }} />
            <input type="password" placeholder="Confirm new password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white border focus:outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }} />
            <button onClick={updatePassword} disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ backgroundColor: BRAND.purple, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<User | null>(null);
const [tab, setTab] = useState('home');
  const [moreSub, setMoreSub] = useState('menu');
  const [loading, setLoading] = useState(true);

  async function loadProfile(session: any) {
    const { data: profile } = await supabase.from('profiles')
      .select('*').eq('id', session.user.id).maybeSingle();
    if (profile?.church_id) {
      const { data: church } = await supabase.from('churches')
        .select('*').eq('id', profile.church_id).maybeSingle();
      if (church) {
        setUser({
          id: session.user.id,
          name: profile.full_name || '',
          email: session.user.email || '',
          role: profile.role || 'member',
          points: profile.points || 0,
          streak: profile.streak || 0,
          avatarUrl: profile.avatar_url || '',
          directoryOptIn: profile.directory_opt_in || false,
          bio: profile.bio || '',
          phone: profile.phone || '',
          church: {
            id: church.id,
            name: church.name,
            tagline: church.tagline || '',
            primaryColor: church.primary_color || BRAND.purple,
            secondaryColor: church.secondary_color || BRAND.silver,
            logoInitials: church.logo_initials || 'FC',
            logoUrl: church.logo_url || '',
            subscriptionStatus: church.subscription_status || 'trial',
            subscriptionTier: church.subscription_tier || 'starter',
          },
        });
      }
    }
    // Update streak on app open
    if (profile) {
      const today = new Date().toDateString();
      const lastOpen = localStorage.getItem(`last_open_${session.user.id}`);
      if (lastOpen !== today) {
        localStorage.setItem(`last_open_${session.user.id}`, today);
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        const newStreak = lastOpen === yesterday ? (profile.streak || 0) + 1 : 1;
        await supabase.from('profiles').update({ streak: newStreak }).eq('id', session.user.id);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) loadProfile(session);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) loadProfile(session);
      else { setUser(null); setLoading(false); }
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const requestPermission = async () => {
        try {
          const OneSignal = (window as any).OneSignal;
          if (OneSignal) {
            await OneSignal.Notifications.requestPermission();
          }
        } catch (e) {
          console.log('OneSignal not ready');
        }
      };
      setTimeout(requestPermission, 3000);
    }
  }, [user]);
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND.plum }}>
        <FloremusLogo size={120} variant="silver" />
      </div>
    );
  }
  function PaywallScreen({ user }: { user: User }) {
  const plans = [
    { name: 'Starter', price: '$69', link: 'https://buy.stripe.com/28E8wPevd5si2P09aub3q00' },
    { name: 'Growth', price: '$147', link: 'https://buy.stripe.com/14AaEXdr94oedtE0DYb3q01' },
    { name: 'Kingdom', price: '$247', link: 'https://buy.stripe.com/7sY00j1Ir1c261c9aub3q02' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ backgroundColor: BRAND.plum }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <FloremusLogo size={120} variant="silver" />
        </div>
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-white mb-2">Choose Your Plan</h2>
          <p className="text-gray-400 text-sm">Select a plan to activate {user.church.name} on Floremus.</p>
        </div>
        <div className="space-y-3">
          {plans.map((p, i) => (
            <button key={i} onClick={() => window.open(p.link, '_blank')}
              className="w-full p-4 rounded-2xl text-left flex items-center justify-between"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}>
              <div>
                <p className="font-bold text-white">{p.name}</p>
                <p className="text-gray-400 text-xs">per month</p>
              </div>
              <span className="text-2xl font-bold text-white">{p.price}</span>
            </button>
          ))}
        </div>
        <p className="text-center text-gray-500 text-xs mt-6">30-day money back guarantee. Cancel anytime.</p>
        <button onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
          className="w-full mt-4 text-center text-sm" style={{ color: BRAND.sage }}>
          Sign out
        </button>
      </div>
    </div>
  );
}
function JoinScreen({ code }: { code: string }) {
  const [church, setChurch] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: invite } = await supabase.from('invites').select('*, churches(*)').eq('code', code).eq('active', true).maybeSingle();
      if (invite?.churches) setChurch(invite.churches);
      else alert('This invite link is invalid or has expired.');
    })();
  }, [code]);

  async function join() {
    if (!name || !email || !password) { alert('Please fill in all fields'); return; }
    if (password !== confirm) { alert('Passwords do not match'); return; }
    if (password.length < 8) { alert('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { alert(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        church_id: church.id,
        full_name: name,
        role: 'member',
        points: 0,
        streak: 0,
      });
      setDone(true);
    }
    setLoading(false);
  }

  if (!church) return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BRAND.plum }}>
      <p className="text-white">Loading...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-10" style={{ backgroundColor: BRAND.plum }}>
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <FloremusLogo size={140} variant="withTagline" />
        </div>
        {done ? (
          <div className="text-center p-6 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <p className="text-3xl mb-3">🎉</p>
            <p className="text-white font-bold text-xl mb-2">Welcome to {church.name}!</p>
            <p className="text-gray-400 text-sm mb-4">Your account is ready. Sign in to get started.</p>
            <button onClick={() => window.location.href = '/'}
              className="w-full py-3 rounded-xl font-bold text-white"
              style={{ backgroundColor: BRAND.purple }}>
              Sign In Now
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-center mb-4">
              <p className="text-white font-bold text-xl">{church.name}</p>
              <p className="text-gray-400 text-sm">You have been invited to join</p>
            </div>
            <input type="text" placeholder="Your full name" value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white border focus:outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }} />
            <input type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white border focus:outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }} />
            <input type="password" placeholder="Create a password" value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white border focus:outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }} />
            <input type="password" placeholder="Confirm password" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-3 rounded-xl text-white border focus:outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.15)' }} />
            <button onClick={join} disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-lg"
              style={{ backgroundColor: church.primary_color || BRAND.purple, opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Creating account...' : `Join ${church.name}`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

  if (window.location.pathname === '/reset-password') {
    return <ResetPasswordScreen />;
  }

if (window.location.pathname.startsWith('/join/')) {
    const code = window.location.pathname.split('/join/')[1];
    return <JoinScreen code={code} />;
  }

  if (!user) return <LoginScreen onLogin={setUser} />;

  if (user.church.subscriptionStatus !== 'active') {
    return <PaywallScreen user={user} />;
  }

  const color = user.church.primaryColor;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg }}>
      <div className="max-w-md mx-auto relative">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {user.church.logoUrl ? (
              <img src={user.church.logoUrl} alt="logo" className="w-8 h-8 rounded-full object-contain" />
            ) : (
              <img src={LOGOS.silver} alt="Floremus" className="w-8 h-8 object-contain" />
            )}
            <div>
              <p className="font-bold text-gray-800 text-sm leading-tight">{user.church.name}</p>
              <p className="text-xs text-gray-400 italic">Floremus</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">{user.points} pts</span>
            <button onClick={() => setTab('more')}>
              <Avatar url={user.avatarUrl} name={user.name || user.email} size={32} color={color} />
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
              className="text-xs text-gray-400 hover:text-red-400 ml-1">
              Sign out
            </button>
          </div>
        </div>

        <div className="pb-20">
{tab === 'home' && <HomeScreen user={user} setActiveTab={setTab} setMoreSub={setMoreSub} />}
          {tab === 'sunday' && <SundayScreen user={user} />}
          {tab === 'community' && <CommunityScreen user={user} />}
          {tab === 'groups' && <GroupsScreen user={user} />}
          {tab === 'more' && <MoreScreen user={user} initialSub={moreSub} onSubChange={setMoreSub} />} 
        </div>

        <BottomNav active={tab} setActive={setTab} color={color} />
      </div>
    </div>
  );
}

export default App;
