const axios = require('axios');
const { RIOT_EUROPE, RIOT_REGIONAL } = require('./config');

const getMatchHistory = async (puuid, count = 5) => {
  try {
    // Get match IDs
    const { data: matchIds } = await axios.get(
      `${RIOT_EUROPE}/match/v5/matches/by-puuid/${puuid}/ids`,
      {
        params: { count },
        headers: { 'X-Riot-Token': process.env.RIOT_API_KEY }
      }
    );

    if (!matchIds?.length) return [];

    // Process matches in parallel with rate limiting
    const matches = await Promise.all(
      matchIds.map(async matchId => {
        const { data: match } = await axios.get(
          `${RIOT_EUROPE}/match/v5/matches/${matchId}`,
          { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
        );
        
        const player = match.info.participants.find(p => p.puuid === puuid);
        return transformMatchData(match, player);
      })
    );

    return matches.filter(match => match !== null);
  } catch (error) {
    console.error('Match history error:', error);
    throw new Error('Failed to retrieve match history');
  }
};

// Private transformation method
function transformMatchData(match, player) {
  if (!player) return null;

  const durationMinutes = Math.floor(match.info.gameDuration / 60);
  const seconds = match.info.gameDuration % 60;
  const kda = ((player.kills + player.assists) / Math.max(player.deaths, 1)).toFixed(2);
  const cs = player.totalMinionsKilled + player.neutralMinionsKilled;
  const csPerMin = (cs / durationMinutes).toFixed(1);

  return {
    matchId: match.metadata.matchId,
    gameMode: match.info.gameMode,
    queueId: match.info.queueId,
    champion: player.championName,
    win: player.win,
    kills: player.kills,
    deaths: player.deaths,
    assists: player.assists,
    kda,
    cs,
    csPerMin,
    visionScore: player.visionScore,
    goldEarned: player.goldEarned,
    champLevel: player.champLevel,
    damageDealt: player.totalDamageDealtToChampions,
    damageTaken: player.totalDamageTaken,
    wardsPlaced: player.wardsPlaced,
    wardsKilled: player.wardsKilled,
    firstBlood: player.firstBloodKill,
    role: player.teamPosition,
    duration: `${durationMinutes}m ${seconds}s`,
    endTime: new Date(match.info.gameEndTimestamp).toLocaleString(),
    items: [
      player.item0, player.item1, player.item2,
      player.item3, player.item4, player.item5, player.item6
    ].filter(id => id !== 0),
    perks: player.perks,
    summoners: {
      spell1: player.summoner1Id,
      spell2: player.summoner2Id
    },
    team: {
      kills: match.info.participants
        .filter(p => p.teamId === player.teamId)
        .reduce((sum, p) => sum + p.kills, 0),
      objectives: match.info.teams.find(t => t.teamId === player.teamId)?.objectives
    }
  };
}

module.exports = { getMatchHistory };