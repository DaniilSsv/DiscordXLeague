const path = require('path');
const fs = require('fs');
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [];

// Recursively load all commands (including those in subfolders)
function loadCommands(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      loadCommands(filePath);
    } else if (file.isFile() && file.name.endsWith('.js')) {
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
      } else {
        console.warn(`[WARNING] The command at ${filePath} is missing required "data" or "execute" property.`);
      }
    }
  }
}

// Load commands from the "commands" directory
const commandsPath = path.join(__dirname, 'commands');
loadCommands(commandsPath);

// Setup REST client for Discord
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands to the guild
(async () => {
  try {
    console.log(`🔁 Refreshing application (/) commands in guild ${process.env.GUILD_ID}...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );

    console.log(`✅ Successfully deployed ${commands.length} command(s).`);
  } catch (error) {
    console.error('❌ Failed to deploy commands:', error);
  }
})();
