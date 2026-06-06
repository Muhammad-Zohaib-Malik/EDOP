import amqp from "amqplib";
import pool from "./db.js";
import esClient from "./elasticsearch.js";

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://localhost",
    );

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
    });

    connection.on("close", () => {
      console.error("RabbitMQ connection closed. Exiting to trigger restart...");
      process.exit(1);
    });

    const channel = await connection.createChannel();

    const exchange = "order_events";
    await channel.assertExchange(exchange, "topic", { durable: true });

    const q = await channel.assertQueue("inventory_service_queue", {
      durable: true,
    });
    await channel.bindQueue(q.queue, exchange, "order.placed");
    await channel.bindQueue(q.queue, exchange, "order.cancelled");

    console.log(
      "🟢 RabbitMQ connected in Inventory Service. Waiting for messages...",
    );

    channel.consume(q.queue, async (msg) => {
      if (msg !== null) {
        try {
          const routingKey = msg.fields.routingKey;
          const contentStr = msg.content.toString();

          if (!contentStr) {
            console.warn(`⚠️ Received empty message for routing key: ${routingKey}`);
            channel.ack(msg);
            return;
          }

          let data;
          try {
            data = JSON.parse(contentStr);
          } catch (parseError) {
            console.error(`❌ Failed to parse JSON for routing key ${routingKey}:`, contentStr);
            channel.ack(msg);
            return;
          }

          console.log(`📥 Received ${routingKey} event:`, data);

          if (routingKey === "order.placed") {
            const { productId, quantity } = data;

            if (productId && quantity) {
              // Reserve stock
              const result = await pool.query(
                `UPDATE products 
                 SET stock = stock - $1, version = version + 1 
                 WHERE id = $2 AND stock >= $1 
                 RETURNING *`,
                [quantity, productId],
              );

              if (result.rows.length === 0) {
                console.warn(
                  `⚠️ Failed to reserve stock for ${productId} - Insufficient stock or not found`,
                );
              } else {
                console.log(`✅ Reserved ${quantity} of product ${productId}`);
                esClient.index({ index: "products", id: result.rows[0].id, document: result.rows[0] }).catch(e => console.error(e));
              }
            }
          } else if (routingKey === "order.cancelled") {
            const { items } = data;
            if (items && Array.isArray(items)) {
              for (const item of items) {
                const { product_id, quantity } = item;
                if (product_id && quantity) {
                  const result = await pool.query(
                    `UPDATE products 
                     SET stock = stock + $1, version = version + 1 
                     WHERE id = $2 
                     RETURNING *`,
                    [quantity, product_id],
                  );

                  if (result.rows.length > 0) {
                    console.log(`✅ Restored ${quantity} of product ${product_id}`);
                    esClient.index({ index: "products", id: result.rows[0].id, document: result.rows[0] }).catch(e => console.error(e));
                  }
                }
              }
            }
          }

          channel.ack(msg);
        } catch (error) {
          console.error("Error processing message:", error);
          channel.ack(msg);
        }
      }
    });
  } catch (error) {
    console.error("Failed to connect to RabbitMQ in Inventory Service:", error);
    process.exit(1);
  }
};
