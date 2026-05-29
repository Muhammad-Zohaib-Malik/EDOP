import pg from "pg";

const pool = new pg.Pool({
  // host: process.env.PG_HOST,
  // user: process.env.PG_USER,
  // password: process.env.PG_PASSWORD,
  // database: process.env.PG_DATABASE,
  // port: process.env.PG_PORT,
  connectionString:process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

export const connectDatabase = async () => {
  let client;

  try {
    client = await pool.connect();
    console.log("🟢 Connected to PostgreSQL!");

    await client.query("SELECT 1");

    // =========================
    // AUTH_DATABASE
    // =========================
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        refreshtoken TEXT,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log("🟢 Database schema locked & ready");
  } catch (err) {
    console.error("🔴 DB Error:", err.message);
  } finally {
    if (client) client.release();
  }
};

export default pool;
