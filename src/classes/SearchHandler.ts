import pgvector from "pgvector";
import { EmbeddingHandler } from "./EmbeddingHandler";
import { DatabaseHandler } from "../library/classes/DatabaseHandler";

export class SearchHandler {
  private databaseHandler: DatabaseHandler;

  constructor(databaseHandler: DatabaseHandler) {
    this.databaseHandler = databaseHandler;
  }

  async doSearch(value: string): Promise<SimpleMarketItemsTableRecord[] | []> {
    const query = `SELECT DISTINCT type_id, name_en, name_ko 
                   FROM market_items 
                   WHERE name_en = $1 OR name_ko = $1`;
    const result = await this.databaseHandler.query(query, [value]);

    return result.rows as SimpleMarketItemsTableRecord[];
  }

  async doSearchFromTypeID(
    typeID: number,
  ): Promise<MarketItemsTableRecord[] | []> {
    const result = await this.databaseHandler.query(
      "SELECT * FROM market_items WHERE type_id = $1",
      [typeID],
    );

    return result.rows as MarketItemsTableRecord[];
  }

  async doSmartSearch(value: string): Promise<MarketItemsTableRecord[]> {
    if (process.env.EMBEDDING_API_URL === undefined) {
      throw new Error("EMBEDDING_API_URL is not defined");
    }

    const embeddingHandler = new EmbeddingHandler();
    const embeddingResponse = await embeddingHandler.getEmbedding(value);

    // embedding들의 cosine 유사도 계산
    const query = `SELECT type_id, name_en, name_ko, GREATEST(1 - (embedding_en <-> $1), 1 - (embedding_ko <-> $1)) AS similarity
                   FROM market_items
                   ORDER BY similarity DESC
                   LIMIT 5`;
    const embeddingValue = [pgvector.toSql(embeddingResponse)];
    const result = await this.databaseHandler.query(query, embeddingValue);
    return result.rows as MarketItemsTableRecord[];
  }
}

interface SimpleMarketItemsTableRecord {
  type_id: number;
  name_en: string;
  name_ko: string;
}

interface MarketItemsTableRecord extends SimpleMarketItemsTableRecord {
  embedding_en: string;
  embedding_ko: string;
}
