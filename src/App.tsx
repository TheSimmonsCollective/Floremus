/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, } from 'react';
import { supabase } from './supabase';
import { QRCodeSVG } from 'qrcode.react';

// ── Google Fonts (add to public/index.html head if not already there) ──────
// <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />

// ── Brand ──────────────────────────────────────────────────────────────────
const BRAND = {
  purple: '#6B21A8',
  plum: '#0F0620',
  sage: '#8FA382',
  silver: '#C0C6CC',
  white: '#FFFFFF',
  bg: '#F9FAFB',
  cardBorder: 'rgba(107,33,168,0.08)',
  shadowSm: '0 2px 8px rgba(107,33,168,0.06)',
  shadowMd: '0 4px 20px rgba(107,33,168,0.1)',
  shadowLg: '0 8px 40px rgba(107,33,168,0.15)',
};

const LOGOS = {
  silver: 'https://cjnzizyxjoqmmnksfitd.supabase.co/storage/v1/object/public/church-logos/FloremusSilverLogo.png',
  noTagline: 'https://cjnzizyxjoqmmnksfitd.supabase.co/storage/v1/object/public/church-logos/FloremusLogoNoTagline.png',
  withTagline: 'https://cjnzizyxjoqmmnksfitd.supabase.co/storage/v1/object/public/church-logos/FloremusLogoWithTagline.png',
  seal: 'https://cjnzizyxjoqmmnksfitd.supabase.co/storage/v1/object/public/church-logos/ChatGPT%20Image%20Jun%202,%202026,%2011_55_40%20PM.png',
};

// ── Luxury style helpers ───────────────────────────────────────────────────
const luxuryBtn = (color: string) => ({
  background: `linear-gradient(135deg, ${color}, ${color}dd)`,
  boxShadow: `0 4px 16px ${color}40`,
});

const cardStyle = (color: string) => ({
  background: BRAND.white,
  borderRadius: 20,
  border: `1px solid ${color}18`,
  boxShadow: `0 2px 12px ${color}0d`,
});

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
  givingStripeLink?: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'group_leader' | 'children_worker' | 'member';
  secondaryRole?: string;
  secondaryRole2?: string;
  points: number;
  streak: number;
  church: Church;
  avatarUrl?: string;
  directoryOptIn?: boolean;
  bio?: string;
  phone?: string;
  birthday?: string;
}

interface Message {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  created_at: string;
  group_id?: string | null;
  media_url?: string;
  media_type?: string;
}

interface GivingFund {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  is_default: boolean;
}

interface TheologySettings {
  denomination: string;
  statement_of_faith: string;
  bible_translation: string;
  worship_style: string;
  theological_positions: string;
  restricted_topics: string;
  translation_1: string;
  translation_2: string;
  translation_3: string;
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

// ── Permission helpers ─────────────────────────────────────────────────────
function isAdmin(user: User): boolean {
  return user.role === 'super_admin' || user.role === 'admin';
}

function isGroupLeader(user: User): boolean {
  return isAdmin(user) || user.role === 'group_leader' ||
    user.secondaryRole === 'group_leader' || user.secondaryRole2 === 'group_leader';
}

function isChildrenWorker(user: User): boolean {
  return isAdmin(user) || user.role === 'children_worker' ||
    user.secondaryRole === 'children_worker' || user.secondaryRole2 === 'children_worker';
}

// ── Media upload helper ────────────────────────────────────────────────────
async function uploadMedia(file: File, folder: string): Promise<{ url: string; type: string } | null> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('media').upload(path, file, { upsert: false });
  if (error) return null;
  const { data } = supabase.storage.from('media').getPublicUrl(path);
  let type = 'image';
  if (['mp4', 'mov', 'webm', 'avi'].includes(ext)) type = 'video';
  else if (ext === 'pdf') type = 'pdf';
  return { url: data.publicUrl, type };
}

// ── Media picker component ─────────────────────────────────────────────────
function MediaPicker({ onUpload, folder = 'general' }: { onUpload: (url: string, type: string) => void; folder?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handle(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const result = await uploadMedia(file, folder);
    if (result) onUpload(result.url, result.type);
    setUploading(false);
  }

  return (
    <div>
      <input ref={ref} type="file" accept="image/*,video/*,.pdf" className="hidden" onChange={handle} />
      <button
        onClick={() => ref.current?.click()}
        disabled={uploading}
        className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold"
        style={{ color: BRAND.purple, borderColor: `${BRAND.purple}30`, background: `${BRAND.purple}08` }}
      >
        {uploading ? '⏳ Uploading...' : '📎 Attach media'}
      </button>
    </div>
  );
}

// ── Media display component ────────────────────────────────────────────────
function MediaDisplay({ url, type }: { url: string; type: string }) {
  if (!url) return null;
  if (type === 'image') {
    return (
      <img
        src={url} alt="attachment"
        className="w-full rounded-xl mt-2 object-cover"
        style={{ maxHeight: 240 }}
      />
    );
  }
  if (type === 'video') {
    return (
      <video
        src={url} controls
        className="w-full rounded-xl mt-2"
        style={{ maxHeight: 240 }}
      />
    );
  }
  if (type === 'pdf') {
    return (
      <a
        href={url} target="_blank" rel="noreferrer"
        className="flex items-center gap-2 mt-2 px-3 py-2 rounded-xl text-sm font-semibold"
        style={{ background: `${BRAND.purple}10`, color: BRAND.purple }}
      >
        📄 View PDF
      </a>
    );
  }
  return null;
}

// ── Helper Components ──────────────────────────────────────────────────────
function FloremusLogo({ size = 80, variant = 'silver' }: { size?: number; variant?: keyof typeof LOGOS }) {
  return (
    <img
      src={LOGOS[variant]}
      alt="Floremus"
      style={{ width: size, height: 'auto', objectFit: 'contain' }}
    />
  );
}

function Avatar({ url, name, size = 36, color }: { url?: string; name: string; size?: number; color?: string }) {
  const ringColor = color || BRAND.purple;
  const ringSize = Math.max(2, size * 0.055);
  const containerSize = size + ringSize * 2 + 4;

  if (url) {
    return (
      <div
        className="flex-shrink-0 rounded-full flex items-center justify-center"
        style={{
          width: containerSize,
          height: containerSize,
          background: `linear-gradient(135deg, ${ringColor}, ${ringColor}aa)`,
          padding: ringSize + 2,
        }}
      >
        <img
          src={url} alt={name}
          className="rounded-full object-cover w-full h-full"
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: containerSize,
        height: containerSize,
        background: `linear-gradient(135deg, ${ringColor}, ${ringColor}bb)`,
        padding: ringSize + 2,
      }}
    >
      <div
        className="rounded-full flex items-center justify-center text-white font-bold w-full h-full"
        style={{
          background: `linear-gradient(135deg, ${ringColor}dd, ${ringColor})`,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: Math.max(10, size * 0.38),
        }}
      >
        {(name || '?').charAt(0).toUpperCase()}
      </div>
    </div>
  );
}

// ── Screen header with gradient accent ────────────────────────────────────
function ScreenHeader({ title, subtitle, color, children }: {
  title: string;
  subtitle?: string;
  color: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className="px-4 pt-5 pb-4 mb-2"
      style={{
        background: `linear-gradient(160deg, ${color}14 0%, ${BRAND.bg} 100%)`,
        borderBottom: `1px solid ${color}18`,
      }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-bold text-gray-900"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, letterSpacing: '-0.3px' }}
          >
            {title}
          </h1>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: `${color}bb` }}>{subtitle}</p>}
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Luxury card ────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LuxCard({ children, color, style, className }: {
  children: React.ReactNode;
  color: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        ...cardStyle(color),
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Luxury button ──────────────────────────────────────────────────────────
function LuxBtn({
  children, onClick, color, variant = 'primary', disabled, className, style,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  color: string;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    borderRadius: 12,
    padding: '11px 20px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    transition: 'all 0.2s',
    border: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...style,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      ...luxuryBtn(color),
      color: BRAND.white,
    },
    outline: {
      background: 'transparent',
      border: `1.5px solid ${color}`,
      color: color,
    },
    ghost: {
      background: `${color}10`,
      color: color,
      border: 'none',
    },
    danger: {
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: BRAND.white,
      boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
    },
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={className}
      style={{ ...base, ...variants[variant] }}
    >
      {children}
    </button>
  );
}

// ── Section label ──────────────────────────────────────────────────────────
function SectionLabel({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div style={{ width: 3, height: 16, borderRadius: 2, background: color }} />
      <p
        className="font-semibold text-gray-500 uppercase tracking-widest"
        style={{ fontSize: 10, fontFamily: "'DM Sans', sans-serif" }}
      >
        {children}
      </p>
    </div>
  );
}

// ── Stat pill ──────────────────────────────────────────────────────────────
function StatPill({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-2xl"
      style={{ background: `${color}0d`, border: `1px solid ${color}18` }}
    >
      <span style={{ fontSize: 16 }}>{icon}</span>
      <div>
        <p className="font-bold text-gray-800 leading-none" style={{ fontSize: 15, fontFamily: "'Cormorant Garamond', serif" }}>{value}</p>
        <p className="text-gray-400 leading-none mt-0.5" style={{ fontSize: 10 }}>{label}</p>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptyState({ icon, message }: { icon: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <span style={{ fontSize: 40, opacity: 0.4 }}>{icon}</span>
      <p className="text-gray-400 text-sm text-center">{message}</p>
    </div>
  );
}

// ── Back header ────────────────────────────────────────────────────────────
function BackHeader({ title, onBack, color }: { title: string; onBack: () => void; color: string }) {
  return (
    <div className="flex items-center gap-3 px-4 pt-5 pb-3" style={{ borderBottom: `1px solid ${color}15` }}>
      <button
        onClick={onBack}
        className="flex items-center justify-center rounded-full"
        style={{ width: 36, height: 36, background: `${color}12`, color }}
      >
        ‹
      </button>
      <h2
        className="font-bold text-gray-900"
        style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24 }}
      >
        {title}
      </h2>
    </div>
  );
}

// ── Toast notification ─────────────────────────────────────────────────────
function Toast({ message, color, onClose }: { message: string; color: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg"
      style={{ ...luxuryBtn(color), color: BRAND.white, fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}
    >
      <span>✓</span>
      <span className="font-semibold">{message}</span>
    </div>
  );
}
// ── Church Registration Screen ─────────────────────────────────────────────
function ChurchRegistrationScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pastorName, setPastorName] = useState('');
  const [churchName, setChurchName] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const criteria = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One number', met: /[0-9]/.test(password) },
    { label: 'One special character (!@#$%)', met: /[!@#$%^&*]/.test(password) },
  ];
  const pwMatch = password === confirm && confirm.length > 0;
  const pwReady = criteria.every(c => c.met);

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: '1.5px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.07)',
    color: BRAND.white,
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s',
  };

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
        .insert({
          name: churchName,
          tagline: '',
          primary_color: BRAND.purple,
          logo_initials: initials,
          subscription_status: 'trial',
          subscription_tier: 'starter',
        })
        .select()
        .single();
      if (ce || !church) {
        alert('Church setup failed. Please contact support.');
        setLoading(false);
        return;
      }
      await supabase.from('profiles').insert({
        id: data.user.id,
        church_id: church.id,
        full_name: pastorName,
        role: 'super_admin',
        points: 0,
        streak: 0,
      });
      await supabase.from('giving_funds').insert({
        church_id: church.id,
        name: 'General Offering',
        description: 'General church giving',
        is_default: true,
        is_active: true,
      });
      setDone(true);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: `linear-gradient(160deg, ${BRAND.plum} 0%, #1a0535 100%)` }}
      >
        {/* Glow orb */}
        <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,33,168,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="w-full max-w-md text-center relative z-10">
          <FloremusLogo size={140} variant="withTagline" />
          <div
            className="mt-8 p-8 rounded-3xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)' }}
          >
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <h2
              className="text-white font-bold mb-3"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}
            >
              Welcome to Floremus!
            </h2>
            <p className="text-gray-400 mb-2" style={{ fontSize: 15 }}>
              Your church account has been created.
            </p>
            <p className="mb-8" style={{ fontSize: 13, color: 'rgba(192,198,204,0.6)' }}>
              Check your email to confirm your account, then sign in.
            </p>
            <button
              onClick={() => window.location.href = '/login'}
              className="w-full py-4 rounded-2xl font-bold text-white"
              style={{ ...luxuryBtn(BRAND.purple), fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}
            >
              Sign In Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: `linear-gradient(160deg, ${BRAND.plum} 0%, #1a0535 100%)` }}
    >
      {/* Background glow orbs */}
      <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,33,168,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '-10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(143,163,130,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <FloremusLogo size={160} variant="withTagline" />
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map(s => (
            <div key={s} className="flex items-center gap-3">
              <div
                className="flex items-center justify-center rounded-full font-bold"
                style={{
                  width: 32,
                  height: 32,
                  background: step >= s ? `linear-gradient(135deg, ${BRAND.purple}, #9333EA)` : 'rgba(255,255,255,0.1)',
                  color: step >= s ? BRAND.white : 'rgba(255,255,255,0.4)',
                  fontSize: 13,
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.3s',
                  boxShadow: step >= s ? `0 4px 14px ${BRAND.purple}50` : 'none',
                }}
              >
                {step > s ? '✓' : s}
              </div>
              {s < 2 && (
                <div style={{ width: 40, height: 1.5, background: step > s ? `linear-gradient(90deg, ${BRAND.purple}, #9333EA)` : 'rgba(255,255,255,0.15)', borderRadius: 2, transition: 'all 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        <div
          className="rounded-3xl p-8"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
        >
          <h2
            className="text-white font-bold mb-1 text-center"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}
          >
            {step === 1 ? 'About Your Church' : 'Create Your Login'}
          </h2>
          <p className="text-center mb-6" style={{ color: 'rgba(192,198,204,0.6)', fontSize: 14 }}>
            {step === 1 ? 'Tell us about your ministry' : 'Secure your account'}
          </p>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="Pastor John Smith"
                  value={pastorName}
                  onChange={e => setPastorName(e.target.value)}
                  style={inputBase}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Church Name
                </label>
                <input
                  type="text"
                  placeholder="Grace Community Church"
                  value={churchName}
                  onChange={e => setChurchName(e.target.value)}
                  style={inputBase}
                />
              </div>
              <button
                onClick={() => {
                  if (!pastorName || !churchName) { alert('Please fill in both fields'); return; }
                  setStep(2);
                }}
                className="w-full py-4 rounded-2xl font-bold text-white mt-2"
                style={{ ...luxuryBtn(BRAND.purple), fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}
              >
                Continue
              </button>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="pastor@church.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputBase}
                />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPw ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ ...inputBase, paddingRight: 60 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: BRAND.sage, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {password.length > 0 && (
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>
                    Password strength
                  </p>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                    {criteria.map((c, i) => (
                      <div
                        key={i}
                        style={{
                          flex: 1,
                          height: 3,
                          borderRadius: 2,
                          background: c.met ? `linear-gradient(90deg, ${BRAND.purple}, #9333EA)` : 'rgba(255,255,255,0.1)',
                          transition: 'background 0.3s',
                        }}
                      />
                    ))}
                  </div>
                  {criteria.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                      <span style={{ fontSize: 11, color: c.met ? '#4ade80' : 'rgba(255,255,255,0.3)' }}>{c.met ? '✓' : '○'}</span>
                      <span style={{ fontSize: 12, color: c.met ? '#4ade80' : 'rgba(255,255,255,0.4)', fontFamily: "'DM Sans', sans-serif" }}>{c.label}</span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                  Confirm Password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCf ? 'text' : 'password'}
                    placeholder="Repeat your password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    style={{
                      ...inputBase,
                      paddingRight: 60,
                      borderColor: confirm.length > 0
                        ? (pwMatch ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)')
                        : 'rgba(255,255,255,0.15)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCf(!showCf)}
                    style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: BRAND.sage, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                  >
                    {showCf ? 'Hide' : 'Show'}
                  </button>
                </div>
                {confirm.length > 0 && (
                  <p style={{ fontSize: 12, marginTop: 6, marginLeft: 4, color: pwMatch ? '#4ade80' : '#f87171', fontFamily: "'DM Sans', sans-serif" }}>
                    {pwMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setStep(1)}
                  style={{ flex: 1, padding: '14px 0', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.15)', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                >
                  Back
                </button>
                <button
                  onClick={signup}
                  disabled={loading}
                  style={{ flex: 2, padding: '14px 0', borderRadius: 14, ...luxuryBtn(BRAND.purple), color: BRAND.white, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", border: 'none' }}
                >
                  {loading ? 'Creating your church...' : 'Create Church Account'}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="text-center mt-6" style={{ color: 'rgba(192,198,204,0.5)', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>
          Already have an account?{' '}
          <span
            className="font-semibold cursor-pointer"
            style={{ color: BRAND.sage }}
            onClick={() => window.location.href = '/login'}
          >
            Sign in
          </span>
        </p>

        <p className="text-center mt-4" style={{ color: 'rgba(192,198,204,0.3)', fontSize: 12, fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic' }}>
          Floremus · We will flourish
        </p>
      </div>
    </div>
  );
}

// ── Login Screen ───────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isReset, setIsReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: '1.5px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.07)',
    color: BRAND.white,
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
  };

  async function login() {
    if (!email || !password) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
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
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: `linear-gradient(160deg, ${BRAND.plum} 0%, #1a0535 100%)` }}
    >
      {/* Background glow orbs */}
      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,33,168,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '5%', left: '-15%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(143,163,130,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <FloremusLogo size={180} variant="withTagline" />
          <p
            className="mt-4"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(192,198,204,0.5)', fontSize: 15, letterSpacing: '0.05em' }}
          >
            Floremus · We will flourish
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl p-8"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)' }}
        >
          {isReset ? (
            <div>
              <h2
                className="text-white font-bold mb-1 text-center"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}
              >
                Reset Password
              </h2>
              <p className="text-center mb-6" style={{ color: 'rgba(192,198,204,0.6)', fontSize: 14 }}>
                We will send a reset link to your email
              </p>
              {resetSent ? (
                <div className="text-center py-6">
                  <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
                  <p className="text-white font-semibold mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}>Check your inbox</p>
                  <p className="mb-6" style={{ color: 'rgba(192,198,204,0.6)', fontSize: 14 }}>A reset link is on its way</p>
                  <button
                    onClick={() => { setIsReset(false); setResetSent(false); }}
                    style={{ background: 'none', border: 'none', color: BRAND.sage, fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}
                  >
                    Back to sign in
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <input
                    type="email"
                    placeholder="Your email address"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={inputBase}
                  />
                  <button
                    onClick={resetPassword}
                    disabled={loading}
                    style={{ width: '100%', padding: '14px 0', borderRadius: 14, ...luxuryBtn(BRAND.purple), color: BRAND.white, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", border: 'none' }}
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                  <button
                    onClick={() => setIsReset(false)}
                    style={{ background: 'none', border: 'none', color: 'rgba(192,198,204,0.6)', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'center' }}
                  >
                    Back to sign in
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2
                className="text-white font-bold mb-1 text-center"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30 }}
              >
                Welcome Back
              </h2>
              <p className="text-center mb-7" style={{ color: 'rgba(192,198,204,0.6)', fontSize: 14 }}>
                Sign in to your church community
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={inputBase}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPw ? 'text' : 'password'}
                      placeholder="Your password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') login(); }}
                      style={{ ...inputBase, paddingRight: 60 }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: BRAND.sage, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
                    >
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={login}
                  disabled={loading}
                  style={{ width: '100%', padding: '15px 0', borderRadius: 14, ...luxuryBtn(BRAND.purple), color: BRAND.white, fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: "'DM Sans', sans-serif", border: 'none', marginTop: 4 }}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <button
                  onClick={() => setIsReset(true)}
                  style={{ background: 'none', border: 'none', color: 'rgba(192,198,204,0.6)', fontSize: 14, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", textAlign: 'center' }}
                >
                  Forgot your password?
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ color: 'rgba(192,198,204,0.4)', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>New to Floremus?</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        </div>

        <button
          onClick={() => window.location.href = '/ChurchRegistration'}
          style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: 'transparent', border: '1.5px solid rgba(143,163,130,0.4)', color: BRAND.sage, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
        >
          Create Church Account
        </button>

        <p
          className="text-center mt-8"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(192,198,204,0.25)', fontSize: 13 }}
        >
          Built for Flourishing
        </p>
      </div>
    </div>
  );
}
// ── Bottom Navigation ──────────────────────────────────────────────────────
function BottomNav({
  active,
  setActive,
  color,
  communityBadge,
  moreBadge,
}: {
  active: string;
  setActive: (t: string) => void;
  color: string;
  communityBadge?: boolean;
  moreBadge?: boolean;
}) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'sunday', label: 'Sunday', icon: '📖' },
    { id: 'community', label: 'Community', icon: '🙏', badge: communityBadge },
    { id: 'groups', label: 'Groups', icon: '👥' },
    { id: 'more', label: 'More', icon: '☰', badge: moreBadge },
  ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-20 flex"
      style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        borderTop: `1px solid ${color}18`,
        boxShadow: `0 -4px 24px ${color}0d`,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          className="flex-1 py-2 flex flex-col items-center gap-0.5 relative"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {t.badge && (
            <div
              style={{
                position: 'absolute',
                top: 6,
                right: '28%',
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: '0 2px 6px rgba(239,68,68,0.5)',
                zIndex: 2,
              }}
            />
          )}
          <span
            style={{
              fontSize: 20,
              filter: active === t.id ? 'none' : 'grayscale(30%)',
              transition: 'transform 0.2s',
              transform: active === t.id ? 'scale(1.15)' : 'scale(1)',
            }}
          >
            {t.icon}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: active === t.id ? 700 : 500,
              color: active === t.id ? color : '#9CA3AF',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'color 0.2s',
            }}
          >
            {t.label}
          </span>
          {active === t.id && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 32,
                height: 2.5,
                borderRadius: '0 0 4px 4px',
                background: `linear-gradient(90deg, ${color}, ${color}bb)`,
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Home Screen ────────────────────────────────────────────────────────────
function HomeScreen({ user, setActiveTab, setMoreSub }: {
  user: User;
  setActiveTab: (t: string) => void;
  setMoreSub: (s: string) => void;
}) {
  const [events, setEvents] = useState<any[]>([]);
  const [devotional, setDevotional] = useState<any>(null);
  const [pinned, setPinned] = useState<any[]>([]);
  const color = user.church.primaryColor;

  useEffect(() => {
    (async () => {
      const { data: ev } = await supabase.from('events').select('*')
        .eq('church_id', user.church.id)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true }).limit(3);
      if (ev) setEvents(ev);

      const day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];
      const { data: dv } = await supabase.from('devotionals').select('*')
        .eq('church_id', user.church.id).eq('day_of_week', day)
        .order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (dv) setDevotional(dv);

      const { data: an } = await supabase.from('announcements').select('*')
        .eq('church_id', user.church.id).eq('approved', true)
        .order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(5);
      if (an) setPinned(an);
    })();
  }, [user.church.id]);

  const links = [
    { icon: '📖', title: "Today's Devotional", sub: devotional?.title || 'No devotional today', tab: 'community' },
    { icon: '🙏', title: 'Prayer Wall', sub: 'Share and receive prayer', tab: 'community' },
    { icon: '⚡', title: 'Challenges', sub: 'View active challenges', tab: 'community' },
    { icon: '💳', title: 'Give', sub: 'Support your church', tab: 'more', sub2: 'giving' },
  ];

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ backgroundColor: BRAND.bg, minHeight: '100vh', paddingBottom: 80 }}>

      {/* Hero welcome card */}
      <div
        className="mx-4 mt-4 rounded-3xl p-5 text-white relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 60%, #4c1d95 100%)`,
          boxShadow: `0 8px 32px ${color}40`,
        }}
      >
        {/* Decorative circle */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
        <div style={{ position: 'absolute', bottom: -20, right: 40, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />

        <div className="flex items-start justify-between relative z-10">
          <div>
            <p style={{ fontSize: 13, opacity: 0.8, fontFamily: "'DM Sans', sans-serif" }}>{greeting()},</p>
            <h2 style={{ fontSize: 26, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1.2, marginTop: 2 }}>
              {user.name || user.email}
            </h2>
            <p style={{ fontSize: 12, opacity: 0.7, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{user.church.name}</p>
          </div>
          <Avatar url={user.avatarUrl} name={user.name || user.email} size={46} color="rgba(255,255,255,0.6)" />
        </div>

        <div className="flex gap-4 mt-4 pt-4 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.2)' }}>
          <div>
            <p style={{ fontSize: 11, opacity: 0.7, fontFamily: "'DM Sans', sans-serif" }}>Points</p>
            <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif" }}>{user.points.toLocaleString()}</p>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <div>
            <p style={{ fontSize: 11, opacity: 0.7, fontFamily: "'DM Sans', sans-serif" }}>Streak</p>
            <p style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Cormorant Garamond', serif" }}>{user.streak}d 🔥</p>
          </div>
          <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }} />
          <div>
            <p style={{ fontSize: 11, opacity: 0.7, fontFamily: "'DM Sans', sans-serif" }}>Role</p>
            <p style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize', fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>
              {user.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Pinned announcements */}
      {pinned.map((a, i) => (
        <button
          key={i}
          onClick={() => { setMoreSub('ann'); setActiveTab('more'); }}
          className="mx-4 mt-3 w-full text-left rounded-2xl p-3.5 flex items-center gap-3"
          style={{ background: BRAND.white, border: `1px solid ${color}20`, boxShadow: `0 2px 10px ${color}0a` }}
        >
          <div
            className="flex items-center justify-center rounded-xl flex-shrink-0"
            style={{ width: 36, height: 36, background: `${color}12` }}
          >
            <span style={{ fontSize: 16 }}>📣</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800 truncate" style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{a.title}</p>
            {a.body && <p className="text-gray-400 text-xs truncate mt-0.5">{a.body}</p>}
          </div>
          <span style={{ color: `${color}80`, fontSize: 18 }}>›</span>
        </button>
      ))}

      {/* Quick access */}
      <div className="mx-4 mt-4 rounded-3xl p-4" style={{ background: BRAND.white, boxShadow: `0 2px 16px ${color}08` }}>
        <SectionLabel color={color}>Quick Access</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {links.map((l, i) => (
            <button
              key={i}
              onClick={() => {
                if (l.sub2) setMoreSub(l.sub2);
                setActiveTab(l.tab);
              }}
              className="flex items-center gap-3 p-3 rounded-2xl text-left"
              style={{ background: `${color}07`, border: `1px solid ${color}12`, transition: 'background 0.2s' }}
            >
              <div
                className="flex items-center justify-center rounded-xl flex-shrink-0"
                style={{ width: 38, height: 38, background: `${color}14` }}
              >
                <span style={{ fontSize: 18 }}>{l.icon}</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-800" style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{l.title}</p>
                <p className="text-gray-400 text-xs mt-0.5">{l.sub}</p>
              </div>
              <span style={{ color: `${color}60`, fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>
      </div>

      {/* Upcoming events */}
      {events.length > 0 && (
        <div className="mx-4 mt-4 rounded-3xl p-4" style={{ background: BRAND.white, boxShadow: `0 2px 16px ${color}08` }}>
          <SectionLabel color={color}>Upcoming Events</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map((ev, i) => {
              const d = new Date(ev.event_date);
              return (
                <button
                  key={i}
                  onClick={() => { setMoreSub('events'); setActiveTab('more'); }}
                  className="flex items-center gap-3 text-left"
                >
                  <div
                    className="flex flex-col items-center justify-center rounded-2xl flex-shrink-0"
                    style={{ width: 48, height: 52, background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 12px ${color}30` }}
                  >
                    <span style={{ fontSize: 18, fontWeight: 800, color: BRAND.white, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{d.getDate()}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: "'DM Sans', sans-serif" }}>{d.toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800" style={{ fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>{ev.title}</p>
                    <p className="text-gray-400 text-xs mt-0.5">{ev.location || d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <span style={{ color: `${color}60`, fontSize: 18 }}>›</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sunday Screen ──────────────────────────────────────────────────────────
function SundayScreen({ user }: { user: User }) {
  const [tab, setTab] = useState('notes');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [privateNotes, setPrivateNotes] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [shared, setShared] = useState<any[]>([]);
  const [sermon, setSermon] = useState<any>(null);
  const [toast, setToast] = useState('');
  const isAdminUser = isAdmin(user);
  const color = user.church.primaryColor;

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
      church_id: user.church.id,
      member_id: user.id,
      answers,
      shared: false,
      points_awarded: 50,
      private_notes: privateNotes,
    });
    await supabase.from('profiles').update({ points: user.points + 50 }).eq('id', user.id);
    setSubmitted(true);
    setToast('Notes submitted! +50 points earned');
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

  const tabs = ['notes', 'community', ...(isAdminUser ? ['ai assistant'] : [])];

  return (
    <div style={{ backgroundColor: BRAND.bg, minHeight: '100vh', paddingBottom: 80 }}>
      {toast && <Toast message={toast} color={color} onClose={() => setToast('')} />}
      <ScreenHeader title="Sunday" subtitle="Engage with the Word" color={color} />

      <div className="px-4">
        {/* Tab pills */}
        <div className="flex gap-2 mb-4">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold capitalize"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: tab === t ? `linear-gradient(135deg, ${color}, ${color}cc)` : `${color}0d`,
                color: tab === t ? BRAND.white : color,
                border: `1px solid ${color}${tab === t ? '00' : '20'}`,
                boxShadow: tab === t ? `0 4px 14px ${color}30` : 'none',
                transition: 'all 0.2s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Sermon header card */}
            <div
              className="rounded-3xl p-5"
              style={{ background: BRAND.white, border: `1px solid ${color}15`, boxShadow: `0 2px 16px ${color}08` }}
            >
              {sermon?.series && (
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full text-white inline-block mb-2"
                  style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, fontFamily: "'DM Sans', sans-serif" }}
                >
                  {sermon.series}
                </span>
              )}
              <h2
                className="text-gray-900 font-bold"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, lineHeight: 1.2 }}
              >
                {sermon?.title || 'Sermon Notes'}
              </h2>
              {sermon?.scripture && (
                <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{sermon.scripture}</p>
              )}
            </div>

            {submitted ? (
              <div
                className="rounded-3xl p-6 text-center"
                style={{ background: BRAND.white, border: `1px solid ${color}15` }}
              >
                <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 6 }}>
                  Notes Submitted!
                </h3>
                <p className="text-gray-500 text-sm mb-4">+50 points earned</p>
                <LuxBtn color={color} onClick={printNotes} style={{ width: '100%' }}>
                  🖨️ Print or Save My Notes
                </LuxBtn>
              </div>
            ) : (
              <div
                className="rounded-3xl p-5"
                style={{ background: BRAND.white, border: `1px solid ${color}15`, boxShadow: `0 2px 16px ${color}08` }}
              >
                {/* Key scripture */}
                {sermon?.key_scriptures?.length > 0 ? (
                  <div
                    className="rounded-2xl p-4 mb-4 border-l-4"
                    style={{ backgroundColor: `${color}0c`, borderColor: color }}
                  >
                    <p className="text-xs font-semibold mb-2" style={{ color, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {sermon.key_scriptures[0].reference}
                    </p>
                    {sermon.key_scriptures[0].versions ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {sermon.key_scriptures[0].versions.map((v: any, j: number) => (
                          <div key={j} style={{ paddingTop: j > 0 ? 10 : 0, borderTop: j > 0 ? `1px solid ${color}18` : 'none' }}>
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full text-white inline-block mb-1"
                              style={{ background: color, fontFamily: "'DM Sans', sans-serif", opacity: 0.85 }}
                            >
                              {v.translation}
                            </span>
                            <p className="text-gray-700 text-sm italic leading-relaxed mt-1">"{v.text}"</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-700 text-sm italic">"{sermon.key_scriptures[0].text}"</p>
                    )}
                  </div>
                ) : sermon?.scripture ? (
                  <div
                    className="rounded-2xl p-4 mb-4 border-l-4"
                    style={{ backgroundColor: `${color}0c`, borderColor: color }}
                  >
                    <p className="text-xs font-semibold mb-1" style={{ color, fontFamily: "'DM Sans', sans-serif', textTransform: 'uppercase'" }}>KEY VERSE</p>
                    <p className="text-gray-700 text-sm italic leading-relaxed">{sermon.scripture}</p>
                  </div>
                ) : null}

                {/* Fill in the blanks */}
                {sermon?.blanks?.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>Fill in the Blanks</p>
                    {sermon.blanks.map((b: any, i: number) => (
                      <div key={i} className="mb-3">
                        <p className="text-sm text-gray-700 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{b.label}</p>
                        <input
                          type="text"
                          placeholder="Your answer..."
                          value={answers[`blank_${i}`] || ''}
                          onChange={e => setAnswers({ ...answers, [`blank_${i}`]: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none"
                          style={{ border: `1.5px solid ${color}25`, background: `${color}06`, fontFamily: "'DM Sans', sans-serif", transition: 'border-color 0.2s' }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Open ended */}
                {sermon?.open_ended?.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>Questions</p>
                    {sermon.open_ended.map((q: string, i: number) => (
                      <div key={i} className="mb-3">
                        <p className="text-sm text-gray-700 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{q}</p>
                        <textarea
                          placeholder="Your answer..."
                          value={answers[`open_${i}`] || ''}
                          onChange={e => setAnswers({ ...answers, [`open_${i}`]: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none h-20 resize-none"
                          style={{ border: `1.5px solid ${color}25`, background: `${color}06`, fontFamily: "'DM Sans', sans-serif" }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Reflections */}
                {sermon?.reflections?.length > 0 && (
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>Reflections</p>
                    {sermon.reflections.map((r: string, i: number) => (
                      <div key={i} className="mb-3">
                        <p className="text-sm text-gray-700 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{r}</p>
                        <textarea
                          placeholder="Your reflection..."
                          value={answers[`ref_${i}`] || ''}
                          onChange={e => setAnswers({ ...answers, [`ref_${i}`]: e.target.value })}
                          className="w-full px-4 py-2.5 rounded-xl text-sm focus:outline-none h-20 resize-none"
                          style={{ border: `1.5px solid ${color}25`, background: `${color}06`, fontFamily: "'DM Sans', sans-serif" }}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Private notes */}
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>My Private Notes</p>
                  <textarea
                    placeholder="Personal notes just for you. These are never shared..."
                    value={privateNotes}
                    onChange={e => setPrivateNotes(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none h-24 resize-none"
                    style={{ border: `1.5px solid ${color}20`, background: `${color}06`, fontFamily: "'DM Sans', sans-serif" }}
                  />
                  <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Private and visible only to you</p>
                </div>

                <div className="flex gap-3">
                  <LuxBtn color={color} variant="outline" onClick={printNotes} style={{ flex: 1 }}>
                    🖨️ Print
                  </LuxBtn>
                  <LuxBtn color={color} onClick={submitNotes} style={{ flex: 2 }}>
                    Submit (+50 pts)
                  </LuxBtn>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'community' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {shared.length === 0 ? (
              <EmptyState icon="📝" message="No shared notes yet. Be the first to share your reflections." />
            ) : (
              shared.map((note, i) => (
                <div
                  key={i}
                  className="rounded-3xl p-4"
                  style={{ background: BRAND.white, border: `1px solid ${color}12`, boxShadow: `0 2px 10px ${color}08` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar url={note.profiles?.avatar_url} name={note.profiles?.full_name || 'Member'} size={30} color={color} />
                    <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                      {note.profiles?.full_name || 'Anonymous'}
                    </p>
                  </div>
                  {note.answers && Object.values(note.answers).map((a: any, j: number) =>
                    a && <p key={j} className="text-gray-600 text-sm mt-1 italic">"{a}"</p>
                  )}
                  {isAdminUser && (
                    <button
                      onClick={async () => {
                        await supabase.from('sermon_notes').update({ shared: false }).eq('id', note.id);
                        setShared(shared.filter(n => n.id !== note.id));
                      }}
                      className="mt-2 text-xs text-red-400"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'ai assistant' && isAdminUser && <AISermonAssistant user={user} />}
      </div>
    </div>
  );
}

// ── Sermon Notes Editor ────────────────────────────────────────────────────
function SermonNotesEditor({ user }: { user: User }) {
  const [sermon, setSermon] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const color = user.church.primaryColor;

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
    <div
      className="p-4 rounded-2xl text-center"
      style={{ background: `${color}08`, border: `1px solid ${color}15` }}
    >
      <p className="text-gray-400 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        Generate content first to see sermon notes here.
      </p>
    </div>
  );

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    border: `1.5px solid ${color}20`,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    background: `${color}06`,
  };

  return (
    <div
      className="rounded-2xl p-4"
      style={{ border: `1px solid ${color}20`, background: `${color}05` }}
    >
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Sermon Title</label>
        <input type="text" defaultValue={sermon.title || ''} onBlur={e => setSermon({ ...sermon, title: e.target.value })} style={inputStyle} />
      </div>
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Scripture</label>
        <input type="text" defaultValue={sermon.scripture || ''} onBlur={e => setSermon({ ...sermon, scripture: e.target.value })} style={inputStyle} />
      </div>
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Fill in the Blanks</label>
        {(sermon.blanks || []).map((b: any, i: number) => (
          <div key={i} className="mb-2">
            <input type="text" defaultValue={b.label || ''} onBlur={e => { const updated = [...sermon.blanks]; updated[i] = { ...updated[i], label: e.target.value }; setSermon({ ...sermon, blanks: updated }); }} style={inputStyle} />
          </div>
        ))}
      </div>
      <div className="mb-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Open Ended Questions</label>
        {(sermon.open_ended || []).map((q: string, i: number) => (
          <div key={i} className="mb-2">
            <input type="text" defaultValue={q} onBlur={e => { const updated = [...sermon.open_ended]; updated[i] = e.target.value; setSermon({ ...sermon, open_ended: updated }); }} style={inputStyle} />
          </div>
        ))}
      </div>
      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Reflection Questions</label>
        {(sermon.reflections || []).map((r: string, i: number) => (
          <div key={i} className="mb-2">
            <input type="text" defaultValue={r} onBlur={e => { const updated = [...sermon.reflections]; updated[i] = e.target.value; setSermon({ ...sermon, reflections: updated }); }} style={inputStyle} />
          </div>
        ))}
      </div>
      <div className="flex gap-3">
        <LuxBtn color={color} variant="outline" onClick={() => save(false)} disabled={saving} style={{ flex: 1, fontSize: 13 }}>
          Save Draft
        </LuxBtn>
        <LuxBtn color={color} onClick={() => save(true)} disabled={saving} style={{ flex: 1, fontSize: 13 }}>
          Publish Notes
        </LuxBtn>
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
  const color = user.church.primaryColor;

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

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: `1.5px solid ${color}20`,
    borderRadius: 12,
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    background: `${color}06`,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {step === 'theology' && (
        <div
          className="rounded-3xl p-5"
          style={{ background: BRAND.white, border: `1px solid ${color}15`, boxShadow: `0 2px 16px ${color}08` }}
        >
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 4 }}>
            Theology Settings
          </h3>
          <p className="text-gray-400 text-sm mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Configure your doctrine so all AI content reflects your beliefs.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {theologyFields.map((f, i) => (
              <div key={i}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f.label}</label>
                {f.ta ? (
                  <textarea placeholder={f.ph} value={(theology as any)[f.key]} onChange={e => setTheology({ ...theology, [f.key]: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
                ) : (
                  <input type="text" placeholder={f.ph} value={(theology as any)[f.key]} onChange={e => setTheology({ ...theology, [f.key]: e.target.value })} style={inputStyle} />
                )}
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Writing Tone</label>
              <select value={theology.writing_tone} onChange={e => setTheology({ ...theology, writing_tone: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['Expository', 'Conversational', 'Prophetic', 'Teaching', 'Evangelistic', 'Devotional', 'Encouraging'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Bible Translations (up to 3)</label>
              <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Each selected translation will appear on Sunday notes.</p>
              {[{ label: 'Translation 1', key: 'translation_1' }, { label: 'Translation 2 (optional)', key: 'translation_2' }, { label: 'Translation 3 (optional)', key: 'translation_3' }].map((f, i) => (
                <div key={i} className="mb-2">
                  <label className="text-xs text-gray-400 block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f.label}</label>
                  <select value={(theology as any)[f.key]} onChange={e => setTheology({ ...theology, [f.key]: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option value="">None</option>
                    {['KJV', 'NKJV', 'NIV', 'ESV', 'NLT', 'AMP', 'NASB', 'CSB', 'MSG', 'NCV', 'HCSB', 'RSV', 'NRSV', 'TLB', 'GNT', 'NET', 'WEB', 'ASV', 'YLT', 'DBY'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
            <LuxBtn color={color} onClick={saveTheology} style={{ width: '100%' }}>
              Save and Continue
            </LuxBtn>
          </div>
        </div>
      )}

      {step === 'input' && (
        <div
          className="rounded-3xl p-5"
          style={{ background: BRAND.white, border: `1px solid ${color}15`, boxShadow: `0 2px 16px ${color}08` }}
        >
          <div className="flex justify-between items-center mb-1">
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#111' }}>
              AI Sermon Assistant
            </h3>
            <button
              onClick={() => setStep('theology')}
              className="text-xs px-3 py-1.5 rounded-xl border font-semibold"
              style={{ color, borderColor: `${color}40`, fontFamily: "'DM Sans', sans-serif" }}
            >
              Edit Theology
            </button>
          </div>
          <p className="text-gray-400 text-sm mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Paste your outline and generate a full week of content.
          </p>
          <textarea
            placeholder="Paste your sermon title, scripture, main points, illustrations, and notes here..."
            value={outline}
            onChange={e => setOutline(e.target.value)}
            className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none resize-none h-40"
            style={{ border: `1.5px solid ${color}20`, background: `${color}06`, fontFamily: "'DM Sans', sans-serif" }}
          />
          <div
            className="rounded-2xl p-4 mt-3 mb-4"
            style={{ background: `${color}0a`, border: `1px solid ${color}18` }}
          >
            <p className="text-xs font-semibold mb-2" style={{ color, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Will generate:</p>
            <div className="grid grid-cols-2 gap-1">
              {['5 Daily Devotionals', 'Small Group Questions', 'Weekly Challenge', 'Prayer Prompt', 'Announcement', '3 Social Captions'].map((x, i) => (
                <p key={i} className="text-xs text-gray-600 flex items-center gap-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  <span style={{ color }}>✓</span> {x}
                </p>
              ))}
            </div>
          </div>
          <LuxBtn color={color} onClick={generate} disabled={generating} style={{ width: '100%', fontSize: 15 }}>
            {generating ? '✨ Generating...' : '✨ Generate Content'}
          </LuxBtn>
        </div>
      )}

      {step === 'draft' && draft && (
        <div
          className="rounded-3xl p-5"
          style={{ background: BRAND.white, border: `1px solid ${color}15`, boxShadow: `0 2px 16px ${color}08` }}
        >
          <div className="flex justify-between items-center mb-1">
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#111' }}>
              Generated Content
            </h3>
            <span
              className="text-xs px-3 py-1 rounded-full font-semibold"
              style={{ background: '#fef3c7', color: '#92400e', fontFamily: "'DM Sans', sans-serif" }}
            >
              Draft
            </span>
          </div>
          <p className="text-gray-400 text-sm mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Review and edit before publishing. Nothing goes live until you tap Publish.
          </p>

          {/* Devotionals */}
          <div className="mb-5">
            <SectionLabel color={color}>Daily Devotionals</SectionLabel>
            {(draft.generated_devotionals || []).map((dv: any, i: number) => (
              <div key={i} className="mb-3 p-4 rounded-2xl" style={{ border: `1px solid ${color}18`, background: `${color}05` }}>
                <p className="text-xs font-bold mb-1.5" style={{ color, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>{dv.day}</p>
                <input type="text" defaultValue={dv.title || ''} onBlur={e => { const u = [...(draft.generated_devotionals || [])]; u[i] = { ...u[i], title: e.target.value }; updateField('generated_devotionals', u); }} className="w-full font-semibold text-gray-800 text-sm border-0 focus:outline-none bg-transparent" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17 }} />
                <textarea defaultValue={dv.body || ''} onBlur={e => { const u = [...(draft.generated_devotionals || [])]; u[i] = { ...u[i], body: e.target.value }; updateField('generated_devotionals', u); }} className="w-full text-gray-600 text-xs border-0 focus:outline-none resize-none h-16 mt-1 bg-transparent" style={{ fontFamily: "'DM Sans', sans-serif" }} />
              </div>
            ))}
          </div>

          {/* Small group questions */}
          <div className="mb-5">
            <SectionLabel color={color}>Small Group Questions</SectionLabel>
            {(draft.generated_questions || []).map((q: string, i: number) => (
              <div key={i} className="flex gap-2 mb-2">
                <span className="text-xs text-gray-400 mt-2 flex-shrink-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>{i + 1}.</span>
                <input type="text" defaultValue={q} onBlur={e => { const u = [...(draft.generated_questions || [])]; u[i] = e.target.value; updateField('generated_questions', u); }} className="flex-1 text-sm text-gray-700 border-b focus:outline-none pb-1 bg-transparent" style={{ borderColor: `${color}25`, fontFamily: "'DM Sans', sans-serif" }} />
              </div>
            ))}
            <button onClick={() => updateField('generated_questions', [...(draft.generated_questions || []), 'New question'])} className="text-xs mt-1 font-semibold" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>+ Add question</button>
          </div>

          {/* Social captions */}
          {draft.generated_social && (
            <div className="mb-5">
              <SectionLabel color={color}>Social Captions</SectionLabel>
              {Object.entries(draft.generated_social).map(([key, val]) => (
                <div key={key} className="mb-3">
                  <p className="text-xs text-gray-400 capitalize mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{key}:</p>
                  <textarea defaultValue={val as string} onBlur={e => updateField('generated_social', { ...draft.generated_social, [key]: e.target.value })} className="w-full text-sm text-gray-700 border rounded-xl p-2.5 focus:outline-none resize-none h-16" style={{ borderColor: `${color}20`, background: `${color}05`, fontFamily: "'DM Sans', sans-serif" }} />
                </div>
              ))}
            </div>
          )}

          {/* Prayer prompt */}
          <div className="mb-5">
            <SectionLabel color={color}>Prayer Prompt</SectionLabel>
            <textarea defaultValue={draft.generated_prayer || ''} onBlur={e => updateField('generated_prayer', e.target.value)} className="w-full text-sm text-gray-700 border rounded-xl p-2.5 focus:outline-none resize-none h-16" style={{ borderColor: `${color}20`, background: `${color}05`, fontFamily: "'DM Sans', sans-serif" }} />
          </div>

          {/* Announcement */}
          <div className="mb-5">
            <SectionLabel color={color}>Announcement</SectionLabel>
            <textarea defaultValue={draft.generated_announcement || ''} onBlur={e => updateField('generated_announcement', e.target.value)} className="w-full text-sm text-gray-700 border rounded-xl p-2.5 focus:outline-none resize-none h-16" style={{ borderColor: `${color}20`, background: `${color}05`, fontFamily: "'DM Sans', sans-serif" }} />
          </div>

          {/* Personal notes */}
          <div className="mb-5">
            <SectionLabel color={color}>Personal Notes</SectionLabel>
            <textarea defaultValue={draft.admin_notes || ''} onBlur={e => updateField('admin_notes', e.target.value)} placeholder="Add notes, reminders, or additional context..." className="w-full text-sm text-gray-700 border rounded-xl p-2.5 focus:outline-none resize-none h-20" style={{ borderColor: `${color}20`, background: `${color}05`, fontFamily: "'DM Sans', sans-serif" }} />
          </div>

          {/* Sermon notes editor */}
          <div className="mb-5">
            <SectionLabel color={color}>Sunday Sermon Notes</SectionLabel>
            <SermonNotesEditor user={user} />
          </div>

          <div className="flex gap-3">
            <LuxBtn color={color} variant="outline" onClick={() => { setStep('input'); setDraft(null); }} style={{ flex: 1 }}>
              Discard
            </LuxBtn>
            <LuxBtn color={color} onClick={publish} style={{ flex: 2 }}>
              Publish All
            </LuxBtn>
          </div>
        </div>
      )}
    </div>
  );
}
// ── Devotional Accordion ───────────────────────────────────────────────────
function DevotionalAccordion({ user, devotionals }: { user: User; devotionals: any[] }) {
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [read, setRead] = useState<Record<string, boolean>>({});
  const color = user.church.primaryColor;
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()];

  const byDay = days.reduce((acc: Record<string, any>, day) => {
    const dv = devotionals.find(d => d.day_of_week === day);
    if (dv) acc[day] = dv;
    return acc;
  }, {});

  if (devotionals.length === 0) return (
    <EmptyState icon="📖" message="No devotionals posted yet. Check back soon." />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p className="text-xs text-gray-400 text-center mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Tap a day to read</p>
      {days.filter(day => byDay[day]).map((day, i) => {
        const dv = byDay[day];
        const isOpen = openDay === day;
        const isToday = day === today;
        const isRead = read[day];

        return (
          <div
            key={i}
            className="rounded-3xl overflow-hidden"
            style={{
              background: BRAND.white,
              border: `1px solid ${isToday ? color + '40' : color + '12'}`,
              boxShadow: isToday ? `0 4px 20px ${color}15` : `0 2px 8px ${color}06`,
            }}
          >
            <button
              onClick={() => setOpenDay(isOpen ? null : day)}
              className="w-full flex items-center justify-between p-4"
              style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-2xl flex-shrink-0 font-bold"
                  style={{
                    width: 44,
                    height: 44,
                    background: isRead
                      ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                      : isToday
                        ? `linear-gradient(135deg, ${color}, ${color}cc)`
                        : `${color}12`,
                    color: isRead || isToday ? BRAND.white : color,
                    fontSize: isRead ? 18 : 13,
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: isRead ? '0 4px 12px rgba(74,222,128,0.3)' : isToday ? `0 4px 12px ${color}30` : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  {isRead ? '✓' : day.slice(0, 2)}
                </div>
                <div className="text-left">
                  <p className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17 }}>{day}</p>
                  <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{dv.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isToday && !isRead && (
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, fontFamily: "'DM Sans', sans-serif", fontSize: 10 }}
                  >
                    Today
                  </span>
                )}
                <span style={{ color: `${color}60`, fontSize: 20, fontWeight: 300 }}>{isOpen ? '∧' : '∨'}</span>
              </div>
            </button>

            {isOpen && (
              <div className="px-4 pb-5" style={{ borderTop: `1px solid ${color}10` }}>
                <div
                  className="mt-4 mb-4 p-4 rounded-2xl border-l-4"
                  style={{ backgroundColor: `${color}0c`, borderColor: color }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Scripture</p>
                  <p className="text-gray-700 text-sm italic leading-relaxed" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}>{dv.scripture}</p>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>{dv.body}</p>
                {dv.reflection && (
                  <div
                    className="p-4 rounded-2xl mb-4"
                    style={{ background: `${color}08`, border: `1px solid ${color}15` }}
                  >
                    <p className="text-xs font-semibold text-gray-500 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reflect</p>
                    <p className="text-gray-600 text-sm italic" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}>{dv.reflection}</p>
                  </div>
                )}
                {!isRead ? (
                  <LuxBtn
                    color={color}
                    onClick={async () => {
                      await supabase.from('profiles').update({ points: user.points + 20 }).eq('id', user.id);
                      setRead({ ...read, [day]: true });
                      setOpenDay(null);
                    }}
                    style={{ width: '100%' }}
                  >
                    Mark as Read (+20 pts)
                  </LuxBtn>
                ) : (
                  <p className="text-center text-green-500 text-sm font-semibold" style={{ fontFamily: "'DM Sans', sans-serif" }}>✓ Completed</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Challenge Card ─────────────────────────────────────────────────────────
function ChallengeCard({ challenge: c, user }: { challenge: any; user: User }) {
  const [expanded, setExpanded] = useState(false);
  const [joined, setJoined] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const color = user.church.primaryColor;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('challenge_participants')
        .select('*').eq('challenge_id', c.id).eq('member_id', user.id).maybeSingle();
      if (data) { setJoined(true); setProgress(data.progress || 0); }
      const { data: lb } = await supabase.from('challenge_participants')
        .select('progress, completed, profiles(full_name, avatar_url)')
        .eq('challenge_id', c.id)
        .order('progress', { ascending: false }).limit(5);
      if (lb) setLeaderboard(lb);
    })();
  }, [c.id, user.id]);

  async function join() {
    setLoading(true);
    await supabase.from('challenge_participants').insert({ challenge_id: c.id, member_id: user.id, progress: 0 });
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
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: BRAND.white,
        border: `1px solid ${color}15`,
        boxShadow: `0 2px 12px ${color}08`,
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex justify-between items-start mb-1">
          <h3 className="font-bold text-gray-800 flex-1 pr-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19 }}>{c.title}</h3>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full text-white"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, fontFamily: "'DM Sans', sans-serif" }}
            >
              {c.type}
            </span>
            <span style={{ color: `${color}60`, fontSize: 18 }}>{expanded ? '∧' : '∨'}</span>
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>{c.points} points · {totalDays} days</p>
        {joined && (
          <div>
            <div className="flex justify-between text-xs text-gray-400 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
              <span>Progress</span>
              <span>{progress}/{totalDays} days</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: `${color}15` }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
              />
            </div>
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-5" style={{ borderTop: `1px solid ${color}10` }}>
          {c.description && (
            <p className="text-gray-600 text-sm pt-4 leading-relaxed mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>{c.description}</p>
          )}
          {c.media_url && <MediaDisplay url={c.media_url} type={c.media_type || 'image'} />}
          {c.type === 'Streak' && (
            <div className="flex gap-1 mb-4 mt-2">
              {Array.from({ length: totalDays }).map((_, d) => (
                <div
                  key={d}
                  className="flex-1 h-2 rounded-full transition-all"
                  style={{ background: d < progress ? `linear-gradient(90deg, ${color}, ${color}cc)` : `${color}15` }}
                />
              ))}
            </div>
          )}
          {leaderboard.length > 0 && (
            <div className="mb-4">
              <button
                onClick={() => setShowLeaderboard(!showLeaderboard)}
                className="text-xs font-semibold mb-2 flex items-center gap-1"
                style={{ color, fontFamily: "'DM Sans', sans-serif", background: 'none', border: 'none', cursor: 'pointer' }}
              >
                🏆 Leaderboard {showLeaderboard ? '∧' : '∨'}
              </button>
              {showLeaderboard && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                  {leaderboard.map((p, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2.5 rounded-2xl"
                      style={{ background: `${color}08` }}
                    >
                      <span className="text-sm w-5 text-center">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</span>
                      <Avatar url={p.profiles?.avatar_url} name={p.profiles?.full_name || 'Member'} size={22} color={color} />
                      <p className="flex-1 text-xs font-semibold text-gray-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.profiles?.full_name || 'Member'}</p>
                      <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.progress}/{c.total_days || 7}d</p>
                      {p.completed && <span className="text-xs text-green-500 font-bold">✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {!joined ? (
            <LuxBtn color={color} onClick={join} disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Joining...' : 'Join Challenge'}
            </LuxBtn>
          ) : progress >= totalDays ? (
            <div className="text-center py-2">
              <p style={{ fontSize: 36, marginBottom: 4 }}>🏆</p>
              <p className="font-bold text-green-500 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>Challenge Complete!</p>
            </div>
          ) : (
            <LuxBtn color={color} onClick={logProgress} style={{ width: '100%' }}>
              Log Today (+{Math.round((c.points || 100) / totalDays)} pts)
            </LuxBtn>
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
  const [prayerMedia, setPrayerMedia] = useState<{ url: string; type: string } | null>(null);
  const [chatMedia, setChatMedia] = useState<{ url: string; type: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const color = user.church.primaryColor;

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
      .eq('church_id', user.church.id).order('created_at', { ascending: false }).limit(7);
    if (dv) setDevotionals(dv);

    const { data: cm } = await supabase.from('chat_messages')
      .select('*, profiles(full_name, avatar_url)')
      .eq('church_id', user.church.id).is('group_id', null).eq('is_deleted', false)
      .order('created_at', { ascending: false }).limit(50);
    if (cm) setMsgs(cm.map((m: any) => ({
      id: m.id,
      content: m.content,
      author_id: m.author_id,
      author_name: m.profiles?.full_name || 'Member',
      author_avatar: m.profiles?.avatar_url,
      created_at: m.created_at,
      group_id: null,
      media_url: m.media_url,
      media_type: m.media_type,
    })));
  }

 useEffect(() => {
  if (msgs.length === 0) return;
  setTimeout(() => {
    const anchor = document.getElementById('chat-anchor');
    if (anchor) anchor.scrollIntoView({ behavior: 'auto' });
  }, 50);
}, [msgs]);

  useEffect(() => {
    load();
    const channel = supabase.channel('community-chat')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `church_id=eq.${user.church.id}`,
      }, (payload: any) => {
        setMsgs(prev => [
          {
            id: payload.new.id,
            content: payload.new.content,
            author_id: payload.new.author_id,
            author_name: 'Member',
            created_at: payload.new.created_at,
            group_id: null,
            media_url: payload.new.media_url,
            media_type: payload.new.media_type,
          },
          ...prev,
        ]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user.church.id]);

  async function postPrayer() {
    if (!prayerText.trim()) return;
    await supabase.from('prayer_requests').insert({
      church_id: user.church.id,
      author_id: user.id,
      body: prayerText,
      is_private: isPrivate,
      media_url: prayerMedia?.url || null,
      media_type: prayerMedia?.type || null,
    });
    setPrayerText('');
    setPrayerMedia(null);
    load();
  }

  async function sendChat() {
    if (!chatText.trim() && !chatMedia) return;
    await supabase.from('chat_messages').insert({
      church_id: user.church.id,
      author_id: user.id,
      content: chatText,
      group_id: null,
      media_url: chatMedia?.url || null,
      media_type: chatMedia?.type || null,
    });
    setChatText('');
    setChatMedia(null);
  }

  const tabs = ['prayer', 'challenges', 'devotional', 'chat'];

  return (
    <div style={{ backgroundColor: BRAND.bg, minHeight: '100vh', paddingBottom: 80 }}>
      <ScreenHeader title="Community" subtitle="Pray, grow, and connect" color={color} />

      <div className="px-4">
        {/* Tab pills */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold capitalize"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: tab === t ? `linear-gradient(135deg, ${color}, ${color}cc)` : `${color}0d`,
                color: tab === t ? BRAND.white : color,
                border: `1px solid ${color}${tab === t ? '00' : '20'}`,
                boxShadow: tab === t ? `0 4px 14px ${color}30` : 'none',
                transition: 'all 0.2s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Prayer tab */}
        {tab === 'prayer' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              className="rounded-3xl p-4"
              style={{ background: BRAND.white, border: `1px solid ${color}15`, boxShadow: `0 2px 12px ${color}08` }}
            >
              <textarea
                placeholder="Share a prayer request with your church..."
                value={prayerText}
                onChange={e => setPrayerText(e.target.value)}
                className="w-full text-sm text-gray-700 rounded-2xl px-4 py-3 h-20 resize-none focus:outline-none"
                style={{ border: `1.5px solid ${color}20`, background: `${color}06`, fontFamily: "'DM Sans', sans-serif" }}
              />
              {prayerMedia && (
                <div className="mt-2">
                  <MediaDisplay url={prayerMedia.url} type={prayerMedia.type} />
                  <button onClick={() => setPrayerMedia(null)} className="text-xs text-red-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
                </div>
              )}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                    <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="rounded" />
                    Private
                  </label>
                  <MediaPicker folder="prayer" onUpload={(url, type) => setPrayerMedia({ url, type })} />
                </div>
                <LuxBtn color={color} onClick={postPrayer} style={{ padding: '9px 20px', fontSize: 13 }}>Post</LuxBtn>
              </div>
            </div>

            {prayers.length === 0 ? (
              <EmptyState icon="🙏" message="No prayer requests yet. Be the first to share." />
            ) : prayers.map((p, i) => (
              <div
                key={i}
                className="rounded-3xl p-4"
                style={{ background: BRAND.white, border: `1px solid ${color}12`, boxShadow: `0 2px 10px ${color}06` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Avatar url={p.profiles?.avatar_url} name={p.profiles?.full_name || 'Member'} size={30} color={color} />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.profiles?.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{new Date(p.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm mb-2 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.body}</p>
                {p.media_url && <MediaDisplay url={p.media_url} type={p.media_type || 'image'} />}
                <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: `1px solid ${color}10` }}>
                  <button
                    onClick={async () => {
                      await supabase.from('prayer_requests').update({ pray_count: (p.pray_count || 0) + 1 }).eq('id', p.id);
                      load();
                    }}
                    className="text-sm font-semibold"
                    style={{ color, fontFamily: "'DM Sans', sans-serif", background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    🙏 Pray ({p.pray_count || 0})
                  </button>
                  {(user.id === p.author_id || isAdmin(user)) && (
                    <button
                      onClick={async () => {
                        await supabase.from('prayer_requests').update({ is_answered: true }).eq('id', p.id);
                        load();
                      }}
                      className="text-sm font-semibold text-green-500"
                      style={{ fontFamily: "'DM Sans', sans-serif", background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ✓ Answered
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Challenges tab */}
        {tab === 'challenges' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {challenges.length === 0 ? (
              <EmptyState icon="⚡" message="No active challenges yet. Check back soon." />
            ) : challenges.map((c, i) => (
              <ChallengeCard key={i} challenge={c} user={user} />
            ))}
          </div>
        )}

        {/* Devotional tab */}
        {tab === 'devotional' && (
          <DevotionalAccordion user={user} devotionals={devotionals} />
        )}

        {/* Chat tab */}
        // ── Premium Community Chat ─────────────────────────────────────────────────
{tab === 'chat' && (
  <div
    className="rounded-3xl overflow-hidden flex flex-col"
    style={{
      background: BRAND.white,
      border: `1px solid ${color}20`,
      boxShadow: `0 8px 40px ${color}12`,
      height: '65vh',
      position: 'relative',
    }}
  >
    <style>{`
      @keyframes slideUp {
        from { opacity: 0; transform: translateY(12px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes typingPulse {
        0%, 100% { transform: translateY(0); opacity: 0.4; }
        50% { transform: translateY(-4px); opacity: 1; }
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      .chat-message-new {
        animation: slideUp 0.3s ease forwards;
      }
      .typing-dot {
        animation: typingPulse 1s ease-in-out infinite;
      }
      .typing-dot:nth-child(2) { animation-delay: 0.15s; }
      .typing-dot:nth-child(3) { animation-delay: 0.3s; }
      .reaction-strip {
        animation: fadeIn 0.2s ease forwards;
      }
      .message-bubble:active .reaction-strip {
        display: flex;
      }
    `}</style>

    {/* Header */}
    <div
      style={{
        padding: '14px 16px',
        background: `linear-gradient(160deg, ${color}12 0%, ${color}04 100%)`,
        borderBottom: `1px solid ${color}12`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user.church.logoUrl ? (
          <img
            src={user.church.logoUrl}
            alt="church"
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'contain', border: `2px solid ${color}30` }}
          />
        ) : (
          <div
            style={{
              width: 36, height: 36, borderRadius: '50%',
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: BRAND.white, fontWeight: 700, fontSize: 14,
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: `0 2px 8px ${color}40`,
            }}
          >
            {user.church.logoInitials}
          </div>
        )}
        <div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#111', lineHeight: 1.2 }}>
            Church Chat
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 6px rgba(74,222,128,0.6)' }} />
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#4ade80', fontWeight: 600 }}>Live</p>
          </div>
        </div>
      </div>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: `${color}80`, fontWeight: 500 }}>
        {msgs.length} messages
      </p>
    </div>

    {/* Messages area */}
    <div
      id="community-chat-messages"
      style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      {msgs.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div
            style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `linear-gradient(135deg, ${color}18, ${color}08)`,
              border: `2px solid ${color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 32,
              boxShadow: `0 0 32px ${color}15`,
            }}
          >
            💬
          </div>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, color: '#111', fontWeight: 600 }}>
            Start the conversation
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', maxWidth: 220 }}>
            Be the first to share something with your church family
          </p>
        </div>
      ) : (
        (() => {
          const groups: { date: string; messages: typeof msgs }[] = [];
          msgs.forEach(m => {
            const date = new Date(m.created_at).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            const yesterday = new Date(Date.now() - 86400000).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
            const label = date === today ? 'Today' : date === yesterday ? 'Yesterday' : date;
            const existing = groups.find(g => g.date === label);
            if (existing) existing.messages.push(m);
            else groups.push({ date: label, messages: [m] });
          });

          return groups.map((group, gi) => (
            <div key={gi}>
              {/* Date divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 12px' }}>
                <div style={{ flex: 1, height: 1, background: `${color}12` }} />
                <span
                  style={{
                    fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600,
                    color: `${color}80`, padding: '3px 12px', borderRadius: 20,
                    background: `${color}0a`, border: `1px solid ${color}15`,
                  }}
                >
                  {group.date}
                </span>
                <div style={{ flex: 1, height: 1, background: `${color}12` }} />
              </div>

              {group.messages.map((m, i) => {
                const own = m.author_id === user.id;
                const isAdminSender = m.author_name === user.name && isAdmin(user);
                const showAvatar = !own && (i === 0 || group.messages[i - 1]?.author_id !== m.author_id);
                const isLast = i === group.messages.length - 1 || group.messages[i + 1]?.author_id !== m.author_id;

                return (
                  <div
                    key={m.id}
                    className="chat-message-new"
                    style={{
                      display: 'flex',
                      flexDirection: own ? 'row-reverse' : 'row',
                      alignItems: 'flex-end',
                      gap: 8,
                      marginBottom: isLast ? 12 : 3,
                    }}
                  >
                    {/* Avatar */}
                    {!own && (
                      <div style={{ width: 32, flexShrink: 0, alignSelf: 'flex-end' }}>
                        {showAvatar ? (
                          <div style={{ position: 'relative' }}>
                            <Avatar url={m.author_avatar} name={m.author_name} size={28} color={color} />
                            {isAdminSender && (
                              <div
                                style={{
                                  position: 'absolute', bottom: -2, right: -2,
                                  width: 14, height: 14, borderRadius: '50%',
                                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 8, border: '1.5px solid white',
                                }}
                              >
                                👑
                              </div>
                            )}
                          </div>
                        ) : (
                          <div style={{ width: 28 }} />
                        )}
                      </div>
                    )}

                    <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: own ? 'flex-end' : 'flex-start' }}>
                      {/* Name */}
                      {!own && showAvatar && (
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: `${color}90`, fontWeight: 600, marginBottom: 4, marginLeft: 4 }}>
                          {m.author_name}
                          {isAdminSender && <span style={{ color: '#f59e0b', marginLeft: 4 }}>· Admin</span>}
                        </p>
                      )}

                      {/* Bubble */}
                      <div
                        className="message-bubble"
                        style={{
                          padding: '10px 14px',
                          background: own
                            ? `linear-gradient(135deg, ${color}, ${color}dd)`
                            : `${color}0e`,
                          color: own ? BRAND.white : '#1F2937',
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 14,
                          lineHeight: 1.5,
                          boxShadow: own ? `0 4px 16px ${color}35` : `0 1px 4px ${color}10`,
                          borderRadius: own
                            ? (isLast ? '18px 18px 4px 18px' : '18px 18px 18px 18px')
                            : (isLast ? '18px 18px 18px 4px' : '18px 18px 18px 18px'),
                          position: 'relative',
                        }}
                      >
                        {m.content}
                      </div>

                      {/* Media */}
                      {m.media_url && <MediaDisplay url={m.media_url} type={m.media_type || 'image'} />}

                      {/* Timestamp */}
                      {isLast && (
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#9CA3AF', marginTop: 4, marginLeft: own ? 0 : 4, marginRight: own ? 4 : 0 }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ));
        })()
      )}

      {/* Typing indicator */}
      {false && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${color}15` }} />
          <div
            style={{
              padding: '10px 14px', borderRadius: '18px 18px 18px 4px',
              background: `${color}0e`, display: 'flex', gap: 4, alignItems: 'center',
            }}
          >
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="typing-dot"
                style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: color, animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scroll anchor */}
      <div id="chat-anchor" style={{ height: 1 }} />
    </div>

    {/* Input area */}
    <div
      style={{
        padding: '10px 12px',
        background: BRAND.white,
        borderTop: `1px solid ${color}10`,
        backgroundImage: `linear-gradient(to bottom, ${color}06, transparent)`,
        backgroundSize: '100% 3px',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'top',
      }}
    >
      {/* Media preview */}
      {chatMedia && (
        <div style={{ marginBottom: 8, position: 'relative', display: 'inline-block' }}>
          <MediaDisplay url={chatMedia.url} type={chatMedia.type} />
          <button
            onClick={() => setChatMedia(null)}
            style={{
              position: 'absolute', top: 4, right: 4,
              width: 20, height: 20, borderRadius: '50%',
              background: 'rgba(0,0,0,0.5)', border: 'none',
              color: BRAND.white, fontSize: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Media button */}
        <button
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*,video/*,.pdf';
            input.onchange = async (e) => {
              const file = (e.target as HTMLInputElement).files?.[0];
              if (!file) return;
              const result = await uploadMedia(file, 'chat');
              if (result) setChatMedia({ url: result.url, type: result.type });
            };
            input.click();
          }}
          style={{
            flexShrink: 0,
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '8px 12px', borderRadius: 20,
            background: `linear-gradient(135deg, ${color}15, ${color}08)`,
            border: `1.5px solid ${color}25`,
            color, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12, fontWeight: 600,
            transition: 'all 0.2s',
            boxShadow: `0 2px 8px ${color}10`,
          }}
        >
          <span style={{ fontSize: 14 }}>📎</span>
          <span>Media</span>
        </button>

        {/* Text input */}
        <input
          type="text"
          placeholder="Say something..."
          value={chatText}
          onChange={e => setChatText(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendChat(); }}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 24,
            border: `1.5px solid ${color}20`,
            background: `${color}06`,
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 14,
            color: '#1F2937',
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
          onFocus={e => {
            e.target.style.borderColor = `${color}60`;
            e.target.style.boxShadow = `0 0 0 3px ${color}12`;
          }}
          onBlur={e => {
            e.target.style.borderColor = `${color}20`;
            e.target.style.boxShadow = 'none';
          }}
        />

        {/* Send button */}
        <button
          onClick={sendChat}
          style={{
            flexShrink: 0,
            width: 42, height: 42, borderRadius: '50%',
            background: chatText.trim() || chatMedia
              ? `linear-gradient(135deg, ${color}, ${color}cc)`
              : `${color}15`,
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16,
            boxShadow: chatText.trim() || chatMedia ? `0 4px 16px ${color}40` : 'none',
            transition: 'all 0.2s',
            transform: chatText.trim() || chatMedia ? 'scale(1)' : 'scale(0.9)',
          }}
        >
<span style={{ transform: 'rotate(45deg)', display: 'inline-block', color: chatText.trim() || chatMedia ? BRAND.white : `${color}60` }}>{'>'}</span>  &gt;
        </button>
      </div>
    </div>
  </div>
)}

      </div>
    </div>
  );
}

// ── Group Card ─────────────────────────────────────────────────────────────
function GroupCard({ group: g, user, onEnter }: { group: any; user: User; onEnter: () => void }) {
  const [status, setStatus] = useState<'none' | 'pending' | 'member'>('none');
  const [requests, setRequests] = useState<any[]>([]);
  const isAdminUser = isAdmin(user);
  const color = user.church.primaryColor;

  useEffect(() => {
    (async () => {
      const { data: membership } = await supabase.from('group_members')
        .select('id').eq('group_id', g.id).eq('member_id', user.id).maybeSingle();
      if (membership) { setStatus('member'); return; }
      if (g.leader_id === user.id || g.leader_id_2 === user.id) { setStatus('member'); return; }
      if (isGroupLeader(user)) { setStatus('member'); return; }
      const { data: req } = await supabase.from('group_join_requests')
        .select('id, status').eq('group_id', g.id).eq('member_id', user.id).maybeSingle();
      if (req) setStatus(req.status === 'approved' ? 'member' : 'pending');
      if (isAdminUser) {
        const { data: reqs } = await supabase.from('group_join_requests')
          .select('*, profiles(full_name, avatar_url)')
          .eq('group_id', g.id).eq('status', 'pending');
        if (reqs) setRequests(reqs);
      }
    })();
  }, [g.id, user.id, isAdminUser]);

  async function requestJoin() {
    await supabase.from('group_join_requests').insert({
      group_id: g.id, member_id: user.id, church_id: user.church.id,
    });
    setStatus('pending');
  }

  async function approveRequest(requestId: string, memberId: string) {
    await supabase.from('group_join_requests').update({ status: 'approved' }).eq('id', requestId);
    await supabase.from('group_members').insert({ group_id: g.id, member_id: memberId });
    await supabase.from('groups').update({ member_count: (g.member_count || 0) + 1 }).eq('id', g.id);
    setRequests(requests.filter(r => r.id !== requestId));
  }

  async function denyRequest(requestId: string) {
    await supabase.from('group_join_requests').update({ status: 'denied' }).eq('id', requestId);
    setRequests(requests.filter(r => r.id !== requestId));
  }

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: BRAND.white, border: `1px solid ${color}15`, boxShadow: `0 2px 12px ${color}08` }}
    >
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center rounded-2xl font-bold text-white flex-shrink-0"
            style={{
              width: 44,
              height: 44,
              background: `linear-gradient(135deg, ${color}, ${color}cc)`,
              fontSize: 18,
              fontFamily: "'Cormorant Garamond', serif",
              boxShadow: `0 4px 12px ${color}30`,
            }}
          >
            {g.name.charAt(0)}
          </div>
          <div>
            <p className="font-bold text-gray-800" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>{g.name}</p>
            {g.description && <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{g.description}</p>}
            {requests.length > 0 && (
              <p className="text-xs font-semibold mt-0.5" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>
                {requests.length} pending request{requests.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          {(status === 'member' || isAdminUser || isGroupLeader(user)) ? (
            <LuxBtn color={color} onClick={onEnter} style={{ padding: '8px 16px', fontSize: 13 }}>
              {isAdminUser ? 'Enter' : 'Chat'}
            </LuxBtn>
          ) : status === 'pending' ? (
            <span
              className="px-3 py-1.5 rounded-xl text-xs font-semibold"
              style={{ background: '#fef3c7', color: '#92400e', fontFamily: "'DM Sans', sans-serif" }}
            >
              Pending
            </span>
          ) : (
            <LuxBtn color={color} variant="outline" onClick={requestJoin} style={{ padding: '8px 16px', fontSize: 13 }}>
              Request to Join
            </LuxBtn>
          )}
        </div>
      </div>

      {isAdminUser && requests.length > 0 && (
        <div className="px-4 pb-4" style={{ borderTop: `1px solid ${color}10` }}>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest pt-3 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Join Requests</p>
          {requests.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-2.5 rounded-2xl mb-2" style={{ background: `${color}08` }}>
              <div className="flex items-center gap-2">
                <Avatar url={r.profiles?.avatar_url} name={r.profiles?.full_name || 'Member'} size={26} color={color} />
                <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: "'DM Sans', sans-serif" }}>{r.profiles?.full_name || 'Member'}</p>
              </div>
              <div className="flex gap-2">
                <LuxBtn color={color} onClick={() => approveRequest(r.id, r.member_id)} style={{ padding: '6px 14px', fontSize: 12 }}>Approve</LuxBtn>
                <LuxBtn color="#ef4444" variant="ghost" onClick={() => denyRequest(r.id)} style={{ padding: '6px 14px', fontSize: 12 }}>Deny</LuxBtn>
              </div>
            </div>
          ))}
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
  const [chatMedia, setChatMedia] = useState<{ url: string; type: string } | null>(null);
  const color = user.church.primaryColor;

  useEffect(() => {
    (async () => {
      const { data: g } = await supabase.from('groups')
        .select('*').eq('church_id', user.church.id).order('created_at', { ascending: false });
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
        .order('created_at', { ascending: false }).limit(50);
      if (data) setGMsgs(data.map((m: any) => ({
        id: m.id,
        content: m.content,
        author_id: m.author_id,
        author_name: m.profiles?.full_name || 'Member',
        author_avatar: m.profiles?.avatar_url,
        created_at: m.created_at,
        group_id: m.group_id,
        media_url: m.media_url,
        media_type: m.media_type,
      })));
    })();
    const channel = supabase.channel(`group-${selGroup.id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `group_id=eq.${selGroup.id}`,
      }, (payload: any) => {
        setGMsgs(prev => [
          {
            id: payload.new.id,
            content: payload.new.content,
            author_id: payload.new.author_id,
            author_name: 'Member',
            created_at: payload.new.created_at,
            group_id: payload.new.group_id,
            media_url: payload.new.media_url,
            media_type: payload.new.media_type,
          },
          ...prev,
        ]);
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selGroup]);

  async function sendMsg() {
    if (!chatText.trim() && !chatMedia) return;
    if (!selGroup) return;
    await supabase.from('chat_messages').insert({
      church_id: user.church.id,
      group_id: selGroup.id,
      author_id: user.id,
      content: chatText,
      media_url: chatMedia?.url || null,
      media_type: chatMedia?.type || null,
    });
    setChatText('');
    setChatMedia(null);
  }

  if (selGroup) return (
    <div style={{ backgroundColor: BRAND.bg, minHeight: '100vh', paddingBottom: 80 }}>
      <div
        className="rounded-3xl mx-4 mt-4 overflow-hidden flex flex-col"
        style={{
          background: BRAND.white,
          border: `1px solid ${color}15`,
          boxShadow: `0 2px 16px ${color}08`,
          height: '72vh',
        }}
      >
        <div
          className="p-4 flex items-center gap-3"
          style={{ borderBottom: `1px solid ${color}10` }}
        >
          <button
            onClick={() => setSelGroup(null)}
            className="flex items-center justify-center rounded-full"
            style={{ width: 36, height: 36, background: `${color}12`, color, border: 'none', cursor: 'pointer', fontSize: 20 }}
          >
            ‹
          </button>
          <div>
            <p className="font-bold text-gray-800" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20 }}>{selGroup.name}</p>
            <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Group Chat</p>
          </div>
        </div>

        {/* Messages newest at bottom using flex-col-reverse */}
<div className="flex-1 overflow-y-auto p-4" id="community-chat-messages" style={{ display: 'flex', flexDirection: 'column' }}>
  <div>
    {[...gMsgs].reverse().map((m, i) => {
              const own = m.author_id === user.id;
              return (
                <div key={i} className={`flex gap-2 mb-3 ${own ? 'flex-row-reverse' : ''}`}>
                  {!own && (
                    <Avatar url={m.author_avatar} name={m.author_name} size={26} color={color} />
                  )}
                  <div className={`max-w-xs flex flex-col ${own ? 'items-end' : 'items-start'}`}>
                    {!own && (
                      <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.author_name}</p>
                    )}
                    {m.content && (
                      <div
                        className="px-4 py-2.5 text-sm"
                        style={{
                          background: own ? `linear-gradient(135deg, ${color}, ${color}dd)` : `${color}0d`,
                          color: own ? BRAND.white : '#1F2937',
                          fontFamily: "'DM Sans', sans-serif",
                          boxShadow: own ? `0 4px 12px ${color}30` : 'none',
                          borderRadius: own ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        }}
                      >
                        {m.content}
                      </div>
                    )}
                    {m.media_url && <MediaDisplay url={m.media_url} type={m.media_type || 'image'} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-3" style={{ borderTop: `1px solid ${color}10` }}>
          {chatMedia && (
            <div className="mb-2">
              <MediaDisplay url={chatMedia.url} type={chatMedia.type} />
              <button onClick={() => setChatMedia(null)} className="text-xs text-red-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
            </div>
          )}
          <div className="flex gap-2 items-center">
            <MediaPicker folder={`group-${selGroup.id}`} onUpload={(url, type) => setChatMedia({ url, type })} />
            <input
              type="text"
              placeholder="Type a message..."
              value={chatText}
              onChange={e => setChatText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') sendMsg(); }}
              className="flex-1 px-4 py-2.5 rounded-2xl text-sm focus:outline-none"
              style={{ border: `1.5px solid ${color}20`, background: `${color}06`, fontFamily: "'DM Sans', sans-serif" }}
            />
            <LuxBtn color={color} onClick={sendMsg} style={{ padding: '10px 18px', fontSize: 13, flexShrink: 0 }}>
              Send
            </LuxBtn>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: BRAND.bg, minHeight: '100vh', paddingBottom: 80 }}>
      <ScreenHeader title="Groups" subtitle="Find your community" color={color} />

      <div className="px-4">
        <div className="flex gap-2 mb-4">
          {['groups', 'leaderboard'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-2xl text-sm font-semibold capitalize"
              style={{
                fontFamily: "'DM Sans', sans-serif",
                background: tab === t ? `linear-gradient(135deg, ${color}, ${color}cc)` : `${color}0d`,
                color: tab === t ? BRAND.white : color,
                border: `1px solid ${color}${tab === t ? '00' : '20'}`,
                boxShadow: tab === t ? `0 4px 14px ${color}30` : 'none',
                transition: 'all 0.2s',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'groups' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {groups.length === 0 ? (
              <EmptyState icon="👥" message="No groups yet. Ask your pastor to create some." />
            ) : groups.map((g, i) => (
              <GroupCard key={i} group={g} user={user} onEnter={() => setSelGroup(g)} />
            ))}
          </div>
        )}

        {tab === 'leaderboard' && (
          <div
            className="rounded-3xl p-5"
            style={{ background: BRAND.white, border: `1px solid ${color}15`, boxShadow: `0 2px 16px ${color}08` }}
          >
            <SectionLabel color={color}>Points Leaderboard</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {board.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: m.id === user.id ? `${color}0d` : 'transparent', border: m.id === user.id ? `1px solid ${color}20` : '1px solid transparent' }}
                >
                  <span className="w-7 text-center font-bold" style={{ fontSize: 18 }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </span>
                  <Avatar url={m.avatar_url} name={m.full_name || 'Member'} size={34} color={color} />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.full_name || 'Member'}</p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.streak || 0} day streak 🔥</p>
                  </div>
                  <p className="font-bold text-sm" style={{ color, fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>
                    {(m.points || 0).toLocaleString()}
                    <span className="text-xs font-normal text-gray-400 ml-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>pts</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// ── More Screen ────────────────────────────────────────────────────────────
function MoreScreen({ user, initialSub, onSubChange }: {
  user: User;
  initialSub?: string;
  onSubChange?: (s: string) => void;
}) {
  const [sub, setSub] = useState(initialSub || 'menu');
  const color = user.church.primaryColor;
  const isAdminUser = isAdmin(user);

  const back = () => { setSub('menu'); onSubChange?.('menu'); };
  const go = (tab: string) => { setSub(tab); onSubChange?.(tab); };

  const items = [
    { icon: '💳', label: 'Give', tab: 'giving', desc: 'Support your church' },
    { icon: '📅', label: 'Events', tab: 'events', desc: 'Upcoming gatherings' },
    { icon: '🏢', label: 'Business Directory', tab: 'biz', desc: 'Support church members' },
    { icon: '👤', label: 'Member Directory', tab: 'members', desc: 'Find your community' },
    { icon: '📣', label: 'Announcements', tab: 'ann', desc: 'Church updates' },
    { icon: '📍', label: 'Check In', tab: 'checkin', desc: 'Earn attendance points' },
    { icon: '👶', label: "Children's Check-In", tab: 'children', desc: 'Safe drop-off and pickup' },
    { icon: '💬', label: 'Message Admin', tab: 'dm', desc: 'Private message to leadership' },
    { icon: '⚙️', label: 'My Profile', tab: 'profile', desc: 'Edit your info and photo' },
    ...(isAdminUser ? [
      { icon: '🔧', label: 'Admin Panel', tab: 'admin', desc: 'Manage your church' },
      { icon: '💰', label: 'Pricing', tab: 'pricing', desc: 'Plans and billing' },
    ] : []),
  ];

  return (
    <div style={{ backgroundColor: BRAND.bg, minHeight: '100vh', paddingBottom: 80 }}>
      {sub === 'menu' && (
        <>
          {/* Profile hero */}
          <div
            className="mx-4 mt-4 rounded-3xl p-5 text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${color} 0%, ${color}cc 60%, #4c1d95 100%)`,
              boxShadow: `0 8px 32px ${color}40`,
            }}
          >
            <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />
            <div className="flex items-center gap-4 relative z-10">
              <Avatar url={user.avatarUrl} name={user.name || user.email} size={52} color="rgba(255,255,255,0.5)" />
              <div>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700 }}>{user.name || user.email}</p>
                <p style={{ fontSize: 12, opacity: 0.75, fontFamily: "'DM Sans', sans-serif", marginTop: 2 }}>{user.church.name}</p>
                <p style={{ fontSize: 11, opacity: 0.6, fontFamily: "'DM Sans', sans-serif", marginTop: 1, textTransform: 'capitalize' }}>
                  {user.role.replace(/_/g, ' ')}
                  {user.secondaryRole ? ` · ${user.secondaryRole.replace(/_/g, ' ')}` : ''}
                  {user.secondaryRole2 ? ` · ${user.secondaryRole2.replace(/_/g, ' ')}` : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          <div className="mx-4 mt-4 rounded-3xl overflow-hidden" style={{ background: BRAND.white, border: `1px solid ${color}12`, boxShadow: `0 2px 16px ${color}08` }}>
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => go(item.tab)}
                className="w-full flex items-center gap-3 p-4 text-left"
                style={{
                  background: 'none',
                  border: 'none',
                  borderBottom: i < items.length - 1 ? `1px solid ${color}08` : 'none',
                  cursor: 'pointer',
                }}
              >
                <div
                  className="flex items-center justify-center rounded-2xl flex-shrink-0"
                  style={{ width: 42, height: 42, background: `${color}10` }}
                >
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800" style={{ fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{item.desc}</p>
                </div>
                <span style={{ color: `${color}50`, fontSize: 20 }}>›</span>
              </button>
            ))}
          </div>
        </>
      )}

      <div className="px-4 pt-4">
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
        {sub === 'dm' && <DirectMessageScreen user={user} onBack={back} />}
      </div>
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
  const isAdminUser = isAdmin(user);
  const color = user.church.primaryColor;

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

  useEffect(() => { loadFunds(); loadTxns(); }, [user.church.id]);

  async function addFund() {
    if (!newName.trim()) return;
    await supabase.from('giving_funds').insert({
      church_id: user.church.id, name: newName,
      description: newDesc, is_active: true, is_default: false,
    });
    setNewName(''); setNewDesc(''); setAddOpen(false); loadFunds();
  }

  const giveLink = user.church.givingStripeLink || 'https://buy.stripe.com/28E8wPevd5si2P09aub3q00';

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${color}20`, background: `${color}06`,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackHeader title="Give" onBack={onBack} color={color} />

      <div className="flex gap-2">
        {['give', 'history', ...(isAdminUser ? ['manage funds'] : [])].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="flex-1 py-2.5 rounded-2xl text-xs font-semibold capitalize"
            style={{
              fontFamily: "'DM Sans', sans-serif",
              background: tab === t ? `linear-gradient(135deg, ${color}, ${color}cc)` : `${color}0d`,
              color: tab === t ? BRAND.white : color,
              border: `1px solid ${color}${tab === t ? '00' : '20'}`,
              boxShadow: tab === t ? `0 4px 14px ${color}30` : 'none',
              transition: 'all 0.2s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'give' && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15`, boxShadow: `0 2px 16px ${color}08` }}>
          <SectionLabel color={color}>Select Fund</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
            {funds.map(f => (
              <button
                key={f.id}
                onClick={() => setSel(f.id)}
                className="w-full p-4 rounded-2xl text-left"
                style={{
                  border: `2px solid ${sel === f.id ? color : color + '20'}`,
                  background: sel === f.id ? `${color}0d` : BRAND.white,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f.name}</p>
                {f.description && <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f.description}</p>}
              </button>
            ))}
          </div>

          <SectionLabel color={color}>Choose Amount</SectionLabel>
          <div className="flex gap-2 flex-wrap mb-3">
            {[25, 50, 100, 250, 500].map(a => (
              <button
                key={a}
                onClick={() => setAmount(String(a))}
                className="px-4 py-2.5 rounded-2xl text-sm font-semibold"
                style={{
                  border: `2px solid ${amount === String(a) ? color : color + '20'}`,
                  background: amount === String(a) ? `${color}0d` : BRAND.white,
                  color: amount === String(a) ? color : '#374151',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                  transition: 'all 0.2s',
                }}
              >
                ${a}
              </button>
            ))}
          </div>
          <div className="relative mb-5">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold" style={{ fontFamily: "'DM Sans', sans-serif" }}>$</span>
            <input
              type="number"
              placeholder="Custom amount"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 28 }}
            />
          </div>

          <LuxBtn
            color={color}
            onClick={() => {
              if (!amount || !sel) { alert('Select a fund and enter an amount'); return; }
              window.open(giveLink, '_blank');
            }}
            style={{ width: '100%', fontSize: 16, padding: '15px 0' }}
          >
            Give {amount ? `$${amount}` : 'Now'}
          </LuxBtn>
          <p className="text-center text-xs text-gray-400 mt-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Secure payment via Stripe
          </p>
        </div>
      )}

      {tab === 'history' && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15`, boxShadow: `0 2px 16px ${color}08` }}>
          <SectionLabel color={color}>Giving History</SectionLabel>
          {txns.length === 0 ? (
            <EmptyState icon="💳" message="No giving history yet." />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {txns.map((t, i) => (
                <div key={i} className="flex justify-between items-center py-3" style={{ borderBottom: `1px solid ${color}08` }}>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{t.giving_funds?.name}</p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{new Date(t.created_at).toLocaleDateString()}</p>
                  </div>
                  <p className="font-bold" style={{ color, fontFamily: "'Cormorant Garamond', serif", fontSize: 20 }}>${t.amount}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'manage funds' && isAdminUser && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          <div className="flex justify-between items-center mb-4">
            <SectionLabel color={color}>Giving Funds</SectionLabel>
            <LuxBtn color={color} variant="ghost" onClick={() => setAddOpen(!addOpen)} style={{ fontSize: 12, padding: '7px 14px' }}>+ Add Fund</LuxBtn>
          </div>
          {addOpen && (
            <div className="p-4 rounded-2xl mb-4" style={{ border: `1px solid ${color}20`, background: `${color}06` }}>
              <input type="text" placeholder="Fund name" value={newName} onChange={e => setNewName(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
              <input type="text" placeholder="Description (optional)" value={newDesc} onChange={e => setNewDesc(e.target.value)} style={{ ...inputStyle, marginBottom: 12 }} />
              <div className="flex gap-2">
                <LuxBtn color={color} variant="outline" onClick={() => setAddOpen(false)} style={{ flex: 1, fontSize: 13 }}>Cancel</LuxBtn>
                <LuxBtn color={color} onClick={addFund} style={{ flex: 1, fontSize: 13 }}>Save</LuxBtn>
              </div>
            </div>
          )}
          {funds.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-2xl mb-2" style={{ border: `1px solid ${color}12` }}>
              <div>
                <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f.name}</p>
                {f.is_default && <span className="text-xs text-green-500 font-semibold">Default</span>}
              </div>
              <button
                onClick={async () => { await supabase.from('giving_funds').update({ is_active: !f.is_active }).eq('id', f.id); loadFunds(); }}
                className="text-xs px-3 py-1.5 rounded-xl font-semibold"
                style={{ background: f.is_active ? '#f0fdf4' : '#fef2f2', color: f.is_active ? '#166534' : '#991b1b', fontFamily: "'DM Sans', sans-serif" }}
              >
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
  const [mediaAttach, setMediaAttach] = useState<{ url: string; type: string } | null>(null);
  const isAdminUser = isAdmin(user);
  const color = user.church.primaryColor;

  async function load() {
    const { data } = await supabase.from('events').select('*')
      .eq('church_id', user.church.id).order('event_date', { ascending: true });
    if (data) setEvents(data);
  }
  useEffect(() => { load(); }, [user.church.id]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${color}20`, background: `${color}06`,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="flex items-center justify-between">
        <BackHeader title="Events" onBack={onBack} color={color} />
        {isAdminUser && (
          <LuxBtn color={color} variant="ghost" onClick={() => setAddOpen(!addOpen)} style={{ fontSize: 12, padding: '7px 14px', marginRight: 4 }}>+ Add</LuxBtn>
        )}
      </div>

      {addOpen && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          <input type="text" placeholder="Event title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
          <input type="text" placeholder="Location" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
          <input type="datetime-local" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
          <textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: 'vertical', marginBottom: 10 }} />
          {mediaAttach && (
            <div className="mb-3">
              <MediaDisplay url={mediaAttach.url} type={mediaAttach.type} />
              <button onClick={() => setMediaAttach(null)} className="text-xs text-red-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
            </div>
          )}
          <MediaPicker folder="events" onUpload={(url, type) => setMediaAttach({ url, type })} />
          <div className="flex gap-2 mt-3">
            <LuxBtn color={color} variant="outline" onClick={() => setAddOpen(false)} style={{ flex: 1, fontSize: 13 }}>Cancel</LuxBtn>
            <LuxBtn color={color} onClick={async () => {
              if (!form.title || !form.event_date) return;
              await supabase.from('events').insert({
                ...form, church_id: user.church.id, created_by: user.id,
                media_url: mediaAttach?.url || null, media_type: mediaAttach?.type || null,
              });
              setAddOpen(false); setForm({ title: '', description: '', location: '', event_date: '' }); setMediaAttach(null); load();
            }} style={{ flex: 1, fontSize: 13 }}>Save</LuxBtn>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {events.length === 0 ? (
          <EmptyState icon="📅" message="No events yet." />
        ) : events.map((ev, i) => {
          const d = new Date(ev.event_date);
          return (
            <div key={i} className="rounded-3xl p-4 flex gap-4" style={{ background: BRAND.white, border: `1px solid ${color}12`, boxShadow: `0 2px 10px ${color}06` }}>
              <div
                className="flex flex-col items-center justify-center rounded-2xl flex-shrink-0"
                style={{ width: 52, height: 58, background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 4px 14px ${color}30` }}
              >
                <span style={{ fontSize: 20, fontWeight: 800, color: BRAND.white, fontFamily: "'Cormorant Garamond', serif", lineHeight: 1 }}>{d.getDate()}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: "'DM Sans', sans-serif" }}>{d.toLocaleString('default', { month: 'short' })}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19 }}>{ev.title}</p>
                <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{ev.location} · {d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                {ev.description && <p className="text-xs text-gray-500 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{ev.description}</p>}
                {ev.media_url && <MediaDisplay url={ev.media_url} type={ev.media_type || 'image'} />}
                <LuxBtn color={color} onClick={async () => { await supabase.from('event_rsvps').insert({ event_id: ev.id, member_id: user.id }); alert('RSVP confirmed!'); }} style={{ marginTop: 10, fontSize: 12, padding: '7px 16px' }}>
                  RSVP
                </LuxBtn>
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
  const color = user.church.primaryColor;
  const cats = ['Food & Restaurant', 'Health & Wellness', 'Home Services', 'Professional Services', 'Beauty & Personal Care', 'Technology', 'Education', 'Other'];

  async function load() {
    const { data } = await supabase.from('business_listings').select('*')
      .eq('church_id', user.church.id).eq('approved', true).order('created_at', { ascending: false });
    if (data) setListings(data);
  }
  useEffect(() => { load(); }, [user.church.id]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${color}20`, background: `${color}06`,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="flex items-center justify-between">
        <BackHeader title="Business Directory" onBack={onBack} color={color} />
        <LuxBtn color={color} variant="ghost" onClick={() => setAddOpen(!addOpen)} style={{ fontSize: 12, padding: '7px 14px', marginRight: 4 }}>+ List</LuxBtn>
      </div>

      {addOpen && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          <input type="text" placeholder="Business name" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, marginBottom: 10, cursor: 'pointer' }}>
            <option value="">Select category</option>
            {cats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: 'vertical', marginBottom: 10 }} />
          <input type="text" placeholder="Phone (optional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
          <input type="text" placeholder="Website (optional)" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} style={{ ...inputStyle, marginBottom: 12 }} />
          <div className="flex gap-2">
            <LuxBtn color={color} variant="outline" onClick={() => setAddOpen(false)} style={{ flex: 1, fontSize: 13 }}>Cancel</LuxBtn>
            <LuxBtn color={color} onClick={async () => {
              if (!form.business_name) return;
              await supabase.from('business_listings').insert({ ...form, church_id: user.church.id, member_id: user.id, approved: false });
              alert('Submitted for review!');
              setAddOpen(false); setForm({ business_name: '', category: '', description: '', phone: '', website: '' });
            }} style={{ flex: 1, fontSize: 13 }}>Submit</LuxBtn>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {listings.length === 0 ? (
          <EmptyState icon="🏢" message="No listings yet. Be the first to add your business." />
        ) : listings.map((l, i) => (
          <div key={i} className="rounded-3xl p-4" style={{ background: BRAND.white, border: `1px solid ${color}12`, boxShadow: `0 2px 10px ${color}06` }}>
            <p className="font-bold text-gray-800" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19 }}>{l.business_name}</p>
            <span className="text-xs px-2.5 py-1 rounded-full text-white font-semibold inline-block mt-1" style={{ background: BRAND.sage, fontFamily: "'DM Sans', sans-serif" }}>{l.category}</span>
            {l.description && <p className="text-gray-500 text-sm mt-2 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{l.description}</p>}
            <div className="flex gap-4 mt-3 pt-2" style={{ borderTop: `1px solid ${color}10` }}>
              {l.phone && <a href={`tel:${l.phone}`} className="text-xs font-semibold" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>📞 Call</a>}
              {l.website && <a href={l.website} target="_blank" rel="noreferrer" className="text-xs font-semibold" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>🌐 Website</a>}
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
  const color = user.church.primaryColor;

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackHeader title="Member Directory" onBack={onBack} color={color} />
      <input
        type="text"
        placeholder="Search members..."
        value={q}
        onChange={e => setQ(e.target.value)}
        className="w-full px-4 py-3 rounded-2xl text-sm focus:outline-none"
        style={{ border: `1.5px solid ${color}20`, background: BRAND.white, fontFamily: "'DM Sans', sans-serif" }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.length === 0 ? (
          <EmptyState icon="👤" message="No members in directory yet." />
        ) : filtered.map((m, i) => (
          <div key={i} className="rounded-2xl p-3 flex items-center gap-3" style={{ background: BRAND.white, border: `1px solid ${color}12`, boxShadow: `0 2px 8px ${color}06` }}>
            <Avatar url={m.avatar_url} name={m.full_name || 'Member'} size={42} color={color} />
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.full_name}</p>
              <p className="text-xs text-gray-400 capitalize mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{(m.role || '').replace(/_/g, ' ')}</p>
              {m.bio && <p className="text-xs text-gray-300 mt-0.5 line-clamp-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.bio}</p>}
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs font-bold" style={{ color, fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}>{m.points || 0}</p>
              <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>pts</p>
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
  const [filter, setFilter] = useState('All');
  const [form, setForm] = useState({ title: '', body: '', category: 'General' });
  const [mediaAttach, setMediaAttach] = useState<{ url: string; type: string } | null>(null);
  const isAdminUser = isAdmin(user);
  const color = user.church.primaryColor;
  const categories = ['All', 'General', 'Event', 'Volunteer', 'Prayer', 'Lost and Found'];

  async function load() {
    const { data } = await supabase.from('announcements')
      .select('*, profiles(full_name)')
      .eq('church_id', user.church.id).eq('approved', true)
      .order('pinned', { ascending: false }).order('created_at', { ascending: false });
    if (data) setAnns(data);
    if (isAdminUser) {
      const { data: p } = await supabase.from('announcements')
        .select('*, profiles(full_name)')
        .eq('church_id', user.church.id).eq('approved', false)
        .order('created_at', { ascending: false });
      if (p) setPending(p);
    }
  }
  useEffect(() => { load(); }, [user.church.id]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${color}20`, background: `${color}06`,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="flex items-center justify-between">
        <BackHeader title="Announcements" onBack={onBack} color={color} />
        <LuxBtn color={color} variant="ghost" onClick={() => setAddOpen(!addOpen)} style={{ fontSize: 12, padding: '7px 14px', marginRight: 4 }}>+ Post</LuxBtn>
      </div>

      {addOpen && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={{ ...inputStyle, marginBottom: 10 }} />
          <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} style={{ ...inputStyle, marginBottom: 10, cursor: 'pointer' }}>
            {['General', 'Event', 'Volunteer', 'Prayer', 'Lost and Found'].map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea placeholder="Details (optional)" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} style={{ ...inputStyle, minHeight: 80, resize: 'vertical', marginBottom: 10 }} />
          {mediaAttach && (
            <div className="mb-3">
              <MediaDisplay url={mediaAttach.url} type={mediaAttach.type} />
              <button onClick={() => setMediaAttach(null)} className="text-xs text-red-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
            </div>
          )}
          <MediaPicker folder="announcements" onUpload={(url, type) => setMediaAttach({ url, type })} />
          <div className="flex gap-2 mt-3">
            <LuxBtn color={color} variant="outline" onClick={() => setAddOpen(false)} style={{ flex: 1, fontSize: 13 }}>Cancel</LuxBtn>
            <LuxBtn color={color} onClick={async () => {
              if (!form.title) return;
              await supabase.from('announcements').insert({
                ...form, church_id: user.church.id, author_id: user.id,
                approved: isAdminUser, pinned: false,
                media_url: mediaAttach?.url || null, media_type: mediaAttach?.type || null,
              });
              alert(isAdminUser ? 'Posted!' : 'Submitted for review!');
              setAddOpen(false); setForm({ title: '', body: '', category: 'General' }); setMediaAttach(null); load();
            }} style={{ flex: 1, fontSize: 13 }}>Submit</LuxBtn>
          </div>
        </div>
      )}

      {isAdminUser && pending.length > 0 && (
        <div className="rounded-3xl p-4" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
          <p className="font-bold text-amber-600 mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>Pending Review ({pending.length})</p>
          {pending.map((a, i) => (
            <div key={i} className="p-3 rounded-2xl bg-white border border-amber-100 mb-2">
              <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{a.title}</p>
              <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>by {a.profiles?.full_name}</p>
              <div className="flex gap-2">
                <LuxBtn color={color} onClick={async () => { await supabase.from('announcements').update({ approved: true }).eq('id', a.id); load(); }} style={{ fontSize: 12, padding: '6px 14px' }}>Approve</LuxBtn>
                <LuxBtn color="#ef4444" variant="ghost" onClick={async () => { await supabase.from('announcements').delete().eq('id', a.id); load(); }} style={{ fontSize: 12, padding: '6px 14px' }}>Decline</LuxBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{
              background: filter === c ? `linear-gradient(135deg, ${color}, ${color}cc)` : `${color}0d`,
              color: filter === c ? BRAND.white : color,
              border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            {c}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {anns.filter(a => filter === 'All' || a.category === filter).map((a, i) => (
          <div
            key={i}
            className="rounded-3xl p-4"
            style={{
              background: BRAND.white,
              border: `1px solid ${color}12`,
              borderLeft: a.pinned ? `4px solid ${color}` : `1px solid ${color}12`,
              boxShadow: `0 2px 10px ${color}06`,
            }}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs px-2.5 py-1 rounded-full text-white font-semibold" style={{ background: BRAND.sage, fontFamily: "'DM Sans', sans-serif" }}>{a.category}</span>
              {isAdminUser && (
                <button
                  onClick={async () => { await supabase.from('announcements').update({ pinned: !a.pinned }).eq('id', a.id); load(); }}
                  className="text-xs text-gray-400"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {a.pinned ? 'Unpin' : 'Pin'}
                </button>
              )}
            </div>
            <p className="font-bold text-gray-800 mt-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>
              {a.pinned ? '📌 ' : ''}{a.title}
            </p>
            {a.body && <p className="text-gray-500 text-sm mt-1 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{a.body}</p>}
            {a.media_url && <MediaDisplay url={a.media_url} type={a.media_type || 'image'} />}
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
  const color = user.church.primaryColor;

  async function checkIn() {
    const now = new Date();
    const { data: ch } = await supabase.from('churches').select('checkin_start, checkin_end, checkin_days').eq('id', user.church.id).maybeSingle();
    if (ch?.checkin_start && ch?.checkin_end) {
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = ch.checkin_start.split(':').map(Number);
      const [endH, endM] = ch.checkin_end.split(':').map(Number);
      if (currentTime < startH * 60 + startM || currentTime > endH * 60 + endM) {
        alert(`Check in is only available between ${ch.checkin_start} and ${ch.checkin_end}.`);
        return;
      }
      if (ch.checkin_days) {
        const today = now.toLocaleDateString('en-US', { weekday: 'long' });
        if (!ch.checkin_days.split(',').map((d: string) => d.trim()).includes(today)) {
          alert(`Check in is only available on ${ch.checkin_days}.`);
          return;
        }
      }
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const { data: existing } = await supabase.from('attendance').select('id').eq('church_id', user.church.id).eq('member_id', user.id).gte('checked_in_at', today.toISOString()).maybeSingle();
    if (existing) { alert('You have already checked in today!'); setDone(true); return; }
    await supabase.from('attendance').insert({ church_id: user.church.id, member_id: user.id, check_in_type: type });
    await supabase.from('profiles').update({ points: user.points + 25, streak: user.streak + 1 }).eq('id', user.id);
    setDone(true);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackHeader title="Check In" onBack={onBack} color={color} />
      <div className="rounded-3xl p-6 text-center" style={{ background: BRAND.white, border: `1px solid ${color}15`, boxShadow: `0 2px 16px ${color}08` }}>
        <div className="flex justify-center mb-4">
          <FloremusLogo size={56} variant="noTagline" />
        </div>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#111', marginBottom: 6 }}>{user.church.name}</h3>
        <p className="text-gray-400 text-sm mb-5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Check in to earn points and keep your streak going</p>

        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-2xl" style={{ border: `1px solid ${color}15` }}>
            <QRCodeSVG value={`${window.location.origin}`} size={140} fgColor={color} />
          </div>
        </div>
        <p className="text-xs text-gray-400 mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Scan to open Floremus on your device</p>

        <div className="flex gap-2 mb-4 justify-center">
          <LuxBtn color={color} variant="ghost" onClick={() => {
            const svg = document.querySelector('svg');
            if (!svg) return;
            const data = new XMLSerializer().serializeToString(svg);
            const blob = new Blob([data], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a'); a.href = url; a.download = 'floremus-checkin-qr.svg'; a.click();
          }} style={{ fontSize: 13 }}>Download QR</LuxBtn>
          <LuxBtn color={color} variant="outline" onClick={() => {
            const win = window.open('', '_blank');
            const svg = document.querySelector('svg');
            if (!win || !svg) return;
            win.document.write(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;"><h2>${user.church.name}</h2><p style="color:#666;margin-bottom:24px;">Scan to check in with Floremus</p>${svg.outerHTML}<p style="margin-top:24px;color:#999;font-size:12px;">floremus.church</p></body></html>`);
            win.document.close(); win.print();
          }} style={{ fontSize: 13 }}>Print QR</LuxBtn>
        </div>

        {done ? (
          <div className="py-4">
            <p style={{ fontSize: 48, marginBottom: 8 }}>✅</p>
            <p className="font-bold text-green-500 text-xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>Checked In!</p>
            <p className="text-gray-400 text-sm mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>+25 points earned</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-5">
              {(['in-person', 'livestream'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className="flex-1 py-3 rounded-2xl font-semibold text-sm"
                  style={{
                    background: type === t ? `linear-gradient(135deg, ${color}, ${color}cc)` : `${color}0d`,
                    color: type === t ? BRAND.white : color,
                    border: 'none', cursor: 'pointer',
                    fontFamily: "'DM Sans', sans-serif",
                    boxShadow: type === t ? `0 4px 12px ${color}30` : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  {t === 'in-person' ? '🏛️ In Person' : '📺 Livestream'}
                </button>
              ))}
            </div>
            <LuxBtn color={color} onClick={checkIn} style={{ width: '100%', fontSize: 15, padding: '15px 0' }}>
              Check In Now (+25 pts)
            </LuxBtn>
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
  const isWorker = isChildrenWorker(user);
  const isAdminUser = isAdmin(user);
  const canManage = isWorker || isAdminUser;
  const color = user.church.primaryColor;
  const rooms = ['Nursery (0-2)', 'Toddlers (2-3)', 'Pre-K (4-5)', 'K-2nd Grade', '3rd-5th Grade'];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${color}20`, background: `${color}06`,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

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
    const { data } = await supabase.from('children_checkin').select('*').eq('pickup_code', lookup.toUpperCase()).is('checked_out_at', null).maybeSingle();
    setFound(data || null);
    if (!data) alert('No active check-in found for this code');
  }

  async function checkout(id: string, name: string) {
    await supabase.from('children_checkin').update({ checked_out_at: new Date().toISOString(), checked_out_by: user.name || user.email }).eq('id', id);
    alert(`${name} has been checked out.`);
    setFound(null); setLookup('');
  }

  async function loadLog() {
    const { data } = await supabase.from('children_checkin').select('*').eq('church_id', user.church.id).order('checked_in_at', { ascending: false }).limit(20);
    if (data) setLog(data);
  }

  const tabList = ['checkin', 'pickup', ...(canManage ? ['audit log'] : [])];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackHeader title="Children's Check-In" onBack={onBack} color={color} />

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {tabList.map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'audit log') loadLog(); }}
            className="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold capitalize"
            style={{
              background: tab === t ? `linear-gradient(135deg, ${color}, ${color}cc)` : `${color}0d`,
              color: tab === t ? BRAND.white : color,
              border: 'none', cursor: 'pointer',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.2s',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'checkin' && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          {result ? (
            <div className="text-center py-4">
              <p style={{ fontSize: 52, marginBottom: 12 }}>✅</p>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: '#111' }}>{result.child_name}</h3>
              <p className="text-gray-400 text-sm mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Room: {result.room}</p>
              <div className="mt-5 p-5 rounded-2xl" style={{ background: `${color}0d`, border: `1px solid ${color}20` }}>
                <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pickup Code</p>
                <p className="font-bold tracking-widest" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, color, letterSpacing: 8 }}>{code}</p>
                <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Valid for today's service only</p>
              </div>
              <LuxBtn color={color} onClick={() => { setResult(null); setCode(''); setForm({ child_name: '', room: '', allergy_info: '', medical_info: '', authorized_pickups: '', custody_flag: false }); }} style={{ width: '100%', marginTop: 16 }}>
                Check In Another
              </LuxBtn>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { label: "Child's Name", key: 'child_name', ph: 'First and last name' },
                { label: 'Allergy Information', key: 'allergy_info', ph: 'List allergies or none' },
                { label: 'Medical Information', key: 'medical_info', ph: 'Any conditions or special needs' },
                { label: 'Authorized Pickups', key: 'authorized_pickups', ph: 'Names separated by commas' },
              ].map((f, i) => (
                <div key={i}>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f.label}</label>
                  <input type="text" placeholder={f.ph} value={(form as any)[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} style={inputStyle} />
                </div>
              ))}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Room</label>
                <select value={form.room} onChange={e => setForm({ ...form, room: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="">Select room</option>
                  {rooms.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                <input type="checkbox" checked={form.custody_flag} onChange={e => setForm({ ...form, custody_flag: e.target.checked })} className="rounded" />
                <div>
                  <p className="font-semibold text-red-700 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>Custody Alert</p>
                  <p className="text-xs text-red-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Flag for custody restrictions</p>
                </div>
              </label>
              <LuxBtn color={color} onClick={checkInChild} style={{ width: '100%', fontSize: 15 }}>
                Check In and Generate Code
              </LuxBtn>
            </div>
          )}
        </div>
      )}

      {tab === 'pickup' && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          <p className="text-gray-400 text-sm mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Enter the pickup code to verify and release a child.</p>
          <div className="flex gap-2 mb-4">
            <input
              type="text" placeholder="PICKUP CODE" value={lookup}
              onChange={e => setLookup(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-3 text-center font-bold tracking-widest text-lg uppercase focus:outline-none rounded-2xl"
              style={{ border: `1.5px solid ${color}25`, background: `${color}06`, fontFamily: "'Cormorant Garamond', serif" }}
            />
            <LuxBtn color={color} onClick={verifyCode} style={{ padding: '12px 20px' }}>Verify</LuxBtn>
          </div>
          {found && (
            <div className="p-5 rounded-2xl" style={{ border: `2px solid ${found.custody_flag ? '#ef4444' : '#4ade80'}` }}>
              {found.custody_flag && (
                <div className="mb-3 p-3 rounded-xl" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                  <p className="font-bold text-red-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>⚠️ CUSTODY ALERT</p>
                  <p className="text-sm text-red-500 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Contact pastor or admin before releasing this child.</p>
                </div>
              )}
              {found.allergy_info && found.allergy_info !== 'none' && (
                <div className="mb-3 p-3 rounded-xl" style={{ background: '#fff7ed', border: '1px solid #fed7aa' }}>
                  <p className="font-bold text-orange-700" style={{ fontFamily: "'DM Sans', sans-serif" }}>🚨 ALLERGY: {found.allergy_info}</p>
                </div>
              )}
              <p className="font-bold text-gray-800 text-xl" style={{ fontFamily: "'Cormorant Garamond', serif" }}>{found.child_name}</p>
              <p className="text-gray-400 text-sm mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Room: {found.room}</p>
              <p className="text-gray-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>In: {new Date(found.checked_in_at).toLocaleTimeString()}</p>
              {found.authorized_pickups?.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif" }}>Authorized Pickups</p>
                  <p className="text-sm text-gray-700 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{found.authorized_pickups.join(', ')}</p>
                </div>
              )}
              <LuxBtn
                color={found.custody_flag ? '#ef4444' : color}
                onClick={() => checkout(found.id, found.child_name)}
                style={{ width: '100%', marginTop: 16 }}
              >
                {found.custody_flag ? 'Contact Admin Before Releasing' : 'Confirm Pickup'}
              </LuxBtn>
            </div>
          )}
        </div>
      )}

      {tab === 'audit log' && canManage && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          <SectionLabel color={color}>Audit Log</SectionLabel>
          {log.map((e, i) => (
            <div key={i} className="p-3 rounded-2xl mb-2" style={{ border: `1px solid ${color}12` }}>
              <div className="flex justify-between">
                <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{e.child_name}</p>
                {e.custody_flag && <span className="text-red-500 text-xs font-bold" style={{ fontFamily: "'DM Sans', sans-serif" }}>CUSTODY</span>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Room: {e.room}</p>
              <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>In: {new Date(e.checked_in_at).toLocaleString()}</p>
              {e.checked_out_at && <p className="text-xs text-green-500 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Out: {new Date(e.checked_out_at).toLocaleString()} by {e.checked_out_by}</p>}
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
  const [birthday, setBirthday] = useState(user.birthday || '');
  const [optIn, setOptIn] = useState(user.directoryOptIn || false);
  const [avatar, setAvatar] = useState(user.avatarUrl || '');
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const color = user.church.primaryColor;

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
    await supabase.from('profiles').update({ full_name: name, bio, phone, directory_opt_in: optIn, birthday: birthday || null }).eq('id', user.id);
    setToast('Profile saved!');
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${color}20`, background: `${color}06`,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {toast && <Toast message={toast} color={color} onClose={() => setToast('')} />}
      <BackHeader title="My Profile" onBack={onBack} color={color} />

      <div className="rounded-3xl p-6" style={{ background: BRAND.white, border: `1px solid ${color}15`, boxShadow: `0 2px 16px ${color}08` }}>
        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            <Avatar url={avatar} name={name || user.email} size={70} color={color} />
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-0 right-0 flex items-center justify-center rounded-full text-white"
              style={{ width: 28, height: 28, background: `linear-gradient(135deg, ${color}, ${color}cc)`, border: `2px solid white`, fontSize: 12 }}
            >
              {uploading ? '⏳' : '📷'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
          <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Tap to upload photo</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Phone</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Birthday</label>
            <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Bio</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell your church community about yourself..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
          </div>
          <label className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer" style={{ border: `1px solid ${color}20`, background: `${color}06` }}>
            <input type="checkbox" checked={optIn} onChange={e => setOptIn(e.target.checked)} className="rounded" />
            <div>
              <p className="font-semibold text-gray-700 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>Appear in Member Directory</p>
              <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Let other members find you</p>
            </div>
          </label>
          <LuxBtn color={color} onClick={save} style={{ width: '100%' }}>Save Profile</LuxBtn>
        </div>

        <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${color}10` }}>
          <div className="flex gap-3">
            <StatPill icon="⭐" value={user.points.toLocaleString()} label="Points" color={color} />
            <StatPill icon="🔥" value={`${user.streak}d`} label="Streak" color={color} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Invite Generator ───────────────────────────────────────────────────────
function InviteGenerator({ user }: { user: User }) {
  const [inviteLink, setInviteLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const color = user.church.primaryColor;

  async function generateInvite() {
    setGenerating(true);
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    await supabase.from('invites').insert({ church_id: user.church.id, code, created_by: user.id, active: true });
    setInviteLink(`${window.location.origin}/join/${code}`);
    setGenerating(false);
  }

  return (
    <div className="rounded-3xl p-4" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
      <SectionLabel color={color}>Invite Members</SectionLabel>
      <p className="text-gray-400 text-xs mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>Generate a unique link to share with your congregation.</p>
      {inviteLink ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="p-3 rounded-2xl" style={{ background: `${color}08`, border: `1px solid ${color}15` }}>
            <p className="text-xs text-gray-500 break-all" style={{ fontFamily: "'DM Sans', sans-serif" }}>{inviteLink}</p>
          </div>
          <div className="flex gap-2">
            <LuxBtn color={color} onClick={async () => { await navigator.clipboard.writeText(inviteLink); alert('Copied!'); }} style={{ flex: 1, fontSize: 13 }}>Copy Link</LuxBtn>
            <LuxBtn color={color} variant="outline" onClick={() => setInviteLink('')} style={{ flex: 1, fontSize: 13 }}>Generate New</LuxBtn>
          </div>
        </div>
      ) : (
        <LuxBtn color={color} onClick={generateInvite} disabled={generating} style={{ width: '100%' }}>
          {generating ? 'Generating...' : 'Generate Invite Link'}
        </LuxBtn>
      )}
    </div>
  );
}

// ── Notification Sender ────────────────────────────────────────────────────
function NotificationSender({ user }: { user: User }) {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const color = user.church.primaryColor;

  async function sendNotification() {
    if (!title || !message) { alert('Please enter a title and message'); return; }
    setSending(true);
    try {
      const response = await fetch('https://cjnzizyxjoqmmnksfitd.supabase.co/functions/v1/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: 'ff657d60-a65d-4ec7-aa26-ccdd92ec81bb', title, message }),
      });
      const data = await response.json();
      if (data.id) { setSent(true); setTitle(''); setMessage(''); setTimeout(() => setSent(false), 3000); }
      else { alert('Failed to send. Please try again.'); }
    } catch { alert('Failed to send notification.'); }
    setSending(false);
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${color}20`, background: `${color}06`,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
      <SectionLabel color={color}>Send Push Notification</SectionLabel>
      <p className="text-gray-400 text-xs mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>Send a push notification to all subscribed members instantly.</p>
      {sent ? (
        <div className="text-center py-6">
          <p style={{ fontSize: 44, marginBottom: 8 }}>✅</p>
          <p className="font-bold text-green-500" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}>Notification sent!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Title</label>
            <input type="text" placeholder="e.g. Service starts in 30 minutes" value={title} onChange={e => setTitle(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Message</label>
            <textarea placeholder="Type your message here..." value={message} onChange={e => setMessage(e.target.value)} style={{ ...inputStyle, minHeight: 96, resize: 'vertical' }} />
          </div>
          <LuxBtn color={color} onClick={sendNotification} disabled={sending} style={{ width: '100%' }}>
            {sending ? 'Sending...' : 'Send to All Members'}
          </LuxBtn>
        </div>
      )}
    </div>
  );
}

// ── Group Manager ──────────────────────────────────────────────────────────
function GroupManager({ user }: { user: User }) {
  const [groups, setGroups] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const [leaderId2, setLeaderId2] = useState('');
  const color = user.church.primaryColor;

  async function load() {
    const { data: g } = await supabase.from('groups')
      .select('*, profiles!groups_leader_id_fkey(full_name), leader2:profiles!groups_leader_id_2_fkey(full_name)')
      .eq('church_id', user.church.id).order('created_at', { ascending: false });
    if (g) setGroups(g);
    const { data: m } = await supabase.from('profiles').select('id, full_name').eq('church_id', user.church.id).order('full_name', { ascending: true });
    if (m) setMembers(m);
    const { data: r } = await supabase.from('group_join_requests')
      .select('*, profiles(full_name, avatar_url), groups(name)')
      .eq('church_id', user.church.id).eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (r) setRequests(r);
  }

  useEffect(() => { load(); }, [user.church.id]);

  async function createGroup() {
    if (!name.trim()) return;
    await supabase.from('groups').insert({ church_id: user.church.id, name, description, leader_id: leaderId || null, leader_id_2: leaderId2 || null, member_count: 0 });
    setName(''); setDescription(''); setLeaderId(''); setLeaderId2(''); setAddOpen(false); load();
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${color}20`, background: `${color}06`,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
      <div className="flex justify-between items-center mb-4">
        <SectionLabel color={color}>Small Groups</SectionLabel>
        <LuxBtn color={color} variant="ghost" onClick={() => setAddOpen(!addOpen)} style={{ fontSize: 12, padding: '7px 14px' }}>+ Add Group</LuxBtn>
      </div>

      {addOpen && (
        <div className="p-4 rounded-2xl mb-4" style={{ border: `1px solid ${color}20`, background: `${color}06` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="text" placeholder="Group name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            <textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} />
            <select value={leaderId} onChange={e => setLeaderId(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select Leader 1</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            <select value={leaderId2} onChange={e => setLeaderId2(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select Leader 2 (optional)</option>
              {members.map(m => <option key={m.id} value={m.id}>{m.full_name}</option>)}
            </select>
            <div className="flex gap-2">
              <LuxBtn color={color} variant="outline" onClick={() => setAddOpen(false)} style={{ flex: 1, fontSize: 13 }}>Cancel</LuxBtn>
              <LuxBtn color={color} onClick={createGroup} style={{ flex: 1, fontSize: 13 }}>Create Group</LuxBtn>
            </div>
          </div>
        </div>
      )}

      {requests.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Pending Join Requests ({requests.length})</p>
          {requests.map((r, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-2xl mb-2" style={{ background: `${color}08` }}>
              <div className="flex items-center gap-2">
                <Avatar url={r.profiles?.avatar_url} name={r.profiles?.full_name || 'Member'} size={30} color={color} />
                <div>
                  <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{r.profiles?.full_name || 'Member'}</p>
                  <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Wants to join {r.groups?.name}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <LuxBtn color={color} onClick={async () => { await supabase.from('group_join_requests').update({ status: 'approved' }).eq('id', r.id); await supabase.from('group_members').insert({ group_id: r.group_id, member_id: r.member_id }); load(); }} style={{ padding: '6px 12px', fontSize: 12 }}>Approve</LuxBtn>
                <LuxBtn color="#ef4444" variant="ghost" onClick={async () => { await supabase.from('group_join_requests').update({ status: 'denied' }).eq('id', r.id); load(); }} style={{ padding: '6px 12px', fontSize: 12 }}>Deny</LuxBtn>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {groups.length === 0 ? (
          <EmptyState icon="👥" message="No groups yet. Create your first one." />
        ) : groups.map((g, i) => (
          <div key={i} className="flex items-center justify-between p-3 rounded-2xl" style={{ border: `1px solid ${color}12` }}>
            <div>
              <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{g.name}</p>
              <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                Leader 1: {g.profiles?.full_name || 'None'} · Leader 2: {g.leader2?.full_name || 'None'}
              </p>
            </div>
            <LuxBtn color="#ef4444" variant="ghost" onClick={async () => { if (!window.confirm('Delete this group?')) return; await supabase.from('groups').delete().eq('id', g.id); load(); }} style={{ padding: '6px 12px', fontSize: 12 }}>Delete</LuxBtn>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Challenge Manager ──────────────────────────────────────────────────────
function ChallengeManager({ user }: { user: User }) {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', type: 'Streak', points: '100', total_days: '7' });
  const [mediaAttach, setMediaAttach] = useState<{ url: string; type: string } | null>(null);
  const color = user.church.primaryColor;

  async function load() {
    const { data } = await supabase.from('challenges').select('*').eq('church_id', user.church.id).order('created_at', { ascending: false });
    if (data) setChallenges(data);
  }
  useEffect(() => { load(); }, [user.church.id]);

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${color}20`, background: `${color}06`,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
      <div className="flex justify-between items-center mb-4">
        <SectionLabel color={color}>Challenges</SectionLabel>
        <LuxBtn color={color} variant="ghost" onClick={() => setAddOpen(!addOpen)} style={{ fontSize: 12, padding: '7px 14px' }}>+ Add Challenge</LuxBtn>
      </div>

      {addOpen && (
        <div className="p-4 rounded-2xl mb-4" style={{ border: `1px solid ${color}20`, background: `${color}06` }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
            <textarea placeholder="Description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} />
            <div className="flex gap-2">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} style={{ ...inputStyle, flex: 1, cursor: 'pointer' }}>
                {['Streak', 'Achievement', 'Community'].map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <input type="number" placeholder="Points" value={form.points} onChange={e => setForm({ ...form, points: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
            </div>
            {form.type === 'Streak' && (
              <input type="number" placeholder="Duration (days)" value={form.total_days} onChange={e => setForm({ ...form, total_days: e.target.value })} style={inputStyle} />
            )}
            {mediaAttach && (
              <div>
                <MediaDisplay url={mediaAttach.url} type={mediaAttach.type} />
                <button onClick={() => setMediaAttach(null)} className="text-xs text-red-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Remove</button>
              </div>
            )}
            <MediaPicker folder="challenges" onUpload={(url, type) => setMediaAttach({ url, type })} />
            <div className="flex gap-2">
              <LuxBtn color={color} variant="outline" onClick={() => setAddOpen(false)} style={{ flex: 1, fontSize: 13 }}>Cancel</LuxBtn>
              <LuxBtn color={color} onClick={async () => {
                if (!form.title.trim()) return;
                await supabase.from('challenges').insert({
                  church_id: user.church.id, title: form.title, description: form.description,
                  type: form.type, points: parseInt(form.points), total_days: parseInt(form.total_days), is_active: true,
                  media_url: mediaAttach?.url || null, media_type: mediaAttach?.type || null,
                });
                setForm({ title: '', description: '', type: 'Streak', points: '100', total_days: '7' }); setMediaAttach(null); setAddOpen(false); load();
              }} style={{ flex: 1, fontSize: 13 }}>Create</LuxBtn>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {challenges.length === 0 ? (
          <EmptyState icon="⚡" message="No challenges yet. Create your first one." />
        ) : challenges.map((c, i) => (
          <div key={i} className="p-3 rounded-2xl" style={{ border: `1px solid ${color}12` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{c.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ background: color, fontFamily: "'DM Sans', sans-serif" }}>{c.type}</span>
                  <span className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{c.points} pts</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={async () => { await supabase.from('challenges').update({ is_active: !c.is_active }).eq('id', c.id); load(); }}
                  className="text-xs px-2 py-1.5 rounded-xl font-semibold"
                  style={{ background: c.is_active ? '#f0fdf4' : '#fef2f2', color: c.is_active ? '#166534' : '#991b1b', fontFamily: "'DM Sans', sans-serif" }}>
                  {c.is_active ? 'Active' : 'Inactive'}
                </button>
                <LuxBtn color="#ef4444" variant="ghost" onClick={async () => { if (!window.confirm('Delete?')) return; await supabase.from('challenges').delete().eq('id', c.id); load(); }} style={{ padding: '5px 10px', fontSize: 12 }}>Delete</LuxBtn>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Devotional Manager ─────────────────────────────────────────────────────
function DevotionalManager({ user }: { user: User }) {
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ day_of_week: 'Monday', title: '', scripture: '', body: '', reflection: '' });
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const color = user.church.primaryColor;

  async function load() {
    const { data } = await supabase.from('devotionals').select('*').eq('church_id', user.church.id).order('created_at', { ascending: false }).limit(20);
    if (data) setDevotionals(data);
  }
  useEffect(() => { load(); }, [user.church.id]);

  async function save() {
    if (!form.title.trim() || !form.body.trim()) { alert('Title and body are required'); return; }
    if (editingId) {
      await supabase.from('devotionals').update({ day_of_week: form.day_of_week, title: form.title, scripture: form.scripture, body: form.body, reflection: form.reflection }).eq('id', editingId);
    } else {
      await supabase.from('devotionals').insert({ church_id: user.church.id, author_id: user.id, day_of_week: form.day_of_week, title: form.title, scripture: form.scripture, body: form.body, reflection: form.reflection });
    }
    setForm({ day_of_week: 'Monday', title: '', scripture: '', body: '', reflection: '' });
    setAddOpen(false); setEditingId(null); load();
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${color}20`, background: `${color}06`,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="rounded-3xl p-4" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
        <div className="flex justify-between items-center mb-1">
          <SectionLabel color={color}>Devotionals</SectionLabel>
          <LuxBtn color={color} variant="ghost" onClick={() => { setAddOpen(!addOpen); setEditingId(null); setForm({ day_of_week: 'Monday', title: '', scripture: '', body: '', reflection: '' }); }} style={{ fontSize: 12, padding: '7px 14px' }}>+ Add</LuxBtn>
        </div>
        <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Post devotionals directly without using the AI assistant.</p>
      </div>

      {addOpen && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          <p className="font-bold text-gray-800 mb-3" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20 }}>{editingId ? 'Edit Devotional' : 'New Devotional'}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <select value={form.day_of_week} onChange={e => setForm({ ...form, day_of_week: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
              {days.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <input type="text" placeholder="Title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} style={inputStyle} />
            <input type="text" placeholder="Scripture (e.g. John 3:16)" value={form.scripture} onChange={e => setForm({ ...form, scripture: e.target.value })} style={inputStyle} />
            <textarea placeholder="Devotional content..." value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} style={{ ...inputStyle, minHeight: 120, resize: 'vertical' }} />
            <input type="text" placeholder="Reflection question (optional)" value={form.reflection} onChange={e => setForm({ ...form, reflection: e.target.value })} style={inputStyle} />
            <div className="flex gap-2">
              <LuxBtn color={color} variant="outline" onClick={() => { setAddOpen(false); setEditingId(null); }} style={{ flex: 1, fontSize: 13 }}>Cancel</LuxBtn>
              <LuxBtn color={color} onClick={save} style={{ flex: 1, fontSize: 13 }}>{editingId ? 'Save Changes' : 'Post Devotional'}</LuxBtn>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {devotionals.length === 0 ? (
          <EmptyState icon="📖" message="No devotionals posted yet." />
        ) : devotionals.map((dv, i) => (
          <div key={i} className="rounded-3xl p-4" style={{ background: BRAND.white, border: `1px solid ${color}12` }}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <span className="text-xs px-2.5 py-1 rounded-full text-white font-semibold inline-block mb-1.5" style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, fontFamily: "'DM Sans', sans-serif" }}>{dv.day_of_week}</span>
                <p className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18 }}>{dv.title}</p>
                {dv.scripture && <p className="text-xs text-gray-400 mt-0.5 italic" style={{ fontFamily: "'DM Sans', sans-serif" }}>{dv.scripture}</p>}
                <p className="text-gray-500 text-xs mt-1 line-clamp-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>{dv.body}</p>
              </div>
              <div className="flex gap-2 ml-3">
                <button onClick={() => { setForm({ day_of_week: dv.day_of_week, title: dv.title, scripture: dv.scripture || '', body: dv.body, reflection: dv.reflection || '' }); setEditingId(dv.id); setAddOpen(true); }} className="text-xs font-semibold" style={{ color, fontFamily: "'DM Sans', sans-serif", background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                <button onClick={async () => { if (!window.confirm('Delete?')) return; await supabase.from('devotionals').delete().eq('id', dv.id); load(); }} className="text-xs text-red-400 font-semibold" style={{ fontFamily: "'DM Sans', sans-serif", background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Published Content Viewer ───────────────────────────────────────────────
function PublishedContentViewer({ user }: { user: User }) {
  const [draft, setDraft] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState('');
  const color = user.church.primaryColor;

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('sermon_drafts').select('*').eq('church_id', user.church.id).eq('status', 'published').order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (data) setDraft(data);
      setLoading(false);
    })();
  }, [user.church.id]);

  async function copy(text: string, key: string) {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(''), 2000);
  }

  if (loading) return <div className="rounded-3xl p-6 text-center" style={{ background: BRAND.white }}><p className="text-gray-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>Loading...</p></div>;
  if (!draft) return <EmptyState icon="📝" message="No published content yet. Generate and publish from the AI Assistant." />;

  const contentBlock = (label: string, key: string, text: string) => (
    <div className="rounded-2xl p-4 mb-3" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
      <div className="flex justify-between items-center mb-2">
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>{label}</p>
        <LuxBtn color={copied === key ? '#4ade80' : color} variant="ghost" onClick={() => copy(text, key)} style={{ fontSize: 12, padding: '5px 12px' }}>
          {copied === key ? 'Copied!' : 'Copy'}
        </LuxBtn>
      </div>
      <p className="text-gray-600 text-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{text}</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {draft.generated_announcement && contentBlock('Announcement', 'announcement', draft.generated_announcement)}
      {draft.generated_prayer && contentBlock('Prayer Prompt', 'prayer', draft.generated_prayer)}
      {draft.generated_questions?.length > 0 && (
        <div className="rounded-2xl p-4 mb-3" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>Small Group Questions</p>
            <LuxBtn color={copied === 'questions' ? '#4ade80' : color} variant="ghost" onClick={() => copy(draft.generated_questions.join('\n'), 'questions')} style={{ fontSize: 12, padding: '5px 12px' }}>
              {copied === 'questions' ? 'Copied!' : 'Copy All'}
            </LuxBtn>
          </div>
          {draft.generated_questions.map((q: string, i: number) => (
            <div key={i} className="flex gap-2 mb-1.5">
              <span className="text-xs text-gray-400 mt-0.5 flex-shrink-0" style={{ fontFamily: "'DM Sans', sans-serif" }}>{i + 1}.</span>
              <p className="text-gray-600 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{q}</p>
            </div>
          ))}
        </div>
      )}
      {draft.generated_social && (
        <div className="rounded-2xl p-4 mb-3" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color, fontFamily: "'DM Sans', sans-serif" }}>Social Media Captions</p>
          {Object.entries(draft.generated_social).map(([key, val]) => (
            <div key={key} className="mb-3 p-3 rounded-xl" style={{ background: `${color}06` }}>
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs font-bold text-gray-500 capitalize" style={{ fontFamily: "'DM Sans', sans-serif" }}>{key}</p>
                <LuxBtn color={copied === key ? '#4ade80' : color} variant="ghost" onClick={() => copy(val as string, key)} style={{ fontSize: 11, padding: '4px 10px' }}>
                  {copied === key ? 'Copied!' : 'Copy'}
                </LuxBtn>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif" }}>{val as string}</p>
            </div>
          ))}
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
  const [givingLink, setGivingLink] = useState(user.church.givingStripeLink || '');
  const [checkinStart, setCheckinStart] = useState('08:00');
  const [checkinEnd, setCheckinEnd] = useState('14:00');
  const [checkinDays, setCheckinDays] = useState('Sunday');
  const [autoReset, setAutoReset] = useState(false);
  const [resetFreq, setResetFreq] = useState('monthly');
  const [members, setMembers] = useState<any[]>([]);
  const [pointsEditing, setPointsEditing] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const isSA = user.role === 'super_admin';
  const color = user.church.primaryColor;

  useEffect(() => {
    (async () => {
      const { count: mc } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('church_id', user.church.id);
      const wk = new Date(Date.now() - 7 * 86400000).toISOString();
      const { count: ac } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('church_id', user.church.id).gte('checked_in_at', wk);
      const ms = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      const { count: atc } = await supabase.from('attendance').select('*', { count: 'exact', head: true }).eq('church_id', user.church.id).gte('checked_in_at', ms);
      setStats({ members: mc || 0, active: ac || 0, attendance: atc || 0 });

      const { data: pl } = await supabase.from('business_listings').select('*, profiles(full_name)').eq('church_id', user.church.id).eq('approved', false);
      if (pl) setPendingListings(pl);

      const { data: ps } = await supabase.from('points_settings').select('*').eq('church_id', user.church.id).maybeSingle();
      if (ps) { setAutoReset(ps.auto_reset); setResetFreq(ps.reset_frequency); }

      const { data: ch } = await supabase.from('churches').select('checkin_start, checkin_end, checkin_days, giving_stripe_link').eq('id', user.church.id).maybeSingle();
      if (ch) {
        if (ch.checkin_start) setCheckinStart(ch.checkin_start);
        if (ch.checkin_end) setCheckinEnd(ch.checkin_end);
        if (ch.checkin_days) setCheckinDays(ch.checkin_days);
        if (ch.giving_stripe_link) setGivingLink(ch.giving_stripe_link);
      }

      if (isSA) {
        const { data: mb } = await supabase.from('profiles').select('*').eq('church_id', user.church.id).order('full_name', { ascending: true });
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

  const adminTabs = ['overview', 'content', 'devotionals', 'branding', 'points', 'notifications', 'groups', 'challenges', ...(isSA ? ['members'] : [])];

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: `1.5px solid ${color}20`, background: `${color}06`,
    fontSize: 14, fontFamily: "'DM Sans', sans-serif", outline: 'none',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackHeader title="Admin Panel" onBack={onBack} color={color} />

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {adminTabs.map(t => (
          <button key={t} onClick={() => setTab(t)} className="flex-shrink-0 px-3 py-2 rounded-2xl text-xs font-semibold capitalize"
            style={{ background: tab === t ? `linear-gradient(135deg, ${color}, ${color}cc)` : `${color}0d`, color: tab === t ? BRAND.white : color, border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", transition: 'all 0.2s', boxShadow: tab === t ? `0 4px 12px ${color}30` : 'none' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="grid grid-cols-2 gap-3">
            {[{ l: 'Total Members', v: stats.members, icon: '👥' }, { l: 'Active This Week', v: stats.active, icon: '⚡' }, { l: 'Attendance MTD', v: stats.attendance, icon: '📍' }, { l: 'Giving MTD', v: '$0', icon: '💳' }].map((s, i) => (
              <div key={i} className="rounded-3xl p-4" style={{ background: BRAND.white, border: `1px solid ${color}12`, boxShadow: `0 2px 10px ${color}06` }}>
                <p style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</p>
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: '#111', lineHeight: 1 }}>{s.v}</p>
                <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{s.l}</p>
              </div>
            ))}
          </div>
          {pendingListings.length > 0 && (
            <div className="rounded-3xl p-4" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
              <SectionLabel color={color}>Pending Business Listings</SectionLabel>
              {pendingListings.map((pl, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-2xl mb-2" style={{ background: `${color}08` }}>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{pl.business_name}</p>
                    <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>by {pl.profiles?.full_name}</p>
                  </div>
                  <div className="flex gap-2">
                    <LuxBtn color={color} onClick={async () => { await supabase.from('business_listings').update({ approved: true }).eq('id', pl.id); setPendingListings(pendingListings.filter(x => x.id !== pl.id)); }} style={{ padding: '6px 14px', fontSize: 12 }}>Approve</LuxBtn>
                    <LuxBtn color="#6b7280" variant="ghost" onClick={async () => { await supabase.from('business_listings').delete().eq('id', pl.id); setPendingListings(pendingListings.filter(x => x.id !== pl.id)); }} style={{ padding: '6px 14px', fontSize: 12 }}>Decline</LuxBtn>
                  </div>
                </div>
              ))}
            </div>
          )}
          <InviteGenerator user={user} />
        </div>
      )}

      {tab === 'branding' && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          <SectionLabel color={color}>Church Branding</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[{ l: 'Church Name', v: brandName, s: setBrandName }, { l: 'Tagline', v: brandTagline, s: setBrandTagline }].map((f, i) => (
              <div key={i}>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f.l}</label>
                <input type="text" value={f.v} onChange={e => f.s(e.target.value)} style={inputStyle} />
              </div>
            ))}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Logo Initials</label>
              <input type="text" value={brandInitials} maxLength={3} onChange={e => setBrandInitials(e.target.value.toUpperCase())} style={inputStyle} />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Primary Color</label>
              <div className="flex gap-3 items-center">
                <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-12 h-10 rounded-xl border cursor-pointer" style={{ borderColor: `${color}20` }} />
                <input type="text" value={brandColor} onChange={e => setBrandColor(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Church Logo (Optional)</label>
              <div className="flex items-center gap-3">
                {logoUrl && <img src={logoUrl} alt="logo" className="w-12 h-12 rounded-xl object-contain" style={{ border: `1px solid ${color}20` }} />}
                <LuxBtn color={color} variant="outline" onClick={() => fileRef.current?.click()} style={{ fontSize: 13 }}>Upload Logo</LuxBtn>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadLogo} />
              </div>
              <p className="text-xs text-gray-400 mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Replaces initials if uploaded. PNG or SVG recommended.</p>
            </div>

            {/* Option B giving link */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Church Giving Link (Optional)</label>
              <p className="text-xs text-gray-400 mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Paste your own Stripe payment link here. When set, members will be sent to your link instead of the default giving page.</p>
              <input type="text" placeholder="https://buy.stripe.com/..." value={givingLink} onChange={e => setGivingLink(e.target.value)} style={inputStyle} />
            </div>

            {/* Preview */}
            <div className="p-4 rounded-2xl" style={{ background: `${brandColor}15`, border: `1px solid ${brandColor}25` }}>
              <p className="text-xs font-semibold text-gray-500 mb-2" style={{ fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preview</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm" style={{ background: `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` }}>{brandInitials}</div>
                <div>
                  <p className="font-bold text-gray-800 text-sm" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17 }}>{brandName}</p>
                  <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>{brandTagline}</p>
                </div>
              </div>
            </div>

            {/* Check-in window */}
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Check In Window</label>
              <p className="text-xs text-gray-400 mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>Members can only check in during this window.</p>
              <div className="flex gap-2 mb-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Start</label>
                  <input type="time" value={checkinStart} onChange={e => setCheckinStart(e.target.value)} style={inputStyle} />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-400 block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>End</label>
                  <input type="time" value={checkinEnd} onChange={e => setCheckinEnd(e.target.value)} style={inputStyle} />
                </div>
              </div>
              <input type="text" value={checkinDays} onChange={e => setCheckinDays(e.target.value)} placeholder="e.g. Sunday or Sunday,Wednesday" style={inputStyle} />
            </div>

            <LuxBtn color={color} onClick={async () => {
              await supabase.from('churches').update({ name: brandName, tagline: brandTagline, primary_color: brandColor, logo_initials: brandInitials, logo_url: logoUrl || null, checkin_start: checkinStart, checkin_end: checkinEnd, checkin_days: checkinDays, giving_stripe_link: givingLink || null }).eq('id', user.church.id);
              alert('Branding saved! Refresh to see changes.');
            }} style={{ width: '100%' }}>
              Save All Branding
            </LuxBtn>
          </div>
        </div>
      )}

      {tab === 'points' && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          <SectionLabel color={color}>Points Management</SectionLabel>
          <div className="p-4 rounded-2xl mb-4" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
            <p className="font-bold text-red-700 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Manual Reset</p>
            <p className="text-xs text-red-400 mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>Resets all member points to zero immediately. Cannot be undone.</p>
            <LuxBtn color="#ef4444" onClick={async () => {
              if (!window.confirm('Reset all points to zero? This cannot be undone.')) return;
              await supabase.from('profiles').update({ points: 0 }).eq('church_id', user.church.id);
              await supabase.from('points_settings').upsert({ church_id: user.church.id, last_reset_at: new Date().toISOString() }, { onConflict: 'church_id' });
              alert('All points have been reset.');
            }} style={{ fontSize: 13 }}>Reset All Points Now</LuxBtn>
          </div>
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input type="checkbox" checked={autoReset} onChange={e => setAutoReset(e.target.checked)} className="rounded" />
            <p className="font-semibold text-gray-700 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>Enable Automatic Reset</p>
          </label>
          {autoReset && (
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest block mb-1.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Reset Frequency</label>
              <select value={resetFreq} onChange={e => setResetFreq(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {['weekly', 'biweekly', 'monthly', 'quarterly', 'semi-annually', 'annually'].map(f => <option key={f} value={f} className="capitalize">{f.charAt(0).toUpperCase() + f.slice(1)}</option>)}
              </select>
            </div>
          )}
          <LuxBtn color={color} onClick={async () => {
            await supabase.from('points_settings').upsert({ church_id: user.church.id, auto_reset: autoReset, reset_frequency: resetFreq }, { onConflict: 'church_id' });
            alert('Settings saved.');
          }} style={{ width: '100%' }}>Save Points Settings</LuxBtn>
        </div>
      )}

      {tab === 'content' && <PublishedContentViewer user={user} />}
      {tab === 'devotionals' && <DevotionalManager user={user} />}
      {tab === 'notifications' && <NotificationSender user={user} />}
      {tab === 'groups' && <GroupManager user={user} />}
      {tab === 'challenges' && <ChallengeManager user={user} />}

      {tab === 'members' && isSA && (
        <div className="rounded-3xl p-5" style={{ background: BRAND.white, border: `1px solid ${color}15` }}>
          <SectionLabel color={color}>Member Management</SectionLabel>
          {members.map((m, i) => (
            <div key={i} className="p-3 rounded-2xl mb-2" style={{ border: `1px solid ${color}12` }}>
              <div className="flex items-center gap-2 mb-2">
                <Avatar url={m.avatar_url} name={m.full_name || 'Member'} size={32} color={color} />
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.full_name || 'Unnamed'}</p>
                </div>
              </div>

              {/* Points editing */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-gray-500" style={{ fontFamily: "'DM Sans', sans-serif" }}>Points:</span>
                <input
                  type="number"
                  value={pointsEditing[m.id] !== undefined ? pointsEditing[m.id] : m.points || 0}
                  onChange={e => setPointsEditing({ ...pointsEditing, [m.id]: e.target.value })}
                  className="w-24 px-2 py-1 rounded-xl text-sm focus:outline-none text-center"
                  style={{ border: `1.5px solid ${color}25`, background: `${color}08`, fontFamily: "'DM Sans', sans-serif" }}
                />
                {pointsEditing[m.id] !== undefined && (
                  <LuxBtn color={color} variant="ghost" onClick={async () => {
                    await supabase.from('profiles').update({ points: parseInt(pointsEditing[m.id]) }).eq('id', m.id);
                    setMembers(members.map(x => x.id === m.id ? { ...x, points: parseInt(pointsEditing[m.id]) } : x));
                    const updated = { ...pointsEditing };
                    delete updated[m.id];
                    setPointsEditing(updated);
                  }} style={{ fontSize: 11, padding: '4px 10px' }}>Save</LuxBtn>
                )}
              </div>

              {/* Primary role */}
              <div className="mb-2">
                <span className="text-xs text-gray-500 block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Primary Role:</span>
                <select
                  value={m.role}
                  onChange={async e => {
                    await supabase.from('profiles').update({ role: e.target.value }).eq('id', m.id);
                    setMembers(members.map(x => x.id === m.id ? { ...x, role: e.target.value } : x));
                  }}
                  style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}
                >
                  {['member', 'admin', 'super_admin', 'group_leader', 'children_worker'].map(r => (
                    <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              {/* Secondary role */}
              <div className="mb-2">
                <span className="text-xs text-gray-500 block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Secondary Role:</span>
                <select
                  value={m.secondary_role || ''}
                  onChange={async e => {
                    await supabase.from('profiles').update({ secondary_role: e.target.value || null }).eq('id', m.id);
                    setMembers(members.map(x => x.id === m.id ? { ...x, secondary_role: e.target.value } : x));
                  }}
                  style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}
                >
                  <option value="">None</option>
                  <option value="group_leader">Group Leader</option>
                  <option value="children_worker">Children's Worker</option>
                </select>
              </div>

              {/* Secondary role 2 */}
              <div>
                <span className="text-xs text-gray-500 block mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>Secondary Role 2:</span>
                <select
                  value={m.secondary_role_2 || ''}
                  onChange={async e => {
                    await supabase.from('profiles').update({ secondary_role_2: e.target.value || null }).eq('id', m.id);
                    setMembers(members.map(x => x.id === m.id ? { ...x, secondary_role_2: e.target.value } : x));
                  }}
                  style={{ ...inputStyle, padding: '8px 12px', fontSize: 13 }}
                >
                  <option value="">None</option>
                  <option value="group_leader">Group Leader</option>
                  <option value="children_worker">Children's Worker</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Direct Message Screen ──────────────────────────────────────────────────
function DirectMessageScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [selMember, setSelMember] = useState<any>(null);
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const isAdminUser = isAdmin(user);
  const color = user.church.primaryColor;

  useEffect(() => {
    if (isAdminUser) {
      (async () => {
        const { data } = await supabase.from('profiles').select('id, full_name, avatar_url')
          .eq('church_id', user.church.id)
          .not('role', 'in', '("admin","super_admin")')
          .order('full_name', { ascending: true });
        if (data) setMembers(data);
      })();
    } else {
      loadMessages(user.id);
    }
  }, [user.church.id]);

  async function loadMessages(memberId: string) {
    const { data } = await supabase.from('direct_messages')
      .select('*, profiles!direct_messages_author_id_fkey(full_name, avatar_url)')
      .eq('church_id', user.church.id).eq('member_id', memberId)
      .order('created_at', { ascending: true });
    if (data) setMsgs(data);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  }

  async function send() {
    if (!text.trim()) return;
    const memberId = isAdminUser ? selMember?.id : user.id;
    await supabase.from('direct_messages').insert({ church_id: user.church.id, member_id: memberId, author_id: user.id, content: text, is_from_admin: isAdminUser });
    setText('');
    loadMessages(memberId);
  }

  if (isAdminUser && !selMember) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackHeader title="Member Messages" onBack={onBack} color={color} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {members.length === 0 ? (
          <EmptyState icon="💬" message="No members yet." />
        ) : members.map((m, i) => (
          <button
            key={i}
            onClick={() => { setSelMember(m); loadMessages(m.id); }}
            className="rounded-3xl p-4 flex items-center gap-3 text-left"
            style={{ background: BRAND.white, border: `1px solid ${color}12`, boxShadow: `0 2px 8px ${color}06`, cursor: 'pointer' }}
          >
            <Avatar url={m.avatar_url} name={m.full_name || 'Member'} size={38} color={color} />
            <div className="flex-1">
              <p className="font-semibold text-gray-800 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.full_name || 'Member'}</p>
              <p className="text-xs text-gray-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>Tap to view messages</p>
            </div>
            <span style={{ color: `${color}50`, fontSize: 20 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackHeader title={isAdminUser ? selMember?.full_name : 'Message Admin Team'} onBack={() => isAdminUser ? setSelMember(null) : onBack()} color={color} />
      {!isAdminUser && (
        <div className="rounded-2xl p-3" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
          <p className="text-xs text-blue-600" style={{ fontFamily: "'DM Sans', sans-serif" }}>Your messages are private and only visible to church admins.</p>
        </div>
      )}
      <div className="rounded-3xl overflow-hidden flex flex-col" style={{ background: BRAND.white, border: `1px solid ${color}15`, height: '62vh' }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {msgs.length === 0 && <EmptyState icon="💬" message="No messages yet. Start the conversation." />}
          {msgs.map((m, i) => {
            const own = m.author_id === user.id;
            return (
              <div key={i} className={`flex gap-2 ${own ? 'flex-row-reverse' : ''}`}>
                {!own && <Avatar url={m.profiles?.avatar_url} name={m.profiles?.full_name || 'Admin'} size={26} color={color} />}
                <div className={`max-w-xs flex flex-col ${own ? 'items-end' : 'items-start'}`}>
                  {!own && <p className="text-xs text-gray-400 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{m.profiles?.full_name || 'Admin'}</p>}
                  <div
                    className="px-4 py-2.5 text-sm"
                    style={{
                      background: own ? `linear-gradient(135deg, ${color}, ${color}dd)` : `${color}0d`,
                      color: own ? BRAND.white : '#1F2937',
                      fontFamily: "'DM Sans', sans-serif",
                      boxShadow: own ? `0 4px 12px ${color}30` : 'none',
                      borderRadius: own ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    }}
                  >
                    {m.content}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
        <div className="p-3 flex gap-2" style={{ borderTop: `1px solid ${color}10` }}>
          <input
            type="text" placeholder="Type a message..." value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send(); }}
            className="flex-1 px-4 py-2.5 rounded-2xl text-sm focus:outline-none"
            style={{ border: `1.5px solid ${color}20`, background: `${color}06`, fontFamily: "'DM Sans', sans-serif" }}
          />
          <LuxBtn color={color} onClick={send} style={{ padding: '10px 18px', fontSize: 13 }}>Send</LuxBtn>
        </div>
      </div>
    </div>
  );
}
// ── Pricing Screen ─────────────────────────────────────────────────────────
function PricingScreen({ user, onBack }: { user: User; onBack: () => void }) {
  const color = user.church.primaryColor;

  const plans = [
    {
      name: 'Starter',
      price: '$69',
      desc: 'Perfect for small churches ready to take discipleship seriously.',
      link: 'https://buy.stripe.com/28E8wPevd5si2P09aub3q00',
      popular: false,
      features: [
        'Up to 75 members',
        '5 admin seats',
        '10 small groups',
        'Push notifications',
        'QR attendance check-in',
        'Prayer wall',
        'Challenges and leaderboard',
        'Announcements and events',
        'Member directory',
        'Giving',
      ],
    },
    {
      name: 'Growth',
      price: '$147',
      desc: 'For growing churches ready to build community and go deeper.',
      link: 'https://buy.stripe.com/14AaEXdr94oedtE0DYb3q01',
      popular: true,
      features: [
        'Up to 250 members',
        '10 admin seats',
        '25 small groups',
        'Everything in Starter',
        'Business directory',
        'AI Sermon Assistant',
        "Children's check-in",
      ],
    },
    {
      name: 'Kingdom',
      price: '$247',
      desc: 'Everything included for thriving churches building the Kingdom.',
      link: 'https://buy.stripe.com/7sY00j1Ir1c261c9aub3q02',
      popular: false,
      features: [
        'Up to 1,000 members',
        'Unlimited admin seats',
        'Unlimited groups',
        'Everything in Growth',
        'Advanced admin panel',
        'Custom church branding',
        'Direct member messaging',
        'Priority support',
        'Multi campus ready',
      ],
    },
  ];


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BackHeader title="Plans and Pricing" onBack={onBack} color={color} />

      {/* Seal logo */}
      <div className="flex justify-center">
        <FloremusLogo size={72} variant="seal" />
      </div>

      {/* FLOURISH818 offer banner */}
      <div
        className="rounded-3xl p-5 text-center relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${color}18, ${color}08)`,
          border: `2px solid ${color}35`,
        }}
      >
        <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: `${color}10` }} />
        <p
          className="text-xs font-bold uppercase tracking-widest mb-1"
          style={{ color: '#f59e0b', fontFamily: "'DM Sans', sans-serif" }}
        >
          Limited Time Offer
        </p>
        <p
          className="font-bold text-gray-800 mb-1"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}
        >
          40% Off Your First 6 Months
        </p>
        <p className="text-gray-500 text-xs mb-3" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          The next 15 ministries to sign up this June receive 40% off for 6 months.
        </p>
        <div
          className="inline-block px-5 py-2 rounded-2xl mb-1"
          style={{ background: 'rgba(245,158,11,0.1)', border: '1.5px dashed #f59e0b' }}
        >
          <p className="text-xs text-amber-500 font-semibold mb-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Use code at checkout</p>
          <p className="font-bold text-gray-800 tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 20, letterSpacing: 4 }}>FLOURISH818</p>
        </div>
        <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          June 2025 only. New accounts only. Limited to 15 ministries.
        </p>
      </div>

      {/* Plan cards */}
      {plans.map((p, i) => (
        <div
          key={i}
          className="rounded-3xl p-5 relative"
          style={{
            background: p.popular ? `linear-gradient(160deg, ${color}12, ${BRAND.white})` : BRAND.white,
            border: `2px solid ${p.popular ? color : color + '20'}`,
            boxShadow: p.popular ? `0 8px 32px ${color}20` : `0 2px 12px ${color}08`,
          }}
        >
          {p.popular && (
            <div
              className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-white text-xs font-bold"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.05em', whiteSpace: 'nowrap' }}
            >
              MOST POPULAR
            </div>
          )}

          <div className="flex justify-between items-start mb-3">
            <div>
              <h3
                className="font-bold text-gray-900"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26 }}
              >
                {p.name}
              </h3>
              <p className="text-gray-400 text-xs mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>{p.desc}</p>
            </div>
            <div className="text-right">
              <span
                className="font-bold text-gray-900"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38 }}
              >
                {p.price}
              </span>
              <span className="text-gray-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>/mo</span>
            </div>
          </div>

          <div
            className="mb-4 pb-4"
            style={{ borderBottom: `1px solid ${color}12` }}
          >
            {p.features.map((f, j) => (
              <div key={j} className="flex items-center gap-2 mb-1.5">
                <span style={{ color, fontSize: 13, fontWeight: 700 }}>✓</span>
                <span className="text-gray-600 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f}</span>
              </div>
            ))}
          </div>

          <LuxBtn
            color={color}
            onClick={() => window.open(p.link, '_blank')}
            style={{ width: '100%', fontSize: 15 }}
          >
            Subscribe to {p.name}
          </LuxBtn>
        </div>
      ))}

      {/* Enterprise */}
      <div
        className="rounded-3xl p-5"
        style={{ background: BRAND.white, border: `1px solid ${color}18`, boxShadow: `0 2px 12px ${color}06` }}
      >
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24 }}>Enterprise</h3>
            <p className="text-gray-400 text-xs mt-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>For churches of 1,000 or more members</p>
          </div>
          <div className="text-right">
            <span className="font-bold text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}>$597+</span>
            <p className="text-gray-400 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>/month</p>
          </div>
        </div>
        <div className="mb-4">
          {['Everything in Kingdom', 'Dedicated account manager', 'Native iOS and Android app', '4 hour support SLA', 'Quarterly strategy calls', 'Custom feature development'].map((f, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <span style={{ color, fontSize: 13, fontWeight: 700 }}>✓</span>
              <span className="text-gray-600 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f}</span>
            </div>
          ))}
        </div>
        <a
          href="mailto:enterprise@floremus.church?subject=Enterprise Pricing Inquiry"
          className="block w-full py-3 rounded-2xl text-center font-bold text-white"
          style={{ background: `linear-gradient(135deg, ${BRAND.plum}, #2d1060)`, fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}
        >
          Contact Us for Enterprise Pricing
        </a>
      </div>

      {/* Concierge */}
      <div
        className="rounded-3xl p-5"
        style={{ background: BRAND.white, border: `1px solid ${color}18`, boxShadow: `0 2px 12px ${color}06` }}
      >
        <div className="flex justify-between items-center mb-2">
          <div>
            <h3 className="font-bold text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22 }}>Concierge Launch</h3>
            <p className="text-gray-400 text-xs mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>Hands-on onboarding with a dedicated rep</p>
          </div>
          <div className="text-right">
            <span className="font-bold text-gray-900" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}>$199</span>
            <p className="text-gray-400 text-xs" style={{ fontFamily: "'DM Sans', sans-serif" }}>one time</p>
          </div>
        </div>
        <div className="mb-4">
          {['Full platform setup and configuration', 'Staff training session', '30 day post-launch check-in', 'Available on any plan'].map((f, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <span style={{ color, fontSize: 13, fontWeight: 700 }}>✓</span>
              <span className="text-gray-600 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>{f}</span>
            </div>
          ))}
        </div>
        <LuxBtn
          color={color}
          variant="outline"
          onClick={() => window.open('https://buy.stripe.com/6oUcN5dr99IyfBMdqKb3q04', '_blank')}
          style={{ width: '100%', fontSize: 14 }}
        >
          Add Concierge Launch
        </LuxBtn>
      </div>

      <p
        className="text-center text-xs text-gray-400 pb-4"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        No long-term contracts. Cancel any time.
      </p>
    </div>
  );
}

// ── Grace Period Screen ────────────────────────────────────────────────────
function GracePeriodScreen({ user, daysLeft }: { user: User; daysLeft: number }) {
  const color = user.church.primaryColor;
  const urgencyColor = daysLeft <= 2 ? '#ef4444' : daysLeft <= 4 ? '#f59e0b' : color;

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: `linear-gradient(160deg, ${BRAND.plum} 0%, #1a0535 100%)` }}
    >
      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <FloremusLogo size={140} variant="withTagline" />
        </div>

        <div
          className="rounded-3xl p-8 text-center"
          style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${urgencyColor}40`, backdropFilter: 'blur(20px)' }}
        >
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚠️</div>

          <h2
            className="font-bold text-white mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30 }}
          >
            Payment Issue
          </h2>

          <p className="text-gray-300 mb-6 leading-relaxed" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>
            There was a problem processing your payment. Your church still has access but your account will be locked in:
          </p>

          {/* Countdown */}
          <div
            className="rounded-2xl p-6 mb-6 inline-block w-full"
            style={{ background: `${urgencyColor}18`, border: `2px solid ${urgencyColor}50` }}
          >
            <p
              className="font-bold"
              style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 72, color: urgencyColor, lineHeight: 1 }}
            >
              {daysLeft}
            </p>
            <p
              className="font-semibold mt-1"
              style={{ color: urgencyColor, fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}
            >
              {daysLeft === 1 ? 'day remaining' : 'days remaining'}
            </p>
          </div>

          <p className="text-gray-400 text-sm mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Update your payment method to keep {user.church.name} active and your congregation connected.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LuxBtn
              color={urgencyColor}
              onClick={() => window.open('https://billing.stripe.com', '_blank')}
              style={{ width: '100%', fontSize: 15, padding: '15px 0' }}
            >
              Update Payment Method
            </LuxBtn>

            <button
              onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
              style={{ background: 'none', border: 'none', color: 'rgba(192,198,204,0.5)', fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
            >
              Sign out
            </button>
          </div>
        </div>

        <p
          className="text-center mt-6"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(192,198,204,0.25)', fontSize: 13 }}
        >
          Need help? Email support@floremus.church
        </p>
      </div>
    </div>
  );
}

// ── Paywall Screen ─────────────────────────────────────────────────────────
function PaywallScreen({ user }: { user: User }) {
  const plans = [
    { name: 'Starter', price: '$69', link: 'https://buy.stripe.com/28E8wPevd5si2P09aub3q00' },
    { name: 'Growth', price: '$147', link: 'https://buy.stripe.com/14AaEXdr94oedtE0DYb3q01' },
    { name: 'Kingdom', price: '$247', link: 'https://buy.stripe.com/7sY00j1Ir1c261c9aub3q02' },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: `linear-gradient(160deg, ${BRAND.plum} 0%, #1a0535 100%)` }}
    >
      <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,33,168,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <FloremusLogo size={140} variant="withTagline" />
        </div>

        <div className="text-center mb-6">
          <h2
            className="font-bold text-white mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32 }}
          >
            Choose Your Plan
          </h2>
          <p className="text-gray-400 text-sm" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Select a plan to activate {user.church.name} on Floremus.
          </p>
        </div>

        {/* FLOURISH818 offer */}
        <div
          className="rounded-2xl p-4 text-center mb-6"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px dashed rgba(245,158,11,0.5)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Founding Church Offer
          </p>
          <p className="text-white text-sm font-semibold mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            40% off for your first 6 months
          </p>
          <p className="text-gray-400 text-xs mb-2" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Next 15 ministries only. June 2025. Enter at checkout:
          </p>
          <div
            className="inline-block px-4 py-1.5 rounded-xl"
            style={{ background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.4)' }}
          >
            <span className="font-bold text-amber-400 tracking-widest" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, letterSpacing: 4 }}>FLOURISH818</span>
          </div>
        </div>

        {/* Plan cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          {plans.map((p, i) => (
            <button
              key={i}
              onClick={() => window.open(p.link, '_blank')}
              className="w-full p-4 rounded-2xl text-left flex items-center justify-between"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <div>
                <p className="font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20 }}>{p.name}</p>
                <p className="text-gray-400 text-xs mt-0.5" style={{ fontFamily: "'DM Sans', sans-serif" }}>per month</p>
              </div>
              <span className="font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}>{p.price}</span>
            </button>
          ))}
        </div>

        <p className="text-center text-gray-500 text-xs mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
          No long-term contracts. Cancel any time.
        </p>

        <button
          onClick={async () => { await supabase.auth.signOut(); window.location.reload(); }}
          className="w-full text-center text-sm"
          style={{ color: BRAND.sage, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── Email Confirm Screen ───────────────────────────────────────────────────
function EmailConfirmScreen() {
  const [count, setCount] = useState(10);

  useEffect(() => {
    if (count <= 0) { window.location.href = '/'; return; }
    const timer = setTimeout(() => setCount(count - 1), 1000);
    return () => clearTimeout(timer);
  }, [count]);

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: `linear-gradient(160deg, ${BRAND.plum} 0%, #1a0535 100%)` }}
    >
      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,33,168,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="w-full max-w-md text-center relative z-10">
        <div className="flex justify-center mb-8">
          <FloremusLogo size={140} variant="withTagline" />
        </div>

        <div
          className="p-8 rounded-3xl"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
        >
          <div style={{ fontSize: 56, marginBottom: 16 }}>✅</div>
          <h2
            className="font-bold text-white mb-2"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30 }}
          >
            Email Confirmed!
          </h2>
          <p className="text-gray-400 mb-6" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>
            Your account is ready. Welcome to Floremus.
          </p>

          <div
            className="flex items-center justify-center rounded-full mx-auto mb-4"
            style={{
              width: 64,
              height: 64,
              border: `3px solid ${BRAND.purple}`,
              background: `${BRAND.purple}18`,
            }}
          >
            <p className="font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}>{count}</p>
          </div>
          <p className="text-gray-400 text-xs mb-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Redirecting to sign in in {count} seconds
          </p>

          <LuxBtn
            color={BRAND.purple}
            onClick={() => window.location.href = '/'}
            style={{ width: '100%', fontSize: 15, padding: '14px 0' }}
          >
            Sign In Now
          </LuxBtn>
        </div>

        <p
          className="text-center mt-8"
          style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(192,198,204,0.25)', fontSize: 13 }}
        >
          Built for Flourishing
        </p>
      </div>
    </div>
  );
}

// ── Reset Password Screen ──────────────────────────────────────────────────
function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);

  const pwMatch = password === confirm && confirm.length > 0;

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: '1.5px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.07)',
    color: BRAND.white,
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  };

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
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: `linear-gradient(160deg, ${BRAND.plum} 0%, #1a0535 100%)` }}
    >
      <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,33,168,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-8">
          <FloremusLogo size={140} variant="withTagline" />
        </div>

        <div
          className="rounded-3xl p-8"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
        >
          {done ? (
            <div className="text-center">
              <div style={{ fontSize: 52, marginBottom: 16 }}>🔐</div>
              <h2 className="font-bold text-white mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}>Password Updated!</h2>
              <p className="text-gray-400 mb-6" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>You can now sign in with your new password.</p>
              <LuxBtn color={BRAND.purple} onClick={() => window.location.href = '/'} style={{ width: '100%', fontSize: 15, padding: '14px 0' }}>
                Go to Sign In
              </LuxBtn>
            </div>
          ) : (
            <>
              <h2 className="font-bold text-white mb-1 text-center" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}>Reset Password</h2>
              <p className="text-center mb-6" style={{ color: 'rgba(192,198,204,0.6)', fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>Enter your new password below</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>New Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} placeholder="Create a new password" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputBase, paddingRight: 60 }} />
                    <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: BRAND.sage, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      {showPw ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Confirm Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showCf ? 'text' : 'password'}
                      placeholder="Repeat your new password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      style={{
                        ...inputBase,
                        paddingRight: 60,
                        borderColor: confirm.length > 0 ? (pwMatch ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)') : 'rgba(255,255,255,0.15)',
                      }}
                    />
                    <button type="button" onClick={() => setShowCf(!showCf)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: BRAND.sage, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                      {showCf ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  {confirm.length > 0 && (
                    <p style={{ fontSize: 12, marginTop: 6, color: pwMatch ? '#4ade80' : '#f87171', fontFamily: "'DM Sans', sans-serif" }}>
                      {pwMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                <LuxBtn color={BRAND.purple} onClick={updatePassword} disabled={loading} style={{ width: '100%', fontSize: 15, padding: '14px 0', marginTop: 4 }}>
                  {loading ? 'Updating...' : 'Update Password'}
                </LuxBtn>
              </div>
            </>
          )}
        </div>

        <p className="text-center mt-8" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(192,198,204,0.25)', fontSize: 13 }}>
          Built for Flourishing
        </p>
      </div>
    </div>
  );
}

// ── Join Screen ────────────────────────────────────────────────────────────
function JoinScreen({ code }: { code: string }) {
  const [church, setChurch] = useState<any>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const pwMatch = password === confirm && confirm.length > 0;
  const churchColor = church?.primary_color || BRAND.purple;

  useEffect(() => {
    (async () => {
      const { data: invite } = await supabase.from('invites')
        .select('*, churches(*)')
        .eq('code', code)
        .eq('active', true)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();
      if (invite?.churches) setChurch(invite.churches);
      else alert('This invite link is invalid or has expired.');
    })();
  }, [code]);

  async function join() {
    if (!name || !email || !password) { alert('Please fill in all fields'); return; }
    if (!pwMatch) { alert('Passwords do not match'); return; }
    if (password.length < 8) { alert('Password must be at least 8 characters'); return; }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) { alert(error.message); setLoading(false); return; }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, church_id: church.id, full_name: name, role: 'member', points: 0, streak: 0 });
      setDone(true);
    }
    setLoading(false);
  }

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    borderRadius: 14,
    border: '1.5px solid rgba(255,255,255,0.15)',
    background: 'rgba(255,255,255,0.07)',
    color: BRAND.white,
    fontSize: 15,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    boxSizing: 'border-box',
  };

  if (!church) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${BRAND.plum} 0%, #1a0535 100%)` }}>
      <p className="text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>Loading...</p>
    </div>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6 py-12"
      style={{ background: `linear-gradient(160deg, ${BRAND.plum} 0%, #1a0535 100%)` }}
    >
      <div style={{ position: 'fixed', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, borderRadius: '50%', background: `radial-gradient(circle, ${churchColor}18 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div className="w-full max-w-md relative z-10">
        <div className="flex justify-center mb-6">
          <FloremusLogo size={140} variant="withTagline" />
        </div>

        {done ? (
          <div
            className="text-center p-8 rounded-3xl"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
          >
            <div style={{ fontSize: 52, marginBottom: 16 }}>🎉</div>
            <h2 className="font-bold text-white mb-2" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}>Welcome to {church.name}!</h2>
            <p className="text-gray-400 mb-6" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>Check your email to confirm your account, then sign in.</p>
            <LuxBtn color={churchColor} onClick={() => window.location.href = '/'} style={{ width: '100%', fontSize: 15, padding: '14px 0' }}>
              Sign In Now
            </LuxBtn>
          </div>
        ) : (
          <div
            className="rounded-3xl p-8"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)' }}
          >
            <div className="text-center mb-6">
              <p className="text-gray-400 text-sm mb-1" style={{ fontFamily: "'DM Sans', sans-serif" }}>You have been invited to join</p>
              <h2 className="font-bold text-white" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28 }}>{church.name}</h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Your Full Name</label>
                <input type="text" placeholder="First and last name" value={name} onChange={e => setName(e.target.value)} style={inputBase} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Email Address</label>
                <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} style={inputBase} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Create a Password</label>
                <div style={{ position: 'relative' }}>
                  <input type={showPw ? 'text' : 'password'} placeholder="At least 8 characters" value={password} onChange={e => setPassword(e.target.value)} style={{ ...inputBase, paddingRight: 60 }} />
                  <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: BRAND.sage, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
                    {showPw ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'rgba(192,198,204,0.7)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Confirm Password</label>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  style={{
                    ...inputBase,
                    borderColor: confirm.length > 0 ? (pwMatch ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)') : 'rgba(255,255,255,0.15)',
                  }}
                />
                {confirm.length > 0 && (
                  <p style={{ fontSize: 12, marginTop: 6, color: pwMatch ? '#4ade80' : '#f87171', fontFamily: "'DM Sans', sans-serif" }}>
                    {pwMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <LuxBtn
                color={churchColor}
                onClick={join}
                disabled={loading}
                style={{ width: '100%', fontSize: 15, padding: '14px 0', marginTop: 4 }}
              >
                {loading ? 'Creating account...' : `Join ${church.name}`}
              </LuxBtn>
            </div>
          </div>
        )}

        <p className="text-center mt-8" style={{ fontFamily: "'Cormorant Garamond', serif", fontStyle: 'italic', color: 'rgba(192,198,204,0.25)', fontSize: 13 }}>
          Floremus · We will flourish
        </p>
      </div>
    </div>
  );
}
// ── Live Points ────────────────────────────────────────────────────────────
function LivePoints({ userId, initialPoints, color }: { userId: string; initialPoints: number; color: string }) {
  const [points, setPoints] = useState(initialPoints);

  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await supabase.from('profiles').select('points').eq('id', userId).maybeSingle();
      if (data) setPoints(data.points || 0);
    }, 10000);
    return () => clearInterval(interval);
  }, [userId]);

  return (
    <span
      className="font-semibold"
      style={{ color: `${color}99`, fontFamily: "'DM Sans', sans-serif", fontSize: 12 }}
    >
      {points.toLocaleString()} pts
    </span>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState('home');
  const [moreSub, setMoreSub] = useState('menu');
  const [loading, setLoading] = useState(true);
  const [unreadDMs, setUnreadDMs] = useState(0);

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
          secondaryRole: profile.secondary_role || '',
          secondaryRole2: profile.secondary_role_2 || '',
          points: profile.points || 0,
          streak: profile.streak || 0,
          avatarUrl: profile.avatar_url || '',
          directoryOptIn: profile.directory_opt_in || false,
          bio: profile.bio || '',
          phone: profile.phone || '',
          birthday: profile.birthday || '',
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
            givingStripeLink: church.giving_stripe_link || '',
          },
        });
      }
    }

    // Streak tracking
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

  // Check unread DMs for notification badge
  async function checkUnreadDMs(userId: string, churchId: string) {
    const { count } = await supabase.from('direct_messages')
      .select('*', { count: 'exact', head: true })
      .eq('church_id', churchId)
      .eq('member_id', userId)
      .eq('is_from_admin', true)
      .eq('read', false);
    setUnreadDMs(count || 0);
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

  // OneSignal permission request
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

      // Check DMs on load
      checkUnreadDMs(user.id, user.church.id);

      // Poll for new DMs every 30 seconds
      const dmInterval = setInterval(() => {
        checkUnreadDMs(user.id, user.church.id);
      }, 30000);

      return () => clearInterval(dmInterval);
    }
  }, [user]);

  // Loading splash screen
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: `linear-gradient(160deg, ${BRAND.plum} 0%, #1a0535 100%)` }}
      >
        <div style={{ position: 'fixed', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(107,33,168,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="relative z-10 flex flex-col items-center gap-6">
          <FloremusLogo size={140} variant="silver" />
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: BRAND.purple,
                  animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                  opacity: 0.7,
                }}
              />
            ))}
          </div>
        </div>
        <style>{`@keyframes pulse { 0%,100%{transform:scale(0.8);opacity:0.4} 50%{transform:scale(1.2);opacity:1} }`}</style>
      </div>
    );
  }

  // ── Route: Church Registration ─────────────────────────────────────────
  if (window.location.pathname === '/ChurchRegistration') {
    return <ChurchRegistrationScreen />;
  }

  // ── Route: Login ───────────────────────────────────────────────────────
  if (window.location.pathname === '/login') {
  if (user) { window.location.href = '/app'; return null; }
  return <LoginScreen onLogin={(u) => { setUser(u); window.location.href = '/app'; }} />;
}

  // ── Route: Email Confirm ───────────────────────────────────────────────
  if (window.location.pathname === '/confirm') {
    return <EmailConfirmScreen />;
  }

  // ── Route: Reset Password ──────────────────────────────────────────────
  if (window.location.pathname === '/reset-password') {
    return <ResetPasswordScreen />;
  }

  // ── Route: Join ────────────────────────────────────────────────────────
  if (window.location.pathname.startsWith('/join/')) {
    const code = window.location.pathname.split('/join/')[1];
    return <JoinScreen code={code} />;
  }

  // ── Not logged in ──────────────────────────────────────────────────────
  if (!user) {
    window.location.href = '/login';
    return null;
  }

  // ── Grace period for past_due or payment_failed ────────────────────────
  if (
    user.church.subscriptionStatus === 'past_due' ||
    user.church.subscriptionStatus === 'payment_failed'
  ) {
    // Fetch the subscription failure date to calculate days remaining
    const gracePeriodKey = `grace_start_${user.church.id}`;
    const stored = localStorage.getItem(gracePeriodKey);
    if (!stored) {
      localStorage.setItem(gracePeriodKey, new Date().toISOString());
    }
    const graceStart = new Date(localStorage.getItem(gracePeriodKey) || new Date().toISOString());
    const msPerDay = 1000 * 60 * 60 * 24;
    const daysPassed = Math.floor((Date.now() - graceStart.getTime()) / msPerDay);
    const daysLeft = Math.max(0, 7 - daysPassed);

    if (daysLeft === 0) {
      return <PaywallScreen user={user} />;
    }

    return <GracePeriodScreen user={user} daysLeft={daysLeft} />;
  }

  // ── Full paywall for trial or inactive ─────────────────────────────────
  if (user.church.subscriptionStatus !== 'active') {
    return <PaywallScreen user={user} />;
  }

  // ── Main App ───────────────────────────────────────────────────────────
  const color = user.church.primaryColor;

  // Notification badge logic
  const communityBadge = unreadDMs > 0 && !isAdmin(user);
  const moreBadge = unreadDMs > 0 && !isAdmin(user);

  return (
    <div className="min-h-screen" style={{ backgroundColor: BRAND.bg }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { -webkit-tap-highlight-color: transparent; }
        input, textarea, select { font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div className="max-w-md mx-auto relative">

        {/* Top bar */}
        <div
          className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between"
          style={{
            background: 'rgba(255,255,255,0.96)',
            backdropFilter: 'blur(20px)',
            borderBottom: `1px solid ${color}12`,
            boxShadow: `0 2px 20px ${color}08`,
          }}
        >
          <div className="flex items-center gap-2.5">
            {user.church.logoUrl ? (
              <img
                src={user.church.logoUrl}
                alt="logo"
                className="rounded-full object-contain"
                style={{ width: 34, height: 34, border: `1.5px solid ${color}25` }}
              />
            ) : (
              <div
                className="flex items-center justify-center rounded-full font-bold text-white text-sm"
                style={{
                  width: 34,
                  height: 34,
                  background: `linear-gradient(135deg, ${color}, ${color}cc)`,
                  boxShadow: `0 2px 8px ${color}40`,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {user.church.logoInitials}
              </div>
            )}
            <div>
              <p
                className="font-bold text-gray-900 leading-tight"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16 }}
              >
                {user.church.name}
              </p>
              <p
                className="leading-none mt-0.5 italic"
                style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, color: `${color}80` }}
              >
                Floremus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <LivePoints userId={user.id} initialPoints={user.points} color={color} />
            <button
              onClick={() => {
                setMoreSub('profile');
                setTab('more');
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <Avatar url={user.avatarUrl} name={user.name || user.email} size={30} color={color} />
            </button>
            <button
              onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
              className="text-xs font-medium"
              style={{
                color: `${color}60`,
                background: `${color}08`,
                border: `1px solid ${color}15`,
                borderRadius: 8,
                padding: '4px 10px',
                fontFamily: "'DM Sans', sans-serif",
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        </div>

        {/* Screen content */}
        <div className="pb-20">
          {tab === 'home' && (
            <HomeScreen
              user={user}
              setActiveTab={(t) => {
                setTab(t);
                if (t !== 'more') setMoreSub('menu');
              }}
              setMoreSub={setMoreSub}
            />
          )}
          {tab === 'sunday' && <SundayScreen user={user} />}
          {tab === 'community' && <CommunityScreen user={user} />}
          {tab === 'groups' && <GroupsScreen user={user} />}
          {tab === 'more' && (
            <MoreScreen
              user={user}
              initialSub={moreSub}
              onSubChange={(s) => {
                setMoreSub(s);
                // Clear DM badge when user opens messages
                if (s === 'dm') setUnreadDMs(0);
              }}
            />
          )}
        </div>

        {/* Bottom navigation */}
        <BottomNav
          active={tab}
          setActive={(t) => {
            setTab(t);
            setMoreSub('menu');
          }}
          color={color}
          communityBadge={communityBadge}
          moreBadge={moreBadge}
        />
      </div>
    </div>
  );
}

export default App;
