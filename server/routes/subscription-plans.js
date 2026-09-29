import express from "express";
import pool from "../db.js";

const router = express.Router();

/* GET all plans */

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM subscription_plans
      WHERE is_active = true
      ORDER BY sort_order ASC
    `);

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }
});

export default router;