import React, { useState } from 'react';
import { Skull, Crown, Shield, AlertTriangle, ChevronDown, ChevronUp, UserCheck, Flame } from 'lucide-react';
import { ChoppedWeekStats, TeamInfo } from '../types';
import { resolvePlayer } from '../utils/playerResolver';

interface ChoppedLeaderboardProps {
  stats: ChoppedWeekStats;
}

export const ChoppedLeaderboard: React.FC<ChoppedLeaderboardProps> = ({ stats }) => {
  const { allRankedTeams, choppedTeam, apexSurvivor, narrowEscape, week } = stats;
  const [expandedRosterId, setExpandedRosterId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedRosterId((prev) => (prev === id ? null : id));
  };

  const cutLinePoints = choppedTeam?.points ?? 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 border-b border-slate-800 pb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Skull className="w-5 h-5 text-rose-500" />
            <span>Week {week} Survivor Elimination Ladder</span>
          </h3>
          <p className="text-xs text-slate-400">
            No weekly matchups — the lowest scorer is chopped and eliminated from the league
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2.5 py-1 rounded-md bg-emerald-950/60 text-emerald-300 border border-emerald-800 font-semibold">
            {(stats.activeTeams ? stats.activeTeams.length - 1 : (allRankedTeams.filter((t) => !t.isEliminated).length - 1))} Survivors
          </span>
          <span className="px-2.5 py-1 rounded-md bg-rose-950/60 text-rose-300 border border-rose-800 font-semibold">
            1 Chopped (W{week})
          </span>
          {(stats.previouslyEliminated && stats.previouslyEliminated.length > 0) && (
            <span className="px-2.5 py-1 rounded-md bg-slate-900 text-slate-400 border border-slate-700 font-semibold">
              {stats.previouslyEliminated.length} Previously Eliminated
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        {allRankedTeams.map((team, index) => {
          const isPriorEliminated = Boolean(team.isEliminated);
          const isChopped = team.rosterId === choppedTeam?.rosterId;
          const isApex = !isPriorEliminated && team.rosterId === apexSurvivor?.rosterId;
          const isNarrow = !isPriorEliminated && team.rosterId === narrowEscape?.team.rosterId;
          const isDanger =
            !isChopped &&
            !isPriorEliminated &&
            stats.dangerZone.some((t) => t.rosterId === team.rosterId);
          const isExpanded = expandedRosterId === team.rosterId;
          const cushionOverCut = Number((team.points - cutLinePoints).toFixed(2));
          const rank = isPriorEliminated ? '—' : index + 1;

          return (
            <div
              key={team.rosterId}
              id={`survivor-row-${team.rosterId}`}
              className={`rounded-xl border transition-all ${
                isChopped
                  ? 'bg-gradient-to-r from-rose-950/70 to-slate-950 border-rose-600/60 ring-1 ring-rose-500/20 shadow-lg'
                  : isPriorEliminated
                  ? 'bg-slate-950/40 border-slate-900 opacity-60'
                  : isApex
                  ? 'bg-gradient-to-r from-emerald-950/50 to-slate-950 border-emerald-500/50'
                  : isNarrow
                  ? 'bg-slate-950/90 border-amber-500/50'
                  : isDanger
                  ? 'bg-slate-950/80 border-amber-800/40'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="p-3.5 flex items-center justify-between gap-3">
                {/* Left: Rank & Team */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs font-mono shrink-0 ${
                      isChopped
                        ? 'bg-rose-600 text-white shadow-md'
                        : isPriorEliminated
                        ? 'bg-slate-900 text-slate-500 border border-slate-800'
                        : isApex
                        ? 'bg-emerald-600 text-white shadow-md'
                        : isNarrow || isDanger
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {isChopped ? (
                      <Skull className="w-4 h-4" />
                    ) : isPriorEliminated ? (
                      <Skull className="w-3.5 h-3.5 text-slate-500" />
                    ) : isApex ? (
                      <Crown className="w-4 h-4" />
                    ) : (
                      `#${rank}`
                    )}
                  </div>

                  <img
                    src={team.avatarUrl}
                    alt={team.teamName}
                    className={`w-9 h-9 rounded-lg object-cover border shrink-0 ${
                      isPriorEliminated ? 'border-slate-800 grayscale' : 'border-slate-700'
                    }`}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`font-bold text-sm truncate ${
                          isChopped
                            ? 'text-rose-200 line-through'
                            : isPriorEliminated
                            ? 'text-slate-500 line-through'
                            : isApex
                            ? 'text-white'
                            : 'text-slate-200'
                        }`}
                      >
                        {team.teamName}
                      </h4>

                      {/* Status Badges */}
                      {isChopped && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                          🪓 Chopped (Week {week})
                        </span>
                      )}
                      {isPriorEliminated && (
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold">
                          💀 Out in W{team.eliminatedWeek || 1}
                        </span>
                      )}
                      {isApex && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                          👑 Apex Leader
                        </span>
                      )}
                      {isNarrow && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Survived +{cushionOverCut}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 truncate">
                      {team.ownerName}
                    </p>
                  </div>
                </div>

                {/* Right: Score & Cushion */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <span
                      className={`text-lg font-black font-mono tracking-tight ${
                        isChopped
                          ? 'text-rose-400'
                          : isPriorEliminated
                          ? 'text-slate-500'
                          : isApex
                          ? 'text-emerald-400'
                          : 'text-white'
                      }`}
                    >
                      {team.points}{' '}
                      <span className="text-xs font-normal text-slate-400">pts</span>
                    </span>

                    <p className="text-[10px] text-slate-500 font-mono">
                      {isChopped ? (
                        <span className="text-rose-400 font-semibold">ELIMINATED</span>
                      ) : isPriorEliminated ? (
                        <span className="text-slate-500 font-semibold">Week {team.eliminatedWeek || 1} victim</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">
                          +{cushionOverCut} above cut
                        </span>
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleExpand(team.rosterId)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                    title="View starters and points"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Starters */}
              {isExpanded && (
                <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-xs">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Starter Point Breakdown:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {team.starters.length > 0 ? (
                      team.starters.map((player, idx) => {
                        const pts = team.startersPoints[idx] ?? 0;
                        const rawId = team.starterIds?.[idx] || player;
                        const rawDetail = team.starterDetails?.[idx];
                        const isGeneric = !rawDetail?.name || rawDetail.name.startsWith('Player #') || /^\d+$/.test(rawDetail.name);
                        const detail = !isGeneric ? rawDetail : resolvePlayer(rawId);
                        const displayName = detail?.name && !detail.name.startsWith('Player #')
                          ? detail.name
                          : (player.replace(/\s*\([^)]*\)/, '') || `Starter #${idx + 1}`);
                        const pos = detail?.pos;
                        const teamCode = detail?.team;
                        return (
                          <div
                            key={idx}
                            className="flex justify-between items-center p-1.5 rounded bg-slate-900/70 border border-slate-800/70 text-[11px]"
                          >
                            <div className="flex items-center gap-1.5 truncate mr-1.5 min-w-0">
                              {pos && (
                                <span className="px-1 py-0.2 rounded bg-slate-800 border border-slate-700/60 text-[9px] text-amber-300 font-mono font-bold shrink-0">
                                  {pos}{teamCode && pos !== 'DEF' ? `·${teamCode}` : ''}
                                </span>
                              )}
                              <span className="text-slate-200 truncate font-medium" title={displayName}>
                                {displayName}
                              </span>
                            </div>
                            <span className="font-mono font-bold text-emerald-400 shrink-0">
                              {pts} pts
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-slate-500 text-xs">No starter breakdown available</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
