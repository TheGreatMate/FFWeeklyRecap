import {
  WeekStats,
  ChoppedWeekStats,
  LeagueFormat,
  SidePotConfig,
  GazetteReportData,
  NoteTone,
} from '../types';
import { getTopRankedPlayers } from './calc';

export const DEFAULT_SIDE_POT_CONFIG: SidePotConfig = {
  enabled: false, // OPT-IN BY DEFAULT
  entryFee: 5,
  totalEntries: 5,
  totalPot: 25,
  pointsWinnerPayout: 12.5,
  blowoutWinnerPayout: 12.5,
  nextWeekNotice: 'Due before TNF kickoff',
};

/**
 * Builds all data and commentary for the 3-page Weekly Gazette Newspaper Report
 * dynamically adapting to the selected Commissioner Tone.
 */
export function buildGazetteReportData(
  leagueName: string,
  weekStats?: WeekStats | null,
  choppedStats?: ChoppedWeekStats | null,
  format: LeagueFormat = 'head_to_head',
  sidePotConfig: SidePotConfig = DEFAULT_SIDE_POT_CONFIG,
  customMotto: string = 'SAME LEAGUE. DIFFERENT LEVELS.',
  customEditionTag?: string,
  tone: NoteTone = 'roast'
): GazetteReportData {
  const isChopped = format === 'chopped' || !!choppedStats;
  const week = weekStats?.week || choppedStats?.week || 1;
  const dateStr = new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const editionTag =
    customEditionTag || (isChopped ? 'SURVIVAL ELIMINATION' : 'INAUGURAL DYNASTY SEASON');

  // Handle Chopped Format
  if (isChopped && choppedStats) {
    const c = choppedStats;
    const apex = c.apexSurvivor;
    const chopped = c.choppedTeam;
    const narrow = c.narrowEscape;

    // Extract top ranked players on the chopped team (by search rank and points)
    const topPlayers =
      c.topRankedChoppedPlayers && c.topRankedChoppedPlayers.length > 0
        ? c.topRankedChoppedPlayers
        : chopped?.topRankedPlayers && chopped.topRankedPlayers.length > 0
        ? chopped.topRankedPlayers
        : getTopRankedPlayers(c.choppedRosterDetails || [], 3);

    const cleanStarters = topPlayers
      .map((p) => p.name.replace(/\s*\([^)]*\)/, '').trim())
      .filter((s) => s && !s.startsWith('Player #') && !/^\d+$/.test(s) && s !== 'Empty Slot');

    const starsPhrase =
      cleanStarters.length > 0 ? cleanStarters.slice(0, 3).join(', ') : 'their top starters';

    let leadHeadline = apex
      ? `${apex.ownerName.toUpperCase()} SURVIVES AT THE APEX AS THE BLADE FALLS`
      : 'THE GUILLOTINE CLAIMS ITS FIRST SACRIFICE';

    let leadStory = chopped
      ? `${chopped.points} points. Week ${week} has claimed its victim. ${chopped.ownerName} (${chopped.teamName}) fell short of the cut line and has been officially chopped from the league. Their entire roster—including stars ${starsPhrase}—is immediately surrendered to the waiver wire.`
      : `The executioner had no mercy in Week ${week}. Survival is the only metric that matters.`;

    if (tone === 'hunger_games') {
      leadHeadline = `CANNON FIRE IN WEEK ${week}: ${chopped?.ownerName.toUpperCase() || 'TRIBUTE'} FALLS IN THE ARENA!`;
      leadStory = `Tributes of ${leagueName}, welcome to the Capitol broadcast! A solitary cannon blast thundered across the arena in Week ${week}. With only ${chopped?.points} points, ${chopped?.ownerName} (${chopped?.teamName}) has fallen beneath the cut line and is eliminated forever. The Capitol hovercraft has retrieved their remains, and their supplies (${starsPhrase}) are dumped into the Cornucopia waiver wire! May the fantasy odds be ever in your favor!`;
    } else if (tone === 'grim_reaper') {
      leadHeadline = `THE EXECUTIONER STRIKES: ${chopped?.ownerName.toUpperCase() || 'VICTIM'} BEHEADED IN WEEK ${week}`;
      leadStory = `A solemn shadow blankets ${leagueName}. In Week ${week}, the guillotine fell without pity. ${chopped?.ownerName} (${chopped?.teamName}) managed only ${chopped?.points} points—a fatal death sentence. As the body is carted to the morgue, eleven vultures circle: star players ${starsPhrase} are now surrendered to the waiver wire for the living to scavenge.`;
    } else if (tone === 'roast') {
      leadHeadline = `${chopped?.ownerName.toUpperCase()} CHOKES UNDER PRESSURE AND GETS SLICED BY THE GUILLOTINE`;
      leadStory = `Pack your bags, delete your league app, and hand over your phone. ${chopped?.points} points? That's not a fantasy score, that's an embarrassing cry for help. ${chopped?.ownerName} (${chopped?.teamName}) put up the league's worst performance and got tossed into the paper shredder. Meanwhile, the rest of us are gleefully scavenging ${starsPhrase} off your corpse.`;
    } else if (tone === 'hype') {
      leadHeadline = `⚡ BLOOD ON THE SAND! ${chopped?.ownerName.toUpperCase()} ELIMINATED AS ${apex?.ownerName.toUpperCase() || 'APEX'} REIGNS!`;
      leadStory = `ABSOLUTE MAYHEM ON THE CHOPPING BLOCK! In a high-stakes survival showdown, ${chopped?.ownerName} couldn't withstand the pressure, finishing with ${chopped?.points} points! The arena erupts as ${apex?.ownerName} dominates with ${apex?.points} points! Every single star player (${starsPhrase}) hits the waiver wire in an all-out FAAB WAR!`;
    } else if (tone === 'conspiracy') {
      leadHeadline = `🚨 WAS THE CHOP RIGGED? SUSPICIOUS ANOMALIES SEAL ${chopped?.ownerName.toUpperCase()}'S FATE`;
      leadStory = `Statistical audit alert. In Week ${week}, ${chopped?.ownerName}'s squad mysteriously underperformed their median projections by 42%. Was this poor management, or did the Sleeper RNG gods intervene to purge ${chopped?.teamName}? Either way, ${starsPhrase} are now on waivers, and our forensic investigation into the algorithm continues.`;
    }

    const gmOfTheWeek = {
      manager: apex?.ownerName || 'Apex Survivor',
      teamName: apex?.teamName || 'Top Team',
      points: apex?.points || 0,
      record: 'Immune',
      rationale: `Posted a league-high ${apex?.points || 0} points to escape the chopping block without breaking a sweat. Untouchable at the top.`,
      avatarUrl: apex?.avatarUrl,
    };

    const blowoutMargin =
      apex && chopped ? Number((apex.points - chopped.points).toFixed(2)) : 50;
    const blowoutOfTheWeek = {
      winner: apex?.ownerName || 'Apex Leader',
      loser: chopped?.ownerName || 'Chopped Team',
      margin: blowoutMargin,
      winnerPts: apex?.points || 0,
      loserPts: chopped?.points || 0,
      recap: `${apex?.ownerName}'s ${apex?.points} vs ${chopped?.ownerName}'s ${chopped?.points}. A ${blowoutMargin}-point difference that separated supreme safety from instant execution.`,
      reactionCaption: `${chopped?.ownerName || 'Victim'}'s Week ${week} mood.`,
      winnerAvatarUrl: apex?.avatarUrl,
      loserAvatarUrl: chopped?.avatarUrl,
      winnerTeamName: apex?.teamName,
      loserTeamName: chopped?.teamName,
    };

    const galaxyBrainMove = {
      manager: narrow ? narrow.team.ownerName : 'Survivor',
      moveTitle: 'Surviving by the Skin of Their Teeth',
      rationale: narrow
        ? `Squeaked out a +${narrow.marginOverChopped} pt cushion over ${chopped?.ownerName}. Risky start, but the fantasy gods spared them another week.`
        : 'Lineup survived the chop.',
      caption: narrow ? `Dodged the axe by +${narrow.marginOverChopped} pts.` : 'Survival mode.',
      avatarUrl: narrow?.team.avatarUrl,
      teamName: narrow?.team.teamName,
    };

    const boneheadMove = {
      manager: chopped?.ownerName || 'Eliminated Manager',
      moveTitle: 'Leaving Points on the Board',
      rationale: `${chopped?.ownerName}'s ${chopped?.points} points leaves them permanently eliminated. No further questions at this time.`,
      benchPoints: chopped?.benchPoints || 0,
      avatarUrl: chopped?.avatarUrl,
      teamName: chopped?.teamName,
    };

    const pointsLeaderboard = (c.allRankedTeams || []).map((t, idx) => ({
      rank: t.isEliminated ? '—' : idx + 1,
      manager: t.ownerName,
      teamName: t.teamName,
      points: t.points,
      record: t.rosterId === chopped?.rosterId
        ? `CHOPPED (W${week})`
        : t.isEliminated
        ? `OUT (W${t.eliminatedWeek || 1})`
        : 'SAFE',
      avatarUrl: t.avatarUrl,
    }));

    const matchupLedger = (c.allRankedTeams || []).map((t, idx) => {
      const isVictim = t.rosterId === chopped?.rosterId;
      const isPriorElim = Boolean(t.isEliminated);
      const marginOverChop = chopped
        ? Number((t.points - chopped.points).toFixed(2))
        : 0;
      return {
        winner: t.ownerName,
        winnerPts: t.points,
        loser: isVictim
          ? 'The Guillotine'
          : isPriorElim
          ? `Out in W${t.eliminatedWeek || 1}`
          : `${marginOverChop} pts clear`,
        loserPts: isPriorElim ? 0 : (chopped?.points || 0),
        recap: isVictim
          ? `🪓 CHOPPED IN WEEK ${week}. Lowest active score (${t.points} pts). Roster sent to waivers.`
          : isPriorElim
          ? `💀 ELIMINATED (Week ${t.eliminatedWeek || 1}). Roster was already wiped in a prior week.`
          : idx === 0
          ? `Apex Predator. Untouchable performance atop the ladder.`
          : idx === (c.activeTeams?.length || (c.allRankedTeams?.length || 0)) - 2
          ? `Narrow Escape! Dodged the blade by just ${marginOverChop} pts.`
          : `Clean survival. Safely through to Week ${week + 1}.`,
        winnerAvatarUrl: t.avatarUrl,
        loserAvatarUrl: chopped?.avatarUrl,
      };
    });

    const powerRankings = (c.allRankedTeams || []).map((t, idx) => {
      const isVictim = t.rosterId === chopped?.rosterId;
      const isPriorElim = Boolean(t.isEliminated);
      const activeCount = c.activeTeams?.length || (c.allRankedTeams?.length || 0);
      const rank = idx + 1;
      let note = 'Solid survival.';
      if (isVictim) {
        note = `${t.points} pts. The axe falls in Week ${week}. Roster liquidated to waivers.`;
      } else if (isPriorElim) {
        note = `Eliminated in Week ${t.eliminatedWeek || 1}. Out of contention.`;
      } else if (rank === 1) {
        note = `${t.points} pts. The league benchmark. Untouchable roster depth.`;
      } else if (rank <= 3) {
        note = `${t.points} pts. Elite safety margin. Primed for a deep run.`;
      } else if (rank === activeCount - 1) {
        note = `${t.points} pts. Staring into the abyss. Needs immediate FAAB reinforcement.`;
      } else {
        note = `${t.points} pts. Quiet survival, but the margins get thinner every week.`;
      }
      return {
        rank: isPriorElim ? '—' : rank,
        manager: t.ownerName,
        teamName: t.teamName,
        record: isVictim ? `Chopped (W${week})` : isPriorElim ? `Eliminated (W${t.eliminatedWeek || 1})` : 'Survivor',
        points: t.points,
        rationale: note,
        avatarUrl: t.avatarUrl,
      };
    });

    const leadPhoto = {
      headline: 'APEX PREDATOR & CHOPPED VICTIM',
      caption: `${apex?.ownerName || 'Apex'} sits safely atop the ladder with ${apex?.points || 0} pts, while ${chopped?.ownerName || 'Victim'} exits with ${chopped?.points || 0} pts.`,
      primaryAvatarUrl: apex?.avatarUrl,
      primaryName: apex?.ownerName,
      opponentAvatarUrl: chopped?.avatarUrl,
      opponentName: chopped?.ownerName,
      badgeText: 'THE CHOPPED CUT',
    };

    return {
      leagueName,
      week,
      date: dateStr,
      editionTag,
      motto: customMotto,
      leadHeadline,
      leadStory,
      leadPhoto,
      gmOfTheWeek,
      blowoutOfTheWeek,
      galaxyBrainMove,
      boneheadMove,
      mondayNightFallout:
        'The late games solidified the cut line. No Monday miracles could save the bottom score from the executioner.',
      unluckyBastard: null,
      matchupLedger,
      pointsLeaderboard,
      sidePotDesk: {
        enabled: sidePotConfig.enabled,
        totalPot: sidePotConfig.totalPot,
        entriesCount: sidePotConfig.totalEntries,
        entryFee: sidePotConfig.entryFee,
        pointsWinnerName: apex?.ownerName || 'Apex Leader',
        pointsWinnerAvatarUrl: apex?.avatarUrl,
        pointsPayout: sidePotConfig.pointsWinnerPayout,
        blowoutWinnerName: apex?.ownerName || 'Apex Leader',
        blowoutWinnerAvatarUrl: apex?.avatarUrl,
        blowoutPayout: sidePotConfig.blowoutWinnerPayout,
        nextWeekFee: sidePotConfig.entryFee,
      },
      powerRankings,
      commissionerNotebook: {
        fraudWatch:
          tone === 'hunger_games'
            ? `${chopped?.ownerName || 'The Tribute'}. Pre-game favorites who perished in the very first minutes of the bloodbath.`
            : tone === 'grim_reaper'
            ? `${chopped?.ownerName || 'The Deceased'}. Drafted like a titan, buried in the cellar. No mourners, no funerals.`
            : tone === 'roast'
            ? `${chopped?.ownerName || 'The Choker'}. All that pre-season trash talk just to get beheaded in Week ${week}. Embarrassing.`
            : `${chopped?.ownerName || 'The Eliminated'}. Expected to contend, but crashed out in the very first test.`,
        stockUp:
          tone === 'hunger_games'
            ? `${apex?.ownerName || 'Apex Predator'}. The Capitol sponsors are raining down parachute care packages.`
            : tone === 'grim_reaper'
            ? `${apex?.ownerName || 'The Immortal'}. Sitting untouchable on high while others rot beneath the soil.`
            : `${apex?.ownerName || 'Leader'} and the top tier. Put up dominant numbers.`,
        stockDown:
          tone === 'hunger_games'
            ? `${narrow?.team.ownerName || 'The Bubble'}. Barely outran the tracker jackers. One scratch away from elimination.`
            : tone === 'grim_reaper'
            ? `${narrow?.team.ownerName || 'The Near-Dead'}. We had the toe-tag already written out before a garbage-time miracle.`
            : `${narrow?.team.ownerName || 'The Bubble'}. Survived on borrowed time.`,
        galaxyBrain: `Saving FAAB budget while still squeaking through to the next round.`,
        bonehead: `${chopped?.ownerName || 'Eliminated'}'s lineup choices. Cost them the entire season.`,
        leagueCanon:
          tone === 'hunger_games'
            ? `The cannon fired. The Capitol will never forget the sacrifice of ${chopped?.ownerName}.`
            : `The blade has tasted blood. ${chopped?.ownerName}'s stars are the prize of the waiver wire.`,
        aroundTheLeague: `Survival threshold was ${narrow?.team.points || 80} points. Next week the floor rises.`,
        nextWeekWarning: `FAAB bids process Wednesday at 8 PM. Check your waiver claims.`,
        finalWord:
          tone === 'hunger_games'
            ? `One tribute down, eleven remain. Happy Hunger Games, and may the fantasy odds be ever in your favor!`
            : tone === 'grim_reaper'
            ? `The earth has swallowed ${chopped?.teamName}. The living must now feast on what remains. Rest in peace.`
            : `Week ${week} is history. One manager is in the grave, and eleven vultures are ready to feast on their roster.`,
      },
    };
  }

  // Handle Standard Head-to-Head Format
  const ws = weekStats;
  const isUpcomingWeek = Boolean(ws && (ws.hasStarted === false || (ws.totalScore !== undefined && ws.totalScore === 0)));

  // If this week's games have not commenced yet on Sleeper (all teams at 0.00 pts),
  // build an authentic Pre-Game Matchup Preview rather than a fake post-game recap!
  if (isUpcomingWeek && ws) {
    const matchups = ws.matchups || [];
    const m1 = matchups[0];
    const m2 = matchups[1] || m1;
    const allTeams = matchups.flatMap((m) => [m.teamA, m.teamB]);
    const teamMap = new Map<number, (typeof allTeams)[0]>();
    allTeams.forEach((t) => teamMap.set(t.rosterId, t));
    const uniqueTeams = Array.from(teamMap.values());

    let leadHeadline = `WEEK ${week} PREVIEW: ${leagueName.toUpperCase()} AWAITS KICKOFF`;
    let leadStory = `Games for Week ${week} have not been played yet on Sleeper. All ${uniqueTeams.length || 12} franchises sit tied at 0.00 points awaiting kickoff. Lineups are being finalized across the league, and matchups are locked in for battle. Here is your scheduled head-to-head preview for Week ${week}.`;

    if (tone === 'roast') {
      leadHeadline = `WEEK ${week} PRE-GAME ROAST: TALK IS CHEAP BEFORE KICKOFF`;
      leadStory = `Trash talk is free when everyone is sitting at 0.00 points. Week ${week} has not kicked off yet on Sleeper, meaning every manager in ${leagueName} can still pretend their draft was genius. Enjoy the delusion while it lasts—by Tuesday morning, reality will strike half of this league.`;
    } else if (tone === 'espn') {
      leadHeadline = `WEEK ${week} INSIDER PREVIEW: HEAD-TO-HEAD MATCHUPS & PROJECTIONS`;
      leadStory = `Week ${week} has arrived on the calendar, with all franchises locked at 0.00 points awaiting kickoff. From marquee quarterback battles to projected defensive stands, here is your comprehensive pre-game preview for Week ${week} in ${leagueName}.`;
    } else if (tone === 'commish') {
      leadHeadline = `OFFICIAL COMMISH ADDRESS: WEEK ${week} MATCHUPS ARE SET`;
      leadStory = `Gentlemen and managers of ${leagueName}, welcome to Week ${week}. All rosters are currently setting their starting lineups as games have not yet kicked off. Ensure your rosters are set, check injury designations, and verify your starting slots before kickoff.`;
    } else if (tone === 'hype') {
      leadHeadline = `⚡ THE BATTLE BEGINS! WEEK ${week} KICKOFF IS IMMINENT!`;
      leadStory = `THE STADIUM LIGHTS ARE ON! Week ${week} is officially on deck, every manager is undefeated at 0.00 points, and all rosters are primed for kickoff! Who will seize the scoring crown and who will face devastation? Let the games begin!`;
    } else if (tone === 'conspiracy') {
      leadHeadline = `🚨 WEEK ${week} SCHEDULE AUDIT: ARE THE MATCHUPS BALANCED?`;
      leadStory = `Games have not begun, but our analysts are already auditing the Week ${week} slate. All teams are sitting at 0.00 points, yet the scheduling matrix reveals critical swing matchups. Is someone getting a gift matchup? The scoreboard will reveal all soon enough.`;
    }

    const scheduledLedger = matchups.map((m) => ({
      winner: m.teamA.ownerName,
      winnerPts: 0,
      loser: m.teamB.ownerName,
      loserPts: 0,
      recap: `Scheduled Matchup #${m.matchupId}: ${m.teamA.ownerName} (${m.teamA.teamName}) vs ${m.teamB.ownerName} (${m.teamB.teamName}). Kickoff pending.`,
      winnerAvatarUrl: m.teamA.avatarUrl,
      loserAvatarUrl: m.teamB.avatarUrl,
    }));

    const scheduledLeaderboard = uniqueTeams.map((t, idx) => ({
      rank: idx + 1,
      manager: t.ownerName,
      teamName: t.teamName,
      points: 0,
      record: '0.00 pts (Scheduled)',
      avatarUrl: t.avatarUrl,
    }));

    const scheduledPowerRankings = uniqueTeams.map((t, idx) => ({
      rank: idx + 1,
      manager: t.ownerName,
      teamName: t.teamName,
      record: '0.00 pts',
      points: 0,
      rationale: `Scheduled for Week ${week}. All rosters currently at 0.00 pts awaiting kickoff.`,
      avatarUrl: t.avatarUrl,
    }));

    return {
      leagueName,
      week,
      date: dateStr,
      editionTag,
      motto: customMotto,
      isUpcoming: true,
      leadHeadline,
      leadStory,
      leadPhoto: {
        headline: 'SCHEDULED MARQUEE CLASH',
        caption: `${m1?.teamA.ownerName || 'Team A'} squares off against ${m1?.teamB.ownerName || 'Team B'} in Week ${week}. Kickoff pending.`,
        primaryAvatarUrl: m1?.teamA.avatarUrl,
        primaryName: m1?.teamA.ownerName || 'Team A',
        opponentAvatarUrl: m1?.teamB.avatarUrl,
        opponentName: m1?.teamB.ownerName || 'Team B',
        badgeText: 'MATCHUP PREVIEW',
      },
      gmOfTheWeek: {
        manager: m1?.teamA.ownerName || 'Team A',
        teamName: m1?.teamA.teamName || 'Team A',
        points: 0,
        record: 'Scheduled',
        rationale: 'Week has not started yet. Weekly honors will be awarded once games conclude.',
        avatarUrl: m1?.teamA.avatarUrl,
      },
      blowoutOfTheWeek: {
        winner: m1?.teamA.ownerName || 'Team A',
        loser: m1?.teamB.ownerName || 'Team B',
        margin: 0,
        winnerPts: 0,
        loserPts: 0,
        recap: `Matchup #${m1?.matchupId || 1}: ${m1?.teamA.ownerName || 'Team A'} vs ${m1?.teamB.ownerName || 'Team B'}. Games have not commenced yet on Sleeper.`,
        reactionCaption: 'Kickoff pending on Sleeper.',
        winnerAvatarUrl: m1?.teamA.avatarUrl,
        loserAvatarUrl: m1?.teamB.avatarUrl,
        winnerTeamName: m1?.teamA.teamName,
        loserTeamName: m1?.teamB.teamName,
      },
      galaxyBrainMove: {
        manager: m2?.teamA.ownerName || m1?.teamB.ownerName || 'Manager',
        moveTitle: 'Lineup Optimization',
        rationale: 'Managers are checking injury reports, setting starters, and finalizing flex spots before kickoff.',
        caption: 'Lineups lock at game time.',
        avatarUrl: m2?.teamA.avatarUrl || m1?.teamB.avatarUrl,
        teamName: m2?.teamA.teamName || m1?.teamB.teamName,
      },
      boneheadMove: {
        manager: 'League-Wide Alert',
        moveTitle: 'Inactive Starters Warning',
        rationale: 'Remember to check inactives and remove any injured or out players from your starting roster.',
        benchPoints: 0,
        avatarUrl: undefined,
        teamName: 'Lineup Alert',
      },
      mondayNightFallout: `Week ${week} games have not been played yet. Scores will be finalized as games wrap up.`,
      unluckyBastard: null,
      matchupLedger: scheduledLedger,
      pointsLeaderboard: scheduledLeaderboard,
      sidePotDesk: {
        enabled: sidePotConfig.enabled,
        totalPot: sidePotConfig.totalPot,
        entriesCount: sidePotConfig.totalEntries,
        entryFee: sidePotConfig.entryFee,
        pointsWinnerName: 'Pending Kickoff',
        pointsWinnerAvatarUrl: undefined,
        pointsPayout: sidePotConfig.pointsWinnerPayout,
        blowoutWinnerName: 'Pending Kickoff',
        blowoutWinnerAvatarUrl: undefined,
        blowoutPayout: sidePotConfig.blowoutWinnerPayout,
        nextWeekFee: sidePotConfig.entryFee,
      },
      powerRankings: scheduledPowerRankings,
      commissionerNotebook: {
        fraudWatch: `No games played yet for Week ${week}. All teams currently sit at 0.00 pts.`,
        stockUp: `All ${uniqueTeams.length || 12} franchises entering Week ${week} with a clean slate.`,
        stockDown: `Waiting on kickoff.`,
        galaxyBrain: `Locking in early starters and reserving flex spots for later games.`,
        bonehead: `Leaving an injured or bye-week player in your starting lineup.`,
        leagueCanon: `Anticipation builds as Week ${week} approaches.`,
        aroundTheLeague: `All matchups scheduled on Sleeper. Scores will update live once games begin.`,
        nextWeekWarning: `Check your starting lineup before kickoff!`,
        finalWord: `Week ${week} is about to get underway. Set your lineups and best of luck!`,
      },
    };
  }

  const highScorer = ws?.highestScorer;
  const lowScorer = ws?.lowestScorer;
  const blowout = ws?.biggestBlowout;
  const unlucky = ws?.highestScoringLoser;
  const close = ws?.closestMatchup;

  const fallbackWinner = ws?.matchups?.[0]?.winner || ws?.matchups?.[0]?.teamA;
  const fallbackLoser = ws?.matchups?.[0]?.loser || ws?.matchups?.[0]?.teamB;

  // Identify GM of the week (highest scoring winner)
  const gmName = highScorer?.ownerName || fallbackWinner?.ownerName || 'Top Scorer';
  const gmTeam = highScorer?.teamName || fallbackWinner?.teamName || 'Leader Team';
  const gmPoints = highScorer?.points ?? fallbackWinner?.points ?? 0;

  // Blowout details
  const boWinner = blowout?.winner.ownerName || fallbackWinner?.ownerName || 'Winner';
  const boLoser = blowout?.loser.ownerName || fallbackLoser?.ownerName || 'Opponent';
  const boMargin = blowout?.margin || 0;
  const boWinnerPts = blowout?.winner.points || 0;
  const boLoserPts = blowout?.loser.points || 0;

  // Find galaxy brain move:
  const sortedMatchups = ws?.matchups || [];
  const topWinner = sortedMatchups.find((m) => m.winner.ownerName !== gmName)?.winner || fallbackWinner;
  const galaxyManager = topWinner?.ownerName || 'Manager';
  const galaxyMoveTitle = 'Tactical Roster Deployment';
  const galaxyRationale = `Delivered with ${topWinner?.points || 0} points and a dominant win. Obvious? Yes. Smart? Also yes.`;

  // Find bonehead move / positional bench blunder:
  const topPosBlunder = ws?.topPositionalBlunder;
  const topBenchBlunder = ws?.benchBlunders?.[0];
  const boneheadManager = topPosBlunder
    ? topPosBlunder.manager
    : (lowScorer?.ownerName || topBenchBlunder?.team.ownerName || fallbackLoser?.ownerName || 'Manager');
  const boneheadMoveTitle = topPosBlunder
    ? `Benched ${topPosBlunder.benchPlayerName} for ${topPosBlunder.starterPlayerName}`
    : 'Questionable Lineup Decisions';
  const boneheadRationale = topPosBlunder
    ? topPosBlunder.blurb
    : (topBenchBlunder
        ? `${boneheadManager}'s ${lowScorer?.points || 0} points with ${topBenchBlunder.benchPoints} points sitting on the bench. No further questions at this time.`
        : `${boneheadManager}'s ${lowScorer?.points || 0} points. No further questions at this time.`);
  const boneheadAvatar = topPosBlunder?.avatarUrl || lowScorer?.avatarUrl || topBenchBlunder?.team.avatarUrl;
  const boneheadTeam = topPosBlunder?.teamName || lowScorer?.teamName || topBenchBlunder?.team.teamName;

  // Lead Headline and Story
  let leadHeadline = `${gmName.toUpperCase()} OPENS THE SEASON WITH A STATEMENT`;
  let leadStory = `${gmPoints} points. The Week ${week} scoring crown belongs to ${gmName}, who knocked off their opponent in the highest-scoring contest of the week. Second-place would have beaten nearly everyone else in the league, but they happened to draw the one roster that scored more.`;

  if (tone === 'roast') {
    leadHeadline = `${gmName.toUpperCase()} RUNS WILD WHILE THE CELLAR CRUMBLES`;
    leadStory = `${gmPoints} points! The Week ${week} scoring crown belongs to ${gmName}, who treated their opponent like an unlicensed demolition derby. Meanwhile, down at the bottom of the scoreboard, we have managers who apparently thought the draft was optional. If your team failed to crack triple digits, please seek immediate spiritual guidance.`;
  } else if (tone === 'espn') {
    leadHeadline = `WEEK ${week} INSIDER: ${gmName.toUpperCase()} TAKES SCORING CROWN IN TACTICAL MASTERCLASS`;
    leadStory = `With ${gmPoints} points on the ledger, ${gmName} put together the definitive performance of Week ${week}. Utilizing high-leverage target shares and red-zone efficiency, the roster dominated from the 1:00 PM window through Monday night. In our featured clash, second-place posted numbers that would have defeated 80% of the league, yet ran into a freight train.`;
  } else if (tone === 'commish') {
    leadHeadline = `OFFICIAL COMMISH ADDRESS: ${gmName.toUpperCase()} LEADS THE LEAGUE IN WEEK ${week}`;
    leadStory = `Gentlemen and managers of ${leagueName}, welcome to the official Week ${week} review. I want to commend ${gmName} (${gmTeam}) for setting the championship benchmark with ${gmPoints} points. Fantasy football is a marathon, not a sprint. To those holding an 0-1 record: keep your composure, manage the waiver wire diligently, and maintain competitive integrity.`;
  } else if (tone === 'hype') {
    leadHeadline = `⚡ HIGH-VOLTAGE CARNAGE! ${gmName.toUpperCase()} ANNIHILATES WEEK ${week}!`;
    leadStory = `ABSOLUTE MAYHEM IN THE STADIUM! ${gmPoints} EXPLOSIVE POINTS! ${gmName} went full scorched-earth mode, dropping 50-yard bombs and red-zone touchdowns until the scoreboard nearly short-circuited! The fans are going wild, the fireworks are exploding, and the championship race is on FIRE!`;
  } else if (tone === 'conspiracy') {
    leadHeadline = `🚨 WAS WEEK ${week} RIGGED? THE INVESTIGATION INTO ${gmName.toUpperCase()}'S WIN`;
    leadStory = `Look at the numbers. Just open your eyes and look at the timestamps. ${gmPoints} points? Convenient garbage-time touchdowns in the final 2 minutes? We ran statistical simulations through our encrypted terminal, and the probability of ${gmName}'s outcome is 0.0041%. Did the Sleeper scheduling algorithm collude with the schedule-makers? We are not pointing fingers, but the paper trail is undeniably suspicious.`;
  }

  // Unlucky Bastard Club
  const unluckyBastard = unlucky
    ? {
        manager: unlucky.team.ownerName,
        points: unlucky.team.points,
        opponent: unlucky.matchup.winner.ownerName,
        opponentPts: unlucky.matchup.winner.points,
        avatarUrl: unlucky.team.avatarUrl,
        consolationPrize: sidePotConfig.enabled
          ? `$${sidePotConfig.pointsWinnerPayout.toFixed(2)} #1 Points side-pot payout`
          : 'High-scoring sympathy & moral victory',
        blurb: sidePotConfig.enabled
          ? `${unlucky.team.ownerName} is the inductee. A ${unlucky.team.points}-point performance at 0-1 is the fantasy equivalent of doing everything right and still getting mugged in an alley. The consolation prize: a $${sidePotConfig.pointsWinnerPayout.toFixed(2)} #1 Points side-pot payout.`
          : `${unlucky.team.ownerName} is the inductee. A ${unlucky.team.points}-point performance at 0-1 is the fantasy equivalent of doing everything right and still getting mugged in an alley. No victory or payout to show for it—just pure heartbreak and high-scoring sympathy.`,
      }
    : null;

  // The Matchup Ledger
  const matchupLedger = sortedMatchups.map((m) => {
    let recap = `${m.winner.ownerName} wins by ${m.margin}.`;
    if (m === blowout) {
      recap = `${m.winner.ownerName} wins by ${m.margin}. Not a matchup—that's a wellness check.`;
    } else if (unlucky && m.loser.rosterId === unlucky.team.rosterId) {
      recap = `${m.winner.ownerName} wins by ${m.margin}. Highest-scoring game of the week; heartbreaking loss for ${m.loser.ownerName}.`;
    } else if (m === close) {
      recap = `${m.winner.ownerName} wins by ${m.margin}. Monday night nail-biter decided in the final minutes.`;
    } else if (m.margin > 40) {
      recap = `${m.winner.ownerName} wins by ${m.margin}. Roster depth proved overwhelming.`;
    } else {
      recap = `${m.winner.ownerName} wins by ${m.margin}. Balanced scoring locked in the victory.`;
    }

    return {
      winner: m.winner.ownerName,
      winnerPts: m.winner.points,
      loser: m.loser.ownerName,
      loserPts: m.loser.points,
      recap,
      winnerAvatarUrl: m.winner.avatarUrl,
      loserAvatarUrl: m.loser.avatarUrl,
    };
  });

  // Final Points Leaderboard
  const allTeamsList = [
    ...(ws?.matchups.flatMap((m) => [m.teamA, m.teamB]) || []),
  ];
  // Deduplicate by rosterId
  const uniqueTeamsMap = new Map<number, typeof allTeamsList[0]>();
  allTeamsList.forEach((t) => uniqueTeamsMap.set(t.rosterId, t));
  const uniqueTeams = Array.from(uniqueTeamsMap.values()).sort(
    (a, b) => b.points - a.points
  );

  const pointsLeaderboard = uniqueTeams.map((t, idx) => {
    const isWinner = ws?.matchups.some(
      (m) => m.winner.rosterId === t.rosterId
    );
    return {
      rank: idx + 1,
      manager: t.ownerName,
      teamName: t.teamName,
      points: t.points,
      record: isWinner ? '1-0' : '0-1',
      avatarUrl: t.avatarUrl,
    };
  });

  // Power Rankings
  const powerRankings = pointsLeaderboard.map((team, idx) => {
    const rank = idx + 1;
    let rationale = '';
    if (rank === 1) {
      rationale = `${team.points} and 1-0. The league-high score earns the crown. Undisputed #1.`;
    } else if (team.record === '0-1' && rank <= 4) {
      rationale = `${team.points} and 0-1. The best 0-1 team by a mile. Extremely unlucky draw.`;
    } else if (team.record === '1-0' && rank <= 5) {
      rationale = `${team.points} and 1-0. Strong opening week and a convincing victory.`;
    } else if (team.record === '1-0') {
      rationale = `${team.points} and 1-0. Not flashy, but the only number that matters is 1-0.`;
    } else if (rank >= pointsLeaderboard.length - 1) {
      rationale = `${team.points} and 0-1. Week ${week} was not kind to a roster that looked terrifying on draft night.`;
    } else {
      rationale = `${team.points} and 0-1. Good enough to beat most teams; ran into tough opposition.`;
    }

    return {
      rank,
      manager: team.manager,
      teamName: team.teamName,
      record: team.record,
      points: team.points,
      rationale,
      avatarUrl: team.avatarUrl,
    };
  });

  // Side pot winners:
  // Points pot goes to highest scorer (or unlucky bastard if league rule prefers high-scoring loser)
  const pointsWinner = unlucky?.team.ownerName || highScorer?.ownerName || fallbackWinner?.ownerName || 'Winner';
  const pointsWinnerAvatar =
    unlucky?.team.ownerName === pointsWinner
      ? unlucky.team.avatarUrl
      : highScorer?.avatarUrl || fallbackWinner?.avatarUrl;
  const blowoutWinner = blowout?.winner.ownerName || fallbackWinner?.ownerName || 'Winner';
  const blowoutWinnerAvatar = blowout?.winner.avatarUrl || fallbackWinner?.avatarUrl;

  const leadPhoto = {
    headline: 'GAME OF THE WEEK / HIGH ROLLER SHOWDOWN',
    caption: `${gmName} (${gmTeam}) opened the season with an electric ${gmPoints} pts to lead the league.`,
    primaryAvatarUrl: highScorer?.avatarUrl,
    primaryName: gmName,
    opponentAvatarUrl: unlucky ? unlucky.team.avatarUrl : blowout?.loser.avatarUrl,
    opponentName: unlucky ? unlucky.team.ownerName : blowout?.loser.ownerName,
    badgeText: 'MARQUEE CLASH',
  };

  return {
    leagueName,
    week,
    date: dateStr,
    editionTag,
    motto: customMotto,
    leadHeadline,
    leadStory,
    leadPhoto,
    gmOfTheWeek: {
      manager: gmName,
      teamName: gmTeam,
      points: gmPoints,
      record: '1-0',
      rationale: `League-high score. Beat the competition with an electric roster. It's hard to argue with the results.`,
      avatarUrl: highScorer?.avatarUrl || fallbackWinner?.avatarUrl,
    },
    blowoutOfTheWeek: {
      winner: boWinner,
      loser: boLoser,
      margin: boMargin,
      winnerPts: boWinnerPts,
      loserPts: boLoserPts,
      recap: `${boWinner}'s ${boWinnerPts} was one of the highest scores, while ${boLoser}'s ${boLoserPts} was the lowest. That's not a matchup—that's a wellness check.`,
      reactionCaption: `${boLoser}'s Week ${week} mood.`,
      winnerAvatarUrl: blowout?.winner.avatarUrl || fallbackWinner?.avatarUrl,
      loserAvatarUrl: blowout?.loser.avatarUrl || fallbackLoser?.avatarUrl,
      winnerTeamName: blowout?.winner.teamName || fallbackWinner?.teamName,
      loserTeamName: blowout?.loser.teamName || fallbackLoser?.teamName,
    },
    galaxyBrainMove: {
      manager: galaxyManager,
      moveTitle: galaxyMoveTitle,
      rationale: galaxyRationale,
      caption: 'Two QBs. One genius (maybe).',
      avatarUrl: topWinner?.avatarUrl,
      teamName: topWinner?.teamName,
    },
    boneheadMove: {
      manager: boneheadManager,
      moveTitle: boneheadMoveTitle,
      rationale: boneheadRationale,
      benchPoints: topPosBlunder ? topPosBlunder.benchPlayerPoints : topBenchBlunder?.benchPoints,
      avatarUrl: boneheadAvatar,
      teamName: boneheadTeam,
    },
    mondayNightFallout:
      'The Monday night numbers changed the scoreboard, but not the winners. Late-game garbage time and red-zone scores locked the final numbers into the ledger.',
    unluckyBastard,
    matchupLedger,
    pointsLeaderboard,
    sidePotDesk: {
      enabled: sidePotConfig.enabled,
      totalPot: sidePotConfig.totalPot,
      entriesCount: sidePotConfig.totalEntries,
      entryFee: sidePotConfig.entryFee,
      pointsWinnerName: pointsWinner,
      pointsWinnerAvatarUrl: pointsWinnerAvatar,
      pointsPayout: sidePotConfig.pointsWinnerPayout,
      blowoutWinnerName: blowoutWinner,
      blowoutWinnerAvatarUrl: blowoutWinnerAvatar,
      blowoutPayout: sidePotConfig.blowoutWinnerPayout,
      nextWeekFee: sidePotConfig.entryFee,
    },
    powerRankings,
    commissionerNotebook: {
      fraudWatch:
        tone === 'roast'
          ? `${boneheadManager}. Talked endlessly on draft night, only to drop an absolute stinker. Bench yourself.`
          : tone === 'espn'
          ? `${boneheadManager}. High draft equity yet low opportunity share. Usage metrics demand immediate attention.`
          : tone === 'hype'
          ? `${boneheadManager}! ALL TALK NO FIREWORKS! Time to wake up and start balling!`
          : tone === 'conspiracy'
          ? `${boneheadManager}. Clearly a targeted victim of the Sleeper RNG simulation.`
          : `${boneheadManager}. Low scoring from a roster that looked terrifying on paper. There is plenty of season left, but Week ${week} did not inspire confidence.`,
      stockUp:
        tone === 'roast'
          ? `${uniqueTeams.slice(0, 3).map((t) => t.ownerName).join(', ')}. Enjoying life at the top while laughing at the cellar dwellers.`
          : tone === 'hype'
          ? `${uniqueTeams.slice(0, 3).map((t) => t.ownerName).join(', ')}. PURE POWER! UNSTOPPABLE APEX BEASTS!`
          : `${uniqueTeams.slice(0, 4).map((t) => `${t.ownerName}: ${t.points}`).join('. ')}. The early contenders have announced themselves.`,
      stockDown:
        tone === 'roast'
          ? `${uniqueTeams.slice(-2).map((t) => t.ownerName).join(' and ')}. Look like they drafted off a fantasy magazine from 2018.`
          : tone === 'conspiracy'
          ? `${uniqueTeams.slice(-2).map((t) => t.ownerName).join(' and ')}. The schedule generator gave them the statistical death draw.`
          : `${uniqueTeams.slice(-2).map((t) => t.ownerName).join(' and ')}. Both finished below expectations and need their star players to start acting like stars.`,
      galaxyBrain: `${galaxyManager} starting both high-upside passers in Superflex was exactly what the format demands.`,
      bonehead: topPosBlunder
        ? topPosBlunder.blurb
        : (topBenchBlunder
            ? `${boneheadManager}'s ${lowScorer?.points || 0} pts with ${topBenchBlunder.benchPoints} pts left on bench.`
            : `${boneheadManager}'s low scoring total. No further questions at this time.`),
      leagueCanon: `${gmName} is the early target on everyone's calendar. ${unlucky ? `${unlucky.team.ownerName} is the unlucky bastard.` : ''} The title race is officially underway.`,
      aroundTheLeague: `Week ${week} produced multiple high-scoring performances above average. The top of the standings is already crowded.`,
      nextWeekWarning: sidePotConfig.enabled
        ? (tone === 'roast'
          ? `Pay your damn $${sidePotConfig.entryFee} side pot before Thursday kickoff or get roasted in the public square.`
          : tone === 'hype'
          ? `GET YOUR $${sidePotConfig.entryFee} SIDE-POT LOCKED IN BEFORE TNF! NO EXCUSES!`
          : `The side pot is active. $${sidePotConfig.entryFee} entry fee per player, due before Thursday Night Football kickoff. Pay your damn five dollars.`)
        : (tone === 'roast'
          ? `Lineups lock at TNF kickoff. Don't be that clown who starts an injured player on IR.`
          : tone === 'hype'
          ? `WEEK ${week + 1} IS COMING FAST! LOCK IN YOUR STARTERS BEFORE THURSDAY KICKOFF!`
          : `Roster check: verify your starters before Thursday Night Football kickoff. Waivers process according to league settings.`),
      finalWord:
        tone === 'roast'
          ? `Week ${week} is over. ${gmName} gets the glory, the losers get the mockery, and the rest of you have six days to fix your disastrous teams.`
          : tone === 'espn'
          ? `Week ${week} establishes an aggressive baseline. Watch the waiver wires closely as early trends convert into playoff momentum.`
          : tone === 'hype'
          ? `WEEK ${week} BROUGHT THE HOUSE DOWN! GET READY FOR MORE MAYHEM IN WEEK ${week + 1}!`
          : `Week ${week} is officially in the books. ${gmName} owns the scoreboard. ${
              sidePotConfig.enabled ? `${pointsWinner} claims the points side pot. ` : ''
            }And everyone else has approximately one week of evidence for whatever argument they plan to make about their roster.`,
    },
    topPositionalBlunder: topPosBlunder || null,
    positionalBlunders: ws?.positionalBlunders || [],
  };
}

/**
 * Converts GazetteReportData into formatted markdown for easy copy-paste
 */
export function gazetteToMarkdown(g: GazetteReportData): string {
  let md = `# 📰 THE ${g.leagueName.toUpperCase()} GAZETTE\n`;
  md += `**WEEK ${g.week} • ${g.editionTag} • ${g.date}**\n`;
  md += `*${g.motto}*\n\n`;

  md += `---\n\n`;
  md += `## 🏆 THE REST OF WEEK ${g.week}\n\n`;
  md += `### 💥 Blowout of the Week\n`;
  md += `**${g.blowoutOfTheWeek.winner} (${g.blowoutOfTheWeek.winnerPts}) def. ${g.blowoutOfTheWeek.loser} (${g.blowoutOfTheWeek.loserPts})** [${g.blowoutOfTheWeek.margin} pt margin]\n`;
  md += `> ${g.blowoutOfTheWeek.recap}\n\n`;

  md += `### 👑 GM of the Week: ${g.gmOfTheWeek.manager}\n`;
  md += `*${g.gmOfTheWeek.points} pts • ${g.gmOfTheWeek.record}*\n`;
  md += `${g.gmOfTheWeek.rationale}\n\n`;

  md += `### 🧠 Galaxy Brain Move: ${g.galaxyBrainMove.manager}\n`;
  md += `**${g.galaxyBrainMove.moveTitle}**\n`;
  md += `${g.galaxyBrainMove.rationale}\n\n`;

  md += `---\n\n`;
  md += `## 📢 ${g.leadHeadline}\n\n`;
  md += `${g.leadStory}\n\n`;

  md += `### 🌙 MONDAY NIGHT FALLOUT\n`;
  md += `${g.mondayNightFallout}\n\n`;

  if (g.unluckyBastard) {
    md += `### 💔 THE UNLUCKY BASTARD CLUB\n`;
    md += `${g.unluckyBastard.blurb}\n\n`;
  }

  if (g.positionalBlunders && g.positionalBlunders.length > 0) {
    const seenTeams = new Set<string>();
    const uniqueBlunders = g.positionalBlunders.filter((b) => {
      const key = (b.teamName || b.manager).toLowerCase().trim();
      if (seenTeams.has(key)) return false;
      seenTeams.add(key);
      return true;
    });

    if (uniqueBlunders.length > 0) {
      md += `### 🤦 HINDSIGHT 20/20: BENCH REGRETS & "IF ONLY..." DESK\n\n`;
      uniqueBlunders.slice(0, 3).forEach((b) => {
        const tagStr = b.flavorTag ? ` [${b.flavorTag}]` : '';
        const headlineStr = b.headline ? ` *${b.headline}* — ` : ' ';
        md += `- **${b.manager} (${b.teamName})**${tagStr}:${headlineStr}${b.blurb}\n`;
      });
      md += `\n`;
    }
  }

  md += `---\n\n`;
  md += `## 📜 THE WEEK ${g.week} LEDGER\n`;
  md += `*Every matchup. Every result. Every excuse.*\n\n`;
  md += `| Winner | Pts | Loser | Pts | Recap |\n`;
  md += `|---|---|---|---|---|\n`;
  g.matchupLedger.forEach((m) => {
    md += `| **${m.winner}** | ${m.winnerPts} | ${m.loser} | ${m.loserPts} | ${m.recap} |\n`;
  });
  md += `\n`;

  md += `### 📊 FINAL POINTS LEADERBOARD\n\n`;
  md += `| # | Manager | PTS | REC |\n`;
  md += `|---|---|---|---|\n`;
  g.pointsLeaderboard.forEach((t) => {
    md += `| ${t.rank} | **${t.manager}** | ${t.points} | ${t.record} |\n`;
  });
  md += `\n`;

  if (g.sidePotDesk.enabled) {
    md += `### 💰 SIDE POT DESK\n\n`;
    md += `- **Week ${g.week} Total Pot:** $${g.sidePotDesk.totalPot.toFixed(2)} (${g.sidePotDesk.entriesCount} entries × $${g.sidePotDesk.entryFee})\n`;
    md += `- **#1 Points Winner:** ${g.sidePotDesk.pointsWinnerName} ($${g.sidePotDesk.pointsPayout.toFixed(2)})\n`;
    md += `- **Biggest Blowout:** ${g.sidePotDesk.blowoutWinnerName} ($${g.sidePotDesk.blowoutPayout.toFixed(2)})\n`;
    md += `- **Next Week Notice:** Entry fee $${g.sidePotDesk.nextWeekFee} • Due before TNF kickoff\n\n`;
  }

  md += `---\n\n`;
  md += `## 📈 POWER RANKINGS\n`;
  md += `*Subjective. Unapologetic. Based on one week of evidence.*\n\n`;
  g.powerRankings.forEach((p) => {
    md += `${p.rank}. **${p.manager}** (${p.points} pts, ${p.record}) — ${p.rationale}\n`;
  });
  md += `\n`;

  md += `## 📓 THE COMMISSIONER'S NOTEBOOK\n\n`;
  md += `- 🚨 **FRAUD WATCH:** ${g.commissionerNotebook.fraudWatch}\n`;
  md += `- 📈 **STOCK UP:** ${g.commissionerNotebook.stockUp}\n`;
  md += `- 📉 **STOCK DOWN:** ${g.commissionerNotebook.stockDown}\n`;
  md += `- 🧠 **GALAXY BRAIN MOVE:** ${g.commissionerNotebook.galaxyBrain}\n`;
  md += `- 🤦 **BONEHEAD MOVE:** ${g.commissionerNotebook.bonehead}\n`;
  md += `- 📜 **LEAGUE CANON:** ${g.commissionerNotebook.leagueCanon}\n`;
  md += `- 🌐 **AROUND THE LEAGUE:** ${g.commissionerNotebook.aroundTheLeague}\n`;
  md += `- ⚠️ **WEEK WARNING:** ${g.commissionerNotebook.nextWeekWarning}\n\n`;

  md += `### ✍️ FINAL WORD\n`;
  md += `${g.commissionerNotebook.finalWord}\n\n`;
  md += `---\n*The ${g.leagueName} Weekly Gazette • Page 1 of 3*`;

  return md;
}
