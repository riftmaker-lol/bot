import Bot from '@/bot';
import env from '@/env';
import Logger from '@/logger';
import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';

const logger = new Logger({ name: 'Deploy Commands' });

const registerCommands = async () => {
  const commands = [];
  const bot = new Bot();
  const commandsPath = path.join(import.meta.dir, '..', 'src', 'commands');
  logger.debug(`Commands path: ${commandsPath}`);
  const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts') && file !== 'base.ts');

  logger.debug(`Registering ${commandFiles.length} commands.`);

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = new (await import(filePath)).default(bot);
    commands.push(command.builder.toJSON());
  }

  return commands;
};

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(env.DISCORD_TOKEN);

try {
  const commands = await registerCommands();
  logger.info(`Started refreshing ${commands.length} application (/) commands.`);

  // The put method is used to fully refresh all commands in the guild with the current set
  const data = (await rest.put(Routes.applicationCommands('1177712225692172418'), { body: commands })) as unknown[];

  logger.info(`Successfully reloaded ${data.length} application (/) commands.`);
} catch (error) {
  // And of course, make sure you catch and log any errors!
  console.error(error);
}
