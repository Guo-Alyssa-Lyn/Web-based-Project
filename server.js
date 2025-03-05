const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const MySQLStore = require("express-mysql-session")(session);
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const dbConnect = require("./db_connect");
require("dotenv").config();

const app = express();

// 🛡 Security Middleware
app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// 🌍 CORS Configuration
app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:5500"], // ✅ Allow both frontend origins
    credentials: true, // ✅ Allows cookies & sessions
    methods: ["GET", "POST", "PUT", "DELETE"], // ✅ Ensure allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // ✅ Include required headers
  })
);



// 🚦 Rate Limiting Middleware
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many login attempts, please try again later" },
});

const registrationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: "Too many registration attempts, please try again later" },
});

let db;
let sessionStore;

async function main() {
  try {
    db = await dbConnect();
    sessionStore = new MySQLStore({ createDatabaseTable: true }, db);

    app.use(
      session({
        secret: process.env.SESSION_SECRET || "your-secret-key",
        resave: false,
        saveUninitialized: false,
        store: sessionStore,
        cookie: {
          secure: process.env.NODE_ENV === "production", // Secure cookies only in production
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24, // 1 day
        },
      })
    );

    // 📌 Debugging Middleware
    app.use((req, res, next) => {
      console.log("📌 Session Info:", {
        sessionExists: !!req.session,
        sessionId: req.sessionID,
        sessionUser: req.session?.user || null,
      });
      next();
    });

    // ✅ API Endpoints
    app.get("/", (req, res) => res.send("Welcome to the API"));

    // 🔐 User Registration
    app.post("/api/register", registrationLimiter, async (req, res) => {
      try {
        const { fullName, jobRole, email, username, password, accountType } = req.body;
        if (![fullName, jobRole, email, username, password, accountType].every(Boolean)) {
          return res.status(400).json({ success: false, message: "All fields are required" });
        }

        const validTables = {
          admin: "admin_account_table",
          user: "user_account_table",
        };

        if (!validTables[accountType]) {
          return res.status(400).json({ success: false, message: "Invalid account type" });
        }

        const tableName = validTables[accountType];
        const [existingUser] = await db.execute(`SELECT id FROM ${tableName} WHERE username = ?`, [username]);
        if (existingUser.length > 0) {
          return res.status(409).json({ success: false, message: "Username already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.execute(
          `INSERT INTO ${tableName} (full_name, job_role, username, password, email, account_type) VALUES (?, ?, ?, ?, ?, ?);`,
          [fullName, jobRole, username, hashedPassword, email, accountType]
        );

        res.status(201).json({ success: true, message: "✅ Account created successfully!" });
      } catch (error) {
        console.error("❌ Registration Error:", error);
        res.status(500).json({ success: false, message: "Server error, try again later." });
      }
    });

    // 🔓 User Login
    app.post("/api/login", loginLimiter, async (req, res) => {
      try {
        const { username, password } = req.body;
        if (!username || !password) {
          return res.status(400).json({ success: false, message: "All fields are required" });
        }
    
        // Try finding the user in both tables
        const [userRows] = await db.execute("SELECT * FROM user_account_table WHERE username = ?", [username]);
        const [adminRows] = await db.execute("SELECT * FROM admin_account_table WHERE username = ?", [username]);
    
        const account = userRows.length ? userRows[0] : adminRows.length ? adminRows[0] : null;
    
        if (!account) {
          return res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    
        // Check password
        const passwordMatch = await bcrypt.compare(password, account.password);
        if (!passwordMatch) {
          return res.status(401).json({ success: false, message: "Invalid username or password" });
        }
    
        // Store session
        req.session.user = {
          id: account.id,
          username: account.username,
          email: account.email,
          full_name: account.full_name,
          job_role: account.job_role,
          accountType: userRows.length ? "user" : "admin",
        };
    
        req.session.save((err) => {
          if (err) {
            console.error("❌ Session Save Error:", err);
            return res.status(500).json({ success: false, message: "Session error, try again later." });
          }
          console.log("✅ User Logged In:", req.session.user);
          res.json({ success: true, user: req.session.user });
        });
      } catch (error) {
        console.error("❌ Login Error:", error);
        res.status(500).json({ success: false, message: "Server error, try again later." });
      }
    });    

    // 👤 Fetch Profile Data
    app.get("/api/profile", (req, res) => {
      if (!req.session.user) {
        return res.status(401).json({ success: false, message: "Unauthorized. Please log in." });
      }
      res.json({ success: true, user: req.session.user });
    });

    // 🚪 Logout
    app.post("/api/logout", (req, res) => {
      req.session.destroy(() => {
        res.clearCookie("session_cookie_name");
        res.json({ success: true, message: "Logged out successfully" });
      });
    });

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  } catch (error) {
    console.error("❌ Error initializing server:", error);
    process.exit(1);
  }
}

main();