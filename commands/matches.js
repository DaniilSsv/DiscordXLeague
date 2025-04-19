const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const { getMatchHistory } = require('../services/matchService');
const { getLinkedUser, storeMatchesForUser } = require('../services/userService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('matches')
    .setDescription('Show your competitive match history')
    .addIntegerOption(option =>
      option.setName('count')
        .setDescription('Number of matches to show (1-10)')
        .setMinValue(1)
        .setMaxValue(10)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const count = interaction.options.getInteger('count') || 5;
      const user = getLinkedUser(interaction.user.id);
      
      if (!user) {
        return interaction.editReply({
          embeds: [this._createErrorEmbed('Account Not Linked', 'Please link your account with `/link` first')]
        });
      }

      const matches = await getMatchHistory(user.puuid, count);
      
      if (!matches.length) {
        return interaction.editReply({
          embeds: [this._createErrorEmbed('No Matches Found', 'Play some games first!')]
        });
      }

      storeMatchesForUser(interaction.user.id, matches); // ✅ Save match data

      const embeds = matches.map(match => this._createMatchEmbed(match, user));
      const components = this._createActionRow(matches.length);

      await interaction.editReply({
        content: `🎮 **${user.gameName}'s Recent Competitive Matches**`,
        embeds: [embeds[0]],
        components
      });

    } catch (error) {
      console.error('Command error:', error);
      await interaction.editReply({
        embeds: [this._createErrorEmbed('Match History Error', error.message)]
      });
    }
  },

  _createMatchEmbed(match, user) {
    const embed = new EmbedBuilder()
      .setColor(match.win ? 0x4CAF50 : 0xF44336)
      .setTitle(`${match.champion} ${match.win ? 'Victory' : 'Defeat'}`)
      .setDescription(`**${match.gameMode}** • ${match.duration} • ${match.endTime}`)
      .addFields(
        { name: 'KDA', value: `\`${match.kills}/${match.deaths}/${match.assists}\` (${match.kda})`, inline: true },
        { name: 'CS', value: `\`${match.cs}\` (${match.csPerMin}/min)`, inline: true },
        { name: 'Damage', value: `\`${this._formatNumber(match.damageDealt)}\` to champions`, inline: true },
        { name: 'Gold', value: `\`${this._formatNumber(match.goldEarned)}\` earned`, inline: true },
        { name: 'Vision', value: `Score: \`${match.visionScore}\` | Wards: \`${match.wardsPlaced}\``, inline: true },
        { name: 'Role', value: `\`${match.role || 'UNKNOWN'}\``, inline: true }
      )
      .setFooter({ text: `Match ID: ${match.matchId}` });

    if (match.firstBlood) {
      embed.addFields({ name: 'First Blood', value: '✅ Secured first blood', inline: true });
    }

    return embed;
  },

  _createErrorEmbed(title, description) {
    return new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(`❌ ${title}`)
      .setDescription(description)
      .setFooter({ text: 'Try again later or contact support' });
  },

  _createActionRow(matchCount) {
    if (matchCount <= 1) return [];

    return [
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('prev_match')
          .setLabel('Previous')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId('next_match')
          .setLabel('Next')
          .setStyle(ButtonStyle.Primary)
      )
    ];
  },

  _formatNumber(num) {
    return new Intl.NumberFormat().format(num);
  }
};
