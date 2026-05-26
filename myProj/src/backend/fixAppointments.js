require("dotenv").config();
const db = require("./config/db");

async function main() {
  const pool = db.promise();

  // 1. Trim leading/trailing spaces from service column
  const [trimResult] = await pool.query(
    "UPDATE appointments SET service = TRIM(service) WHERE service != TRIM(service)"
  );
  console.log(`✅ Trimmed service spaces: ${trimResult.affectedRows} rows`);

  // 2. Backfill hospital_name from hospitals table where it's null
  const [backfillResult] = await pool.query(`
    UPDATE appointments a
    JOIN hospitals h ON CONVERT(a.hospital_id USING utf8mb4) COLLATE utf8mb4_unicode_ci
                      = CONVERT(h.id USING utf8mb4) COLLATE utf8mb4_unicode_ci
    SET a.hospital_name = h.name
    WHERE a.hospital_name IS NULL OR a.hospital_name = ''
  `);
  console.log(`✅ Backfilled hospital_name: ${backfillResult.affectedRows} rows`);

  // 3. Remove the offensive hospital
  const [deleteResult] = await pool.query(
    "DELETE FROM hospitals WHERE LOWER(name) LIKE '%fuck%'"
  );
  console.log(`✅ Removed offensive hospitals: ${deleteResult.affectedRows} rows`);

  // 4. Verify
  console.log("\n── Appointments after fix ──");
  const [appts] = await pool.query(
    "SELECT id, service, hospital_name, status FROM appointments"
  );
  console.table(appts);

  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
