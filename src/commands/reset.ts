import Bot from '@/bot';
import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from './base';

class ResetCommand extends Command {
  constructor(bot: Bot) {
    const builder = new SlashCommandBuilder().setName('reset').setDescription('Reset all setup tournaments.');
    builder.addStringOption((option) =>
      option.setName('tournament').setDescription('The tournament ID.').setRequired(true),
    );

    super(bot, 'reset', builder);
  }

  async execute(interaction: CommandInteraction) {
    const options = interaction.options.data;

    const tournament = options.find((option) => option.name === 'tournament')?.value;

    if (!tournament) {
      await interaction.reply('Missing required arguments.');
      return;
    }

    const listener = await this.bot.prisma.listener.findUnique({
      where: {
        guildId_tournamentId: {
          tournamentId: tournament as string,
          guildId: interaction.guildId as string,
        },
      },
    });

    if (!listener) {
      await interaction.reply('Tournament not found.');
      return;
    }

    await this.bot.prisma.listener.delete({
      where: {
        guildId_tournamentId: {
          tournamentId: tournament as string,
          guildId: interaction.guildId as string,
        },
      },
    });

    this.bot.removeListener(interaction.guildId as string, tournament as string);

    await interaction.reply('Tournament reset.');
  }
}

export default ResetCommand;
