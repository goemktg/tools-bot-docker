import { Pool } from "pg";
import axios from "axios";
import pgvector from "pgvector";
import { APIGetEmbeddingResponse } from "./EmbeddingHandler";

const databaseClient = new Pool({
  host: process.env.POSTGRES_HOST,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PW,
  database: process.env.POSTGRES_DB,
  port: 5432,
  max: 5,
});

export class SearchHandler {
  constructor() {
    void databaseClient.connect();
  }

  async doSearch(value: string): Promise<MarketItemsTableRecord[] | []> {
    const query =
      "SELECT embeddings.type_id, names_en.name_en, names_ko.name_ko FROM item_embeddings as embeddings	JOIN item_names_en AS names_en ON embeddings.type_id = names_en.type_id JOIN item_names_ko AS names_ko ON embeddings.type_id = names_ko.type_id	WHERE name = $1";
    const result = await databaseClient.query(query, [value]);

    return result.rows as MarketItemsTableRecord[];
  }

  async doSmartSearch(value: string): Promise<MarketItemsTableRecord[]> {
    if (process.env.EMBEDDING_API_URL === undefined) {
      throw new Error("EMBEDDING_API_URL is not defined");
    }

    const embeddingResponse = await axios.post(
      process.env.EMBEDDING_API_URL,
      {
        input: value,
        model: process.env.EMBEDDING_MODEL_TYPE,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.EMBEDDING_API_KEY}`,
        },
      },
    );

    // embedding들의 cosine 유사도 계산
    const query = `SELECT embeddings.type_id, names_en.name_en, names_ko.name_ko, 1 - (embedding <=> $1) AS similarity FROM item_embeddings AS embeddings JOIN item_names_en AS names_en ON embeddings.type_id = names_en.type_id JOIN item_names_ko AS names_ko ON embeddings.type_id = names_ko.type_id ORDER BY similarity DESC LIMIT 10`;
    const embeddingValue = [
      pgvector.toSql(
        (embeddingResponse.data as APIGetEmbeddingResponse).data[0].embedding,
      ),
    ];
    const result = await databaseClient.query(query, embeddingValue);
    return result.rows as MarketItemsTableRecord[];
  }
}

export interface MarketItemsTableRecord {
  type_id: number;
  name_en: string;
  name_ko: string;
  embedding_en: string;
  embedding_ko: string;
}
