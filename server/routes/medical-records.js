import express from "express";
import multer from "multer";
import path from "path";
import pool from "../db.js";

const router = express.Router();

/* ===========================
   File Storage Setup
=========================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },

  filename: (req, file, cb) => {
    cb(
      null,
      Date.now() +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

/* ===========================
   GET Records
=========================== */

router.get("/:dependentId", async (req, res) => {

  try {

    const { dependentId } = req.params;

    const result = await pool.query(
      `SELECT *
       FROM medical_records
       WHERE dependent_id=$1
       ORDER BY record_date DESC`,
      [dependentId]
    );

    res.json(result.rows);

  } catch (err) {

    console.error("GET ERROR:", err);

    res.status(500).json({
      error: err.message
    });

  }

});

/* ===========================
   Upload Record
=========================== */

router.post(
  "/",
  upload.single("file"),
  async (req, res) => {

    try {

      const {
        record_type,
        record_name,
        record_date,
        description,
        dependent_id,
      } = req.body;

      if (!req.file) {
        return res
          .status(400)
          .json({
            error: "No file uploaded",
          });
      }

      const fileName =
        req.file.filename;

      await pool.query(
        `INSERT INTO medical_records
        (
          dependent_id,
          record_type,
          record_name,
          record_date,
          description,
          record_url
        )
        VALUES ($1,$2,$3,$4,$5,$6)`,
        [
          dependent_id,
          record_type,
          record_name,
          record_date,
          description,
          fileName,
        ]
      );

      res.json({
        message:
          "Record uploaded successfully",
      });

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Upload failed",
      });

    }

  }
);

/* ===========================
   DELETE Record
=========================== */

router.delete("/:id", async (req, res) => {

  try {

    await pool.query(
      "DELETE FROM medical_records WHERE id=$1",
      [req.params.id]
    );

    res.json({
      message: "Deleted",
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Delete failed",
    });

  }

});

export default router;