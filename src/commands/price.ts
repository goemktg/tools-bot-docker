import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} from "discord.js";
import { SlashCommand } from "../library/types";
import { SearchHandler } from "../SearchHandler";
import { PriceHandler } from "../PriceHandler";

const GrillReloadCommand: SlashCommand = {
  command: new SlashCommandBuilder()
    .setName("price")
    .setDescription("아이템의 가격을 검색합니다")
    .addStringOption((option) =>
      option
        .setName("itemname")
        .setDescription("가격을 검색할 아이템의 이름")
        .setRequired(true),
    )
    .setDefaultMemberPermissions(0),
  execute: (interaction) => {
    const itemName = interaction.options.getString("itemname");
    if (itemName === null) {
      void interaction.reply("아이템 이름을 입력해주세요");
      return;
    }

    const searchHandler = new SearchHandler();
    void (async () => {
      await interaction.deferReply();

      const searchResult = await searchHandler.doSearch(itemName);
      if (searchResult.length > 0) {
        const priceHandler = new PriceHandler();
        await priceHandler.replyPrice(
          interaction,
          searchResult[0].name_en + " (" + searchResult[0].name_ko + ")",
          searchResult[0].type_id.toString(),
        );
        return;
      }

      const smartSearchResult = await searchHandler.doSmartSearch(itemName);
      const row = new ActionRowBuilder<ButtonBuilder>();

      for (const result of smartSearchResult) {
        const button = new ButtonBuilder()
          .setStyle(ButtonStyle.Secondary)
          .setLabel(result.name_en + " (" + result.name_ko + ")")
          .setCustomId(
            "price:" +
              result.type_id.toString() +
              ":" +
              result.name_en +
              " (" +
              result.name_ko +
              ")",
          );

        row.addComponents(button);
      }

      void interaction.followUp({
        content:
          "`" +
          itemName +
          "`라는 아이템을 찾지 못했습니다. 혹시 다음 아이템을 찾으셨나요?",
        components: [row],
      });
    })();
  },
};
export default GrillReloadCommand;
