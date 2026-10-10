import React, { useState } from 'react';
import { VikaarName, VIKAAR_LIST } from '../types';
import { Plus, CheckCircle, Clock, Sparkles } from 'lucide-react';

interface VikaarGridProps {
  todayCounts: Record<VikaarName, number>;
  totalToday: number;
  onTapVikaar: (name: VikaarName) => Promise<void>;
  loadingVikaar: VikaarName | null;
  recentTaps: Array<{ vikaarName: string; timestamp: string }>;
}

// Color coding & icons for each Vikaar
const VIKAAR_META: Record<
  VikaarName,
  { labelEn: string; icon: string; bgClass: string; textClass: string; borderClass: string }
> = {
  काम: {
    labelEn: 'Lust / Desire',
    icon: '🔥',
    bgClass: 'bg-rose-50 hover:bg-rose-100 active:scale-95',
    textClass: 'text-rose-900',
    borderClass: 'border-rose-300',
  },
  क्रोध: {
    labelEn: 'Anger',
    icon: '😡',
    bgClass: 'bg-red-50 hover:bg-red-100 active:scale-95',
    textClass: 'text-red-900',
    borderClass: 'border-red-300',
  },
  लोभ: {
    labelEn: 'Greed',
    icon: '💰',
    bgClass: 'bg-amber-50 hover:bg-amber-100 active:scale-95',
    textClass: 'text-amber-900',
    borderClass: 'border-amber-300',
  },
  मोह: {
    labelEn: 'Attachment',
    icon: '🎯',
    bgClass: 'bg-orange-50 hover:bg-orange-100 active:scale-95',
    textClass: 'text-orange-900',
    borderClass: 'border-orange-300',
  },
  माया: {
    labelEn: 'Illusion / Materialism',
    icon: '💎',
    bgClass: 'bg-emerald-50 hover:bg-emerald-100 active:scale-95',
    textClass: 'text-emerald-900',
    borderClass: 'border-emerald-300',
  },
  अहंकार: {
    labelEn: 'Ego',
    icon: '👑',
    bgClass: 'bg-purple-50 hover:bg-purple-100 active:scale-95',
    textClass: 'text-purple-900',
    borderClass: 'border-purple-300',
  },
  ईर्ष्या: {
    labelEn: 'Jealousy',
    icon: '👁️',
    bgClass: 'bg-teal-50 hover:bg-teal-100 active:scale-95',
    textClass: 'text-teal-900',
    borderClass: 'border-teal-300',
  },
  डर: {
    labelEn: 'Fear',
    icon: '😨',
    bgClass: 'bg-indigo-50 hover:bg-indigo-100 active:scale-95',
    textClass: 'text-indigo-900',
    borderClass: 'border-indigo-300',
  },
  घृणा: {
    labelEn: 'Hatred',
    icon: '💔',
    bgClass: 'bg-slate-100 hover:bg-slate-200 active:scale-95',
    textClass: 'text-slate-900',
    borderClass: 'border-slate-300',
  },
  आलस्य: {
    labelEn: 'Laziness',
    icon: '😴',
    bgClass: 'bg-yellow-50 hover:bg-yellow-100 active:scale-95',
    textClass: 'text-yellow-900',
    borderClass: 'border-yellow-300',
  },
};

export const VikaarGrid: React.FC<VikaarGridProps> = ({
  todayCounts,
  totalToday,
  onTapVikaar,
  loadingVikaar,
  recentTaps,
}) => {
  const [lastTapped, setLastTapped] = useState<string | null>(null);

  const handleTap = async (name: VikaarName) => {
    setLastTapped(name);
    await onTapVikaar(name);
    setTimeout(() => {
      setLastTapped(null);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Banner / Instructions */}
      <div className="bg-amber-800 text-amber-50 rounded-2xl p-5 shadow-lg border border-amber-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-amber-100">
              ⚡ दैनन्दिन 10 विकार ट्रैकर (Daily Vikaar Tracker)
            </h2>
            <p className="text-xs text-amber-200 mt-1">
              प्रत्येक बार जब कोई विकार मन में उठे या प्रकट हो, संबंधित बटन दबाएं। हर टैप से 1 संख्या गूगल शीट में दर्ज होगी।
            </p>
          </div>
          <div className="bg-amber-950/70 border border-amber-600 rounded-xl px-4 py-2 text-center shrink-0">
            <div className="text-xs text-amber-300">आज की कुल संख्या</div>
            <div className="text-3xl font-extrabold text-amber-100">{totalToday}</div>
          </div>
        </div>
      </div>

      {/* Grid of 10 Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {VIKAAR_LIST.map((name) => {
          const meta = VIKAAR_META[name];
          const count = todayCounts[name] || 0;
          const isLoading = loadingVikaar === name;
          const isJustTapped = lastTapped === name;

          return (
            <button
              key={name}
              type="button"
              disabled={Boolean(loadingVikaar)}
              onClick={() => handleTap(name)}
              className={`relative flex flex-col justify-between p-4 rounded-2xl border-2 transition-all shadow-sm ${
                meta.bgClass
              } ${meta.borderClass} cursor-pointer min-h-[120px] select-none text-left`}
            >
              {/* Top row: Icon + Count Badge */}
              <div className="flex items-center justify-between w-full">
                <span className="text-2xl">{meta.icon}</span>
                <span className="bg-white/90 shadow border border-gray-200 text-gray-900 px-2.5 py-0.5 rounded-full text-sm font-black">
                  {count}
                </span>
              </div>

              {/* Bottom row: Hindi Name + English Label */}
              <div className="mt-3">
                <div className={`text-lg font-bold ${meta.textClass} flex items-center justify-between`}>
                  <span>{name}</span>
                  {isLoading ? (
                    <span className="text-xs text-gray-500 animate-spin">⏳</span>
                  ) : isJustTapped ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 animate-bounce" />
                  ) : (
                    <Plus className="w-4 h-4 opacity-50" />
                  )}
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  {meta.labelEn}
                </div>
              </div>

              {/* Visual feedback on tap */}
              {isJustTapped && (
                <div className="absolute inset-0 bg-emerald-500/20 rounded-2xl flex items-center justify-center pointer-events-none">
                  <span className="bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded shadow">
                    +1 दर्ज हुआ!
                  </span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Recent Activity Log */}
      <div className="bg-white rounded-2xl p-5 shadow border border-amber-200">
        <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-700" />
          <span>हाल ही में दर्ज विकार (Recent Logs)</span>
        </h3>

        {recentTaps.length === 0 ? (
          <p className="text-xs text-gray-500 italic">
            आज अभी तक कोई विकार दर्ज नहीं किया गया है।
          </p>
        ) : (
          <div className="space-y-2">
            {recentTaps.slice(0, 5).map((tap, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-amber-50/60 border border-amber-100 px-3 py-2 rounded-lg text-xs"
              >
                <div className="flex items-center gap-2 font-semibold text-amber-950">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>{tap.vikaarName}</span>
                </div>
                <span className="text-gray-500 text-[11px]">
                  {new Date(tap.timestamp).toLocaleTimeString('hi-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
