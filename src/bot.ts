import env from '@/env';
import { PrismaClient } from '@prisma/client';
import { Client, Collection, Events, GatewayIntentBits, VoiceBasedChannel } from 'discord.js';
import fs from 'fs';
import path from 'path';
import Command from './commands/base';
import Logger from './logger';
import { getTournamentData } from './utils';

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

    this.client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
      if (oldState.channelId === newState.channelId) return;

      const guildId = newState.guild.id;
      if (!guildId) return;

      const listener = await this.prisma.listener.findFirst({
        where: {
          guildId: guildId,
        },
      });

      if (!listener) return;

      const lobbyChannel = newState.guild.channels.cache.get(listener.lobbyChannelId);
      const team1Channel = newState.guild.channels.cache.get(listener.teamChannelIds[0]) as VoiceBasedChannel;
      const team2Channel = newState.guild.channels.cache.get(listener.teamChannelIds[1]) as VoiceBasedChannel;

      this.logger.debug(`Found tournament listener for guild ${guildId}.\n${JSON.stringify(listener, null, 2)}`);

      if (!lobbyChannel || !team1Channel || !team2Channel) return;
      if (newState.channelId !== lobbyChannel.id) return;

      const connectingUser = newState.member;
      if (!connectingUser) return;

      const tournament = await getTournamentData(listener.tournamentId);
      if (!tournament) return;

      const team1 = tournament.teams[0];
      const team2 = tournament.teams[1];

      if (!team1 || !team2) return;

      const name = connectingUser.user.tag;

      this.logger.debug(`User: ${name} connected to lobby channel.`);

      const team1Members = team1.players.map((player) => player.name);
      const team2Members = team2.players.map((player) => player.name);

      this.logger.debug(`Team 1: ${team1Members.join(', ')}`);
      this.logger.debug(`Team 2: ${team2Members.join(', ')}`);

      const team1Member = team1Members.find((member) => member === name);
      const team2Member = team2Members.find((member) => member === name);

      if (team1Member) {
        this.logger.debug(`User: ${name} is on team 1.`);
        await connectingUser.voice.setChannel(team1Channel);
      } else if (team2Member) {
        this.logger.debug(`User: ${name} is on team 2.`);
        await connectingUser.voice.setChannel(team2Channel);
      } else {
        this.logger.debug(`User: ${name} is not on either team.`);
      }
    });
  }

  async start() {
    await this.registerCommands();
    await this.registerListeners();
    await this.client.login(env.DISCORD_TOKEN);
  }
}

export default Bot;
