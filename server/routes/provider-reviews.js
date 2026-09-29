import express from "express";
import pool from "../db.js";

const router = express.Router();

/* =========================
   POST REVIEW
========================= */

router.post("/", async (req, res) => {

  try {

    const {
      provider_name,
      provider_type,
      specialty,
      city,
      country,
      visit_date,
      overall_rating,
      communication_rating,
      expertise_rating,
      facility_rating,
      wait_time_rating,
      review_text,
      user_id
    } = req.body;

    // 🚨 Validate user_id
    if (!user_id) {
      return res.status(400).json({
        error: "user_id is required"
      });
    }

    // ✅ Insert review
    const result = await pool.query(
      `
      INSERT INTO provider_reviews
      (
        provider_name,
        provider_type,
        specialty,
        city,
        country,
        visit_date,
        overall_rating,
        communication_rating,
        expertise_rating,
        facility_rating,
        wait_time_rating,
        review_text,
        user_id,
        created_at
      )
      VALUES
      ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW())
      RETURNING *
      `,
      [
        provider_name,
        provider_type,
        specialty,
        city,
        country,
        visit_date,
        overall_rating,
        communication_rating,
        expertise_rating,
        facility_rating,
        wait_time_rating,
        review_text,
        user_id
      ]
    );

    res.json({
      message: "Review created",
      review: result.rows[0]
    });

  } catch (err) {

    console.error(
      "Review insert error:",
      err.message
    );

    res.status(500).json({
      error: err.message
    });

  }

});

/* =========================
   GET REVIEWS WITH USERNAME
========================= */

router.get("/", async (req, res) => {

  try {

    console.log("Fetching provider reviews...");

    // get logged-in user id from query
    const userId = req.query.user_id;

    const result = await pool.query(

      `
      SELECT 

        pr.*,

        u.username,
        u.email,

        -- likes count
        COUNT(DISTINCT rl.id) AS like_count,

        -- comment count
        COUNT(DISTINCT rc.id) AS comment_count,

        -- has liked
        EXISTS (
          SELECT 1
          FROM review_likes r2
          WHERE r2.review_id = pr.id
          AND r2.user_id = $1
        ) AS has_liked

      FROM provider_reviews pr

      LEFT JOIN users u
        ON u.id::text = pr.user_id::text

      LEFT JOIN review_likes rl
        ON pr.id = rl.review_id

      LEFT JOIN review_comments rc
        ON pr.id = rc.review_id

      GROUP BY 
        pr.id,
        u.username,
        u.email

      ORDER BY pr.created_at DESC
      `,

      [userId || null]

    );

    res.json(result.rows);

  } catch (err) {

    console.error(
      "Review fetch error:",
      err.message
    );

    res.status(500).json({
      error: err.message
    });

  }

});


// GET REVIEW COMMENTS

router.get("/:id/comments", async (req, res) => {

  try {

    const reviewId = Number(req.params.id);

    const result = await pool.query(
      `
      SELECT 
        rc.*,
        u.username
      FROM review_comments rc
      LEFT JOIN users u
        ON rc.user_id = u.id
      WHERE rc.review_id = $1
      ORDER BY rc.created_at ASC
      `,
      [reviewId]
    );

    res.json(result.rows);

  } catch (err) {

    console.error("Fetch comments error:", err);

    res.status(500).json({
      error: "Failed to fetch comments"
    });

  }

});

// ADD REVIEW COMMENT

router.post("/:id/comments", async (req, res) => {

  try {

    const reviewId = Number(req.params.id);

    const { user_id, comment } = req.body;

    const result = await pool.query(
      `
      INSERT INTO review_comments
      (review_id, user_id, comment)
      VALUES ($1, $2::uuid, $3)
      RETURNING *
      `,
      [
        reviewId,
        user_id,
        comment
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error("Add comment error:", err);

    res.status(500).json({
      error: "Comment failed"
    });

  }

});

// UPDATE comment
router.put("/comments/:commentId", async (req, res) => {

  try {

    const { commentId } = req.params;
    const { comment } = req.body;

    const result = await pool.query(
      `
      UPDATE review_comments
      SET comment = $1
      WHERE id = $2
      RETURNING *
      `,
      [comment, commentId]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error("Edit comment error:", err);

    res.status(500).json({
      error: "Failed to edit comment"
    });

  }

});

// DELETE comment
router.delete("/comments/:commentId", async (req, res) => {

  try {

    const { commentId } = req.params;

    await pool.query(
      `
      DELETE FROM review_comments
      WHERE id = $1
      `,
      [commentId]
    );

    res.json({ success: true });

  } catch (err) {

    console.error("Delete comment error:", err);

    res.status(500).json({
      error: "Failed to delete comment"
    });

  }

});

/* =========================
   POST COMMENT
========================= */

router.post("/comments", async (req, res) => {

    try {

      const {
        discussion_id,
        user_id,
        comment,
        is_anonymous
      } = req.body;

      await pool.query(
        `
        INSERT INTO discussion_comments
        (
          discussion_id,
          user_id,
          comment,
          is_anonymous
        )

        VALUES ($1,$2,$3,$4)
        `,
        [
          discussion_id,
          user_id,
          comment,
          is_anonymous || false
        ]
      );

      await pool.query(
        `
        UPDATE discussions
        SET comment_count =
            comment_count + 1
        WHERE id = $1
        `,
        [discussion_id]
      );

      res.json({
        success: true
      });

    }

    catch (err) {

      console.error(
        "Comment error:",
        err
      );

      res.status(500).json({
        error:
          "Failed to add comment"
      });

    }

});

router.get("/discussions/:id/comments", async (req, res) => {
  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT *
      FROM comments
      WHERE discussion_id = $1
      ORDER BY created_at ASC
      `,
      [id]
    );

    res.json(result.rows);

  } catch (err) {

    console.error("Fetch comments error:", err);

    res.status(500).json({
      error: "Failed to fetch comments"
    });

  }
});

export default router;