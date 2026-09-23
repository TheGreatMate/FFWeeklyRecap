import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy init for Gemini
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(customKey?: string): GoogleGenAI | null {
  const effectiveKey = (customKey && typeof customKey === 'string' && customKey.trim()) || process.env.GEMINI_API_KEY;
  if (!effectiveKey) return null;

  if (customKey && typeof customKey === 'string' && customKey.trim()) {
    return new GoogleGenAI({
      apiKey: customKey.trim(),
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
  });
});

// Verify a user-provided Gemini API key
app.post('/api/gemini/verify-key', async (req, res) => {
  try {
    const rawKey = req.body.apiKey || (req.headers['x-gemini-api-key'] as string);
    if (!rawKey || typeof rawKey !== 'string' || !rawKey.trim()) {
      return res.status(400).json({ valid: false, error: 'No API key provided.' });
    }
    const testKey = rawKey.trim();
    const testAi = new GoogleGenAI({
      apiKey: testKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    const response = await testAi.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Respond only with: OK',
    });
    if (response && response.text) {
      return res.json({ valid: true });
    }
    return res.status(400).json({ valid: false, error: 'Empty response from model' });
  } catch (err: any) {
    console.warn('API key verification failed:', err.message);
    let errorMsg = 'Invalid Gemini API key. Please check your key from Google AI Studio.';
    if (err.message) {
      try {
        const parsed = JSON.parse(err.message);
        if (parsed.error && parsed.error.message) {
          errorMsg = parsed.error.message;
        }
      } catch {
        errorMsg = err.message;
      }
    }
    return res.status(400).json({
      valid: false,
      error: errorMsg,
    });
  }
});

// Sleeper API proxy routes
app.get('/api/sleeper/state', async (req, res) => {
  try {
    const sleeperRes = await fetch('https://api.sleeper.app/v1/state/nfl');
    if (!sleeperRes.ok) {
      return res.status(sleeperRes.status).json({ error: `Sleeper state fetch failed: ${sleeperRes.statusText}` });
    }
    const data = await sleeperRes.json();
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Sleeper NFL state:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/sleeper/user/:username', async (req, res) => {
  try {
    const username = encodeURIComponent(req.params.username.trim());
    const sleeperRes = await fetch(`https://api.sleeper.app/v1/user/${username}`);
    if (!sleeperRes.ok) {
      return res.status(sleeperRes.status).json({ error: `Sleeper user fetch failed: ${sleeperRes.statusText}` });
    }
    const data = await sleeperRes.json();
    if (!data || !data.user_id) {
      return res.status(404).json({ error: 'User not found on Sleeper' });
    }
    res.json(data);
  } catch (error: any) {
    console.error('Error fetching Sleeper user:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/sleeper/user/:userId/leagues/:season', async (req, res) => {
  try {
    const { userId, season } = req.params;
    const sleeperRes = await fetch(`https://api.sleeper.app/v1/user/${userId}/leagues/nfl/${season}`);
    if (!sleeperRes.ok) {
      return res.status(sleeperRes.status).json({ error: `Sleeper leagues fetch failed: ${sleeperRes.statusText}` });
    }
    const data = await sleeperRes.json();
    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching Sleeper leagues:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/sleeper/league/:leagueId', async (req, res) => {
  try {
    const { leagueId } = req.params;
    const sleeperRes = await fetch(`https://api.sleeper.app/v1/league/${leagueId}`);
    if (!sleeperRes.ok) {
      return res.status(sleeperRes.status).json({ error: `Sleeper league fetch failed: ${sleeperRes.statusText}` });
    }
    const data = await sleeperRes.json();
    res.json(data || null);
  } catch (error: any) {
    console.error('Error fetching Sleeper league:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

// Convert images to Base64 data URLs server-side to guarantee 100% fidelity in PDF export
app.post('/api/convert-images-base64', async (req, res) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls)) {
      return res.status(400).json({ error: 'urls must be an array' });
    }

    const results: Record<string, string> = {};

    await Promise.all(
      urls.map(async (url) => {
        if (!url || typeof url !== 'string') return;
        if (url.startsWith('data:image/')) {
          results[url] = url;
          return;
        }
        try {
          const imgRes = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'image/*,*/*',
            },
          });
          if (!imgRes.ok) return;
          const contentType = imgRes.headers.get('content-type') || 'image/png';
          const buffer = Buffer.from(await imgRes.arrayBuffer());
          results[url] = `data:${contentType};base64,${buffer.toString('base64')}`;
        } catch (err) {
          console.warn('Failed to convert image server-side:', url, err);
        }
      })
    );

    res.json({ dataUrls: results });
  } catch (err: any) {
    console.error('Error in /api/convert-images-base64:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Proxy single image with universal CORS for canvas rendering
app.get('/api/proxy-image', async (req, res) => {
  const imageUrl = req.query.url as string;
  if (!imageUrl) return res.status(400).send('Missing url parameter');
  try {
    const imgRes = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/*,*/*',
      },
    });
    if (!imgRes.ok) return res.status(imgRes.status).send('Failed to fetch image');
    const contentType = imgRes.headers.get('content-type') || 'image/png';
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    res.setHeader('Content-Type', contentType);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
  } catch (err: any) {
    res.status(500).send(err.message || 'Proxy error');
  }
});

// Sleeper Player Cache & Resolution Service
interface CompactPlayer {
  id: string;
  name: string;
  pos?: string;
  team?: string;
  searchRank?: number;
  points?: number;
}

import { SLEEPER_PLAYERS_MAP } from './src/data/sleeperPlayers';

// Persistent data lives in DATA_DIR, then the Docker /config volume (only if it already exists,
// so local dev doesn't create one), then the OS temp dir, whichever is first writable. An Unraid
// appdata folder owned by root isn't writable by the container's non-root user, so we fall back
// rather than fail.
function resolveDataDir(): string {
  const candidates = [
    process.env.DATA_DIR,
    fs.existsSync('/config') ? '/config' : undefined,
    os.tmpdir(),
  ].filter(Boolean) as string[];
  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch {
      console.warn(`Data directory ${dir} is not writable, trying next option`);
    }
  }
  return os.tmpdir();
}

const DATA_DIR = resolveDataDir();
const PLAYERS_CACHE_FILE = path.join(DATA_DIR, 'sleeper_players_compact.json');
const PLAYERS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PLAYERS_RETRY_AFTER_FAILURE_MS = 15 * 60 * 1000;
console.log(`Player cache file: ${PLAYERS_CACHE_FILE}`);

// The bundled snapshot is only a fallback until the live dictionary loads from disk or Sleeper.
let playersCache: Record<string, CompactPlayer> = { ...SLEEPER_PLAYERS_MAP };
let playersCacheExpiresAt = 0;
let playersCacheFetchPromise: Promise<Record<string, CompactPlayer>> | null = null;

const NFL_DEFENSES: Record<string, { name: string; team: string }> = {
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

async function getSleeperPlayers(): Promise<Record<string, CompactPlayer>> {
  if (Date.now() < playersCacheExpiresAt) {
    return playersCache;
  }

  if (playersCacheFetchPromise) {
    return playersCacheFetchPromise;
  }

  playersCacheFetchPromise = (async () => {
    try {
      // 1. Check local disk cache if exists and fresh (<24h)
      if (fs.existsSync(PLAYERS_CACHE_FILE)) {
        try {
          const fileStats = fs.statSync(PLAYERS_CACHE_FILE);
          if (Date.now() - fileStats.mtimeMs < PLAYERS_CACHE_TTL_MS) {
            const fromDisk = JSON.parse(fs.readFileSync(PLAYERS_CACHE_FILE, 'utf8'));
            if (fromDisk && Object.keys(fromDisk).length > 1000) {
              playersCache = fromDisk;
              playersCacheExpiresAt = fileStats.mtimeMs + PLAYERS_CACHE_TTL_MS;
              return playersCache;
            }
          }
        } catch (e) {
          console.warn('Error reading player cache file:', e);
        }
      }

      // 2. Fetch fresh from Sleeper API
      console.log('Fetching Sleeper NFL players dictionary...');
      const res = await fetch('https://api.sleeper.app/v1/players/nfl');
      if (!res.ok) {
        throw new Error(`Failed to fetch players: ${res.statusText}`);
      }
      const rawPlayers = await res.json();
      const compact: Record<string, CompactPlayer> = {};

      for (const [id, p] of Object.entries(rawPlayers as Record<string, any>)) {
        if (!p) continue;
        const fullName =
          p.full_name ||
          `${p.first_name || ''} ${p.last_name || ''}`.trim() ||
          id;
        compact[id] = {
          id,
          name: fullName,
          pos: p.position || '',
          team: p.team || '',
          searchRank: typeof p.search_rank === 'number' && p.search_rank > 0 ? p.search_rank : 99999,
        };
      }

      playersCache = compact;
      playersCacheExpiresAt = Date.now() + PLAYERS_CACHE_TTL_MS;

      // Persist to disk asynchronously
      fs.writeFile(PLAYERS_CACHE_FILE, JSON.stringify(compact), (err) => {
        if (err) console.warn('Failed to cache players to disk:', err);
      });

      return playersCache;
    } catch (err) {
      console.error('Failed to load Sleeper players:', err);
      // Keep serving the bundled/stale dictionary, but don't hit Sleeper on every request
      playersCacheExpiresAt = Date.now() + PLAYERS_RETRY_AFTER_FAILURE_MS;
      return playersCache || {};
    } finally {
      playersCacheFetchPromise = null;
    }
  })();

  return playersCacheFetchPromise;
}

function resolvePlayerId(id: string, cache: Record<string, CompactPlayer>): CompactPlayer {
  if (!id || id === '0') {
    return { id: '', name: 'Empty Slot' };
  }

  // 1. Check cache for valid non-generic name
  if (cache[id]) {
    const p = cache[id];
    const isGeneric = !p.name || p.name.startsWith('Player #') || /^\d+$/.test(p.name);
    if (!isGeneric) {
      return p;
    }
  }

  // 2. Check bundled active NFL players database
  if (SLEEPER_PLAYERS_MAP[id]) {
    return SLEEPER_PLAYERS_MAP[id];
  }

  // 3. Check NFL defenses
  const upper = id.toUpperCase();
  if (NFL_DEFENSES[upper]) {
    return {
      id,
      name: NFL_DEFENSES[upper].name,
      pos: 'DEF',
      team: NFL_DEFENSES[upper].team,
      searchRank: 400,
    };
  }

  // 4. Check if already a human-readable name (not purely digits)
  if (!/^\d+$/.test(id)) {
    return {
      id,
      name: id,
    };
  }

  // 5. Check cache fallback
  if (cache[id]) return cache[id];

  return {
    id,
    name: `Player #${id}`,
  };
}

// Pre-warm the players cache in background
getSleeperPlayers().catch((err) => console.warn('Pre-warming players cache notice:', err.message));

// Batch player lookup endpoint
app.get('/api/sleeper/players/batch', async (req, res) => {
  try {
    const idsParam = (req.query.ids as string) || '';
    const ids = idsParam.split(',').map((s) => s.trim()).filter(Boolean);
    const playersDict = await getSleeperPlayers();
    const result: Record<string, CompactPlayer> = {};
    ids.forEach((id) => {
      result[id] = resolvePlayerId(id, playersDict);
    });
    res.json({ players: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch players batch' });
  }
});

app.get('/api/sleeper/league/:leagueId/matchups/:week', async (req, res) => {
  try {
    const { leagueId, week } = req.params;
    const sleeperRes = await fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`);
    if (!sleeperRes.ok) {
      return res.status(sleeperRes.status).json({ error: `Sleeper matchups fetch failed: ${sleeperRes.statusText}` });
    }
    const data = await sleeperRes.json();
    res.json(data || []);
  } catch (error: any) {
    console.error('Error fetching Sleeper matchups:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/api/sleeper/league/:leagueId/details/:week', async (req, res) => {
  try {
    const { leagueId, week } = req.params;
    const currentWeekNum = parseInt(week, 10) || 1;

    const [leagueRes, rostersRes, usersRes, matchupsRes] = await Promise.all([
      fetch(`https://api.sleeper.app/v1/league/${leagueId}`),
      fetch(`https://api.sleeper.app/v1/league/${leagueId}/rosters`),
      fetch(`https://api.sleeper.app/v1/league/${leagueId}/users`),
      fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${week}`),
    ]);

    const league = leagueRes.ok ? await leagueRes.json() : null;
    const rosters = rostersRes.ok ? await rostersRes.json() : [];
    const users = usersRes.ok ? await usersRes.json() : [];
    const matchups = matchupsRes.ok ? await matchupsRes.json() : [];

    // Concurrently fetch prior week matchups for chronological elimination tracking in Guillotine leagues
    const priorMatchups: Record<number, any[]> = {};
    if (currentWeekNum > 1 && currentWeekNum <= 18) {
      const priorPromises = [];
      for (let w = 1; w < currentWeekNum; w++) {
        const weekIdx = w;
        priorPromises.push(
          fetch(`https://api.sleeper.app/v1/league/${leagueId}/matchups/${weekIdx}`)
            .then(async (r) => {
              if (r.ok) {
                priorMatchups[weekIdx] = await r.json();
              }
            })
            .catch(() => {})
        );
      }
      await Promise.all(priorPromises);
    }

    // Collect all unique player IDs present in matchups and rosters
    const playerIds = new Set<string>();
    matchups.forEach((m: any) => {
      (m.starters || []).forEach((id: string) => playerIds.add(String(id)));
      (m.players || []).forEach((id: string) => playerIds.add(String(id)));
      if (m.players_points) {
        Object.keys(m.players_points).forEach((id) => playerIds.add(String(id)));
      }
    });
    rosters.forEach((r: any) => {
      (r.starters || []).forEach((id: string) => playerIds.add(String(id)));
      (r.players || []).forEach((id: string) => playerIds.add(String(id)));
    });

    const playersDict = await getSleeperPlayers();
    const resolvedPlayers: Record<string, CompactPlayer> = {};
    playerIds.forEach((id) => {
      resolvedPlayers[id] = resolvePlayerId(id, playersDict);
    });

    res.json({
      league,
      rosters,
      users,
      matchups,
      priorMatchups,
      players: resolvedPlayers,
    });
  } catch (error: any) {
    console.error('Error fetching league details:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch league data' });
  }
});

// Gemini AI Commissioner Notes Generator
app.post('/api/gemini/generate-notes', async (req, res) => {
  try {
    const {
      leagueName,
      week = 1,
      format = 'head_to_head',
      stats,
      choppedStats,
      tone = 'roast',
      announcements = '',
      duesNote = '',
      includePowerRankings = true,
      includeWaiverAdvice = true,
      customApiKey,
      sidePotConfig,
    } = req.body;

    const isChopped = format === 'chopped' || !!choppedStats;
    const isSidePotEnabled = Boolean(sidePotConfig?.enabled);
    const providedKey = (req.headers['x-gemini-api-key'] as string) || customApiKey;
    const ai = getGeminiClient(providedKey);

    // Tone descriptions
    let tonePromptDescription = '';
    switch (tone) {
      case 'grim_reaper':
        tonePromptDescription = 'The Grim Reaper / Executioner. Darkly hilarious, solemn funeral eulogy for the eliminated team. Treat the chopped manager with mock gravitas and ceremony, announcing the purge of their roster onto the waiver wire.';
        break;
      case 'hunger_games':
        tonePromptDescription = 'Hunger Games Announcer / Caesar Flickerman. High theatrical drama: "May the fantasy odds be ever in your favor!" Announce the fallen tribute with cannon-fire drama, and praise the surviving apex predators.';
        break;
      case 'roast':
        tonePromptDescription = isChopped
          ? 'Savage, hilarious trash-talk and roasts. Mock the chopped manager for getting sliced by the guillotine, roast the close-call bubble survivor, and tease the other managers eager to scavenge their dropped players.'
          : 'Savage, humorous, hilarious trash-talk and roasts. Poke fun at the biggest blowout loser, the lowest scorer, and bad roster choices. Keep it friendly and entertaining like good buddies in a high-stakes league.';
        break;
      case 'espn':
        tonePromptDescription = isChopped
          ? 'Professional sports broadcast style covering an elimination tournament. Breaking down how the bottom team fell below the cut line, who had a clutch fourth-quarter escape, and analyzing the waiver wire goldrush.'
          : 'Professional, dramatic sports broadcast style like an ESPN SportsCenter anchor (Scott Van Pelt / Rich Eisen style). Highlighting tactical roster decisions, clutch performances, statistical anomalies, and momentum shifts.';
        break;
      case 'commish':
        tonePromptDescription = 'Authoritative, charismatic, benevolent commissioner tone. Blends league business announcements with enthusiastic commentary, keeping the league active, competitive, and respectful.';
        break;
      case 'hype':
        tonePromptDescription = 'Extreme hype, high energy, exclamation points, epic gladiatorial battle metaphors, electrifying fanfare for the winners and devastating heartbreak for the fallen!';
        break;
      case 'conspiracy':
        tonePromptDescription = 'Humorous fantasy conspiracy theorist who believes the Sleeper algorithm and RNG gods are secretly fixing matches, investigating why unexpected anomalies occurred.';
        break;
      default:
        tonePromptDescription = 'Engaging, fun, and comprehensive fantasy football commissioner recap.';
    }

    let prompt = '';

    if (isChopped && choppedStats) {
      const c = choppedStats;
      const topChoppedStars =
        (c.topRankedChoppedPlayers && c.topRankedChoppedPlayers.length > 0
          ? c.topRankedChoppedPlayers
          : c.choppedTeam?.topRankedPlayers && c.choppedTeam.topRankedPlayers.length > 0
          ? c.choppedTeam.topRankedPlayers
          : c.choppedRosterDetails?.slice(0, 3) || []
        )
          .map((p: any) => `${p.name}${p.pos ? ` (${p.pos})` : ''}`)
          .filter(Boolean)
          .join(', ') || 'their premier starters';

      prompt = `
You are the Commissioner of the Guillotine / Chopped Fantasy Football League "${leagueName}".
In this league format, there are NO WEEKLY HEAD-TO-HEAD MATCHUPS. All teams compete against the entire league each week.
The lowest-scoring team each week is CHOPPED (eliminated from the league forever), and all players on their roster are released onto the waiver wire for a blind FAAB bidding frenzy!
The highest-scoring team is the APEX SURVIVOR (immune / league leader).

Write the official Week ${week} Execution Gazette Report & Commissioner Notes for the league members.

TONE GUIDELINES:
${tonePromptDescription}

KEY SURVIVAL DATA FOR WEEK ${week}:
- League Name: ${leagueName}
- Week: ${week}
- Total Managers: ${c.totalTeams}
- 🪓 THE CHOPPED & ELIMINATED TEAM (Lowest Score): ${c.choppedTeam?.teamName} (${c.choppedTeam?.ownerName}) with only ${c.choppedTeam?.points} pts! (They have been eliminated from the season!).
- 💰 TOP-RANKED STAR PLAYERS ON CHOPPED ROSTER SURRENDERED TO WAIVERS: ${topChoppedStars} (feature these exact top-ranked stars in the story and waiver notes!)
- 👑 APEX SURVIVOR (Highest Score / Immunity): ${c.apexSurvivor?.teamName} (${c.apexSurvivor?.ownerName}) with ${c.apexSurvivor?.points} pts!
- 🩸 NARROW ESCAPE (Close Shave / Bubble Survivor): ${c.narrowEscape?.team?.teamName} (${c.narrowEscape?.team?.points} pts) who survived the blade by merely +${c.narrowEscape?.marginOverChopped} pts over the chopped team!
- ⚠️ CHOPPING BLOCK / DANGER ZONE (Bottom survivors): ${c.dangerZone?.map((t: any) => `${t.teamName} (${t.points} pts)`).join(', ')}
- League Scoring Average: ${c.averageScore} pts | Median: ${c.medianScore} pts

FULL STANDINGS / SURVIVOR LADDER (Ranked highest to lowest):
${c.allRankedTeams?.map((t: any, i: number) => `${i + 1}. ${t.teamName} (${t.ownerName}) - ${t.points} pts ${t.rosterId === c.choppedTeam?.rosterId ? '-> [🪓 CHOPPED & ELIMINATED]' : ''}`).join('\n')}

${announcements ? `COMMISSIONER ANNOUNCEMENTS / DEADLINES:\n${announcements}\n` : ''}
${duesNote ? `LEAGUE DUES / FAAB BOUNTY NOTICE:\n${duesNote}\n` : ''}

${
  !isSidePotEnabled
    ? `SIDE POT POLICY: The weekly side pot is DISABLED / NOT opted-in for this league. DO NOT generate a Side Pot Desk section, and do NOT mention side pot entry fees or payouts.`
    : `SIDE POT ACTIVE: Total pot ($${(sidePotConfig?.totalPot || 25).toFixed(2)}), #1 Points winner ($${(sidePotConfig?.pointsWinnerPayout || 12.5).toFixed(2)}), Biggest Blowout ($${(sidePotConfig?.blowoutWinnerPayout || 12.5).toFixed(2)}), Next week fee ($${sidePotConfig?.entryFee || 5}).`
}

SECTIONS TO GENERATE:
1. Executive Gazette Masthead & Tagline ("SAME LEAGUE. DIFFERENT LEVELS.")
2. Highlights Grid: Blowout / Chop Margin, Apex GM of the Week, Galaxy Brain / Narrow Escape Move, Bonehead Move
3. Main Feature Story & Proclamation of the Guillotine's Drop (${c.choppedTeam?.teamName} purged, spotlighting top-ranked stars hitting waivers: ${topChoppedStars})
4. Monday Night Fallout (how late games sealed the cut line)
5. The Survivor Ledger: Every manager, score, and margin over the blade with punchy tactical notes
6. Final Points Leaderboard
${isSidePotEnabled ? `7. Side Pot Desk (Total pot, #1 points payout, next week fee notice)` : ''}
8. Power Rankings (Subjective. Unapologetic. Based on one week of evidence. One biting blurb per manager)
9. The Commissioner's Notebook (Fraud Watch, Stock Up, Stock Down, Galaxy Brain Move, Bonehead Move, League Canon, Around the League, Week Warning, Final Word)

FORMATTING:
Output clean, beautifully formatted Markdown with bold titles, emojis, and tables. Make it ready to copy-paste directly into Sleeper league chat or Discord.
CRITICAL OUTPUT INSTRUCTIONS:
- In the reports, list the top-ranked players (${topChoppedStars}) instead of random starters.
- NEVER print any label like "Tone:", "*Tone: ROAST*", "Tone Requirements:", or "Tone Guidelines:".
- NEVER output meta-instructions, preamble phrases (e.g. "Here is your report:"), or conversational filler.
- The output must dive directly into the report content without echoing prompt rules.
`;
    } else {
      const isUnplayedWeek = Boolean(stats && (stats.hasStarted === false || (stats.totalScore !== undefined && stats.totalScore === 0)));
      const topScorerStars = stats?.highestScorer?.topRankedPlayers
        ?.map((p: any) => `${p.name}${p.pos ? ` (${p.pos})` : ''}`)
        .join(', ');

      if (isUnplayedWeek) {
        prompt = `
You are the Commissioner of the Fantasy Football League "${leagueName}".
Write the official Week ${week} Matchup Preview & Pre-Game Commissioner Report for your league members.

CRITICAL FACTUAL CONTEXT:
- Week ${week} games HAVE NOT BEEN PLAYED YET on Sleeper.
- All teams currently sit at 0.00 points awaiting kickoff.
- DO NOT INVENT fake final scores, fake blowout margins, fake winners, or fake losers!
- Write a thrilling, entertaining Pre-Game Matchup Preview highlighting the scheduled head-to-head battles!

TONE GUIDELINES:
${tonePromptDescription}

SCHEDULED HEAD-TO-HEAD MATCHUPS FOR WEEK ${week}:
${stats?.matchups?.map((m: any, i: number) => `Matchup ${i + 1}: ${m.teamA.teamName} (${m.teamA.ownerName}) vs ${m.teamB.teamName} (${m.teamB.ownerName})`).join('\n') || 'Scheduled league matchups pending kickoff'}

${announcements ? `COMMISSIONER ANNOUNCEMENTS TO INCLUDE:\n${announcements}\n` : ''}
${duesNote ? `LEAGUE DUES / TREASURY NOTE TO INCLUDE:\n${duesNote}\n` : ''}

${
  !isSidePotEnabled
    ? `SIDE POT POLICY: The weekly side pot is DISABLED / NOT opted-in for this league. DO NOT generate a Side Pot Desk section.`
    : `SIDE POT ACTIVE: Total pot ($${(sidePotConfig?.totalPot || 25).toFixed(2)}), #1 Points prize ($${(sidePotConfig?.pointsWinnerPayout || 12.5).toFixed(2)}), Blowout prize ($${(sidePotConfig?.blowoutWinnerPayout || 12.5).toFixed(2)}), Entry fee ($${sidePotConfig?.entryFee || 5}) due before kickoff.`
}

SECTIONS TO GENERATE:
1. LEAD HEADLINE & STORY: (e.g. "WEEK ${week} MATCHUP PREVIEW: BATTLES SET AS KICKOFF LOOMS")
2. THE REST OF WEEK ${week}:
   - Marquee Clash: Spotlight the featured matchup (${stats?.matchups?.[0]?.teamA?.teamName || 'Team A'} vs ${stats?.matchups?.[0]?.teamB?.teamName || 'Team B'})
   - Lineup Readiness: Starters check and injury monitoring
   - Tactical Advice: Key start/sit dilemmas before kickoff
3. SCHEDULED MATCHUP LEDGER: Table detailing every head-to-head clash with pre-game storylines
4. CURRENT STANDINGS: Roster overview heading into Week ${week}
${isSidePotEnabled ? `5. SIDE POT DESK: Reminder on entry fee and upcoming payout categories` : ''}
6. PRE-GAME POWER RANKINGS: Rankings heading into Week ${week} with sharp, witty observations
7. THE COMMISSIONER'S NOTEBOOK:
   - WAIVER & LINEUP ALERTS
   - GALAXY BRAIN START
   - DUD RISK WARNING
   - LEAGUE RIVALRIES TO WATCH
   - FINAL WORD: Kickoff reminder and good luck message

FORMATTING:
Output clean, beautifully formatted Markdown with bold titles, tables, and crisp structure.
CRITICAL OUTPUT INSTRUCTIONS:
- Do NOT list fake past scores or pretend the week was already played.
- NEVER print any label like "Tone:", "*Tone: ROAST*", "Tone Requirements:", or "Tone Guidelines:".
- The output must dive directly into the report content without preamble or meta-commentary.
`;
      } else {
        prompt = `
You are the Commissioner of the Fantasy Football League "${leagueName}".
Write the official Week ${week} Commissioner Gazette & Weekly Newspaper Report for your league members, modeled after an elite executive league newsletter.

TONE GUIDELINES:
${tonePromptDescription}

CRITICAL DATA POINTS TO FEATURE:
- League: ${leagueName}
- Week: ${week}
- Total Matchups: ${stats?.totalMatchups || 'N/A'}
- League Average Score: ${stats?.averageScore || 'N/A'} pts
- 💥 BIGGEST BLOWOUT OF THE WEEK: Winner ${stats?.biggestBlowout?.winner?.teamName} (${stats?.biggestBlowout?.winner?.points} pts) defeated ${stats?.biggestBlowout?.loser?.teamName} (${stats?.biggestBlowout?.loser?.points} pts) by a staggering ${stats?.biggestBlowout?.margin} point margin!
- 💔 THE UNLUCKY BASTARD CLUB (Highest-Scoring Loser): ${stats?.highestScoringLoser?.team?.teamName} who scored an incredible ${stats?.highestScoringLoser?.team?.points} pts but still took an L against ${stats?.highestScoringLoser?.matchup?.winner?.teamName} (${stats?.highestScoringLoser?.matchup?.winner?.points} pts)!
- 👑 GM OF THE WEEK (Highest Total Points): ${stats?.highestScorer?.teamName} (${stats?.highestScorer?.ownerName}) with ${stats?.highestScorer?.points} pts!${topScorerStars ? ` (Top stars led by: ${topScorerStars})` : ''}
- 🥶 LOW SCORER / BONEHEAD MOVE: ${stats?.lowestScorer?.teamName} with ${stats?.lowestScorer?.points} pts!
${stats?.topPositionalBlunder ? `- 🤦 BENCH BLUNDER / START-SIT REGRET ("IF ONLY..."):
  Manager: ${stats.topPositionalBlunder.manager} (${stats.topPositionalBlunder.teamName})
  Benched Player: ${stats.topPositionalBlunder.benchPlayerName} (${stats.topPositionalBlunder.position}, ${stats.topPositionalBlunder.benchPlayerPoints} pts on bench)
  Started Player: ${stats.topPositionalBlunder.starterPlayerName} (${stats.topPositionalBlunder.position}, ${stats.topPositionalBlunder.starterPlayerPoints} pts)
  Swing: +${stats.topPositionalBlunder.pointsDifference} pts
  Context: "${stats.topPositionalBlunder.blurb}"` : ''}
${stats?.closestMatchup ? `- ⚡ NAIL-BITER (Closest Game): ${stats?.closestMatchup?.winner?.teamName} (${stats?.closestMatchup?.winner?.points}) vs ${stats?.closestMatchup?.loser?.teamName} (${stats?.closestMatchup?.loser?.points}) - decided by only ${stats?.closestMatchup?.margin} pts!` : ''}

ALL MATCHUPS TO RECAP IN THE WEEK LEDGER:
${stats?.matchups?.map((m: any, i: number) => `Game ${i + 1}: ${m.winner.teamName} (${m.winner.points} pts) def. ${m.loser.teamName} (${m.loser.points} pts) [Margin: ${m.margin} pts]`).join('\n')}

${announcements ? `COMMISSIONER ANNOUNCEMENTS TO INCLUDE:\n${announcements}\n` : ''}
${duesNote ? `LEAGUE DUES / TREASURY NOTE TO INCLUDE:\n${duesNote}\n` : ''}

${
  !isSidePotEnabled
    ? `SIDE POT POLICY: The weekly side pot is DISABLED / NOT opted-in for this league. DO NOT generate a Side Pot Desk section, and DO NOT mention side pot, side pot entry fees, or side pot payouts anywhere in the report (including the Unlucky Bastard Club or Commissioner's Notebook).`
    : `SIDE POT ACTIVE: Total pot ($${(sidePotConfig?.totalPot || 25).toFixed(2)}), #1 Points winner ($${(sidePotConfig?.pointsWinnerPayout || 12.5).toFixed(2)}), Biggest Blowout ($${(sidePotConfig?.blowoutWinnerPayout || 12.5).toFixed(2)}), Next week fee ($${sidePotConfig?.entryFee || 5}).`
}

SECTIONS TO GENERATE (INCLUDE ALL OF THESE EXACT HEADERS):
1. THE REST OF WEEK ${week}:
   - Blowout of the Week: Scores, margin, and a biting commentary ("That's not a matchup—that's a wellness check")
   - GM of the Week: Winner, score, record, and rationale ("Sets the standard")
   - Galaxy Brain Move: Best tactical start, dual QBs in Superflex, or sleeper explosion
2. LEAD HEADLINE & STORY: (e.g. "[GM] OPENS THE SEASON WITH A STATEMENT" - breakdown of the scoring crown)
3. MONDAY NIGHT FALLOUT: How Monday night numbers changed the scoreboard and locked in final margins
4. THE UNLUCKY BASTARD CLUB: Induction of the highest-scoring loser with their bad beat recap${isSidePotEnabled ? ' and side-pot payout' : ''}
5. THE WEEK ${week} LEDGER: Table with WINNER | PTS | LOSER | PTS | RECAP (each game gets a sharp, hilarious excuse/recap one-liner!)
6. FINAL POINTS LEADERBOARD: Table ranked 1 to 12 purely by total points scored with Record
${isSidePotEnabled ? `7. SIDE POT DESK: Total pot ($${(sidePotConfig?.totalPot || 25).toFixed(2)}), #1 Points winner ($${(sidePotConfig?.pointsWinnerPayout || 12.5).toFixed(2)}), Biggest Blowout winner ($${(sidePotConfig?.blowoutWinnerPayout || 12.5).toFixed(2)}), Next week fee due before TNF` : ''}
8. POWER RANKINGS: "Subjective. Unapologetic. Based on one week of evidence." Ranks 1 to 12 with a witty, biting one-sentence rationale for every single manager
9. THE COMMISSIONER'S NOTEBOOK:
   - FRAUD WATCH (team that looked terrifying on paper but failed)
   - STOCK UP (hot contenders)
   - STOCK DOWN (sub-100 scorers or cold stars)
   - GALAXY BRAIN MOVE
   - BONEHEAD MOVE / HINDSIGHT DESK (Roast the start/sit blunder with creative, varied phrasing! Never use the exact same sentence template or repetitive formula. If mentioning start/sit blunders or regrets, only mention each team ONCE—never mention the same team twice in the Hindsight / bonehead section. Use angles like the agonizing "what-if", sleepless nights over a benched boom, how swapping the bench player in would have flipped the loss into an outright win or trimmed a beatdown, or sarcastic film-room breakdown of points left on the pine.)
   - LEAGUE CANON (narratives, rivalries, and lore)
   - AROUND THE LEAGUE (scoring trends, high averages)
   - WEEK WARNING (${isSidePotEnabled ? `side pot fee & TNF deadline: "Pay your damn five dollars"` : `lineup check & waiver deadlines before Thursday Night Football kickoff`})
10. FINAL WORD: Authoritative, punchy commissioner closing statement

FORMATTING:
Output clean, beautifully formatted Markdown with bold titles, markdown tables, and crisp structure. Make it ready to copy-paste directly into Sleeper league chat or Discord.
CRITICAL OUTPUT INSTRUCTIONS:
- Whenever referencing players on a team, mention the top-ranked players on the roster instead of random players.
- NEVER print any label like "Tone:", "*Tone: ROAST*", "Tone Requirements:", or "Tone Guidelines:".
- NEVER output meta-instructions, preamble phrases (e.g. "Here is your report:"), or conversational filler.
- The output must dive directly into the report content without echoing prompt rules.
`;
      }
    }

    let generatedText: string | undefined;
    let usedAi = false;

    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });
        generatedText = response.text;
        usedAi = true;
      } catch (apiErr: any) {
        console.warn('Gemini 3.8 Flash temporary issue, trying fallback model or template:', apiErr.message);
        try {
          const response2 = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
          });
          generatedText = response2.text;
          usedAi = true;
        } catch (err2) {
          console.warn('Fallback model also unavailable, generating tone-adapted note dynamically.');
        }
      }
    }

    if (!generatedText) {
      // High quality tone-crafted fallback note
      if (isChopped && choppedStats) {
        const c = choppedStats;
        generatedText = `# 🪓 ${leagueName} - Week ${week} Execution Report

The blade has fallen. In this Chopped Guillotine league, there are no second chances and no head-to-head match excuses. One squad has been eliminated from the season.

${announcements ? `### 📢 Commissioner Bulletins & Deadlines\n${announcements}\n` : ''}
${duesNote ? `### 💰 League Dues & FAAB Bounties\n${duesNote}\n` : ''}

## 🪓 THE EXECUTION: REST IN PEACE TO ${c.choppedTeam?.teamName?.toUpperCase()}
- **Eliminated Manager:** **${c.choppedTeam?.teamName}** (${c.choppedTeam?.ownerName})
- **Score:** **${c.choppedTeam?.points} pts** (Lowest in the league)
- **Status:** **CHOPPED & REMOVED FROM PLAY**
- 🥩 **Waiver Wire Goldrush:** All starters from ${c.choppedTeam?.teamName} (${c.choppedTeam?.starters?.slice(0, 6).join(', ') || 'Roster'}) are immediately dumped to waivers. Check your FAAB budgets!

## 🏆 SURVIVOR HONORS
- 👑 **APEX SURVIVOR:** **${c.apexSurvivor?.teamName}** crushed the league with **${c.apexSurvivor?.points} pts**, securing undisputed immunity.
- 🩸 **THE NARROW ESCAPE:** **${c.narrowEscape?.team?.teamName}** survived by a razor-thin **+${c.narrowEscape?.marginOverChopped} pts**! One missed catch away from the guillotine.

## 🪜 WEEK ${week} SURVIVOR STANDINGS
${c.allRankedTeams?.map((t: any, idx: number) => `${idx + 1}. ${t.rosterId === c.choppedTeam?.rosterId ? '💀' : idx === 0 ? '👑' : '🛡️'} **${t.teamName}** (${t.ownerName}) - **${t.points} pts** ${t.rosterId === c.choppedTeam?.rosterId ? '*(🪓 CHOPPED)*' : '*(SURVIVED)*'}`).join('\n')}

---
*Generated by Fantasy Commissioner Notes using Sleeper API*`;
      } else if (Boolean(stats && (stats.hasStarted === false || (stats.totalScore !== undefined && stats.totalScore === 0)))) {
        generatedText = `# 🏈 ${leagueName} - Week ${week} Matchup Preview & Pre-Game Report

Games for Week ${week} have not been played yet on Sleeper. All teams sit tied at 0.00 points awaiting kickoff. Lineups are being finalized across the league, and matchups are locked in for battle.

${announcements ? `### 📢 League Announcements\n${announcements}\n` : ''}
${duesNote ? `### 💰 League Treasury Notice\n${duesNote}\n` : ''}

## ⚔️ Scheduled Week ${week} Head-to-Head Clashes
${stats?.matchups?.map((m: any, i: number) => `### Matchup ${i + 1}: ${m.teamA.teamName} (${m.teamA.ownerName}) vs ${m.teamB.teamName} (${m.teamB.ownerName})
> **Status:** Scheduled (0.00 pts) | Starters locking at game time.`).join('\n\n') || 'All league matchups scheduled.'}

## 📋 Pre-Game Checklist
- Check injury designations and active/inactive reports before kickoff.
- Finalize your flex spots and reserve late slots for Sunday/Monday players.
- Best of luck to all managers in Week ${week}!

---
*Generated by Fantasy Commissioner Notes using Sleeper API*`;
      } else {
        let intro = '';
        if (tone === 'roast') {
          intro = `Fire up the group chat and grab your popcorn. Week ${week} was an absolute demolition derby. Some of you drafted championship contenders, and some of you drafted like you closed your eyes and threw darts at an injury report.`;
        } else if (tone === 'espn') {
          intro = `Welcome back to the Monday Night wrap-up. Week ${week} delivered thrilling wire-to-wire drama, breakout individual performances, and tactical missteps across the gridiron.`;
        } else if (tone === 'conspiracy') {
          intro = `I've analyzed the Sleeper algorithm, the projection models, and the waiver order. There is no mathematical explanation for how the highest-scoring loser was paired against the week's highest scorer. The fantasy football matrix is Glitching.`;
        } else if (tone === 'hype') {
          intro = `LET'S GO! Week ${week} is officially in the books! Legends were forged in the endzones, titans fell to earth, and the journey to fantasy glory has begun!`;
        } else {
          intro = `Welcome to the official Week ${week} Commissioner Recap. We had great matchups across the league, high drama, and an exciting kickoff to the season!`;
        }

        generatedText = `# 🏈 ${leagueName} - Week ${week} Commissioner Notes

${intro}

${announcements ? `### 📢 League Announcements\n${announcements}\n` : ''}
${duesNote ? `### 💰 League Dues & Treasury Reminder\n${duesNote}\n` : ''}

## 🏆 Week ${week} Honors, Disasters & Bad Beats

- 💥 **THE BIGGEST BLOWOUT OF THE WEEK:**
  **${stats?.biggestBlowout?.winner?.teamName}** (${stats?.biggestBlowout?.winner?.points} pts) completely annihilated **${stats?.biggestBlowout?.loser?.teamName}** (${stats?.biggestBlowout?.loser?.points} pts) by **${stats?.biggestBlowout?.margin} points**! Someone check on ${stats?.biggestBlowout?.loser?.teamName} in the group chat.

- 💔 **THE TOUGH LUCK BAD BEAT (Highest-Scoring Loser):**
  A moment of silence for **${stats?.highestScoringLoser?.team?.teamName}**. Dropped **${stats?.highestScoringLoser?.team?.points} pts**—a score that would have defeated nearly every other team in the league—only to run straight into **${stats?.highestScoringLoser?.matchup?.winner?.teamName}** (${stats?.highestScoringLoser?.matchup?.winner?.points} pts). Brutal fantasy heartbreak.

- 👑 **HIGH ROLLER OF THE WEEK:**
  **${stats?.highestScorer?.teamName}** with a monster **${stats?.highestScorer?.points} pts**. Put some respect on their name.

- 🥶 **ICE COLD TOILET BOWL AWARD:**
  **${stats?.lowestScorer?.teamName}** managed just **${stats?.lowestScorer?.points} pts**. Might want to check if the starters were actually active.

${stats?.closestMatchup ? `- ⚡ **CARDIAC FINISH (Closest Game):**\n  **${stats?.closestMatchup?.winner?.teamName}** (${stats?.closestMatchup?.winner?.points}) held on by a thread against **${stats?.closestMatchup?.loser?.teamName}** (${stats?.closestMatchup?.loser?.points}) by just **${stats?.closestMatchup?.margin} pts**!\n` : ''}

## ⚔️ Head-to-Head Matchup Breakdown
${stats?.matchups?.map((m: any, i: number) => `### Game ${i + 1}: ${m.winner.teamName} (${m.winner.points}) def. ${m.loser.teamName} (${m.loser.points})
> **Margin:** +${m.margin} pts | Total combined: ${(m.winner.points + m.loser.points).toFixed(2)} pts. ${m.winner.teamName} takes the Week ${week} W.`).join('\n\n')}

${includePowerRankings ? `## 📈 Commissioner's Quick Power Rankings
1. 🥇 **${stats?.highestScorer?.teamName}** - Scorching hot offense out of the gate.
2. 🥈 **${stats?.biggestBlowout?.winner?.teamName}** - Ruthless efficiency and dominance.
3. 🥉 **${stats?.highestScoringLoser?.matchup?.winner?.teamName}** - Battle-tested victory in a shootout.
4. 🧱 **${stats?.highestScoringLoser?.team?.teamName}** - Unlucky 0-1, but the roster is loaded.
...
12. 🧻 **${stats?.lowestScorer?.teamName}** - Time to hit the waiver wire and pray.` : ''}

---
*Generated by Fantasy Commissioner Notes using Sleeper API*`;
      }
    }

    if (generatedText) {
      // Strip any accidental tone requirement labels, prompt echoes, or system tags
      generatedText = generatedText
        .replace(/^\*?Tone\s*:\s*[A-Z_a-z\s-]+\*?\r?\n+/gim, '')
        .replace(/^Tone\s+Requirements?:[^\r\n]*\r?\n+/gim, '')
        .replace(/^Tone\s+Guidelines?:[^\r\n]*\r?\n+/gim, '')
        .trim();
    }

    res.json({
      notes: generatedText,
      isAi: usedAi,
    });
  } catch (error: any) {
    console.error('Error generating AI commissioner notes:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate AI notes',
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
