export interface APIGetEmbeddingResponse {
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
