import amqp from "amqplib";
import pool from "./db.js";

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://localhost",
    );
    const channel = await connection.createChannel();

    const exchange = "order_events";
    await channel.assertExchange(exchange, "topic", { durable: true });

    const q = await channel.assertQueue("inventory_service_queue", {
      durable: true,
    });
    await channel.bindQueue(q.queue, exchange, "order.placed");

    console.log(
      "🟢 RabbitMQ connected in Inventory Service. Waiting for messages...",
    );

    channel.consume(q.queue, async (msg) => {
      if (msg !== null) {
        try {
          const data = JSON.parse(msg.content.toString());
          console.log("📥 Received order.placed event:", data);

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
