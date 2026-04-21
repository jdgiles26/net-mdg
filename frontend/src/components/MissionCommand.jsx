import React from 'react';
import { Network, Cpu, Zap, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MissionCommand({ data }) {
  const missions = Object.entries(data.intents || {});

  const packetStats = (data.packets || []).reduce((acc, pkt) => {
    const mid = pkt.mission_id || 'UNKNOWN';
    if (!acc[mid]) acc[mid] = { count: 0, fragmented: 0, bytes: 0 };
    acc[mid].count++;
    if (pkt.fragmented) acc[mid].fragmented++;
    acc[mid].bytes += pkt.size;
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Active Intents */}
      <div className="space-y-4">
        <div className="bg-slate-900/40 border border-cyan-800/40 p-5 rounded-xl backdrop-blur-sm">
          <h2 className="text-lg mb-4 flex items-center gap-2 font-semibold text-cyan-300">
            <Network size={18} /> ACTIVE INTENTS
          </h2>
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {missions.length === 0 && (
              <p className="text-cyan-900 text-sm italic">Awaiting signals...</p>
            )}
            <AnimatePresence>
              {missions.map(([port, d]) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={port}
                  className={`border-l-4 p-3 rounded-r-lg bg-gradient-to-r ${
                    d.level >= 8
                      ? 'border-red-500 from-red-950/30'
                      : d.level >= 5
                      ? 'border-amber-500 from-amber-950/30'
                      : 'border-cyan-500 from-cyan-950/30'
                  } to-transparent`}
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-white text-sm flex items-center gap-1.5">
                      {d.level >= 8 && <Zap size={12} className="text-red-400" />}
                      {d.mission_id}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        d.level >= 8
                          ? 'bg-red-500/20 text-red-300'
                          : d.level >= 5
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-cyan-500/20 text-cyan-300'
                      }`}
                    >
                      P{d.level}
                    </span>
                  </div>
                  <div className="text-[11px] space-y-0.5 text-slate-500">
                    <p>
                      PORT <span className="text-cyan-400">{d.port}</span> &middot;{' '}
                      {d.intent}
                    </p>
                    {packetStats[d.mission_id] && (
                      <p className="text-slate-600 pt-1 border-t border-slate-800/50">
                        {packetStats[d.mission_id].count} pkts &middot;{' '}
                        {packetStats[d.mission_id].fragmented} frag &middot;{' '}
                        {(packetStats[d.mission_id].bytes / 1024).toFixed(1)}KB
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Packet Stream Visualizer */}
      <div className="lg:col-span-2">
        <div className="bg-slate-900/40 border border-cyan-800/40 p-5 rounded-xl backdrop-blur-sm h-full flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg flex items-center gap-2 font-semibold text-cyan-300">
              <Cpu size={18} /> PACKET INTERCEPT STREAM
            </h2>
            <Shield className="text-cyan-800" size={20} />
          </div>

          <div className="flex-1 bg-slate-950/50 rounded border border-cyan-900/20 p-4 relative overflow-hidden flex items-end gap-[2px] min-h-[300px]">
            {(data.packets || []).length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-cyan-900 text-sm">
                Awaiting packet data...
              </div>
            )}
            {(data.packets || []).map((pkt) => {
              const h = Math.min(Math.max((pkt.size / 1000) * 100, 10), 100);
              return (
                <motion.div
                  key={pkt.id}
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  className={`w-full rounded-t-sm origin-bottom relative ${
                    pkt.priority >= 8
                      ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                      : pkt.priority >= 5
                      ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.4)]'
                      : 'bg-cyan-500'
                  }`}
                  style={{ height: `${h}%` }}
                  title={`${pkt.mission_id} | ${pkt.size}B | P${pkt.priority}`}
                >
                  {pkt.fragmented && (
                    <div className="absolute top-0 w-full h-1 bg-white animate-pulse rounded-t-sm" />
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-3 text-[10px] font-bold text-cyan-800 uppercase tracking-widest">
            <span>Live Stream</span>
            <div className="flex gap-4">
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_4px_red]" />{' '}
                P8-10
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_4px_orange]" />{' '}
                P5-7
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full" /> P1-4
              </span>
              <span className="border-b border-white/30 pb-px">
                &#9644; Frag
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
