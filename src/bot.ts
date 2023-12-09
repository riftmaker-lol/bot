import env from '@/env';
import { PrismaClient } from '@prisma/client';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import path from 'path';
import Command from './commands/base';
import Logger from './logger';

class Bot {
  readonly client: Client;
  commands: Collection<string, Command> = new Collection();
  readonly logger: Logger;
  readonly prisma: PrismaClient;

  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
      ],
    });
    this.logger = new Logger({ name: 'Bot' });
    this.prisma = new PrismaClient();
  }

  async registerCommands() {
    const commandsPath = path.join(import.meta.dir, 'commands');
    const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.ts') && file !== 'base.ts');

    this.logger.debug(`Registering ${commandFiles.length} commands.`);

    for (const file of commandFiles) {
      const filePath = path.join(commandsPath, file);
      const command = new (await import(filePath)).default(this);
      this.commands.set(command.name, command);
    }
  }

  async registerListeners() {
    this.client.on(Events.InteractionCreate, async (interaction) => {
      if (!interaction.isCommand()) return;

      const command = this.commands.get(interaction.commandName);

      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        this.logger.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
    });

    this.client.on(Events.ClientReady, (c) => {
      this.logger.info(`Ready! Logged in as ${c.user.tag}`);
    });

    this.client.on(Events.VoiceStateUpdate, (oldState, newState) => {
      // TODO: handle voice state updates
    });
  }

  async start() {
    await this.registerCommands();
    await this.registerListeners();
    await this.client.login(env.DISCORD_TOKEN);
  }
}

export default Bot;
