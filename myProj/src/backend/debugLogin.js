require("dotenv").config();
const db = require("./config/db");
const bcrypt = require("bcrypt");

async function main() {
  const pool = db.promise();

  // Check if role/service_scope columns exist
  console.log("\n── Checking users table columns ──");
  const [cols] = await pool.query("SHOW COLUMNS FROM users");
  const colNames = cols.map(c => c.Field);
  console.log("Columns:", colNames.join(", "));

  const hasRole = colNames.includes("role");
  const hasScope = colNames.includes("service_scope");
  console.log("Has 'role' column:", hasRole);
  console.log("Has 'service_scope' column:", hasScope);

  // Show all users (email + role only, no passwords)
  console.log("\n── All users in DB ──");
  const [users] = await pool.query("SELECT id, email, role, service_scope FROM users LIMIT 20");
  console.table(users);

  // Test bcrypt compare for superadmin
  console.log("\n── Testing superadmin password ──");
  const [rows] = await pool.query("SELECT password FROM users WHERE LOWER(email) = LOWER(?)", ["superadmin@urgentflow.com"]);
  if (!rows.length) {
    console.log("❌ superadmin@urgentflow.com NOT FOUND in DB");
  } else {
    const match = await bcrypt.compare("SuperAdmin123!", rows[0].password);
    console.log("Password 'SuperAdmin123!' matches:", match);
  }

  // Test a regular user
  console.log("\n── Testing mariemsebai913@gmail.com ──");
  const [rows2] = await pool.query("SELECT password FROM users WHERE LOWER(email) = LOWER(?)", ["mariemsebai913@gmail.com"]);
  if (!rows2.length) {
    console.log("❌ mariemsebai913@gmail.com NOT FOUND in DB");
  } else {
    console.log("✅ Found. Password hash:", rows2[0].password.slice(0, 20) + "...");
  }

  process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
