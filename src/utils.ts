import { VoiceBasedChannel, VoiceState } from 'discord.js';
import Bot from './bot';
import Logger from './logger';
import { Tournament } from './types';

const logger = new Logger({ name: 'Utils' });

export const getTournamentData = async (tournamentId: string) => {
  try {
    const response = await fetch(`https://riftmaker.lol/api/tournament/${tournamentId}`);
    const data = (await response.json()) as Tournament;
    return data;
  } catch (error) {
    logger.error(error);
  }
};

export const watchVCstate = async (bot: Bot, oldState: VoiceState, newState: VoiceState) => {
  if (oldState.channelId === newState.channelId) return;

  const guildId = newState.guild.id;
  if (!guildId) return;

  const listeners = await bot.getListeners(guildId);
  if (!listeners) return;

  const listener = listeners.find((l) => l.lobbyChannelId === newState.channelId);
  if (!listener) return;

  const lobbyChannel = newState.guild.channels.cache.get(listener.lobbyChannelId);
  const team1Channel = newState.guild.channels.cache.get(listener.teamChannelIds[0]) as VoiceBasedChannel;
  const team2Channel = newState.guild.channels.cache.get(listener.teamChannelIds[1]) as VoiceBasedChannel;

  bot.logger.debug(`Found tournament listener for guild ${guildId}, tournament ${listener.tournamentId}.`);

  if (!lobbyChannel || !team1Channel || !team2Channel) return;

  const connectingUser = newState.member;
  if (!connectingUser) return;

  const tournament = await getTournamentData(listener.tournamentId);
  if (!tournament) return;

  const team1 = tournament.teams[0];
  const team2 = tournament.teams[1];

  if (!team1 || !team2) return;

  const name = connectingUser.user.tag;

  bot.logger.debug(`User: ${name} connected to lobby channel.`);

  const team1Members = team1.players.map((player) => player.name);
  const team2Members = team2.players.map((player) => player.name);

  bot.logger.debug(`Team 1: ${team1Members.join(', ')}`);
  bot.logger.debug(`Team 2: ${team2Members.join(', ')}`);

  const team1Member = team1Members.find((member) => member === name);
  const team2Member = team2Members.find((member) => member === name);

  if (team1Member) {
    bot.logger.debug(`User: ${name} is on team 1.`);
    await connectingUser.voice.setChannel(team1Channel);
  } else if (team2Member) {
    bot.logger.debug(`User: ${name} is on team 2.`);
    await connectingUser.voice.setChannel(team2Channel);
  } else {
    bot.logger.debug(`User: ${name} is not on either team.`);
  }
};
