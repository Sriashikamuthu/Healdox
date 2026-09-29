import express from "express";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import pool from "../db.js";
import dotenv from "dotenv";

const router = express.Router();

/* =========================
   SIGNUP
========================= */
router.post("/signup", async (req, res) => {
  try {

    const { email, password, username, fullName, role } = req.body;

    if (!email || !password || !username || !fullName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO users
      (email, password_hash, username, full_name, role)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING id,email,username,full_name
      `,
      [email, hashedPassword, username, fullName, role || "patient"]
    );

    res.json({
      message: "Signup successful",
      user: result.rows[0]
    });

  } catch (error) {

    console.error("Signup error:", error);
    res.status(500).json({ error: error.message });

  }
});

/* =========================
   LOGIN
========================= */
router.post("/login", async (req, res) => {
  try {

    const { email, password } = req.body;

    console.log("Login attempt:", email);

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {

      console.log("User not found");

      return res.status(400).json({
        error: "Invalid login credentials"
      });

    }

    const user = result.rows[0];

    console.log("DB password hash:", user.password_hash);

    const match = await bcrypt.compare(
      password,
      user.password_hash
    );

    console.log("Password match:", match);

    if (!match) {

      return res.status(400).json({
        error: "Invalid login credentials"
      });

    }

    /* FIXED RESPONSE */
    res.json({
      message: "Login success",
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });

  } catch (err) {

    console.error("Login error:", err);

    res.status(500).json({
      error: "Server error"
    });

  }
});
/* =========================
   FORGOT PASSWORD
========================= */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    const user = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      "INSERT INTO password_resets (email, token, expires_at) VALUES ($1,$2,$3)",
      [email, token, expires]
    );

    const resetLink = `http://localhost:5173/reset-password/${token}`;

    dotenv.config();

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: "ramyashree972000@gmail.com",
        pass: "kauwseehagwyhfvh",
      },
    });

    await transporter.sendMail({
      from: '"HealDox Support" <ramyashree972000@gmail.com>',
      to: email,
      subject: "Reset your HealDox password",
      html: `
        <h2>Password Reset</h2>
        <p>Click below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link expires in 1 hour.</p>
      `,
    });

    res.json({ message: "Reset email sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Failed to send email" });
  }
});

/* =========================
   RESET PASSWORD
========================= */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

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

    await pool.query(
      "UPDATE users SET password_hash=$1 WHERE email=$2",
      [hashedPassword, record.email]
    );

    await pool.query(
      "DELETE FROM password_resets WHERE email=$1",
      [record.email]
    );

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Password reset failed" });
  }
});

export default router;