const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { clearLink, getLinkedUser } = require('../services/userService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Remove your linked LoL account'),

  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const user = getLinkedUser(interaction.user.id);
      if (!user) throw new Error('No linked account found');

      if (!clearLink(interaction.user.id)) {
        throw new Error('Failed to clear link - please contact support');
      }

      const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle('🚮 Account Unlinked')
        .setDescription(`Successfully removed **${user.gameName}#${user.tagLine}**`)
        .setThumbnail('https://i.imgur.com/W7VJssL.png');

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Unlinking Failed')
        .setDescription(error.message);

      await interaction.editReply({ embeds: [embed] });
    }
  }
};