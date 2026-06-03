import { useState, useEffect, useRef, useCallback } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";

// ─── Supabase Client ──────────────────────────────────────────────────────────
const supabase = createClient(
  "https://cjnzizyxjoqmmnksfitd.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqbnppenl4am9xbW1ua3NmaXRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg4MjcxODcsImV4cCI6MjA2NDQwMzE4N30.placeholder"
);

// ─── Brand Colors & Assets ────────────────────────────────────────────────────
const BRAND = {
  purple: "#6B21A8",
  dark: "#0F0620",
  sage: "#8FA382",
  silver: "#C0C6CC",
  bg: "#F9FAFB",
  logo: {
    silver: "https://cjnzizyxjoqmmnksfitd.supabase.co/storage/v1/object/public/church-logos/FloremusSilverLogo.png",
    noTagline: "https://cjnzizyxjoqmmnksfitd.supabase.co/storage/v1/object/public/church-logos/FloremusLogoNoTagline.png",
    withTagline: "https://cjnzizyxjoqmmnksfitd.supabase.co/storage/v1/object/public/church-logos/FloremusLogoWithTagline.png",
    seal: "https://cjnzizyxjoqmmnksfitd.supabase.co/storage/v1/object/public/church-logos/ChatGPT%20Image%20Jun%202,%202026,%2011_55_40%20PM.png",
  },
};

const STRIPE = {
  starter: "https://buy.stripe.com/28E8wPevd5si2P09aub3q00",
  growth: "https://buy.stripe.com/14AaEXdr94oedtE0DYb3q01",
  kingdom: "https://buy.stripe.com/7sY00j1Ir1c261c9aub3q02",
  enterprise: "mailto:enterprise@floremus.church",
  concierge: "https://buy.stripe.com/6oUcN5dr99IyfBMdqKb3q04",
};

// ─── Types ────────────────────────────────────────────────────────────────────
type Role = "super_admin" | "admin" | "group_leader" | "children_worker" | "member";

interface Profile {
  id: string;
  church_id: string;
  full_name: string;
  role: Role;
  points: number;
  streak: number;
  avatar_url: string | null;
  directory_opt_in: boolean;
  bio: string | null;
  phone: string | null;
}

interface Church {
  id: string;
  name: string;
  tagline: string | null;
  primary_color: string;
  secondary_color: string | null;
  logo_initials: string | null;
  logo_url: string | null;
  subscription_status: string;
  subscription_tier: string;
}

interface ChatMessage {
  id: string;
  church_id: string;
  profile_id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null };
}

interface PrayerRequest {
  id: string;
  church_id: string;
  profile_id: string;
  content: string;
  is_anonymous: boolean;
  prayer_count: number;
  created_at: string;
  profiles?: { full_name: string; avatar_url: string | null };
}

interface Event {
  id: string;
  church_id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  ends_at: string | null;
  created_by: string;
}

interface Announcement {
  id: string;
  church_id: string;
  title: string;
  body: string;
  created_at: string;
  created_by: string;
}

interface BusinessListing {
  id: string;
  church_id: string;
  profile_id: string;
  business_name: string;
  category: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  created_at: string;
}

interface Group {
  id: string;
  church_id: string;
  name: string;
  description: string | null;
  leader_id: string;
  member_count?: number;
}

interface SermonDraft {
  id: string;
  church_id: string;
  title: string;
  scripture: string | null;
  content: string;
  created_by: string;
  created_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isAdmin = (role: Role) => role === "super_admin" || role === "admin";
const isLeader = (role: Role) => isAdmin(role) || role === "group_leader";

function Avatar({ url, name, size = 36, color }: { url?: string | null; name: string; size?: number; color?: string }) {
  const initials = name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  if (url) {
    return (
      <img
        src={url}
        alt={name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color || BRAND.purple,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: size * 0.36,
        flexShrink: 0,
      }}
    >
      {initials}
    </div>
  );
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)",
      background: BRAND.purple, color: "#fff", padding: "10px 20px", borderRadius: 12,
      fontWeight: 600, fontSize: 14, zIndex: 9999, boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      maxWidth: "90vw", textAlign: "center",
    }}>
      {message}
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: BRAND.dark, gap: 24 }}>
      <img src={BRAND.logo.silver} alt="Floremus" style={{ width: 120, height: "auto" }} />
      <div style={{ width: 40, height: 40, border: `3px solid ${BRAND.silver}30`, borderTop: `3px solid ${BRAND.silver}`, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 1px 6px rgba(0,0,0,0.07)", ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, onClick, variant = "primary", style, disabled }: {
  children: React.ReactNode; onClick?: () => void; variant?: "primary" | "ghost" | "danger" | "outline";
  style?: React.CSSProperties; disabled?: boolean;
}) {
  const base: React.CSSProperties = { border: "none", borderRadius: 10, padding: "10px 20px", fontWeight: 700, fontSize: 14, cursor: disabled ? "not-allowed" : "pointer", transition: "opacity 0.2s", opacity: disabled ? 0.5 : 1, ...style };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: BRAND.purple, color: "#fff" },
    ghost: { background: "transparent", color: BRAND.purple },
    danger: { background: "#ef4444", color: "#fff" },
    outline: { background: "transparent", color: BRAND.purple, border: `2px solid ${BRAND.purple}` },
  };
  return <button style={{ ...base, ...variants[variant] }} onClick={onClick} disabled={disabled}>{children}</button>;
}

function Input({ label, value, onChange, type = "text", placeholder, multiline, rows = 3 }: {
  label?: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; multiline?: boolean; rows?: number;
}) {
  const shared: React.CSSProperties = {
    width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10,
    fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit",
    transition: "border-color 0.2s",
  };
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 13, fontWeight: 600, color: "#374151" }}>{label}</label>}
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...shared, resize: "vertical" }} />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} style={shared} />
      )}
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "reset">("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    const { error: e } = await supabase.auth.signInWithPassword({ email, password });
    if (e) setError(e.message);
    else onLogin();
    setLoading(false);
  };

  const handleReset = async () => {
    setLoading(true);
    setError("");
    const { error: e } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://floremus.vercel.app/reset-password",
    });
    if (e) setError(e.message);
    else setResetSent(true);
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: BRAND.dark, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <img src={BRAND.logo.withTagline} alt="Floremus" style={{ width: 200, height: "auto", marginBottom: 40 }} />
      <div style={{ width: "100%", maxWidth: 380, background: "#ffffff0f", borderRadius: 20, padding: 28, backdropFilter: "blur(12px)", border: "1px solid #ffffff15" }}>
        <h2 style={{ color: "#fff", margin: "0 0 20px", textAlign: "center", fontSize: 20 }}>
          {mode === "login" ? "Sign In" : "Reset Password"}
        </h2>
        {error && <div style={{ background: "#ef444420", color: "#fca5a5", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13 }}>{error}</div>}
        {resetSent ? (
          <p style={{ color: BRAND.silver, textAlign: "center", fontSize: 14 }}>Check your email for a password reset link.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <input
              type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ padding: "12px 16px", background: "#ffffff15", border: "1.5px solid #ffffff20", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none" }}
            />
            {mode === "login" && (
              <input
                type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                style={{ padding: "12px 16px", background: "#ffffff15", border: "1.5px solid #ffffff20", borderRadius: 10, color: "#fff", fontSize: 14, outline: "none" }}
              />
            )}
            <button
              onClick={mode === "login" ? handleLogin : handleReset}
              disabled={loading}
              style={{ padding: "13px", background: BRAND.purple, color: "#fff", border: "none", borderRadius: 10, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
            >
              {loading ? "..." : mode === "login" ? "Sign In" : "Send Reset Link"}
            </button>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "center", marginTop: 16 }}>
          <button
            onClick={() => { setMode(mode === "login" ? "reset" : "login"); setError(""); setResetSent(false); }}
            style={{ background: "none", border: "none", color: BRAND.silver, fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
          >
            {mode === "login" ? "Forgot password?" : "Back to sign in"}
          </button>
        </div>
      </div>
      <p style={{ color: `${BRAND.silver}60`, fontSize: 12, marginTop: 32 }}>Floremus · Let us flourish</p>
    </div>
  );
}

// ─── Home Screen ──────────────────────────────────────────────────────────────
function HomeScreen({ profile, church, showToast }: { profile: Profile; church: Church; showToast: (m: string) => void }) {
  const [devotionals, setDevotionals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDev, setNewDev] = useState({ title: "", scripture: "", body: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadDevotionals();
  }, []);

  const loadDevotionals = async () => {
    const { data } = await supabase
      .from("devotionals")
      .select("*, profiles(full_name, avatar_url)")
      .eq("church_id", profile.church_id)
      .order("created_at", { ascending: false })
      .limit(10);
    setDevotionals(data || []);
    setLoading(false);
  };

  const submitDev = async () => {
    if (!newDev.title || !newDev.body) return;
    await supabase.from("devotionals").insert({
      church_id: profile.church_id,
      created_by: profile.id,
      title: newDev.title,
      scripture: newDev.scripture,
      body: newDev.body,
    });
    setNewDev({ title: "", scripture: "", body: "" });
    setShowForm(false);
    showToast("Devotional posted!");
    loadDevotionals();
  };

  const prayFor = async (id: string, count: number) => {
    await supabase.from("devotionals").update({ prayer_count: count + 1 }).eq("id", id);
    loadDevotionals();
  };

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>Welcome back,</p>
            <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#111" }}>{profile.full_name.split(" ")[0]}</h2>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: BRAND.purple }}>{profile.points}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>pts</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#f59e0b" }}>🔥 {profile.streak}</div>
              <div style={{ fontSize: 11, color: "#6b7280" }}>day streak</div>
            </div>
          </div>
        </div>
      </div>

      {/* Church banner */}
      <Card style={{ background: `linear-gradient(135deg, ${church.primary_color || BRAND.purple}, #4c1d95)`, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {church.logo_url ? (
            <img src={church.logo_url} alt={church.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: "cover" }} />
          ) : (
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "#ffffff20", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 16 }}>
              {church.logo_initials || church.name[0]}
            </div>
          )}
          <div>
            <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>{church.name}</div>
            {church.tagline && <div style={{ color: "#ffffff90", fontSize: 12 }}>{church.tagline}</div>}
          </div>
        </div>
      </Card>

      {/* Devotionals */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Daily Word</h3>
        {isAdmin(profile.role) && (
          <Btn variant="ghost" onClick={() => setShowForm(!showForm)} style={{ fontSize: 13, padding: "6px 12px" }}>
            {showForm ? "Cancel" : "+ Post"}
          </Btn>
        )}
      </div>

      {showForm && (
        <Card style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Title" value={newDev.title} onChange={(v) => setNewDev({ ...newDev, title: v })} placeholder="Devotional title" />
          <Input label="Scripture" value={newDev.scripture} onChange={(v) => setNewDev({ ...newDev, scripture: v })} placeholder="e.g. John 3:16" />
          <Input label="Body" value={newDev.body} onChange={(v) => setNewDev({ ...newDev, body: v })} placeholder="Write the devotional..." multiline rows={5} />
          <Btn onClick={submitDev}>Post Devotional</Btn>
        </Card>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 32, color: "#9ca3af" }}>Loading...</div>
      ) : devotionals.length === 0 ? (
        <Card style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>No devotionals posted yet.</Card>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {devotionals.map((d) => (
            <Card key={d.id}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Avatar url={d.profiles?.avatar_url} name={d.profiles?.full_name || "?"} size={36} color={church.primary_color} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{d.profiles?.full_name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(d.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <h4 style={{ margin: "0 0 4px", fontSize: 16, fontWeight: 700 }}>{d.title}</h4>
              {d.scripture && <div style={{ fontSize: 12, color: BRAND.purple, fontWeight: 600, marginBottom: 8 }}>{d.scripture}</div>}
              <p style={{ margin: "0 0 12px", fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{d.body}</p>
              <button
                onClick={() => prayFor(d.id, d.prayer_count || 0)}
                style={{ background: "#f3e8ff", border: "none", borderRadius: 8, padding: "6px 14px", color: BRAND.purple, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                🙏 {d.prayer_count || 0} Praying
              </button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sunday Screen ────────────────────────────────────────────────────────────
function SundayScreen({ profile, church, showToast }: { profile: Profile; church: Church; showToast: (m: string) => void }) {
  const [tab, setTab] = useState<"notes" | "ai">("notes");
  const [notes, setNotes] = useState<any[]>([]);
  const [drafts, setDrafts] = useState<SermonDraft[]>([]);
  const [aiTab, setAiTab] = useState<"write" | "history">("write");
  const [aiInput, setAiInput] = useState({ title: "", scripture: "", theme: "", audience: "" });
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [noteForm, setNoteForm] = useState({ title: "", scripture: "", series: "", content: "" });
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [myNotes, setMyNotes] = useState<string>("");

  useEffect(() => {
    loadNotes();
    if (isAdmin(profile.role)) loadDrafts();
  }, []);

  const loadNotes = async () => {
    const { data } = await supabase
      .from("sermon_notes")
      .select("*")
      .eq("church_id", profile.church_id)
      .order("created_at", { ascending: false })
      .limit(5);
    setNotes(data || []);
  };

  const loadDrafts = async () => {
    const { data } = await supabase
      .from("sermon_drafts")
      .select("*")
      .eq("church_id", profile.church_id)
      .order("created_at", { ascending: false });
    setDrafts(data || []);
  };

  const postNote = async () => {
    if (!noteForm.title) return;
    await supabase.from("sermon_notes").insert({
      church_id: profile.church_id,
      created_by: profile.id,
      title: noteForm.title,
      scripture: noteForm.scripture,
      series: noteForm.series,
      content: noteForm.content,
    });
    setNoteForm({ title: "", scripture: "", series: "", content: "" });
    setShowNoteForm(false);
    showToast("Sermon notes posted!");
    loadNotes();
  };

  const generateSermon = async () => {
    if (!aiInput.title && !aiInput.theme) return;
    setAiLoading(true);
    setAiResult("");
    try {
      const prompt = `You are an experienced pastor and theologian. Generate a complete, powerful sermon outline for a church congregation.

Title: ${aiInput.title || "(generate a compelling title based on the theme)"}
Scripture: ${aiInput.scripture || "(choose an appropriate scripture)"}
Theme/Topic: ${aiInput.theme}
Audience: ${aiInput.audience || "general congregation"}

Please write:
1. A compelling sermon title (if not provided)
2. Key scripture with brief context
3. Introduction (hook the congregation)
4. 3 main points with sub-points and illustrations
5. Application for modern believers
6. A powerful closing call to action
7. Suggested closing prayer

Make this biblically sound, culturally relevant, and deeply pastoral.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map((b: any) => b.text || "").join("") || "Error generating sermon. Please try again.";
      setAiResult(text);

      // Save draft
      await supabase.from("sermon_drafts").insert({
        church_id: profile.church_id,
        created_by: profile.id,
        title: aiInput.title || aiInput.theme,
        scripture: aiInput.scripture,
        content: text,
      });
      loadDrafts();
    } catch {
      setAiResult("Failed to generate sermon. Check your connection and try again.");
    }
    setAiLoading(false);
  };

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <h2 style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 800 }}>Sunday</h2>

      {/* Tabs */}
      <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, marginBottom: 16, gap: 4 }}>
        {["notes", ...(isAdmin(profile.role) ? ["ai"] : [])].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            style={{
              flex: 1, border: "none", borderRadius: 8, padding: "8px 0",
              background: tab === t ? "#fff" : "transparent",
              fontWeight: 700, fontSize: 13, cursor: "pointer",
              color: tab === t ? BRAND.purple : "#6b7280",
              boxShadow: tab === t ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            }}
          >
            {t === "notes" ? "📖 Sermon Notes" : "✨ AI Sermon Assistant"}
          </button>
        ))}
      </div>

      {tab === "notes" && (
        <>
          {isAdmin(profile.role) && (
            <div style={{ marginBottom: 12 }}>
              <Btn onClick={() => setShowNoteForm(!showNoteForm)} style={{ width: "100%" }}>
                {showNoteForm ? "Cancel" : "+ Post Sermon Notes"}
              </Btn>
            </div>
          )}
          {showNoteForm && (
            <Card style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <Input label="Series" value={noteForm.series} onChange={(v) => setNoteForm({ ...noteForm, series: v })} placeholder="Series name" />
              <Input label="Sermon Title" value={noteForm.title} onChange={(v) => setNoteForm({ ...noteForm, title: v })} placeholder="Title" />
              <Input label="Scripture" value={noteForm.scripture} onChange={(v) => setNoteForm({ ...noteForm, scripture: v })} placeholder="e.g. Philippians 4:13" />
              <Input label="Sermon Content / Outline" value={noteForm.content} onChange={(v) => setNoteForm({ ...noteForm, content: v })} placeholder="Full outline or fill-in-the-blank..." multiline rows={6} />
              <Btn onClick={postNote}>Post Notes</Btn>
            </Card>
          )}

          {/* Member take-notes area */}
          <Card style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>📝 My Notes</div>
            <textarea
              value={myNotes}
              onChange={(e) => setMyNotes(e.target.value)}
              placeholder="Take notes as you listen..."
              rows={5}
              style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 14, boxSizing: "border-box", resize: "vertical", fontFamily: "inherit" }}
            />
          </Card>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {notes.map((n) => (
              <Card key={n.id}>
                {n.series && <div style={{ fontSize: 11, fontWeight: 700, color: BRAND.purple, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{n.series}</div>}
                <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 800 }}>{n.title}</h3>
                {n.scripture && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 10 }}>{n.scripture}</div>}
                <p style={{ margin: 0, fontSize: 14, color: "#374151", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{n.content}</p>
                <div style={{ marginTop: 10, fontSize: 11, color: "#9ca3af" }}>{new Date(n.created_at).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</div>
              </Card>
            ))}
            {notes.length === 0 && <Card style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>No sermon notes yet.</Card>}
          </div>
        </>
      )}

      {tab === "ai" && isAdmin(profile.role) && (
        <>
          <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, marginBottom: 16, gap: 4 }}>
            {["write", "history"].map((t) => (
              <button
                key={t}
                onClick={() => setAiTab(t as any)}
                style={{ flex: 1, border: "none", borderRadius: 8, padding: "8px 0", background: aiTab === t ? "#fff" : "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", color: aiTab === t ? BRAND.purple : "#6b7280" }}
              >
                {t === "write" ? "Write New" : "Saved Drafts"}
              </button>
            ))}
          </div>

          {aiTab === "write" && (
            <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ textAlign: "center", marginBottom: 4 }}>
                <div style={{ fontSize: 28 }}>✨</div>
                <div style={{ fontWeight: 800, fontSize: 17 }}>AI Sermon Assistant</div>
                <div style={{ fontSize: 13, color: "#6b7280" }}>Generate a full sermon outline powered by AI</div>
              </div>
              <Input label="Sermon Title (optional)" value={aiInput.title} onChange={(v) => setAiInput({ ...aiInput, title: v })} placeholder="Leave blank to auto-generate" />
              <Input label="Scripture Reference" value={aiInput.scripture} onChange={(v) => setAiInput({ ...aiInput, scripture: v })} placeholder="e.g. Romans 8:28" />
              <Input label="Theme or Topic *" value={aiInput.theme} onChange={(v) => setAiInput({ ...aiInput, theme: v })} placeholder="e.g. trusting God in hard times" />
              <Input label="Audience" value={aiInput.audience} onChange={(v) => setAiInput({ ...aiInput, audience: v })} placeholder="e.g. general congregation, young adults..." />
              <Btn onClick={generateSermon} disabled={aiLoading} style={{ width: "100%", padding: "13px" }}>
                {aiLoading ? "Generating..." : "Generate Sermon"}
              </Btn>
              {aiResult && (
                <div style={{ background: "#f9fafb", borderRadius: 10, padding: 16, marginTop: 4 }}>
                  <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>Generated Sermon</div>
                  <pre style={{ whiteSpace: "pre-wrap", fontSize: 13, color: "#374151", fontFamily: "inherit", lineHeight: 1.7, margin: 0 }}>{aiResult}</pre>
                  <Btn onClick={() => showToast("Saved to drafts!")} style={{ marginTop: 12 }} variant="outline">Save to Drafts</Btn>
                </div>
              )}
            </Card>
          )}

          {aiTab === "history" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {drafts.map((d) => (
                <Card key={d.id}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{d.title}</div>
                  {d.scripture && <div style={{ fontSize: 12, color: BRAND.purple, marginBottom: 8 }}>{d.scripture}</div>}
                  <p style={{ margin: 0, fontSize: 13, color: "#374151", lineHeight: 1.6, maxHeight: 100, overflow: "hidden" }}>{d.content}</p>
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>{new Date(d.created_at).toLocaleDateString()}</div>
                </Card>
              ))}
              {drafts.length === 0 && <Card style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>No drafts yet.</Card>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Community Screen ─────────────────────────────────────────────────────────
function CommunityScreen({ profile, church, showToast }: { profile: Profile; church: Church; showToast: (m: string) => void }) {
  const [tab, setTab] = useState<"prayer" | "chat">("prayer");
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [prayerText, setPrayerText] = useState("");
  const [isAnon, setIsAnon] = useState(false);
  const [chatText, setChatText] = useState("");
  const channelRef = useRef<RealtimeChannel | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadPrayers();
    loadMessages();
    // Realtime chat
    channelRef.current = supabase
      .channel(`church_chat_${profile.church_id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `church_id=eq.${profile.church_id}` }, (payload) => {
        setMessages((prev) => [...prev, payload.new as ChatMessage]);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();
    return () => { channelRef.current?.unsubscribe(); };
  }, []);

  const loadPrayers = async () => {
    const { data } = await supabase
      .from("prayer_requests")
      .select("*, profiles(full_name, avatar_url)")
      .eq("church_id", profile.church_id)
      .order("created_at", { ascending: false })
      .limit(20);
    setPrayers(data || []);
  };

  const loadMessages = async () => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*, profiles(full_name, avatar_url)")
      .eq("church_id", profile.church_id)
      .order("created_at", { ascending: true })
      .limit(50);
    setMessages(data || []);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const postPrayer = async () => {
    if (!prayerText.trim()) return;
    await supabase.from("prayer_requests").insert({
      church_id: profile.church_id,
      profile_id: profile.id,
      content: prayerText,
      is_anonymous: isAnon,
      prayer_count: 0,
    });
    setPrayerText("");
    showToast("Prayer request submitted 🙏");
    loadPrayers();
  };

  const prayFor = async (id: string, count: number) => {
    await supabase.from("prayer_requests").update({ prayer_count: count + 1 }).eq("id", id);
    loadPrayers();
  };

  const sendMessage = async () => {
    if (!chatText.trim()) return;
    const content = chatText;
    setChatText("");
    await supabase.from("chat_messages").insert({
      church_id: profile.church_id,
      profile_id: profile.id,
      content,
    });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
      <div style={{ padding: "16px 16px 0" }}>
        <h2 style={{ margin: "0 0 16px", fontSize: 22, fontWeight: 800 }}>Community</h2>
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, marginBottom: 16, gap: 4 }}>
          {(["prayer", "chat"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ flex: 1, border: "none", borderRadius: 8, padding: "8px 0", background: tab === t ? "#fff" : "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", color: tab === t ? BRAND.purple : "#6b7280" }}
            >
              {t === "prayer" ? "🙏 Prayer Wall" : "💬 Live Chat"}
            </button>
          ))}
        </div>
      </div>

      {tab === "prayer" && (
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 80px" }}>
          <Card style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 10 }}>
            <textarea
              value={prayerText}
              onChange={(e) => setPrayerText(e.target.value)}
              placeholder="Share a prayer request with your church family..."
              rows={3}
              style={{ width: "100%", border: "1.5px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 14, boxSizing: "border-box", resize: "none", fontFamily: "inherit" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#6b7280", cursor: "pointer" }}>
                <input type="checkbox" checked={isAnon} onChange={(e) => setIsAnon(e.target.checked)} />
                Post anonymously
              </label>
              <Btn onClick={postPrayer} style={{ padding: "8px 16px", fontSize: 13 }}>Submit</Btn>
            </div>
          </Card>
          {prayers.map((p) => (
            <Card key={p.id} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Avatar url={p.is_anonymous ? null : p.profiles?.avatar_url} name={p.is_anonymous ? "A" : (p.profiles?.full_name || "?")} size={34} color={church.primary_color} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{p.is_anonymous ? "Anonymous" : p.profiles?.full_name}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(p.created_at).toLocaleDateString()}</div>
                </div>
              </div>
              <p style={{ margin: "0 0 10px", fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{p.content}</p>
              <button
                onClick={() => prayFor(p.id, p.prayer_count)}
                style={{ background: "#f3e8ff", border: "none", borderRadius: 8, padding: "6px 14px", color: BRAND.purple, fontWeight: 600, fontSize: 13, cursor: "pointer" }}
              >
                🙏 {p.prayer_count} Praying
              </button>
            </Card>
          ))}
        </div>
      )}

      {tab === "chat" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
            {messages.map((m, i) => {
              const isMe = m.profile_id === profile.id;
              return (
                <div key={m.id || i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 10 }}>
                  {!isMe && <Avatar url={m.profiles?.avatar_url} name={m.profiles?.full_name || "?"} size={30} color={church.primary_color} />}
                  <div style={{ maxWidth: "70%", marginLeft: isMe ? 0 : 8, marginRight: isMe ? 0 : 0 }}>
                    {!isMe && <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2, marginLeft: 4 }}>{m.profiles?.full_name}</div>}
                    <div style={{ background: isMe ? BRAND.purple : "#f3f4f6", color: isMe ? "#fff" : "#111", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px", fontSize: 14, lineHeight: 1.5 }}>
                      {m.content}
                    </div>
                    <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2, textAlign: isMe ? "right" : "left", marginLeft: isMe ? 0 : 4 }}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={chatBottomRef} />
          </div>
          <div style={{ padding: "10px 16px 80px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Type a message..."
              style={{ flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 22, padding: "10px 16px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
            />
            <button
              onClick={sendMessage}
              style={{ width: 42, height: 42, borderRadius: "50%", background: BRAND.purple, border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Groups Screen ────────────────────────────────────────────────────────────
function GroupsScreen({ profile, church, showToast }: { profile: Profile; church: Church; showToast: (m: string) => void }) {
  const [tab, setTab] = useState<"groups" | "leaderboard">("groups");
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupMessages, setGroupMessages] = useState<ChatMessage[]>([]);
  const [chatText, setChatText] = useState("");
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", description: "" });
  const channelRef = useRef<RealtimeChannel | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadGroups();
    loadLeaderboard();
  }, []);

  useEffect(() => {
    if (!activeGroup) return;
    loadGroupMessages();
    channelRef.current = supabase
      .channel(`group_chat_${activeGroup.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `group_id=eq.${activeGroup.id}` }, (payload) => {
        setGroupMessages((prev) => [...prev, payload.new as ChatMessage]);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      })
      .subscribe();
    return () => { channelRef.current?.unsubscribe(); };
  }, [activeGroup]);

  const loadGroups = async () => {
    const { data } = await supabase
      .from("groups")
      .select("*")
      .eq("church_id", profile.church_id)
      .order("name");
    setGroups(data || []);
  };

  const loadGroupMessages = async () => {
    if (!activeGroup) return;
    const { data } = await supabase
      .from("chat_messages")
      .select("*, profiles(full_name, avatar_url)")
      .eq("group_id", activeGroup.id)
      .order("created_at", { ascending: true })
      .limit(50);
    setGroupMessages(data || []);
    setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const loadLeaderboard = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("church_id", profile.church_id)
      .order("points", { ascending: false })
      .limit(20);
    setLeaderboard(data || []);
  };

  const sendGroupMessage = async () => {
    if (!chatText.trim() || !activeGroup) return;
    const content = chatText;
    setChatText("");
    await supabase.from("chat_messages").insert({
      church_id: profile.church_id,
      profile_id: profile.id,
      group_id: activeGroup.id,
      content,
    });
  };

  const createGroup = async () => {
    if (!newGroup.name) return;
    await supabase.from("groups").insert({
      church_id: profile.church_id,
      name: newGroup.name,
      description: newGroup.description,
      leader_id: profile.id,
    });
    setNewGroup({ name: "", description: "" });
    setShowCreateGroup(false);
    showToast("Group created!");
    loadGroups();
  };

  const joinGroup = async (groupId: string) => {
    await supabase.from("group_members").upsert({ group_id: groupId, profile_id: profile.id });
    showToast("Joined group!");
  };

  if (activeGroup) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
        <div style={{ padding: "16px 16px 10px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setActiveGroup(null)} style={{ background: "none", border: "none", fontSize: 22, cursor: "pointer", color: BRAND.purple }}>←</button>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16 }}>{activeGroup.name}</div>
            {activeGroup.description && <div style={{ fontSize: 12, color: "#6b7280" }}>{activeGroup.description}</div>}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px" }}>
          {groupMessages.map((m, i) => {
            const isMe = m.profile_id === profile.id;
            return (
              <div key={m.id || i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: 10 }}>
                {!isMe && <Avatar url={m.profiles?.avatar_url} name={m.profiles?.full_name || "?"} size={30} color={church.primary_color} />}
                <div style={{ maxWidth: "72%", marginLeft: isMe ? 0 : 8 }}>
                  {!isMe && <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 2, marginLeft: 4 }}>{m.profiles?.full_name}</div>}
                  <div style={{ background: isMe ? BRAND.purple : "#f3f4f6", color: isMe ? "#fff" : "#111", borderRadius: isMe ? "16px 16px 4px 16px" : "16px 16px 16px 4px", padding: "10px 14px", fontSize: 14 }}>
                    {m.content}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={chatBottomRef} />
        </div>
        <div style={{ padding: "10px 16px 80px", borderTop: "1px solid #e5e7eb", display: "flex", gap: 8 }}>
          <input
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendGroupMessage())}
            placeholder="Message the group..."
            style={{ flex: 1, border: "1.5px solid #e5e7eb", borderRadius: 22, padding: "10px 16px", fontSize: 14, outline: "none", fontFamily: "inherit" }}
          />
          <button
            onClick={sendGroupMessage}
            style={{ width: 42, height: 42, borderRadius: "50%", background: BRAND.purple, border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            ↑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Groups</h2>
        {isLeader(profile.role) && <Btn onClick={() => setShowCreateGroup(!showCreateGroup)} style={{ fontSize: 13, padding: "8px 14px" }}>+ New Group</Btn>}
      </div>

      <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, marginBottom: 16, gap: 4 }}>
        {(["groups", "leaderboard"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, border: "none", borderRadius: 8, padding: "8px 0", background: tab === t ? "#fff" : "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", color: tab === t ? BRAND.purple : "#6b7280" }}>
            {t === "groups" ? "👥 My Groups" : "🏆 Leaderboard"}
          </button>
        ))}
      </div>

      {showCreateGroup && (
        <Card style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Group Name" value={newGroup.name} onChange={(v) => setNewGroup({ ...newGroup, name: v })} placeholder="e.g. Men's Bible Study" />
          <Input label="Description" value={newGroup.description} onChange={(v) => setNewGroup({ ...newGroup, description: v })} placeholder="What is this group about?" />
          <Btn onClick={createGroup}>Create Group</Btn>
        </Card>
      )}

      {tab === "groups" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {groups.map((g) => (
            <Card key={g.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: `${church.primary_color || BRAND.purple}20`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}>👥</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{g.name}</div>
                  {g.description && <div style={{ fontSize: 12, color: "#6b7280" }}>{g.description}</div>}
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <Btn variant="outline" onClick={() => joinGroup(g.id)} style={{ fontSize: 12, padding: "6px 12px" }}>Join</Btn>
                <Btn onClick={() => setActiveGroup(g)} style={{ fontSize: 12, padding: "6px 12px" }}>Chat</Btn>
              </div>
            </Card>
          ))}
          {groups.length === 0 && <Card style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>No groups yet.</Card>}
        </div>
      )}

      {tab === "leaderboard" && (
        <div>
          {leaderboard.slice(0, 3).length > 0 && (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "flex-end", gap: 10, marginBottom: 20, padding: "10px 0" }}>
              {[leaderboard[1], leaderboard[0], leaderboard[2]].map((p, i) => {
                if (!p) return <div key={i} style={{ width: 70 }} />;
                const heights = [90, 110, 70];
                const medals = ["🥈", "🥇", "🥉"];
                const h = heights[i];
                return (
                  <div key={p.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 22 }}>{medals[i]}</div>
                    <Avatar url={p.avatar_url} name={p.full_name} size={i === 1 ? 52 : 42} color={church.primary_color} />
                    <div style={{ fontSize: 11, fontWeight: 700, textAlign: "center", maxWidth: 70 }}>{p.full_name.split(" ")[0]}</div>
                    <div style={{ width: 70, height: h, background: i === 1 ? (church.primary_color || BRAND.purple) : "#e5e7eb", borderRadius: "6px 6px 0 0", display: "flex", alignItems: "center", justifyContent: "center", color: i === 1 ? "#fff" : "#374151", fontWeight: 800, fontSize: 13 }}>
                      {p.points}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {leaderboard.map((p, i) => (
              <Card key={p.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
                <div style={{ width: 24, textAlign: "center", fontWeight: 800, color: i < 3 ? BRAND.purple : "#9ca3af", fontSize: 14 }}>#{i + 1}</div>
                <Avatar url={p.avatar_url} name={p.full_name} size={38} color={church.primary_color} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{p.full_name}</div>
                  <div style={{ fontSize: 12, color: "#6b7280" }}>🔥 {p.streak} day streak</div>
                </div>
                <div style={{ fontWeight: 800, color: BRAND.purple, fontSize: 16 }}>{p.points} pts</div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── More Screen ──────────────────────────────────────────────────────────────
function MoreScreen({ profile, church, showToast }: { profile: Profile; church: Church; showToast: (m: string) => void }) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const menuItems = [
    { id: "give", icon: "💳", label: "Give", roles: [] as Role[] },
    { id: "events", icon: "📅", label: "Events", roles: [] as Role[] },
    { id: "directory", icon: "📖", label: "Member Directory", roles: [] as Role[] },
    { id: "business", icon: "🏪", label: "Business Directory", roles: [] as Role[] },
    { id: "announcements", icon: "📢", label: "Announcements", roles: [] as Role[] },
    { id: "checkin", icon: "✅", label: "Check In", roles: [] as Role[] },
    { id: "children", icon: "👦", label: "Children Check-In", roles: [] as Role[] },
    { id: "profile", icon: "👤", label: "Profile", roles: [] as Role[] },
    { id: "admin", icon: "⚙️", label: "Admin Panel", roles: ["super_admin", "admin"] as Role[] },
    { id: "pricing", icon: "💎", label: "Pricing & Plans", roles: [] as Role[] },
  ].filter((item) => item.roles.length === 0 || item.roles.includes(profile.role));

  if (activeSection === "give") return <GiveSection profile={profile} church={church} onBack={() => setActiveSection(null)} showToast={showToast} />;
  if (activeSection === "events") return <EventsSection profile={profile} church={church} onBack={() => setActiveSection(null)} showToast={showToast} />;
  if (activeSection === "directory") return <MemberDirectorySection profile={profile} church={church} onBack={() => setActiveSection(null)} />;
  if (activeSection === "business") return <BusinessDirectorySection profile={profile} church={church} onBack={() => setActiveSection(null)} showToast={showToast} />;
  if (activeSection === "announcements") return <AnnouncementsSection profile={profile} church={church} onBack={() => setActiveSection(null)} showToast={showToast} />;
  if (activeSection === "checkin") return <CheckInSection profile={profile} church={church} onBack={() => setActiveSection(null)} showToast={showToast} />;
  if (activeSection === "children") return <ChildrenCheckInSection profile={profile} church={church} onBack={() => setActiveSection(null)} showToast={showToast} />;
  if (activeSection === "profile") return <ProfileSection profile={profile} church={church} onBack={() => setActiveSection(null)} showToast={showToast} />;
  if (activeSection === "admin") return <AdminSection profile={profile} church={church} onBack={() => setActiveSection(null)} showToast={showToast} />;
  if (activeSection === "pricing") return <PricingSection profile={profile} church={church} onBack={() => setActiveSection(null)} />;

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <h2 style={{ margin: "0 0 20px", fontSize: 22, fontWeight: 800 }}>More</h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {menuItems.map((item) => (
          <Card
            key={item.id}
            style={{ textAlign: "center", padding: "18px 12px", cursor: "pointer", transition: "box-shadow 0.2s" }}
            // @ts-ignore
            onClick={() => setActiveSection(item.id)}
          >
            <div style={{ fontSize: 30, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#374151" }}>{item.label}</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Give Section ─────────────────────────────────────────────────────────────
function GiveSection({ profile, church, onBack, showToast }: { profile: Profile; church: Church; onBack: () => void; showToast: (m: string) => void }) {
  const [amount, setAmount] = useState("");
  const [fund, setFund] = useState("General Fund");
  const [funds, setFunds] = useState<any[]>([]);
  const presets = [25, 50, 100, 150, 250, 500];

  useEffect(() => {
    supabase.from("giving_funds").select("*").eq("church_id", profile.church_id).then(({ data }) => setFunds(data || []));
  }, []);

  const handleGive = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    await supabase.from("giving_transactions").insert({
      church_id: profile.church_id,
      profile_id: profile.id,
      amount: amt,
      fund_name: fund,
      status: "pending",
    });
    showToast(`Thank you for giving $${amt.toFixed(2)}!`);
    setAmount("");
  };

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <BackHeader title="Give" onBack={onBack} />
      <Card style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 40 }}>💳</div>
          <h3 style={{ margin: "8px 0 4px", fontSize: 20 }}>Give to {church.name}</h3>
          <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>Every gift makes a difference</p>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Select Fund</label>
          <select
            value={fund}
            onChange={(e) => setFund(e.target.value)}
            style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, fontFamily: "inherit" }}
          >
            <option>General Fund</option>
            <option>Missions</option>
            <option>Building Fund</option>
            {funds.map((f) => <option key={f.id}>{f.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Amount</label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 10 }}>
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(String(p))}
                style={{ padding: "10px 0", border: `2px solid ${amount === String(p) ? BRAND.purple : "#e5e7eb"}`, borderRadius: 10, background: amount === String(p) ? `${BRAND.purple}10` : "#fff", fontWeight: 700, fontSize: 14, color: amount === String(p) ? BRAND.purple : "#374151", cursor: "pointer" }}
              >
                ${p}
              </button>
            ))}
          </div>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Or enter custom amount"
            style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, boxSizing: "border-box", fontFamily: "inherit" }}
          />
        </div>
        <Btn onClick={handleGive} style={{ width: "100%", padding: "14px", fontSize: 16 }} disabled={!amount}>
          Give ${amount ? parseFloat(amount).toFixed(2) : "0.00"}
        </Btn>
        <p style={{ textAlign: "center", fontSize: 11, color: "#9ca3af", margin: 0 }}>Secure giving powered by Stripe</p>
      </Card>
    </div>
  );
}

// ─── Events Section ───────────────────────────────────────────────────────────
function EventsSection({ profile, church, onBack, showToast }: { profile: Profile; church: Church; onBack: () => void; showToast: (m: string) => void }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", location: "", starts_at: "", ends_at: "" });

  useEffect(() => {
    supabase.from("events").select("*").eq("church_id", profile.church_id).gte("starts_at", new Date().toISOString()).order("starts_at").then(({ data }) => setEvents(data || []));
  }, []);

  const createEvent = async () => {
    if (!form.title || !form.starts_at) return;
    await supabase.from("events").insert({ ...form, church_id: profile.church_id, created_by: profile.id });
    setForm({ title: "", description: "", location: "", starts_at: "", ends_at: "" });
    setShowForm(false);
    showToast("Event created!");
    supabase.from("events").select("*").eq("church_id", profile.church_id).gte("starts_at", new Date().toISOString()).order("starts_at").then(({ data }) => setEvents(data || []));
  };

  const rsvp = async (eventId: string) => {
    await supabase.from("event_rsvps").upsert({ event_id: eventId, profile_id: profile.id, status: "attending" });
    showToast("RSVP confirmed!");
  };

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <BackHeader title="Events" onBack={onBack} />
      {isAdmin(profile.role) && (
        <Btn onClick={() => setShowForm(!showForm)} style={{ width: "100%", marginBottom: 16 }}>
          {showForm ? "Cancel" : "+ Add Event"}
        </Btn>
      )}
      {showForm && (
        <Card style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Event Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Title" />
          <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Details..." multiline rows={3} />
          <Input label="Location" value={form.location} onChange={(v) => setForm({ ...form, location: v })} placeholder="Location or link" />
          <Input label="Start Date & Time" value={form.starts_at} onChange={(v) => setForm({ ...form, starts_at: v })} type="datetime-local" />
          <Input label="End Date & Time" value={form.ends_at} onChange={(v) => setForm({ ...form, ends_at: v })} type="datetime-local" />
          <Btn onClick={createEvent}>Create Event</Btn>
        </Card>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {events.map((e) => (
          <Card key={e.id}>
            <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
              <div style={{ minWidth: 50, textAlign: "center", background: `${church.primary_color || BRAND.purple}10`, borderRadius: 10, padding: "8px 6px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: church.primary_color || BRAND.purple, textTransform: "uppercase" }}>{new Date(e.starts_at).toLocaleDateString("en-US", { month: "short" })}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#111" }}>{new Date(e.starts_at).getDate()}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{e.title}</div>
                {e.location && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 2 }}>📍 {e.location}</div>}
                <div style={{ fontSize: 12, color: "#6b7280" }}>⏰ {new Date(e.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                {e.description && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#374151" }}>{e.description}</p>}
              </div>
            </div>
            <Btn onClick={() => rsvp(e.id)} variant="outline" style={{ marginTop: 12, width: "100%", fontSize: 13 }}>RSVP</Btn>
          </Card>
        ))}
        {events.length === 0 && <Card style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>No upcoming events.</Card>}
      </div>
    </div>
  );
}

// ─── Member Directory ─────────────────────────────────────────────────────────
function MemberDirectorySection({ profile, church, onBack }: { profile: Profile; church: Church; onBack: () => void }) {
  const [members, setMembers] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    supabase.from("profiles").select("*").eq("church_id", profile.church_id).eq("directory_opt_in", true).order("full_name").then(({ data }) => setMembers(data || []));
  }, []);

  const filtered = members.filter((m) => m.full_name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <BackHeader title="Member Directory" onBack={onBack} />
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search members..."
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, boxSizing: "border-box", marginBottom: 14, fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((m) => (
          <Card key={m.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px" }}>
            <Avatar url={m.avatar_url} name={m.full_name} size={42} color={church.primary_color} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{m.full_name}</div>
              <div style={{ fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>{m.role.replace("_", " ")}</div>
              {m.bio && <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>{m.bio}</div>}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <Card style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>No members found.</Card>}
      </div>
    </div>
  );
}

// ─── Business Directory ───────────────────────────────────────────────────────
function BusinessDirectorySection({ profile, church, onBack, showToast }: { profile: Profile; church: Church; onBack: () => void; showToast: (m: string) => void }) {
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ business_name: "", category: "", description: "", phone: "", website: "" });
  const [search, setSearch] = useState("");

  useEffect(() => { loadListings(); }, []);

  const loadListings = () => {
    supabase.from("business_listings").select("*, profiles(full_name)").eq("church_id", profile.church_id).order("business_name").then(({ data }) => setListings(data || []));
  };

  const submitListing = async () => {
    if (!form.business_name || !form.category) return;
    await supabase.from("business_listings").insert({ ...form, church_id: profile.church_id, profile_id: profile.id });
    setForm({ business_name: "", category: "", description: "", phone: "", website: "" });
    setShowForm(false);
    showToast("Business listed!");
    loadListings();
  };

  const filtered = listings.filter((l) => l.business_name.toLowerCase().includes(search.toLowerCase()) || l.category.toLowerCase().includes(search.toLowerCase()));
  const categories = [...new Set(listings.map((l) => l.category))];

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <BackHeader title="Business Directory" onBack={onBack} />
      <Btn onClick={() => setShowForm(!showForm)} style={{ width: "100%", marginBottom: 14 }}>
        {showForm ? "Cancel" : "+ List My Business"}
      </Btn>
      {showForm && (
        <Card style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 12 }}>
          <Input label="Business Name" value={form.business_name} onChange={(v) => setForm({ ...form, business_name: v })} placeholder="Business name" />
          <Input label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="e.g. Plumbing, Design, Coaching" />
          <Input label="Description" value={form.description} onChange={(v) => setForm({ ...form, description: v })} placeholder="Brief description..." multiline rows={3} />
          <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Phone number" type="tel" />
          <Input label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://..." />
          <Btn onClick={submitListing}>Submit Listing</Btn>
        </Card>
      )}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search businesses..."
        style={{ width: "100%", padding: "10px 14px", border: "1.5px solid #e5e7eb", borderRadius: 10, fontSize: 14, boxSizing: "border-box", marginBottom: 14, fontFamily: "inherit" }}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map((l) => (
          <Card key={l.id}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{l.business_name}</div>
                <div style={{ fontSize: 11, background: `${church.primary_color || BRAND.purple}15`, color: church.primary_color || BRAND.purple, borderRadius: 6, padding: "2px 8px", display: "inline-block", marginTop: 4, fontWeight: 600 }}>{l.category}</div>
              </div>
              {(l as any).profiles?.full_name && <div style={{ fontSize: 11, color: "#9ca3af" }}>{(l as any).profiles.full_name}</div>}
            </div>
            {l.description && <p style={{ margin: "8px 0 0", fontSize: 13, color: "#374151" }}>{l.description}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
              {l.phone && <a href={`tel:${l.phone}`} style={{ fontSize: 13, color: BRAND.purple, fontWeight: 600, textDecoration: "none" }}>📞 {l.phone}</a>}
              {l.website && <a href={l.website} target="_blank" rel="noreferrer" style={{ fontSize: 13, color: BRAND.purple, fontWeight: 600, textDecoration: "none" }}>🌐 Website</a>}
            </div>
          </Card>
        ))}
        {filtered.length === 0 && <Card style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>No listings found.</Card>}
      </div>
    </div>
  );
}

// ─── Announcements ────────────────────────────────────────────────────────────
function AnnouncementsSection({ profile, church, onBack, showToast }: { profile: Profile; church: Church; onBack: () => void; showToast: (m: string) => void }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", body: "" });

  useEffect(() => { load(); }, []);

  const load = () => {
    supabase.from("announcements").select("*").eq("church_id", profile.church_id).order("created_at", { ascending: false }).then(({ data }) => setAnnouncements(data || []));
  };

  const post = async () => {
    if (!form.title || !form.body) return;
    await supabase.from("announcements").insert({ ...form, church_id: profile.church_id, created_by: profile.id });
    setForm({ title: "", body: "" });
    setShowForm(false);
    showToast("Announcement posted!");
    load();
  };

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <BackHeader title="Announcements" onBack={onBack} />
      {isAdmin(profile.role) && (
        <>
          <Btn onClick={() => setShowForm(!showForm)} style={{ width: "100%", marginBottom: 14 }}>
            {showForm ? "Cancel" : "+ Post Announcement"}
          </Btn>
          {showForm && (
            <Card style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 12 }}>
              <Input label="Title" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Announcement title" />
              <Input label="Message" value={form.body} onChange={(v) => setForm({ ...form, body: v })} placeholder="Details..." multiline rows={4} />
              <Btn onClick={post}>Post</Btn>
            </Card>
          )}
        </>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {announcements.map((a) => (
          <Card key={a.id} style={{ borderLeft: `4px solid ${church.primary_color || BRAND.purple}` }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{a.title}</div>
            <p style={{ margin: "0 0 8px", fontSize: 14, color: "#374151", lineHeight: 1.6 }}>{a.body}</p>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{new Date(a.created_at).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</div>
          </Card>
        ))}
        {announcements.length === 0 && <Card style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>No announcements.</Card>}
      </div>
    </div>
  );
}

// ─── Check In ─────────────────────────────────────────────────────────────────
function CheckInSection({ profile, church, onBack, showToast }: { profile: Profile; church: Church; onBack: () => void; showToast: (m: string) => void }) {
  const [checkedIn, setCheckedIn] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);

  useEffect(() => { loadAttendance(); }, []);

  const loadAttendance = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data: myCheck } = await supabase.from("attendance").select("*").eq("profile_id", profile.id).gte("checked_in_at", today).limit(1);
    setCheckedIn((myCheck || []).length > 0);
    const { count } = await supabase.from("attendance").select("*", { count: "exact" }).eq("church_id", profile.church_id).gte("checked_in_at", today);
    setTodayCount(count || 0);
    const { data: recent } = await supabase.from("attendance").select("*, profiles(full_name, avatar_url)").eq("church_id", profile.church_id).gte("checked_in_at", today).order("checked_in_at", { ascending: false }).limit(10);
    setRecentAttendance(recent || []);
  };

  const checkIn = async () => {
    if (checkedIn) return;
    await supabase.from("attendance").insert({ church_id: profile.church_id, profile_id: profile.id, checked_in_at: new Date().toISOString() });
    await supabase.from("profiles").update({ points: profile.points + 10, streak: profile.streak + 1 }).eq("id", profile.id);
    setCheckedIn(true);
    showToast("Checked in! +10 points 🙌");
    loadAttendance();
  };

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <BackHeader title="Check In" onBack={onBack} />
      <Card style={{ textAlign: "center", marginBottom: 16, padding: "32px 20px" }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>{checkedIn ? "✅" : "📋"}</div>
        <h3 style={{ margin: "0 0 8px", fontSize: 22 }}>{checkedIn ? "You're Checked In!" : "Check In Today"}</h3>
        <p style={{ margin: "0 0 20px", color: "#6b7280", fontSize: 14 }}>
          {checkedIn ? "Thanks for being here. God bless your time of worship." : "Let your church family know you're here today."}
        </p>
        <div style={{ fontSize: 16, fontWeight: 700, color: BRAND.purple, marginBottom: 20 }}>{todayCount} people checked in today</div>
        {!checkedIn && (
          <Btn onClick={checkIn} style={{ padding: "14px 40px", fontSize: 16, width: "100%" }}>
            Check In (+10 pts)
          </Btn>
        )}
      </Card>
      {recentAttendance.length > 0 && (
        <Card>
          <div style={{ fontWeight: 700, marginBottom: 12 }}>Who's Here Today</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {recentAttendance.map((a) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 6, background: "#f3f4f6", borderRadius: 20, padding: "4px 10px 4px 4px" }}>
                <Avatar url={a.profiles?.avatar_url} name={a.profiles?.full_name || "?"} size={24} color={church.primary_color} />
                <span style={{ fontSize: 12, fontWeight: 600 }}>{a.profiles?.full_name?.split(" ")[0]}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Children Check-In ────────────────────────────────────────────────────────
function ChildrenCheckInSection({ profile, church, onBack, showToast }: { profile: Profile; church: Church; onBack: () => void; showToast: (m: string) => void }) {
  const [tab, setTab] = useState<"checkin" | "manage">("checkin");
  const [form, setForm] = useState({ child_name: "", age: "", guardian_name: "", guardian_phone: "", room: "", allergies: "", notes: "" });
  const [records, setRecords] = useState<any[]>([]);
  const [pickupCode, setPickupCode] = useState("");
  const canManage = profile.role === "super_admin" || profile.role === "admin" || profile.role === "children_worker";

  useEffect(() => {
    if (canManage) loadRecords();
  }, []);

  const loadRecords = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("children_checkin").select("*").eq("church_id", profile.church_id).gte("checked_in_at", today).order("checked_in_at", { ascending: false });
    setRecords(data || []);
  };

  const checkInChild = async () => {
    if (!form.child_name || !form.guardian_name) return;
    const code = Math.random().toString(36).substring(2, 7).toUpperCase();
    await supabase.from("children_checkin").insert({
      church_id: profile.church_id,
      checked_in_by: profile.id,
      child_name: form.child_name,
      age: form.age ? parseInt(form.age) : null,
      guardian_name: form.guardian_name,
      guardian_phone: form.guardian_phone,
      room: form.room,
      allergies: form.allergies,
      notes: form.notes,
      pickup_code: code,
      checked_in_at: new Date().toISOString(),
      checked_out: false,
    });
    setPickupCode(code);
    showToast(`${form.child_name} checked in!`);
    setForm({ child_name: "", age: "", guardian_name: "", guardian_phone: "", room: "", allergies: "", notes: "" });
    if (canManage) loadRecords();
  };

  const checkOut = async (id: string) => {
    await supabase.from("children_checkin").update({ checked_out: true, checked_out_at: new Date().toISOString() }).eq("id", id);
    showToast("Child checked out safely!");
    loadRecords();
  };

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <BackHeader title="Children Check-In" onBack={onBack} />
      <div style={{ background: "#fef3c7", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 12, color: "#92400e", fontWeight: 600 }}>
        🔒 Child safety is our top priority. All check-ins are logged and require guardian verification at pickup.
      </div>

      {canManage && (
        <div style={{ display: "flex", background: "#f3f4f6", borderRadius: 10, padding: 4, marginBottom: 16, gap: 4 }}>
          {(["checkin", "manage"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ flex: 1, border: "none", borderRadius: 8, padding: "8px 0", background: tab === t ? "#fff" : "transparent", fontWeight: 700, fontSize: 13, cursor: "pointer", color: tab === t ? BRAND.purple : "#6b7280" }}>
              {t === "checkin" ? "Check In Child" : `Today's Roster (${records.filter(r => !r.checked_out).length})`}
            </button>
          ))}
        </div>
      )}

      {tab === "checkin" && (
        <>
          {pickupCode && (
            <Card style={{ textAlign: "center", marginBottom: 16, background: `${church.primary_color || BRAND.purple}10` }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#374151", marginBottom: 4 }}>Pickup Code</div>
              <div style={{ fontSize: 40, fontWeight: 900, letterSpacing: 6, color: church.primary_color || BRAND.purple }}>{pickupCode}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Show this code at pickup. Keep it safe.</div>
            </Card>
          )}
          <Card style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>Check In a Child</div>
            <Input label="Child's Full Name *" value={form.child_name} onChange={(v) => setForm({ ...form, child_name: v })} placeholder="First and last name" />
            <Input label="Age" value={form.age} onChange={(v) => setForm({ ...form, age: v })} placeholder="Age" type="number" />
            <Input label="Room / Class" value={form.room} onChange={(v) => setForm({ ...form, room: v })} placeholder="e.g. Nursery, K-2nd, 3rd-5th" />
            <Input label="Guardian's Name *" value={form.guardian_name} onChange={(v) => setForm({ ...form, guardian_name: v })} placeholder="Parent or guardian name" />
            <Input label="Guardian's Phone" value={form.guardian_phone} onChange={(v) => setForm({ ...form, guardian_phone: v })} placeholder="Phone number" type="tel" />
            <Input label="Allergies or Medical Notes" value={form.allergies} onChange={(v) => setForm({ ...form, allergies: v })} placeholder="None, or list any allergies..." />
            <Input label="Additional Notes" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="Custody notes, early pickup, etc." multiline rows={2} />
            <Btn onClick={checkInChild} style={{ width: "100%" }}>Check In Child</Btn>
          </Card>
        </>
      )}

      {tab === "manage" && canManage && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {records.map((r) => (
            <Card key={r.id} style={{ opacity: r.checked_out ? 0.6 : 1 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{r.child_name} {r.age && <span style={{ fontSize: 12, color: "#6b7280" }}>({r.age})</span>}</div>
                  {r.room && <div style={{ fontSize: 12, color: "#6b7280" }}>📍 {r.room}</div>}
                  <div style={{ fontSize: 12, color: "#6b7280" }}>👤 {r.guardian_name}{r.guardian_phone && ` · ${r.guardian_phone}`}</div>
                  {r.allergies && r.allergies !== "None" && <div style={{ fontSize: 12, color: "#ef4444", fontWeight: 600 }}>⚠️ {r.allergies}</div>}
                  <div style={{ fontSize: 12, background: "#f3f4f6", borderRadius: 6, padding: "2px 8px", marginTop: 4, display: "inline-block", fontWeight: 700, letterSpacing: 2 }}>{r.pickup_code}</div>
                </div>
                {!r.checked_out && (
                  <Btn onClick={() => checkOut(r.id)} variant="outline" style={{ fontSize: 12, padding: "6px 12px" }}>Check Out</Btn>
                )}
                {r.checked_out && <div style={{ fontSize: 12, color: "#22c55e", fontWeight: 700 }}>✓ Out</div>}
              </div>
            </Card>
          ))}
          {records.length === 0 && <Card style={{ textAlign: "center", color: "#9ca3af", padding: 32 }}>No children checked in today.</Card>}
        </div>
      )}
    </div>
  );
}

// ─── Profile Section ──────────────────────────────────────────────────────────
function ProfileSection({ profile, church, onBack, showToast }: { profile: Profile; church: Church; onBack: () => void; showToast: (m: string) => void }) {
  const [form, setForm] = useState({ full_name: profile.full_name, bio: profile.bio || "", phone: profile.phone || "", directory_opt_in: profile.directory_opt_in });
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const fileRef = useRef<HTMLInputElement>(null);

  const save = async () => {
    await supabase.from("profiles").update(form).eq("id", profile.id);
    showToast("Profile saved!");
  };

  const uploadAvatar = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${profile.id}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data } = supabase.storage.from("avatars").getPublicUrl(path);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("id", profile.id);
      setAvatarUrl(data.publicUrl);
      showToast("Profile photo updated!");
    }
    setUploading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <BackHeader title="Profile" onBack={onBack} />
      <Card style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <Avatar url={avatarUrl} name={profile.full_name} size={80} color={church.primary_color} />
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAvatar(f); }} />
          <Btn variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} style={{ fontSize: 12, padding: "6px 16px" }}>
            {uploading ? "Uploading..." : "Change Photo"}
          </Btn>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{profile.full_name}</div>
            <div style={{ fontSize: 13, color: "#6b7280", textTransform: "capitalize" }}>{profile.role.replace("_", " ")}</div>
            <div style={{ display: "flex", gap: 20, justifyContent: "center", marginTop: 8 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, color: BRAND.purple }}>{profile.points}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>points</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontWeight: 800, color: "#f59e0b" }}>🔥 {profile.streak}</div>
                <div style={{ fontSize: 11, color: "#9ca3af" }}>day streak</div>
              </div>
            </div>
          </div>
        </div>

        <Input label="Full Name" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
        <Input label="Bio" value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} placeholder="Tell your church family about yourself..." multiline rows={3} />
        <Input label="Phone" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Phone number" type="tel" />
        <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14 }}>
          <input type="checkbox" checked={form.directory_opt_in} onChange={(e) => setForm({ ...form, directory_opt_in: e.target.checked })} />
          <div>
            <div style={{ fontWeight: 600 }}>Show in Member Directory</div>
            <div style={{ fontSize: 12, color: "#6b7280" }}>Let other members see your profile</div>
          </div>
        </label>
        <Btn onClick={save} style={{ width: "100%" }}>Save Changes</Btn>
        <Btn onClick={signOut} variant="danger" style={{ width: "100%" }}>Sign Out</Btn>
      </Card>
    </div>
  );
}

// ─── Admin Panel ──────────────────────────────────────────────────────────────
function AdminSection({ profile, church, onBack, showToast }: { profile: Profile; church: Church; onBack: () => void; showToast: (m: string) => void }) {
  const [tab, setTab] = useState<"overview" | "members" | "branding">("overview");
  const [members, setMembers] = useState<Profile[]>([]);
  const [stats, setStats] = useState({ total: 0, checkins: 0 });
  const [branding, setBranding] = useState({ name: church.name, tagline: church.tagline || "", primary_color: church.primary_color });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadMembers();
    loadStats();
  }, []);

  const loadMembers = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("church_id", profile.church_id).order("full_name");
    setMembers(data || []);
    setStats((s) => ({ ...s, total: data?.length || 0 }));
  };

  const loadStats = async () => {
    const today = new Date().toISOString().split("T")[0];
    const { count } = await supabase.from("attendance").select("*", { count: "exact" }).eq("church_id", profile.church_id).gte("checked_in_at", today);
    setStats((s) => ({ ...s, checkins: count || 0 }));
  };

  const updateRole = async (memberId: string, role: Role) => {
    await supabase.from("profiles").update({ role }).eq("id", memberId);
    showToast("Role updated!");
    loadMembers();
  };

  const saveBranding = async () => {
    await supabase.from("churches").update({ name: branding.name, tagline: branding.tagline, primary_color: branding.primary_color }).eq("id", profile.church_id);
    if (logoFile) {
      const ext = logoFile.name.split(".").pop();
      const path = `${profile.church_id}/logo.${ext}`;
      const { error } = await supabase.storage.from("church-logos").upload(path, logoFile, { upsert: true });
      if (!error) {
        const { data } = supabase.storage.from("church-logos").getPublicUrl(path);
        await supabase.from("churches").update({ logo_url: data.publicUrl }).eq("id", profile.church_id);
      }
    }
    showToast("Branding saved!");
  };

  const colorOptions = ["#6B21A8", "#1d4ed8", "#047857", "#b91c1c", "#b45309", "#0e7490", "#374151", "#9d174d"];

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <BackHeader title="Admin Panel" onBack={onBack} />
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
        {(["overview", "members", "branding"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flexShrink: 0, border: "none", borderRadius: 20, padding: "7px 16px", background: tab === t ? BRAND.purple : "#f3f4f6", color: tab === t ? "#fff" : "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[
              { label: "Total Members", value: stats.total, icon: "👥" },
              { label: "Today's Check-Ins", value: stats.checkins, icon: "✅" },
              { label: "Subscription", value: church.subscription_tier || "Starter", icon: "💎" },
              { label: "Status", value: church.subscription_status || "Active", icon: "🟢" },
            ].map((s) => (
              <Card key={s.label} style={{ textAlign: "center", padding: "16px 10px" }}>
                <div style={{ fontSize: 28 }}>{s.icon}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: BRAND.purple, marginTop: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{s.label}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "members" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {members.map((m) => (
            <Card key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar url={m.avatar_url} name={m.full_name} size={38} color={church.primary_color} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{m.full_name}</div>
                <div style={{ fontSize: 11, color: "#6b7280" }}>🔥 {m.streak} | {m.points} pts</div>
              </div>
              <select
                value={m.role}
                onChange={(e) => updateRole(m.id, e.target.value as Role)}
                style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "4px 8px", fontSize: 12, fontFamily: "inherit" }}
              >
                <option value="member">Member</option>
                <option value="group_leader">Group Leader</option>
                <option value="children_worker">Children Worker</option>
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
            </Card>
          ))}
        </div>
      )}

      {tab === "branding" && (
        <Card style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Input label="Church Name" value={branding.name} onChange={(v) => setBranding({ ...branding, name: v })} />
          <Input label="Tagline" value={branding.tagline} onChange={(v) => setBranding({ ...branding, tagline: v })} placeholder="e.g. Where faith meets family" />
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Brand Color</label>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {colorOptions.map((c) => (
                <button
                  key={c}
                  onClick={() => setBranding({ ...branding, primary_color: c })}
                  style={{ width: 36, height: 36, borderRadius: "50%", background: c, border: branding.primary_color === c ? "3px solid #111" : "3px solid transparent", cursor: "pointer" }}
                />
              ))}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 8 }}>Church Logo</label>
            <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
            <Btn variant="outline" onClick={() => logoRef.current?.click()} style={{ fontSize: 13 }}>
              {logoFile ? `✓ ${logoFile.name}` : "Upload Logo"}
            </Btn>
          </div>
          <Btn onClick={saveBranding} style={{ width: "100%" }}>Save Branding</Btn>
        </Card>
      )}
    </div>
  );
}

// ─── Pricing Section ──────────────────────────────────────────────────────────
function PricingSection({ profile, church, onBack }: { profile: Profile; church: Church; onBack: () => void }) {
  const plans = [
    {
      name: "Starter",
      price: 69,
      description: "Perfect for small churches getting started",
      features: ["Up to 100 members", "Sermon Notes", "Community Feed", "Prayer Wall", "Events", "Basic Check-In"],
      link: STRIPE.starter,
      highlight: false,
    },
    {
      name: "Growth",
      price: 147,
      description: "For growing churches ready to go deeper",
      features: ["Up to 500 members", "Everything in Starter", "AI Sermon Assistant", "Groups & Group Chat", "Business Directory", "Leaderboard & Points"],
      link: STRIPE.growth,
      highlight: true,
    },
    {
      name: "Kingdom",
      price: 247,
      description: "Unlimited scale for thriving churches",
      features: ["Unlimited members", "Everything in Growth", "Children Check-In", "Advanced Admin", "Priority Support", "Custom Branding"],
      link: STRIPE.kingdom,
      highlight: false,
    },
    {
      name: "Enterprise",
      price: null,
      description: "Multi-campus and denominational solutions",
      features: ["Multiple campuses", "White-label options", "API access", "Dedicated support", "Custom integrations", "SLA guarantee"],
      link: STRIPE.enterprise,
      highlight: false,
    },
  ];

  return (
    <div style={{ padding: "16px 16px 80px" }}>
      <BackHeader title="Pricing & Plans" onBack={onBack} />
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div style={{ fontSize: 12, background: `${BRAND.purple}15`, color: BRAND.purple, borderRadius: 20, padding: "4px 14px", display: "inline-block", fontWeight: 700, marginBottom: 6 }}>
          Current Plan: {church.subscription_tier || "Starter"}
        </div>
        <h3 style={{ margin: "0 0 4px", fontSize: 22 }}>Upgrade Floremus</h3>
        <p style={{ margin: 0, color: "#6b7280", fontSize: 13 }}>Let your church flourish at every level</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
        {plans.map((plan) => (
          <Card
            key={plan.name}
            style={{
              border: plan.highlight ? `2px solid ${BRAND.purple}` : "2px solid transparent",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {plan.highlight && (
              <div style={{ position: "absolute", top: 0, right: 0, background: BRAND.purple, color: "#fff", fontSize: 10, fontWeight: 700, padding: "4px 12px", borderBottomLeftRadius: 10 }}>
                MOST POPULAR
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18 }}>{plan.name}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{plan.description}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                {plan.price ? (
                  <>
                    <div style={{ fontWeight: 900, fontSize: 26, color: BRAND.purple }}>${plan.price}</div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>/month</div>
                  </>
                ) : (
                  <div style={{ fontWeight: 800, fontSize: 18, color: BRAND.purple }}>Custom</div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
              {plan.features.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <span style={{ color: BRAND.purple, fontWeight: 700 }}>✓</span>
                  <span style={{ color: "#374151" }}>{f}</span>
                </div>
              ))}
            </div>
            <a href={plan.link} target="_blank" rel="noreferrer" style={{ display: "block", textAlign: "center", background: plan.highlight ? BRAND.purple : "transparent", color: plan.highlight ? "#fff" : BRAND.purple, border: `2px solid ${BRAND.purple}`, borderRadius: 10, padding: "11px 0", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
              {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
            </a>
          </Card>
        ))}
      </div>

      {/* Concierge Setup */}
      <Card style={{ background: `linear-gradient(135deg, ${BRAND.dark}, #2d1b69)`, textAlign: "center" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🎯</div>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 17, marginBottom: 4 }}>Concierge Setup</div>
        <div style={{ color: `${BRAND.silver}`, fontSize: 13, marginBottom: 16 }}>Let our team set up Floremus for your church — branded, configured, and ready to launch in 48 hours.</div>
        <a href={STRIPE.concierge} target="_blank" rel="noreferrer" style={{ display: "inline-block", background: BRAND.purple, color: "#fff", borderRadius: 10, padding: "11px 28px", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
          Book Concierge Setup
        </a>
      </Card>
    </div>
  );
}

// ─── Shared BackHeader ────────────────────────────────────────────────────────
function BackHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <button onClick={onBack} style={{ background: "none", border: "none", fontSize: 24, cursor: "pointer", color: BRAND.purple, display: "flex", alignItems: "center" }}>←</button>
      <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{title}</h2>
    </div>
  );
}

// ─── Bottom Nav ───────────────────────────────────────────────────────────────
function BottomNav({ active, onChange }: { active: string; onChange: (t: string) => void }) {
  const tabs = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "sunday", label: "Sunday", icon: "📖" },
    { id: "community", label: "Community", icon: "💬" },
    { id: "groups", label: "Groups", icon: "👥" },
    { id: "more", label: "More", icon: "⋯" },
  ];
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, height: 60,
      background: "#fff", borderTop: "1px solid #e5e7eb", display: "flex",
      zIndex: 100, paddingBottom: "env(safe-area-inset-bottom)",
    }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            flex: 1, border: "none", background: "none", cursor: "pointer",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            gap: 2, color: active === t.id ? BRAND.purple : "#9ca3af",
          }}
        >
          <span style={{ fontSize: 20 }}>{t.icon}</span>
          <span style={{ fontSize: 9, fontWeight: active === t.id ? 800 : 500 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────
function AppHeader({ church }: { church: Church }) {
  return (
    <div style={{
      position: "sticky", top: 0, background: BRAND.dark, zIndex: 50,
      padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <img src={BRAND.logo.silver} alt="Floremus" style={{ height: 28, width: "auto" }} />
      <div style={{ color: BRAND.silver, fontSize: 12, fontWeight: 600 }}>{church.name}</div>
    </div>
  );
}

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [church, setChurch] = useState<Church | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("home");
  const [toast, setToast] = useState("");

  const showToast = useCallback((msg: string) => setToast(msg), []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) loadProfile(session.user.id);
      else { setLoading(false); setProfile(null); setChurch(null); }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    setLoading(true);
    const { data: p } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (p) {
      setProfile(p);
      const { data: c } = await supabase.from("churches").select("*").eq("id", p.church_id).single();
      if (c) setChurch(c);
    }
    setLoading(false);
  };

  if (loading) return <LoadingSpinner />;
  if (!session) return <LoginScreen onLogin={() => {}} />;
  if (!profile || !church) return <LoadingSpinner />;

  const screenProps = { profile, church, showToast };

  return (
    <div style={{ background: BRAND.bg, minHeight: "100vh", maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <AppHeader church={church} />
      <div style={{ paddingBottom: 0 }}>
        {activeTab === "home" && <HomeScreen {...screenProps} />}
        {activeTab === "sunday" && <SundayScreen {...screenProps} />}
        {activeTab === "community" && <CommunityScreen {...screenProps} />}
        {activeTab === "groups" && <GroupsScreen {...screenProps} />}
        {activeTab === "more" && <MoreScreen {...screenProps} />}
      </div>
      <BottomNav active={activeTab} onChange={setActiveTab} />
      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}
