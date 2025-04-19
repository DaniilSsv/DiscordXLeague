const axios = require('axios');
const { RIOT_BASE } = require('./config');

const getLeagueEntries = async (summonerId) => {
  const { data } = await axios.get(
    `${RIOT_BASE}/league/v4/entries/by-summoner/${summonerId}`,
    { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
  );
  return data.map(entry => ({
    queueType: entry.queueType,
    tier: entry.tier,
    rank: entry.rank,
    wins: entry.wins,
    losses: entry.losses,
    leaguePoints: entry.leaguePoints
  }));
};

module.exports = { getLeagueEntries };