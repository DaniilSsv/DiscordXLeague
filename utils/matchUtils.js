const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

let runeData = null;

/** Load and cache rune definitions */
async function loadRunes(locale = 'en_US') {
  const versionsRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  const versions = await versionsRes.json();
  const latest = versions[0];
  const runesRes = await fetch(
    `https://ddragon.leagueoflegends.com/cdn/${latest}/data/${locale}/runesReforged.json`
  );
  runeData = await runesRes.json();
}
// Initialize once at startup
loadRunes().catch(console.error);

/** Get rune name & icon URL from data */
const getRuneMeta = (id) => {
  if (!runeData) return { name: `Unknown (${id})`, icon: '' };
  for (const style of runeData) {
    for (const slot of style.slots) {
      const rune = slot.runes.find(r => r.id === id);
      if (rune) {
        return {
          name: rune.name,
          icon: `https://ddragon.leagueoflegends.com/cdn/img/${rune.icon}`
        };
      }
    }
  }
  return { name: `Unknown (${id})`, icon: '' };
};

const getStyleMeta = (styleId) => {
  if (!runeData) return { name: `Unknown (${styleId})` };
  const style = runeData.find(s => s.id === styleId);
  return style
    ? { name: style.name }
    : { name: `Unknown (${styleId})` };
};

const formatNumber = (num) => new Intl.NumberFormat().format(num);

const createMatchEmbed = (match) => {
  const embed = new EmbedBuilder()
    .setColor(match.win ? 0x4CAF50 : 0xF44336)
    .setTitle(`${match.champion} ${match.win ? 'Victory' : 'Defeat'}`)
    .setDescription(`**${match.gameMode}** • ${match.duration} • ${match.endTime}`);

  embed.addFields(
    { name: 'KDA',    value: `\`${match.kills}/${match.deaths}/${match.assists}\` (${match.kda})`, inline: true },
    { name: 'CS',     value: `\`${match.cs}\` (${match.csPerMin}/min)`, inline: true },
    { name: 'Damage', value: `\`${formatNumber(match.damageDealt)}\` to champions`, inline: true },
    { name: 'Gold',   value: `\`${formatNumber(match.goldEarned)}\` earned`, inline: true },
    { name: 'Vision', value: `Score: \`${match.visionScore}\` | Wards: \`${match.wardsPlaced}\``, inline: true },
    { name: 'Role',   value: `\`${match.role || 'UNKNOWN'}\``, inline: true }
  );

  if (match.firstBlood) {
    embed.addFields({ name: 'First Blood', value: '✅ Secured first blood', inline: true });
  }

  // Runes: display names on separate lines
  const primary = match.perks.styles[0];
  const secondary = match.perks.styles[1];

  const primaryRunes = primary.selections.map(s => getRuneMeta(s.perk).name).join('\n');
  const secondaryRunes = secondary.selections.map(s => getRuneMeta(s.perk).name).join('\n');

  embed.addFields(
    { name: `🔹 Primary Runes • ${getStyleMeta(primary.style).name}`, value: primaryRunes, inline: false },
    { name: `🔸 Secondary Runes • ${getStyleMeta(secondary.style).name}`, value: secondaryRunes, inline: false }
  );

  embed.setFooter({ text: `Match ID: ${match.matchId}` });
  return embed;
};

const createErrorEmbed = (title, description) => new EmbedBuilder()
  .setColor(0xFF0000)
  .setTitle(`❌ ${title}`)
  .setDescription(description)
  .setFooter({ text: 'Try again later or contact support' });

const createActionRow = (matchCount, currentIndex = 0) => {
  if (matchCount <= 1) return [];
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('prev_match')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(currentIndex <= 0),
      new ButtonBuilder()
        .setCustomId('next_match')
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentIndex >= matchCount - 1)
    )
  ];
};

module.exports = { createMatchEmbed, createErrorEmbed, createActionRow, formatNumber, getRuneMeta };