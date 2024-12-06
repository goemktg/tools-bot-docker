import axios from "axios";

export class EmbeddingHandler {
  apiInfo: APIInfo;
  constructor() {
    if (process.env.EMBEDDING_API_URL === undefined) {
      throw new Error("EMBEDDING_API_URL is not defined");
    }
    if (process.env.EMBEDDING_MODEL_TYPE === undefined) {
      throw new Error("EMBEDDING_MODEL_TYPE is not defined");
    }
    if (process.env.EMBEDDING_API_KEY === undefined) {
      throw new Error("EMBEDDING_API_KEY is not defined");
    }

    this.apiInfo = {
      modelType: process.env.EMBEDDING_MODEL_TYPE,
      url: process.env.EMBEDDING_API_URL,
      key: process.env.EMBEDDING_API_KEY,
    };
  }
  async getEmbedding(translation: string): Promise<number[]> {
    const response = await axios.post(
      this.apiInfo.url,
      {
        input: translation,
        model: this.apiInfo.modelType,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiInfo.key}`,
        },
      },
    );

    return (response.data as APIGetEmbeddingResponse).data[0].embedding;
  }
}

interface APIInfo {
  modelType: string;
  url: string;
  key: string;
}

interface APIGetEmbeddingResponse {
  object: "list";
  data: [
    {
      object: "embedding";
      embedding: number[];
      index: number;
    },
  ];
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}
