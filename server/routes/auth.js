import express from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import pool from "../db.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const ALLOWED_ROLES = new Set([
  "patient",
  "physician",
  "nurse",
  "lab",
  "pharma_company",
]);

function createToken(user) {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    { id: String(user.id), role: user.role || "patient" },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    avatar_url: user.avatar_url || "",
    fullName: user.full_name || "",
    full_name: user.full_name || "",
    role: user.role || "patient",
    is_verified: user.is_verified !== false,
    specialty: user.specialty || null,
    medicine_system: user.medicine_system || null,
    bio: user.bio || null,
    license_number: user.license_number || null,
  };
}

router.post("/signup", async (req, res) => {
  try {
    const { email, password, username, fullName, role } = req.body;

    if (!email || !password || !username || !fullName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const safeRole = ALLOWED_ROLES.has(role) ? role : "patient";
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users
      (email, password_hash, username, full_name, role, is_verified)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING id, email, username, full_name, role, avatar_url, is_verified,
                specialty, medicine_system, bio, license_number
      `,
      [
        email,
        hashedPassword,
        username,
        fullName,
        safeRole,
        safeRole === "patient",
      ]
    );

    res.json({
      message: "Signup successful",
      user: publicUser(result.rows[0]),
    });
  } catch (error) {
    console.error("Signup error:", error);
    if (error.code === "23505") {
      return res.status(409).json({ error: "Email or username already exists" });
    }
    res.status(500).json({ error: "Signup failed" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: "Email and password are required",
      });
    }

    const result = await pool.query(
      `SELECT id, email, username, full_name, role, password_hash, avatar_url,
              is_verified, specialty, medicine_system, bio, license_number
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        error: "Invalid login credentials",
      });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({
        error: "Invalid login credentials",
      });
    }

    const token = createToken(user);

    return res.json({
      message: "Login success",
      token,
      user: publicUser(user),
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({
      error: "Login failed",
    });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const genericMessage = { message: "If that account exists, a reset email has been sent" };

    if (!email) {
      return res.json(genericMessage);
    }

    const user = await pool.query("SELECT id, email FROM users WHERE email=$1", [
      email,
    ]);

    if (user.rows.length === 0) {
      return res.json(genericMessage);
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000);

    await pool.query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES ($1,$2,$3)",
      [email, token, expires]
    );

    const frontendUrl = (process.env.FRONTEND_URL || "http://localhost:5173").replace(
      /\/$/,
      ""
    );
    const resetLink = `${frontendUrl}/reset-password/${token}`;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error("SMTP is not configured; password reset email was not sent");
      return res.json(genericMessage);
    }

    const transporter = nodemailer.createTransport({
      service: process.env.SMTP_SERVICE || "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"HealDox Support" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Reset your HealDox password",
      html: `
        <h2>Password Reset</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `,
    });

    res.json(genericMessage);
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!password || String(password).length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const reset = await pool.query(
      "SELECT * FROM password_resets WHERE token=$1",
      [token]
    );

    if (reset.rows.length === 0) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const record = reset.rows[0];

    if (new Date() > record.expires_at) {
      return res.status(400).json({ error: "Token expired" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query("UPDATE users SET password_hash=$1 WHERE email=$2", [
      hashedPassword,
      record.email,
    ]);

    await pool.query("DELETE FROM password_resets WHERE email=$1", [record.email]);

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

export default router;
