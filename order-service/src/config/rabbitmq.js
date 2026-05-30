import amqp from "amqplib";

let channel;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL,
    );
    channel = await connection.createChannel();
    await channel.assertExchange("order_events", "topic", { durable: true });
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
  channel.publish(
    "order_events",
    routingKey,
    Buffer.from(JSON.stringify(data)),
  );
};
