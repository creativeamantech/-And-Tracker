import React, { useState } from 'react';
import { VikaarName, VIKAAR_LIST, GoodDeedEntry } from '../types';
import { Calendar, BarChart3, PieChart, Heart, CalendarDays, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface UserReportProps {
  todayCounts: Record<VikaarName, number>;
  overallCounts: Record<VikaarName, number>;
  totalToday: number;
  totalOverall: number;
  goodDeeds: GoodDeedEntry[];
  dailyHistory?: Record<string, { counts: Record<string, number>; total: number }>;
}

export const UserReport: React.FC<UserReportProps> = ({
  todayCounts,
  overallCounts,
  totalToday,
  totalOverall,
  goodDeeds,
  dailyHistory = {},
}) => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [activeView, setActiveView] = useState<'date-wise' | 'overall' | 'timeline'>('date-wise');

  // Compute counts for the selected date
  const selectedDateRecord = dailyHistory[selectedDate] || {
    counts: todayCounts,
    total: totalToday,
  };
  const selectedDateTotal = selectedDateRecord.total || 0;

  return (
    <div className="space-y-6">
      {/* Overview Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-amber-800 text-amber-50 p-5 rounded-2xl shadow-md border border-amber-700">
          <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">तिथि-वार कुल विकार</div>
          <div className="text-3xl font-black mt-1.5">{selectedDateTotal}</div>
          <div className="text-xs text-amber-200 mt-1 flex items-center gap-1 font-mono">
            <Calendar className="w-3.5 h-3.5" /> {selectedDate}
          </div>
        </div>

        <div className="bg-amber-900 text-amber-50 p-5 rounded-2xl shadow-md border border-amber-800">
          <div className="text-xs text-amber-300 font-bold uppercase tracking-wider">सर्वकालिक कुल (Overall Total)</div>
          <div className="text-3xl font-black mt-1.5">{totalOverall}</div>
          <div className="text-xs text-amber-200 mt-1">सभी तिथियों के कुल रिकॉर्ड्स</div>
        </div>

        <div className="bg-emerald-800 text-emerald-50 p-5 rounded-2xl shadow-md border border-emerald-700">
          <div className="text-xs text-emerald-200 font-bold uppercase tracking-wider">कुल सत्कर्म (Good Deeds)</div>
          <div className="text-3xl font-black mt-1.5">{goodDeeds.length}</div>
          <div className="text-xs text-emerald-200 mt-1">आज का अच्छा काम इतिहास</div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="bg-white rounded-2xl p-2 shadow border border-amber-200 flex items-center justify-between gap-2 overflow-x-auto text-xs font-bold">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveView('date-wise')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeView === 'date-wise'
                ? 'bg-amber-700 text-white shadow'
                : 'text-gray-600 hover:bg-amber-50'
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            <span>1. तिथि अनुसार विभाजन (Date-wise)</span>
          </button>

          <button
            onClick={() => setActiveView('overall')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeView === 'overall'
                ? 'bg-amber-700 text-white shadow'
                : 'text-gray-600 hover:bg-amber-50'
            }`}
          >
            <PieChart className="w-4 h-4" />
            <span>2. सर्वकालिक विभाजन (Overall Bifurcation)</span>
          </button>

          <button
            onClick={() => setActiveView('timeline')}
            className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 ${
              activeView === 'timeline'
                ? 'bg-amber-700 text-white shadow'
                : 'text-gray-600 hover:bg-amber-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>3. तिथि इतिहास (Daily Timeline)</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: Date-wise Bifurcation */}
      {activeView === 'date-wise' && (
        <div className="bg-white rounded-2xl p-6 shadow-md border border-amber-200 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-amber-700" />
                <span>तिथि अनुसार 10 विकार विभाजन (Date-wise Bifurcation)</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                किसी भी तिथि का चयन करके उस दिन के विकार की सटीक संख्या देखें
              </p>
            </div>

            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 p-1.5 rounded-xl text-xs">
              <Calendar className="w-4 h-4 text-amber-700" />
              <span className="font-bold text-amber-900">तिथि चुनें:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border border-gray-300 px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-gray-800 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {VIKAAR_LIST.map((name) => {
              const count = selectedDateRecord.counts[name] || 0;
              const percent =
                selectedDateTotal > 0
                  ? Math.round((count / selectedDateTotal) * 100)
                  : 0;

              return (
                <div
                  key={name}
                  className="bg-amber-50/50 border border-amber-200/80 p-4 rounded-xl text-left flex flex-col justify-between space-y-2 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-amber-950">{name}</span>
                    <span className="bg-amber-800 text-amber-50 px-2 py-0.5 rounded-full text-xs font-black">
                      {count}
                    </span>
                  </div>

                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-700 h-full rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-gray-500 font-mono text-right mt-1">
                      {percent}% हिस्सेदारी
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Overall Bifurcation */}
      {activeView === 'overall' && (
        <div className="bg-white rounded-2xl p-6 shadow-md border border-amber-200 space-y-5">
          <div className="border-b pb-3">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-amber-700" />
              <span>सर्वकालिक कुल विकार विभाजन (Overall All-Time Bifurcation)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              शुरुआत से लेकर आज तक के सभी विकारों की कुल संख्या एवं प्रतिशत
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="bg-amber-100/80 border-b border-amber-200 text-amber-950 font-bold text-xs uppercase">
                  <th className="py-3 px-4">विकार का नाम</th>
                  <th className="py-3 px-4 text-center">कुल दर्ज संख्या</th>
                  <th className="py-3 px-4 text-center">प्रतिशत अनुपात</th>
                  <th className="py-3 px-4 text-right">विभाजन बार</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {VIKAAR_LIST.map((name) => {
                  const count = overallCounts[name] || 0;
                  const percent =
                    totalOverall > 0 ? Math.round((count / totalOverall) * 100) : 0;

                  return (
                    <tr key={name} className="hover:bg-amber-50/40">
                      <td className="py-3 px-4 font-bold text-gray-800">{name}</td>
                      <td className="py-3 px-4 text-center font-black text-amber-900 text-base">
                        {count}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-gray-600 font-mono">
                        {percent}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-32 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-amber-700 h-full rounded-full"
                              style={{ width: `${percent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: Daily Timeline */}
      {activeView === 'timeline' && (
        <div className="bg-white rounded-2xl p-6 shadow-md border border-amber-200 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-amber-700" />
            <span>दैनिक इतिहास टाइमलाइन (Daily Activity History)</span>
          </h3>

          {Object.keys(dailyHistory).length === 0 ? (
            <p className="text-xs text-gray-500 italic py-6 text-center bg-amber-50/40 rounded-xl">
              अभी तक कोई इतिहास दर्ज नहीं है।
            </p>
          ) : (
            <div className="space-y-3">
              {Object.entries(dailyHistory)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([d, rec]) => (
                  <div
                    key={d}
                    className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-700" />
                        <span>दिनांक: {d}</span>
                      </div>
                      <div className="text-xs text-gray-600 mt-1 flex flex-wrap gap-2">
                        {VIKAAR_LIST.map((v) => {
                          const cnt = rec.counts[v] || 0;
                          if (cnt === 0) return null;
                          return (
                            <span
                              key={v}
                              className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded text-[11px] font-semibold"
                            >
                              {v}: {cnt}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-amber-900 text-amber-50 px-3 py-1.5 rounded-lg text-xs font-black text-center shrink-0">
                      कुल: {rec.total}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Good Deeds Journal Card */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-emerald-200 space-y-4">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Heart className="w-5 h-5 text-emerald-700" />
          <span>व्यक्तिगत सत्कर्म इतिहास (Good Deeds Log)</span>
        </h3>

        {goodDeeds.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-4 text-center bg-emerald-50/40 rounded-xl">
            कोई अच्छा काम दर्ज नहीं है।
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {goodDeeds.map((deed) => (
              <div
                key={deed.recordId}
                className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-start gap-3"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <div className="font-bold text-gray-900">{deed.text}</div>
                  <div className="text-[10px] text-emerald-800 font-mono mt-1">
                    {deed.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
