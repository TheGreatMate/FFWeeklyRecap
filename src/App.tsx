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
  Columns2,
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { UserSearch } from './components/UserSearch';
import { LeagueSelector } from './components/LeagueSelector';
import { AwardsBanner } from './components/AwardsBanner';
import { MatchupScoreboard } from './components/MatchupScoreboard';
import { NotesGenerator } from './components/NotesGenerator';
import { ChoppedBanner } from './components/ChoppedBanner';
import { ChoppedLeaderboard } from './components/ChoppedLeaderboard';
import { DualWeekComparison } from './components/DualWeekComparison';
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
  DEMO_MATCHUPS_WEEK_2,
  DEMO_CHOPPED_MATCHUPS_WEEK_1,
  DEMO_CHOPPED_MATCHUPS_WEEK_2,
} from './data/demoLeague';
import { SLEEPER_PLAYERS_MAP } from './data/sleeperPlayers';
import { WeekSelector } from './components/WeekSelector';

export default function App() {
  const [season, setSeason] = useState<string>('2026');
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [username, setUsername] = useState<string>('');

  // Auto-detect latest NFL season from Sleeper state
  useEffect(() => {
    fetch('/api/sleeper/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((state) => {
        if (state?.season) {
          setSeason(String(state.season));
        }
      })
      .catch(() => {});
  }, []);

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

  // Cached stats for Weeks 1 & 2 dual comparison
  const [week1Stats, setWeek1Stats] = useState<WeekStats | null>(null);
  const [week2Stats, setWeek2Stats] = useState<WeekStats | null>(null);
  const [choppedWeek1Stats, setChoppedWeek1Stats] = useState<ChoppedWeekStats | null>(null);
  const [choppedWeek2Stats, setChoppedWeek2Stats] = useState<ChoppedWeekStats | null>(null);
  const [isDualWeek, setIsDualWeek] = useState<boolean>(false);

  // Active view tab when league is selected
  const [activeTab, setActiveTab] = useState<'notes' | 'breakdown' | 'dual'>('notes');
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

  const fetchUserLeagues = async (userId: string, seasonToFetch = season): Promise<SleeperLeague[]> => {
    try {
      const res = await fetch(`/api/sleeper/user/${userId}/leagues/${seasonToFetch}`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Backend proxy leagues failed, trying direct Sleeper API...');
    }

    const directRes = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${seasonToFetch}`);
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
        const demoMatchups = week === 2 ? DEMO_CHOPPED_MATCHUPS_WEEK_2 : DEMO_CHOPPED_MATCHUPS_WEEK_1;
        const prior = week === 2 ? { 1: DEMO_CHOPPED_MATCHUPS_WEEK_1 } : undefined;
        const cStats = calculateChoppedStats(DEMO_ROSTERS, DEMO_USERS, demoMatchups, week, SLEEPER_PLAYERS_MAP, prior);
        setChoppedStats(cStats);
        setWeekStats(null);
        if (week === 1) setChoppedWeek1Stats(cStats);
        if (week === 2) setChoppedWeek2Stats(cStats);
        setIsLoadingMatchups(false);
        return;
      }

      // Check if it's the demo standard league
      if (leagueId === DEMO_LEAGUE.league_id) {
        setLeagueFormat('head_to_head');
        const demoMatchups = week === 2 ? DEMO_MATCHUPS_WEEK_2 : DEMO_MATCHUPS_WEEK_1;
        const hStats = calculateWeekStats(DEMO_ROSTERS, DEMO_USERS, demoMatchups, week, SLEEPER_PLAYERS_MAP);
        setWeekStats(hStats);
        setChoppedStats(null);
        if (week === 1) setWeek1Stats(hStats);
        if (week === 2) setWeek2Stats(hStats);
        setIsLoadingMatchups(false);
        return;
      }

      // Fetch via backend consolidated endpoint
      const res = await fetch(`/api/sleeper/league/${leagueId}/details/${week}`);
      let rosters: SleeperRoster[] = [];
      let users: SleeperLeagueUser[] = [];
      let matchups: SleeperMatchupItem[] = [];
      let priorMatchups: Record<number, SleeperMatchupItem[]> = {};
      let currentPlayers: Record<string, CompactPlayer> = { ...SLEEPER_PLAYERS_MAP, ...playersMap };

      if (res.ok) {
        const data = await res.json();
        rosters = data.rosters || [];
        users = data.users || [];
        matchups = data.matchups || [];
        priorMatchups = data.priorMatchups || {};
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
        const fallbackTasks: Promise<any>[] = [
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`),
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`),
        ];

        // Also fetch prior weeks if week > 1
        if (week > 1) {
          for (let w = 1; w < week; w++) {
            fallbackTasks.push(
              fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${w}`)
                .then((r) => (r.ok ? r.json() : []))
                .then((m) => {
                  priorMatchups[w] = m;
                })
                .catch(() => {})
            );
          }
        }

        const [rostersRes, usersRes, matchupsRes] = await Promise.all(fallbackTasks);

        rosters = rostersRes && rostersRes.ok ? await rostersRes.json() : [];
        users = usersRes && usersRes.ok ? await usersRes.json() : [];
        matchups = matchupsRes && matchupsRes.ok ? await matchupsRes.json() : [];
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

      // If no matchups or no points recorded yet for this week, do NOT show fake demo data
      if (!matchups || matchups.length === 0) {
        setMatchupError(
          `No matchup score data found for Week ${week} in "${league.name}" on Sleeper yet. Games may not have started yet, or scores have not been posted.`
        );
        setWeekStats(null);
        setChoppedStats(null);
        if (week === 1) {
          setWeek1Stats(null);
          setChoppedWeek1Stats(null);
        }
        if (week === 2) {
          setWeek2Stats(null);
          setChoppedWeek2Stats(null);
        }
        return;
      }

      if (detectedFormat === 'chopped') {
        const cStats = calculateChoppedStats(rosters, users, matchups, week, currentPlayers, priorMatchups);
        setChoppedStats(cStats);
        setWeekStats(null);
        if (week === 1) setChoppedWeek1Stats(cStats);
        if (week === 2) setChoppedWeek2Stats(cStats);
      } else {
        const calculated = calculateWeekStats(rosters, users, matchups, week, currentPlayers);
        setWeekStats(calculated);
        setChoppedStats(null);
        if (week === 1) setWeek1Stats(calculated);
        if (week === 2) setWeek2Stats(calculated);
      }
    } catch (err: any) {
      console.error('Error fetching matchups:', err);
      setMatchupError(err.message || 'Failed to fetch league matchups.');
    } finally {
      setIsLoadingMatchups(false);
    }
  };

  // Search user or league ID function
  const handleSearchUser = async (searchInput: string) => {
    setIsSearchingUser(true);
    setUserError(null);
    setSelectedLeague(null);
    setWeekStats(null);
    setChoppedStats(null);
    setUsername(searchInput);

    const trimmed = searchInput.trim();

    // Check if input is a direct Sleeper League ID (typically 15-20 digits)
    if (/^\d{15,}$/.test(trimmed)) {
      try {
        const res = await fetch(`/api/sleeper/league/${trimmed}`);
        if (res.ok) {
          const directLeague: SleeperLeague = await res.json();
          if (directLeague && directLeague.league_id) {
            setSelectedLeague(directLeague);
            setLeagues([directLeague]);
            setIsDualWeek(false);
            if (directLeague.season) {
              setSeason(directLeague.season);
            }
            await fetchLeagueMatchupData(directLeague, selectedWeek);
            setIsSearchingUser(false);
            return;
          }
        }
      } catch (err: any) {
        console.warn('Failed to load league ID directly:', err);
      }
    }

    try {
      // Step 1: Use Sleeper API to find User ID
      const userData = await fetchSleeperUser(trimmed);
      setUser(userData);

      // Step 2: Use User ID to fetch leagues for the active season
      let userLeagues = await fetchUserLeagues(userData.user_id, season);
      let foundSeason = season;

      // If no leagues found in active season, search recent seasons (2026, 2025, 2024)
      if (userLeagues.length === 0) {
        for (const altSeason of ['2026', '2025', '2024']) {
          if (altSeason === season) continue;
          const altLeagues = await fetchUserLeagues(userData.user_id, altSeason);
          if (altLeagues.length > 0) {
            userLeagues = altLeagues;
            foundSeason = altSeason;
            setSeason(altSeason);
            break;
          }
        }
      }

      setLeagues(userLeagues);

      if (userLeagues.length === 0) {
        setUserError(`No leagues found for ${trimmed} in the ${season} NFL season. Try switching the season above or paste your Sleeper League ID.`);
      } else if (userLeagues.length === 1) {
        handleSelectLeague(userLeagues[0]);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      setUser(null);
      setLeagues([]);
      setUserError(err.message || 'User not found! Check your spelling or Sleeper handle.');
    } finally {
      setIsSearchingUser(false);
    }
  };

  const handleSeasonChange = async (newSeason: string) => {
    setSeason(newSeason);
    if (user && user.user_id) {
      setIsSearchingUser(true);
      try {
        const userLeagues = await fetchUserLeagues(user.user_id, newSeason);
        setLeagues(userLeagues);
        if (userLeagues.length === 0) {
          setUserError(`No leagues found for @${user.username} in the ${newSeason} season.`);
        } else {
          setUserError(null);
          // Auto-select first league if previously selected league doesn't belong to this season
          if (selectedLeague && selectedLeague.season !== newSeason) {
            handleSelectLeague(userLeagues[0]);
          }
        }
      } catch (err: any) {
        console.warn('Error fetching leagues for season:', err);
      } finally {
        setIsSearchingUser(false);
      }
    }
  };

  // Click on a league button
  const handleSelectLeague = (league: SleeperLeague) => {
    setSelectedLeague(league);
    setIsDualWeek(false);
    fetchLeagueMatchupData(league, selectedWeek);
  };

  // User changes the active NFL week
  const handleWeekChange = (newWeek: number) => {
    setSelectedWeek(newWeek);
    setIsDualWeek(false);
    if (activeTab === 'dual') {
      setActiveTab('notes');
    }
    if (selectedLeague) {
      fetchLeagueMatchupData(selectedLeague, newWeek);
    } else if (isDemoActive) {
      if (leagueFormat === 'chopped') {
        handleLoadChoppedDemo(newWeek);
      } else {
        handleLoadDemo(newWeek);
      }
    }
  };

  // Toggle dual week comparison
  const handleToggleDualWeek = async () => {
    setIsDualWeek(true);
    setActiveTab('dual');

    // If a real league is selected, ensure both week 1 and week 2 data are loaded
    if (selectedLeague && !isDemoActive && selectedLeague.league_id !== DEMO_LEAGUE.league_id && selectedLeague.league_id !== DEMO_CHOPPED_LEAGUE.league_id) {
      const needsWeek1 = !week1Stats && !choppedWeek1Stats;
      const needsWeek2 = !week2Stats && !choppedWeek2Stats;

      if (needsWeek1 || needsWeek2) {
        setIsLoadingMatchups(true);
        try {
          const fetchTasks: Promise<void>[] = [];

          if (needsWeek1) {
            fetchTasks.push(
              fetch(`/api/sleeper/league/${selectedLeague.league_id}/details/1`)
                .then(r => r.ok ? r.json() : null)
                .then(d1 => {
                  if (d1 && d1.matchups && d1.matchups.length > 0) {
                    const fmt = detectLeagueFormat(selectedLeague, d1.matchups);
                    if (fmt === 'chopped') {
                      setChoppedWeek1Stats(calculateChoppedStats(d1.rosters, d1.users, d1.matchups, 1, playersMap));
                    } else {
                      setWeek1Stats(calculateWeekStats(d1.rosters, d1.users, d1.matchups, 1, playersMap));
                    }
                  }
                })
            );
          }

          if (needsWeek2) {
            fetchTasks.push(
              fetch(`/api/sleeper/league/${selectedLeague.league_id}/details/2`)
                .then(r => r.ok ? r.json() : null)
                .then(d2 => {
                  if (d2 && d2.matchups && d2.matchups.length > 0) {
                    const fmt = detectLeagueFormat(selectedLeague, d2.matchups);
                    if (fmt === 'chopped') {
                      setChoppedWeek2Stats(calculateChoppedStats(d2.rosters, d2.users, d2.matchups, 2, playersMap, d2.priorMatchups));
                    } else {
                      setWeek2Stats(calculateWeekStats(d2.rosters, d2.users, d2.matchups, 2, playersMap));
                    }
                  }
                })
            );
          }

          if (fetchTasks.length > 0) {
            await Promise.all(fetchTasks);
          }
        } catch (e) {
          console.warn('Error pre-loading dual week stats:', e);
        } finally {
          setIsLoadingMatchups(false);
        }
      }
    }
  };

  // Load Demo Standard H2H League
  const handleLoadDemo = (weekToLoad: number = selectedWeek) => {
    setIsDemoActive(true);
    setUser(DEMO_USER);
    setUsername(DEMO_USER.username);
    setLeagues([DEMO_LEAGUE, DEMO_CHOPPED_LEAGUE]);
    setSelectedLeague(DEMO_LEAGUE);
    setLeagueFormat('head_to_head');
    setUserError(null);
    setMatchupError(null);
    const matchups = weekToLoad === 2 ? DEMO_MATCHUPS_WEEK_2 : DEMO_MATCHUPS_WEEK_1;
    const stats = calculateWeekStats(DEMO_ROSTERS, DEMO_USERS, matchups, weekToLoad, SLEEPER_PLAYERS_MAP);
    setWeekStats(stats);
    setChoppedStats(null);

    // Populate both weeks 1 & 2 for instantaneous dual comparison
    const w1 = calculateWeekStats(DEMO_ROSTERS, DEMO_USERS, DEMO_MATCHUPS_WEEK_1, 1, SLEEPER_PLAYERS_MAP);
    const w2 = calculateWeekStats(DEMO_ROSTERS, DEMO_USERS, DEMO_MATCHUPS_WEEK_2, 2, SLEEPER_PLAYERS_MAP);
    setWeek1Stats(w1);
    setWeek2Stats(w2);
  };

  // Load Demo Chopped / Guillotine League
  const handleLoadChoppedDemo = (weekToLoad: number = selectedWeek) => {
    setIsDemoActive(true);
    setUser(DEMO_USER);
    setUsername(DEMO_USER.username);
    setLeagues([DEMO_LEAGUE, DEMO_CHOPPED_LEAGUE]);
    setSelectedLeague(DEMO_CHOPPED_LEAGUE);
    setLeagueFormat('chopped');
    setUserError(null);
    setMatchupError(null);
    const c1 = calculateChoppedStats(DEMO_ROSTERS, DEMO_USERS, DEMO_CHOPPED_MATCHUPS_WEEK_1, 1, SLEEPER_PLAYERS_MAP);
    const c2 = calculateChoppedStats(DEMO_ROSTERS, DEMO_USERS, DEMO_CHOPPED_MATCHUPS_WEEK_2, 2, SLEEPER_PLAYERS_MAP, { 1: DEMO_CHOPPED_MATCHUPS_WEEK_1 });
    const cStats = weekToLoad === 2 ? c2 : c1;
    setChoppedStats(cStats);
    setWeekStats(null);

    // Populate both weeks 1 & 2 for instantaneous dual comparison
    setChoppedWeek1Stats(c1);
    setChoppedWeek2Stats(c2);
  };

  const isChoppedMode = leagueFormat === 'chopped';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        selectedWeek={selectedWeek}
        onSelectWeek={handleWeekChange}
        isDualWeek={isDualWeek}
        onToggleDualWeek={handleToggleDualWeek}
        isChopped={isChoppedMode}
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
                  onClick={() => handleLoadDemo(selectedWeek)}
                  className={`font-bold underline cursor-pointer ${!isChoppedMode ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}
                >
                  Standard Head-to-Head
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={() => handleLoadChoppedDemo(selectedWeek)}
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
          season={season}
          onSeasonChange={handleSeasonChange}
          onTryDemo={() => handleLoadDemo(selectedWeek)}
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
            selectedWeek={selectedWeek}
            onSelectWeek={handleWeekChange}
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

              {/* Controls: Week Selector + Navigation Tabs */}
              <div className="flex flex-wrap items-center gap-3 self-start sm:self-auto">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider hidden md:inline">
                    Week:
                  </span>
                  <WeekSelector
                    currentWeek={selectedWeek}
                    onSelectWeek={handleWeekChange}
                    isDualWeek={isDualWeek}
                    onToggleDualWeek={handleToggleDualWeek}
                    disabled={isLoadingMatchups}
                    isChopped={isChoppedMode}
                  />
                </div>

                {/* Navigation Tabs - Dynamically adapted for Chopped vs H2H */}
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    id="tab-notes-btn"
                    onClick={() => {
                      setActiveTab('notes');
                      setIsDualWeek(false);
                    }}
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
                    onClick={() => {
                      setActiveTab('breakdown');
                      setIsDualWeek(false);
                    }}
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
                  <button
                    type="button"
                    id="tab-dual-btn"
                    onClick={handleToggleDualWeek}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'dual'
                        ? isChoppedMode
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-indigo-600 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-900'
                    }`}
                    title="Look at both Weeks 1 & 2 side-by-side"
                  >
                    <Columns2 className="w-3.5 h-3.5" />
                    <span>Weeks 1 & 2 Dual View</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Top Spotlight: Chopped Banner vs Standard Awards Banner (hidden in dual mode to prioritize comparison cards) */}
            {activeTab !== 'dual' && (
              isChoppedMode && choppedStats ? (
                <ChoppedBanner stats={choppedStats} leagueName={selectedLeague.name} />
              ) : weekStats ? (
                <AwardsBanner stats={weekStats} leagueName={selectedLeague.name} />
              ) : null
            )}

            {/* Tab 1: Commissioner Notes / Execution Report Generator */}
            {activeTab === 'notes' && (
              <NotesGenerator
                leagueName={selectedLeague.name}
                format={leagueFormat}
                stats={weekStats}
                choppedStats={choppedStats}
                selectedWeek={selectedWeek}
                onSelectWeek={handleWeekChange}
                isDualWeek={isDualWeek}
                onToggleDualWeek={handleToggleDualWeek}
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

            {/* Tab 3: Dual Week 1 & 2 Comparison */}
            {activeTab === 'dual' && (
              <DualWeekComparison
                leagueName={selectedLeague.name}
                format={leagueFormat}
                week1Stats={week1Stats}
                week2Stats={week2Stats}
                choppedWeek1Stats={choppedWeek1Stats}
                choppedWeek2Stats={choppedWeek2Stats}
                onSelectWeek={(w) => {
                  handleWeekChange(w);
                  setActiveTab('breakdown');
                }}
                onOpenGazette={(w) => {
                  handleWeekChange(w);
                  setActiveTab('notes');
                }}
              />
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
