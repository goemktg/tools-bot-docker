import {
  ButtonInteraction,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
// import { EsiRequester } from "./library/handlers/EsiRequester";
import axios from "axios";
// import vega, { Spec } from "vega";
// import sharp from "sharp";
// import spec from "./static/vega_spec.json";

export class PriceHandler {
  async replyPrice(
    interaction: CommandInteraction | ButtonInteraction,
    itemName: string,
    itemTypeID: string,
  ) {
    await interaction.editReply(
      "아이템 `" + itemName + "`의 가격을 검색중입니다...",
    );
    // const esiRequester = new EsiRequester();
    // const priceHistory =
    //   await esiRequester.getPriceHistoryFromTypeIdAndRegionId(
    //     "10000002",
    //     itemTypeID.toString(),
    //   );

    const currentPriceResponse = await axios.get(
      "https://market.fuzzwork.co.uk/aggregates/?region=10000002&types=" +
        itemTypeID,
    );
    const currentPriceData = (
      currentPriceResponse.data as FuzzWorkMarketAPIResponse
    )[itemTypeID];

    const embed = new EmbedBuilder()
      .setColor(0x0099ff)
      .setTitle(itemName + "의 현재 가격")
      .setDescription(
        "지역이름: The Forge (포지)\n" +
          "현재 최저 판매가: " +
          parseFloat(currentPriceData.sell.min).toLocaleString() +
          " ISK\n" +
          "현재 최고 구매가: " +
          parseFloat(currentPriceData.buy.max).toLocaleString() +
          " ISK",
      )
      .setThumbnail(
        "https://images.evetech.net/types/" + itemTypeID + "/icon?size=64",
      );
    await interaction.editReply({
      content: "",
      embeds: [embed],
    });

    // TODO: 히스토리 기능 추가
    // spec.data[0].values = priceHistory;

    // // TODO: fix unknown to resolve type error
    // const view = new vega.View(vega.parse(spec as unknown as Spec))
    //   .renderer("none")
    //   .initialize();

    // const svg = await view.toSVG();
    // const webp = await sharp(Buffer.from(svg)).webp().toBuffer();
    // await interaction.editReply({
    //   files: [
    //     {
    //       attachment: webp,
    //       name: "price.webp",
    //     },
    //   ],
    // });
  }
}

type FuzzWorkMarketAPIResponse = Record<string, FuzzWorkMarketAPIPriceObject>;

interface FuzzWorkMarketAPIPriceObject {
  buy: {
    weightedAverage: string;
    max: string;
    min: string;
    stddev: string;
    median: string;
    volume: string;
    orderCount: string;
    percentile: string;
  };
  sell: {
    weightedAverage: string;
    max: string;
    min: string;
    stddev: string;
    median: string;
    volume: string;
    orderCount: string;
    percentile: string;
  };
}
