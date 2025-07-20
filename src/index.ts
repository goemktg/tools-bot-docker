import { Client } from "discord.js";
import {
  loadEnvironmentVariables,
  setDefaultLogLevel,
} from "./library/functions";
import { CommandsHandler } from "./library/classes/CommandsHandler";
import { DatabaseEngine } from "./library/classes/DatabaseEngine";

loadEnvironmentVariables();
setDefaultLogLevel();

const client = new Client({
  intents: [],
});
client.databaseEngine = new DatabaseEngine();

void client.login(process.env.DISCORD_TOKEN);

client.once("ready", () => {
  void (async () => {
    client.commands = await CommandsHandler.getCommandsFromDir();
  })();
});
