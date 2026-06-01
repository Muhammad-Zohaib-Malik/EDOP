import pg from "pg";

const pool = new pg.Pool({
  // host: process.env.PG_HOST,
  // user: process.env.PG_USER,
  // password: process.env.PG_PASSWORD,
  // database: process.env.PG_DATABASE,
  // port: process.env.PG_PORT,
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const connectDatabase = async () => {
  let client;

  try {
    client = await pool.connect();
    console.log("🟢 Connected to PostgreSQL!");

    await client.query("SELECT 1");

    // =========================
    // INVENTORY TABLE
    // =========================
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        stock INTEGER NOT NULL CHECK (stock >= 0),
        price NUMERIC(10,2) NOT NULL,
        picture VARCHAR(255),
        picture_public_id VARCHAR(255),
        version INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Add column for existing tables
    await client.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS picture_public_id VARCHAR(255)
    `);

    console.log("🟢 Database schema locked & ready");
  } catch (err) {
    console.error("🔴 DB Error:", err.message);
  } finally {
    if (client) client.release();
  }
};

export default pool;
