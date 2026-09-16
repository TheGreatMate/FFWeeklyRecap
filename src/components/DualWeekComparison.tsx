import React from 'react';
import {
  Trophy,
  Skull,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Newspaper,
  Calendar,
  Flame,
  Swords,
  Award,
  Sparkles,
  Zap,
} from 'lucide-react';
import { WeekStats, ChoppedWeekStats, LeagueFormat, TeamInfo } from '../types';

interface DualWeekComparisonProps {
  leagueName: string;
  format: LeagueFormat;
  week1Stats: WeekStats | null;
  week2Stats: WeekStats | null;
  choppedWeek1Stats: ChoppedWeekStats | null;
  choppedWeek2Stats: ChoppedWeekStats | null;
  onSelectWeek: (week: number) => void;
  onOpenGazette: (week: number) => void;
  isLoading?: boolean;
}

interface CombinedTeamRow {
  rosterId: number;
  manager: string;
  teamName: string;
  avatarUrl?: string;
  week1Score: number;
  week2Score: number;
  totalScore: number;
  averageScore: number;
  delta: number; // week2 - week1
  week1TopPlayer?: string;
  week2TopPlayer?: string;
  status: 'active' | 'chopped_wk1' | 'chopped_wk2';
}

export const DualWeekComparison: React.FC<DualWeekComparisonProps> = ({
  leagueName,
  format,
  week1Stats,
  week2Stats,
  choppedWeek1Stats,
  choppedWeek2Stats,
  onSelectWeek,
  onOpenGazette,
  isLoading = false,
}) => {
  const isChopped = format === 'chopped';

  // Build combined team roster rows
  const combinedRows: CombinedTeamRow[] = React.useMemo(() => {
    const map = new Map<number, CombinedTeamRow>();

    if (isChopped) {
      const c1Teams = choppedWeek1Stats?.allRankedTeams || [];
      const c2Teams = choppedWeek2Stats?.allRankedTeams || [];

      // Process week 1
      c1Teams.forEach((t) => {
        const topP = t.topRankedPlayers && t.topRankedPlayers.length > 0 ? t.topRankedPlayers[0].name : undefined;
        map.set(t.rosterId, {
          rosterId: t.rosterId,
          manager: t.ownerName,
          teamName: t.teamName,
          avatarUrl: t.avatarUrl,
          week1Score: t.points,
          week2Score: 0,
          totalScore: t.points,
          averageScore: t.points,
          delta: 0,
          week1TopPlayer: topP,
          status: choppedWeek1Stats?.choppedTeam?.rosterId === t.rosterId ? 'chopped_wk1' : 'active',
        });
      });

      // Merge week 2
      c2Teams.forEach((t) => {
        const topP = t.topRankedPlayers && t.topRankedPlayers.length > 0 ? t.topRankedPlayers[0].name : undefined;
        const existing = map.get(t.rosterId);
        if (existing) {
          existing.week2Score = t.points;
          existing.totalScore = Number((existing.week1Score + t.points).toFixed(2));
          existing.averageScore = Number((existing.totalScore / 2).toFixed(2));
          existing.delta = Number((t.points - existing.week1Score).toFixed(2));
          existing.week2TopPlayer = topP;
          if (choppedWeek2Stats?.choppedTeam?.rosterId === t.rosterId) {
            existing.status = 'chopped_wk2';
          }
        } else {
          map.set(t.rosterId, {
            rosterId: t.rosterId,
            manager: t.ownerName,
            teamName: t.teamName,
            avatarUrl: t.avatarUrl,
            week1Score: 0,
            week2Score: t.points,
            totalScore: t.points,
            averageScore: t.points,
            delta: t.points,
            week2TopPlayer: topP,
            status: choppedWeek2Stats?.choppedTeam?.rosterId === t.rosterId ? 'chopped_wk2' : 'active',
          });
        }
      });
    } else {
      // Standard Head-to-Head
      const extractTeams = (ws: WeekStats | null): TeamInfo[] => {
        if (!ws) return [];
        const teams: TeamInfo[] = [];
        ws.matchups.forEach((m) => {
          if (m.teamA) teams.push(m.teamA);
          if (m.teamB) teams.push(m.teamB);
        });
        return teams;
      };

      const w1Teams = extractTeams(week1Stats);
      const w2Teams = extractTeams(week2Stats);

      w1Teams.forEach((t) => {
        const topP = t.topRankedPlayers && t.topRankedPlayers.length > 0 ? t.topRankedPlayers[0].name : undefined;
        map.set(t.rosterId, {
          rosterId: t.rosterId,
          manager: t.ownerName,
          teamName: t.teamName,
          avatarUrl: t.avatarUrl,
          week1Score: t.points,
          week2Score: 0,
          totalScore: t.points,
          averageScore: t.points,
          delta: 0,
          week1TopPlayer: topP,
          status: 'active',
        });
      });

      w2Teams.forEach((t) => {
        const topP = t.topRankedPlayers && t.topRankedPlayers.length > 0 ? t.topRankedPlayers[0].name : undefined;
        const existing = map.get(t.rosterId);
        if (existing) {
          existing.week2Score = t.points;
          existing.totalScore = Number((existing.week1Score + t.points).toFixed(2));
          existing.averageScore = Number((existing.totalScore / 2).toFixed(2));
          existing.delta = Number((t.points - existing.week1Score).toFixed(2));
          existing.week2TopPlayer = topP;
        } else {
          map.set(t.rosterId, {
            rosterId: t.rosterId,
            manager: t.ownerName,
            teamName: t.teamName,
            avatarUrl: t.avatarUrl,
            week1Score: 0,
            week2Score: t.points,
            totalScore: t.points,
            averageScore: t.points,
            delta: t.points,
            week2TopPlayer: topP,
            status: 'active',
          });
        }
      });
    }

    return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
  }, [isChopped, week1Stats, week2Stats, choppedWeek1Stats, choppedWeek2Stats]);

  const w1Avg = isChopped ? choppedWeek1Stats?.averageScore || 0 : week1Stats?.averageScore || 0;
  const w2Avg = isChopped ? choppedWeek2Stats?.averageScore || 0 : week2Stats?.averageScore || 0;
  const avgDelta = Number((w2Avg - w1Avg).toFixed(2));

  // Find biggest riser & faller
  const biggestRiser = [...combinedRows].sort((a, b) => b.delta - a.delta)[0];
  const biggestFaller = [...combinedRows].sort((a, b) => a.delta - b.delta)[0];

  return (
    <div id="dual-week-comparison" className="space-y-6">
      {/* Top Banner Header */}
      <div
        className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl ${
          isChopped
            ? 'bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border-rose-900/60'
            : 'bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border-indigo-900/60'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <div
            className={`w-12 h-12 rounded-xl border flex items-center justify-center font-bold shrink-0 ${
              isChopped
                ? 'bg-rose-900/40 border-rose-700/60 text-rose-400 shadow-md shadow-rose-950/50'
                : 'bg-indigo-900/40 border-indigo-700/60 text-indigo-400 shadow-md shadow-indigo-950/50'
            }`}
          >
            {isChopped ? <Skull className="w-7 h-7" /> : <Swords className="w-7 h-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-white tracking-tight">
                {leagueName} • Weeks 1 & 2 Dual Analysis
              </h2>
              <span
                className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                  isChopped
                    ? 'bg-rose-950 text-rose-300 border-rose-700'
                    : 'bg-indigo-950 text-indigo-300 border-indigo-700'
                }`}
              >
                Side-by-Side Comparison
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Comparing team scoring trajectories, top player performances, and weekly swings across both kickoff weeks.
            </p>
          </div>
        </div>

        {/* Quick Launch Buttons for Week 1 / Week 2 Gazettes */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
          <button
            type="button"
            id="dual-open-w1-gazette-btn"
            onClick={() => onOpenGazette(1)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Read Week 1 Gazette Newspaper"
          >
            <Newspaper className="w-3.5 h-3.5 text-emerald-400" />
            <span>Week 1 Gazette</span>
          </button>

          <button
            type="button"
            id="dual-open-w2-gazette-btn"
            onClick={() => onOpenGazette(2)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Read Week 2 Gazette Newspaper"
          >
            <Newspaper className="w-3.5 h-3.5 text-emerald-400" />
            <span>Week 2 Gazette</span>
          </button>
        </div>
      </div>

      {/* Side-by-Side Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Column 1: Week 1 Key Metrics */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Week 1 Snapshot</span>
            </span>
            <button
              type="button"
              onClick={() => onSelectWeek(1)}
              className="text-[11px] font-bold text-slate-400 hover:text-white underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View Wk 1</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Top Scorer</span>
              <p className="font-bold text-white text-sm">
                {isChopped
                  ? choppedWeek1Stats?.apexSurvivor?.ownerName || 'N/A'
                  : week1Stats?.highestScorer?.ownerName || 'N/A'}
                <span className="text-emerald-400 font-mono ml-2">
                  {isChopped
                    ? `${choppedWeek1Stats?.apexSurvivor?.points || 0} pts`
                    : `${week1Stats?.highestScorer?.points || 0} pts`}
                </span>
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                {isChopped ? 'Chopped Execution' : 'Blowout Winner'}
              </span>
              <p className="font-bold text-slate-300">
                {isChopped ? (
                  <span className="text-rose-400">
                    🪓 {choppedWeek1Stats?.choppedTeam?.ownerName || 'N/A'} (
                    {choppedWeek1Stats?.choppedTeam?.points} pts)
                  </span>
                ) : (
                  <span>
                    {week1Stats?.biggestBlowout?.winner?.ownerName} def.{' '}
                    {week1Stats?.biggestBlowout?.loser?.ownerName} (+
                    {week1Stats?.biggestBlowout?.margin?.toFixed(1)} pts)
                  </span>
                )}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">League Scoring Avg</span>
              <p className="font-bold text-slate-200 font-mono">{w1Avg.toFixed(2)} pts</p>
            </div>
          </div>
        </div>

        {/* Column 2: Trajectory & Delta Comparison */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" />
              <span>Week-over-Week Shift</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400">Wk 1 ➔ Wk 2</span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">League Scoring Trend</span>
              <p className="font-bold text-white text-sm flex items-center gap-1.5">
                {avgDelta >= 0 ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-mono">+{avgDelta.toFixed(2)} pts</span>
                    <span className="text-slate-400 text-xs font-normal">(Offenses Exploded)</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                    <span className="text-rose-400 font-mono">{avgDelta.toFixed(2)} pts</span>
                    <span className="text-slate-400 text-xs font-normal">(Defensive Week)</span>
                  </>
                )}
              </p>
            </div>

            {biggestRiser && (
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Biggest Riser</span>
                <p className="font-bold text-slate-200">
                  {biggestRiser.manager}{' '}
                  <span className="text-emerald-400 font-mono">+{biggestRiser.delta.toFixed(1)} pts</span>
                </p>
              </div>
            )}

            {biggestFaller && (
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold block">Biggest Faller</span>
                <p className="font-bold text-slate-200">
                  {biggestFaller.manager}{' '}
                  <span className="text-rose-400 font-mono">{biggestFaller.delta.toFixed(1)} pts</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Week 2 Key Metrics */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Week 2 Snapshot</span>
            </span>
            <button
              type="button"
              onClick={() => onSelectWeek(2)}
              className="text-[11px] font-bold text-slate-400 hover:text-white underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>View Wk 2</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Top Scorer</span>
              <p className="font-bold text-white text-sm">
                {isChopped
                  ? choppedWeek2Stats?.apexSurvivor?.ownerName || 'N/A'
                  : week2Stats?.highestScorer?.ownerName || 'N/A'}
                <span className="text-emerald-400 font-mono ml-2">
                  {isChopped
                    ? `${choppedWeek2Stats?.apexSurvivor?.points || 0} pts`
                    : `${week2Stats?.highestScorer?.points || 0} pts`}
                </span>
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">
                {isChopped ? 'Chopped Execution' : 'Blowout Winner'}
              </span>
              <p className="font-bold text-slate-300">
                {isChopped ? (
                  <span className="text-rose-400">
                    🪓 {choppedWeek2Stats?.choppedTeam?.ownerName || 'N/A'} (
                    {choppedWeek2Stats?.choppedTeam?.points} pts)
                  </span>
                ) : (
                  <span>
                    {week2Stats?.biggestBlowout?.winner?.ownerName} def.{' '}
                    {week2Stats?.biggestBlowout?.loser?.ownerName} (+
                    {week2Stats?.biggestBlowout?.margin?.toFixed(1)} pts)
                  </span>
                )}
              </p>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-bold block">League Scoring Avg</span>
              <p className="font-bold text-slate-200 font-mono">{w2Avg.toFixed(2)} pts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Combined 2-Week Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">
              Weeks 1 & 2 Combined Scoring & Standings
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono font-bold">
              {combinedRows.length} Teams
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Click any week score to jump directly to that week's complete breakdown.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 text-[10px] uppercase tracking-wider font-bold border-b border-slate-800">
                <th className="py-3 px-4 w-12 text-center">Rank</th>
                <th className="py-3 px-4">Manager & Roster</th>
                <th className="py-3 px-4 text-right">Wk 1 Pts</th>
                <th className="py-3 px-4 text-right">Wk 2 Pts</th>
                <th className="py-3 px-4 text-right font-black text-white">2-Wk Total</th>
                <th className="py-3 px-4 text-right">2-Wk Avg</th>
                <th className="py-3 px-4 text-center">Trend (W2 - W1)</th>
                <th className="py-3 px-4">Top Player (W1 / W2)</th>
                {isChopped && <th className="py-3 px-4 text-center">Status</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {combinedRows.map((team, idx) => {
                const rank = idx + 1;
                const isTop3 = rank <= 3;
                const isRiser = team.delta > 0;
                const isNeutral = team.delta === 0;

                return (
                  <tr
                    key={team.rosterId}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-mono font-bold ${
                          rank === 1
                            ? 'bg-amber-400 text-slate-950 shadow-sm'
                            : rank === 2
                            ? 'bg-slate-300 text-slate-950'
                            : rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'text-slate-500'
                        }`}
                      >
                        {rank}
                      </span>
                    </td>

                    {/* Manager & Team */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5 min-w-[160px]">
                        <img
                          src={
                            team.avatarUrl ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(team.manager)}`
                          }
                          alt={team.manager}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0 bg-slate-800"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-white truncate text-xs group-hover:text-emerald-400 transition-colors">
                            {team.manager}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{team.teamName}</p>
                        </div>
                      </div>
                    </td>

                    {/* Week 1 Points */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <button
                        type="button"
                        onClick={() => onSelectWeek(1)}
                        className="font-bold text-slate-300 hover:text-emerald-400 hover:underline cursor-pointer"
                        title="Jump to Week 1 breakdown"
                      >
                        {team.week1Score.toFixed(2)}
                      </button>
                    </td>

                    {/* Week 2 Points */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <button
                        type="button"
                        onClick={() => onSelectWeek(2)}
                        className="font-bold text-slate-300 hover:text-emerald-400 hover:underline cursor-pointer"
                        title="Jump to Week 2 breakdown"
                      >
                        {team.week2Score.toFixed(2)}
                      </button>
                    </td>

                    {/* Total Points */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-white text-sm">
                      {team.totalScore.toFixed(2)}
                    </td>

                    {/* Average */}
                    <td className="py-3.5 px-4 text-right font-mono text-slate-400">
                      {team.averageScore.toFixed(2)}
                    </td>

                    {/* Trend / Delta */}
                    <td className="py-3.5 px-4 text-center font-mono">
                      {isNeutral ? (
                        <span className="text-slate-500 font-semibold">0.00</span>
                      ) : isRiser ? (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold text-[11px]">
                          <TrendingUp className="w-3 h-3" />
                          <span>+{team.delta.toFixed(1)}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold text-[11px]">
                          <TrendingDown className="w-3 h-3" />
                          <span>{team.delta.toFixed(1)}</span>
                        </span>
                      )}
                    </td>

                    {/* Top Players */}
                    <td className="py-3.5 px-4 text-[11px] text-slate-400">
                      <div className="flex flex-col gap-0.5">
                        <span className="truncate">
                          <strong className="text-slate-300">W1:</strong> {team.week1TopPlayer || '—'}
                        </span>
                        <span className="truncate">
                          <strong className="text-slate-300">W2:</strong> {team.week2TopPlayer || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Status for Chopped Leagues */}
                    {isChopped && (
                      <td className="py-3.5 px-4 text-center">
                        {team.status === 'chopped_wk1' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold text-[10px] uppercase">
                            🪓 Chopped Wk 1
                          </span>
                        ) : team.status === 'chopped_wk2' ? (
                          <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-bold text-[10px] uppercase">
                            🪓 Chopped Wk 2
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold text-[10px] uppercase">
                            ✓ Survivor
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
