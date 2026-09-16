import React from 'react';
import { Flame, HeartCrack, Trophy, Zap, AlertTriangle, TrendingUp, Skull, Calendar } from 'lucide-react';
import { WeekStats } from '../types';

interface AwardsBannerProps {
  stats: WeekStats;
  leagueName: string;
}

export const AwardsBanner: React.FC<AwardsBannerProps> = ({ stats, leagueName }) => {
  const { biggestBlowout, highestScoringLoser, highestScorer, lowestScorer, closestMatchup, averageScore, week } = stats;

  if (stats.hasStarted === false) {
    return (
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl text-center">
        <div className="inline-flex p-3 rounded-xl bg-slate-800/80 text-amber-400 border border-slate-700/60 mb-2">
          <Calendar className="w-5 h-5" />
        </div>
        <h3 className="text-base font-bold text-white">
          Week {week} Matchups Scheduled
        </h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
          Games for Week {week} have not commenced yet on Sleeper. Weekly awards, blowouts, and top scorers will activate as soon as scores are posted.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top 2 Primary Honors required by user prompt: Biggest Blowout & Highest-Scoring Loser */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Biggest Blowout */}
        {biggestBlowout ? (
          <div
            id="biggest-blowout-card"
            className="rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border border-amber-500/40 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    <Flame className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-amber-400">
                    Biggest Blowout of Week {week}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">
                  +{biggestBlowout.margin} pt Margin
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 my-3">
                {/* Winner */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-emerald-500/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Dominant Victor
                  </span>
                  <p className="font-bold text-white text-sm mt-1 truncate">
                    {biggestBlowout.winner.teamName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {biggestBlowout.winner.ownerName}
                  </p>
                  <p className="text-xl font-black font-mono text-emerald-400 mt-1">
                    {biggestBlowout.winner.points}{' '}
                    <span className="text-xs font-normal text-slate-400">pts</span>
                  </p>
                </div>

                {/* Loser */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/30">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <Skull className="w-3 h-3" /> Dismantled
                  </span>
                  <p className="font-bold text-slate-300 text-sm mt-1 truncate">
                    {biggestBlowout.loser.teamName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {biggestBlowout.loser.ownerName}
                  </p>
                  <p className="text-xl font-black font-mono text-rose-400/80 mt-1">
                    {biggestBlowout.loser.points}{' '}
                    <span className="text-xs font-normal text-slate-400">pts</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Score comparison bar */}
            <div className="mt-2">
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{
                    width: `${Math.round(
                      (biggestBlowout.winner.points /
                        (biggestBlowout.winner.points + biggestBlowout.loser.points)) *
                        100
                    )}%`,
                  }}
                  className="bg-emerald-500 h-full transition-all"
                />
                <div
                  style={{
                    width: `${Math.round(
                      (biggestBlowout.loser.points /
                        (biggestBlowout.winner.points + biggestBlowout.loser.points)) *
                        100
                    )}%`,
                  }}
                  className="bg-rose-500/60 h-full transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 text-center">
                A massive <strong className="text-amber-300">{biggestBlowout.margin} pt</strong> beatdown in Matchup #{biggestBlowout.matchupId}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-sm">
            No blowout data available yet
          </div>
        )}

        {/* Card 2: Highest-Scoring Loser */}
        {highestScoringLoser ? (
          <div
            id="highest-scoring-loser-card"
            className="rounded-2xl bg-gradient-to-br from-rose-950/40 via-slate-900 to-slate-950 border border-rose-500/40 p-5 shadow-xl relative overflow-hidden flex flex-col justify-between"
          >
            <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    <HeartCrack className="w-4 h-4" />
                  </span>
                  <span className="text-xs font-extrabold uppercase tracking-wider text-rose-400">
                    Highest-Scoring Loser (Bad Beat)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-mono font-bold text-xs border border-rose-500/30">
                  {highestScoringLoser.team.points} pts in a Loss
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 my-3">
                {/* Heartbroken Loser */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-rose-500/40">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                    <HeartCrack className="w-3 h-3" /> Unlucky Scorer
                  </span>
                  <p className="font-bold text-white text-sm mt-1 truncate">
                    {highestScoringLoser.team.teamName}
                  </p>
                  <p className="text-xs text-slate-400 truncate">
                    {highestScoringLoser.team.ownerName}
                  </p>
                  <p className="text-xl font-black font-mono text-rose-300 mt-1">
                    {highestScoringLoser.team.points}{' '}
                    <span className="text-xs font-normal text-slate-400">pts</span>
                  </p>
                </div>

                {/* Opponent who edged them out */}
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-700/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    Winning Opponent
                  </span>
                  <p className="font-bold text-slate-200 text-sm mt-1 truncate">
                    {highestScoringLoser.matchup.winner.teamName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {highestScoringLoser.matchup.winner.ownerName}
                  </p>
                  <p className="text-xl font-black font-mono text-emerald-400 mt-1">
                    {highestScoringLoser.matchup.winner.points}{' '}
                    <span className="text-xs font-normal text-slate-400">pts</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-2 text-[11px] text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
              Scored higher than{' '}
              <strong className="text-white">
                {Math.max(
                  0,
                  stats.matchups.filter((m) => m.winner.points < highestScoringLoser.team.points)
                    .length
                )}{' '}
                winning teams
              </strong>{' '}
              this week, but suffered a heartbreaking defeat.
            </div>
          </div>
        ) : (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-sm">
            No bad beat data available yet
          </div>
        )}
      </div>

      {/* Secondary Quick Stat Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* High Roller */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>High Roller</span>
          </span>
          <p className="font-bold text-white text-sm mt-1 truncate">
            {highestScorer?.teamName || '—'}
          </p>
          <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
            {highestScorer ? `${highestScorer.points} pts` : '—'}
          </p>
        </div>

        {/* Coldest Score */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-blue-400" />
            <span>Ice Cold Toilet</span>
          </span>
          <p className="font-bold text-white text-sm mt-1 truncate">
            {lowestScorer?.teamName || '—'}
          </p>
          <p className="text-sm font-bold font-mono text-blue-400 mt-0.5">
            {lowestScorer ? `${lowestScorer.points} pts` : '—'}
          </p>
        </div>

        {/* Closest Matchup */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-purple-400" />
            <span>Cardiac Finish</span>
          </span>
          <p className="font-bold text-white text-sm mt-1 truncate">
            {closestMatchup ? `${closestMatchup.winner.teamName}` : '—'}
          </p>
          <p className="text-sm font-bold font-mono text-purple-400 mt-0.5">
            {closestMatchup ? `+${closestMatchup.margin} margin` : '—'}
          </p>
        </div>

        {/* League Average */}
        <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>League Average</span>
          </span>
          <p className="font-bold text-white text-sm mt-1">
            {stats.totalTeams} Teams
          </p>
          <p className="text-sm font-bold font-mono text-emerald-400 mt-0.5">
            {averageScore} pts / tm
          </p>
        </div>
      </div>
    </div>
  );
};
