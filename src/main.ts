import Bot from './bot';
import env from './env';

try {
  const bot = new Bot();
  if (env.ENABLED) await bot.start();
  else console.warn('Bot is disabled.');
} catch (error) {
  console.error(error);
}
