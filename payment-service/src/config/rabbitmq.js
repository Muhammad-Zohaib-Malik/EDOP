import amqp from "amqplib";

let channel;

export const connectRabbitMQ = async () => {
  try {
    const rabbitMqUrl = process.env.RABBITMQ_URL || "amqp://localhost";
    const connection = await amqp.connect(rabbitMqUrl);

    connection.on("error", (err) => {
      console.error("RabbitMQ connection error:", err);
    });

    connection.on("close", () => {
      console.error("RabbitMQ connection closed. Exiting to trigger restart...");
      process.exit(1);
    });

    channel = await connection.createChannel();
    await channel.assertExchange("order_events", "topic", { durable: true });
    console.log("🟢 RabbitMQ connected in Payment Service");
  } catch (error) {
    console.error("Failed to connect to RabbitMQ in Payment Service:", error);
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
