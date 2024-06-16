import { Client, Events } from "discord.js";
import {
  loadEnvironmentVariables,
  setDefaultLogLevel,
} from "./library/functions";
import { CommandsHandler } from "./library/handlers/Commands";
import { PriceHandler } from "./PriceHandler";

loadEnvironmentVariables();
setDefaultLogLevel();

const client = new Client({
  intents: [],
});
const commandsHandler = new CommandsHandler();

void client.login(process.env.DISCORD_TOKEN);

client.once("ready", () => {
  void (async () => {
    client.commands = await commandsHandler.getCommandsFromDir();
  })();
});

client.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  commandsHandler.executeCommand(interaction).catch(console.error);
});

client.on(Events.InteractionCreate, (interaction) => {
  if (!interaction.isButton() || !interaction.customId.startsWith("price:"))
    return;

  // console.log(
  //   interaction.customId.split(":")[1],
  //   interaction.customId.split(":")[2],
  // );
  void (async () => {
    const priceHandler = new PriceHandler();
    await interaction.deferReply();
    await priceHandler.replyPrice(
      interaction,
      interaction.customId.split(":")[2],
      interaction.customId.split(":")[1],
    );
  })();
});
