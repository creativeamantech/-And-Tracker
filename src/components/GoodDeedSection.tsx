import React, { useState } from 'react';
import { GoodDeedEntry } from '../types';
import { HeartHandshake, Save, History, Calendar, Check } from 'lucide-react';

interface GoodDeedSectionProps {
  deeds: GoodDeedEntry[];
  onSaveDeed: (text: string) => Promise<void>;
}

export const GoodDeedSection: React.FC<GoodDeedSectionProps> = ({ deeds, onSaveDeed }) => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSaving(true);
    try {
      await onSaveDeed(text.trim());
      setText('');
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 2500);
    } catch (err) {
      console.error('Failed to save deed:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-emerald-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">आज का अच्छा काम (Daily Good Deed)</h2>
            <p className="text-xs text-gray-500">
              आज आपने किसी की क्या सहायता की या कौन सा शुभ/सत्कर्म कार्य किया?
            </p>
          </div>
        </div>

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl mb-4 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>सत्कर्म विवरण गूगल शीट में सफलतापूर्वक सहेजा गया!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              आज का अच्छा काम विवरण:
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="उदा: आज मैंने किसी वृद्ध जन की सड़क पार करने में सहायता की..."
              className="w-full p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !text.trim()}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow transition-all duration-150 text-sm flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'सहेजा जा रहा है...' : 'सहेजें (Save)'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* History Card */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-amber-200">
        <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-amber-700" />
          <span>पूर्व सत्कर्म इतिहास (Good Deeds History)</span>
        </h3>

        {deeds.length === 0 ? (
          <p className="text-xs text-gray-500 italic py-4 text-center bg-amber-50/50 rounded-xl">
            अभी तक कोई सत्कर्म दर्ज नहीं किया गया है।
          </p>
        ) : (
          <div className="space-y-3">
            {deeds.map((deed) => (
              <div
                key={deed.recordId}
                className="p-4 rounded-xl bg-amber-50/40 border border-amber-100 space-y-1"
              >
                <div className="flex items-center justify-between text-xs text-amber-800 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>{deed.date}</span>
                  </span>
                  <span className="text-gray-400 text-[11px]">
                    {new Date(deed.timestamp).toLocaleTimeString('hi-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm font-semibold text-gray-800 pt-1 leading-relaxed">
                  {deed.text}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
