const accountService = require('./accountService');
const summonerService = require('./summonerService.js');
const leagueService = require('./leagueService');
const matchService = require('./matchService');
const userService = require('./userService');

const linkAccount = async (discordId, gameName, tagLine) => {
  const account = await accountService.getAccountByRiotId(gameName, tagLine);
  userService.linkUser(discordId, account.puuid, gameName, tagLine);
  return account;
};

const getRankedStats = async (discordId) => {
  const user = userService.getLinkedUser(discordId);
  if (!user) throw new Error('No linked account');
  
  const summoner = await summonerService.getSummonerByPuuid(user.puuid);
  return leagueService.getLeagueEntries(summoner.id);
};

const getRecentMatches = async (discordId, count = 5) => {
  const user = userService.getLinkedUser(discordId);
  if (!user) throw new Error('No linked account');
  
  const matchIds = await matchService.getMatchIds(user.puuid, count);
  return Promise.all(matchIds.map(matchService.getMatchDetails));
};

module.exports = {
  linkAccount,
  getRankedStats,
  getRecentMatches
};