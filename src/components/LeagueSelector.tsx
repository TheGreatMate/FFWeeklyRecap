import React from 'react';
import { Trophy, Users, ChevronRight, Loader2, Calendar, Skull, Swords } from 'lucide-react';
import { SleeperLeague } from '../types';
import { detectLeagueFormat } from '../utils/calc';
import { WeekSelector } from './WeekSelector';

interface LeagueSelectorProps {
  leagues: SleeperLeague[];
  selectedLeagueId: string | null;
  onSelectLeague: (league: SleeperLeague) => void;
  isLoadingMatchups: boolean;
  selectedWeek?: number;
  onSelectWeek?: (week: number) => void;
}

export const LeagueSelector: React.FC<LeagueSelectorProps> = ({
  leagues,
  selectedLeagueId,
  onSelectLeague,
  isLoadingMatchups,
  selectedWeek,
  onSelectWeek,
}) => {

  if (leagues.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-lg">
        <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-3 text-slate-400">
          <Calendar className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white mb-1">
          No 2026 Leagues Found
        </h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          This Sleeper account does not have active leagues registered for the 2026 season yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <span>Select a 2026 League</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 font-mono">
              {leagues.length} Available
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Click any league to inspect type, calculate scores, and generate customized notes
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {selectedWeek !== undefined && onSelectWeek && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline">
                Week:
              </span>
              <WeekSelector
                currentWeek={selectedWeek}
                onSelectWeek={onSelectWeek}
                disabled={isLoadingMatchups}
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3" id="leagues-button-container">
        {leagues.map((league) => {
          const isSelected = selectedLeagueId === league.league_id;
          const isChopped = detectLeagueFormat(league) === 'chopped';
          const isPPR = (league.scoring_settings?.rec ?? 0) > 0;
          const scoringLabel = isPPR
            ? league.scoring_settings?.rec === 0.5
              ? 'Half PPR'
              : 'Full PPR'
            : 'Standard';

          return (
            <button
              key={league.league_id}
              id={`league-btn-${league.league_id}`}
              onClick={() => onSelectLeague(league)}
              disabled={isLoadingMatchups && isSelected}
              className={`text-left p-4 rounded-xl border transition-all relative flex flex-col justify-between group cursor-pointer ${
                isSelected
                  ? isChopped
                    ? 'bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/30 shadow-lg shadow-rose-950/50'
                    : 'bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/30 shadow-lg shadow-emerald-950/50'
                  : 'bg-slate-950/80 hover:bg-slate-800/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-3">
                  {league.avatar ? (
                    <img
                      src={`https://sleepercdn.com/avatars/thumbs/${league.avatar}`}
                      alt={league.name}
                      className="w-10 h-10 rounded-lg object-cover border border-slate-700 shrink-0"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-lg border flex items-center justify-center shrink-0 ${
                        isChopped
                          ? 'bg-rose-900/40 border-rose-800/60 text-rose-400'
                          : 'bg-emerald-900/40 border-emerald-800/60 text-emerald-400'
                      }`}
                    >
                      {isChopped ? <Skull className="w-5 h-5" /> : <Trophy className="w-5 h-5" />}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`font-bold text-white text-base transition-colors line-clamp-1 ${
                          isChopped ? 'group-hover:text-rose-400' : 'group-hover:text-emerald-400'
                        }`}
                      >
                        {league.name}
                      </h4>
                      {isChopped ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-700/80 flex items-center gap-1">
                          <span>🪓 Chopped</span>
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
                          <Swords className="w-3 h-3 text-slate-400" />
                          <span>H2H</span>
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      ID: {league.league_id}
                    </span>
                  </div>
                </div>

                {isLoadingMatchups && isSelected ? (
                  <Loader2
                    className={`w-5 h-5 animate-spin shrink-0 ${
                      isChopped ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  />
                ) : (
                  <ChevronRight
                    className={`w-5 h-5 shrink-0 transition-transform ${
                      isSelected
                        ? isChopped
                          ? 'text-rose-400 translate-x-1'
                          : 'text-emerald-400 translate-x-1'
                        : 'text-slate-600 group-hover:text-slate-300'
                    }`}
                  />
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/70 text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-500" />
                    <span>{league.total_rosters || 12} Teams</span>
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                    {scoringLabel}
                  </span>
                </div>
                <span
                  className={`font-semibold capitalize text-xs ${
                    isChopped ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {isChopped ? 'Survival Elimination' : 'Weekly Matchups'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
