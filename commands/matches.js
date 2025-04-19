const {
  SlashCommandBuilder
} = require('discord.js');

const { getMatchHistory } = require('../services/matchService');
const { getLinkedUser, storeMatchesForUser } = require('../services/userService');
const {
  createMatchEmbed,
  createErrorEmbed,
  createActionRow
} = require('../utils/matchUtils');

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
          embeds: [createErrorEmbed('Account Not Linked', 'Please link your account with `/link` first')]
        });
      }

      const matches = await getMatchHistory(user.puuid, count);

      if (!matches.length) {
        return interaction.editReply({
          embeds: [createErrorEmbed('No Matches Found', 'Play some games first!')]
        });
      }

      storeMatchesForUser(interaction.user.id, matches);

      const embeds = matches.map(match => createMatchEmbed(match, user));
      const components = createActionRow(matches.length, 0);

      await interaction.editReply({
        content: `🎮 **${user.gameName}'s Recent Competitive Matches**`,
        embeds: [embeds[0]],
        components
      });

    } catch (error) {
      console.error('Command error:', error);
      await interaction.editReply({
        embeds: [createErrorEmbed('Match History Error', error.message)]
      });
    }
  }
};
