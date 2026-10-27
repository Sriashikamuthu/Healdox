import express from "express";
import pool from "../db.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

const ALLOWED_TABLES = new Set([
  "consultation_requests",
  "appointments",
  "counselling_sessions",
  "physician_services",
  "medical_suggestions",
  "medical_record_requests",
  "medical_record_shares",
  "patient_data_access_requests",
  "pharma_physician_messages",
  "free_consultation_offers",
  "free_consultation_applications",
  "medical_records_listings",
  "medical_records_bids",
  "medical_records_sales",
  "escrow_payments",
  "corporate_verifications",
  "consultation_videos",
  "user_connections",
  "dependent_consultation_requests",
  "profiles",
  "patient_journeys",
  "subscriptions",
]);

const TABLE_MAP = {
  patient_journeys: "posts",
};

const ACCESS_COLUMNS = {
  consultation_requests: ["member_id", "professional_id"],
  appointments: ["patient_id", "provider_id"],
  counselling_sessions: ["member_id", "physician_id"],
  physician_services: ["physician_id"],
  medical_suggestions: ["patient_id", "physician_id"],
  medical_record_requests: ["patient_id", "requester_id"],
  medical_record_shares: ["patient_id", "recipient_id"],
  patient_data_access_requests: ["patient_id", "pharma_company_id"],
  pharma_physician_messages: ["pharma_company_id", "physician_id", "sender_id"],
  free_consultation_offers: ["physician_id"],
  free_consultation_applications: ["patient_id"],
  medical_records_listings: ["owner_id"],
  medical_records_bids: ["bidder_id"],
  medical_records_sales: ["buyer_id", "seller_id"],
  consultation_videos: ["owner_id"],
  user_connections: ["requester_id", "receiver_id"],
  dependent_consultation_requests: ["parent_id", "pediatrician_id"],
  profiles: ["id"],
  posts: ["user_id"],
  subscriptions: ["user_id", "user_email"],
};

const IDENT = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

function quoteIdent(name) {
  if (!IDENT.test(name)) {
    throw new Error("Invalid identifier");
  }
  return `"${name}"`;
}

function resolveTable(table) {
  const mapped = TABLE_MAP[table] || table;
  if (!ALLOWED_TABLES.has(table) && mapped !== "posts") {
    return null;
  }
  return mapped;
}

function canAccessRow(table, row, user) {
  if (user.role === "admin") return true;
  if (table === "profiles" || table === "users") return true;
  if (table === "free_consultation_offers") return true;
  if (table === "medical_records_listings") return true;
  if (table === "corporate_verifications") return true;
  if (table === "physician_services") return true;
  if (table === "posts") return true;

  const columns = ACCESS_COLUMNS[table] || [];
  if (columns.length === 0) return false;
  return columns.some((column) => String(row[column]) === String(user.id));
}

function accessSql(table, user, startIndex = 1) {
  if (user.role === "admin") return { sql: "TRUE", params: [] };
  const columns = ACCESS_COLUMNS[table];
  if (!columns?.length) return { sql: "TRUE", params: [] };
  if (
    table === "profiles" ||
    table === "free_consultation_offers" ||
    table === "medical_records_listings" ||
    table === "physician_services" ||
    table === "posts"
  ) {
    return { sql: "TRUE", params: [] };
  }
  const clauses = columns.map(
    (column, index) => `${quoteIdent(column)} = $${startIndex + index}`
  );
  return {
    sql: `(${clauses.join(" OR ")})`,
    params: columns.map(() => user.id),
  };
}

async function loadRelations(table, rows, relations = []) {
  if (!rows.length || !relations.length) return rows;

  for (const relation of relations) {
    const ids = [
      ...new Set(rows.map((row) => row[relation.fk]).filter(Boolean)),
    ];
    if (!ids.length) {
      rows.forEach((row) => {
        row[relation.alias] = null;
      });
      continue;
    }

    let relatedTable = relation.table === "posts" ? "posts" : "users";
    if (relation.table === "dependents") relatedTable = "dependents";

    const result = await pool.query(
      `SELECT * FROM ${quoteIdent(relatedTable)} WHERE id = ANY($1)`,
      [ids]
    );
    const map = Object.fromEntries(result.rows.map((row) => [row.id, row]));
    rows.forEach((row) => {
      const related = map[row[relation.fk]] || null;
      if (related && relatedTable === "users") {
        row[relation.alias] = {
          id: related.id,
          username: related.username,
          full_name: related.full_name,
          specialty: related.specialty,
          medicine_system: related.medicine_system,
          role: related.role,
        };
      } else {
        row[relation.alias] = related;
      }
    });
  }

  return rows;
}

router.post("/query", authenticateToken, async (req, res) => {
  try {
    const { table, operation = "select", filters = [], order, payload, relations } =
      req.body;
    const resolved = resolveTable(table);
    if (!resolved) {
      return res.status(400).json({ error: "Table is not allowed" });
    }

    const user = req.user;

    if (operation === "select") {
      const values = [];
      const clauses = [];
      filters.forEach((filter) => {
        if (!IDENT.test(filter.column)) return;
        values.push(filter.value);
        clauses.push(`${quoteIdent(filter.column)} = $${values.length}`);
      });

      const access = accessSql(resolved, user, values.length + 1);
      values.push(...access.params);
      const where = [...clauses, access.sql].filter(Boolean).join(" AND ");
      const orderSql =
        order?.column && IDENT.test(order.column)
          ? `ORDER BY ${quoteIdent(order.column)} ${
              order.ascending === false ? "DESC" : "ASC"
            }`
          : "";

      const result = await pool.query(
        `SELECT * FROM ${quoteIdent(resolved)} WHERE ${where || "TRUE"} ${orderSql}`,
        values
      );
      const data = await loadRelations(resolved, result.rows, relations);
      return res.json({ data });
    }

    if (operation === "insert") {
      const rows = Array.isArray(payload) ? payload : [payload];
      const inserted = [];
      for (const row of rows) {
        const body = { ...row };
        if (resolved === "profiles") {
          return res.status(400).json({ error: "Cannot insert profiles" });
        }
        const keys = Object.keys(body).filter((key) => IDENT.test(key));
        if (!keys.length) {
          return res.status(400).json({ error: "No fields to insert" });
        }
        const values = keys.map((key) => body[key]);
        const placeholders = keys.map((_, index) => `$${index + 1}`);
        const result = await pool.query(
          `INSERT INTO ${quoteIdent(resolved)} (${keys.map(quoteIdent).join(",")})
           VALUES (${placeholders.join(",")})
           RETURNING *`,
          values
        );
        inserted.push(result.rows[0]);
      }
      return res.json({ data: Array.isArray(payload) ? inserted : inserted[0] });
    }

    if (operation === "update") {
      const body = { ...payload };
      const keys = Object.keys(body).filter((key) => IDENT.test(key));
      if (!keys.length) {
        return res.status(400).json({ error: "No fields to update" });
      }

      const values = keys.map((key) => body[key]);
      const setSql = keys
        .map((key, index) => `${quoteIdent(key)} = $${index + 1}`)
        .join(", ");
      const filterClauses = [];
      filters.forEach((filter) => {
        if (!IDENT.test(filter.column)) return;
        values.push(filter.value);
        filterClauses.push(`${quoteIdent(filter.column)} = $${values.length}`);
      });
      const access = accessSql(resolved, user, values.length + 1);
      values.push(...access.params);

      const targetTable = resolved === "profiles" ? "users" : resolved;
      const result = await pool.query(
        `UPDATE ${quoteIdent(targetTable)}
         SET ${setSql}
         WHERE ${[...filterClauses, access.sql].join(" AND ")}
         RETURNING *`,
        values
      );
      const allowed = result.rows.filter((row) =>
        canAccessRow(resolved, row, user)
      );
      return res.json({ data: allowed[0] || null });
    }

    if (operation === "delete") {
      const values = [];
      const filterClauses = [];
      filters.forEach((filter) => {
        if (!IDENT.test(filter.column)) return;
        values.push(filter.value);
        filterClauses.push(`${quoteIdent(filter.column)} = $${values.length}`);
      });
      if (!filterClauses.length) {
        return res.status(400).json({ error: "Delete requires a filter" });
      }
      const access = accessSql(resolved, user, values.length + 1);
      values.push(...access.params);
      const result = await pool.query(
        `DELETE FROM ${quoteIdent(resolved)}
         WHERE ${[...filterClauses, access.sql].join(" AND ")}
         RETURNING id`,
        values
      );
      return res.json({ data: result.rows });
    }

    return res.status(400).json({ error: "Unsupported operation" });
  } catch (error) {
    console.error("Data query error:", error);
    return res.status(500).json({ error: "Query failed" });
  }
});

export default router;
