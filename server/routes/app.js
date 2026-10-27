import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import { fileURLToPath } from "url";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsRoot = path.join(__dirname, "..", "uploads");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const bucket = String(req.body.bucket || "uploads").replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );
    const dest = path.join(uploadsRoot, bucket);
    fs.mkdirSync(dest, { recursive: true });
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const safe = `${Date.now()}-${file.originalname.replace(/[^\w.\-]/g, "_")}`;
    cb(null, safe);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 },
});

router.get("/medical-records/:userId", authenticateToken, async (req, res) => {
  try {
    if (String(req.user.id) !== String(req.params.userId) && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const result = await pool.query(
      `SELECT
         id,
         COALESCE(file_name, record_name) AS file_name,
         COALESCE(file_path, storage_filename, record_url) AS file_path,
         COALESCE(file_type, record_type) AS file_type,
         file_size,
         description,
         uploaded_at
       FROM medical_records
       WHERE user_id = $1 OR consultation_id IN (
         SELECT id FROM consultation_requests WHERE member_id = $1
       )
       ORDER BY uploaded_at DESC`,
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error("List medical records error:", error);
    res.status(500).json({ error: "Failed to load medical records" });
  }
});

router.delete(
  "/delete-medical-record/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM medical_records
         WHERE id = $1 AND (user_id = $2 OR $3 = 'admin')
         RETURNING id`,
        [req.params.id, req.user.id, req.user.role]
      );
      if (!result.rows.length) {
        return res.status(404).json({ error: "Record not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Delete medical record error:", error);
      res.status(500).json({ error: "Failed to delete record" });
    }
  }
);

router.get(
  "/consultation-requests/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.id !== req.params.userId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }

      const result = await pool.query(
        `SELECT
           cr.*,
           json_build_object(
             'id', u.id,
             'full_name', u.full_name,
             'role', u.role,
             'specialization', u.specialty
           ) AS professional
         FROM consultation_requests cr
         LEFT JOIN users u ON u.id = cr.professional_id
         WHERE cr.member_id = $1 OR cr.professional_id = $1
         ORDER BY cr.created_at DESC`,
        [req.params.userId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("List consultation requests error:", error);
      res.status(500).json({ error: "Failed to load consultation requests" });
    }
  }
);

router.patch(
  "/consultation-requests/:id",
  authenticateToken,
  async (req, res) => {
    try {
      const { status, provider_response } = req.body;
      const result = await pool.query(
        `UPDATE consultation_requests
         SET status = COALESCE($1, status),
             provider_response = COALESCE($2, provider_response),
             response_date = CASE WHEN $1 IS NOT NULL THEN NOW() ELSE response_date END,
             updated_at = NOW()
         WHERE id = $3 AND (professional_id = $4 OR member_id = $4 OR $5 = 'admin')
         RETURNING *`,
        [status || null, provider_response || null, req.params.id, req.user.id, req.user.role]
      );
      if (!result.rows.length) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Update consultation error:", error);
      res.status(500).json({ error: "Failed to update consultation" });
    }
  }
);

router.get(
  "/counselling-sessions/:userId",
  authenticateToken,
  async (req, res) => {
    try {
      if (req.user.id !== req.params.userId && req.user.role !== "admin") {
        return res.status(403).json({ error: "Forbidden" });
      }
      const result = await pool.query(
        `SELECT cs.*,
                json_build_object(
                  'full_name', u.full_name,
                  'specialty', u.specialty,
                  'medicine_system', u.medicine_system
                ) AS physician
         FROM counselling_sessions cs
         LEFT JOIN users u ON u.id = cs.physician_id
         WHERE cs.member_id = $1 OR cs.physician_id = $1
         ORDER BY cs.created_at DESC`,
        [req.params.userId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Counselling sessions error:", error);
      res.status(500).json({ error: "Failed to load sessions" });
    }
  }
);

router.get("/replies/:parentId", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT dc.*, u.username, u.full_name, u.avatar_url, u.role
       FROM discussion_comments dc
       LEFT JOIN users u ON u.id = dc.user_id
       WHERE dc.parent_id = $1
       ORDER BY dc.created_at ASC`,
      [req.params.parentId]
    );
    res.json(
      result.rows.map((row) => ({
        ...row,
        content: row.content || row.comment,
        profiles: {
          username: row.username,
          full_name: row.full_name,
          avatar_url: row.avatar_url,
          role: row.role,
        },
      }))
    );
  } catch (error) {
    console.error("Replies error:", error);
    res.status(500).json({ error: "Failed to load replies" });
  }
});

router.get("/admin/users", authenticateToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  try {
    const result = await pool.query(
      `SELECT id, username, full_name, role, is_verified, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 200`
    );
    res.json(result.rows);
  } catch (error) {
    console.error("Admin users error:", error);
    res.status(500).json({ error: "Failed to load users" });
  }
});

router.patch(
  "/admin/users/:id/verify",
  authenticateToken,
  async (req, res) => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    try {
      const { is_verified } = req.body;
      const result = await pool.query(
        `UPDATE users SET is_verified = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING id, username, role, is_verified`,
        [Boolean(is_verified), req.params.id]
      );
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Verify user error:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

router.get("/api/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, email, username, full_name, role, avatar_url,
              is_verified, specialty, medicine_system, bio, license_number
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to load profile" });
  }
});

router.post(
  "/api/storage/upload",
  authenticateToken,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const bucket = String(req.body.bucket || "uploads").replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );
    return res.json({
      data: {
        path: req.file.filename,
        publicUrl: `/uploads/${bucket}/${req.file.filename}`,
      },
    });
  }
);

router.post("/api/rpc", authenticateToken, async (req, res) => {
  try {
    const { fn, args = {} } = req.body;
    if (fn === "log_video_access") {
      await pool.query(
        `INSERT INTO video_access_logs (video_id, user_id)
         VALUES ($1, $2)`,
        [args.video_id || args.consultation_video_id || null, req.user.id]
      );
    }
    res.json({ data: true });
  } catch (error) {
    console.error("RPC error:", error);
    res.status(500).json({ error: "RPC failed" });
  }
});

export default router;
