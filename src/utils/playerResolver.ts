import { CompactPlayer } from '../types';
import { SLEEPER_PLAYERS_MAP } from '../data/sleeperPlayers';

export const NFL_DEFENSES: Record<string, { name: string; team: string }> = {
  ARI: { name: 'Arizona Cardinals', team: 'ARI' },
  ATL: { name: 'Atlanta Falcons', team: 'ATL' },
  BAL: { name: 'Baltimore Ravens', team: 'BAL' },
  BUF: { name: 'Buffalo Bills', team: 'BUF' },
  CAR: { name: 'Carolina Panthers', team: 'CAR' },
  CHI: { name: 'Chicago Bears', team: 'CHI' },
  CIN: { name: 'Cincinnati Bengals', team: 'CIN' },
  CLE: { name: 'Cleveland Browns', team: 'CLE' },
  DAL: { name: 'Dallas Cowboys', team: 'DAL' },
  DEN: { name: 'Denver Broncos', team: 'DEN' },
  DET: { name: 'Detroit Lions', team: 'DET' },
  GB: { name: 'Green Bay Packers', team: 'GB' },
  HOU: { name: 'Houston Texans', team: 'HOU' },
  IND: { name: 'Indianapolis Colts', team: 'IND' },
  JAX: { name: 'Jacksonville Jaguars', team: 'JAX' },
  KC: { name: 'Kansas City Chiefs', team: 'KC' },
  LAC: { name: 'Los Angeles Chargers', team: 'LAC' },
  LAR: { name: 'Los Angeles Rams', team: 'LAR' },
  LV: { name: 'Las Vegas Raiders', team: 'LV' },
  MIA: { name: 'Miami Dolphins', team: 'MIA' },
  MIN: { name: 'Minnesota Vikings', team: 'MIN' },
  NE: { name: 'New England Patriots', team: 'NE' },
  NO: { name: 'New Orleans Saints', team: 'NO' },
  NYG: { name: 'New York Giants', team: 'NYG' },
  NYJ: { name: 'New York Jets', team: 'NYJ' },
  PHI: { name: 'Philadelphia Eagles', team: 'PHI' },
  PIT: { name: 'Pittsburgh Steelers', team: 'PIT' },
  SEA: { name: 'Seattle Seahawks', team: 'SEA' },
  SF: { name: 'San Francisco 49ers', team: 'SF' },
  TB: { name: 'Tampa Bay Buccaneers', team: 'TB' },
  TEN: { name: 'Tennessee Titans', team: 'TEN' },
  WAS: { name: 'Washington Commanders', team: 'WAS' },
};

/**
 * Resolves a raw Sleeper player ID (e.g. '4034', '8112', 'SF') into a clean, human-readable player info.
 */
export function resolvePlayer(
  id: string,
  playerMap?: Record<string, CompactPlayer>
): CompactPlayer {
  if (!id || id === '0') {
    return { id: '', name: 'Empty Slot' };
  }

  // 1. Check passed-in playerMap if it has a valid, non-generic name
  if (playerMap && playerMap[id]) {
    const p = playerMap[id];
    const isGeneric = !p.name || p.name.startsWith('Player #') || /^\d+$/.test(p.name);
    if (!isGeneric) {
      return {
        id,
        name: p.name,
        pos: p.pos || '',
        team: p.team || '',
      };
    }
  }

  // 2. Check the comprehensive built-in active NFL players database
  if (SLEEPER_PLAYERS_MAP[id]) {
    const p = SLEEPER_PLAYERS_MAP[id];
    return {
      id,
      name: p.name,
      pos: p.pos || '',
      team: p.team || '',
    };
  }

  // 3. Check if it's an NFL Defense abbreviation (e.g. 'SF', 'BAL')
  const upper = id.toUpperCase();
  if (NFL_DEFENSES[upper]) {
    const def = NFL_DEFENSES[upper];
    return {
      id,
      name: def.name,
      pos: 'DEF',
      team: def.team,
    };
  }

  // 4. Check if it's already a full human-readable player name (e.g. from demo data or custom leagues)
  // If it contains letters/spaces and isn't just digits
  const isNumericOnly = /^\d+$/.test(id);
  if (!isNumericOnly) {
    return {
      id,
      name: id,
    };
  }

  // 5. If in playerMap with any fallback data
  if (playerMap && playerMap[id]) {
    const p = playerMap[id];
    return {
      id,
      name: p.name || id,
      pos: p.pos || '',
      team: p.team || '',
    };
  }

  // 6. Fallback for unmapped numeric ID
  return {
    id,
    name: `Player #${id}`,
  };
}

/**
 * Formats a player object for clean display with position and team.
 * e.g. "Christian McCaffrey (RB - SF)" or "Christian McCaffrey"
 */
export function formatPlayerDisplayName(
  player: CompactPlayer,
  includePosition: boolean = true
): string {
  if (!player || !player.name) return 'Empty Slot';

  let name = player.name;
  let pos = player.pos;
  let team = player.team;

  // If the player name is currently a generic placeholder like "Player #4034" or raw digits "4034",
  // check if our SLEEPER_PLAYERS_MAP database knows the real name
  if ((/^\d+$/.test(name) || name.startsWith('Player #')) && player.id) {
    if (SLEEPER_PLAYERS_MAP[player.id]) {
      const known = SLEEPER_PLAYERS_MAP[player.id];
      name = known.name;
      pos = pos || known.pos;
      team = team || known.team;
    }
  }

  if (!includePosition || !pos) return name;

  if (team && pos !== 'DEF') {
    return `${name} (${pos} - ${team})`;
  }
  return `${name} (${pos})`;
}

/**
 * Client-side helper to fetch player names from backend batch endpoint.
 */
export async function fetchPlayersBatch(
  playerIds: string[]
): Promise<Record<string, CompactPlayer>> {
  const numericIds = playerIds.filter((id) => /^\d+$/.test(id));
  if (numericIds.length === 0) return {};

  try {
    const res = await fetch(`/api/sleeper/players/batch?ids=${numericIds.join(',')}`);
    if (!res.ok) return {};
    const data = await res.json();
    return data.players || {};
  } catch (err) {
    console.warn('Failed to batch fetch players:', err);
    return {};
  }
}
