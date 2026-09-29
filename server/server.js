import express from "express";
import cors from "cors";
import path from "path";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import http from "http";
import multer from "multer";
import { Server } from "socket.io";
import { fileURLToPath } from "url";
import OpenAI from "openai";

import pool from "./db.js";
import authRoutes from "./routes/auth.js";
import medicalRoutes from "./routes/medical-records.js";
import providerReviewRoutes from "./routes/provider-reviews.js";
import notificationsRoutes from "./routes/notifications.js";
import discussionsRoutes from "./routes/discussions.js";
import subscriptionPlansRoutes from "./routes/subscription-plans.js";
import subscriptionsRoutes from "./routes/subscriptions.js";


dotenv.config();

const app = express();


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.use(cors());
app.use(express.json());

app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

app.use("/auth", authRoutes);

// Register API route
app.use("/api/medical-records", medicalRoutes);

app.use(
  "/api/provider-reviews",providerReviewRoutes);

app.use("/notifications", notificationsRoutes);

app.use(
  "/",
  discussionsRoutes
);

app.use("/api/subscription-plans", subscriptionPlansRoutes);
app.use("/api/subscriptions", subscriptionsRoutes);

/* =========================
   CREATE POST
========================= */

app.post("/posts", async (req, res) => {
  try {

    console.log("Incoming post data:", req.body);

    const {
      user_id = null,
      title = null,
      condition = null,
      symptoms_description = null,
      symptoms_started_date = null,
      diagnosis_date = null,
      current_status = null,
      outcome_description = null,
      country = null,
      is_anonymous = false
    } = req.body;

    const result = await pool.query(
      `INSERT INTO posts
      (user_id,title,condition,symptoms_description,
      symptoms_started_date,diagnosis_date,current_status,
      outcome_description,country,is_anonymous)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        user_id,
        title,
        condition,
        symptoms_description,
        symptoms_started_date,
        diagnosis_date,
        current_status,
        outcome_description,
        country,
        is_anonymous
      ]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error("POST ERROR:", err);
    res.status(500).json({ error: err.message });

  }
});


/* =========================
   GET POSTS (FEED)
========================= */

app.get("/posts", async (req, res) => {

  try {

    const result = await pool.query(`
      SELECT 
        posts.*,
        users.username,
        COUNT(DISTINCT likes.id) AS like_count,
        COUNT(DISTINCT comments.id) AS comment_count
      FROM posts
      JOIN users ON posts.user_id = users.id
      LEFT JOIN likes ON posts.id = likes.post_id
      LEFT JOIN comments ON posts.id = comments.post_id
      GROUP BY posts.id, users.username
      ORDER BY posts.created_at DESC
    `);

    res.json(result.rows);

  } catch (err) {

    console.error("FETCH POSTS ERROR:", err);

    res.status(500).json({
      error: "Failed to fetch posts"
    });

  }

});


/* =========================
   LIKE POST
========================= */

app.post("/posts/:id/like", async (req, res) => {

  try {

    const postId = req.params.id;
    const { user_id } = req.body;

    const existing = await pool.query(
      `SELECT * FROM likes
       WHERE user_id = $1 AND post_id = $2`,
      [user_id, postId]
    );

    // UNLIKE
    if (existing.rows.length > 0) {

      await pool.query(
        `DELETE FROM likes
         WHERE user_id = $1 AND post_id = $2`,
        [user_id, postId]
      );

      return res.json({ liked: false });

    }

    // LIKE
    await pool.query(
      `INSERT INTO likes (user_id, post_id)
       VALUES ($1,$2)`,
      [user_id, postId]
    );

    res.json({ liked: true });

  } catch (err) {

    console.error("LIKE ERROR:", err);

    res.status(500).json({
      error: "Failed to toggle like"
    });

  }

});

app.post("/posts/:id/comments", async (req, res) => {

  try {

    const postId = req.params.id;
    const { user_id, comment } = req.body;

    const result = await pool.query(
      `INSERT INTO comments (user_id, post_id, comment)
       VALUES ($1,$2,$3)
       RETURNING *`,
      [user_id, postId, comment]
    );

    io.emit("new_comment", result.rows[0]);

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);
    res.status(500).json({ error: "Failed to add comment" });

  }

});

app.get("/posts/:id/comments", async (req, res) => {
  try {
    const postId = req.params.id;

    const result = await pool.query(
      `SELECT 
         c.id,
         c.comment,
         c.created_at,
         u.username
       FROM comments c
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.post_id = $1
       ORDER BY c.created_at ASC`,
      [postId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
});

app.delete("/comments/:id", async (req, res) => {

  try {

    const { id } = req.params;

    // Get discussion_id first
    const result = await pool.query(
      `
      SELECT discussion_id
      FROM discussion_comments
      WHERE id = $1
      `,
      [id]
    );

    const discussionId =
      result.rows[0].discussion_id;

    // Delete comment
    await pool.query(
      `
      DELETE FROM discussion_comments
      WHERE id = $1
      `,
      [id]
    );

    // Recalculate comment count
    const countResult =
      await pool.query(
        `
        SELECT COUNT(*) 
        FROM discussion_comments
        WHERE discussion_id = $1
        `,
        [discussionId]
      );

    const count =
      countResult.rows[0].count;

    // Update discussions table
    await pool.query(
      `
      UPDATE discussions
      SET comment_count = $1
      WHERE id = $2
      `,
      [count, discussionId]
    );

    res.json({
      success: true
    });

  }

  catch (err) {

    console.error(
      "Delete comment error:",
      err
    );

    res.status(500).json({
      error: "Delete failed"
    });

  }

});

app.put("/comments/:id", async (req, res) => {

  try {

    const { id } = req.params;
    const { comment } = req.body;

    console.log("PUT comment update");
    console.log("ID:", id);
    console.log("Body:", req.body);

    if (!comment) {

      return res.status(400).json({
        error: "Comment text required"
      });

    }

    const result = await pool.query(
      `
      UPDATE discussion_comments
      SET comment = $1
      WHERE id = $2
      RETURNING *
      `,
      [comment, id]
    );

    if (result.rows.length === 0) {

      return res.status(404).json({
        error: "Comment not found"
      });

    }

    res.json({
      success: true,
      comment: result.rows[0]
    });

  }

  catch (err) {

    console.error(
      "❌ PUT update error:",
      err
    );

    res.status(500).json({
      error: err.message
    });

  }

});

const editComment = async (commentId, postId) => {

  try {

    await fetch(`http://localhost:5000/comments/${commentId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        comment: editedText
      })
    });

    setEditingCommentId(null);
    setEditedText("");

    await fetchComments(postId);   // reload comments
    fetchPosts();                  // update count

  } catch (err) {

    console.error("Edit comment error:", err);

  }

};

app.delete("/posts/:id", async (req, res) => {

  try {

    const postId = req.params.id;

    await pool.query(
      `DELETE FROM posts WHERE id = $1`,
      [postId]
    );

    res.json({ success: true });

  } catch (err) {

    console.error("DELETE POST ERROR:", err);

    res.status(500).json({
      error: "Failed to delete post"
    });

  }

});

app.post("/posts/:postId/comments", async (req, res) => {

  const { postId } = req.params;
  const { user_id, comment } = req.body;

  console.log("Incoming:", user_id, comment); // 👈 debug

  if (!user_id) {
    return res.status(400).json({ error: "User ID missing" });
  }

  const result = await pool.query(
    `INSERT INTO comments (user_id, post_id, comment)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [user_id, postId, comment]
  );

  res.json(result.rows[0]);

});

app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT id, username, email, password_hash, avatar_url FROM users WHERE email = $1",
      [email]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(400).json({ error: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // ✅ IMPORTANT FIX
    res.json({
      message: "Login success",
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar_url: user.avatar_url,
        fullName: user.full_name || "",
        role: user.role || "patient"
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});

/* =========================
   START SERVER
========================= */

const PORT = 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, "uploads");

    console.log("UPLOAD PATH:", uploadPath); // debug

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

app.post("/upload-profile", upload.single("avatar"), async (req, res) => {
  try {
    const userId = req.body.user_id;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;

    await pool.query(
      "UPDATE users SET avatar_url = $1 WHERE id = $2",
      [fileUrl, userId]
    );

    res.json({
      message: "Upload success",
      file_url: fileUrl
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

/* =========================
   SEND MESSAGE + FREE BOT
========================= */

app.post("/chat", async (req, res) => {

  try {

    console.log("Chat request received");

    const BOT_ID =
      "00000000-0000-0000-0000-000000000000";

    const {
      message,
      user_id,
      conversation_id
    } = req.body;

    if (!message || !user_id || !conversation_id) {

      return res.status(400).json({
        error: "Missing data"
      });

    }

    /* =========================
       SAVE USER MESSAGE
    ========================== */

    await pool.query(
      `
      INSERT INTO chats
      (sender_id, message, conversation_id, is_bot)
      VALUES ($1,$2,$3,false)
      `,
      [
        user_id,
        message,
        conversation_id
      ]
    );



    /* =========================
       FREE SMART CHATBOT LOGIC
    ========================== */

    let botReplyText =
      "I'm here to help! Please ask about symptoms, services, or medical guidance.";

    const userMessage =
      message.toLowerCase();



    /* GREETING */

    if (
      userMessage.includes("hi") ||
      userMessage.includes("hello")
    ) {

      botReplyText =
        "Hello! I'm VELA, your healthcare assistant. How can I help you today?";

    }



    /* SERVICES */

    else if (
      userMessage.includes("services") ||
      userMessage.includes("what do you provide")
    ) {

      botReplyText =
        `We provide the following services:

• Doctor consultations  
• Medical record uploads  
• Symptom discussions  
• Counselling sessions  
• Physician connections`;

    }



    /* FEVER */

    else if (
      userMessage.includes("fever")
    ) {

      botReplyText =
        `Common symptoms of fever include:

• High temperature  
• Sweating  
• Chills  
• Headache  
• Weakness  

If fever continues for more than 2 days, please consult a doctor.`;

    }



    /* HEADACHE */

    else if (
      userMessage.includes("headache")
    ) {

      botReplyText =
        `Headache may be caused by:

• Stress  
• Dehydration  
• Lack of sleep  

Drink water and rest. If persistent, consult a doctor.`;

    }



    /* UPLOAD RECORD */

    else if (
      userMessage.includes("upload")
    ) {

      botReplyText =
        "You can upload medical records from the 'Medical Records' section on your dashboard.";

    }



    /* DEFAULT RESPONSE */

    else {

      botReplyText =
        "I'm here to help with symptoms, services, and medical questions. Please ask something specific.";

    }



    /* =========================
       SAVE BOT MESSAGE
    ========================== */

    await pool.query(
      `
      INSERT INTO chats
      (sender_id, message, conversation_id, is_bot)
      VALUES ($1,$2,$3,true)
      `,
      [
        BOT_ID,
        botReplyText,
        conversation_id
      ]
    );



    /* =========================
       SEND RESPONSE
    ========================== */

    res.json({
      reply: botReplyText
    });

  }

  catch (err) {

    console.error(
      "CHAT ROUTE ERROR:",
      err
    );

    res.status(500).json({
      error: err.message
    });

  }

});

app.get("/connections/pending/:userId", async (req, res) => {

  const { userId } = req.params;

  try {

    const result = await pool.query(

      `SELECT 
         c.id,
         c.sender_id,
         c.receiver_id,
         c.status,
         c.created_at,
         u.username AS sender_name
       FROM connections c
       LEFT JOIN users u
         ON c.sender_id = u.id
       WHERE c.receiver_id = $1
       AND c.status = 'pending'
       ORDER BY c.created_at DESC`,

      [userId]

    );

    console.log("Pending result:", result.rows);

    res.json(result.rows);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});

app.post("/connections/accept", async (req, res) => {

  const { connection_id } = req.body;

  try {

    await pool.query(

      `UPDATE connections
       SET status = 'accepted'
       WHERE id = $1`,

      [connection_id]

    );

    res.json({ message: "Connection accepted" });

  } catch (err) {

    res.status(500).json({ error: err.message });

  }

});

app.get("/users", async (req, res) => {

  try {

    const result = await pool.query(
      "SELECT id, username, email FROM users"
    );

    res.json(result.rows);

  } catch (err) {

    console.error(err);
    res.status(500).json({
      error: err.message
    });

  }

});

app.get("/connections/accepted/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT 
        c.id,
        u.id as user_id,
        u.username,
        u.email,
        u.avatar_url
      FROM connections c
      JOIN users u
        ON (
          (c.sender_id = u.id AND c.receiver_id = $1)
          OR
          (c.receiver_id = u.id AND c.sender_id = $1)
        )
      WHERE c.status = 'accepted'
      `,
      [userId]
    );

    console.log("Accepted connections:", result.rows);

    res.json(result.rows);

  } catch (err) {
    console.error("Accepted error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* REJECT CONNECTION */

app.put("/connections/reject/:id", async (req, res) => {

  const { id } = req.params;

  try {

    await pool.query(
      `UPDATE connections
       SET status = 'rejected'
       WHERE id = $1`,
      [id]
    );

    res.json({ message: "Rejected" });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});


/* REMOVE CONNECTION */

app.delete("/connections/remove/:id", async (req, res) => {

  const { id } = req.params;

  try {

    await pool.query(
      `DELETE FROM connections
       WHERE id = $1`,
      [id]
    );

    res.json({ message: "Removed" });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: err.message
    });

  }

});

/* =========================
   START NEW CHAT
========================= */

app.post("/chat/start", async (req, res) => {

  try {

    const { user1, user2 } = req.body;

    if (!user1 || !user2) {

      return res.status(400).json({
        error: "Missing users"
      });

    }

    // Sort users safely
    const sortedUsers =
      [user1, user2].sort();

    const conversationId =
      `${sortedUsers[0]}_${sortedUsers[1]}`;

    console.log(
      "Conversation ID:",
      conversationId
    );

    res.json({
      conversation_id: conversationId
    });

  }

  catch (err) {

    console.error(
      "Chat start error:",
      err
    );

    res.status(500).json({
      error: err.message
    });

  }

});

app.get("/profile/:id", async (req, res) => {

  try {

    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        id,
        username,
        email,
        avatar_url
      FROM users
      WHERE id = $1
      `,
      [id]
    );

    res.json(result.rows[0]);

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Profile fetch failed"
    });

  }

});

/* =========================
   GET USER CONVERSATIONS
========================= */

app.get("/conversations/:userId", async (req, res) => {

  try {

    const { userId } = req.params;

    console.log(
      "Loading conversations for:",
      userId
    );

    const result = await pool.query(
      `
      SELECT DISTINCT conversation_id
      FROM chats
      WHERE
        split_part(conversation_id, '_', 1) = $1
        OR
        split_part(conversation_id, '_', 2) = $1
      ORDER BY conversation_id DESC
      `,
      [userId]
    );

    console.log(
      "Conversations found:",
      result.rows
    );

    res.json(result.rows);

  }

  catch (err) {

    console.error(
      "Failed to load conversations:",
      err
    );

    res.status(500).json({
      error: "Failed to load conversations"
    });

  }

});

/* =========================
   GET CHAT MESSAGES
========================= */

app.get("/chats/:conversation_id", async (req, res) => {

  try {

    const { conversation_id } = req.params;

    const result = await pool.query(
      `
      SELECT 
        c.*,
        u.username,
        u.avatar_url
      FROM chats c
      LEFT JOIN users u
        ON c.sender_id = u.id
      WHERE 
        c.conversation_id = $1
        AND c.is_bot = false   -- ⭐ IMPORTANT
      ORDER BY c.created_at ASC;
      `,
      [conversation_id]
    );

    res.json(result.rows);

  }

  catch (err) {

    console.error("Chats fetch error:", err);

    res.status(500).json({
      error: "Failed to fetch chats"
    });

  }

});

/* =========================
   CREATE CONVERSATION
========================= */

app.post("/conversation", async (req, res) => {

  try {

    const { sender_id, receiver_id } = req.body;

    const conversationId =
      crypto.randomUUID();

    res.json({
      conversation_id: conversationId
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to create conversation"
    });

  }

});

/* =========================
   SEND CONNECTION REQUEST
========================= */

app.post("/connection/send", async (req, res) => {

  try {

    const {
      sender_id,
      receiver_id
    } = req.body;

    if (!sender_id || !receiver_id) {

      return res.status(400).json({
        error: "Missing sender or receiver"
      });

    }

    const result = await pool.query(
      `
      INSERT INTO connections
      (sender_id, receiver_id, status)
      VALUES ($1,$2,'pending')
      RETURNING *
      `,
      [
        sender_id,
        receiver_id
      ]
    );

    res.json(result.rows[0]);

  }

  catch (err) {

    console.error(
      "Send connection error:",
      err
    );

    res.status(500).json({
      error: "Failed to send connection"
    });

  }

});

app.get("/dependents/:userId", async (req, res) => {

  try {

    const { userId } = req.params;

    const result = await pool.query(

      `SELECT *
       FROM dependents
       WHERE parent_id = $1
       ORDER BY created_at DESC`,

      [userId]

    );

    res.json(result.rows);

  }

  catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Failed to fetch dependents"
    });

  }

});

app.get("/dependent-health/:childId", async (req, res) => {

  try {

    const { childId } = req.params;

    const result = await pool.query(

      `SELECT *
       FROM dependent_health_issues
       WHERE dependent_id = $1`,

      [childId]

    );

    res.json(result.rows);

  }

  catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Fetch failed"
    });

  }

});

app.post("/add-dependent", async (req, res) => {

  try {

    const data = req.body;

    const result = await pool.query(

      `INSERT INTO dependents (
        parent_id,
        full_name,
        date_of_birth,
        gender,
        relationship,
        blood_group,
        allergies,
        chronic_conditions,
        current_medications,
        notes,
        caregiver_name,
        caregiver_relationship
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12
      )
      RETURNING *`,

      [
        data.parent_id,
        data.full_name,
        data.date_of_birth,
        data.gender,
        data.relationship,
        data.blood_group,
        data.allergies,
        data.chronic_conditions,
        data.current_medications,
        data.notes,
        data.caregiver_name,
        data.caregiver_relationship
      ]

    );

    res.json(result.rows[0]);

  }

  catch (err) {

    console.error(err);

    res.status(500).json({
      error: "Insert failed"
    });

  }

});

// LIKE / UNLIKE REVIEW

app.post(
  "/api/provider-reviews/:id/like",
  async (req, res) => {

    try {

      const reviewId = req.params.id;
      const { user_id } = req.body;

      // Check if already liked

      const existing =
        await pool.query(
          `
          SELECT *
          FROM review_likes
          WHERE review_id = $1
          AND user_id = $2
          `,
          [reviewId, user_id]
        );

      if (existing.rows.length > 0) {

        // UNLIKE

        await pool.query(
          `
          DELETE FROM review_likes
          WHERE review_id = $1
          AND user_id = $2
          `,
          [reviewId, user_id]
        );

        return res.json({
          message: "Unliked"
        });

      } else {

        // LIKE

        await pool.query(
          `
          INSERT INTO review_likes
          (review_id, user_id)
          VALUES ($1, $2)
          `,
          [reviewId, user_id]
        );

        return res.json({
          message: "Liked"
        });

      }

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Like failed"
      });

    }

  }
);

// GET review comments

app.get(
  "/api/provider-reviews/:id/comments",
  async (req, res) => {

    try {

      const reviewId = req.params.id;

      const result =
        await pool.query(
          `
          SELECT 
            rc.*,
            u.username
          FROM review_comments rc
          LEFT JOIN users u
          ON rc.user_id = u.id::text
          WHERE rc.review_id = $1
          ORDER BY rc.created_at ASC
          `,
          [reviewId]
        );

      res.json(result.rows);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Failed to fetch comments"
      });

    }

  }
);

// ADD comment

app.post(
  "/api/provider-reviews/:id/comments",
  async (req, res) => {

    try {

      const reviewId = req.params.id;

      const {
        user_id,
        comment
      } = req.body;

      const result =
        await pool.query(
          `
          INSERT INTO review_comments
          (review_id, user_id, comment)
          VALUES ($1, $2, $3)
          RETURNING *
          `,
          [reviewId, user_id, comment]
        );

      res.json(result.rows[0]);

    } catch (err) {

      console.error(err);

      res.status(500).json({
        error: "Comment failed"
      });

    }

  }
);

/* =========================
   GET DISCUSSIONS
========================= */

app.get("/discussions", async (req, res) => {

  try {

    const result =
      await pool.query(
        `
        SELECT
          d.*,
          u.full_name,
          u.username,

          COUNT(c.id) AS comment_count

        FROM discussions d

        LEFT JOIN users u
          ON d.user_id = u.id

        LEFT JOIN discussion_comments c
          ON c.discussion_id = d.id

        GROUP BY
          d.id,
          u.full_name,
          u.username

        ORDER BY
          d.created_at DESC
        `
      );

    res.json(result.rows);

  }

  catch (err) {

    console.error(
      "Fetch discussions error:",
      err
    );

    res.status(500).json({
      error:
        "Failed to fetch discussions"
    });

  }

});

/* =========================
   CREATE DISCUSSION
========================= */

app.post("/discussions", async (req, res) => {

  try {

    const {

      user_id,
      title,
      category,
      symptoms,
      description,
      severity,
      duration,
      is_anonymous

    } = req.body;

    await pool.query(
      `
      INSERT INTO discussions
      (
        user_id,
        title,
        category,
        symptoms,
        description,
        severity,
        duration,
        is_anonymous
      )

      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
      `,
      [
        user_id,
        title,
        category,
        symptoms,
        description,
        severity,
        duration,
        is_anonymous
      ]
    );

    res.json({
      success: true
    });

  }

  catch (err) {

    console.error(
      "Create discussion error:",
      err
    );

    res.status(500).json({
      error:
        "Failed to create discussion"
    });

  }

});

/* =========================
   INCREMENT VIEW COUNT
========================= */

app.post("/discussions/:id/view", async (req, res) => {

  try {

    const { id } = req.params;

    await pool.query(
      `
      UPDATE discussions
      SET view_count = view_count + 1
      WHERE id = $1
      `,
      [id]
    );

    res.json({
      success: true
    });

  }

  catch (err) {

    console.error(
      "View update error:",
      err
    );

    res.status(500).json({
      error:
        "Failed to update views"
    });

  }

});

/* =========================
   INCREMENT VIEW COUNT
========================= */

app.post(
  "/discussions/:id/view",
  async (req, res) => {

    try {

      const { id } = req.params;

      await pool.query(
        `
        UPDATE discussions
        SET view_count =
            view_count + 1
        WHERE id = $1
        `,
        [id]
      );

      res.json({
        success: true
      });

    }

    catch (err) {

      console.error(
        "View update error:",
        err
      );

      res.status(500).json({
        error:
          "Failed to update views"
      });

    }

});

app.post("/comments", async (req, res) => {

  try {

    const {
      discussion_id,
      user_id,
      comment,
      parent_id
    } = req.body;

    await pool.query(
      `
      INSERT INTO discussion_comments
      (
        discussion_id,
        user_id,
        comment,
        parent_id
      )
      VALUES ($1,$2,$3,$4)
      `,
      [
        discussion_id,
        user_id,
        comment,
        parent_id || null
      ]
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

/* =========================
   GET COMMENTS
========================= */

app.get("/comments/:discussionId", async (req, res) => {

  try {

    const { discussionId } = req.params;
    const { user_id } = req.query;

    console.log("Fetching comments for:", discussionId);

    const result = await pool.query(
      `
      SELECT 
        dc.id,
        dc.comment,
        dc.user_id,
        dc.parent_id,
        dc.created_at,
        u.full_name,
        COALESCE(dc.helpful_count, 0) AS helpful_count,
        CASE WHEN $2::uuid IS NOT NULL AND EXISTS (
          SELECT 1 FROM comment_reactions cr
          WHERE cr.comment_id = dc.id
            AND cr.user_id = $2::uuid
            AND cr.reaction_type = 'helpful'
        ) THEN true ELSE false END AS user_has_reacted
      FROM discussion_comments dc
      LEFT JOIN users u 
        ON dc.user_id = u.id
      WHERE dc.discussion_id = $1
      ORDER BY dc.created_at ASC
      `,
      [discussionId, user_id || null]
    );

    console.log("Comments fetched:", result.rows);

    res.json(result.rows);

  } 

  catch (err) {

    console.error(
      "Fetch comments error:",
      err
    );

    res.status(500).json({
      error: err.message   // ✅ shows real SQL error
    });

  }

});

app.post("/comments/helpful", async (req, res) => {

  const client = await pool.connect();

  try {

    const { comment_id, user_id } = req.body;

    if (!comment_id || !user_id) {
      client.release();
      return res.status(400).json({
        error: "comment_id and user_id are required"
      });
    }

    await client.query("BEGIN");

    const existing = await client.query(
      `
      SELECT id FROM comment_reactions
      WHERE comment_id = $1
        AND user_id = $2
        AND reaction_type = 'helpful'
      `,
      [comment_id, user_id]
    );

    let reacted;

    if (existing.rows.length > 0) {

      await client.query(
        `
        DELETE FROM comment_reactions
        WHERE comment_id = $1
          AND user_id = $2
          AND reaction_type = 'helpful'
        `,
        [comment_id, user_id]
      );

      await client.query(
        `
        UPDATE discussion_comments
        SET helpful_count = GREATEST(COALESCE(helpful_count,0) - 1, 0)
        WHERE id = $1
        `,
        [comment_id]
      );

      reacted = false;

    } else {

      await client.query(
        `
        INSERT INTO comment_reactions (id, comment_id, user_id, reaction_type)
        VALUES (gen_random_uuid(), $1, $2, 'helpful')
        `,
        [comment_id, user_id]
      );

      await client.query(
        `
        UPDATE discussion_comments
        SET helpful_count = COALESCE(helpful_count,0) + 1
        WHERE id = $1
        `,
        [comment_id]
      );

      reacted = true;

    }

    await client.query("COMMIT");

    res.json({
      success: true,
      reacted
    });

  }

  catch (err) {

    await client.query("ROLLBACK");

    console.error(
      "Helpful error:",
      err
    );

    res.status(500).json({
      error: "Failed to update helpful"
    });

  }

  finally {
    client.release();
  }

});

app.post('/api/subscription/save', async (req, res) => {

  console.log('API HIT');
  console.log(req.body);

  try {

    const {
      user_email,
      plan_name,
      amount,
      billing_cycle,
      payment_id
    } = req.body;

    const result = await pool.query(
      `
      INSERT INTO subscriptions
      (
        user_email,
        plan_name,
        amount,
        billing_cycle,
        payment_id,
        status
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        user_email,
        plan_name,
        amount,
        billing_cycle,
        payment_id,
        'active'
      ]
    );

    console.log('INSERT SUCCESS:', result.rows);

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {

    console.error('Subscription save error:', error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});