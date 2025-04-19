const axios = require('axios');
const { RIOT_REGIONAL } = require('./config');

const getAccountByRiotId = async (gameName, tagLine) => {
  const { data } = await axios.get(
    `${RIOT_REGIONAL}/riot/account/v1/accounts/by-riot-id/${gameName}/${tagLine}`,
    { headers: { 'X-Riot-Token': process.env.RIOT_API_KEY } }
  );
  return {
    puuid: data.puuid,
    gameName: data.gameName,
    tagLine: data.tagLine
  };
};

module.exports = { getAccountByRiotId };