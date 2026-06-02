import amqp from "amqplib";
import { sendEmail } from "../utils/nodemailer.js";

let channel;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(
      process.env.RABBITMQ_URL || "amqp://localhost",
    );
    channel = await connection.createChannel();

    // Only process one message at a time — don't grab more until acked
    await channel.prefetch(1);

    const exchange = "order_events";
    await channel.assertExchange(exchange, "topic", { durable: true });

    const q = await channel.assertQueue("notification_queue", {
      durable: true,
    });

    // Bind to placed, cancelled, and delivered events
    await channel.bindQueue(q.queue, exchange, "order.notification.placed");
    await channel.bindQueue(q.queue, exchange, "order.notification.cancelled");
    await channel.bindQueue(q.queue, exchange, "order.notification.delivered");

    console.log("🟢 RabbitMQ connected in Notification Service");

    channel.consume(q.queue, async (msg) => {
      if (msg !== null) {
        const routingKey = msg.fields.routingKey;
        const contentStr = msg.content.toString();

        if (!contentStr) {
          console.warn(
            `⚠️ Received empty message for routing key: ${routingKey}`,
          );
          channel.ack(msg);
          return;
        }

        let data;
        try {
          data = JSON.parse(contentStr);
        } catch (parseError) {
          console.error(
            `❌ Failed to parse JSON for routing key ${routingKey}:`,
            contentStr,
          );
          // Bad message format — don't requeue, it will never succeed
          channel.nack(msg, false, false);
          return;
        }

        console.log(`📥 Received event: ${routingKey}`);

        try {
          if (routingKey === "order.notification.placed") {
            const { orderId, customerName, customerEmail, totalAmount } = data;

            if (
              !orderId ||
              !customerName ||
              !customerEmail ||
              totalAmount === undefined
            ) {
              console.error(
                `❌ Missing required fields in placed event:`,
                data,
              );
              channel.nack(msg, false, false);
              return;
            }

            await sendEmail(
              customerEmail,
              "🎉 Order Confirmed - EDOP",
              `Hi ${customerName}, your order ${orderId} has been placed successfully. Total: $${totalAmount}`,
              `
    <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #eee;">

        <div style="background:#4f46e5; color:#fff; padding:20px; text-align:center;">
          <h1 style="margin:0;">Order Confirmed 🎉</h1>
        </div>

        <div style="padding:20px; color:#333;">
          <p>Hi <strong>${customerName}</strong>,</p>

          <p>Great news! Your order has been successfully placed and is now being processed.</p>

          <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin:20px 0;">
            <p style="margin:5px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin:5px 0;"><strong>Total Amount:</strong> PKR: ${totalAmount}</p>
          </div>

          <p>We'll notify you once your order is shipped 🚚</p>

          <p style="margin-top:20px;">Thank you for choosing <strong>EDOP</strong> ❤️</p>
        </div>

        <div style="text-align:center; padding:15px; font-size:12px; color:#888;">
          © ${new Date().getFullYear()} EDOP. All rights reserved.
        </div>

      </div>
    </div>
    `,
            );
          } else if (routingKey === "order.notification.cancelled") {
            const { orderId, customerName, customerEmail, totalAmount } = data;

            await sendEmail(
              customerEmail,
              "⚠️ Order Cancelled - EDOP",
              `Hi ${customerName}, your order ${orderId} has been cancelled.`,
              `
    <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #eee;">

        <div style="background:#ef4444; color:#fff; padding:20px; text-align:center;">
          <h1 style="margin:0;">Order Cancelled</h1>
        </div>

        <div style="padding:20px; color:#333;">
          <p>Hi <strong>${customerName}</strong>,</p>

          <p>We're sorry to inform you that your order has been cancelled.</p>

          <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin:20px 0;">
            <p style="margin:5px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin:5px 0;"><strong>Amount:</strong> PKR: ${totalAmount}</p>
          </div>

          <p>If this was a mistake or you need help, feel free to contact our support team.</p>

          <p style="margin-top:20px;">We appreciate your understanding 🙏</p>
        </div>

        <div style="text-align:center; padding:15px; font-size:12px; color:#888;">
          © ${new Date().getFullYear()} EDOP. All rights reserved.
        </div>

      </div>
    </div>
    `,
            );
          } else if (routingKey === "order.notification.delivered") {
            const { orderId, customerName, customerEmail, totalAmount } = data;

            await sendEmail(
              customerEmail,
              "📦 Order Delivered - EDOP",
              `Hi ${customerName}, your order ${orderId} has been successfully delivered.`,
              `
    <div style="font-family: Arial, sans-serif; background:#f6f9fc; padding:20px;">
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; border:1px solid #eee;">

        <div style="background:#10b981; color:#fff; padding:20px; text-align:center;">
          <h1 style="margin:0;">Order Delivered 📦</h1>
        </div>

        <div style="padding:20px; color:#333;">
          <p>Hi <strong>${customerName}</strong>,</p>

          <p>We are thrilled to let you know that your order has been successfully delivered!</p>

          <div style="background:#f1f5f9; padding:15px; border-radius:8px; margin:20px 0;">
            <p style="margin:5px 0;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin:5px 0;"><strong>Amount:</strong> PKR: ${totalAmount}</p>
          </div>

          <p>We hope you enjoy your purchase. We'd love to see you again soon!</p>

          <p style="margin-top:20px;">Thank you for shopping with <strong>EDOP</strong> ❤️</p>
        </div>

        <div style="text-align:center; padding:15px; font-size:12px; color:#888;">
          © ${new Date().getFullYear()} EDOP. All rights reserved.
        </div>

      </div>
    </div>
    `,
            );
          }

          // Only ack AFTER email was sent successfully
          channel.ack(msg);
          console.log(`✅ Processed and acked: ${routingKey}`);
        } catch (emailError) {
          // Email failed — requeue the message so it can be retried
          console.error(
            `❌ Failed to send email for ${routingKey}:`,
            emailError.message,
          );
          channel.nack(msg, false, true);
        }
      }
    });
  } catch (error) {
    console.error(
      "Failed to connect to RabbitMQ in Notification Service:",
      error,
    );
    process.exit(1);
  }
};
