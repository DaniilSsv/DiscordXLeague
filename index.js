const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');

// Create a new Discord client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Set up the commands collection for the bot
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');

// Load command files from the 'commands' folder
const commandFolders = fs.readdirSync(foldersPath, { withFileTypes: true });
for (const folder of commandFolders) {
  if (folder.isDirectory()) {
    const commandsPath = path.join(foldersPath, folder.name);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.warn(`[WARNING] The command at ${filePath} is missing required "data" or "execute" property.`);
      }
    }
  } else if (folder.isFile() && folder.name.endsWith('.js')) {
    const filePath = path.join(foldersPath, folder.name);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(`[WARNING] The command at ${filePath} is missing required "data" or "execute" property.`);
    }
  }
}

client.on('interactionCreate', async (interaction) => {
  if (interaction.isCommand()) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
      console.error('Command not found!');
      return;
    }

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true
      });
    }
  }

  // 🔽 Handle button interactions for match pagination
  else if (interaction.isButton()) {
    const { getLinkedUser, getMatchesForUser } = require('./services/userService');
    const { createMatchEmbed } = require('./utils/matchEmbedUtils'); // ⬅️ We should extract embed logic for reuse

    const userId = interaction.user.id;
    const user = getLinkedUser(userId);

    if (!user) {
      return interaction.reply({
        content: 'You need to link your account first using `/link`.',
        ephemeral: true
      });
    }

    const matchData = getMatchesForUser(userId);
    if (!matchData) {
      return interaction.reply({
        content: 'Match data not found. Use `/matches` again to refresh.',
        ephemeral: true
      });
    }

    const { matches, currentIndex } = matchData;
    let newIndex = currentIndex;

    if (interaction.customId === 'next_match') {
      newIndex = Math.min(matches.length - 1, currentIndex + 1);
    } else if (interaction.customId === 'prev_match') {
      newIndex = Math.max(0, currentIndex - 1);
    }

    // Update the stored index
    user.matchData.currentIndex = newIndex;

    // Build the updated embed
    const embed = createMatchEmbed(matches[newIndex], user);
    const components = require('./commands/matches')._createActionRow(matches.length, newIndex);

    await interaction.update({
      embeds: [embed],
      components
    });
  }
});

// Register commands with Discord (re-deploy on bot start)
const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`Deploying ${commands.length} commands to guild ${process.env.GUILD_ID}...`);
    
    // Deploy the commands to the guild
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    
    console.log('✅ Commands deployed!');
  } catch (error) {
    console.error(error);
  }
})();

// Handle events (from 'events' folder)
const eventsPath = path.join(__dirname, 'events');
try {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args));
    } else {
      client.on(event.name, (...args) => event.execute(...args));
    }
  }
} catch (error) {
  console.warn("No event files found, skipping event registration.");
}

// Log in to Discord
client.login(process.env.DISCORD_TOKEN); // Using DISCORD_TOKEN
