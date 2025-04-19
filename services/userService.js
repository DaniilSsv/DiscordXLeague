const userLinks = new Map();

const linkUser = (discordId, puuid, gameName, tagLine) => {
  userLinks.set(discordId, { puuid, gameName, tagLine });
};

const getLinkedUser = (discordId) => {
  return userLinks.get(discordId);
};

const clearLink = (discordId) => {
  return userLinks.delete(discordId);
};

// NEW: Store matches
const storeMatchesForUser = (discordId, matches) => {
  const user = userLinks.get(discordId);
  if (user) {
    user.matchData = { matches, currentIndex: 0 };
  }
};

const getMatchesForUser = (discordId) => {
  const user = userLinks.get(discordId);
  return user?.matchData || null;
};

module.exports = {
  linkUser,
  getLinkedUser,
  clearLink,
  storeMatchesForUser,
  getMatchesForUser
};
