import { cleanEnv, str } from "envalid";

const env = cleanEnv(process.env, {
    NODE_ENV: str({ choices: ["development", "production"] }),
    DISCORD_TOKEN: str(),
});

export default env;