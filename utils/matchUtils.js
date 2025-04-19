// utils/matchUtils.js
import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

const formatNumber = (num) => new Intl.NumberFormat().format(num);

const createMatchEmbed = (match, user) => {
  const embed = new EmbedBuilder()
    .setColor(match.win ? 0x4CAF50 : 0xF44336)
    .setTitle(`${match.champion} ${match.win ? 'Victory' : 'Defeat'}`)
    .setDescription(`**${match.gameMode}** • ${match.duration} • ${match.endTime}`)
    .addFields(
      { name: 'KDA', value: `\`${match.kills}/${match.deaths}/${match.assists}\` (${match.kda})`, inline: true },
      { name: 'CS', value: `\`${match.cs}\` (${match.csPerMin}/min)`, inline: true },
      { name: 'Damage', value: `\`${formatNumber(match.damageDealt)}\` to champions`, inline: true },
      { name: 'Gold', value: `\`${formatNumber(match.goldEarned)}\` earned`, inline: true },
      { name: 'Vision', value: `Score: \`${match.visionScore}\` | Wards: \`${match.wardsPlaced}\``, inline: true },
      { name: 'Role', value: `\`${match.role || 'UNKNOWN'}\``, inline: true }
    )
    .setFooter({ text: `Match ID: ${match.matchId}` });

  if (match.firstBlood) {
    embed.addFields({ name: 'First Blood', value: '✅ Secured first blood', inline: true });
  }

  // RUNES
  const [primary, secondary] = match.perks.styles;
  const primaryRunes = primary.selections.map(s => s.perk).join(', ');
  const secondaryRunes = secondary.selections.map(s => s.perk).join(', ');

  embed.addFields({
    name: 'Runes',
    value: `Primary (Style ${primary.style}): ${primaryRunes}\nSecondary (Style ${secondary.style}): ${secondaryRunes}`
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

export { createMatchEmbed, createErrorEmbed, createActionRow, formatNumber };
