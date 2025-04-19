// utils/matchUtils.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
// If using Node <18, uncomment the next line:
// import fetch from 'node-fetch';

let runeData = null;

/** Load rune definitions from Data Dragon */
async function loadRunes(locale = 'en_US') {
  // 1. Get latest version list
  const versionsRes = await fetch('https://ddragon.leagueoflegends.com/api/versions.json');
  const versions = await versionsRes.json();
  const latest = versions[0]; // most recent patch :contentReference[oaicite:2]{index=2}

  // 2. Fetch runesReforged.json for that version
  const url = `https://ddragon.leagueoflegends.com/cdn/${latest}/data/${locale}/runesReforged.json`;
  const runesRes = await fetch(url);
  runeData = await runesRes.json();
}

// Call once at bot startup
loadRunes().catch(console.error);

/** Lookup a single rune’s name by its ID */
const getRuneName = (id) => {
  if (!runeData) return `Unknown (${id})`;
  for (const style of runeData) {
    for (const slot of style.slots) {
      const rune = slot.runes.find(r => r.id === id);
      if (rune) return rune.name;
    }
  }
  return `Unknown (${id})`;
};

const formatNumber = num => new Intl.NumberFormat().format(num);

const createMatchEmbed = (match) => {
  const embed = new EmbedBuilder()
    .setColor(match.win ? 0x4CAF50 : 0xF44336)
    .setTitle(`${match.champion} ${match.win ? 'Victory' : 'Defeat'}`)
    .setDescription(`**${match.gameMode}** • ${match.duration} • ${match.endTime}`)
    .addFields(
      { name: 'KDA',    value: `\`${match.kills}/${match.deaths}/${match.assists}\` (${match.kda})`, inline: true },
      { name: 'CS',     value: `\`${match.cs}\` (${match.csPerMin}/min)`,                   inline: true },
      { name: 'Damage', value: `\`${formatNumber(match.damageDealt)}\` to champions`,        inline: true },
      { name: 'Gold',   value: `\`${formatNumber(match.goldEarned)}\` earned`,              inline: true },
      { name: 'Vision', value: `Score: \`${match.visionScore}\` | Wards: \`${match.wardsPlaced}\``, inline: true },
      { name: 'Role',   value: `\`${match.role || 'UNKNOWN'}\``,                            inline: true }
    )
    .setFooter({ text: `Match ID: ${match.matchId}` });

  if (match.firstBlood) {
    embed.addFields({ name: 'First Blood', value: '✅ Secured first blood', inline: true });
  }

  const [primary, secondary] = match.perks.styles;
  const primaryRunes   = primary.selections.map(s => getRuneName(s.perk)).join(', ');
  const secondaryRunes = secondary.selections.map(s => getRuneName(s.perk)).join(', ');

  embed.addFields({
    name: 'Runes',
    value: `Primary (${primary.name}): ${primaryRunes}\nSecondary (${secondary.name}): ${secondaryRunes}`
  });

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

export { createMatchEmbed, createErrorEmbed, createActionRow, formatNumber, getRuneName };
