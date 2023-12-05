import {Client, Events, GatewayIntentBits} from 'discord.js';
import env from '@/env';

const client = new Client({intents: [GatewayIntentBits.Guilds]});

client.once(Events.ClientReady, (c) => {
  console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.login(env.DISCORD_TOKEN);
