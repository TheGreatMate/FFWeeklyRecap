export interface SleeperUser {
  user_id: string;
  username: string;
  display_name: string;
  avatar?: string | null;
}

export interface SleeperLeagueSettings {
  bench_players?: number;
  playoff_teams?: number;
  max_keepers?: number;
  leg?: number;
  trade_deadline?: number;
  type?: number;
  [key: string]: any;
}

export interface SleeperLeagueScoringSettings {
  rec?: number;
  pass_td?: number;
  rush_td?: number;
  rec_td?: number;
  [key: string]: any;
}

export interface SleeperLeague {
  league_id: string;
  name: string;
  season: string;
  status: string;
  total_rosters: number;
  avatar?: string | null;
  scoring_settings?: SleeperLeagueScoringSettings;
  settings?: SleeperLeagueSettings;
}

export interface SleeperRoster {
  roster_id: number;
  owner_id: string;
  players?: string[] | null;
  starters?: string[] | null;
  settings?: {
    wins: number;
    losses: number;
    ties: number;
    fpts: number;
    fpts_decimal?: number;
    fpts_against?: number;
    fpts_against_decimal?: number;
    [key: string]: any;
  };
  metadata?: {
    streak?: string;
    record?: string;
    [key: string]: any;
  };
}

export interface SleeperLeagueUser {
  user_id: string;
  display_name: string;
  avatar?: string | null;
  metadata?: {
    team_name?: string;
    avatar?: string;
    [key: string]: any;
  };
}

export interface SleeperMatchupItem {
  matchup_id: number;
  roster_id: number;
  points: number;
  starters?: string[];
  starters_points?: number[];
  players?: string[];
  players_points?: Record<string, number>;
  custom_points?: number | null;
}

export interface CompactPlayer {
  id: string;
  name: string;
  pos?: string;
  team?: string;
}

export interface TeamInfo {
  rosterId: number;
  ownerId: string;
  teamName: string;
  ownerName: string;
  avatarUrl: string;
  wins: number;
  losses: number;
  points: number;
  starters: string[];
  starterIds?: string[];
  starterDetails?: CompactPlayer[];
  startersPoints: number[];
  benchPoints: number;
  playersPoints: Record<string, number>;
}

export interface HeadToHeadMatchup {
  matchupId: number;
  teamA: TeamInfo;
  teamB: TeamInfo;
  winner: TeamInfo;
  loser: TeamInfo;
  margin: number;
  isTie: boolean;
  totalCombinedScore: number;
}

export interface WeekStats {
  week: number;
  totalMatchups: number;
  totalTeams: number;
  highestScorer: TeamInfo | null;
  lowestScorer: TeamInfo | null;
  biggestBlowout: HeadToHeadMatchup | null;
  highestScoringLoser: {
    team: TeamInfo;
    matchup: HeadToHeadMatchup;
  } | null;
  lowestScoringWinner: {
    team: TeamInfo;
    matchup: HeadToHeadMatchup;
  } | null;
  closestMatchup: HeadToHeadMatchup | null;
  averageScore: number;
  medianScore: number;
  matchups: HeadToHeadMatchup[];
  benchBlunders: {
    team: TeamInfo;
    benchPoints: number;
  }[];
}

export type LeagueFormat = 'head_to_head' | 'chopped' | 'best_ball';

export interface ChoppedWeekStats {
  week: number;
  totalTeams: number;
  choppedTeam: TeamInfo | null;
  apexSurvivor: TeamInfo | null;
  narrowEscape: {
    team: TeamInfo;
    marginOverChopped: number;
  } | null;
  dangerZone: TeamInfo[]; // Bottom 3 survivors above the chopped team
  safeSurvivors: TeamInfo[];
  allRankedTeams: TeamInfo[];
  averageScore: number;
  medianScore: number;
  choppedRosterStarters: string[];
  choppedRosterDetails?: CompactPlayer[];
}

export type NoteTone =
  | 'espn'
  | 'roast'
  | 'commish'
  | 'hype'
  | 'conspiracy'
  | 'grim_reaper'
  | 'hunger_games';

export interface SidePotConfig {
  enabled: boolean;
  entryFee: number;
  totalEntries: number;
  totalPot: number;
  pointsWinnerPayout: number;
  blowoutWinnerPayout: number;
  nextWeekNotice: string;
}

export interface GazetteReportData {
  leagueName: string;
  week: number;
  date: string;
  editionTag: string;
  motto: string;
  leadHeadline: string;
  leadStory: string;
  gmOfTheWeek: {
    manager: string;
    teamName: string;
    points: number;
    record: string;
    rationale: string;
    avatarUrl?: string;
  };
  blowoutOfTheWeek: {
    winner: string;
    loser: string;
    margin: number;
    winnerPts: number;
    loserPts: number;
    recap: string;
    reactionCaption: string;
    winnerAvatarUrl?: string;
    loserAvatarUrl?: string;
    winnerTeamName?: string;
    loserTeamName?: string;
  };
  galaxyBrainMove: {
    manager: string;
    moveTitle: string;
    rationale: string;
    caption: string;
    avatarUrl?: string;
    teamName?: string;
  };
  boneheadMove: {
    manager: string;
    moveTitle: string;
    rationale: string;
    benchPoints?: number;
    avatarUrl?: string;
    teamName?: string;
  };
  mondayNightFallout: string;
  unluckyBastard: {
    manager: string;
    points: number;
    opponent: string;
    opponentPts: number;
    consolationPrize: string;
    blurb: string;
    avatarUrl?: string;
    opponentAvatarUrl?: string;
  } | null;
  matchupLedger: {
    winner: string;
    winnerPts: number;
    loser: string;
    loserPts: number;
    recap: string;
    winnerAvatarUrl?: string;
    loserAvatarUrl?: string;
  }[];
  pointsLeaderboard: {
    rank: number;
    manager: string;
    teamName: string;
    points: number;
    record: string;
    avatarUrl?: string;
  }[];
  sidePotDesk: {
    enabled: boolean;
    totalPot: number;
    entriesCount: number;
    entryFee: number;
    pointsWinnerName: string;
    pointsWinnerAvatarUrl?: string;
    pointsPayout: number;
    blowoutWinnerName: string;
    blowoutWinnerAvatarUrl?: string;
    blowoutPayout: number;
    nextWeekFee: number;
  };
  powerRankings: {
    rank: number;
    manager: string;
    teamName: string;
    record: string;
    points: number;
    rationale: string;
    avatarUrl?: string;
  }[];
  leadPhoto?: {
    headline: string;
    caption: string;
    primaryAvatarUrl?: string;
    primaryName?: string;
    opponentAvatarUrl?: string;
    opponentName?: string;
    badgeText?: string;
  };
  commissionerNotebook: {
    fraudWatch: string;
    stockUp: string;
    stockDown: string;
    galaxyBrain: string;
    bonehead: string;
    leagueCanon: string;
    aroundTheLeague: string;
    nextWeekWarning: string;
    finalWord: string;
  };
}
