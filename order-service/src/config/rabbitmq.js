import amqp from "amqplib";
import pool from "./db.js";
import esClient from "./elasticsearch.js";

let channel;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(process.env.RABBITMQ_URL);

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
    });

    connection.on("close", () => {
      console.error("RabbitMQ connection closed. Exiting to trigger restart...");
      process.exit(1);
    });

    channel = await connection.createChannel();
    await channel.assertExchange("order_events", "topic", { durable: true });
    
    // Setup consumer for payment success
    const q = await channel.assertQueue("order_service_queue", { durable: true });
    await channel.bindQueue(q.queue, "order_events", "payment.success");
    
    channel.consume(q.queue, async (msg) => {
      if (msg !== null) {
        const contentStr = msg.content.toString();
        try {
          const data = JSON.parse(contentStr);
          if (msg.fields.routingKey === "payment.success") {
            const { orderId } = data;
            console.log(`📥 Received payment.success for order ${orderId}`);
            
            // Update order status in DB
            const result = await pool.query(
              `UPDATE orders SET status=$1 WHERE id=$2 RETURNING *`,
              ["PROCESSING", orderId]
            );
            
            if (result.rows.length) {
              const order = result.rows[0];
              
              // Update in ES
              esClient.update({ index: "orders", id: orderId, doc: { status: "PROCESSING" } })
                .catch((e) => console.error("ES update error:", e.message));
                
              // Publish notification event
              await publishEvent("order.notification.paid", {
                orderId: order.id,
                customerName: order.customer_name,
                customerEmail: order.customer_email,
                totalAmount: order.total_amount,
              });
            }
          }
          channel.ack(msg);
        } catch (error) {
          console.error("Error processing message:", error);
          channel.nack(msg, false, false);
        }
      }
    });

    console.log("🟢 RabbitMQ connected in Order Service");
  } catch (error) {
    console.error("Failed to connect to RabbitMQ in Order Service:", error);
    process.exit(1);
  }
};

export const publishEvent = async (routingKey, data) => {
  if (!channel) {
    console.error("RabbitMQ channel not initialized");
    return;
  }
  try {
    channel.publish(
      "order_events",
      routingKey,
      Buffer.from(JSON.stringify(data)),
      { persistent: true },
    );
  } catch (error) {
    console.error(`Failed to publish event to ${routingKey}:`, error.message);
    throw error;
  }
};
