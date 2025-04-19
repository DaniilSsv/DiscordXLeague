const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { linkAccount } = require('../services/riotService');
const { getLinkedUser } = require('../services/userService');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('Connect your Discord to your LoL account')
    .addStringOption(option =>
      option.setName('riot_id')
        .setDescription('Format: SummonerName#TAG (e.g., Kaljmarik#EUW)')
        .setRequired(true)
        .setMinLength(3)),

  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const input = interaction.options.getString('riot_id');
      const [gameName, tagLine] = input.split('#');
      
      // Validation
      if (!gameName || !tagLine || tagLine.length < 2) {
        throw new Error('Invalid format. Use: **SummonerName#TAG**\nExample: `/link Kaljmarik#EUW`');
      }

      // Check existing link
      if (getLinkedUser(interaction.user.id)) {
        throw new Error('You already have a linked account. Use `/clear` first.');
      }

      // Link account and log PUUID
      const { puuid, gameName: verifiedName, tagLine: verifiedTag } = await linkAccount(
        interaction.user.id,
        gameName,
        tagLine
      );

      // Log the PUUID to console
      console.log(`[LINK] User ${interaction.user.tag} (${interaction.user.id}) linked PUUID: ${puuid}`);

      const successEmbed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle('🔗 Account Linked Successfully')
        .setThumbnail('https://i.imgur.com/8Km9tLL.png')
        .addFields(
          { name: 'Riot ID', value: `\`${verifiedName}#${verifiedTag}\``, inline: true },
          { name: 'PUUID', value: `\`${puuid.slice(0, 8)}...\``, inline: true }
        )
        .setFooter({ text: 'Now try /stats or /matches' });

      await interaction.editReply({ embeds: [successEmbed] });

    } catch (error) {
      console.error(`[LINK ERROR] ${interaction.user.id}:`, error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ Linking Failed')
        .setDescription(error.message.includes('Rate limit') 
          ? '⚠️ Riot API is busy. Please try again in 30 seconds.'
          : error.message)
        .setFooter({ text: 'Need help? Contact server staff' });

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};