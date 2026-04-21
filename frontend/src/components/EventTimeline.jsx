import React from 'react';
import { ScrollText } from 'lucide-react';

const TYPE_BADGE = {
  SYSTEM: 'bg-slate-700/50 text-slate-300',
  INTENT: 'bg-cyan-900/50 text-cyan-300',
  THREAT: 'bg-red-900/50 text-red-300',
  PACKET: 'bg-emerald-900/50 text-emerald-300',
};

const SEVERITY_DOT = {
  INFO: 'bg-cyan-500',
  WARNING: 'bg-amber-500',
  CRITICAL: 'bg-red-500',
};

function formatTime(ts) {
  const d = new Date(ts * 1000);
  return d.toLocaleTimeString('en-US', { hour12: false });
}

export default function EventTimeline({ data }) {
  const events = [...(data.timeline || [])].reverse();

  return (
    <div className="bg-slate-900/40 border border-cyan-800/40 p-5 rounded-xl">
      <h3 className="text-sm font-semibold text-cyan-300 mb-4 tracking-wider flex items-center gap-2">
        <ScrollText size={16} /> MISSION EVENT LOG
      </h3>
      <div className="space-y-1 max-h-[600px] overflow-y-auto pr-2">
        {events.length === 0 && (
          <p className="text-cyan-900 text-sm italic">No events recorded.</p>
        )}
        {events.map((evt, i) => (
          <div
            key={`${evt.id}-${i}`}
            className="flex items-start gap-3 py-2 border-b border-slate-800/30"
          >
            <div
              className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                SEVERITY_DOT[evt.severity] || SEVERITY_DOT.INFO
              }`}
            />
            <span className="text-[10px] text-slate-600 w-16 shrink-0 pt-0.5">
              {formatTime(evt.timestamp)}
            </span>
            <span
              className={`text-[9px] px-1.5 py-0.5 rounded w-16 text-center shrink-0 ${
                TYPE_BADGE[evt.type] || TYPE_BADGE.SYSTEM
              }`}
            >
              {evt.type}
            </span>
            <span className="text-xs text-slate-400 flex-1">{evt.message}</span>
            {evt.mission_id && (
              <span className="text-[9px] text-cyan-700 shrink-0">
                {evt.mission_id}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
