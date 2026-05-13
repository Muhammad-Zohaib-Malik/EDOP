import { Client } from "@elastic/elasticsearch";

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

export const initProductsIndex = async () => {
  const exists = await esClient.indices.exists({ index: "products" });
  if (!exists) {
    await esClient.indices.create({ index: "products" });
    console.log("Elasticsearch `products` index created");
  }
};

export default esClient;
