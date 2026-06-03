// The Odds API client + win probability conversion
// Docs: https://the-odds-api.com/liveapi/guides/v4/

const BASE_URL = 'https://api.the-odds-api.com/v4';
const API_KEY = process.env.ODDS_API_KEY;

// ── Win probability formula ────────────────────────────────────────────────
//
// Bookmakers express odds in American format:
//   Favourite: negative number  e.g. -165 (bet $165 to win $100)
//   Underdog:  positive number  e.g. +140 (bet $100 to win $140)
//
// We convert these to implied probability (0.0 → 1.0).
// This is literally how sportsbooks price their lines.
//
export function americanToWinProb(odds) {
  if (odds > 0) {
    // Underdog formula: 100 / (odds + 100)
    return 100 / (odds + 100);
  } else {
    // Favourite formula: -odds / (-odds + 100)
    return -odds / (-odds + 100);
  }
}

// Remove the bookmaker's "vig" (their cut) so probs add up to 1.0.
// Raw implied probs sum to ~1.05 because the book takes a margin.
export function removeVig(homeProb, awayProb) {
  const total = homeProb + awayProb;
  return {
    homeWinProb: homeProb / total,
    awayWinProb: awayProb / total,
  };
}

// ── API calls ──────────────────────────────────────────────────────────────

// Fetch upcoming + live games with moneyline odds
// sport: "basketball_nba" | "americanfootball_nfl"
export async function fetchGamesWithOdds(sport) {
  const url = new URL(`${BASE_URL}/sports/${sport}/odds`);
  url.searchParams.set('apiKey', API_KEY);
  url.searchParams.set('regions', 'us');
  url.searchParams.set('markets', 'h2h'); // h2h = moneyline (head to head)
  url.searchParams.set('oddsFormat', 'american');

  const res = await fetch(url.toString());

  if (!res.ok) {
    throw new Error(`Odds API error: ${res.status} ${res.statusText}`);
  }

  const games = await res.json();

  // Transform into our cleaner format with win probabilities attached
  return games.map((game) => {
    // Use DraftKings odds if available, otherwise first bookmaker
    const bookmaker =
      game.bookmakers.find((b) => b.key === 'draftkings') ||
      game.bookmakers[0];

    if (!bookmaker) {
      return { ...game, homeWinProb: null, awayWinProb: null };
    }

    const h2h = bookmaker.markets.find((m) => m.key === 'h2h');
    const homeOutcome = h2h?.outcomes.find((o) => o.name === game.home_team);
    const awayOutcome = h2h?.outcomes.find((o) => o.name === game.away_team);

    if (!homeOutcome || !awayOutcome) {
      return { ...game, homeWinProb: null, awayWinProb: null };
    }

    const rawHomeProb = americanToWinProb(homeOutcome.price);
    const rawAwayProb = americanToWinProb(awayOutcome.price);
    const { homeWinProb, awayWinProb } = removeVig(rawHomeProb, rawAwayProb);

    return {
      id: game.id,
      sport: game.sport_key,
      homeTeam: game.home_team,
      awayTeam: game.away_team,
      commenceTime: game.commence_time,
      homeOdds: homeOutcome.price,
      awayOdds: awayOutcome.price,
      homeWinProb: Math.round(homeWinProb * 1000) / 1000, // 3 decimal places
      awayWinProb: Math.round(awayWinProb * 1000) / 1000,
    };
  });
}
