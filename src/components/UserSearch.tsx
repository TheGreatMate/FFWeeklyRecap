import React, { useState } from 'react';
import { Search, Loader2, User, AlertCircle, Calendar } from 'lucide-react';
import { SleeperUser } from '../types';

interface UserSearchProps {
  onSearchUser: (usernameOrLeagueId: string) => Promise<void>;
  isLoading: boolean;
  user: SleeperUser | null;
  error: string | null;
  currentUsername: string;
  season: string;
  onSeasonChange: (season: string) => void;
  onClear: () => void;
}

export const UserSearch: React.FC<UserSearchProps> = ({
  onSearchUser,
  isLoading,
  user,
  error,
  currentUsername,
  season,
  onSeasonChange,
  onClear,
}) => {
  const [inputVal, setInputVal] = useState(currentUsername);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isLoading) return;
    onSearchUser(inputVal.trim());
  };

  const handleQuickPick = (name: string) => {
    setInputVal(name);
    onSearchUser(name);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Find Your Sleeper Leagues</span>
            </h2>
            {/* Season Selector Chips */}
            <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
              {['2026', '2025', '2024'].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  id={`season-select-${yr}`}
                  onClick={() => onSeasonChange(yr)}
                  className={`px-2.5 py-0.5 text-xs font-semibold rounded-md transition-all ${
                    season === yr
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  NFL {yr}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Enter your Sleeper username or Sleeper League ID to load your real rosters, matchups, and scores.
          </p>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-400">
          <span className="text-slate-500 mr-1">Quick search:</span>
          {['FantasyChamp', 'Commish', 'gridiron'].map((s) => (
            <button
              key={s}
              type="button"
              id={`quick-suggest-${s}`}
              onClick={() => handleQuickPick(s)}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-colors font-medium"
            >
              @{s}
            </button>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-5 h-5" />
          </div>
          <input
            id="sleeper-username-input"
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Enter Sleeper Username (e.g. FantasyChamp) or League ID"
            className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium transition-all"
          />
        </div>

        <button
          id="search-leagues-btn"
          type="submit"
          disabled={isLoading || !inputVal.trim()}
          className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-emerald-900/20 flex items-center justify-center gap-2 min-w-[140px]"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Fetching...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Search Leagues</span>
            </>
          )}
        </button>
      </form>

      {/* Error state */}
      {error && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3 text-rose-300 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">{error}</p>
            <p className="text-xs text-rose-400/80 mt-0.5">
              Check the username or season, or paste your Sleeper League ID directly.
            </p>
          </div>
        </div>
      )}

      {/* User Card when found */}
      {user && !error && (
        <div className="mt-4 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {user.avatar ? (
              <img
                src={`https://sleepercdn.com/avatars/thumbs/${user.avatar}`}
                alt={user.display_name}
                className="w-10 h-10 rounded-full border border-slate-700 object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <User className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">
                  {user.display_name || user.username}
                </span>
                <span className="text-xs text-emerald-400 font-mono">
                  @{user.username}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                User ID: {user.user_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-semibold">
              Verified Sleeper Account
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
