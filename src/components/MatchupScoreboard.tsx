import React, { useState } from 'react';
import { Swords, Trophy, ChevronDown, ChevronUp, Flame, HeartCrack, Zap } from 'lucide-react';
import { HeadToHeadMatchup, TeamInfo } from '../types';
import { resolvePlayer } from '../utils/playerResolver';

interface MatchupScoreboardProps {
  matchups: HeadToHeadMatchup[];
  biggestBlowoutMatchupId?: number;
  highestScoringLoserRosterId?: number;
  closestMatchupId?: number;
}

export const MatchupScoreboard: React.FC<MatchupScoreboardProps> = ({
  matchups,
  biggestBlowoutMatchupId,
  highestScoringLoserRosterId,
  closestMatchupId,
}) => {
  const [expandedMatchupId, setExpandedMatchupId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedMatchupId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <Swords className="w-5 h-5 text-emerald-400" />
            <span>Week Matchup Scoreboard</span>
          </h3>
          <p className="text-xs text-slate-400">
            Head-to-head results, starter points, and margin of victory
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-mono">
          {matchups.length} Matchups
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {matchups.map((matchup) => {
          const isBlowout = matchup.matchupId === biggestBlowoutMatchupId;
          const isBadBeat =
            matchup.loser.rosterId === highestScoringLoserRosterId;
          const isClosest = matchup.matchupId === closestMatchupId;
          const isExpanded = expandedMatchupId === matchup.matchupId;

          return (
            <div
              key={matchup.matchupId}
              id={`matchup-card-${matchup.matchupId}`}
              className={`rounded-xl border transition-all ${
                isBlowout
                  ? 'bg-slate-950/90 border-amber-500/50'
                  : isBadBeat
                  ? 'bg-slate-950/90 border-rose-500/40'
                  : isClosest
                  ? 'bg-slate-950/90 border-purple-500/40'
                  : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Header Badges */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 text-xs">
                <span className="font-mono text-slate-400 font-semibold">
                  Matchup #{matchup.matchupId}
                </span>

                <div className="flex items-center gap-1.5">
                  {isBlowout && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1 border border-amber-500/30">
                      <Flame className="w-3 h-3" /> Biggest Blowout
                    </span>
                  )}
                  {isBadBeat && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold flex items-center gap-1 border border-rose-500/30">
                      <HeartCrack className="w-3 h-3" /> High-Scoring Loser
                    </span>
                  )}
                  {isClosest && !isBlowout && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold flex items-center gap-1 border border-purple-500/30">
                      <Zap className="w-3 h-3" /> Nail Biter
                    </span>
                  )}
                  <span className="text-slate-500 font-mono text-[11px]">
                    Margin: {matchup.margin}
                  </span>
                </div>
              </div>

              {/* Teams & Scores */}
              <div className="p-4 space-y-3">
                <TeamRow
                  team={matchup.teamA}
                  isWinner={matchup.winner.rosterId === matchup.teamA.rosterId}
                  isTie={matchup.isTie}
                  isBadBeat={matchup.teamA.rosterId === highestScoringLoserRosterId}
                />

                <div className="relative flex items-center justify-center">
                  <div className="border-t border-slate-800/80 w-full" />
                  <span className="bg-slate-900 px-2 text-[10px] uppercase font-bold text-slate-500 font-mono tracking-widest absolute">
                    VS
                  </span>
                </div>

                <TeamRow
                  team={matchup.teamB}
                  isWinner={matchup.winner.rosterId === matchup.teamB.rosterId}
                  isTie={matchup.isTie}
                  isBadBeat={matchup.teamB.rosterId === highestScoringLoserRosterId}
                />
              </div>

              {/* Starter Details Accordion Toggle */}
              <div className="px-4 py-2 bg-slate-900/40 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">
                  Total points: <strong className="text-slate-200">{matchup.totalCombinedScore} pts</strong>
                </span>
                <button
                  type="button"
                  onClick={() => toggleExpand(matchup.matchupId)}
                  className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-medium cursor-pointer"
                >
                  <span>{isExpanded ? 'Hide Starters' : 'View Starters'}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>

              {/* Expanded Starters Table */}
              {isExpanded && (
                <div className="p-3.5 bg-slate-950 border-t border-slate-800/90 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-slate-300 text-[11px] mb-1.5 truncate">
                        {matchup.teamA.teamName}
                      </p>
                      <div className="space-y-1">
                        {matchup.teamA.startersPoints?.length > 0 ? (
                          matchup.teamA.startersPoints.map((pts, i) => {
                            const rawId = matchup.teamA.starterIds?.[i] || matchup.teamA.starters[i] || '';
                            const rawDetail = matchup.teamA.starterDetails?.[i];
                            const isGeneric = !rawDetail?.name || rawDetail.name.startsWith('Player #') || /^\d+$/.test(rawDetail.name);
                            const detail = !isGeneric ? rawDetail : resolvePlayer(rawId);
                            const displayName = detail?.name && !detail.name.startsWith('Player #')
                              ? detail.name
                              : (matchup.teamA.starters[i] || `Starter #${i + 1}`);
                            const pos = detail?.pos;
                            const team = detail?.team;
                            return (
                              <div
                                key={i}
                                className="flex justify-between items-center text-[11px] text-slate-400 font-mono bg-slate-900/60 px-2 py-0.5 rounded gap-2"
                              >
                                <span className="truncate flex items-center gap-1.5 font-sans text-slate-200 min-w-0">
                                  {pos && (
                                    <span className="px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-amber-300 shrink-0">
                                      {pos}{team && pos !== 'DEF' ? `·${team}` : ''}
                                    </span>
                                  )}
                                  <span className="truncate font-medium" title={displayName}>{displayName}</span>
                                </span>
                                <span className="font-bold text-slate-200 shrink-0">{pts} pts</span>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-slate-500 text-[10px]">No starter breakdown</span>
                        )}
                        <div className="pt-1 text-[10px] text-slate-400 flex justify-between">
                          <span>Bench Total:</span>
                          <span className="font-mono">{matchup.teamA.benchPoints} pts</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="font-semibold text-slate-300 text-[11px] mb-1.5 truncate">
                        {matchup.teamB.teamName}
                      </p>
                      <div className="space-y-1">
                        {matchup.teamB.startersPoints?.length > 0 ? (
                          matchup.teamB.startersPoints.map((pts, i) => {
                            const rawId = matchup.teamB.starterIds?.[i] || matchup.teamB.starters[i] || '';
                            const rawDetail = matchup.teamB.starterDetails?.[i];
                            const isGeneric = !rawDetail?.name || rawDetail.name.startsWith('Player #') || /^\d+$/.test(rawDetail.name);
                            const detail = !isGeneric ? rawDetail : resolvePlayer(rawId);
                            const displayName = detail?.name && !detail.name.startsWith('Player #')
                              ? detail.name
                              : (matchup.teamB.starters[i] || `Starter #${i + 1}`);
                            const pos = detail?.pos;
                            const team = detail?.team;
                            return (
                              <div
                                key={i}
                                className="flex justify-between items-center text-[11px] text-slate-400 font-mono bg-slate-900/60 px-2 py-0.5 rounded gap-2"
                              >
                                <span className="truncate flex items-center gap-1.5 font-sans text-slate-200 min-w-0">
                                  {pos && (
                                    <span className="px-1 py-0.2 rounded bg-slate-800 text-[9px] font-mono text-amber-300 shrink-0">
                                      {pos}{team && pos !== 'DEF' ? `·${team}` : ''}
                                    </span>
                                  )}
                                  <span className="truncate font-medium" title={displayName}>{displayName}</span>
                                </span>
                                <span className="font-bold text-slate-200 shrink-0">{pts} pts</span>
                              </div>
                            );
                          })
                        ) : (
                          <span className="text-slate-500 text-[10px]">No starter breakdown</span>
                        )}
                        <div className="pt-1 text-[10px] text-slate-400 flex justify-between">
                          <span>Bench Total:</span>
                          <span className="font-mono">{matchup.teamB.benchPoints} pts</span>
                        </div>
                      </div>
                    </div>
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

interface TeamRowProps {
  team: TeamInfo;
  isWinner: boolean;
  isTie: boolean;
  isBadBeat: boolean;
}

const TeamRow: React.FC<TeamRowProps> = ({ team, isWinner, isTie, isBadBeat }) => {
  return (
    <div
      className={`flex items-center justify-between p-2.5 rounded-lg transition-colors ${
        isWinner
          ? 'bg-emerald-950/20 border border-emerald-500/20'
          : 'bg-slate-900/40 border border-transparent'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <img
          src={team.avatarUrl}
          alt={team.teamName}
          className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p
              className={`text-sm font-bold truncate ${
                isWinner ? 'text-white' : 'text-slate-400'
              }`}
            >
              {team.teamName}
            </p>
            {isWinner && !isTie && (
              <span className="text-amber-400 shrink-0" title="Winner">
                <Trophy className="w-3.5 h-3.5 fill-amber-400/20" />
              </span>
            )}
            {isBadBeat && (
              <span className="text-rose-400 shrink-0" title="Highest scoring loser">
                <HeartCrack className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {team.ownerName}
          </p>
        </div>
      </div>

      <div className="text-right pl-3 shrink-0">
        <span
          className={`text-lg font-black font-mono tracking-tight ${
            isWinner ? 'text-emerald-400' : 'text-slate-300'
          }`}
        >
          {team.points}
        </span>
        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
          {isWinner ? (isTie ? 'Tie' : 'Won') : 'Lost'}
        </p>
      </div>
    </div>
  );
};
