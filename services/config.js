require('dotenv').config();

module.exports = {
  RIOT_TOKEN: process.env.RIOT_API_KEY,
  RIOT_BASE: 'https://euw1.api.riotgames.com/lol',
  RIOT_EUROPE: 'https://europe.api.riotgames.com/lol',
  RIOT_REGIONAL: 'https://europe.api.riotgames.com'
};