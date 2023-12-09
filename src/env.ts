import { bool, cleanEnv, str } from 'envalid';

const env = cleanEnv(process.env, {
  NODE_ENV: str({ choices: ['development', 'production'] }),
  DISCORD_TOKEN: str(),
  ENABLED: bool({ default: true }),
});

export default env;
