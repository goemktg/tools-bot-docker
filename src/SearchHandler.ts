import { Pool } from "pg";
import axios from "axios";
import pgvector from "pgvector";

const databaseClient = new Pool({
  host: process.env.PostgresHOST,
  user: process.env.PostgresUSER,
  password: process.env.PostgresPW,
  database: process.env.PostgresDB,
  port: 6543,
  max: 5,
});

export class SearchHandler {
  regexKorean = /[ㄱ-ㅎ|ㅏ-ㅣ|가-힣]/gi;
  regexEnglish = /[a-zA-Z]/gi;

  constructor() {
    void databaseClient.connect();
  }

  async doSearch(value: string): Promise<SearchResult[] | []> {
    const [primaryLanguage, languageValue] = this.getPrimaryLanguage(value);

    const query =
      `SELECT id, typeid, name_eng, name_kor FROM items WHERE name_` +
      primaryLanguage +
      `=$1`;
    const result = await databaseClient.query(query, [languageValue]);
    // console.log(query, languageValue, result.rows);
    return result.rows as SearchResult[];
  }

  async doSmartSearch(value: string): Promise<SearchResult[]> {
    if (process.env.EmbeddingAPIURL === undefined) {
      throw new Error("EmbeddingAPIURL is not defined");
    }

    const embeddingResponse = await axios.post(
      process.env.EmbeddingAPIURL,
      {
        input: value,
        model: process.env.EmbeddingModel,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EmbeddingAPIKey}`,
        },
      },
    );

    // embedding들의 cosine 유사도 계산
    const query = `SELECT id, typeid, name_eng, name_kor, 1 - (embedding <=> $1) AS similarity FROM items ORDER BY similarity DESC LIMIT 5`;
    const embeddingValue = [
      pgvector.toSql(
        (embeddingResponse.data as EmbeddingAPIResponse).data[0].embedding,
      ),
    ];
    const result = await databaseClient.query(query, embeddingValue);
    return result.rows as SearchResult[];
  }

  getPrimaryLanguage(value: string): ["kor" | "eng", string] {
    const koreanValue = value.replace(this.regexEnglish, "");
    const englishValue = value.replace(this.regexKorean, "");

    // console.log("kor:", koreanValue.length);
    // console.log("eng:", englishValue.length);
    if (englishValue.length >= koreanValue.length) {
      return ["eng", englishValue];
    }

    return ["kor", koreanValue];
  }
}

interface EmbeddingAPIResponse {
  data: [EmbeddingAPIResponseData];
}

interface EmbeddingAPIResponseData {
  object: "embedding";
  embedding: number[];
}

interface SearchResult {
  id: string;
  typeid: number;
  name_eng: string;
  name_kor: string;
  similarity: number;
}
