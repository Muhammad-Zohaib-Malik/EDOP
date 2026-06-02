import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const connectDatabase = async () => {
  let client;

  try {
    client = await pool.connect();
    console.log("🟢 Connected to PostgreSQL (Payment Service)!");

    // =========================
    // PAYMENTS TABLE
    // =========================
    await client.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id UUID NOT NULL,
        transaction_id VARCHAR(255) NOT NULL UNIQUE,
        user_email VARCHAR(255) NOT NULL,
        amount NUMERIC(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'SUCCESS',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    console.log("🟢 Payment Database schema locked & ready");
  } catch (err) {
    console.error("🔴 DB Error:", err.message);
    process.exit(1);
  } finally {
    if (client) client.release();
  }
};

export default pool;
