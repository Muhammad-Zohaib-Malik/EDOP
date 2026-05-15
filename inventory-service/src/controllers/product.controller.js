import pool from "../config/db.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import esClient from "../config/elasticsearch.js";

// ── helpers ────────────────────────────────────────────────────────────────────

const indexProduct = (product) =>
  esClient
    .index({ index: "products", id: product.id, document: product })
    .catch((e) => console.error("ES index error:", e.message));

const deleteFromIndex = (id) =>
  esClient
    .delete({ index: "products", id })
    .catch(
      (e) =>
        e?.meta?.statusCode !== 404 &&
        console.error("ES delete error:", e.message),
    );

// ── controllers ────────────────────────────────────────────────────────────────

export const createProduct = async (req, res) => {
  try {
    const { name, description, stock, price } = req.body;
    const picture = req.file?.filename ?? null;
    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO products (id, name, description, stock, price, picture)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [id, name, description, stock, price, picture],
    );

    indexProduct(result.rows[0]);

    res.status(201).json({
      message: "Product created successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Create Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProducts = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY created_at DESC",
    );
    res.json({ products: result.rows });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getProductById = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM products WHERE id = $1", [
      req.params.id,
    ]);
    if (!result.rows.length)
      return res.status(404).json({ message: "Product not found" });
    res.json({ product: result.rows[0] });
  } catch (error) {
    console.error("Get Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, stock, price } = req.body;

    const existing = await pool.query("SELECT * FROM products WHERE id = $1", [
      id,
    ]);
    if (!existing.rows.length)
      return res.status(404).json({ message: "Product not found" });

    let picture = existing.rows[0].picture;
    if (req.file) {
      picture = req.file.filename;
      if (existing.rows[0].picture)
        fs.unlink(`uploads/${existing.rows[0].picture}`, () => {});
    }

    const result = await pool.query(
      `UPDATE products SET name=$1, description=$2, stock=$3, price=$4, picture=$5, version=version+1
       WHERE id=$6 RETURNING *`,
      [name, description, stock, price, picture, id],
    );

    indexProduct(result.rows[0]);

    res.json({
      message: "Product updated successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await pool.query(
      "SELECT picture FROM products WHERE id=$1",
      [id],
    );
    if (!existing.rows.length)
      return res.status(404).json({ message: "Product not found" });

    if (existing.rows[0].picture)
      fs.unlink(`uploads/${existing.rows[0].picture}`, () => {});

    await pool.query("DELETE FROM products WHERE id=$1", [id]);
    deleteFromIndex(id);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    if (quantity === undefined)
      return res.status(400).json({ message: "Quantity is required" });

    const result = await pool.query(
      `UPDATE products SET stock=stock+$1, version=version+1 WHERE id=$2 AND stock+$1>=0 RETURNING *`,
      [quantity, id],
    );

    if (!result.rows.length)
      return res
        .status(400)
        .json({ message: "Product not found or insufficient stock" });

    indexProduct(result.rows[0]);
    res.json({
      message: "Stock updated successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Update Stock Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const reserveStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;
    if (!quantity || quantity <= 0)
      return res
        .status(400)
        .json({ message: "Valid positive quantity is required" });

    const result = await pool.query(
      `UPDATE products SET stock=stock-$1, version=version+1 WHERE id=$2 AND stock>=$1 RETURNING *`,
      [quantity, id],
    );

    if (!result.rows.length)
      return res.status(400).json({
        message: "Product not found or insufficient stock to reserve",
      });

    indexProduct(result.rows[0]);
    res.json({
      message: "Stock reserved successfully",
      product: result.rows[0],
    });
  } catch (error) {
    console.error("Reserve Stock Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/products/search?q=<term>
export const searchProducts = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q)
      return res.status(400).json({ message: "Query param `q` is required" });

    const { hits } = await esClient.search({
      index: "products",
      body: {
        query: {
          bool: {
            should: [
              {
                multi_match: {
                  query: q,
                  fields: ["name^3", "description"],
                  fuzziness: "AUTO",
                  prefix_length: 1,
                },
              },
              {
                multi_match: {
                  query: q,
                  fields: ["name^2", "description"],
                  type: "phrase_prefix",
                },
              },
              {
                query_string: {
                  query: q.split(/\s+/).map((t) => `*${t}*`).join(" AND "),
                  fields: ["name^2", "description"],
                  default_operator: "AND",
                },
              },
            ],
            minimum_should_match: 1,
          },
        },
      },
    });

    const products = hits.hits.map((h) => h._source);
    res.json({ products });
  } catch (error) {
    console.error("Search Products Error:", error);
    res.status(500).json({ message: "Search failed" });
  }
};
