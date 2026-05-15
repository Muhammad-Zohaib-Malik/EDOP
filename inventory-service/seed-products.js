import pg from "pg";
import { randomUUID } from "crypto";

const pool = new pg.Pool({
  host: "localhost",
  user: "postgres",
  password: "admin",
  database: "edop",
  port: 5432,
});

const products = [
  {
    name: "Wireless Bluetooth Headphones",
    description:
      "Premium over-ear wireless headphones with active noise cancellation, 30-hour battery life, and Hi-Res audio support. Features plush memory-foam ear cushions for all-day comfort.",
    stock: 45,
    price: 7999.99,
    picture: "headphones.png",
  },
  {
    name: "Fitness Smartwatch Pro",
    description:
      "Advanced fitness smartwatch with heart-rate monitor, GPS tracking, sleep analysis, and 5ATM water resistance. Compatible with Android and iOS with a vibrant AMOLED display.",
    stock: 30,
    price: 12499.0,
    picture: "smartwatch.png",
  },
  {
    name: "Leather Laptop Backpack",
    description:
      "Handcrafted genuine leather backpack with padded 15.6-inch laptop compartment, anti-theft hidden zipper, and multiple organizer pockets. Perfect for work and travel.",
    stock: 20,
    price: 5499.0,
    picture: "backpack.png",
  },
  {
    name: "Insulated Steel Water Bottle",
    description:
      "750ml double-wall vacuum insulated stainless steel water bottle. Keeps drinks cold for 24 hours or hot for 12 hours. BPA-free with leak-proof lid.",
    stock: 100,
    price: 1299.0,
    picture: "water_bottle.png",
  },
  {
    name: "AeroGlide Running Shoes",
    description:
      "Lightweight performance running shoes with responsive cushioning, breathable mesh upper, and durable rubber outsole. Designed for both road running and gym workouts.",
    stock: 60,
    price: 4999.0,
    picture: "running_shoes.png",
  },
  {
    name: "Aviator Polarized Sunglasses",
    description:
      "Classic aviator sunglasses with UV400 polarized lenses, lightweight gold metal frame, and adjustable nose pads. Includes premium hard-shell carrying case.",
    stock: 75,
    price: 2999.0,
    picture: "sunglasses.png",
  },
  {
    name: "RGB Mechanical Keyboard",
    description:
      "Compact 75% mechanical gaming keyboard with hot-swappable switches, per-key RGB lighting, aluminum case, and programmable macros. USB-C with detachable cable.",
    stock: 35,
    price: 6499.0,
    picture: "mechanical_keyboard.png",
  },
  {
    name: "Genuine Leather Bifold Wallet",
    description:
      "Slim genuine leather bifold wallet with RFID blocking technology, 8 card slots, 2 bill compartments, and a transparent ID window. Gift-box packaging included.",
    stock: 50,
    price: 1899.0,
    picture: "leather_wallet.png",
  },
  {
    name: "Adjustable LED Desk Lamp",
    description:
      "Modern LED desk lamp with 5 color temperatures, 10 brightness levels, USB charging port, and flexible gooseneck arm. Touch controls with memory function.",
    stock: 40,
    price: 2499.0,
    picture: "desk_lamp.png",
  },
  {
    name: "Qi Wireless Charging Pad",
    description:
      "Fast 15W Qi wireless charging pad compatible with all Qi-enabled devices. Ultra-slim design with LED indicator, anti-slip surface, and overheat protection.",
    stock: 80,
    price: 1499.0,
    picture: "wireless_charger.png",
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    for (const p of products) {
      const id = randomUUID();
      await client.query(
        `INSERT INTO products (id, name, description, stock, price, picture)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, p.name, p.description, p.stock, p.price, p.picture]
      );
      console.log(`✅ Inserted: ${p.name}`);
    }
    console.log("\n🎉 All 10 products seeded successfully!");
  } catch (err) {
    console.error("Seed error:", err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
