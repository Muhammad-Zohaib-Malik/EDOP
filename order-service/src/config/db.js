import pg from "pg";

const pool = new pg.Pool({
  // host: process.env.PG_HOST || "localhost",
  // user: process.env.PG_USER || "postgres",
  // password: process.env.PG_PASSWORD || "postgres",
  // database: process.env.PG_DATABASE || "edop",
  // port: process.env.PG_PORT || 5432,
  connectionString:process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const connectDatabase = async () => {
  let client;

  try {
    client = await pool.connect();
    console.log("🟢 Connected to PostgreSQL (Order Service)!");

    // =========================
    // ORDERS TABLE
    // =========================
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id UUID PRIMARY KEY,
        customer_name TEXT NOT NULL,
        customer_email VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT NOT NULL,
        total_amount NUMERIC(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // =========================
    // ORDER ITEMS TABLE
    // =========================
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id UUID PRIMARY KEY,
        order_id UUID NOT NULL,
        product_id UUID NOT NULL,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price NUMERIC(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        CONSTRAINT fk_order
          FOREIGN KEY(order_id)
          REFERENCES orders(id)
          ON DELETE CASCADE,
        CONSTRAINT fk_product
          FOREIGN KEY(product_id)
          REFERENCES products(id)
      )
    `);

    console.log("🟢 Order Database schema locked & ready");
  } catch (err) {
    console.error("🔴 DB Error:", err.message);
  } finally {
    if (client) client.release();
  }
};

export default pool;
