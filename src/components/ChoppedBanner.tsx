import React from 'react';
import { Skull, Crown, AlertTriangle, Users, Flame, ArrowDownCircle, ShieldCheck } from 'lucide-react';
import { ChoppedWeekStats } from '../types';
import { resolvePlayer } from '../utils/playerResolver';

interface ChoppedBannerProps {
  stats: ChoppedWeekStats;
  leagueName: string;
}

export const ChoppedBanner: React.FC<ChoppedBannerProps> = ({ stats, leagueName }) => {
  const { choppedTeam, apexSurvivor, narrowEscape, averageScore, medianScore, week, totalTeams } = stats;

  return (
    <div className="space-y-4">
      {/* Primary Highlights: The Chopped Team & The Apex Survivor */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: 🪓 The Chopped Team (Elimination) */}
        {choppedTeam ? (
          <div
            id="chopped-team-card"
            className="rounded-2xl bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 border-2 border-rose-600/70 p-5 shadow-2xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-rose-600/20 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-600/30 text-rose-300 border border-rose-500/50 animate-pulse">
                    <Skull className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-rose-400 block">
                      🪓 The Guillotine Drops • Week {week}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Lowest score in the league — officially eliminated
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-900/50">
                  CHOPPED
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-rose-900/60 my-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={choppedTeam.avatarUrl}
                      alt={choppedTeam.teamName}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-rose-500 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h4 className="font-black text-white text-base truncate">
                        {choppedTeam.teamName}
                      </h4>
                      <p className="text-xs text-rose-300/80 truncate">
                        Manager: {choppedTeam.ownerName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-rose-400">
                      {choppedTeam.points}
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      Lowest Pts
                    </p>
                  </div>
                </div>

                {/* Starters dumped into the waiver pool */}
                {choppedTeam.starters.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5 mb-1.5">
                      <span>💰 Waiver Goldrush (Roster Purged to Waivers):</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {choppedTeam.starters.map((player, i) => {
                        const rawId = choppedTeam.starterIds?.[i] || player;
                        const rawDetail = choppedTeam.starterDetails?.[i];
                        const isGeneric = !rawDetail?.name || rawDetail.name.startsWith('Player #') || /^\d+$/.test(rawDetail.name);
                        const detail = !isGeneric ? rawDetail : resolvePlayer(rawId);
                        const displayName = detail?.name && !detail.name.startsWith('Player #')
                          ? detail.name
                          : (player.replace(/\s*\([^)]*\)/, '') || `Player`);
                        const pos = detail?.pos;
                        const team = detail?.team;
                        return (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-950/50 text-amber-200 border border-amber-800/60 text-[11px] font-medium shadow-sm"
                          >
                            <span>{displayName}</span>
                            {pos && (
                              <span className="px-1 py-0.2 rounded bg-amber-500/25 text-amber-300 font-mono text-[9px] font-bold">
                                {pos}{team && pos !== 'DEF' ? `·${team}` : ''}
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <p className="text-[11px] text-rose-300/90 text-center font-medium">
              Farewell to {choppedTeam.teamName}. All players drop to the waiver wire for bidding!
            </p>
          </div>
        ) : null}

        {/* Card 2: 👑 Apex Survivor (Week Winner) */}
        {apexSurvivor ? (
          <div
            id="apex-survivor-card"
            className="rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/50 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                    <Crown className="w-5 h-5" />
                  </span>
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-400 block">
                      👑 Apex Survivor • Week {week} Leader
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Highest score across all surviving managers
                    </span>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-600/30 text-emerald-300 font-extrabold text-xs border border-emerald-500/50">
                  SAFE & IMMUNE
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-emerald-900/50 my-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={apexSurvivor.avatarUrl}
                      alt={apexSurvivor.teamName}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-emerald-500 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h4 className="font-black text-white text-base truncate">
                        {apexSurvivor.teamName}
                      </h4>
                      <p className="text-xs text-slate-400 truncate">
                        Manager: {apexSurvivor.ownerName}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black font-mono text-emerald-400">
                      {apexSurvivor.points}
                    </span>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">
                      pts
                    </p>
                  </div>
                </div>

                {choppedTeam && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                    <span>Cushion above execution:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      +{(apexSurvivor.points - choppedTeam.points).toFixed(2)} pts
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Narrow Escape callout below */}
            {narrowEscape && (
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/30 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Close Shave:</strong> {narrowEscape.team.teamName} survived by just{' '}
                    <strong className="text-white">+{narrowEscape.marginOverChopped} pts</strong>!
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>Surviving Roster Count</span>
          </span>
          <p className="text-lg font-bold text-white mt-1">
            {totalTeams > 1 ? totalTeams - 1 : totalTeams} / {totalTeams} Left
          </p>
          <p className="text-[10px] text-slate-500">1 manager chopped this week</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <ArrowDownCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Elimination Cut Line</span>
          </span>
          <p className="text-lg font-bold font-mono text-rose-400 mt-1">
            {choppedTeam?.points ?? '—'} pts
          </p>
          <p className="text-[10px] text-slate-500">Below this = Eliminated</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Safe Median Score</span>
          </span>
          <p className="text-lg font-bold font-mono text-emerald-400 mt-1">
            {medianScore} pts
          </p>
          <p className="text-[10px] text-slate-500">Midpoint of survival</p>
        </div>

        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>League Average</span>
          </span>
          <p className="text-lg font-bold font-mono text-amber-300 mt-1">
            {averageScore} pts
          </p>
          <p className="text-[10px] text-slate-500">Points across all teams</p>
        </div>
      </div>
    </div>
  );
};
