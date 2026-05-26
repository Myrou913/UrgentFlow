require("dotenv").config();
const db = require("./config/db");
db.promise()
  .query("SELECT email, role, service_scope FROM users WHERE role != 'patient'")
  .then(([rows]) => {
    if (!rows.length) {
      console.log("No admin accounts found — role column may be missing or empty.");
    } else {
      rows.forEach((r) => console.log(r));
    }
    process.exit(0);
  })
  .catch((e) => { console.error(e.message); process.exit(1); });
