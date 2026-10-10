import React from 'react';
import { User, DbStatus } from '../types';
import { LogOut, Database, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  dbStatus: DbStatus | null;
  onLogout: () => void;
  onConnectSheets: () => void;
  activeTab: 'tracker' | 'reports' | 'admin' | 'good-deeds';
  setActiveTab: (tab: 'tracker' | 'reports' | 'admin' | 'good-deeds') => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  dbStatus,
  onLogout,
  onConnectSheets,
  activeTab,
  setActiveTab,
}) => {
  return (
    <header className="bg-amber-900 text-amber-50 shadow-md border-b border-amber-800 sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 py-3">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-amber-700 border border-amber-500 flex items-center justify-center text-xl shadow">
              🧘‍♂️
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-amber-100 flex items-center gap-2">
                विकार एवं सत्कर्म ट्रैकर
              </h1>
              <p className="text-xs text-amber-300">
                Google Sheets आधारित आत्म-निरीक्षण ऐप
              </p>
            </div>
          </div>

          {/* User info & Google Sheets status */}
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full border bg-emerald-950/80 border-emerald-600 text-emerald-200">
              <Database className="w-3.5 h-3.5" />
              <span>गूगल शीट्स डेटाबेस सक्रिय</span>
              {dbStatus?.spreadsheetUrl && (
                <a
                  href={dbStatus.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white underline ml-1 flex items-center gap-0.5"
                  title="Google Sheet खोलें"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {user && (
              <div className="flex items-center gap-2 bg-amber-950/60 border border-amber-800 px-3 py-1 rounded-full">
                <span className="font-medium text-amber-200">{user.name}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    user.role === 'Admin'
                      ? 'bg-purple-600 text-purple-100'
                      : 'bg-amber-700 text-amber-100'
                  }`}
                >
                  {user.role}
                </span>
                <button
                  onClick={onLogout}
                  className="text-amber-300 hover:text-rose-300 transition-colors ml-1"
                  title="लॉगआउट"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Navigation tabs */}
        {user && (
          <nav className="flex items-center gap-1 mt-3 pt-2 border-t border-amber-800/60 overflow-x-auto text-sm">
            {user.role === 'Admin' ? (
              <>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'admin'
                      ? 'bg-purple-100 text-purple-950 shadow-sm'
                      : 'text-purple-200 hover:bg-purple-900/60'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>🛡️ एडमिन कंट्रोल पैनल (समस्त रिपोर्ट)</span>
                </button>
                <button
                  onClick={() => setActiveTab('tracker')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'tracker'
                      ? 'bg-amber-100 text-amber-950 shadow-sm font-semibold'
                      : 'text-amber-200 hover:bg-amber-800/60'
                  }`}
                >
                  ⚡ विकार दर्ज करें (10 बटन)
                </button>
                <button
                  onClick={() => setActiveTab('good-deeds')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'good-deeds'
                      ? 'bg-amber-100 text-amber-950 shadow-sm font-semibold'
                      : 'text-amber-200 hover:bg-amber-800/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  आज का अच्छा काम
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('tracker')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'tracker'
                      ? 'bg-amber-100 text-amber-950 shadow-sm'
                      : 'text-amber-200 hover:bg-amber-800/60'
                  }`}
                >
                  ⚡ विकार दर्ज करें (10 बटन)
                </button>
                <button
                  onClick={() => setActiveTab('good-deeds')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'good-deeds'
                      ? 'bg-amber-100 text-amber-950 shadow-sm font-semibold'
                      : 'text-amber-200 hover:bg-amber-800/60'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  आज का अच्छा काम
                </button>
                <button
                  onClick={() => setActiveTab('reports')}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    activeTab === 'reports'
                      ? 'bg-amber-100 text-amber-950 shadow-sm'
                      : 'text-amber-200 hover:bg-amber-800/60'
                  }`}
                >
                  📊 साधक डैशबोर्ड (मेरी रिपोर्ट)
                </button>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};
