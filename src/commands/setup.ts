import Bot from '@/bot';
import { getTournamentData } from '@/utils';
import { ChannelType, CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from './base';

class SetupCommand extends Command {
  constructor(bot: Bot) {
    const builder = new SlashCommandBuilder().setName('setup').setDescription('Setup tournament organizer');

    builder
      .addStringOption((option) => option.setName('tournament').setDescription('The tournament ID.').setRequired(true))
      .addChannelOption((option) =>
        option
          .setName('lobby')
          .setDescription('The waiting room channel.')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildVoice),
      )
      .addChannelOption((option) =>
        option
          .setName('team1')
          .setDescription('The team 1 channel.')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildVoice),
      )
      .addChannelOption((option) =>
        option
          .setName('team2')
          .setDescription('The team 2 channel.')
          .setRequired(true)
          .addChannelTypes(ChannelType.GuildVoice),
      );

    super(bot, 'setup', builder);
  }

  async execute(interaction: CommandInteraction) {
    const options = interaction.options.data;

    const tournament = options.find((option) => option.name === 'tournament')?.value;
    const lobby = options.find((option) => option.name === 'lobby')?.channel;
    const team1 = options.find((option) => option.name === 'team1')?.channel;
    const team2 = options.find((option) => option.name === 'team2')?.channel;

    if (!tournament || !lobby || !team1 || !team2) {
      await interaction.reply('Missing required arguments.');
      return;
    }

    const tournamentData = await getTournamentData(tournament as string);

    if (!tournamentData) {
      await interaction.reply('Invalid tournament ID.');
      return;
    }

    const listener = await this.bot.prisma.listener.upsert({
      where: {
        guildId_tournamentId: {
          tournamentId: tournament as string,
          guildId: interaction.guildId as string,
        },
      },
      create: {
        tournamentId: tournament as string,
        lobbyChannelId: lobby.id,
        teamChannelIds: [team1.id, team2.id],
        guildId: interaction.guildId as string,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      update: {
        tournamentId: tournament as string,
        lobbyChannelId: lobby.id,
        teamChannelIds: [team1.id, team2.id],
        guildId: interaction.guildId as string,
        updatedAt: new Date(),
      },
    });

    // Add listener to memory
    this.bot.addListener(listener);

    await interaction.reply('Setup complete.');
  }
}

export default SetupCommand;
