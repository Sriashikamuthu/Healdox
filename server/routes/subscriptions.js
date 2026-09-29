import express from "express";
import pool from "../db.js";

const router = express.Router();

/* Get current subscription */

router.get("/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM subscriptions
      WHERE user_email = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [email]
    );

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: err.message
    });
  }
});

export default router;