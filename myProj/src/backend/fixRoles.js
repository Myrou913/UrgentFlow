require("dotenv").config();
const db = require("./config/db");
db.promise()
  .query("UPDATE users SET role = 'patient' WHERE role = 'user'")
  .then(([result]) => {
    console.log(`Fixed ${result.affectedRows} account(s) with role='user' → 'patient'`);
    process.exit(0);
  })
  .catch((e) => { console.error(e.message); process.exit(1); });
