import env from '@/env';
import { Listener, PrismaClient } from '@prisma/client';
import { RedisClientType } from '@redis/client';
import { Client, Collection, Events, GatewayIntentBits } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { createClient } from 'redis';
import Command from './commands/base';
import Logger from './logger';
import { watchVCstate } from './utils';

class Bot {
  readonly client: Client;
  readonly logger: Logger;
  readonly prisma: PrismaClient;
  readonly redis: RedisClientType;

  commands: Collection<string, Command> = new Collection();

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
    this.redis = createClient({
      url: env.REDIS_URL,
    });
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

    this.client.on(Events.VoiceStateUpdate, (oldState, newState) => watchVCstate(this, oldState, newState));
  }

  async addListener(listener: Listener) {
    this.logger.debug(
      `Adding listener for guild ${listener.guildId} and tournament ${listener.tournamentId} to redis.`,
    );
    await this.redis.lPush(`guilds:${listener.guildId}:listeners`, JSON.stringify(listener));
  }

  async getListeners(guildId: string) {
    return (await this.redis.lRange(`guilds:${guildId}:listeners`, 0, -1)).map(
      (listener) => JSON.parse(listener) as Listener,
    );
  }

  async getListener(guildId: string) {
    const listeners = await this.getListeners(guildId);
    return listeners.find((listener) => listener.guildId === guildId);
  }

  async removeListener(guildId: string) {
    const listeners = await this.getListeners(guildId);
    const listener = listeners.find((listener) => listener.guildId === guildId);
    if (!listener) return;
    await this.redis.lRem(`guilds:${guildId}:listeners`, 1, JSON.stringify(listener));
  }

  async start() {
    await this.redis
      .on('connect', () => this.logger.info('Redis connected.'))
      .on('error', (err) => this.logger.error('Redis error: %s', err.message || 'Unknown error'))
      .connect();
    await this.registerCommands();
    await this.registerListeners();

    await this.client.login(env.DISCORD_TOKEN);
  }
}

export default Bot;
