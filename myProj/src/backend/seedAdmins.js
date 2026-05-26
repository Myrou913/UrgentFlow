/* global require, process */
/**
 * Run ONCE to create all admin accounts in the database.
 * Usage:  node seedAdmins.js
 *
 * Role and service_scope are stored in the DB — NOT derived from the email.
 * You can use any email format you want.
 */

require("dotenv").config();
const bcrypt = require("bcrypt");
const db = require("./config/db");

const ADMINS = [
  // ── Super admin ──────────────────────────────────────────────────────────
  {
    fullName: "Super Admin",
    email: "superadmin@urgentflow.com",
    password: "SuperAdmin123!",
    phone: "20000000",
    city: "Tunis",
    role: "super_admin",
    service_scope: "",
  },

  // ── Service admins — one per service ─────────────────────────────────────
  { fullName: "Emergency Admin",            email: "admin.emergency@urgentflow.com",       password: "Admin123!", phone: "20000001", city: "Tunis", role: "admin", service_scope: "Emergency" },
  { fullName: "Cardiology Admin",           email: "admin.cardiology@urgentflow.com",      password: "Admin123!", phone: "20000002", city: "Tunis", role: "admin", service_scope: "Cardiology" },
  { fullName: "Endocrinology Admin",        email: "admin.endocrinology@urgentflow.com",   password: "Admin123!", phone: "20000003", city: "Tunis", role: "admin", service_scope: "Endocrinology" },
  { fullName: "Gastroenterology Admin",     email: "admin.gastro@urgentflow.com",          password: "Admin123!", phone: "20000004", city: "Tunis", role: "admin", service_scope: "Gastroenterology" },
  { fullName: "Pulmonology Admin",          email: "admin.pulmonology@urgentflow.com",     password: "Admin123!", phone: "20000005", city: "Tunis", role: "admin", service_scope: "Pulmonology" },
  { fullName: "Nephrology Admin",           email: "admin.nephrology@urgentflow.com",      password: "Admin123!", phone: "20000006", city: "Tunis", role: "admin", service_scope: "Nephrology" },
  { fullName: "Rheumatology Admin",         email: "admin.rheumatology@urgentflow.com",    password: "Admin123!", phone: "20000007", city: "Tunis", role: "admin", service_scope: "Rheumatology" },
  { fullName: "Hematology Admin",           email: "admin.hematology@urgentflow.com",      password: "Admin123!", phone: "20000008", city: "Tunis", role: "admin", service_scope: "Hematology" },
  { fullName: "Infectious Diseases Admin",  email: "admin.infectious@urgentflow.com",      password: "Admin123!", phone: "20000009", city: "Tunis", role: "admin", service_scope: "Infectious Diseases" },
  { fullName: "General Medicine Admin",     email: "admin.generalmedicine@urgentflow.com", password: "Admin123!", phone: "20000010", city: "Tunis", role: "admin", service_scope: "General Medicine" },
  { fullName: "Family Medicine Admin",      email: "admin.familymedicine@urgentflow.com",  password: "Admin123!", phone: "20000011", city: "Tunis", role: "admin", service_scope: "Family Medicine" },
  { fullName: "Pediatrics Admin",           email: "admin.pediatrics@urgentflow.com",      password: "Admin123!", phone: "20000012", city: "Tunis", role: "admin", service_scope: "Pediatrics" },
  { fullName: "General Surgery Admin",      email: "admin.surgery@urgentflow.com",         password: "Admin123!", phone: "20000013", city: "Tunis", role: "admin", service_scope: "General Surgery" },
  { fullName: "Orthopedic Surgery Admin",   email: "admin.orthopedics@urgentflow.com",     password: "Admin123!", phone: "20000014", city: "Tunis", role: "admin", service_scope: "Orthopedic Surgery" },
  { fullName: "Neurosurgery Admin",         email: "admin.neurosurgery@urgentflow.com",    password: "Admin123!", phone: "20000015", city: "Tunis", role: "admin", service_scope: "Neurosurgery" },
  { fullName: "Cardiothoracic Surgery Admin", email: "admin.cardiothoracic@urgentflow.com", password: "Admin123!", phone: "20000016", city: "Tunis", role: "admin", service_scope: "Cardiothoracic Surgery" },
  { fullName: "Plastic Surgery Admin",      email: "admin.plasticsurgery@urgentflow.com",  password: "Admin123!", phone: "20000017", city: "Tunis", role: "admin", service_scope: "Plastic Surgery" },
  { fullName: "Vascular Surgery Admin",     email: "admin.vascular@urgentflow.com",        password: "Admin123!", phone: "20000018", city: "Tunis", role: "admin", service_scope: "Vascular Surgery" },
  { fullName: "Urology Admin",              email: "admin.urology@urgentflow.com",         password: "Admin123!", phone: "20000019", city: "Tunis", role: "admin", service_scope: "Urology" },
  { fullName: "ENT Admin",                  email: "admin.ent@urgentflow.com",             password: "Admin123!", phone: "20000020", city: "Tunis", role: "admin", service_scope: "ENT" },
  { fullName: "Dentistry Admin",            email: "admin.dentistry@urgentflow.com",       password: "Admin123!", phone: "20000021", city: "Tunis", role: "admin", service_scope: "Dentistry" },
  { fullName: "Dermatology Admin",          email: "admin.dermatology@urgentflow.com",     password: "Admin123!", phone: "20000022", city: "Tunis", role: "admin", service_scope: "Dermatology" },
  { fullName: "Radiology Admin",            email: "admin.radiology@urgentflow.com",       password: "Admin123!", phone: "20000023", city: "Tunis", role: "admin", service_scope: "Radiology" },
  { fullName: "Anesthesiology Admin",       email: "admin.anesthesiology@urgentflow.com",  password: "Admin123!", phone: "20000024", city: "Tunis", role: "admin", service_scope: "Anesthesiology" },
  { fullName: "Oncology Admin",             email: "admin.oncology@urgentflow.com",        password: "Admin123!", phone: "20000025", city: "Tunis", role: "admin", service_scope: "Oncology" },
  { fullName: "Pathology Admin",            email: "admin.pathology@urgentflow.com",       password: "Admin123!", phone: "20000026", city: "Tunis", role: "admin", service_scope: "Pathology" },
  { fullName: "Nutrition Admin",            email: "admin.nutrition@urgentflow.com",       password: "Admin123!", phone: "20000027", city: "Tunis", role: "admin", service_scope: "Nutrition" },
  { fullName: "Pharmacy Admin",             email: "admin.pharmacy@urgentflow.com",        password: "Admin123!", phone: "20000028", city: "Tunis", role: "admin", service_scope: "Pharmacy" },
];

async function seed() {
  const pool = db.promise();

  // Add role + service_scope columns if they don't exist yet
  await pool.query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'patient',
      ADD COLUMN IF NOT EXISTS service_scope VARCHAR(100) DEFAULT ''
  `).catch(() => {});

  console.log("Seeding admin accounts...\n");

  for (const admin of ADMINS) {
    const hashed = await bcrypt.hash(admin.password, 10);
    try {
      await pool.query(
        `INSERT INTO users (fullName, email, phone, city, password, role, service_scope)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [admin.fullName, admin.email, admin.phone, admin.city, hashed, admin.role, admin.service_scope],
      );
      console.log(`✅  ${admin.role.padEnd(12)} | ${admin.service_scope.padEnd(25)} | ${admin.email}`);
    } catch (err) {
      if (err.code === "ER_DUP_ENTRY") {
        // Update role/service_scope in case it changed
        await pool.query(
          `UPDATE users SET role = ?, service_scope = ? WHERE LOWER(email) = LOWER(?)`,
          [admin.role, admin.service_scope, admin.email],
        );
        console.log(`⚠️   Updated existing: ${admin.email}`);
      } else {
        console.error(`❌  Failed: ${admin.email}`, err.message);
      }
    }
  }

  console.log("\n✅ Done. Credentials for all accounts:");
  console.log("   Password: Admin123!  (change after first login)");
  console.log("   Super admin password: SuperAdmin123!");
  process.exit(0);
}

seed();
