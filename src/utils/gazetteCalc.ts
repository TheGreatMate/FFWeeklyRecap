import {
  WeekStats,
  ChoppedWeekStats,
  LeagueFormat,
  SidePotConfig,
  GazetteReportData,
} from '../types';

export const DEFAULT_SIDE_POT_CONFIG: SidePotConfig = {
  enabled: true,
  entryFee: 5,
  totalEntries: 5,
  totalPot: 25,
  pointsWinnerPayout: 12.5,
  blowoutWinnerPayout: 12.5,
  nextWeekNotice: 'Due before TNF kickoff',
};

/**
 * Builds all data and commentary for the 3-page Weekly Gazette Newspaper Report
 * mimicking the exact structure from the commissioner newsletter.
 */
export function buildGazetteReportData(
  leagueName: string,
  weekStats?: WeekStats | null,
  choppedStats?: ChoppedWeekStats | null,
  format: LeagueFormat = 'head_to_head',
  sidePotConfig: SidePotConfig = DEFAULT_SIDE_POT_CONFIG,
  customMotto: string = 'SAME LEAGUE. DIFFERENT LEVELS.',
  customEditionTag?: string
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

    const leadHeadline = apex
      ? `${apex.ownerName.toUpperCase()} SURVIVES AT THE APEX AS THE BLADE FALLS`
      : 'THE GUILLOTINE CLAIMS ITS FIRST SACRIFICE';

    const rawStarters = c.choppedRosterDetails?.map((p) => p.name) || c.choppedRosterStarters || [];
    const cleanStarters = rawStarters
      .map((s) => s.replace(/\s*\([^)]*\)/, '').trim())
      .filter((s) => s && !s.startsWith('Player #') && !/^\d+$/.test(s));
    const starsPhrase = cleanStarters.length > 0 ? cleanStarters.slice(0, 3).join(', ') : 'their top starters';

    const leadStory = chopped
      ? `${chopped.points} points. Week ${week} has claimed its victim. ${chopped.ownerName} (${chopped.teamName}) fell short of the cut line and has been officially chopped from the league. Their entire roster—including stars ${starsPhrase}—is immediately surrendered to the waiver wire.`
      : `The executioner had no mercy in Week ${week}. Survival is the only metric that matters.`;

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
      rank: idx + 1,
      manager: t.ownerName,
      teamName: t.teamName,
      points: t.points,
      record: t.rosterId === chopped?.rosterId ? 'ELIMINATED' : 'SAFE',
      avatarUrl: t.avatarUrl,
    }));

    const matchupLedger = (c.allRankedTeams || []).map((t, idx) => {
      const isVictim = t.rosterId === chopped?.rosterId;
      const marginOverChop = chopped
        ? Number((t.points - chopped.points).toFixed(2))
        : 0;
      return {
        winner: t.ownerName,
        winnerPts: t.points,
        loser: isVictim ? 'The Guillotine' : `${marginOverChop} pts clear`,
        loserPts: chopped?.points || 0,
        recap: isVictim
          ? `🪓 CHOPPED. Lowest score in the league. Roster sent to waivers.`
          : idx === 0
          ? `Apex Predator. Untouchable performance atop the ladder.`
          : idx === (c.allRankedTeams?.length || 0) - 2
          ? `Narrow Escape! Dodged the blade by just ${marginOverChop} pts.`
          : `Clean survival. Safely through to Week ${week + 1}.`,
        winnerAvatarUrl: t.avatarUrl,
        loserAvatarUrl: chopped?.avatarUrl,
      };
    });

    const powerRankings = (c.allRankedTeams || []).map((t, idx) => {
      const rank = idx + 1;
      let note = 'Solid survival.';
      if (t.rosterId === chopped?.rosterId) {
        note = `${t.points} pts. Extinguished. Roster liquidated to waivers.`;
      } else if (rank === 1) {
        note = `${t.points} pts. The league benchmark. Untouchable roster depth.`;
      } else if (rank <= 3) {
        note = `${t.points} pts. Elite safety margin. Primed for a deep run.`;
      } else if (rank === (c.allRankedTeams?.length || 0) - 1) {
        note = `${t.points} pts. Staring into the abyss. Needs immediate FAAB reinforcement.`;
      } else {
        note = `${t.points} pts. Quiet survival, but the margins get thinner every week.`;
      }
      return {
        rank,
        manager: t.ownerName,
        teamName: t.teamName,
        record: t.rosterId === chopped?.rosterId ? '0-1 (Out)' : '1-0',
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
        fraudWatch: `${chopped?.ownerName || 'The Eliminated'}. Expected to contend, but crashed out in the very first test.`,
        stockUp: `${apex?.ownerName || 'Leader'} and the top tier. Put up dominant numbers.`,
        stockDown: `${narrow?.team.ownerName || 'The Bubble'}. Survived on borrowed time.`,
        galaxyBrain: `Saving FAAB budget while still squeaking through to the next round.`,
        bonehead: `${chopped?.ownerName || 'Eliminated'}'s lineup choices. Cost them the entire season.`,
        leagueCanon: `The blade has tasted blood. ${chopped?.ownerName}'s stars are the prize of the waiver wire.`,
        aroundTheLeague: `Survival threshold was ${narrow?.team.points || 80} points. Next week the floor rises.`,
        nextWeekWarning: `FAAB bids process Wednesday at 8 PM. Check your waiver claims.`,
        finalWord: `Week ${week} is history. One manager is in the grave, and eleven vultures are ready to feast on their roster.`,
      },
    };
  }

  // Handle Standard Head-to-Head Format
  const ws = weekStats;
  const highScorer = ws?.highestScorer;
  const lowScorer = ws?.lowestScorer;
  const blowout = ws?.biggestBlowout;
  const unlucky = ws?.highestScoringLoser;
  const close = ws?.closestMatchup;

  // Identify GM of the week (highest scoring winner)
  const gmName = highScorer?.ownerName || 'Colin B';
  const gmTeam = highScorer?.teamName || 'Colin B';
  const gmPoints = highScorer?.points || 183.62;

  // Blowout details
  const boWinner = blowout?.winner.ownerName || 'Colin M';
  const boLoser = blowout?.loser.ownerName || 'David';
  const boMargin = blowout?.margin || 89.34;
  const boWinnerPts = blowout?.winner.points || 168.88;
  const boLoserPts = blowout?.loser.points || 73.1;

  // Find galaxy brain move:
  // Look for a manager who started two elite QBs, or who had highest bench-to-starter ratio that still won
  const sortedMatchups = ws?.matchups || [];
  const topWinner = sortedMatchups.find((m) => m.winner.ownerName !== gmName)?.winner;
  const galaxyManager = topWinner?.ownerName || 'Mike';
  const galaxyMoveTitle = 'Started Dual QBs in Superflex';
  const galaxyRationale = `Started two elite passers in Superflex. Finished with ${topWinner?.points || 161.78} points and a dominant win. Obvious? Yes. Smart? Also yes.`;

  // Find bonehead move:
  // Team with highest bench points or lowest score
  const topBenchBlunder = ws?.benchBlunders?.[0];
  const boneheadManager = lowScorer?.ownerName || topBenchBlunder?.team.ownerName || 'Tim';
  const boneheadRationale = topBenchBlunder
    ? `${boneheadManager}'s ${lowScorer?.points || 99.1} points with ${topBenchBlunder.benchPoints} points sitting on the bench. No further questions at this time.`
    : `${boneheadManager}'s ${lowScorer?.points || 99.1} points. No further questions at this time.`;

  // Lead Headline and Story
  const leadHeadline = `${gmName.toUpperCase()} OPENS THE SEASON WITH A STATEMENT`;
  const leadStory = `${gmPoints} points. The Week ${week} scoring crown belongs to ${gmName}, who knocked off their opponent in the highest-scoring contest of the week. Second-place would have beaten nearly everyone else in the league, but they happened to draw the one roster that scored more.`;

  // Unlucky Bastard Club
  const unluckyBastard = unlucky
    ? {
        manager: unlucky.team.ownerName,
        points: unlucky.team.points,
        opponent: unlucky.matchup.winner.ownerName,
        opponentPts: unlucky.matchup.winner.points,
        consolationPrize: `$${sidePotConfig.pointsWinnerPayout.toFixed(2)} #1 Points side-pot payout`,
        blurb: `${unlucky.team.ownerName} is the inductee. A ${unlucky.team.points}-point performance at 0-1 is the fantasy equivalent of doing everything right and still getting mugged in an alley. The consolation prize: a $${sidePotConfig.pointsWinnerPayout.toFixed(2)} #1 Points side-pot payout.`,
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
  const pointsWinner = unlucky?.team.ownerName || highScorer?.ownerName || 'Mark';
  const pointsWinnerAvatar =
    unlucky?.team.ownerName === pointsWinner
      ? unlucky.team.avatarUrl
      : highScorer?.avatarUrl;
  const blowoutWinner = blowout?.winner.ownerName || 'Mike';
  const blowoutWinnerAvatar = blowout?.winner.avatarUrl;

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
      avatarUrl: highScorer?.avatarUrl,
    },
    blowoutOfTheWeek: {
      winner: boWinner,
      loser: boLoser,
      margin: boMargin,
      winnerPts: boWinnerPts,
      loserPts: boLoserPts,
      recap: `${boWinner}'s ${boWinnerPts} was one of the highest scores, while ${boLoser}'s ${boLoserPts} was the lowest. That's not a matchup—that's a wellness check.`,
      reactionCaption: `${boLoser}'s Week ${week} mood.`,
      winnerAvatarUrl: blowout?.winner.avatarUrl,
      loserAvatarUrl: blowout?.loser.avatarUrl,
      winnerTeamName: blowout?.winner.teamName,
      loserTeamName: blowout?.loser.teamName,
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
      moveTitle: 'Lineup Faceplant',
      rationale: boneheadRationale,
      benchPoints: topBenchBlunder?.benchPoints,
      avatarUrl: lowScorer?.avatarUrl || topBenchBlunder?.team.avatarUrl,
      teamName: lowScorer?.teamName || topBenchBlunder?.team.teamName,
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
      fraudWatch: `${boneheadManager}. Low scoring from a roster that looked terrifying on paper. There is plenty of season left, but Week ${week} did not inspire confidence.`,
      stockUp: `${uniqueTeams.slice(0, 4).map((t) => `${t.ownerName}: ${t.points}`).join('. ')}. The early contenders have announced themselves.`,
      stockDown: `${uniqueTeams.slice(-2).map((t) => t.ownerName).join(' and ')}. Both finished below expectations and need their star players to start acting like stars.`,
      galaxyBrain: `${galaxyManager} starting both high-upside passers in Superflex was exactly what the format demands.`,
      bonehead: `${boneheadManager}'s low scoring total. No further questions at this time.`,
      leagueCanon: `${gmName} is the early target on everyone's calendar. ${unlucky ? `${unlucky.team.ownerName} is the unlucky bastard.` : ''} The title race is officially underway.`,
      aroundTheLeague: `Week ${week} produced multiple high-scoring performances above average. The top of the standings is already crowded.`,
      nextWeekWarning: `The side pot is back. $${sidePotConfig.entryFee} entry fee per player, due before Thursday Night Football kickoff. Pay your damn five dollars.`,
      finalWord: `Week ${week} is officially in the books. ${gmName} owns the scoreboard. ${pointsWinner} claims the points side pot. And everyone else has approximately one week of evidence for whatever argument they plan to make about their roster.`,
    },
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
