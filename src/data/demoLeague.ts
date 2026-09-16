import { SleeperLeague, SleeperLeagueUser, SleeperRoster, SleeperMatchupItem } from '../types';

export const DEMO_USER = {
  user_id: 'demo_commish_2026',
  username: 'FantasyChamp',
  display_name: 'The Commish',
  avatar: '3311d4c0b33900fd56e5e6d0bda41475',
};

export const DEMO_LEAGUE: SleeperLeague = {
  league_id: 'demo_gridiron_clash_2026',
  name: 'Gridiron Legends 2026',
  season: '2026',
  status: 'in_season',
  total_rosters: 12,
  avatar: 'f4d54625b59a4c8cb4e6ea606d9fbce3',
  scoring_settings: {
    rec: 1.0, // Full PPR
    pass_td: 4,
    rush_td: 6,
    rec_td: 6,
  },
  settings: {
    bench_players: 6,
    playoff_teams: 6,
    playoff_type: 0,
  },
};

export const DEMO_CHOPPED_LEAGUE: SleeperLeague = {
  league_id: 'demo_guillotine_chopped_2026',
  name: 'The Guillotine 2026 (Chopped Survival)',
  season: '2026',
  status: 'in_season',
  total_rosters: 12,
  avatar: 'ca4e705270c1a9ad9b9bed7e01caa9a1',
  scoring_settings: {
    rec: 0.5,
    pass_td: 4,
    rush_td: 6,
    rec_td: 6,
  },
  settings: {
    playoff_teams: 0,
    type: 0,
  },
};

export const DEMO_USERS: SleeperLeagueUser[] = [
  {
    user_id: 'u1',
    display_name: 'The Commish',
    avatar: '3311d4c0b33900fd56e5e6d0bda41475',
    metadata: { team_name: 'Mahomes Magic' },
  },
  {
    user_id: 'u2',
    display_name: 'Sarah Connor',
    avatar: 'd9a0519df672516d2b6fce037f374456',
    metadata: { team_name: 'Skynet Terminators' },
  },
  {
    user_id: 'u3',
    display_name: 'Big Mike',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    metadata: { team_name: 'CeeDee Lamb Chops' },
  },
  {
    user_id: 'u4',
    display_name: 'Davey Football',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    metadata: { team_name: 'Bijan Mustard Dogs' },
  },
  {
    user_id: 'u5',
    display_name: 'Fantasy Guru Jordan',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    metadata: { team_name: 'Stroud 9' },
  },
  {
    user_id: 'u6',
    display_name: 'Touchdown Tony',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    metadata: { team_name: 'Breece Lightning' },
  },
  {
    user_id: 'u7',
    display_name: 'Draft Day Hero',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    metadata: { team_name: 'Amon-Ra God of Sun' },
  },
  {
    user_id: 'u8',
    display_name: 'Couch Coach Kevin',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
    metadata: { team_name: 'Lamar Jackson 5' },
  },
  {
    user_id: 'u9',
    display_name: 'Waiver Wire Queen',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    metadata: { team_name: 'Gibbs & Go' },
  },
  {
    user_id: 'u10',
    display_name: 'Garbage Time Gary',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
    metadata: { team_name: 'Nacua Problem' },
  },
  {
    user_id: 'u11',
    display_name: 'Endzone Eddie',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    metadata: { team_name: 'Hurts So Good' },
  },
  {
    user_id: 'u12',
    display_name: 'Sleeper Sniper',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    metadata: { team_name: 'Kittle Big Town' },
  },
];

export const DEMO_ROSTERS: SleeperRoster[] = [
  { roster_id: 1, owner_id: 'u1', settings: { wins: 1, losses: 0, ties: 0, fpts: 154, fpts_decimal: 82 } },
  { roster_id: 2, owner_id: 'u2', settings: { wins: 0, losses: 1, ties: 0, fpts: 79, fpts_decimal: 10 } }, // Big blowout victim!
  { roster_id: 3, owner_id: 'u3', settings: { wins: 1, losses: 0, ties: 0, fpts: 142, fpts_decimal: 40 } },
  { roster_id: 4, owner_id: 'u4', settings: { wins: 0, losses: 1, ties: 0, fpts: 138, fpts_decimal: 74 } }, // Highest-scoring loser! Heartbreaker!
  { roster_id: 5, owner_id: 'u5', settings: { wins: 1, losses: 0, ties: 0, fpts: 119, fpts_decimal: 20 } },
  { roster_id: 6, owner_id: 'u6', settings: { wins: 0, losses: 1, ties: 0, fpts: 116, fpts_decimal: 50 } },
  { roster_id: 7, owner_id: 'u7', settings: { wins: 1, losses: 0, ties: 0, fpts: 104, fpts_decimal: 30 } },
  { roster_id: 8, owner_id: 'u8', settings: { wins: 0, losses: 1, ties: 0, fpts: 98, fpts_decimal: 12 } },
  { roster_id: 9, owner_id: 'u9', settings: { wins: 1, losses: 0, ties: 0, fpts: 128, fpts_decimal: 90 } },
  { roster_id: 10, owner_id: 'u10', settings: { wins: 0, losses: 1, ties: 0, fpts: 108, fpts_decimal: 44 } },
  { roster_id: 11, owner_id: 'u11', settings: { wins: 1, losses: 0, ties: 0, fpts: 95, fpts_decimal: 10 } }, // Lowest scoring winner
  { roster_id: 12, owner_id: 'u12', settings: { wins: 0, losses: 1, ties: 0, fpts: 93, fpts_decimal: 80 } },
];

export const DEMO_MATCHUPS_WEEK_1: SleeperMatchupItem[] = [
  // Matchup 1: Biggest Blowout (154.82 vs 79.10 -> 75.72 margin)
  {
    matchup_id: 1,
    roster_id: 1,
    points: 154.82,
    starters: ['Patrick Mahomes', 'Christian McCaffrey', 'Kyren Williams', 'Justin Jefferson', 'Tyreek Hill', 'Travis Kelce', 'Breece Hall', 'Harrison Butker', 'Ravens DEF'],
    starters_points: [28.4, 24.1, 18.3, 26.2, 19.5, 12.4, 15.9, 8.0, 2.02],
    players_points: { 'DeAndre Hopkins': 14.2, 'Khalil Shakir': 8.5, 'Chuba Hubbard': 3.1 },
  },
  {
    matchup_id: 1,
    roster_id: 2,
    points: 79.10,
    starters: ['Anthony Richardson', 'Devin Singletary', 'Jerome Ford', 'Diontae Johnson', 'Hollywood Brown', 'Dalton Schultz', 'Gabe Davis', 'Greg Zuerlein', 'Patriots DEF'],
    starters_points: [11.2, 4.3, 6.1, 8.9, 14.0, 2.1, 15.5, 9.0, 8.0],
    players_points: { 'Brian Thomas Jr': 18.4, 'Rome Odunze': 12.0 }, // Left 30.4 on bench!
  },

  // Matchup 2: High scoring shootout & Highest-Scoring Loser (142.40 vs 138.74)
  {
    matchup_id: 2,
    roster_id: 3,
    points: 142.40,
    starters: ['Josh Allen', 'Bijan Robinson', 'Jahmyr Gibbs', 'CeeDee Lamb', 'Amon-Ra St. Brown', 'Sam LaPorta', 'Davante Adams', 'Evan McPherson', '49ers DEF'],
    starters_points: [24.8, 19.2, 16.4, 31.0, 18.2, 8.4, 11.4, 7.0, 6.0],
    players_points: { 'Christian Watson': 9.2, 'Rico Dowdle': 4.5 },
  },
  {
    matchup_id: 2,
    roster_id: 4,
    points: 138.74, // Second highest score of the entire week, but lost!
    starters: ['Lamar Jackson', 'Saquon Barkley', 'Isiah Pacheco', 'A.J. Brown', 'Garrett Wilson', 'Mark Andrews', 'Jaylen Waddle', 'Justin Tucker', 'Jets DEF'],
    starters_points: [22.1, 25.4, 14.3, 21.0, 17.5, 14.2, 11.2, 8.0, 5.04],
    players_points: { 'Jameson Williams': 16.5, 'Chase Brown': 11.2 },
  },

  // Matchup 3: Balanced showdown (119.20 vs 116.50 -> 2.70 margin)
  {
    matchup_id: 3,
    roster_id: 5,
    points: 119.20,
    starters: ['C.J. Stroud', 'James Cook', 'Kenneth Walker', 'Mike Evans', 'Deebo Samuel', 'George Kittle', 'DJ Moore', 'Cameron Dicker', 'Bills DEF'],
    starters_points: [19.8, 12.4, 15.6, 17.2, 22.1, 6.5, 11.6, 9.0, 5.0],
    players_points: { 'Jaleel McLaughlin': 7.1 },
  },
  {
    matchup_id: 3,
    roster_id: 6,
    points: 116.50,
    starters: ['Dak Prescott', 'Travis Etienne', 'Rachaad White', 'Chris Olave', 'Michael Pittman', 'Kyle Pitts', 'Tee Higgins', 'Jake Elliott', 'Cowboys DEF'],
    starters_points: [18.4, 21.2, 8.9, 16.5, 15.3, 11.2, 12.0, 6.0, 7.0],
    players_points: { 'Zack Moss': 13.8 },
  },

  // Matchup 4: Grudge match (104.30 vs 98.12)
  {
    matchup_id: 4,
    roster_id: 7,
    points: 104.30,
    starters: ['Brock Purdy', 'Josh Jacobs', 'Joe Mixon', 'DeVonta Smith', 'DK Metcalf', 'David Njoku', 'Zay Flowers', 'Younghoe Koo', 'Steelers DEF'],
    starters_points: [17.5, 14.2, 9.8, 20.4, 13.1, 7.3, 9.0, 8.0, 5.0],
    players_points: { 'Tyler Lockett': 5.2 },
  },
  {
    matchup_id: 4,
    roster_id: 8,
    points: 98.12,
    starters: ['Jordan Love', 'Alvin Kamara', 'David Montgomery', 'Cooper Kupp', 'Christian Kirk', 'Evan Engram', 'Terry McLaurin', 'Matt Gay', 'Eagles DEF'],
    starters_points: [21.4, 11.2, 10.5, 14.8, 12.0, 6.2, 8.0, 7.0, 7.02],
    players_points: { 'Jakobi Meyers': 11.4 },
  },

  // Matchup 5: Steady win (128.90 vs 108.44)
  {
    matchup_id: 5,
    roster_id: 9,
    points: 128.90,
    starters: ['Jalen Hurts', 'Jonathan Taylor', 'Derrick Henry', 'Puka Nacua', 'Marvin Harrison Jr', 'Dalton Kincaid', 'Nico Collins', 'Brandon Aubrey', 'Chiefs DEF'],
    starters_points: [23.1, 26.5, 14.8, 18.9, 16.2, 8.4, 11.0, 5.0, 5.0],
    players_points: { 'Jayden Daniels': 8.0 },
  },
  {
    matchup_id: 5,
    roster_id: 10,
    points: 108.44,
    starters: ['Baker Mayfield', 'Brian Robinson', 'Javonte Williams', 'Courtland Sutton', 'Jordan Addison', 'Cole Kmet', 'Romeo Doubs', 'Cairo Santos', 'Dolphins DEF'],
    starters_points: [16.8, 12.5, 11.4, 19.2, 15.0, 5.5, 14.0, 8.0, 6.04],
    players_points: { 'Josh Downs': 6.2 },
  },

  // Matchup 6: Nail Biter & Lowest-scoring winner (95.10 vs 93.80 -> 1.30 margin!)
  {
    matchup_id: 6,
    roster_id: 11,
    points: 95.10,
    starters: ['Tua Tagovailoa', 'D’Andre Swift', 'Tony Pollard', 'Keenan Allen', 'Amari Cooper', 'Jake Ferguson', 'George Pickens', 'Jason Sanders', 'Browns DEF'],
    starters_points: [15.2, 10.4, 8.9, 14.5, 16.2, 9.1, 7.8, 6.0, 7.0],
    players_points: { 'Rashid Shaheed': 12.1 },
  },
  {
    matchup_id: 6,
    roster_id: 12,
    points: 93.80,
    starters: ['Caleb Williams', 'Zamir White', 'Raheem Mostert', 'Calvin Ridley', 'Jaxon Smith-Njigba', 'Pat Freiermuth', 'Xavier Worthy', 'Tyler Bass', 'Texans DEF'],
    starters_points: [14.1, 11.5, 9.2, 12.8, 15.0, 7.2, 10.0, 8.0, 6.0],
    players_points: { 'Tyjae Spears': 9.5 },
  },
];

export const DEMO_CHOPPED_MATCHUPS_WEEK_1: SleeperMatchupItem[] = [
  {
    matchup_id: 0,
    roster_id: 1,
    points: 158.40, // Apex Survivor (Top score)
    starters: ['Patrick Mahomes', 'Christian McCaffrey', 'Kyren Williams', 'Justin Jefferson', 'Tyreek Hill', 'Travis Kelce', 'Breece Hall', 'Harrison Butker', 'Ravens DEF'],
    starters_points: [26.4, 24.1, 19.8, 22.3, 20.2, 16.5, 14.1, 8.0, 7.0],
    players_points: { 'DeAndre Hopkins': 11.2 },
  },
  {
    matchup_id: 0,
    roster_id: 3,
    points: 142.40,
    starters: ['Josh Allen', 'Bijan Robinson', 'Jahmyr Gibbs', 'CeeDee Lamb', 'Amon-Ra St. Brown', 'Sam LaPorta', 'Davante Adams', 'Evan McPherson', '49ers DEF'],
    starters_points: [24.1, 18.9, 16.2, 23.5, 21.0, 14.8, 11.9, 6.0, 6.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 4,
    points: 138.74,
    starters: ['Lamar Jackson', 'Saquon Barkley', 'Isiah Pacheco', 'A.J. Brown', 'Garrett Wilson', 'Mark Andrews', 'Jaylen Waddle', 'Justin Tucker', 'Jets DEF'],
    starters_points: [22.4, 21.1, 15.4, 18.2, 17.6, 13.0, 16.0, 9.0, 6.04],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 9,
    points: 128.90,
    starters: ['Jalen Hurts', 'Jonathan Taylor', 'Derrick Henry', 'Puka Nacua', 'Marvin Harrison Jr', 'Dalton Kincaid', 'Nico Collins', 'Brandon Aubrey', 'Chiefs DEF'],
    starters_points: [21.5, 19.4, 16.8, 17.2, 18.0, 12.0, 11.0, 7.0, 6.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 5,
    points: 122.60,
    starters: ['C.J. Stroud', 'James Cook', 'Kenneth Walker', 'Mike Evans', 'Deebo Samuel', 'George Kittle', 'DJ Moore', 'Cameron Dicker', 'Bills DEF'],
    starters_points: [19.2, 16.4, 15.1, 18.5, 14.2, 13.2, 12.0, 8.0, 6.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 6,
    points: 116.80,
    starters: ['Dak Prescott', 'Travis Etienne', 'Rachaad White', 'Chris Olave', 'Michael Pittman', 'Kyle Pitts', 'Tee Higgins', 'Jake Elliott', 'Cowboys DEF'],
    starters_points: [18.4, 15.2, 14.0, 16.1, 15.3, 11.2, 12.0, 7.6, 7.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 7,
    points: 108.44,
    starters: ['Brock Purdy', 'Josh Jacobs', 'Joe Mixon', 'DeVonta Smith', 'DK Metcalf', 'David Njoku', 'Zay Flowers', 'Younghoe Koo', 'Steelers DEF'],
    starters_points: [17.5, 14.2, 13.8, 15.4, 14.1, 8.3, 11.1, 8.0, 6.04],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 8,
    points: 104.30,
    starters: ['Jordan Love', 'Alvin Kamara', 'David Montgomery', 'Cooper Kupp', 'Christian Kirk', 'Evan Engram', 'Terry McLaurin', 'Matt Gay', 'Eagles DEF'],
    starters_points: [18.4, 13.2, 12.5, 14.8, 12.0, 9.2, 11.2, 6.0, 7.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 11,
    points: 98.12,
    starters: ['Tua Tagovailoa', 'D’Andre Swift', 'Tony Pollard', 'Keenan Allen', 'Amari Cooper', 'Jake Ferguson', 'George Pickens', 'Jason Sanders', 'Browns DEF'],
    starters_points: [16.4, 12.2, 10.5, 14.8, 12.0, 8.2, 11.0, 6.0, 7.02],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 12,
    points: 93.80, // Danger Zone (3rd from bottom)
    starters: ['Caleb Williams', 'Zamir White', 'Raheem Mostert', 'Calvin Ridley', 'Jaxon Smith-Njigba', 'Pat Freiermuth', 'Xavier Worthy', 'Tyler Bass', 'Texans DEF'],
    starters_points: [14.1, 11.5, 9.2, 12.8, 15.0, 7.2, 10.0, 8.0, 6.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 10,
    points: 79.80, // Narrow Escape (Survives by 7.50 pts!)
    starters: ['Baker Mayfield', 'Brian Robinson', 'Javonte Williams', 'Courtland Sutton', 'Jordan Addison', 'Cole Kmet', 'Romeo Doubs', 'Cairo Santos', 'Dolphins DEF'],
    starters_points: [14.8, 9.5, 8.4, 11.2, 10.0, 5.5, 8.4, 6.0, 6.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 2,
    points: 72.30, // 🪓 CHOPPED & ELIMINATED! Lowest score of the week
    starters: ['Anthony Richardson', 'Devin Singletary', 'Jerome Ford', 'Diontae Johnson', 'Hollywood Brown', 'Dalton Schultz', 'Gabe Davis', 'Greg Zuerlein', 'Patriots DEF'],
    starters_points: [12.1, 8.4, 7.2, 9.3, 8.1, 6.2, 8.0, 8.0, 5.0],
    players_points: { 'Nick Chubb': 0 },
  },
];

export const DEMO_MATCHUPS_WEEK_2: SleeperMatchupItem[] = [
  // Matchup 1: Heavyweight Clash (161.80 vs 121.20 -> 40.60 pt margin)
  {
    matchup_id: 1,
    roster_id: 3,
    points: 161.80,
    starters: ['Josh Allen', 'Bijan Robinson', 'Jahmyr Gibbs', 'CeeDee Lamb', 'Amon-Ra St. Brown', 'Sam LaPorta', 'Davante Adams', 'Evan McPherson', '49ers DEF'],
    starters_points: [31.4, 21.2, 18.5, 29.8, 22.1, 14.8, 11.0, 7.0, 6.0],
    players_points: { 'Christian Watson': 12.4 },
  },
  {
    matchup_id: 1,
    roster_id: 1,
    points: 121.20,
    starters: ['Patrick Mahomes', 'Christian McCaffrey', 'Kyren Williams', 'Justin Jefferson', 'Tyreek Hill', 'Travis Kelce', 'Breece Hall', 'Harrison Butker', 'Ravens DEF'],
    starters_points: [19.2, 18.5, 14.2, 21.0, 16.4, 11.0, 12.9, 5.0, 3.0],
    players_points: { 'Khalil Shakir': 13.5 },
  },

  // Matchup 2: High scoring shootout & Highest-Scoring Loser (146.50 vs 141.20 -> 5.30 pt thriller!)
  {
    matchup_id: 2,
    roster_id: 4,
    points: 146.50,
    starters: ['Lamar Jackson', 'Saquon Barkley', 'Isiah Pacheco', 'A.J. Brown', 'Garrett Wilson', 'Mark Andrews', 'Jaylen Waddle', 'Justin Tucker', 'Jets DEF'],
    starters_points: [25.4, 31.2, 14.8, 20.1, 18.2, 12.4, 11.4, 8.0, 5.0],
    players_points: { 'Jameson Williams': 14.2 },
  },
  {
    matchup_id: 2,
    roster_id: 9,
    points: 141.20, // Second highest score of the week, but lost in a heartbreaker!
    starters: ['Jalen Hurts', 'Jonathan Taylor', 'Derrick Henry', 'Puka Nacua', 'Marvin Harrison Jr', 'Dalton Kincaid', 'Nico Collins', 'Brandon Aubrey', 'Chiefs DEF'],
    starters_points: [24.1, 22.8, 19.4, 18.5, 21.2, 11.2, 12.0, 6.0, 6.0],
    players_points: { 'Jayden Daniels': 15.0 },
  },

  // Matchup 3: Sarah Connor bounce-back win (128.40 vs 106.80)
  {
    matchup_id: 3,
    roster_id: 2,
    points: 128.40,
    starters: ['Anthony Richardson', 'Brian Thomas Jr', 'Jerome Ford', 'Diontae Johnson', 'Hollywood Brown', 'Dalton Schultz', 'Rome Odunze', 'Greg Zuerlein', 'Patriots DEF'],
    starters_points: [22.4, 24.1, 15.2, 18.4, 14.2, 9.1, 13.0, 7.0, 5.0],
    players_points: { 'Devin Singletary': 8.2 },
  },
  {
    matchup_id: 3,
    roster_id: 7,
    points: 106.80,
    starters: ['Brock Purdy', 'Josh Jacobs', 'Joe Mixon', 'DeVonta Smith', 'DK Metcalf', 'David Njoku', 'Zay Flowers', 'Younghoe Koo', 'Steelers DEF'],
    starters_points: [16.8, 14.5, 12.2, 18.4, 15.1, 8.4, 9.4, 6.0, 6.0],
    players_points: {},
  },

  // Matchup 4: Nail-biter! Decided by 1.50 points (118.90 vs 117.40)
  {
    matchup_id: 4,
    roster_id: 6,
    points: 118.90,
    starters: ['Dak Prescott', 'Travis Etienne', 'Rachaad White', 'Chris Olave', 'Michael Pittman', 'Kyle Pitts', 'Tee Higgins', 'Jake Elliott', 'Cowboys DEF'],
    starters_points: [19.2, 18.4, 11.2, 17.5, 16.1, 10.5, 12.0, 7.0, 7.0],
    players_points: { 'Zack Moss': 11.2 },
  },
  {
    matchup_id: 4,
    roster_id: 5,
    points: 117.40,
    starters: ['C.J. Stroud', 'James Cook', 'Kenneth Walker', 'Mike Evans', 'Deebo Samuel', 'George Kittle', 'DJ Moore', 'Cameron Dicker', 'Bills DEF'],
    starters_points: [18.2, 15.4, 16.2, 19.1, 15.0, 11.5, 11.0, 6.0, 5.0],
    players_points: {},
  },

  // Matchup 5: Biggest Blowout of Week 2! (132.60 vs 84.10 -> 48.50 pt margin!)
  {
    matchup_id: 5,
    roster_id: 8,
    points: 132.60,
    starters: ['Jordan Love', 'Alvin Kamara', 'David Montgomery', 'Cooper Kupp', 'Christian Kirk', 'Evan Engram', 'Terry McLaurin', 'Matt Gay', 'Eagles DEF'],
    starters_points: [24.5, 26.2, 14.8, 22.1, 12.5, 10.5, 11.0, 5.0, 6.0],
    players_points: { 'Jakobi Meyers': 8.0 },
  },
  {
    matchup_id: 5,
    roster_id: 12,
    points: 84.10, // Bonehead low score of the week
    starters: ['Caleb Williams', 'Zamir White', 'Raheem Mostert', 'Calvin Ridley', 'Jaxon Smith-Njigba', 'Pat Freiermuth', 'Xavier Worthy', 'Tyler Bass', 'Texans DEF'],
    starters_points: [11.2, 6.4, 7.1, 10.2, 12.5, 8.2, 14.5, 8.0, 6.0],
    players_points: { 'Tyjae Spears': 16.2 }, // Left 16.2 on the bench!
  },

  // Matchup 6: Division battle (108.20 vs 96.40)
  {
    matchup_id: 6,
    roster_id: 10,
    points: 108.20,
    starters: ['Baker Mayfield', 'Brian Robinson', 'Javonte Williams', 'Courtland Sutton', 'Jordan Addison', 'Cole Kmet', 'Romeo Doubs', 'Cairo Santos', 'Dolphins DEF'],
    starters_points: [18.4, 15.2, 12.1, 16.5, 14.0, 7.0, 11.0, 8.0, 6.0],
    players_points: {},
  },
  {
    matchup_id: 6,
    roster_id: 11,
    points: 96.40,
    starters: ['Tua Tagovailoa', 'D’Andre Swift', 'Tony Pollard', 'Keenan Allen', 'Amari Cooper', 'Jake Ferguson', 'George Pickens', 'Jason Sanders', 'Browns DEF'],
    starters_points: [15.1, 11.2, 9.8, 13.5, 15.0, 8.8, 10.0, 6.0, 7.0],
    players_points: {},
  },
];

export const DEMO_CHOPPED_MATCHUPS_WEEK_2: SleeperMatchupItem[] = [
  {
    matchup_id: 0,
    roster_id: 3,
    points: 161.80, // Apex Survivor (Top score of Week 2)
    starters: ['Josh Allen', 'Bijan Robinson', 'Jahmyr Gibbs', 'CeeDee Lamb', 'Amon-Ra St. Brown', 'Sam LaPorta', 'Davante Adams', 'Evan McPherson', '49ers DEF'],
    starters_points: [31.4, 21.2, 18.5, 29.8, 22.1, 14.8, 11.0, 7.0, 6.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 4,
    points: 146.50,
    starters: ['Lamar Jackson', 'Saquon Barkley', 'Isiah Pacheco', 'A.J. Brown', 'Garrett Wilson', 'Mark Andrews', 'Jaylen Waddle', 'Justin Tucker', 'Jets DEF'],
    starters_points: [25.4, 31.2, 14.8, 20.1, 18.2, 12.4, 11.4, 8.0, 5.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 9,
    points: 141.20,
    starters: ['Jalen Hurts', 'Jonathan Taylor', 'Derrick Henry', 'Puka Nacua', 'Marvin Harrison Jr', 'Dalton Kincaid', 'Nico Collins', 'Brandon Aubrey', 'Chiefs DEF'],
    starters_points: [24.1, 22.8, 19.4, 18.5, 21.2, 11.2, 12.0, 6.0, 6.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 8,
    points: 132.60,
    starters: ['Jordan Love', 'Alvin Kamara', 'David Montgomery', 'Cooper Kupp', 'Christian Kirk', 'Evan Engram', 'Terry McLaurin', 'Matt Gay', 'Eagles DEF'],
    starters_points: [24.5, 26.2, 14.8, 22.1, 12.5, 10.5, 11.0, 5.0, 6.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 1,
    points: 121.20,
    starters: ['Patrick Mahomes', 'Christian McCaffrey', 'Kyren Williams', 'Justin Jefferson', 'Tyreek Hill', 'Travis Kelce', 'Breece Hall', 'Harrison Butker', 'Ravens DEF'],
    starters_points: [19.2, 18.5, 14.2, 21.0, 16.4, 11.0, 12.9, 5.0, 3.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 6,
    points: 118.90,
    starters: ['Dak Prescott', 'Travis Etienne', 'Rachaad White', 'Chris Olave', 'Michael Pittman', 'Kyle Pitts', 'Tee Higgins', 'Jake Elliott', 'Cowboys DEF'],
    starters_points: [19.2, 18.4, 11.2, 17.5, 16.1, 10.5, 12.0, 7.0, 7.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 5,
    points: 117.40,
    starters: ['C.J. Stroud', 'James Cook', 'Kenneth Walker', 'Mike Evans', 'Deebo Samuel', 'George Kittle', 'DJ Moore', 'Cameron Dicker', 'Bills DEF'],
    starters_points: [18.2, 15.4, 16.2, 19.1, 15.0, 11.5, 11.0, 6.0, 5.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 10,
    points: 108.20,
    starters: ['Baker Mayfield', 'Brian Robinson', 'Javonte Williams', 'Courtland Sutton', 'Jordan Addison', 'Cole Kmet', 'Romeo Doubs', 'Cairo Santos', 'Dolphins DEF'],
    starters_points: [18.4, 15.2, 12.1, 16.5, 14.0, 7.0, 11.0, 8.0, 6.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 7,
    points: 106.80,
    starters: ['Brock Purdy', 'Josh Jacobs', 'Joe Mixon', 'DeVonta Smith', 'DK Metcalf', 'David Njoku', 'Zay Flowers', 'Younghoe Koo', 'Steelers DEF'],
    starters_points: [16.8, 14.5, 12.2, 18.4, 15.1, 8.4, 9.4, 6.0, 6.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 11,
    points: 96.40, // Narrow Escape (Survives cut by 12.3 pts!)
    starters: ['Tua Tagovailoa', 'D’Andre Swift', 'Tony Pollard', 'Keenan Allen', 'Amari Cooper', 'Jake Ferguson', 'George Pickens', 'Jason Sanders', 'Browns DEF'],
    starters_points: [15.1, 11.2, 9.8, 13.5, 15.0, 8.8, 10.0, 6.0, 7.0],
    players_points: {},
  },
  {
    matchup_id: 0,
    roster_id: 12,
    points: 84.10, // 🪓 CHOPPED IN WEEK 2! Roster dumped to waiver wire
    starters: ['Caleb Williams', 'Zamir White', 'Raheem Mostert', 'Calvin Ridley', 'Jaxon Smith-Njigba', 'Pat Freiermuth', 'Xavier Worthy', 'Tyler Bass', 'Texans DEF'],
    starters_points: [11.2, 6.4, 7.1, 10.2, 12.5, 8.2, 14.5, 8.0, 6.0],
    players_points: { 'Tyjae Spears': 16.2 },
  },
];

