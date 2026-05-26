/* global require, module, process */
require("dotenv").config();
const mysql = require("mysql2");

const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "urgentflow",
  port: parseInt(process.env.DB_PORT || "3306", 10),
});

db.connect((err) => {
  if (err) {
    console.log("DB connection failed:", err.message);
  } else {
    console.log("MySQL connected");
  }
});

module.exports = db;
