import { load } from "js-yaml";
import { readdirSync } from "fs";
import axios from "axios";
import fs from "fs/promises";
import StreamZip from "node-stream-zip";
import pgvector from "pgvector";
import Bottleneck from "bottleneck";
import * as cliProgress from "cli-progress";

import { EmbeddingHandler } from "../classes/EmbeddingHandler";
import { SearchHandler } from "../classes/SearchHandler";

import "../library/loadEnvironmentVariables";
import { DatabaseHandler } from "../library/classes/DatabaseHandler";

const bar = new cliProgress.MultiBar(
  {
    format: "{bar} | {eta_formatted} | {percentage}% | {value}/{total}",

    clearOnComplete: true,
    stopOnComplete: true,
  },
  cliProgress.Presets.shades_classic,
);
const bars: cliProgress.SingleBar[] = [];

const databaseHandler = new DatabaseHandler();
const searchHandler = new SearchHandler(databaseHandler);

let isTerminating = false;

async function main() {
  console.log("Downloading Latest types.yaml...");

  // url : href="https://eve-static-data-export.s3-eu-west-1.amazonaws.com/tranquility/fsd.zip"
  // url_checksum : href="https://eve-static-data-export.s3-eu-west-1.amazonaws.com/tranquility/fsd.zip.checksum"
  // https://developers.eveonline.com/resource
  // GET FSD only

  // eslint-disable-next-line prefer-const
  let [exists, filePath] = checkFileExists();

  if (exists) {
    console.log("fsd.zip already exists, skipping download...");

    const checksum = await getChecksum();
    if (filePath !== "fsd." + checksum + ".zip") {
      console.log(
        "Warning! Checksum mismatch. please delete the file and re-run the script.",
      );

      return;
    }
  } else {
    const response = await axios({
      url: "https://eve-static-data-export.s3-eu-west-1.amazonaws.com/tranquility/fsd.zip",
      method: "GET",
      responseType: "arraybuffer",
    });

    console.log("Downloaded Latest types.yaml");
    const checksum = await getChecksum();

    console.log("Writing to file...");

    filePath = "fsd." + checksum + ".zip";
    const fileData = Buffer.from(response.data as ArrayBuffer);
    await fs.writeFile(filePath, fileData);

    console.log("Finished writing to file...");
  }

  console.log("File Ready! Extracting types.yaml...");
  const zip = new StreamZip({ file: filePath });
  zip.on("error", (err) => {
    throw err;
  });
  zip.on("entry", (entry) => {
    if (entry.name === "types.yaml") {
      console.log("found types.yaml...");
      zip.stream(entry.name, (err, stream) => {
        if (err || !stream) {
          throw err || new Error("Stream is undefined");
        }

        let data = "";
        stream.on("data", (chunk) => {
          data += chunk;
        });
        stream.on("end", () => {
          const parsedData: TypeEntry = load(data) as TypeEntry;
          processTypes(parsedData);
        });
      });
    }
  });
}

function processTypes(types: TypeEntry) {
  console.log("Start importing types...");
  bars.push(bar.create(Object.keys(types).length, 0));

  for (const typeID of Object.keys(types)) {
    if (isTerminating) {
      console.error("Terminating Scheduler...");
      break;
    }

    // console.log("processing typeID:", typeID);

    const typeValue = applyCustomValue(
      parseInt(typeID),
      types[parseInt(typeID)],
    );
    // console.log("data:", types[parseInt(typeID)]);

    // check typeData has marketGroupID
    if (!typeValue.marketGroupID) {
      bars[0].increment();
      continue;
    }

    void insertMarketItemWithRateLimit(parseInt(typeID), typeValue).catch(
      (error) => {
        if (error instanceof Bottleneck.BottleneckError) {
          if (error.message != "This limiter has been stopped.") {
            console.error(
              "BottleneckError while inserting market item:\n",
              error,
            );
          }
        }

        if (!(error instanceof Bottleneck.BottleneckError)) {
          bar.stop();
          console.error("Error while inserting market item:\n", error);
          if (!isTerminating) {
            void limiter.stop();
            isTerminating = true;
          }
        }
      },
    );
  }
}

// SDE 에 한글 이름이 없는 아이템이 있는데, 이를 보완하기 위해 필요
// + 한글 이름을 변경해야 하는 아이템이 있는 경우 이를 처리
function applyCustomValue(typeID: number, typeValue: TypeValue): TypeValue {
  switch (typeID) {
    case 84992:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Ryhad's Modified Medium Energy Neutralizer";
      break;
    case 84993:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Ryhad's Modified Medium Energy Nosferatu";
      break;
    case 85015:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Nija's Modified Heavy Pulse Laser";
      break;
    case 85014:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Nija's Modified Heavy Beam Laser";
      break;
    case 85023:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Hanaruwa's Modified Heavy Assault Missile Launcher";
      break;
    case 85305:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Scars of Sarikusa - Limited";
      break;
    case 85316:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Atavum";
      break;
    case 85405:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Consensus Drift - Limited";
      break;
    case 85406:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Stellar Indigo Chrome Metallic - Limited";
      break;
    case 85403:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Managerial Black Matte - Limited";
      break;
    case 85404:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Council Meeting Beige Matte - Limited";
      break;
    case 85753:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Murky Pravda Satin - Limited";
      break;
    case 85754:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Azure Istina Gloss - Limited";
      break;
    case 85752:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Glorified Ruby Gloss - Limited";
      break;
    case 85849:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Deathless Research Honorarium";
      break;
    case 85845:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "Winter Bloom Matte - Limited";
      break;
    case 85979:
      if (typeValue.name.ko)
        throw new Error("typeID: " + typeID + " already has a korean name.");
      typeValue.name.ko = "CONCORD Victory SKIN";
      break;
    case 44992:
      // PLEX
      typeValue.name.ko = "플렉스";
      break;
    default:
  }

  return typeValue;
}
async function insertMarketItem(typeID: number, typeData: TypeValue) {
  if (isTerminating) return;

  const check = await searchHandler.doSearchFromTypeID(typeID);
  let isNameChanged = false;

  if (check.length > 0) {
    if (
      check[0].name_en != typeData.name.en ||
      check[0].name_ko != typeData.name.ko
    ) {
      bar.log("name of typeID " + typeID + " is changed. need updating" + "\n");
      isNameChanged = true;
    } else {
      bar.log("name not changed. skipping typeID " + typeID + "\n");
      bars[0].increment();
      return;
    }
  }

  const embeddingHandler = new EmbeddingHandler();

  const enString = typeData.name.en;
  const enEmbedding = await embeddingHandler.getEmbedding(enString);
  const koString = typeData.name.ko;
  if (!koString) {
    throw new Error(
      "WARNING! typeID: " + typeID + " does not have a korean name.",
    );
  }
  const koEmbedding = await embeddingHandler.getEmbedding(koString);
  bar.log("calculated embedding for typeID: " + typeID + "\n");
  // console.log(
  //   "calculated embedding for typeID:",
  //   typeID,
  //   enString,
  //   enEmbedding,
  //   koString,
  //   koEmbedding,
  // );

  if (isNameChanged) {
    await databaseHandler.query(
      "UPDATE market_items SET name_en = $1, name_ko = $2, embedding_en = $3, embedding_ko = $4 WHERE type_id = $5",
      [
        enString,
        koString,
        pgvector.toSql(enEmbedding),
        pgvector.toSql(koEmbedding),
        typeID,
      ],
    );
  } else {
    await databaseHandler.query(
      "INSERT INTO market_items (type_id, name_en, name_ko, embedding_en, embedding_ko) VALUES ($1, $2, $3, $4, $5)",
      [
        typeID,
        enString,
        koString,
        pgvector.toSql(enEmbedding),
        pgvector.toSql(koEmbedding),
      ],
    );
  }

  bars[0].increment();
}

// 3000 requests per minute
// 50 requests per second
// 요청당 20ms지만 한 함수에서 두 번 요청하므로 40ms 딜레이 필요
const limiter = new Bottleneck({
  minTime: 40,
});
const insertMarketItemWithRateLimit = limiter.wrap(insertMarketItem);
// https://platform.openai.com/docs/api-reference/embeddings/create

async function getChecksum(): Promise<string> {
  console.log("getting checksum from CCP...");

  const checksum = await axios({
    url: "https://eve-static-data-export.s3-eu-west-1.amazonaws.com/tranquility/fsd.zip.checksum",
    method: "GET",
    responseType: "text",
  });

  console.log("checksum:", checksum.data);
  return checksum.data as string;
}

function checkFileExists(): [true, string] | [false, null] {
  const regex = /^fsd\.[a-f0-9]{32}\.zip$/;

  const filePaths = readdirSync(".");
  for (const filePath of filePaths) {
    if (regex.exec(filePath)) {
      return [true, filePath];
    }
  }

  return [false, null];
}

type TypeEntry = Record<number, TypeValue>;

// FIXME: 타입 확실하지 않음
interface TypeValue {
  description?: translationObject;
  graphicID?: number;
  groupID: number;
  iconID?: number;
  marketGroupID?: number;
  mass: number;
  name: translationObject;
  portionSize: number;
  published: boolean;
  radius: number;
  soundID?: number;
  volume?: number;
}

interface translationObject {
  de?: string;
  en: string;
  es?: string;
  fr?: string;
  ja?: string;
  ko?: string;
  ru?: string;
  zh?: string;
}

void main();

process.on("SIGINT", () => {
  bar.stop();
  if (isTerminating) {
    console.log("SIGINT received again. Terminating immediately...");
    process.exit(0);
  }
  console.log("\nSIGINT received. Terminating ALL JOBS...");
  isTerminating = true;
  void limiter.stop();
});
