import express from "express";
import pool from "../db.js";

const router = express.Router();

/* =========================
   GET COMMENTS
========================= */

router.get(
  "/discussions/:id/comments",
  async (req, res) => {

    try {

      const { id } = req.params;

      const result =
        await pool.query(
          `
          SELECT 
            c.*,
            u.username
          FROM comments c
          LEFT JOIN users u
            ON c.user_id = u.id
          WHERE c.discussion_id = $1
          ORDER BY c.created_at ASC
          `,
          [id]
        );

      res.json(
        result.rows
      );

    }

    catch (err) {

      console.error(
        "Fetch comments error:",
        err
      );

      res.status(500).json({
        error:
          "Failed to fetch comments"
      });

    }

  }
);

/* =========================
   ADD COMMENT
========================= */

router.post(
  "/discussions/:id/comments",
  async (req, res) => {

    try {

      const { id } = req.params;

      const {
        user_id,
        content,
        is_anonymous
      } = req.body;

      const result =
        await pool.query(
          `
          INSERT INTO comments (
            discussion_id,
            user_id,
            content,
            is_anonymous
          )
          VALUES ($1,$2,$3,$4)
          RETURNING *
          `,
          [
            id,
            user_id,
            content,
            is_anonymous
          ]
        );

      /* update comment count */

      await pool.query(
        `
        UPDATE discussions
        SET comment_count =
            comment_count + 1
        WHERE id = $1
        `,
        [id]
      );

      res.json(
        result.rows[0]
      );

    }

    catch (err) {

      console.error(
        "Create comment error:",
        err
      );

      res.status(500).json({
        error:
          "Failed to create comment"
      });

    }

  }
);

export default router;