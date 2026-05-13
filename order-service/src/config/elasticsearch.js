import { Client } from "@elastic/elasticsearch";

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
});

export const initOrdersIndex = async () => {
  const exists = await esClient.indices.exists({ index: "orders" });
  if (!exists) {
    await esClient.indices.create({ index: "orders" });
    console.log("✅ Elasticsearch `orders` index created");
  }
};

export default esClient;
