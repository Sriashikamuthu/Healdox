import express from "express";
import pool from "../db.js";

const router = express.Router();

/* =========================
   GET notifications for user
========================= */
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);

  } catch (error) {

    console.error("Fetch notifications error:", error);

    res.status(500).json({
      error: "Failed to fetch notifications"
    });

  }
});

/* =========================
   MARK notification as read
========================= */
router.put("/read/:id", async (req, res) => {

  try {

    const { id } = req.params;

    await pool.query(
      `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1
      `,
      [id]
    );

    res.json({
      message: "Notification marked as read"
    });

  } catch (error) {

    console.error("Mark read error:", error);

    res.status(500).json({
      error: "Failed to update notification"
    });

  }

});

export default router;