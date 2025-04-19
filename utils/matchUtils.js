const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

function formatNumber(num) {
  return new Intl.NumberFormat().format(num);
}

function createMatchEmbed(match, user) {
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

  return embed;
}

function createErrorEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle(`❌ ${title}`)
    .setDescription(description)
    .setFooter({ text: 'Try again later or contact support' });
}

function createActionRow(matchCount, currentIndex = 0) {
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
}

module.exports = {
  createMatchEmbed,
  createErrorEmbed,
  createActionRow,
  formatNumber
};
