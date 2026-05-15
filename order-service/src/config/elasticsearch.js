import { Client } from "@elastic/elasticsearch";

const esClient = new Client({
  node: process.env.ELASTICSEARCH_URL || "https://localhost:9200",
  auth: {
    username: process.env.ELASTICSEARCH_USERNAME || "elastic",
    password: process.env.ELASTICSEARCH_PASSWORD || "5C72j5N_AtlL+5AfuqYh",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const initOrdersIndex = async () => {
  const exists = await esClient.indices.exists({ index: "orders" });
  if (!exists) {
    await esClient.indices.create({ index: "orders" });
    console.log("✅ Elasticsearch `orders` index created");
  }
};

export default esClient;
