import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "healdox",
  password: "ashika_11",
  port: 5432,
});

export default pool;