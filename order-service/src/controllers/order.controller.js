import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import { publishEvent } from "../config/rabbitmq.js";
import esClient from "../config/elasticsearch.js";

// ── helpers ────────────────────────────────────────────────────────────────────

const indexOrder = async (orderId) => {
  try {
    const orderRes = await pool.query("SELECT * FROM orders WHERE id=$1", [orderId]);
    if (!orderRes.rows.length) return;
    const order = orderRes.rows[0];

    const itemsRes = await pool.query(
      `SELECT oi.product_id, oi.quantity, oi.price, p.name AS product_name
       FROM order_items oi LEFT JOIN products p ON oi.product_id=p.id
       WHERE oi.order_id=$1`,
      [orderId],
    );

    await esClient.index({
      index: "orders",
      id: order.id,
      document: { ...order, items: itemsRes.rows },
    });
  } catch (e) {
    console.error("ES indexOrder error:", e.message);
  }
};

// ── controllers ────────────────────────────────────────────────────────────────

export const checkoutOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, customerName, customerEmail, customerPhone, customerAddress } = req.body;

    if (!items?.length) return res.status(400).json({ message: "Cart is empty" });
    if (!customerName) return res.status(400).json({ message: "Customer name is required" });
    if (!customerEmail) return res.status(400).json({ message: "Customer email is required" });
    if (!customerAddress) return res.status(400).json({ message: "Delivery address is required" });

    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const result = await client.query("SELECT * FROM products WHERE id=$1", [item.productId]);
      if (!result.rows.length)
        return res.status(404).json({ message: `Product ${item.productId} not found` });

      const product = result.rows[0];
      if (product.stock < item.quantity)
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

      calculatedTotal += parseFloat(product.price) * item.quantity;
      validatedItems.push({ ...item, verifiedPrice: product.price, name: product.name });
    }

    await client.query("BEGIN");

    const orderId = uuidv4();
    await client.query(
      `INSERT INTO orders (id, customer_name, customer_email, customer_phone, customer_address, total_amount, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [orderId, customerName, customerEmail, customerPhone, customerAddress, calculatedTotal, "PENDING"],
    );

    for (const item of validatedItems) {
      await client.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4,$5)`,
        [uuidv4(), orderId, item.productId, item.quantity, item.verifiedPrice],
      );
      await publishEvent("order.placed", { productId: item.productId, quantity: item.quantity });
    }

    await publishEvent("order.notification.placed", {
      orderId, customerName, customerEmail, totalAmount: calculatedTotal, items: validatedItems,
    });

    await client.query("COMMIT");

    // Index in Elasticsearch (non-blocking)
    indexOrder(orderId);

    res.status(201).json({ message: "Order placed successfully!", orderId, total: calculatedTotal, status: "PENDING" });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Checkout Error:", error);
    res.status(500).json({ message: "Internal server error during checkout" });
  } finally {
    client.release();
  }
};

export const getOrders = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*,
        COALESCE(json_agg(json_build_object(
          'id', oi.id, 'product_id', oi.product_id,
          'quantity', oi.quantity, 'price', oi.price,
          'product_name', p.name, 'product_picture', p.picture
        )) FILTER (WHERE oi.id IS NOT NULL), '[]') as items
       FROM orders o
       LEFT JOIN order_items oi ON o.id=oi.order_id
       LEFT JOIN products p ON oi.product_id=p.id
       GROUP BY o.id ORDER BY o.created_at DESC`,
    );
    res.status(200).json({ orders: result.rows });
  } catch (error) {
    console.error("Get Orders Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];
    if (!status || !validStatuses.includes(status.toUpperCase()))
      return res.status(400).json({ message: "Invalid or missing status" });

    const result = await pool.query(
      `UPDATE orders SET status=$1 WHERE id=$2 RETURNING *`,
      [status.toUpperCase(), id],
    );
    if (!result.rows.length) return res.status(404).json({ message: "Order not found" });

    const order = result.rows[0];

    if (status.toUpperCase() === "CANCELLED")
      await publishEvent("order.notification.cancelled", {
        orderId: order.id, customerName: order.customer_name,
        customerEmail: order.customer_email, totalAmount: order.total_amount,
      });

    if (status.toUpperCase() === "DELIVERED")
      await publishEvent("order.notification.delivered", {
        orderId: order.id, customerName: order.customer_name,
        customerEmail: order.customer_email, totalAmount: order.total_amount,
      });

    // Update status in ES (non-blocking)
    esClient.update({ index: "orders", id, doc: { status: status.toUpperCase() } })
      .catch((e) => console.error("ES update error:", e.message));

    res.status(200).json({ message: "Order status updated successfully", order });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/orders/search?q=<term>&status=<status>
export const searchOrders = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    const status = (req.query.status || "").trim().toUpperCase();

    if (!q && !status)
      return res.status(400).json({ message: "Provide `q` or `status` query param" });

    const must = [];
    const filter = [];

    if (q) {
      must.push({
        multi_match: {
          query: q,
          fields: ["customer_name^2", "customer_email", "customer_address", "items.product_name"],
          fuzziness: "AUTO",
        },
      });
    }

    if (status) filter.push({ term: { status } });

    const { hits } = await esClient.search({
      index: "orders",
      body: { query: { bool: { must, filter } } },
    });

    const orders = hits.hits.map((h) => h._source);
    res.json({ orders });
  } catch (error) {
    console.error("Search Orders Error:", error);
    res.status(500).json({ message: "Search failed" });
  }
};
