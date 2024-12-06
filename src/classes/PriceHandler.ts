import {
  ButtonInteraction,
  CommandInteraction,
  EmbedBuilder,
} from "discord.js";
import { EsiRequester } from "../library/classes/EsiHandler";
import axios from "axios";
import QuickChart from "quickchart-js";

export class PriceHandler {
  async replyPrice(
    interaction: CommandInteraction | ButtonInteraction,
    itemName: string,
    itemTypeID: string,
  ) {
    await interaction.editReply(
      "아이템 `" + itemName + "`의 가격을 검색중입니다...",
    );
    const esiRequester = new EsiRequester();
    const priceHistory =
      await esiRequester.getPriceHistoryFromTypeIdAndRegionId(
        "10000002",
        itemTypeID.toString(),
      );

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

    // make charts
    //console.log(priceHistory);
    const thirtyDayPriceHistory = priceHistory.slice(
      priceHistory.length - 30,
      priceHistory.length,
    );
    //console.log(thirtyDayPriceHistory);
    const myChart = new QuickChart();
    myChart.setConfig({
      type: "line",
      data: {
        labels: thirtyDayPriceHistory.map((x) => x.date),
        datasets: [
          {
            label: "average",
            data: thirtyDayPriceHistory.map((x) => x.average),
            fill: false,
          },
          {
            label: "highest",
            data: thirtyDayPriceHistory.map((x) => x.highest),
            fill: false,
            borderDash: [2, 2],
          },
          {
            label: "lowest",
            data: thirtyDayPriceHistory.map((x) => x.lowest),
            fill: false,
            borderDash: [2, 2],
          },
        ],
      },
      options: {
        scales: {
          xAxes: [
            {
              type: "time",
              time: {
                parser: "YYYY-MM-DD",
                displayFormats: {
                  day: "MMM DD",
                },
              },
            },
          ],
          yAxes: [
            {
              ticks: {
                callback: (val: number) => {
                  if (!val) return 0;
                  const units = ["", "K", "M", "B"];
                  const k = 1000;
                  const magnitude = Math.floor(Math.log(val) / Math.log(k));
                  return val / Math.pow(k, magnitude) + " " + units[magnitude];
                },
              },
            },
          ],
        },
      },
    });

    const historyEmbed = new EmbedBuilder()
      .setTitle("가격 기록")
      .setImage("attachment://chart.png")
      .setDescription(
        itemName + "\n포지 리전 최근 30일간 중간/최고/최저 거래가격 변동 내역",
      )
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed, historyEmbed],
      files: [
        {
          name: "chart.png",
          attachment: myChart.getUrl(),
        },
      ],
    });
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
