const mysql = require("mysql2/promise"); // Ensure you're using `mysql2/promise`
require("dotenv").config();

async function dbConnect() {
  try {
    const pool = mysql.createPool({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "graphic_solutions_db",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log("✅ MySQL Connection Pool Created!");
    return pool; // Return the pool, not a single connection
  } catch (error) {
    console.error("❌ Database Connection Error:", error);
    process.exit(1);
  }
}

module.exports = dbConnect;