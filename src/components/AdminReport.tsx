import React, { useState, useEffect } from 'react';
import { User, VIKAAR_LIST, VikaarName, DbStatus } from '../types';
import {
  Shield,
  Users,
  UserPlus,
  ExternalLink,
  RefreshCw,
  UserCheck,
  AlertCircle,
  Calendar,
  Layers,
  Search,
  CalendarDays,
} from 'lucide-react';

interface AdminReportProps {
  token: string;
  googleToken: string | null;
  dbStatus: DbStatus | null;
  onRefreshStatus: () => void;
}

interface AdminData {
  date: string;
  users: Array<{ userId: string; name: string; role: 'Admin' | 'User'; createdAt: string }>;
  overallTotals: Record<string, number>;
  selectedDateTotals: Record<string, number>;
  totalDateEntries: number;
  userBreakdown: Array<{
    userId: string;
    name: string;
    totalEntries: number;
    dateEntries: number;
    counts: Record<string, number>;
    dateCounts: Record<string, number>;
    goodDeedsCount: number;
    dateGoodDeedsCount: number;
  }>;
  totalVikaarEntries: number;
  totalGoodDeeds: number;
  allGoodDeeds: Array<{ recordId: string; userId: string; text: string; date: string; timestamp: string }>;
}

export const AdminReport: React.FC<AdminReportProps> = ({
  token,
  googleToken,
  dbStatus,
  onRefreshStatus,
}) => {
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [viewMode, setViewMode] = useState<'date-wise' | 'overall'>('date-wise');

  // New user form
  const [newUserId, setNewUserId] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'User' | 'Admin'>('User');
  const [addUserMsg, setAddUserMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [addingUser, setAddingUser] = useState(false);

  const fetchAdminReport = async (targetDate: string = selectedDate) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/admin?date=${targetDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          ...(googleToken ? { 'X-Google-Token': googleToken } : {}),
        },
      });
      if (res.ok) {
        const data = await res.json();
        setAdminData(data);
      }
    } catch (err) {
      console.error('Failed to load admin report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminReport(selectedDate);
  }, [token, googleToken, selectedDate]);

  const handleAddUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddUserMsg(null);
    if (!newUserId.trim() || !newPassword.trim() || !newName.trim()) {
      setAddUserMsg({ type: 'error', text: 'सभी फ़ील्ड आवश्यक हैं' });
      return;
    }

    setAddingUser(true);
    try {
      const res = await fetch('/api/admin/users/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(googleToken ? { 'X-Google-Token': googleToken } : {}),
        },
        body: JSON.stringify({
          newUserId: newUserId.trim(),
          password: newPassword.trim(),
          name: newName.trim(),
          role: newRole,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setAddUserMsg({ type: 'success', text: data.message });
        setNewUserId('');
        setNewPassword('');
        setNewName('');
        fetchAdminReport(selectedDate);
        setTimeout(() => setShowAddUserModal(false), 2000);
      } else {
        setAddUserMsg({ type: 'error', text: data.error || 'उपयोगकर्ता जोड़ने में विफल' });
      }
    } catch (err: any) {
      setAddUserMsg({ type: 'error', text: err.message || 'त्रुटि हुई' });
    } finally {
      setAddingUser(false);
    }
  };

  if (loading && !adminData) {
    return (
      <div className="p-8 text-center text-gray-500 font-medium">
        प्रशासक डैशबोर्ड लोड हो रहा है...
      </div>
    );
  }

  if (!adminData) {
    return (
      <div className="p-8 text-center text-rose-600 font-medium">
        रिपोर्ट डेटा लोड करने में असमर्थ।
      </div>
    );
  }

  // Filter users by search term
  const filteredUserBreakdown = adminData.userBreakdown.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.userId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedUserObj =
    selectedUserId !== 'ALL'
      ? adminData.userBreakdown.find((u) => u.userId === selectedUserId)
      : null;

  return (
    <div className="space-y-6">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 text-white rounded-2xl p-6 shadow-xl border border-purple-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-purple-300" />
              <h2 className="text-xl font-extrabold text-purple-100">
                प्रशासक डैशबोर्ड (Admin Control Center)
              </h2>
            </div>
            <p className="text-xs text-purple-200 mt-1">
              गूगल शीट्स `Users`, `Vikaar Entries`, एवं `Good Deeds` का तिथि-वार व सर्वकालिक अवलोकन
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddUserModal(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>नया साधक जोड़ें (Add User)</span>
            </button>

            {dbStatus?.spreadsheetUrl && (
              <a
                href={dbStatus.spreadsheetUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow transition-all"
              >
                <ExternalLink className="w-4 h-4" />
                <span>गूगल शीट खोलें</span>
              </a>
            )}

            <button
              onClick={() => fetchAdminReport(selectedDate)}
              className="p-2 bg-purple-800/80 hover:bg-purple-700 rounded-xl text-purple-200"
              title="रीफ्रेश करें"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Date Picker Filter Bar for Admin */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-purple-700" />
          <span className="text-sm font-bold text-gray-800">तारीख चुनें (Select Date):</span>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="border-2 border-purple-300 focus:border-purple-600 px-3 py-1.5 rounded-xl text-xs font-bold text-purple-950 outline-none bg-purple-50/50"
          />
        </div>

        {/* View Mode Switcher: Date-wise vs Overall */}
        <div className="flex items-center bg-gray-100 p-1 rounded-xl text-xs font-bold">
          <button
            onClick={() => setViewMode('date-wise')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'date-wise'
                ? 'bg-purple-700 text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            तिथि-वार ({selectedDate})
          </button>
          <button
            onClick={() => setViewMode('overall')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'overall'
                ? 'bg-purple-700 text-white shadow'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            सर्वकालिक (Overall All-Time)
          </button>
        </div>
      </div>

      {/* High-level system metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-purple-100">
          <div className="text-xs text-gray-500 font-semibold">कुल पंजीकृत साधक</div>
          <div className="text-2xl font-black text-purple-950 mt-1">
            {adminData.users.length}
          </div>
          <div className="text-[10px] text-purple-700 mt-0.5">Users Sheet Records</div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-amber-100">
          <div className="text-xs text-gray-500 font-semibold">
            {viewMode === 'date-wise' ? `तिथि विकार (${selectedDate})` : 'सर्वकालिक कुल विकार'}
          </div>
          <div className="text-2xl font-black text-amber-900 mt-1">
            {viewMode === 'date-wise' ? adminData.totalDateEntries : adminData.totalVikaarEntries}
          </div>
          <div className="text-[10px] text-amber-700 mt-0.5">Vikaar Entries Sheet</div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
          <div className="text-xs text-gray-500 font-semibold">कुल दर्ज सत्कर्म</div>
          <div className="text-2xl font-black text-emerald-900 mt-1">
            {adminData.totalGoodDeeds}
          </div>
          <div className="text-[10px] text-emerald-700 mt-0.5">Good Deeds Sheet</div>
        </div>

        <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100">
          <div className="text-xs text-gray-500 font-semibold">डेटाबेस स्थिति</div>
          <div className="text-xs font-bold text-emerald-700 mt-2 truncate">
            गूगल शीट्स कनेक्टेड
          </div>
        </div>
      </div>

      {/* SECTION 1: Complete Users Information Table */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-purple-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div>
            <h3 className="text-base font-bold text-purple-950 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-700" />
              <span>1. गूगल शीट्स 'Users' - संपूर्ण साधक जानकारी</span>
            </h3>
            <p className="text-xs text-gray-500">
              {viewMode === 'date-wise'
                ? `चयनित तिथि (${selectedDate}) एवं कुल विकार संख्या`
                : 'सर्वकालिक कुल विकार एवं सत्कर्म संख्या'}
            </p>
          </div>

          {/* Search filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="नाम या User ID से खोजें..."
              className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-purple-100/80 border-b border-purple-200 text-purple-950 font-bold uppercase">
                <th className="p-3">User ID</th>
                <th className="p-3">साधक का नाम</th>
                <th className="p-3 text-center">भूमिका</th>
                <th className="p-3 text-center">
                  {viewMode === 'date-wise' ? `विकार (${selectedDate})` : 'सर्वकालिक विकार'}
                </th>
                <th className="p-3 text-center">कुल सत्कर्म</th>
                <th className="p-3 text-right">खाता निर्माण तिथि</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUserBreakdown.map((u) => {
                const rawUser = adminData.users.find((x) => x.userId === u.userId);
                const displayCount =
                  viewMode === 'date-wise' ? u.dateEntries : u.totalEntries;

                return (
                  <tr key={u.userId} className="hover:bg-purple-50/40">
                    <td className="p-3 font-mono font-bold text-purple-900">{u.userId}</td>
                    <td className="p-3 font-bold text-gray-900">{u.name}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          rawUser?.role === 'Admin'
                            ? 'bg-purple-600 text-purple-100'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {rawUser?.role || 'User'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-extrabold text-amber-900 bg-amber-50/30">
                      {displayCount}
                    </td>
                    <td className="p-3 text-center font-extrabold text-emerald-900 bg-emerald-50/30">
                      {u.goodDeedsCount}
                    </td>
                    <td className="p-3 text-right font-mono text-gray-500">
                      {rawUser?.createdAt
                        ? new Date(rawUser.createdAt).toLocaleDateString('hi-IN')
                        : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: User Bifurcation Inspector */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-700" />
            <h3 className="text-base font-bold text-gray-900">
              2. 10 विकार विभाजन (10 Vikaar Bifurcation Details)
            </h3>
          </div>

          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="ALL">समस्त साधक (Aggregated Total across All Users)</option>
            {adminData.users.map((u) => (
              <option key={u.userId} value={u.userId}>
                {u.name} ({u.userId})
              </option>
            ))}
          </select>
        </div>

        {selectedUserObj ? (
          <div className="space-y-4">
            <div className="bg-purple-50 border border-purple-200 p-4 rounded-xl flex items-center justify-between">
              <div>
                <div className="font-extrabold text-purple-950 text-base">
                  {selectedUserObj.name} ({selectedUserObj.userId})
                </div>
                <div className="text-xs text-purple-800 mt-0.5">
                  तारीख ({selectedDate}) विकार: {selectedUserObj.dateEntries} | सर्वकालिक विकार: {selectedUserObj.totalEntries}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {VIKAAR_LIST.map((v) => {
                const count =
                  viewMode === 'date-wise'
                    ? selectedUserObj.dateCounts[v] || 0
                    : selectedUserObj.counts[v] || 0;

                return (
                  <div
                    key={v}
                    className="bg-amber-50/60 border border-amber-200 p-3.5 rounded-xl text-center"
                  >
                    <div className="text-xs font-bold text-amber-950">{v}</div>
                    <div className="text-2xl font-black text-amber-900 mt-1">
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Matrix across all users */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-purple-100/70 border-b border-purple-200 text-purple-950 font-bold">
                  <th className="p-3">साधक का नाम</th>
                  {VIKAAR_LIST.map((v) => (
                    <th key={v} className="p-2 text-center">{v}</th>
                  ))}
                  <th className="p-3 text-center">कुल दर्ज</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {adminData.userBreakdown.map((u) => (
                  <tr key={u.userId} className="hover:bg-purple-50/30">
                    <td className="p-3 font-bold text-gray-900">{u.name}</td>
                    {VIKAAR_LIST.map((v) => {
                      const count =
                        viewMode === 'date-wise'
                          ? u.dateCounts[v] || 0
                          : u.counts[v] || 0;
                      return (
                        <td key={v} className="p-2 text-center font-bold text-purple-900">
                          {count}
                        </td>
                      );
                    })}
                    <td className="p-3 text-center font-black text-amber-900 bg-amber-50">
                      {viewMode === 'date-wise' ? u.dateEntries : u.totalEntries}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 3: All Recent Good Deeds Stream */}
      <div className="bg-white p-6 rounded-2xl shadow-md border border-emerald-200 space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-700" />
          <span>3. दर्ज किए गए सत्कर्म (Good Deeds Stream)</span>
        </h3>

        {adminData.allGoodDeeds.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-4 text-center bg-emerald-50/40 rounded-xl">
            कोई अच्छा काम दर्ज नहीं है।
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {adminData.allGoodDeeds.map((deed) => (
              <div
                key={deed.recordId}
                className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] font-bold text-emerald-900">
                  <span>साधक ID: {deed.userId}</span>
                  <span className="font-mono text-gray-500">{deed.date}</span>
                </div>
                <div className="font-medium text-gray-800 pt-1">{deed.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-purple-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-purple-700" />
                <span>नया साधक/उपयोगकर्ता जोड़ें (Google Sheet Users)</span>
              </h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {addUserMsg && (
              <div
                className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  addUserMsg.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addUserMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleAddUserSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  उपयोगकर्ता नाम (Full Name)
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="उदा: साधक रमेश"
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  User ID (Login Username)
                </label>
                <input
                  type="text"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="उदा: ramesh123"
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  पासवर्ड (Password)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="******"
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  अनुमति भूमिका (Role)
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'User' | 'Admin')}
                  className="w-full p-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="User">User (साधक)</option>
                  <option value="Admin">Admin (प्रशासक)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg shadow disabled:opacity-50"
                >
                  {addingUser ? 'जोड़ा जा रहा है...' : 'सहेजें (Save User)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
