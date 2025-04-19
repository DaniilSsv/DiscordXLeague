const axios = require('axios');
const { RIOT_BASE } = require('./config');

const getSummonerByPuuid = async (puuid) => {
  const { data } = await axios.get(
    `${RIOT_BASE}/summoner/v4/summoners/by-puuid/${puuid}`,
    { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
  );
  return data;
};

const getSummonerByName = async (summonerName) => {
  const { data } = await axios.get(
    `${RIOT_BASE}/summoner/v4/summoners/by-name/${encodeURIComponent(summonerName)}`,
    { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
  );
  return data;
};

module.exports = { getSummonerByPuuid, getSummonerByName };