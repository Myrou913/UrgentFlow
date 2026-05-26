require("dotenv").config();
const db = require("./config/db");

async function main() {
  const pool = db.promise();

  console.log("\n── All appointments in DB ──");
  const [appts] = await pool.query(
    "SELECT id, user_id, hospital_id, hospital_name, service, appointment_date, status FROM appointments"
  );
  console.table(appts);

  console.log("\n── All hospitals in DB ──");
  const [hospitals] = await pool.query("SELECT id, name, city FROM hospitals");
  console.table(hospitals);

  console.log("\n── Cardiology filter test ──");
  const [cardio] = await pool.query(
    "SELECT id, service, hospital_name FROM appointments WHERE LOWER(COALESCE(service,'')) LIKE ?",
    ["%cardiology%"]
  );
  console.table(cardio);

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
