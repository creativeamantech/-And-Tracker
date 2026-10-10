import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LoginScreen } from './components/LoginScreen';
import { VikaarGrid } from './components/VikaarGrid';
import { GoodDeedSection } from './components/GoodDeedSection';
import { UserReport } from './components/UserReport';
import { AdminReport } from './components/AdminReport';
import { User, VikaarName, GoodDeedEntry, DbStatus } from './types';
import { signInWithGoogle, getGoogleAccessToken } from './lib/firebase';
import { Database, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('vikaar_token')
  );
  const [user, setUser] = useState<User | null>(null);
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(getGoogleAccessToken());

  const [activeTab, setActiveTab] = useState<'tracker' | 'reports' | 'admin' | 'good-deeds'>('tracker');

  // Vikaar State
  const [todayCounts, setTodayCounts] = useState<Record<VikaarName, number>>({
    काम: 0,
    क्रोध: 0,
    लोभ: 0,
    मोह: 0,
    माया: 0,
    अहंकार: 0,
    ईर्ष्या: 0,
    डर: 0,
    घृणा: 0,
    आलस्य: 0,
  });
  const [overallCounts, setOverallCounts] = useState<Record<VikaarName, number>>({
    काम: 0,
    क्रोध: 0,
    लोभ: 0,
    मोह: 0,
    माया: 0,
    अहंकार: 0,
    ईर्ष्या: 0,
    डर: 0,
    घृणा: 0,
    आलस्य: 0,
  });
  const [totalToday, setTotalToday] = useState(0);
  const [totalOverall, setTotalOverall] = useState(0);
  const [dailyHistory, setDailyHistory] = useState<
    Record<string, { counts: Record<string, number>; total: number }>
  >({});
  const [loadingVikaar, setLoadingVikaar] = useState<VikaarName | null>(null);
  const [recentTaps, setRecentTaps] = useState<
    Array<{ vikaarName: string; timestamp: string }>
  >([]);

  // Good Deeds State
  const [goodDeeds, setGoodDeeds] = useState<GoodDeedEntry[]>([]);

  // Status banner notification
  const [syncNotice, setSyncNotice] = useState<string | null>(null);

  // Fetch DB Status
  const fetchDbStatus = async () => {
    try {
      const res = await fetch('/api/sheets/status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch (err) {
      console.warn('Failed to fetch DB status:', err);
    }
  };

  // Verify stored token on boot
  useEffect(() => {
    fetchDbStatus();

    if (token) {
      fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Session expired');
        })
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('vikaar_token');
          setToken(null);
          setUser(null);
        });
    }
  }, [token]);

  // Load user counts and good deeds when user is authenticated
  const loadUserData = async () => {
    if (!token) return;

    try {
      // 1. Fetch Vikaar counts
      const vikaarRes = await fetch('/api/vikaar/my-counts', {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(googleToken ? { 'X-Google-Token': googleToken } : {}),
        },
      });
      if (vikaarRes.ok) {
        const data = await vikaarRes.json();
        setTodayCounts(data.todayCounts);
        setOverallCounts(data.overallCounts);
        setTotalToday(data.totalToday);
        setTotalOverall(data.totalOverall);
        if (data.dailyHistory) {
          setDailyHistory(data.dailyHistory);
        }
      }

      // 2. Fetch Good deeds
      const deedRes = await fetch('/api/good-deeds/my-deeds', {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(googleToken ? { 'X-Google-Token': googleToken } : {}),
        },
      });
      if (deedRes.ok) {
        const data = await deedRes.json();
        setGoodDeeds(data.deeds);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    }
  };

  useEffect(() => {
    if (user && token) {
      loadUserData();
    }
  }, [user, token, googleToken]);

  // Handle Login
  const handleLogin = async (userId: string, pass: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password: pass }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'लॉग इन में विफलता');
    }

    localStorage.setItem('vikaar_token', data.token);
    setToken(data.token);
    setUser(data.user);
    if (data.user.role === 'Admin') {
      setActiveTab('admin');
    } else {
      setActiveTab('reports');
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('vikaar_token');
    setToken(null);
    setUser(null);
    setActiveTab('tracker');
  };

  // Connect Google Sheets OAuth
  const handleConnectGoogleSheets = async () => {
    try {
      const result = await signInWithGoogle();
      if (!result) {
        setSyncNotice('गूगल साइन-इन पॉपअप विंडो बंद कर दी गई थी।');
        setTimeout(() => setSyncNotice(null), 3000);
        return;
      }

      if (result.accessToken) {
        setGoogleToken(result.accessToken);

        const res = await fetch('/api/sheets/connect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Google-Token': result.accessToken,
          },
          body: JSON.stringify({ googleToken: result.accessToken }),
        });

        const data = await res.json();
        if (res.ok) {
          setSyncNotice('गूगल शीट्स डेटाबेस सफलतापूर्वक कनेक्ट और सिंक हो गया!');
          setTimeout(() => setSyncNotice(null), 4000);
          fetchDbStatus();
          if (token) loadUserData();
        } else {
          setSyncNotice(`गूगल शीट्स कनेक्शन में त्रुटि: ${data.error}`);
        }
      }
    } catch (err: any) {
      console.warn('Google Sheets Connect Attempt:', err);
      setSyncNotice('गूगल शीट्स कनेक्शन प्रक्रिया पूर्ण नहीं हो सकी।');
    }
  };

  // Handle Tap Vikaar
  const handleTapVikaar = async (name: VikaarName) => {
    if (!token) return;
    setLoadingVikaar(name);

    try {
      const res = await fetch('/api/vikaar/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(googleToken ? { 'X-Google-Token': googleToken } : {}),
        },
        body: JSON.stringify({ vikaarName: name }),
      });

      if (res.ok) {
        const data = await res.json();
        setTodayCounts(data.todayCounts);
        setTotalToday((prev) => prev + 1);
        setTotalOverall((prev) => prev + 1);

        setRecentTaps((prev) => [
          { vikaarName: name, timestamp: data.record.timestamp },
          ...prev,
        ]);
        fetchDbStatus();
      }
    } catch (err) {
      console.error('Tap failed:', err);
    } finally {
      setLoadingVikaar(null);
    }
  };

  // Handle Save Good Deed
  const handleSaveGoodDeed = async (text: string) => {
    if (!token) return;

    const res = await fetch('/api/good-deeds/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(googleToken ? { 'X-Google-Token': googleToken } : {}),
      },
      body: JSON.stringify({ text }),
    });

    if (res.ok) {
      const data = await res.json();
      setGoodDeeds((prev) => [data.deed, ...prev]);
      fetchDbStatus();
    } else {
      const data = await res.json();
      throw new Error(data.error || 'सत्कर्म सहेजने में त्रुटि');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-100/50 to-orange-50 font-sans text-gray-900 flex items-center justify-center p-4">
        <LoginScreen
          onLogin={handleLogin}
          dbStatus={dbStatus}
          onConnectGoogleSheets={handleConnectGoogleSheets}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-amber-100/30 to-orange-50 font-sans text-gray-900 pb-16">
      <Header
        user={user}
        dbStatus={dbStatus}
        onLogout={handleLogout}
        onConnectSheets={handleConnectGoogleSheets}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Sync notification bar */}
        {syncNotice && (
          <div className="bg-emerald-800 text-emerald-50 p-3 rounded-2xl shadow-lg flex items-center justify-between text-xs font-bold animate-fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              <span>{syncNotice}</span>
            </div>
            <button
              onClick={() => setSyncNotice(null)}
              className="text-emerald-200 hover:text-white"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'tracker' && (
          <VikaarGrid
            todayCounts={todayCounts}
            totalToday={totalToday}
            onTapVikaar={handleTapVikaar}
            loadingVikaar={loadingVikaar}
            recentTaps={recentTaps}
          />
        )}

        {activeTab === 'good-deeds' && (
          <GoodDeedSection deeds={goodDeeds} onSaveDeed={handleSaveGoodDeed} />
        )}

        {activeTab === 'reports' && (
          <UserReport
            todayCounts={todayCounts}
            overallCounts={overallCounts}
            totalToday={totalToday}
            totalOverall={totalOverall}
            goodDeeds={goodDeeds}
            dailyHistory={dailyHistory}
          />
        )}

        {activeTab === 'admin' && user.role === 'Admin' && token && (
          <AdminReport
            token={token}
            googleToken={googleToken}
            dbStatus={dbStatus}
            onRefreshStatus={fetchDbStatus}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-xs text-amber-900/60 py-6 border-t border-amber-200/60">
        <p>विकार एवं सत्कर्म ट्रैकर — आत्म-निरीक्षण और आध्यात्मिक विकास का साधन</p>
        <p className="mt-1 text-[11px]">
          डेटाबेस: Google Sheets API v4 &amp; Google Drive Integration
        </p>
      </footer>
    </div>
  );
}
