import {
  SleeperLeague,
  SleeperRoster,
  SleeperLeagueUser,
  SleeperMatchupItem,
  TeamInfo,
  HeadToHeadMatchup,
  WeekStats,
  LeagueFormat,
  ChoppedWeekStats,
  CompactPlayer,
  PositionalBenchBlunder,
} from '../types';
import { resolvePlayer, formatPlayerDisplayName } from './playerResolver';
import { generateBlunderPhrasing } from './blunderPhrasing';

/**
 * Extracts the top-ranked players on a team.
 * Prioritizes searchRank (Sleeper's player tier / draft rank), and falls back to
 * highest fantasy points scored this week.
 */
export function getTopRankedPlayers(
  players: CompactPlayer[],
  count = 3
): CompactPlayer[] {
  if (!players || players.length === 0) return [];

  const valid = players.filter((p) => {
    if (!p || !p.name) return false;
    const n = p.name.trim();
    if (!n || n === 'Empty Slot') return false;
    if (n.startsWith('Player #') || /^\d+$/.test(n)) return false;
    return true;
  });

  const sorted = [...valid].sort((a, b) => {
    const rankA = typeof a.searchRank === 'number' && a.searchRank > 0 ? a.searchRank : 99999;
    const rankB = typeof b.searchRank === 'number' && b.searchRank > 0 ? b.searchRank : 99999;

    // If either player has a meaningful Sleeper searchRank (< 5000), sort by rank ascending
    if (rankA < 5000 || rankB < 5000) {
      if (rankA !== rankB) {
        return rankA - rankB;
      }
    }

    // Secondary sort: points scored this week (descending)
    const ptsA = typeof a.points === 'number' ? a.points : 0;
    const ptsB = typeof b.points === 'number' ? b.points : 0;
    if (ptsA !== ptsB) {
      return ptsB - ptsA;
    }

    return rankA - rankB;
  });

  return sorted.slice(0, count);
}

/**
 * Automatically inspects the league and matchup data to detect if it's:
 * - 'chopped' (Guillotine / survival leagues with no head-to-head weekly matchups)
 * - 'best_ball'
 * - 'head_to_head' (standard weekly matchups)
 */
export function detectLeagueFormat(
  league: SleeperLeague,
  matchupItems?: SleeperMatchupItem[]
): LeagueFormat {
  const name = (league.name || '').toLowerCase();

  // 1. Explicit keyword matches in league title
  if (
    name.includes('chop') ||
    name.includes('guillotine') ||
    name.includes('surviv') ||
    name.includes('eliminat') ||
    name.includes('cutthroat')
  ) {
    return 'chopped';
  }

  // 2. Best Ball setting
  if (league.settings?.best_ball === 1) {
    return 'best_ball';
  }

  // 3. Inspect matchup pairs structure:
  // If all matchup_id are 0, null, or there are no head-to-head pairs (every matchup_id has only 1 team),
  // then it has no weekly matchups -> Chopped / Survival / Points-Only format
  if (matchupItems && matchupItems.length > 0) {
    const matchupCounts = new Map<number, number>();
    let zeroOrNullMatchupCount = 0;

    matchupItems.forEach((m) => {
      if (!m.matchup_id || m.matchup_id === 0) {
        zeroOrNullMatchupCount++;
      } else {
        matchupCounts.set(m.matchup_id, (matchupCounts.get(m.matchup_id) || 0) + 1);
      }
    });

    // If all or majority of matchups have no opponent (count === 1) or matchup_id is 0
    if (zeroOrNullMatchupCount >= matchupItems.length / 2) {
      return 'chopped';
    }

    const pairedMatchups = Array.from(matchupCounts.values()).filter((cnt) => cnt >= 2);
    if (pairedMatchups.length === 0 && matchupItems.length > 2) {
      return 'chopped';
    }
  }

  return 'head_to_head';
}

export function calculateWeekStats(
  rosters: SleeperRoster[],
  users: SleeperLeagueUser[],
  matchupItems: SleeperMatchupItem[],
  weekNum: number = 1,
  playerMap?: Record<string, CompactPlayer>
): WeekStats {
  // Map users by user_id
  const userMap = new Map<string, SleeperLeagueUser>();
  users.forEach((u) => userMap.set(u.user_id, u));

  // Map rosters by roster_id
  const rosterMap = new Map<number, SleeperRoster>();
  rosters.forEach((r) => rosterMap.set(r.roster_id, r));

  // Build TeamInfo map for roster_id
  const teamMap = new Map<number, TeamInfo>();

  matchupItems.forEach((m) => {
    const roster = rosterMap.get(m.roster_id);
    const ownerId = roster?.owner_id || '';
    const user = userMap.get(ownerId);

    const teamName =
      user?.metadata?.team_name?.trim() ||
      user?.display_name ||
      `Team ${m.roster_id}`;

    const ownerName = user?.display_name || `Owner ${m.roster_id}`;

    const avatarId = user?.metadata?.avatar || user?.avatar;
    const avatarUrl = avatarId
      ? avatarId.startsWith('http')
        ? avatarId
        : `https://sleepercdn.com/avatars/thumbs/${avatarId}`
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(ownerName)}`;

    // Calculate bench points from players_points not in starters
    const starterSet = new Set(m.starters || []);
    let benchPoints = 0;
    if (m.players_points) {
      Object.entries(m.players_points).forEach(([playerId, pts]) => {
        if (!starterSet.has(playerId) && typeof pts === 'number') {
          benchPoints += pts;
        }
      });
    }

    const rawStarters = m.starters || [];
    const starterDetails = rawStarters.map((id, idx) => {
      const p = resolvePlayer(id, playerMap);
      const pts = m.starters_points ? m.starters_points[idx] : (m.players_points ? m.players_points[id] : 0);
      return {
        ...p,
        points: typeof pts === 'number' ? pts : 0,
      };
    });
    const startersFormatted = starterDetails.map((p) => formatPlayerDisplayName(p));

    const rawAllIds = (roster?.players && roster.players.length > 0) ? roster.players : rawStarters;
    const allPlayerDetails = rawAllIds.map((id) => {
      const p = resolvePlayer(id, playerMap);
      const pts = m.players_points ? m.players_points[id] : 0;
      return {
        ...p,
        points: typeof pts === 'number' ? pts : 0,
      };
    });

    const topRankedPlayers = getTopRankedPlayers(allPlayerDetails, 3);

    const teamInfo: TeamInfo = {
      rosterId: m.roster_id,
      ownerId,
      teamName,
      ownerName,
      avatarUrl,
      wins: roster?.settings?.wins ?? 0,
      losses: roster?.settings?.losses ?? 0,
      points: Number((m.points ?? 0).toFixed(2)),
      starters: startersFormatted,
      starterIds: rawStarters,
      starterDetails,
      startersPoints: m.starters_points || [],
      benchPoints: Number(benchPoints.toFixed(2)),
      playersPoints: m.players_points || {},
      allPlayerIds: rawAllIds,
      allPlayerDetails,
      topRankedPlayers,
    };

    teamMap.set(m.roster_id, teamInfo);
  });

  // Group matchups by matchup_id
  const grouped = new Map<number, SleeperMatchupItem[]>();
  matchupItems.forEach((item) => {
    if (!item.matchup_id) return;
    const list = grouped.get(item.matchup_id) || [];
    list.push(item);
    grouped.set(item.matchup_id, list);
  });

  const headToHeadList: HeadToHeadMatchup[] = [];

  grouped.forEach((items, matchupId) => {
    if (items.length < 2) return; // incomplete or bye

    const teamA = teamMap.get(items[0].roster_id);
    const teamB = teamMap.get(items[1].roster_id);
    if (!teamA || !teamB) return;

    const isTie = Math.abs(teamA.points - teamB.points) < 0.001;
    let winner: TeamInfo;
    let loser: TeamInfo;

    if (teamA.points >= teamB.points) {
      winner = teamA;
      loser = teamB;
    } else {
      winner = teamB;
      loser = teamA;
    }

    const margin = Number(Math.abs(teamA.points - teamB.points).toFixed(2));
    const totalCombinedScore = Number((teamA.points + teamB.points).toFixed(2));

    headToHeadList.push({
      matchupId,
      teamA,
      teamB,
      winner,
      loser,
      margin,
      isTie,
      totalCombinedScore,
    });
  });

  // Sort matchups by matchupId
  headToHeadList.sort((a, b) => a.matchupId - b.matchupId);

  const allTeams = Array.from(teamMap.values());
  const allScores = allTeams.map((t) => t.points).sort((a, b) => a - b);

  // Average and median
  const totalScore = allScores.reduce((sum, s) => sum + s, 0);
  const hasStarted = totalScore > 0;
  const averageScore = allScores.length > 0 ? Number((totalScore / allScores.length).toFixed(2)) : 0;

  // Highest & lowest scorers (only if games have started)
  let highestScorer: TeamInfo | null = null;
  let lowestScorer: TeamInfo | null = null;

  if (hasStarted && allTeams.length > 0) {
    highestScorer = [...allTeams].sort((a, b) => b.points - a.points)[0];
    lowestScorer = [...allTeams].sort((a, b) => a.points - b.points)[0];
  }

  // Biggest Blowout (maximum margin) (only if games have started)
  let biggestBlowout: HeadToHeadMatchup | null = null;
  let closestMatchup: HeadToHeadMatchup | null = null;

  if (hasStarted && headToHeadList.length > 0) {
    const sortedByMargin = [...headToHeadList].sort((a, b) => b.margin - a.margin);
    biggestBlowout = sortedByMargin[0];
    closestMatchup = sortedByMargin[sortedByMargin.length - 1];
  }

  // Highest-scoring loser (the ultimate bad beat!)
  let highestScoringLoser: { team: TeamInfo; matchup: HeadToHeadMatchup } | null = null;
  let lowestScoringWinner: { team: TeamInfo; matchup: HeadToHeadMatchup } | null = null;

  if (hasStarted && headToHeadList.length > 0) {
    const allLosers = headToHeadList.map((m) => ({ team: m.loser, matchup: m }));
    allLosers.sort((a, b) => b.team.points - a.team.points);
    highestScoringLoser = allLosers[0] || null;

    const allWinners = headToHeadList.map((m) => ({ team: m.winner, matchup: m }));
    allWinners.sort((a, b) => a.team.points - b.team.points);
    lowestScoringWinner = allWinners[0] || null;
  }

  let medianScore = 0;
  if (allScores.length > 0) {
    const mid = Math.floor(allScores.length / 2);
    medianScore =
      allScores.length % 2 !== 0
        ? allScores[mid]
        : Number(((allScores[mid - 1] + allScores[mid]) / 2).toFixed(2));
  }

  // Bench blunders (top teams with most points on bench)
  const benchBlunders = allTeams
    .map((t) => ({ team: t, benchPoints: t.benchPoints }))
    .sort((a, b) => b.benchPoints - a.benchPoints)
    .slice(0, 3);

  // Positional Bench Blunders ("If only [Manager] had started [BenchPlayer] instead of [Starter]..."):
  const positionalBlunders: PositionalBenchBlunder[] = [];
  const trackedPositions = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

  if (hasStarted) {
    interface RawBlunderCandidate {
      team: TeamInfo;
      pos: string;
      bestBench: CompactPlayer;
      lowestStarter: CompactPlayer;
      diff: number;
      margin: number;
      opponentName: string;
      wouldHaveWon: boolean;
      didLose: boolean;
    }

    const rawCandidates: RawBlunderCandidate[] = [];

    allTeams.forEach((team) => {
      const starterIdSet = new Set(team.starterIds || []);
      const benchPlayers = (team.allPlayerDetails || []).filter(
        (p) => !starterIdSet.has(p.id) && typeof p.points === 'number'
      );

      const matchup = headToHeadList.find(
        (m) => m.teamA.rosterId === team.rosterId || m.teamB.rosterId === team.rosterId
      );
      const didLose = matchup ? matchup.loser.rosterId === team.rosterId : false;
      const margin = matchup ? matchup.margin : 0;
      const opponent = matchup
        ? matchup.teamA.rosterId === team.rosterId
          ? matchup.teamB
          : matchup.teamA
        : undefined;
      const opponentName = opponent?.ownerName || 'their opponent';

      trackedPositions.forEach((pos) => {
        const startersAtPos = (team.starterDetails || []).filter(
          (s) => s.pos?.toUpperCase().trim() === pos && typeof s.points === 'number'
        );
        if (startersAtPos.length === 0) return;

        const lowestStarter = startersAtPos.reduce(
          (min, s) => (s.points < min.points ? s : min),
          startersAtPos[0]
        );

        const benchAtPos = benchPlayers.filter(
          (b) => b.pos?.toUpperCase().trim() === pos && typeof b.points === 'number'
        );
        if (benchAtPos.length === 0) return;

        const bestBench = benchAtPos.reduce(
          (max, b) => (b.points > max.points ? b : max),
          benchAtPos[0]
        );

        // Check if bench player outscored the lowest starter at the same position
        if (bestBench.points > lowestStarter.points) {
          const diff = Number((bestBench.points - lowestStarter.points).toFixed(2));
          if (diff >= 0.5) {
            const wouldHaveWon = didLose && diff > margin;
            rawCandidates.push({
              team,
              pos,
              bestBench,
              lowestStarter,
              diff,
              margin,
              opponentName,
              wouldHaveWon,
              didLose,
            });
          }
        }
      });
    });

    // Sort blunders: match flippers first, then biggest point difference
    rawCandidates.sort((a, b) => {
      if (a.wouldHaveWon && !b.wouldHaveWon) return -1;
      if (!a.wouldHaveWon && b.wouldHaveWon) return 1;
      return b.diff - a.diff;
    });

    // Only mention each team once (keep the most impactful blunder per team)
    const seenTeams = new Set<string>();
    const uniqueCandidates: typeof rawCandidates = [];
    for (const cand of rawCandidates) {
      const teamKey = cand.team.rosterId
        ? String(cand.team.rosterId)
        : (cand.team.teamName || cand.team.ownerName).toLowerCase().trim();
      if (!seenTeams.has(teamKey)) {
        seenTeams.add(teamKey);
        uniqueCandidates.push(cand);
      }
    }

    // Generate varied blurbs with rotating templates so no two blunders sound identical
    uniqueCandidates.forEach((cand, idx) => {
      const generated = generateBlunderPhrasing({
        manager: cand.team.ownerName,
        teamName: cand.team.teamName,
        position: cand.pos,
        benchPlayerName: cand.bestBench.name,
        benchPlayerPoints: cand.bestBench.points,
        starterPlayerName: cand.lowestStarter.name,
        starterPlayerPoints: cand.lowestStarter.points,
        pointsDifference: cand.diff,
        matchupMargin: cand.margin,
        opponentName: cand.opponentName,
        wouldHaveWon: cand.wouldHaveWon,
        didLose: cand.didLose,
        index: idx,
      });

      positionalBlunders.push({
        manager: cand.team.ownerName,
        teamName: cand.team.teamName,
        avatarUrl: cand.team.avatarUrl,
        position: cand.pos,
        benchPlayerName: cand.bestBench.name,
        benchPlayerPoints: cand.bestBench.points,
        starterPlayerName: cand.lowestStarter.name,
        starterPlayerPoints: cand.lowestStarter.points,
        pointsDifference: cand.diff,
        matchupMargin: cand.margin,
        opponentName: cand.opponentName,
        wouldHaveWonMatchup: cand.wouldHaveWon,
        blurb: generated.primaryBlurb,
        headline: generated.headline,
        flavorTag: generated.flavorTag,
        alternativeBlurbs: generated.alternativeBlurbs,
      });
    });
  }

  const topPositionalBlunder = positionalBlunders[0] || null;

  return {
    week: weekNum,
    totalMatchups: headToHeadList.length,
    totalTeams: allTeams.length,
    hasStarted,
    totalScore,
    highestScorer,
    lowestScorer,
    biggestBlowout,
    highestScoringLoser,
    lowestScoringWinner,
    closestMatchup,
    averageScore,
    medianScore,
    matchups: headToHeadList,
    benchBlunders,
    positionalBlunders,
    topPositionalBlunder,
  };
}

export function generateTemplateNotes(
  leagueName: string,
  stats: WeekStats,
  announcements?: string,
  duesNote?: string
): string {
  const { week, biggestBlowout, highestScoringLoser, highestScorer, lowestScorer, closestMatchup, averageScore, matchups } = stats;

  let out = `# 🏈 ${leagueName} - Week ${week} Commissioner Notes\n\n`;
  out += `Welcome to the official recap of Week ${week}! The fantasy gods have spoken, leaving triumphs in their wake and broken dreams on the waiver wire.\n\n`;

  if (announcements?.trim()) {
    out += `### 📢 League Announcements\n${announcements.trim()}\n\n`;
  }

  if (duesNote?.trim()) {
    out += `### 💰 Treasury & Dues Notice\n${duesNote.trim()}\n\n`;
  }

  out += `## 🏆 Week ${week} Weekly Honors & Disasters\n\n`;

  if (highestScorer) {
    out += `- **👑 High Roller of the Week:** **${highestScorer.teamName}** (${highestScorer.ownerName}) dropped a league-leading **${highestScorer.points} pts**!\n`;
  }

  if (biggestBlowout) {
    out += `- **💥 The Woodchipper (Biggest Blowout):** **${biggestBlowout.winner.teamName}** crushed **${biggestBlowout.loser.teamName}** by **${biggestBlowout.margin} pts** (${biggestBlowout.winner.points} to ${biggestBlowout.loser.points})! Total dismantling.\n`;
  }

  if (highestScoringLoser) {
    out += `- **💔 Tough Luck Award (Highest-Scoring Loser):** **${highestScoringLoser.team.teamName}** scored a massive **${highestScoringLoser.team.points} pts** but had the misfortune of facing **${highestScoringLoser.matchup.winner.teamName}** (${highestScoringLoser.matchup.winner.points} pts). Someone get this owner a support animal.\n`;
  }

  if (closestMatchup && !closestMatchup.isTie) {
    out += `- **⚡ Cardiac Finish (Closest Matchup):** **${closestMatchup.winner.teamName}** squeaked past **${closestMatchup.loser.teamName}** by a razor-thin **${closestMatchup.margin} pts** (${closestMatchup.winner.points} - ${closestMatchup.loser.points}).\n`;
  }

  if (lowestScorer) {
    out += `- **🥶 Ice Cold Toilet Trophy:** **${lowestScorer.teamName}** managed just **${lowestScorer.points} pts**. Check your lineup reminders!\n`;
  }

  out += `\n**📊 League Scoring Average:** ${averageScore} pts per team\n\n`;

  out += `## ⚔️ Matchup Recaps\n\n`;
  matchups.forEach((m, idx) => {
    out += `### Matchup ${idx + 1}: ${m.winner.teamName} (${m.winner.points}) def. ${m.loser.teamName} (${m.loser.points})\n`;
    if (m === biggestBlowout) {
      out += `> *Recap:* The undisputed blowout of the week. ${m.winner.teamName} flexed their roster muscle, winning by ${m.margin} points while ${m.loser.teamName} struggled for answers.\n\n`;
    } else if (highestScoringLoser && m.loser.rosterId === highestScoringLoser.team.rosterId) {
      out += `> *Recap:* Matchup of the week! Both squads put up monster numbers, but ${m.winner.teamName} found that extra gear. Heartbreaking defeat for ${m.loser.teamName}.\n\n`;
    } else if (m === closestMatchup) {
      out += `> *Recap:* Down to the final minutes of Monday night! A nail-biter separated by merely ${m.margin} points.\n\n`;
    } else {
      out += `> *Recap:* ${m.winner.teamName} claims the victory with ${m.winner.points} against ${m.loser.teamName}'s ${m.loser.points} (Margin: +${m.margin}).\n\n`;
    }
  });

  if (stats.positionalBlunders && stats.positionalBlunders.length > 0) {
    out += `## 🤦‍♂️ Start/Sit Regrets ("If Only...")\n\n`;
    stats.positionalBlunders.slice(0, 3).forEach((b) => {
      const tagStr = b.flavorTag ? ` [${b.flavorTag}]` : '';
      const headlineStr = b.headline ? ` *${b.headline}* — ` : ' ';
      out += `- **${b.manager} (${b.teamName})**${tagStr}:${headlineStr}${b.blurb}\n`;
    });
    out += `\n`;
  }

  out += `\n---\n*Generated by Fantasy Commissioner Notes with Sleeper API & AI*`;
  return out;
}

/**
 * Calculates standings, chopped / eliminated team, narrow escapes, and danger zone
 * for Guillotine / Chopped / Survivor fantasy football leagues without weekly matchups.
 */
export function calculateChoppedStats(
  rosters: SleeperRoster[],
  users: SleeperLeagueUser[],
  matchupItems: SleeperMatchupItem[],
  weekNum: number = 1,
  playerMap?: Record<string, CompactPlayer>
): ChoppedWeekStats {
  const userMap = new Map<string, SleeperLeagueUser>();
  users.forEach((u) => userMap.set(u.user_id, u));

  const rosterMap = new Map<number, SleeperRoster>();
  rosters.forEach((r) => rosterMap.set(r.roster_id, r));

  const teams: TeamInfo[] = matchupItems.map((m) => {
    const roster = rosterMap.get(m.roster_id);
    const ownerId = roster?.owner_id || '';
    const user = userMap.get(ownerId);

    const teamName =
      user?.metadata?.team_name?.trim() ||
      user?.display_name ||
      `Team ${m.roster_id}`;

    const ownerName = user?.display_name || `Owner ${m.roster_id}`;

    const avatarId = user?.metadata?.avatar || user?.avatar;
    const avatarUrl = avatarId
      ? avatarId.startsWith('http')
        ? avatarId
        : `https://sleepercdn.com/avatars/thumbs/${avatarId}`
      : `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(ownerName)}`;

    const rawStarters = m.starters || [];
    const starterDetails = rawStarters.map((id, idx) => {
      const p = resolvePlayer(id, playerMap);
      const pts = m.starters_points ? m.starters_points[idx] : (m.players_points ? m.players_points[id] : 0);
      return {
        ...p,
        points: typeof pts === 'number' ? pts : 0,
      };
    });
    const startersFormatted = starterDetails.map((p) => formatPlayerDisplayName(p));

    const rawAllIds = (roster?.players && roster.players.length > 0) ? roster.players : rawStarters;
    const allPlayerDetails = rawAllIds.map((id) => {
      const p = resolvePlayer(id, playerMap);
      const pts = m.players_points ? m.players_points[id] : 0;
      return {
        ...p,
        points: typeof pts === 'number' ? pts : 0,
      };
    });

    const topRankedPlayers = getTopRankedPlayers(allPlayerDetails, 3);

    return {
      rosterId: m.roster_id,
      ownerId,
      teamName,
      ownerName,
      avatarUrl,
      wins: roster?.settings?.wins ?? 0,
      losses: roster?.settings?.losses ?? 0,
      points: Number((m.points ?? 0).toFixed(2)),
      starters: startersFormatted,
      starterIds: rawStarters,
      starterDetails,
      startersPoints: m.starters_points || [],
      benchPoints: 0,
      playersPoints: m.players_points || {},
      allPlayerIds: rawAllIds,
      allPlayerDetails,
      topRankedPlayers,
    };
  });

  // Sort descending by points
  teams.sort((a, b) => b.points - a.points);

  const apexSurvivor = teams.length > 0 ? teams[0] : null;
  const choppedTeam = teams.length > 0 ? teams[teams.length - 1] : null;

  // Narrow Escape: 2nd lowest score (last surviving team above the chop line)
  let narrowEscape: { team: TeamInfo; marginOverChopped: number } | null = null;
  if (teams.length >= 2 && choppedTeam) {
    const survivingBubbleTeam = teams[teams.length - 2];
    const margin = Number((survivingBubbleTeam.points - choppedTeam.points).toFixed(2));
    narrowEscape = {
      team: survivingBubbleTeam,
      marginOverChopped: margin,
    };
  }

  // Danger zone: bottom 3 survivors above the cut
  const dangerZone = teams.slice(Math.max(0, teams.length - 4), Math.max(0, teams.length - 1));
  const safeSurvivors = teams.slice(0, Math.max(0, teams.length - 4));

  const totalPoints = teams.reduce((acc, t) => acc + t.points, 0);
  const averageScore = teams.length > 0 ? Number((totalPoints / teams.length).toFixed(2)) : 0;
  const mid = Math.floor(teams.length / 2);
  const medianScore =
    teams.length > 0
      ? teams.length % 2 !== 0
        ? teams[mid].points
        : Number(((teams[mid - 1].points + teams[mid].points) / 2).toFixed(2))
      : 0;

  const choppedRosterStarters = choppedTeam ? choppedTeam.starters : [];
  const choppedRosterDetails = choppedTeam ? choppedTeam.starterDetails : [];
  const topRankedChoppedPlayers = choppedTeam
    ? (choppedTeam.topRankedPlayers && choppedTeam.topRankedPlayers.length > 0
        ? choppedTeam.topRankedPlayers
        : getTopRankedPlayers(choppedRosterDetails || [], 3))
    : [];

  return {
    week: weekNum,
    totalTeams: teams.length,
    choppedTeam,
    apexSurvivor,
    narrowEscape,
    dangerZone,
    safeSurvivors,
    allRankedTeams: teams,
    averageScore,
    medianScore,
    choppedRosterStarters,
    choppedRosterDetails,
    topRankedChoppedPlayers,
  };
}

/**
 * Generates custom commissioner recap notes for Guillotine / Chopped leagues
 */
export function generateChoppedTemplateNotes(
  leagueName: string,
  stats: ChoppedWeekStats,
  announcements?: string,
  duesNote?: string
): string {
  const { week, choppedTeam, apexSurvivor, narrowEscape, allRankedTeams, averageScore } = stats;

  let out = `# 🪓 ${leagueName} - Week ${week} Execution Report\n\n`;
  out += `*The guillotine blade has dropped.* In a league with no weekly matchups, survival is the only law. Twelve entered Week ${week}, but one manager has met their end.\n\n`;

  if (announcements?.trim()) {
    out += `### 📢 Commissioner Bulletins & Waiver Deadlines\n${announcements.trim()}\n\n`;
  }

  if (duesNote?.trim()) {
    out += `### 💰 League Bounty & Treasury\n${duesNote.trim()}\n\n`;
  }

  out += `## 🪓 THE EXECUTION (CHOPPED TEAM)\n\n`;
  if (choppedTeam) {
    const topStars =
      stats.topRankedChoppedPlayers && stats.topRankedChoppedPlayers.length > 0
        ? stats.topRankedChoppedPlayers.map((p) => p.name).join(', ')
        : choppedTeam.topRankedPlayers && choppedTeam.topRankedPlayers.length > 0
        ? choppedTeam.topRankedPlayers.map((p) => p.name).join(', ')
        : 'their top roster starters';

    out += `Rest in peace to **${choppedTeam.teamName}** (${choppedTeam.ownerName}), who posted a league-low **${choppedTeam.points} pts** and has been officially **CHOPPED & ELIMINATED**.\n\n`;
    out += `> *"May your players find better managers on the waiver wire."*\n\n`;
    out += `💰 **THE WAIVER GOLDRUSH:** All players on ${choppedTeam.teamName}'s roster will enter the waiver wire pool! Top-ranked stars hitting waivers include: **${topStars}**! Prepare your FAAB budgets for the impending feeding frenzy.\n\n`;
  }

  out += `## 🏆 SURVIVOR SPOTLIGHTS\n\n`;
  if (apexSurvivor) {
    out += `- **👑 Apex Survivor (Immunity):** **${apexSurvivor.teamName}** crushed the competition with **${apexSurvivor.points} pts**, claiming the undisputed throne for Week ${week}.\n`;
  }

  if (narrowEscape) {
    out += `- **🩸 The Narrow Escape (Close Shave):** **${narrowEscape.team.teamName}** (${narrowEscape.team.points} pts) dodged the blade by a razor-thin **+${narrowEscape.marginOverChopped} pts**! One dropped pass from death.\n`;
  }

  out += `\n**📊 League Median Score:** ${stats.medianScore} pts | **Average:** ${averageScore} pts\n\n`;

  out += `## 🪜 WEEK ${week} SURVIVOR LADDER\n\n`;
  allRankedTeams.forEach((team, index) => {
    const rank = index + 1;
    const isApex = rank === 1;
    const isChopped = team.rosterId === choppedTeam?.rosterId;
    const isNarrow = team.rosterId === narrowEscape?.team.rosterId;

    if (isChopped) {
      out += `${rank}. 💀 **${team.teamName}** (${team.ownerName}) - **${team.points} pts** *(🪓 CHOPPED & ELIMINATED)*\n`;
    } else if (isApex) {
      out += `${rank}. 👑 **${team.teamName}** (${team.ownerName}) - **${team.points} pts** *(Apex Predator)*\n`;
    } else if (isNarrow) {
      out += `${rank}. ⚠️ **${team.teamName}** (${team.ownerName}) - **${team.points} pts** *(Survived by +${narrowEscape?.marginOverChopped} pts!)*\n`;
    } else {
      out += `${rank}. 🛡️ **${team.teamName}** (${team.ownerName}) - **${team.points} pts** *(Survived)*\n`;
    }
  });

  out += `\n---\n*The Guillotine Chopped Recaps • Generated by Sleeper Commish Notes*`;
  return out;
}
