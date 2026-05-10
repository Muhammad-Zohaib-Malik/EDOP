import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import { publishEvent } from "../config/rabbitmq.js";
export const checkoutOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    const { items, customerName, customerPhone, customerAddress } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    if (!customerName) {
      return res.status(400).json({ message: "Customer name is required" });
    }

    if (!customerAddress) {
      return res.status(400).json({ message: "Delivery address is required" });
    }

    let calculatedTotal = 0;
    const validatedItems = [];

    // 1. Verify Prices and Stock via DB
    for (const item of items) {
      try {
        const result = await client.query("SELECT * FROM products WHERE id = $1", [
          item.productId,
        ]);
        
        if (result.rows.length === 0) {
          return res
            .status(404)
            .json({ message: `Product ${item.productId} not found` });
        }
        
        const product = result.rows[0];

        if (product.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.name}`,
          });
        }

        calculatedTotal += parseFloat(product.price) * item.quantity;
        validatedItems.push({
          ...item,
          verifiedPrice: product.price,
          name: product.name,
        });
      } catch (error) {
        console.error(
          `Failed to fetch product ${item.productId}:`,
          error.message,
        );
        return res
          .status(500)
          .json({ message: `Error verifying product ${item.productId}` });
      }
    }

    await client.query("BEGIN");

    // 2. Create Order in Database
    const orderId = uuidv4();
    await client.query(
      `INSERT INTO orders (id, customer_name, customer_phone, customer_address, total_amount, status) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        orderId,
        customerName,
        customerPhone || null,
        customerAddress,
        calculatedTotal,
        "PENDING",
      ],
    );

    // 3. Insert Order Items and Reserve Stock
    for (const item of validatedItems) {
      // Insert order item
      await client.query(
        `INSERT INTO order_items (id, order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4, $5)`,
        [uuidv4(), orderId, item.productId, item.quantity, item.verifiedPrice],
      );

      // Reserve stock via RabbitMQ
      await publishEvent("order.placed", {
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Order placed successfully!",
      orderId,
      total: calculatedTotal,
      status: "PENDING",
    });
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
      `SELECT 
        o.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price,
              'product_name', p.name,
              'product_picture', p.picture
            )
          ) FILTER (WHERE oi.id IS NOT NULL), 
          '[]'
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      LEFT JOIN products p ON oi.product_id = p.id
      GROUP BY o.id
      ORDER BY o.created_at DESC`
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

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Validate if status is one of the allowed values
    const validStatuses = [
      "PENDING",
      "PROCESSING",
      "SHIPPED",
      "DELIVERED",
      "CANCELLED",
    ];
    if (!validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const result = await pool.query(
      `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
      [status.toUpperCase(), id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order: result.rows[0],
    });
  } catch (error) {
    console.error("Update Order Status Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM orders WHERE id = $1 RETURNING id`,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Delete Order Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
