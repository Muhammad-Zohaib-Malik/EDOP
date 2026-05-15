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
export const initProductsIndex = async () => {
  const exists = await esClient.indices.exists({ index: "products" });
  if (!exists) {
    await esClient.indices.create({ index: "products" });
    console.log("Elasticsearch `products` index created");
  }
};

export default esClient;
