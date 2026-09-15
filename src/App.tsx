import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Loader2,
  Calendar,
  Sparkles,
  FileText,
  Swords,
  Info,
  Skull,
  Shield,
  Layers,
  Newspaper,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { UserSearch } from './components/UserSearch';
import { LeagueSelector } from './components/LeagueSelector';
import { AwardsBanner } from './components/AwardsBanner';
import { MatchupScoreboard } from './components/MatchupScoreboard';
import { NotesGenerator } from './components/NotesGenerator';
import { ChoppedBanner } from './components/ChoppedBanner';
import { ChoppedLeaderboard } from './components/ChoppedLeaderboard';
import {
  SleeperUser,
  SleeperLeague,
  SleeperRoster,
  SleeperLeagueUser,
  SleeperMatchupItem,
  WeekStats,
  ChoppedWeekStats,
  LeagueFormat,
  CompactPlayer,
} from './types';
import {
  calculateWeekStats,
  detectLeagueFormat,
  calculateChoppedStats,
} from './utils/calc';
import { fetchPlayersBatch } from './utils/playerResolver';
import {
  DEMO_USER,
  DEMO_LEAGUE,
  DEMO_CHOPPED_LEAGUE,
  DEMO_USERS,
  DEMO_ROSTERS,
  DEMO_MATCHUPS_WEEK_1,
  DEMO_CHOPPED_MATCHUPS_WEEK_1,
} from './data/demoLeague';
import { SLEEPER_PLAYERS_MAP } from './data/sleeperPlayers';

export default function App() {
  const SEASON = '2026';
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [username, setUsername] = useState<string>('');

  // User state
  const [user, setUser] = useState<SleeperUser | null>(null);
  const [isSearchingUser, setIsSearchingUser] = useState<boolean>(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Leagues state
  const [leagues, setLeagues] = useState<SleeperLeague[]>([]);
  const [selectedLeague, setSelectedLeague] = useState<SleeperLeague | null>(null);

  // Matchup & Roster state
  const [isLoadingMatchups, setIsLoadingMatchups] = useState<boolean>(false);
  const [matchupError, setMatchupError] = useState<string | null>(null);

  // Calculated stats based on league type
  const [leagueFormat, setLeagueFormat] = useState<LeagueFormat>('head_to_head');
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [choppedStats, setChoppedStats] = useState<ChoppedWeekStats | null>(null);
  const [playersMap, setPlayersMap] = useState<Record<string, CompactPlayer>>(SLEEPER_PLAYERS_MAP);

  // Active view tab when league is selected
  const [activeTab, setActiveTab] = useState<'notes' | 'breakdown'>('notes');
  const [isDemoActive, setIsDemoActive] = useState<boolean>(false);

  // Helper to fetch Sleeper data (tries backend proxy first, then direct Sleeper API fallback)
  const fetchSleeperUser = async (uname: string): Promise<SleeperUser> => {
    try {
      const res = await fetch(`/api/sleeper/user/${encodeURIComponent(uname)}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend proxy fetch failed, trying direct Sleeper API...');
    }

    const directRes = await fetch(`https://api.sleeper.app/v1/user/${encodeURIComponent(uname)}`);
    if (!directRes.ok) {
      throw new Error('User not found on Sleeper! Check your spelling.');
    }
    const data = await directRes.json();
    if (!data || !data.user_id) {
      throw new Error('User not found! Check your spelling.');
    }
    return data;
  };

  const fetchUserLeagues = async (userId: string): Promise<SleeperLeague[]> => {
    try {
      const res = await fetch(`/api/sleeper/user/${userId}/leagues/${SEASON}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend proxy leagues failed, trying direct Sleeper API...');
    }

    const directRes = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${SEASON}`);
    if (!directRes.ok) {
      return [];
    }
    const data = await directRes.json();
    return Array.isArray(data) ? data : [];
  };

  const fetchLeagueMatchupData = async (league: SleeperLeague, week: number) => {
    setIsLoadingMatchups(true);
    setMatchupError(null);
    setIsDemoActive(false);

    try {
      const leagueId = league.league_id;

      // Check if it's the demo chopped league
      if (leagueId === DEMO_CHOPPED_LEAGUE.league_id) {
        setLeagueFormat('chopped');
        const cStats = calculateChoppedStats(DEMO_ROSTERS, DEMO_USERS, DEMO_CHOPPED_MATCHUPS_WEEK_1, week);
        setChoppedStats(cStats);
        setWeekStats(null);
        setIsLoadingMatchups(false);
        return;
      }

      // Check if it's the demo standard league
      if (leagueId === DEMO_LEAGUE.league_id) {
        setLeagueFormat('head_to_head');
        const hStats = calculateWeekStats(DEMO_ROSTERS, DEMO_USERS, DEMO_MATCHUPS_WEEK_1, week);
        setWeekStats(hStats);
        setChoppedStats(null);
        setIsLoadingMatchups(false);
        return;
      }

      // Fetch via backend consolidated endpoint
      const res = await fetch(`/api/sleeper/league/${leagueId}/details/${week}`);
      let rosters: SleeperRoster[] = [];
      let users: SleeperLeagueUser[] = [];
      let matchups: SleeperMatchupItem[] = [];
      let currentPlayers: Record<string, CompactPlayer> = { ...SLEEPER_PLAYERS_MAP, ...playersMap };

      if (res.ok) {
        const data = await res.json();
        rosters = data.rosters || [];
        users = data.users || [];
        matchups = data.matchups || [];
        if (data.players) {
          // Merge incoming players without overwriting valid names with generic placeholders
          for (const [pId, pObj] of Object.entries(data.players as Record<string, CompactPlayer>)) {
            if (pObj && pObj.name && !pObj.name.startsWith('Player #') && !/^\d+$/.test(pObj.name)) {
              currentPlayers[pId] = pObj;
            } else if (!currentPlayers[pId]) {
              currentPlayers[pId] = pObj;
            }
          }
          setPlayersMap(currentPlayers);
        }
      } else {
        // Fallback to direct parallel calls
        const [rostersRes, usersRes, matchupsRes] = await Promise.all([
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`),
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`),
        ]);

        rosters = rostersRes.ok ? await rostersRes.json() : [];
        users = usersRes.ok ? await usersRes.json() : [];
        matchups = matchupsRes.ok ? await matchupsRes.json() : [];
      }

      // Check for any unmapped numeric player IDs in starters
      const missingIds: string[] = [];
      matchups.forEach((m) => {
        (m.starters || []).forEach((id) => {
          const curr = currentPlayers[id];
          const isUnresolved = !curr || !curr.name || curr.name.startsWith('Player #') || /^\d+$/.test(curr.name);
          if (/^\d+$/.test(id) && isUnresolved) {
            missingIds.push(id);
          }
        });
      });

      if (missingIds.length > 0) {
        try {
          const batchFetched = await fetchPlayersBatch(missingIds);
          if (Object.keys(batchFetched).length > 0) {
            currentPlayers = { ...currentPlayers, ...batchFetched };
            setPlayersMap(currentPlayers);
          }
        } catch (e) {
          console.warn('Failed to fetch missing player batch:', e);
        }
      }

      // Inspect league format: standard head-to-head vs chopped/survival
      const detectedFormat = detectLeagueFormat(league, matchups);
      setLeagueFormat(detectedFormat);

      if (!matchups || matchups.length === 0) {
        setMatchupError(
          `No matchup score data found for Week ${week} in this league yet. Games may not have started yet, or scores have not been posted.`
        );

        if (detectedFormat === 'chopped') {
          const cStats = calculateChoppedStats(DEMO_ROSTERS, DEMO_USERS, DEMO_CHOPPED_MATCHUPS_WEEK_1, week, currentPlayers);
          setChoppedStats(cStats);
          setWeekStats(null);
        } else {
          const calculated = calculateWeekStats(DEMO_ROSTERS, DEMO_USERS, DEMO_MATCHUPS_WEEK_1, week, currentPlayers);
          setWeekStats(calculated);
          setChoppedStats(null);
        }
      } else {
        if (detectedFormat === 'chopped') {
          const cStats = calculateChoppedStats(rosters, users, matchups, week, currentPlayers);
          setChoppedStats(cStats);
          setWeekStats(null);
        } else {
          const calculated = calculateWeekStats(rosters, users, matchups, week, currentPlayers);
          setWeekStats(calculated);
          setChoppedStats(null);
        }
      }
    } catch (err: any) {
      console.error('Error fetching matchups:', err);
      setMatchupError(err.message || 'Failed to fetch league matchups.');
    } finally {
      setIsLoadingMatchups(false);
    }
  };

  // Search user function
  const handleSearchUser = async (searchUsername: string) => {
    setIsSearchingUser(true);
    setUserError(null);
    setSelectedLeague(null);
    setWeekStats(null);
    setChoppedStats(null);
    setUsername(searchUsername);

    // If searching demo
    if (searchUsername.toLowerCase() === 'fantasychamp') {
      handleLoadDemo();
      setIsSearchingUser(false);
      return;
    }

    try {
      // Step 1: Use Sleeper API to find User ID
      const userData = await fetchSleeperUser(searchUsername);
      setUser(userData);

      // Step 2: Use User ID to fetch 2026 NFL leagues
      const userLeagues = await fetchUserLeagues(userData.user_id);
      setLeagues(userLeagues);

      if (userLeagues.length === 0) {
        setUserError(`No leagues found for ${searchUsername} in the 2026 NFL season.`);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setUser(null);
      setLeagues([]);
      setUserError(err.message || 'User not found! Check your spelling.');
    } finally {
      setIsSearchingUser(false);
    }
  };

  // Click on a league button
  const handleSelectLeague = (league: SleeperLeague) => {
    setSelectedLeague(league);
    fetchLeagueMatchupData(league, selectedWeek);
  };

  // Load Demo Standard H2H League
  const handleLoadDemo = () => {
    setIsDemoActive(true);
    setUser(DEMO_USER);
    setUsername(DEMO_USER.username);
    setLeagues([DEMO_LEAGUE, DEMO_CHOPPED_LEAGUE]);
    setSelectedLeague(DEMO_LEAGUE);
    setLeagueFormat('head_to_head');
    setUserError(null);
    setMatchupError(null);
    const stats = calculateWeekStats(DEMO_ROSTERS, DEMO_USERS, DEMO_MATCHUPS_WEEK_1, 1, SLEEPER_PLAYERS_MAP);
    setWeekStats(stats);
    setChoppedStats(null);
  };

  // Load Demo Chopped / Guillotine League
  const handleLoadChoppedDemo = () => {
    setIsDemoActive(true);
    setUser(DEMO_USER);
    setUsername(DEMO_USER.username);
    setLeagues([DEMO_LEAGUE, DEMO_CHOPPED_LEAGUE]);
    setSelectedLeague(DEMO_CHOPPED_LEAGUE);
    setLeagueFormat('chopped');
    setUserError(null);
    setMatchupError(null);
    const cStats = calculateChoppedStats(DEMO_ROSTERS, DEMO_USERS, DEMO_CHOPPED_MATCHUPS_WEEK_1, 1, SLEEPER_PLAYERS_MAP);
    setChoppedStats(cStats);
    setWeekStats(null);
  };

  // Auto-load demo on initial load so the app greets the user with immediate visual proof and interactivity
  useEffect(() => {
    handleLoadDemo();
  }, []);

  const isChoppedMode = leagueFormat === 'chopped';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onLoadDemo={handleLoadDemo}
        isDemoActive={isDemoActive}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner notification for Demo state */}
        {isDemoActive && (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong>Sample League Mode:</strong> Try switching between{' '}
                <button
                  type="button"
                  onClick={handleLoadDemo}
                  className={`font-bold underline cursor-pointer ${!isChoppedMode ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Standard Head-to-Head
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={handleLoadChoppedDemo}
                  className={`font-bold underline cursor-pointer ${isChoppedMode ? 'text-rose-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Chopped / Guillotine Format
                </button>
                !
              </span>
            </div>
            <button
              onClick={() => {
                setUser(null);
                setSelectedLeague(null);
                setWeekStats(null);
                setChoppedStats(null);
                setLeagues([]);
                setIsDemoActive(false);
              }}
              className="text-slate-400 hover:text-white font-medium underline self-end sm:self-auto cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}

        {/* Step 1 & 2: User Search Input & User ID Resolution */}
        <UserSearch
          onSearchUser={handleSearchUser}
          isLoading={isSearchingUser}
          user={user}
          error={userError}
          currentUsername={username}
          onClear={() => {
            setUser(null);
            setLeagues([]);
            setSelectedLeague(null);
            setWeekStats(null);
            setChoppedStats(null);
          }}
        />

        {/* Step 3: Display Fetched Leagues as Clickable Buttons */}
        {user && !userError && (
          <LeagueSelector
            leagues={leagues}
            selectedLeagueId={selectedLeague?.league_id || null}
            onSelectLeague={handleSelectLeague}
            isLoadingMatchups={isLoadingMatchups}
            onLoadDemo={handleLoadDemo}
            onLoadChoppedDemo={handleLoadChoppedDemo}
          />
        )}

        {/* Loading Matchups Indicator */}
        {isLoadingMatchups && (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-3" />
            <p className="font-bold text-white text-base">
              Inspecting League Format & Pulling Week {selectedWeek} Scores...
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Checking for chopped / guillotine elimination rules, calculating standings, blowouts, and bad beats...
            </p>
          </div>
        )}

        {/* Matchup Error Notice (with fallback data) */}
        {matchupError && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">Note on League Scores</p>
              <p className="mt-0.5">{matchupError}</p>
              <p className="mt-1 text-slate-400">
                Displaying sample Week 1 calculations below so you can generate and test Commissioner Notes!
              </p>
            </div>
          </div>
        )}

        {/* Step 4: When a league is clicked, show adapted layout for Chopped vs H2H */}
        {selectedLeague && (weekStats || choppedStats) && (
          <div className="space-y-6">
            {/* Active League Header Bar */}
            <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isChoppedMode
                ? 'bg-gradient-to-r from-slate-900 via-rose-950/20 to-slate-900 border-rose-900/60'
                : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center font-bold shrink-0 ${
                  isChoppedMode
                    ? 'bg-rose-900/40 border-rose-700/60 text-rose-400 shadow-md shadow-rose-950/50'
                    : 'bg-emerald-900/40 border-emerald-800/60 text-emerald-400'
                }`}>
                  {isChoppedMode ? <Skull className="w-6 h-6" /> : <Trophy className="w-6 h-6 text-amber-400" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-white tracking-tight">
                      {selectedLeague.name}
                    </h3>
                    {isChoppedMode ? (
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700 font-bold uppercase tracking-wider flex items-center gap-1">
                        <span>🪓 Chopped Guillotine Format</span>
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
                        Week {selectedWeek} • Head-to-Head
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isChoppedMode && choppedStats
                      ? `${choppedStats.totalTeams} Total Managers • Lowest Scorer Chopped Weekly • All vs All Format`
                      : `${weekStats?.totalTeams} Rosters • ${weekStats?.totalMatchups} Head-to-Head Matchups`}
                  </p>
                </div>
              </div>

              {/* Navigation Tabs - Dynamically adapted for Chopped vs H2H */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  id="tab-notes-btn"
                  onClick={() => setActiveTab('notes')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'notes'
                      ? isChoppedMode
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Newspaper className="w-3.5 h-3.5" />
                  <span>{isChoppedMode ? 'The Guillotine Gazette' : 'Weekly Gazette & Notes'}</span>
                </button>
                <button
                  type="button"
                  id="tab-matchups-btn"
                  onClick={() => setActiveTab('breakdown')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'breakdown'
                      ? isChoppedMode
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  {isChoppedMode ? (
                    <>
                      <Skull className="w-3.5 h-3.5" />
                      <span>Survivor Ladder & Waivers</span>
                    </>
                  ) : (
                    <>
                      <Swords className="w-3.5 h-3.5" />
                      <span>Matchups & Scores</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Top Spotlight: Chopped Banner vs Standard Awards Banner */}
            {isChoppedMode && choppedStats ? (
              <ChoppedBanner stats={choppedStats} leagueName={selectedLeague.name} />
            ) : weekStats ? (
              <AwardsBanner stats={weekStats} leagueName={selectedLeague.name} />
            ) : null}

            {/* Tab 1: Commissioner Notes / Execution Report Generator */}
            {activeTab === 'notes' && (
              <NotesGenerator
                leagueName={selectedLeague.name}
                format={leagueFormat}
                stats={weekStats}
                choppedStats={choppedStats}
                selectedWeek={selectedWeek}
              />
            )}

            {/* Tab 2: Chopped Ladder vs H2H Matchups Scoreboard */}
            {activeTab === 'breakdown' && (
              isChoppedMode && choppedStats ? (
                <ChoppedLeaderboard stats={choppedStats} />
              ) : weekStats ? (
                <MatchupScoreboard
                  matchups={weekStats.matchups}
                  biggestBlowoutMatchupId={weekStats.biggestBlowout?.matchupId}
                  highestScoringLoserRosterId={weekStats.highestScoringLoser?.team?.rosterId}
                  closestMatchupId={weekStats.closestMatchup?.matchupId}
                />
              ) : null
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            Powered by the official{' '}
            <a
              href="https://docs.sleeper.com"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline"
            >
              Sleeper API
            </a>{' '}
            & Google Gemini AI
          </p>
          <p className="text-slate-600">
            Fantasy Football Commissioner Notes Generator • 2026 NFL Season (Head-to-Head & Chopped Formats)
          </p>
        </div>
      </footer>
    </div>
  );
}
