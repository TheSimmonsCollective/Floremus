import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

// ── Types ──────────────────────────────────────────────────────────────────
interface Church {
  id: string;
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  logoInitials: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'member';
  points: number;
  streak: number;
  church: Church;
}

// ── Demo Data ──────────────────────────────────────────────────────────────
const demoChurch: Church = {
  id: '1',
  name: 'Latter Rain Church Charlotte',
  tagline: 'Where the Spirit Falls',
  primaryColor: '#6B21A8',
  secondaryColor: '#C0C0C0',
  logoInitials: 'LR',
};

const demoUser: User = {
  id: '1',
  name: 'Pastor Charles Simmons',
  email: 'pastor@latterraincharlotte.com',
  role: 'super_admin',
  points: 1240,
  streak: 14,
  church: demoChurch,
};

// ── Login Screen ───────────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: (user: User) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email || !password) return;
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      alert(error.message);
    } else if (data.user) {
      onLogin(demoUser);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#0F0620' }}>
      <div className="w-full max-w-md px-8">
        <div className="text-center mb-10">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: demoChurch.primaryColor }}>
            <span className="text-white text-2xl font-bold">{demoChurch.logoInitials}</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">{demoChurch.name}</h1>
          <p className="text-gray-400 italic">{demoChurch.tagline}</p>
          <div className="mt-4 border-t border-gray-700 pt-4">
            <p className="text-yellow-500 text-sm font-semibold tracking-widest">FLOREMUS</p>
            <p className="text-gray-500 text-xs italic">Built for flourishing.</p>
          </div>
        </div>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleLogin}
            className="w-full py-3 rounded-lg font-bold text-white text-lg transition-all"
            style={{ backgroundColor: demoChurch.primaryColor }}>
            Sign In
          </button>
          <p className="text-center text-gray-500 text-sm">
            New to Floremus?{' '}
            <span className="text-purple-400 cursor-pointer">Request an invite</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Bottom Navigation ──────────────────────────────────────────────────────
function BottomNav({ active, setActive, color }: {
  active: string;
  setActive: (tab: string) => void;
  color: string;
}) {
  const tabs = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'sunday', label: 'Sunday', icon: '📖' },
    { id: 'community', label: 'Community', icon: '🙏' },
    { id: 'groups', label: 'Groups', icon: '👥' },
    { id: 'admin', label: 'Admin', icon: '⚙️' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className="flex-1 py-3 flex flex-col items-center gap-1 transition-all">
          <span className="text-xl">{tab.icon}</span>
          <span className="text-xs font-medium"
            style={{ color: active === tab.id ? color : '#9CA3AF' }}>
            {tab.label}
          </span>
          {active === tab.id && (
            <div className="w-1 h-1 rounded-full" style={{ backgroundColor: color }} />
          )}
        </button>
      ))}
    </div>
  );
}

// ── Home Screen ────────────────────────────────────────────────────────────
function HomeScreen({ user }: { user: User }) {
  return (
    <div className="p-4 space-y-4">
      <div className="rounded-xl p-5 text-white"
        style={{ backgroundColor: user.church.primaryColor }}>
        <p className="text-sm opacity-80">Good morning,</p>
        <h2 className="text-2xl font-bold">{user.name}</h2>
        <div className="flex gap-6 mt-3">
          <div>
            <p className="text-xs opacity-70">Points</p>
            <p className="text-xl font-bold">{user.points.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs opacity-70">Streak</p>
            <p className="text-xl font-bold">{user.streak} days 🔥</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3">Today at {user.church.name}</h3>
        <div className="space-y-3">
          {[
            { icon: '📖', title: "Today's Devotional", sub: 'Walking in the Spirit - Day 14' },
            { icon: '🙏', title: 'Prayer Wall', sub: '12 new prayer requests' },
            { icon: '⚡', title: 'Active Challenge', sub: '7-Day Prayer Fast - Day 3' },
            { icon: '📣', title: 'Announcements', sub: 'Youth Night this Friday at 7PM' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <span className="text-2xl">{item.icon}</span>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{item.title}</p>
                <p className="text-gray-500 text-xs">{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3">Upcoming Events</h3>
        <div className="space-y-2">
          {[
            { date: 'Jun 1', title: 'Sunday Service', time: '10:00 AM' },
            { date: 'Jun 3', title: 'Youth Night', time: '7:00 PM' },
            { date: 'Jun 7', title: 'Prayer & Fasting', time: '6:00 AM' },
          ].map((event, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex flex-col items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: user.church.primaryColor }}>
                {event.date.split(' ')[1]}
                <span className="text-xs opacity-80">{event.date.split(' ')[0]}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{event.title}</p>
                <p className="text-gray-500 text-xs">{event.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Sunday Screen ──────────────────────────────────────────────────────────
function SundayScreen({ user }: { user: User }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const notes = [
    { type: 'blank', label: 'The Holy Spirit was given to us as our ___', answer: 'Comforter' },
    { type: 'blank', label: 'We are called to walk in the ___ not in the flesh', answer: 'Spirit' },
    { type: 'reflection', label: 'What is one area of your life where you need to surrender to the Spirit today?' },
    { type: 'blank', label: 'The fruit of the Spirit is ___, joy, peace...', answer: 'Love' },
    { type: 'reflection', label: 'How will you apply today\'s message this week?' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold px-2 py-1 rounded-full text-white"
            style={{ backgroundColor: user.church.primaryColor }}>SERIES</span>
          <span className="text-xs text-gray-500">Walking in the Spirit</span>
        </div>
        <h2 className="text-xl font-bold text-gray-800">Life in the Spirit</h2>
        <p className="text-gray-500 text-sm">Galatians 5:16-25  |  Pastor Charles Simmons</p>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="bg-purple-50 border-l-4 p-3 rounded-r-lg mb-4"
          style={{ borderColor: user.church.primaryColor }}>
          <p className="text-xs font-semibold text-gray-500 mb-1">KEY VERSE</p>
          <p className="text-gray-800 text-sm italic">"Walk by the Spirit, and you will not gratify the desires of the flesh." - Galatians 5:16</p>
        </div>
        <h3 className="font-bold text-gray-800 mb-3">Sermon Notes</h3>
        <div className="space-y-4">
          {notes.map((note, i) => (
            <div key={i}>
              {note.type === 'blank' ? (
                <div>
                  <p className="text-sm text-gray-700 mb-1">{note.label}</p>
                  <input
                    type="text"
                    placeholder="Type your answer..."
                    value={answers[i] || ''}
                    onChange={e => setAnswers({ ...answers, [i]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400"
                  />
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-700 mb-1">{note.label}</p>
                  <textarea
                    placeholder="Write your reflection..."
                    value={answers[i] || ''}
                    onChange={e => setAnswers({ ...answers, [i]: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-400 h-20 resize-none"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        <button className="w-full mt-4 py-3 rounded-lg text-white font-bold"
          style={{ backgroundColor: user.church.primaryColor }}>
          Submit Notes (+50 points)
        </button>
      </div>
    </div>
  );
}

// ── Community Screen ───────────────────────────────────────────────────────
function CommunityScreen({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState('prayer');
  const [prayerText, setPrayerText] = useState('');

  const prayers = [
    { name: 'Sister Angela M.', text: 'Please pray for my mother\'s healing. She goes in for surgery on Thursday.', count: 24, time: '2 hours ago' },
    { name: 'Brother David K.', text: 'Believing God for a breakthrough in my finances this month.', count: 18, time: '4 hours ago' },
    { name: 'Minister Tanya R.', text: 'Pray for the youth ministry as we prepare for summer camp.', count: 31, time: '6 hours ago' },
  ];

  const challenges = [
    { title: '7-Day Prayer Fast', type: 'Streak', day: 3, total: 7, participants: 42, points: 200 },
    { title: 'Memorize Psalm 23', type: 'Achievement', deadline: 'Jun 15', participants: 28, points: 150 },
    { title: 'Church Outreach Drive', type: 'Community', goal: '100 meals', progress: 67, participants: 89, points: 100 },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="flex gap-2">
        {['prayer', 'challenges', 'devotional'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 py-2 rounded-lg text-sm font-semibold capitalize transition-all"
            style={{
              backgroundColor: activeTab === tab ? user.church.primaryColor : '#F3F4F6',
              color: activeTab === tab ? 'white' : '#6B7280'
            }}>
            {tab}
          </button>
        ))}
      </div>
      {activeTab === 'prayer' && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <textarea
              placeholder="Share a prayer request with your church..."
              value={prayerText}
              onChange={e => setPrayerText(e.target.value)}
              className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg px-3 py-2 h-20 resize-none focus:outline-none focus:border-purple-400"
            />
            <button className="mt-2 px-4 py-2 rounded-lg text-white text-sm font-semibold"
              style={{ backgroundColor: user.church.primaryColor }}>
              Post Prayer Request
            </button>
          </div>
          {prayers.map((p, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <p className="font-semibold text-gray-800 text-sm">{p.name}</p>
                <p className="text-xs text-gray-400">{p.time}</p>
              </div>
              <p className="text-gray-600 text-sm mb-3">{p.text}</p>
              <button className="flex items-center gap-2 text-sm font-semibold"
                style={{ color: user.church.primaryColor }}>
                🙏 Pray ({p.count})
              </button>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'challenges' && (
        <div className="space-y-3">
          {challenges.map((c, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-800">{c.title}</h3>
                <span className="text-xs px-2 py-1 rounded-full text-white"
                  style={{ backgroundColor: user.church.primaryColor }}>{c.type}</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">{c.participants} participants  |  {c.points} points</p>
              {c.type === 'Streak' && (
                <div className="flex gap-1">
            {Array.from({ length: c.total ?? 0 }).map((_, d) => (
                    <div key={d} className="flex-1 h-2 rounded-full"
                      style={{ backgroundColor: d < (c.day ?? 0) ? user.church.primaryColor : '#E5E7EB' }} />
                  ))}
                </div>
              )}
              {c.type === 'Community' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="h-2 rounded-full"
                    style={{ width: `${c.progress}%`, backgroundColor: user.church.primaryColor }} />
                </div>
              )}
              <button className="mt-3 w-full py-2 rounded-lg text-white text-sm font-semibold"
                style={{ backgroundColor: user.church.primaryColor }}>
                Join Challenge
              </button>
            </div>
          ))}
        </div>
      )}
      {activeTab === 'devotional' && (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex gap-2 overflow-x-auto">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
              <button key={i} className="flex-shrink-0 px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: i === 2 ? user.church.primaryColor : '#F3F4F6',
                  color: i === 2 ? 'white' : '#6B7280' }}>
                {day}
              </button>
            ))}
          </div>
          <h3 className="font-bold text-gray-800">Surrendered to the Spirit</h3>
          <p className="text-xs text-gray-500">Galatians 5:22-23</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            The fruit of the Spirit is not something we manufacture in our own strength. It is the natural overflow of a life surrendered to the Holy Spirit. Today, ask yourself: where are you striving in your own strength instead of yielding to God?
          </p>
          <div className="bg-purple-50 p-3 rounded-lg"
            style={{ borderLeft: `4px solid ${user.church.primaryColor}` }}>
            <p className="text-xs font-semibold text-gray-500 mb-1">REFLECTION</p>
            <p className="text-sm text-gray-700">What would it look like to fully surrender one area of your life to God today?</p>
          </div>
          <button className="w-full py-2 rounded-lg text-white text-sm font-semibold"
            style={{ backgroundColor: user.church.primaryColor }}>
            Mark as Read (+20 points)
          </button>
        </div>
      )}
    </div>
  );
}

// ── Groups Screen ──────────────────────────────────────────────────────────
function GroupsScreen({ user }: { user: User }) {
  const groups = [
    { name: 'Men of Valor', members: 18, leader: 'Deacon James T.', lastActive: '2 hours ago' },
    { name: 'Women of Purpose', members: 24, leader: 'Minister Sandra L.', lastActive: '1 hour ago' },
    { name: 'Young Adults Ministry', members: 31, leader: 'Minister Tanya R.', lastActive: '30 min ago' },
    { name: 'Intercessory Prayer Team', members: 12, leader: 'Elder Grace M.', lastActive: '3 hours ago' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3">My Groups</h3>
        <div className="space-y-3">
          {groups.map((g, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: user.church.primaryColor }}>
                  {g.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{g.name}</p>
                  <p className="text-xs text-gray-500">{g.members} members  |  {g.leader}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{g.lastActive}</p>
                <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">Active</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3">Leaderboard</h3>
        <div className="space-y-2">
          {[
            { rank: 1, name: 'Sister Angela M.', points: 2840, streak: 21 },
            { rank: 2, name: 'Minister Tanya R.', points: 2310, streak: 18 },
            { rank: 3, name: 'Pastor Charles S.', points: 1240, streak: 14 },
            { rank: 4, name: 'Brother David K.', points: 980, streak: 9 },
            { rank: 5, name: 'Elder Grace M.', points: 870, streak: 7 },
          ].map((member, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg"
              style={{ backgroundColor: i === 2 ? '#F5F3FF' : 'transparent' }}>
              <span className="w-6 text-center font-bold text-sm"
                style={{ color: i === 0 ? '#F59E0B' : i === 1 ? '#9CA3AF' : i === 2 ? user.church.primaryColor : '#D1D5DB' }}>
                {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : member.rank}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-gray-800 text-sm">{member.name}</p>
                <p className="text-xs text-gray-500">{member.streak} day streak 🔥</p>
              </div>
              <p className="font-bold text-sm" style={{ color: user.church.primaryColor }}>
                {member.points.toLocaleString()} pts
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Admin Screen ───────────────────────────────────────────────────────────
function AdminScreen({ user }: { user: User }) {
  const stats = [
    { label: 'Total Members', value: '187', icon: '👥' },
    { label: 'Active This Week', value: '134', icon: '⚡' },
    { label: 'Giving MTD', value: '$8,420', icon: '💳' },
    { label: 'Attendance', value: '156', icon: '📍' },
  ];

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-xl p-4 text-white"
        style={{ backgroundColor: user.church.primaryColor }}>
        <h2 className="text-lg font-bold mb-1">Admin Dashboard</h2>
        <p className="text-sm opacity-80">{user.church.name}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3">Pending Approvals</h3>
        <div className="space-y-2">
          {[
            { type: 'New Member', name: 'Marcus J.', time: '1 hour ago' },
            { type: 'Announcement', name: 'Youth Night Flyer', time: '2 hours ago' },
            { type: 'Business Listing', name: 'Grace Hair Studio', time: '3 hours ago' },
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-xs text-gray-500">{item.type}</p>
                <p className="font-semibold text-gray-800 text-sm">{item.name}</p>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 rounded-lg text-white text-xs font-semibold"
                  style={{ backgroundColor: user.church.primaryColor }}>Approve</button>
                <button className="px-3 py-1 rounded-lg bg-gray-200 text-gray-600 text-xs font-semibold">Decline</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <h3 className="font-bold text-gray-800 mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Post Devotional', icon: '📝' },
            { label: 'Send Notification', icon: '🔔' },
            { label: 'Add Challenge', icon: '⚡' },
            { label: 'View Reports', icon: '📊' },
          ].map((action, i) => (
            <button key={i} className="p-3 rounded-lg border border-gray-200 flex items-center gap-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <span>{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(demoUser);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setUser(demoUser);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0F0620' }}>
        <div className="text-center">
          <p className="text-yellow-500 text-xl font-bold">Floremus</p>
          <p className="text-gray-400 text-sm italic mt-1">Built for flourishing.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={setUser} />;
  }

  const renderScreen = () => {
    switch (activeTab) {
      case 'home': return <HomeScreen user={user} />;
      case 'sunday': return <SundayScreen user={user} />;
      case 'community': return <CommunityScreen user={user} />;
      case 'groups': return <GroupsScreen user={user} />;
      case 'admin': return <AdminScreen user={user} />;
      default: return <HomeScreen user={user} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto relative">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: user.church.primaryColor }}>
              {user.church.logoInitials}
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm leading-tight">{user.church.name}</p>
              <p className="text-xs text-yellow-600 italic">Floremus</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">{user.points} pts</span>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: user.church.primaryColor }}>
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
        <div className="pb-20">
          {renderScreen()}
        </div>
        <BottomNav
          active={activeTab}
          setActive={setActiveTab}
          color={user.church.primaryColor}
        />
      </div>
    </div>
  );
}

export default App;