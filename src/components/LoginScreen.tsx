import React, { useState } from 'react';
import { Lock, User as UserIcon, LogIn, AlertCircle, Database, CheckCircle2 } from 'lucide-react';
import { DbStatus } from '../types';

interface LoginScreenProps {
  onLogin: (userId: string, pass: string) => Promise<void>;
  dbStatus: DbStatus | null;
  onConnectGoogleSheets: () => Promise<void>;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  dbStatus,
  onConnectGoogleSheets,
}) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!userId.trim() || !password.trim()) {
      setError('कृपया उपयोगकर्ता आईडी और पासवर्ड दर्ज करें');
      return;
    }

    setLoading(true);
    try {
      await onLogin(userId.trim(), password.trim());
    } catch (err: any) {
      setError(err.message || 'लॉग इन में विफलता। कृपया आईडी और पासवर्ड जांचें।');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUserId(u);
    setPassword(p);
    setError(null);
  };

  return (
    <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-amber-200 overflow-hidden">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-amber-800 to-amber-900 p-6 text-center text-amber-50">
          <div className="w-16 h-16 bg-amber-700/60 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-amber-400 text-3xl shadow">
            🧘‍♂️
          </div>
          <h2 className="text-2xl font-bold">विकार एवं सत्कर्म ट्रैकर</h2>
          <p className="text-amber-200 text-xs mt-1">
            अपने दैनन्दिन काम, क्रोध, लोभ आदि मनोविकारों पर ध्यान केंद्रित करें
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-800 text-center mb-2">
            लॉग इन करें (Login)
          </h3>

          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-lg text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              उपयोगकर्ता आईडी (User ID)
            </label>
            <div className="relative">
              <UserIcon className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="उदा: user1 या admin"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              पासवर्ड (Password)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="******"
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 text-white font-bold rounded-lg shadow transition-all duration-150 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
          >
            {loading ? (
              <span>प्रमाणीकरण हो रहा है...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>लॉग इन करें</span>
              </>
            )}
          </button>

          {/* Default Demo Credentials Hint */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-gray-500">
            <p className="font-bold text-gray-700 mb-1.5 text-center">
              गूगल शीट डिफ़ॉल्ट लॉग इन विवरण (Default Accounts):
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 bg-purple-50 border border-purple-200 rounded text-purple-900">
                <div className="font-bold text-purple-700">Admin Account</div>
                <div>ID: admin</div>
                <div>Pass: admin123</div>
              </div>
              <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-900">
                <div className="font-bold text-amber-700">User Account</div>
                <div>ID: user1</div>
                <div>Pass: pass123</div>
              </div>
            </div>
          </div>
        </form>

        {/* Google Sheets Connection info footer */}
        <div className="bg-amber-50 p-4 border-t border-amber-200 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-700 shrink-0" />
            <div>
              <span className="font-semibold">डेटाबेस: </span>
              <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> गूगल शीट्स डेटाबेस सक्रिय (Google Sheet Persistent DB)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
