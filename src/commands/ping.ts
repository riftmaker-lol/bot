import Bot from '@/bot';
import { CommandInteraction, SlashCommandBuilder } from 'discord.js';
import Command from './base';

class PingCommand extends Command {
  constructor(bot: Bot) {
    super(bot, 'ping', new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'));
  }

  async execute(interaction: CommandInteraction) {
    await interaction.reply('pong!');
  }
}

export default PingCommand;
