import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { loginSchema, registerSchema } from "../validator/auth.validator.js";

const JWT_SECRET = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_SECRET;

export const register = async (req, res) => {
  const validation = registerSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.format() });
    return;
  }

  const { username, email, password } = validation.data;

  try {
    // Check if user exists
    const existingUser = await pool.query(
      "SELECT id FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );

    if (existingUser.rows.length > 0) {
      res
        .status(400)
        .json({ message: "Email or username is already registered" });
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [username, email, hashedPassword],
    );

    res.status(201).json({
      message: "User registered successfully",
      userId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  const validation = loginSchema.safeParse(req.body);

  if (!validation.success) {
    res.status(400).json({ errors: validation.error.format() });
    return;
  }

  const { email, password } = validation.data;

  try {
    // Get user
    const result = await pool.query(
      "SELECT id, username, email, password, role FROM users WHERE email = $1",
      [email],
    );

    if (result.rows.length === 0) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const user = result.rows[0];

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    // Generate tokens
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "1m",
    });

    const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
      expiresIn: "7d",
    });

    // Store refresh token
    await pool.query("UPDATE users SET refreshtoken = $1 WHERE id = $2", [
      refreshToken,
      user.id,
    ]);

    // Cookies
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      sameSite: "none",
      secure:true,
      maxAge: 1 * 60 * 1000,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure:true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Logged in successfully",
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const refresh = async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken;

  if (!oldRefreshToken) {
    res.status(401).json({ message: "No token provided" });
    return;
  }

  try {
    // 1. VERIFY TOKEN FIRST
    const decoded = jwt.verify(oldRefreshToken, REFRESH_SECRET);

    // 2. CHECK DATABASE
    const result = await pool.query(
      `SELECT id, username, email, role
       FROM users
       WHERE refreshtoken = $1 AND id = $2`,
      [oldRefreshToken, decoded.id],
    );

    if (result.rows.length === 0) {
      res.status(403).json({ message: "Invalid token or session expired" });
      return;
    }

    const user = result.rows[0];

    // 3. GENERATE NEW TOKENS (rotation)
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    const newAccessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: "1m",
    });

    const newRefreshToken = jwt.sign(payload, REFRESH_SECRET, {
      expiresIn: "7d",
    });

    // 4. UPDATE DB
    await pool.query(`UPDATE users SET refreshtoken = $1 WHERE id = $2`, [
      newRefreshToken,
      user.id,
    ]);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 1 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      sameSite: "none",
      secure: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ message: "Token refreshed successfully" });
  } catch (error) {
    console.error("Refresh Error:", error);
    res.status(403).json({ message: "Session expired" });
  }
};

export const logout = async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    try {
      await pool.query(
        `UPDATE users SET refreshtoken = NULL WHERE refreshtoken = $1`,
        [token],
      );
    } catch (error) {
      console.error("Logout DB Error:", error);
    }
  }

  res.clearCookie("accessToken", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  res.json({ message: "Logged out successfully" });
};

export const getProfile = async (req, res) => {
  if (!req.user) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const result = await pool.query(
      `SELECT id, username, email
       FROM users
       WHERE id = $1`,
      [req.user.id],
    );

    if (result.rows.length === 0) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.json({ profile: result.rows[0] });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email
       FROM users
       WHERE id != $1
       ORDER BY username ASC`,
      [req.user.id],
    );

    res.json({ users: result.rows });
  } catch (error) {
    console.error("Get All Users Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
