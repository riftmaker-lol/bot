import Bot from '@/bot';
import { CommandInteraction, SlashCommandBuilder } from 'discord.js';

abstract class Command {
  constructor(
    readonly bot: Bot,
    readonly name: string,
    readonly builder: SlashCommandBuilder,
  ) {}

  abstract execute(interaction: CommandInteraction): Promise<void>;
}

export default Command;
