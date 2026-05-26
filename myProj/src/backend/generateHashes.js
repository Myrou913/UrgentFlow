require("dotenv").config();
const bcrypt = require("bcrypt");

async function main() {
  const adminHash = await bcrypt.hash("Admin123!", 10);
  const superHash = await bcrypt.hash("SuperAdmin123!", 10);
  console.log("Admin123!   →", adminHash);
  console.log("SuperAdmin123! →", superHash);
  process.exit(0);
}
main();
