/* global require, exports */
const db = require("../config/db");

const pool = db.promise();

// ─── SMS helper — tries Vonage first, falls back to Twilio ───────────────────
async function sendSMS(toPhone, body) {
  // Normalise Tunisian numbers: 8 digits → +216XXXXXXXX
  let normalised = String(toPhone || "").replace(/\s+/g, "");
  if (/^\d{8}$/.test(normalised)) normalised = `+216${normalised}`;
  if (!normalised.startsWith("+")) {
    console.warn(`[SMS] Skipping invalid phone: ${toPhone}`);
    return { status: "invalid-phone" };
  }

  // ── Try Vonage ──────────────────────────────────────────────────────────
  const vonageKey    = process.env.VONAGE_API_KEY;
  const vonageSecret = process.env.VONAGE_API_SECRET;
  const vonageFrom   = process.env.VONAGE_FROM || "UrgentFlow";

  if (vonageKey && vonageSecret && !vonageKey.startsWith("your_")) {
    try {
      const { Vonage } = require("@vonage/server-sdk");
      const vonage = new Vonage({ apiKey: vonageKey, apiSecret: vonageSecret });
      const to = normalised.replace("+", "");
      await vonage.sms.send({ to, from: vonageFrom, text: body });
      console.log(`[SMS-Vonage] Sent to ${normalised}`);
      return { status: "sent", provider: "vonage" };
    } catch (err) {
      console.error(`[SMS-Vonage] Failed:`, err.message);
    }
  }

  // ── Try Twilio ──────────────────────────────────────────────────────────
  const twilioSid   = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom  = process.env.TWILIO_PHONE_NUMBER;

  if (twilioSid && twilioToken && twilioFrom &&
      !twilioSid.startsWith("your_") && !twilioSid.startsWith("AC" + "x")) {
    try {
      const twilio = require("twilio");
      const client = twilio(twilioSid, twilioToken);
      const message = await client.messages.create({ body, from: twilioFrom, to: normalised });
      console.log(`[SMS-Twilio] Sent to ${normalised}: ${message.sid}`);
      return { status: "sent", provider: "twilio", sid: message.sid };
    } catch (err) {
      console.error(`[SMS-Twilio] Failed:`, err.message);
    }
  }

  // ── Dev fallback ────────────────────────────────────────────────────────
  console.log(`[SMS-DEV] Would send to ${normalised}: ${body}`);
  return { status: "dev-skipped" };
}

const DEFAULT_SETTINGS = {
  language: "en",
  smsAlerts: true,
  emailAlerts: true,
  reminderWindow: "10",
  privacyMode: false,
  marketingUpdates: false,
  darkMode: false,
};

let supportTablesReady;

function toIsoDate(value) {
  if (!value) return null;
  // If it's already a plain YYYY-MM-DD string, return as-is
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  // Use LOCAL date parts to avoid UTC offset shifting the day
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normaliseStatus(status) {
  const value = String(status || "upcoming").toLowerCase();

  if (["waiting", "confirmed", "upcoming", "coming"].includes(value)) {
    return "upcoming";
  }
  if (["in_progress", "ongoing", "live"].includes(value)) {
    return "ongoing";
  }
  if (["done", "completed"].includes(value)) {
    return "done";
  }
  if (["cancelled", "canceled"].includes(value)) {
    return "cancelled";
  }

  return "upcoming";
}

async function ensureSupportTables() {
  if (supportTablesReady) return supportTablesReady;

  supportTablesReady = Promise.all([
    pool.query(`
      CREATE TABLE IF NOT EXISTS appointment_followups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        related_appointment_id VARCHAR(255) NULL,
        user_id INT NOT NULL,
        hospital_id VARCHAR(255) NULL,
        hospital_name VARCHAR(255) NULL,
        service VARCHAR(255) NOT NULL,
        appointment_date DATE NOT NULL,
        slot_time VARCHAR(20) NULL,
        status VARCHAR(40) DEFAULT 'upcoming',
        turn_number INT DEFAULT 0,
        estimated_time INT DEFAULT 0,
        source_type VARCHAR(60) DEFAULT 'admin-follow-up',
        scheduled_by VARCHAR(60) DEFAULT 'admin',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `),
    pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        language VARCHAR(10) DEFAULT 'en',
        sms_alerts TINYINT(1) DEFAULT 1,
        email_alerts TINYINT(1) DEFAULT 1,
        reminder_window VARCHAR(10) DEFAULT '10',
        privacy_mode TINYINT(1) DEFAULT 0,
        marketing_updates TINYINT(1) DEFAULT 0,
        dark_mode TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `),
    pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        appointment_id VARCHAR(255) NULL,
        channel VARCHAR(30) DEFAULT 'in_app',
        kind VARCHAR(50) DEFAULT 'appointment',
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        delivery_status VARCHAR(30) DEFAULT 'delivered',
        trigger_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `),
    pool.query(`
      CREATE TABLE IF NOT EXISTS emergency_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        hospital_id VARCHAR(255) NULL,
        hospital_name VARCHAR(255) NULL,
        city VARCHAR(100) NULL,
        patient_name VARCHAR(255) NULL,
        patient_phone VARCHAR(50) NULL,
        patient_email VARCHAR(255) NULL,
        lat DOUBLE NULL,
        lng DOUBLE NULL,
        status VARCHAR(40) DEFAULT 'new',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).then(() =>
      // Add lat/lng columns if they don't exist yet (for existing databases)
      pool.query(`
        ALTER TABLE emergency_requests
          ADD COLUMN IF NOT EXISTS lat DOUBLE NULL,
          ADD COLUMN IF NOT EXISTS lng DOUBLE NULL
      `).catch(() => {})
    ),
  ]);

  return supportTablesReady;
}

async function getUserSettings(userId) {
  await ensureSupportTables();
  const [rows] = await pool.query(
    "SELECT * FROM user_settings WHERE user_id = ? LIMIT 1",
    [userId],
  );

  if (!rows.length) {
    return DEFAULT_SETTINGS;
  }

  return {
    language: rows[0].language || "en",
    smsAlerts: Boolean(rows[0].sms_alerts),
    emailAlerts: Boolean(rows[0].email_alerts),
    reminderWindow: String(rows[0].reminder_window || "10"),
    privacyMode: Boolean(rows[0].privacy_mode),
    marketingUpdates: Boolean(rows[0].marketing_updates),
    darkMode: Boolean(rows[0].dark_mode),
  };
}

async function saveUserSettingsRecord(userId, settings) {
  await ensureSupportTables();
  await pool.query(
    `
      INSERT INTO user_settings
        (user_id, language, sms_alerts, email_alerts, reminder_window, privacy_mode, marketing_updates, dark_mode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        language = VALUES(language),
        sms_alerts = VALUES(sms_alerts),
        email_alerts = VALUES(email_alerts),
        reminder_window = VALUES(reminder_window),
        privacy_mode = VALUES(privacy_mode),
        marketing_updates = VALUES(marketing_updates),
        dark_mode = VALUES(dark_mode)
    `,
    [
      userId,
      settings.language || DEFAULT_SETTINGS.language,
      settings.smsAlerts ? 1 : 0,
      settings.emailAlerts ? 1 : 0,
      settings.reminderWindow || DEFAULT_SETTINGS.reminderWindow,
      settings.privacyMode ? 1 : 0,
      settings.marketingUpdates ? 1 : 0,
      settings.darkMode ? 1 : 0,
    ],
  );

  return getUserSettings(userId);
}

async function createNotification({
  userId,
  appointmentId = null,
  title,
  body,
  kind = "appointment",
  channel = "in_app",
  deliveryStatus = "delivered",
  triggerAt = null,
}) {
  await ensureSupportTables();
  await pool.query(
    `
      INSERT INTO notifications
        (user_id, appointment_id, channel, kind, title, body, delivery_status, trigger_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [userId, appointmentId, channel, kind, title, body, deliveryStatus, triggerAt],
  );

  return {
    user_id: userId,
    appointment_id: appointmentId,
    title,
    body,
    kind,
    channel,
    delivery_status: deliveryStatus,
    trigger_at: triggerAt,
    created_at: new Date().toISOString(),
  };
}

async function createAppointmentNotifications(user, appointment, title, body) {
  const settings = await getUserSettings(user.id);

  // 1. Always create one in-app notification
  const inAppNotification = await createNotification({
    userId: user.id,
    appointmentId: appointment.id,
    title,
    body,
    kind: "appointment",
    channel: "in_app",
    deliveryStatus: "delivered",
    triggerAt: appointment.appointment_date,
  });

  // 2. Send via the user's preferred channel (SMS takes priority if both enabled)
  if (settings.smsAlerts && user.phone) {
    const smsBody = `UrgentFlow: ${body}`;
    await sendSMS(user.phone, smsBody);
  } else if (settings.emailAlerts && user.email) {
    // Email is handled by nodemailer in server.js — here we just log it queued
    await createNotification({
      userId: user.id,
      appointmentId: appointment.id,
      title: "Email confirmation",
      body: `Confirmation sent to ${user.email}: ${body}`,
      kind: "email",
      channel: "email",
      deliveryStatus: "queued",
      triggerAt: appointment.appointment_date,
    });
  }

  // 3. Schedule a reminder notification based on the user's reminderWindow setting
  const reminderMinutes = parseInt(settings.reminderWindow || "10", 10);
  const appointmentDateTime = new Date(
    `${appointment.appointment_date}T${appointment.slot_time || "08:00:00"}`,
  );
  if (!isNaN(appointmentDateTime.getTime())) {
    const reminderAt = new Date(appointmentDateTime.getTime() - reminderMinutes * 60 * 1000);
    await createNotification({
      userId: user.id,
      appointmentId: appointment.id,
      title: `Your turn is in ${reminderMinutes} minutes`,
      body: `Reminder: your appointment at ${appointment.hospital_name || "the clinic"} is coming up in ${reminderMinutes} minutes. Queue #${appointment.turn_number || "--"}.`,
      kind: "reminder",
      channel: settings.smsAlerts && user.phone ? "sms" : "in_app",
      deliveryStatus: "scheduled",
      triggerAt: reminderAt.toISOString(),
    });
  }

  return inAppNotification;
}

function mapAppointmentRow(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    user_id: row.user_id,
    hospital_id: row.hospital_id,
    hospital_name: row.hospital_name || "Healthcare Center",
    service: row.service || "General consultation",
    appointment_date: toIsoDate(row.appointment_date),
    slot_time: row.slot_time || "",
    status: normaliseStatus(row.status),
    turn_number: Number(row.turn_number || 0),
    estimated_time: Number(row.estimated_time || 0),
    source_type: row.source_type || "booking",
    scheduled_by: row.scheduled_by || "admin",
    notes: row.notes || "",
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
    patient_name: row.patient_name || "",
    patient_phone: row.patient_phone || "",
    patient_email: row.patient_email || "",
    city: row.city || "",
  };
}

function haversine(lat1, lon1, lat2, lon2) {
  const toRadians = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const startLat = toRadians(lat1);
  const endLat = toRadians(lat2);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(startLat) * Math.cos(endLat) * Math.sin(dLon / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const HOSPITAL_JOIN_CONDITION = `
  CONVERT(h.id USING utf8mb4) COLLATE utf8mb4_unicode_ci =
  CONVERT(a.hospital_id USING utf8mb4) COLLATE utf8mb4_unicode_ci
`;

const FOLLOWUP_HOSPITAL_JOIN_CONDITION = `
  CONVERT(h.id USING utf8mb4) COLLATE utf8mb4_unicode_ci =
  CONVERT(f.hospital_id USING utf8mb4) COLLATE utf8mb4_unicode_ci
`;

async function ensureHospitalReference({
  hospitalId,
  hospitalName,
  city,
  type,
  service,
}) {
  const normalisedHospitalId = String(hospitalId || "").trim();
  if (!normalisedHospitalId) return "";

  // Check if it already exists
  const [existingRows] = await pool.query(
    `SELECT id, name FROM hospitals
     WHERE CONVERT(id USING utf8mb4) COLLATE utf8mb4_unicode_ci =
           CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci
     LIMIT 1`,
    [normalisedHospitalId],
  );

  if (existingRows.length) {
    // Update name if we now have a better one
    if (hospitalName && hospitalName !== "Healthcare Center" &&
        (!existingRows[0].name || existingRows[0].name === "Healthcare Center")) {
      await pool.query("UPDATE hospitals SET name = ? WHERE id = ?",
        [hospitalName, normalisedHospitalId]).catch(() => {});
    }
    return String(existingRows[0].id);
  }

  // Insert with the real name
  try {
    await pool.query(
      `INSERT INTO hospitals (id, name, type, city, address, services, hasEmergency)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        normalisedHospitalId,
        hospitalName || "Healthcare Center",
        type || "hospital",
        city || "Tunisia",
        "",
        service || "",
        String(service || "").toLowerCase().includes("emergency") ? 1 : 0,
      ],
    );
  } catch (error) {
    if (error.code !== "ER_DUP_ENTRY") throw error;
  }

  return normalisedHospitalId;
}

async function fetchCombinedAppointments(userId) {
  await ensureSupportTables();

  // Ensure hospital_name column exists on appointments table
  await pool.query(`
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(255) NULL
  `).catch(() => {});

  const [appointments] = await pool.query(
    `
      SELECT
        a.id,
        a.user_id,
        CONVERT(a.hospital_id USING utf8mb4) COLLATE utf8mb4_unicode_ci AS hospital_id,
        COALESCE(a.hospital_name, h.name, 'Healthcare Center') AS hospital_name,
        a.service,
        a.appointment_date,
        COALESCE(a.status, 'waiting') AS status,
        COALESCE(a.turn_number, 0) AS turn_number,
        COALESCE(a.estimated_time, 0) AS estimated_time,
        a.created_at,
        a.created_at AS updated_at,
        'booking' AS source_type,
        'admin' AS scheduled_by,
        '' AS notes,
        u.fullName AS patient_name,
        u.phone AS patient_phone,
        u.email AS patient_email,
        u.city AS city,
        '' AS slot_time
      FROM appointments a
      LEFT JOIN hospitals h ON ${HOSPITAL_JOIN_CONDITION}
      LEFT JOIN users u ON u.id = a.user_id
      WHERE a.user_id = ?
    `,
    [userId],
  );

  const [followUps] = await pool.query(
    `
      SELECT
        id,
        user_id,
        hospital_id,
        hospital_name,
        service,
        appointment_date,
        status,
        turn_number,
        estimated_time,
        created_at,
        updated_at,
        source_type,
        scheduled_by,
        notes,
        '' AS patient_name,
        '' AS patient_phone,
        '' AS patient_email,
        '' AS city,
        COALESCE(slot_time, '') AS slot_time
      FROM appointment_followups
      WHERE user_id = ?
    `,
    [userId],
  );

  return [...appointments, ...followUps]
    .map(mapAppointmentRow)
    .sort(
      (first, second) =>
        new Date(`${first.appointment_date}T${first.slot_time || "00:00:00"}`) -
        new Date(`${second.appointment_date}T${second.slot_time || "00:00:00"}`),
    );
}

async function fetchNotifications(userId) {
  await ensureSupportTables();
  const [rows] = await pool.query(
    `
      SELECT
        id,
        user_id,
        appointment_id,
        channel,
        kind,
        title,
        body,
        delivery_status,
        trigger_at,
        created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `,
    [userId],
  );

  return rows.map((row) => ({
    id: `notification-${row.id}`,
    user_id: row.user_id,
    appointment_id: row.appointment_id,
    channel: row.channel,
    kind: row.kind,
    title: row.title,
    body: row.body,
    delivery_status: row.delivery_status,
    trigger_at: row.trigger_at,
    created_at: row.created_at,
  }));
}

async function fetchUser(userId) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ? LIMIT 1", [
    userId,
  ]);
  return rows[0] || null;
}

async function insertMainAppointment({
  userId,
  hospitalId,
  hospitalName,
  service,
  appointmentDate,
  turnNumber,
  estimatedTime,
}) {
  try {
    const [result] = await pool.query(
      `INSERT INTO appointments
         (user_id, hospital_id, hospital_name, service, appointment_date, turn_number, estimated_time, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, hospitalId, hospitalName || null, service, appointmentDate, turnNumber, estimatedTime, "waiting"],
    );
    return result.insertId;
  } catch (error) {
    // Fallback if hospital_name column doesn't exist yet
    if (error.code === "ER_BAD_FIELD_ERROR") {
      const [fallbackResult] = await pool.query(
        `INSERT INTO appointments
           (user_id, hospital_id, service, appointment_date, turn_number, estimated_time)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, hospitalId, service, appointmentDate, turnNumber, estimatedTime],
      );
      return fallbackResult.insertId;
    }
    throw error;
  }
}

exports.createAppointment = async (req, res) => {
  try {
    await ensureSupportTables();
    const {
      user_id,
      hospital_id,
      hospital_name,
      hospital_city,
      hospital_type,
      appointment_date,
      notes,
    } = req.body;

    // Always trim service to avoid leading/trailing space issues
    const service = String(req.body.service || "").trim();

    if (!user_id || !hospital_id || !service || !appointment_date) {
      return res.status(400).json({
        success: false,
        message: "Missing booking information.",
      });
    }

    const resolvedHospitalId = await ensureHospitalReference({
      hospitalId: hospital_id,
      hospitalName: hospital_name,
      city: hospital_city,
      type: hospital_type,
      service,
    });

    const [[turnRow]] = await pool.query(
      `
        SELECT MAX(turn_number) AS lastTurn
        FROM appointments
        WHERE CONVERT(hospital_id USING utf8mb4) COLLATE utf8mb4_unicode_ci =
              CONVERT(? USING utf8mb4) COLLATE utf8mb4_unicode_ci
          AND appointment_date = ?
      `,
      [resolvedHospitalId, appointment_date],
    );

    const newTurn = Number(turnRow?.lastTurn || 0) + 1;
    const estimatedTime = newTurn * 10;
    const appointmentId = await insertMainAppointment({
      userId: user_id,
      hospitalId: resolvedHospitalId,
      hospitalName: hospital_name,
      service,
      appointmentDate: appointment_date,
      turnNumber: newTurn,
      estimatedTime,
    });

    const user = await fetchUser(user_id);
    const appointments = await fetchCombinedAppointments(user_id);
    const appointment = appointments.find(
      (item) => String(item.id) === String(appointmentId),
    );

    let notification = null;
    if (user && appointment) {
      notification = await createAppointmentNotifications(
        user,
        appointment,
        "Appointment booked",
        `Your queue turn is #${newTurn} with an estimated waiting time of ${estimatedTime} minutes.${notes ? " Symptoms were shared with the care team." : ""}`,
      );
    }

    res.json({
      success: true,
      appointment,
      turn_number: newTurn,
      estimated_time: estimatedTime,
      notification,
      message:
        "Appointment created. SMS and email entries are queued when those channels are enabled in settings.",
    });
  } catch (error) {
    console.error("createAppointment failed", error);
    res.status(500).json({
      success: false,
      message: "Unable to book through the server.",
    });
  }
};

exports.getPatientRecords = async (req, res) => {
  try {
    const userId = req.params.userId;
    const appointments = await fetchCombinedAppointments(userId);
    const activeAppointments = appointments.filter(
      (appointment) => !["done", "cancelled"].includes(appointment.status),
    );
    const history = appointments.filter(
      (appointment) => ["done", "cancelled"].includes(appointment.status),
    );

    const notifications = await fetchNotifications(userId);
    const settings = await getUserSettings(userId);

    res.json({
      success: true,
      appointments: activeAppointments,
      history,
      notifications,
      settings,
    });
  } catch (error) {
    console.error("getPatientRecords failed", error);
    res.status(500).json({ success: false, message: "Unable to load records." });
  }
};

exports.createManualAppointment = async (req, res) => {
  try {
    await ensureSupportTables();
    const userId = req.params.userId;
    const {
      hospital_id,
      hospital_name,
      service,
      appointment_date,
      notes,
      patient_name,
      patient_phone,
      patient_email,
      city,
    } = req.body;

    // Count existing appointments for the same hospital+service+date to assign turn
    const resolvedHospitalId = String(hospital_id || hospital_name || "manual").trim();
    const [[turnRow]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM (
        SELECT id FROM appointments
          WHERE LOWER(COALESCE(hospital_id,'')) = LOWER(?) AND appointment_date = ? AND status NOT IN ('cancelled','done')
        UNION ALL
        SELECT id FROM appointment_followups
          WHERE LOWER(COALESCE(hospital_id,'')) = LOWER(?) AND appointment_date = ? AND status NOT IN ('cancelled','done')
      ) AS combined`,
      [resolvedHospitalId, appointment_date, resolvedHospitalId, appointment_date],
    );
    const turnNumber = Number(turnRow?.cnt || 0) + 1;
    const estimatedTime = turnNumber * 10;

    const [result] = await pool.query(
      `INSERT INTO appointment_followups
         (user_id, hospital_id, hospital_name, service, appointment_date, status, turn_number, estimated_time, source_type, scheduled_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        resolvedHospitalId,
        hospital_name || "Healthcare Center",
        service,
        appointment_date,
        "upcoming",
        turnNumber,
        estimatedTime,
        "manual-follow-up",
        "patient",
        notes || "Added by the patient.",
      ],
    );

    const appointment = mapAppointmentRow({
      id: result.insertId,
      user_id: userId,
      hospital_id: resolvedHospitalId,
      hospital_name: hospital_name || "Healthcare Center",
      service,
      appointment_date,
      status: "upcoming",
      turn_number: turnNumber,
      estimated_time: estimatedTime,
      source_type: "manual-follow-up",
      scheduled_by: "patient",
      notes: notes || "Added by the patient.",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      patient_name,
      patient_phone,
      patient_email,
      city,
    });

    const user = await fetchUser(userId);
    const notification = await createAppointmentNotifications(
      user || { id: userId, phone: patient_phone, email: patient_email },
      appointment,
      "Appointment saved",
      `Your appointment at ${hospital_name || "Healthcare Center"} on ${appointment_date} is confirmed. You are turn #${turnNumber}, estimated wait ${estimatedTime} min.`,
    );

    res.json({ success: true, appointment, notification });
  } catch (error) {
    console.error("createManualAppointment failed", error);
    res.status(500).json({ success: false, message: "Unable to save the next appointment." });
  }
};

exports.getUserSettings = async (req, res) => {
  try {
    const settings = await getUserSettings(req.params.userId);
    res.json({ success: true, settings });
  } catch (error) {
    console.error("getUserSettings failed", error);
    res.status(500).json({ success: false, message: "Unable to load settings." });
  }
};

exports.saveUserSettings = async (req, res) => {
  try {
    const settings = await saveUserSettingsRecord(req.params.userId, req.body);
    res.json({ success: true, settings });
  } catch (error) {
    console.error("saveUserSettings failed", error);
    res.status(500).json({ success: false, message: "Unable to save settings." });
  }
};

exports.getUserNotifications = async (req, res) => {
  try {
    const notifications = await fetchNotifications(req.params.userId);
    res.json({ success: true, notifications });
  } catch (error) {
    console.error("getUserNotifications failed", error);
    res
      .status(500)
      .json({ success: false, message: "Unable to load notifications." });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    await ensureSupportTables();
    const city = req.query.city;
    const service = String(req.query.service || "").trim().toLowerCase();
    const isEmergencyDashboard = service === "emergency";

    // Ensure hospital_name column exists
    await pool.query(`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS hospital_name VARCHAR(255) NULL`).catch(() => {});

    // When a specific service is set, skip city filtering entirely —
    // a cardiology admin should see ALL cardiology appointments, not just their city.
    const applyCity = city && (!service || service === "all");

    let appointmentCityFilter = applyCity
      ? " AND (LOWER(COALESCE(u.city,'')) = LOWER(?) OR LOWER(COALESCE(h.city,'')) = LOWER(?))"
      : "";
    let followUpCityFilter = applyCity
      ? " AND (LOWER(COALESCE(u.city,'')) = LOWER(?) OR LOWER(COALESCE(h.city,'')) = LOWER(?) OR LOWER(COALESCE(f.hospital_name,'')) LIKE LOWER(?))"
      : "";
    let appointmentServiceFilter = (service && service !== "all")
      ? " AND LOWER(COALESCE(a.service,'')) LIKE ?" : "";
    let followUpServiceFilter = (service && service !== "all")
      ? " AND LOWER(COALESCE(f.service,'')) LIKE ?" : "";

    const serviceParam = service && service !== "all" ? `%${service}%` : null;
    const appointmentParams = [
      ...(applyCity ? [city, city] : []),
      ...(serviceParam ? [serviceParam] : []),
    ];
    const followUpParams = [
      ...(applyCity ? [city, city, `%${city}%`] : []),
      ...(serviceParam ? [serviceParam] : []),
    ];

    const [queue] = await pool.query(
      `
        SELECT
          a.id,
          a.user_id,
          CONVERT(a.hospital_id USING utf8mb4) COLLATE utf8mb4_unicode_ci AS hospital_id,
          COALESCE(a.hospital_name, h.name, 'Healthcare Center') AS hospital_name,
          a.service,
          a.appointment_date,
          COALESCE(a.status, 'waiting') AS status,
          COALESCE(a.turn_number, 0) AS turn_number,
          COALESCE(a.estimated_time, 0) AS estimated_time,
          a.created_at,
          a.created_at AS updated_at,
          'booking' AS source_type,
          'admin' AS scheduled_by,
          '' AS notes,
          u.fullName AS patient_name,
          u.phone AS patient_phone,
          u.email AS patient_email,
          u.city AS city,
          '' AS slot_time
        FROM appointments a
        LEFT JOIN hospitals h ON ${HOSPITAL_JOIN_CONDITION}
        LEFT JOIN users u ON u.id = a.user_id
        WHERE COALESCE(a.status, 'waiting') NOT IN ('done', 'cancelled')
        ${appointmentCityFilter}
        ${appointmentServiceFilter}
        UNION ALL
        SELECT
          f.id,
          f.user_id,
          CONVERT(f.hospital_id USING utf8mb4) COLLATE utf8mb4_unicode_ci AS hospital_id,
          COALESCE(h.name, f.hospital_name, 'Healthcare Center') AS hospital_name,
          f.service,
          f.appointment_date,
          f.status,
          COALESCE(f.turn_number, 0) AS turn_number,
          COALESCE(f.estimated_time, 0) AS estimated_time,
          f.created_at,
          f.updated_at,
          f.source_type,
          f.scheduled_by,
          f.notes,
          u.fullName AS patient_name,
          u.phone AS patient_phone,
          u.email AS patient_email,
          u.city AS city,
          COALESCE(f.slot_time, '') AS slot_time
        FROM appointment_followups f
        LEFT JOIN hospitals h ON ${FOLLOWUP_HOSPITAL_JOIN_CONDITION}
        LEFT JOIN users u ON u.id = f.user_id
        WHERE f.status NOT IN ('done', 'cancelled')
        ${followUpCityFilter}
        ${followUpServiceFilter}
      `,
      [...appointmentParams, ...followUpParams],
    );

    const [emergencyRequests] = await pool.query(
      `
        SELECT
          id,
          user_id,
          hospital_id,
          hospital_name,
          city,
          patient_name,
          patient_phone,
          patient_email,
          lat,
          lng,
          status,
          notes,
          created_at
        FROM emergency_requests
        ${
          city && !isEmergencyDashboard
            ? "WHERE LOWER(city) = LOWER(?) AND status != 'resolved'"
            : "WHERE status != 'resolved'"
        }
        ORDER BY created_at DESC
        LIMIT 20
      `,
      city && !isEmergencyDashboard ? [city] : [],
    );

    const [hospitals] = await pool.query(
      `
        SELECT *
        FROM hospitals
        ${city ? "WHERE LOWER(city) = LOWER(?)" : ""}
        ORDER BY name ASC
      `,
      city ? [city] : [],
    );

    const mappedQueue = queue
      .map(mapAppointmentRow)
      .sort(
        (first, second) =>
          new Date(`${first.appointment_date}T${first.slot_time || "00:00:00"}`) -
          new Date(`${second.appointment_date}T${second.slot_time || "00:00:00"}`),
      );

    res.json({
      success: true,
      queue: mappedQueue,
      emergencyRequests: service === "emergency" || !service ? emergencyRequests : [],
      hospitals,
      todayStats: {
        totalPatients: mappedQueue.length,
        ongoingCount: mappedQueue.filter((item) => item.status === "ongoing").length,
        emergencyCount:
          service === "emergency" || !service ? emergencyRequests.length : 0,
      },
    });
  } catch (error) {
    console.error("getAdminDashboard failed", error);
    res.status(500).json({
      success: false,
      message: "Unable to load the admin dashboard.",
    });
  }
};

exports.getAdminArchives = async (req, res) => {
  try {
    await ensureSupportTables();
    const city = req.query.city;
    const service = String(req.query.service || "").trim().toLowerCase();

    // Same logic as dashboard: skip city filter when a specific service is scoped
    const applyCity = city && (!service || service === "all");

    let appointmentCityFilter = applyCity
      ? " AND (LOWER(COALESCE(u.city,'')) = LOWER(?) OR LOWER(COALESCE(h.city,'')) = LOWER(?))"
      : "";
    let followUpCityFilter = applyCity
      ? " AND (LOWER(COALESCE(u.city,'')) = LOWER(?) OR LOWER(COALESCE(h.city,'')) = LOWER(?) OR LOWER(COALESCE(f.hospital_name,'')) LIKE LOWER(?))"
      : "";
    let appointmentServiceFilter = (service && service !== "all")
      ? " AND LOWER(COALESCE(a.service,'')) LIKE ?" : "";
    let followUpServiceFilter = (service && service !== "all")
      ? " AND LOWER(COALESCE(f.service,'')) LIKE ?" : "";

    const serviceParam = service && service !== "all" ? `%${service}%` : null;
    const appointmentParams = [
      ...(applyCity ? [city, city] : []),
      ...(serviceParam ? [serviceParam] : []),
    ];
    const followUpParams = [
      ...(applyCity ? [city, city, `%${city}%`] : []),
      ...(serviceParam ? [serviceParam] : []),
    ];

    const [archive] = await pool.query(
      `
        SELECT
          a.id,
          a.user_id,
          CONVERT(a.hospital_id USING utf8mb4) COLLATE utf8mb4_unicode_ci AS hospital_id,
          COALESCE(a.hospital_name, h.name, 'Healthcare Center') AS hospital_name,
          a.service,
          a.appointment_date,
          COALESCE(a.status, 'waiting') AS status,
          COALESCE(a.turn_number, 0) AS turn_number,
          COALESCE(a.estimated_time, 0) AS estimated_time,
          a.created_at,
          a.created_at AS updated_at,
          'booking' AS source_type,
          'admin' AS scheduled_by,
          '' AS notes,
          u.fullName AS patient_name,
          u.phone AS patient_phone,
          u.email AS patient_email,
          u.city AS city,
          '' AS slot_time
        FROM appointments a
        LEFT JOIN hospitals h ON ${HOSPITAL_JOIN_CONDITION}
        LEFT JOIN users u ON u.id = a.user_id
        WHERE COALESCE(a.status, 'waiting') IN ('done', 'cancelled')
        ${appointmentCityFilter}
        ${appointmentServiceFilter}
        UNION ALL
        SELECT
          f.id,
          f.user_id,
          CONVERT(f.hospital_id USING utf8mb4) COLLATE utf8mb4_unicode_ci AS hospital_id,
          COALESCE(h.name, f.hospital_name, 'Healthcare Center') AS hospital_name,
          f.service,
          f.appointment_date,
          f.status,
          COALESCE(f.turn_number, 0) AS turn_number,
          COALESCE(f.estimated_time, 0) AS estimated_time,
          f.created_at,
          f.updated_at,
          f.source_type,
          f.scheduled_by,
          f.notes,
          u.fullName AS patient_name,
          u.phone AS patient_phone,
          u.email AS patient_email,
          u.city AS city,
          COALESCE(f.slot_time, '') AS slot_time
        FROM appointment_followups f
        LEFT JOIN hospitals h ON ${FOLLOWUP_HOSPITAL_JOIN_CONDITION}
        LEFT JOIN users u ON u.id = f.user_id
        WHERE f.status IN ('done', 'cancelled')
        ${followUpCityFilter}
        ${followUpServiceFilter}
      `,
      [...appointmentParams, ...followUpParams],
    );

    const mappedArchive = archive
      .map(mapAppointmentRow)
      .sort(
        (first, second) =>
          new Date(`${second.appointment_date}T${second.slot_time || "00:00:00"}`) -
          new Date(`${first.appointment_date}T${first.slot_time || "00:00:00"}`),
      );

    res.json({
      success: true,
      archive: mappedArchive,
      stats: {
        totalArchived: mappedArchive.length,
        doneCount: mappedArchive.filter((item) => item.status === "done").length,
        cancelledCount: mappedArchive.filter((item) => item.status === "cancelled")
          .length,
      },
    });
  } catch (error) {
    console.error("getAdminArchives failed", error);
    res.status(500).json({
      success: false,
      message: "Unable to load the admin archives.",
    });
  }
};

exports.updateAppointmentStatus = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status } = req.body;
    const nextStatus = normaliseStatus(status);

    let appointment = null;
    let notification = null;

    const [mainResult] = await pool.query(
      "UPDATE appointments SET status = ? WHERE id = ?",
      [nextStatus, appointmentId],
    );

    if (mainResult.affectedRows > 0) {
      const [rows] = await pool.query(
        `
          SELECT
            a.id,
            a.user_id,
            CONVERT(a.hospital_id USING utf8mb4) COLLATE utf8mb4_unicode_ci AS hospital_id,
            COALESCE(h.name, CONVERT(a.hospital_id USING utf8mb4) COLLATE utf8mb4_unicode_ci, 'Healthcare Center') AS hospital_name,
            a.service,
            a.appointment_date,
            a.status,
            COALESCE(a.turn_number, 0) AS turn_number,
            COALESCE(a.estimated_time, 0) AS estimated_time,
            a.created_at,
            a.created_at AS updated_at,
            'booking' AS source_type,
            'admin' AS scheduled_by,
            '' AS notes,
            u.fullName AS patient_name,
            u.phone AS patient_phone,
            u.email AS patient_email,
            u.city AS city,
            '' AS slot_time
          FROM appointments a
          LEFT JOIN hospitals h ON ${HOSPITAL_JOIN_CONDITION}
          LEFT JOIN users u ON u.id = a.user_id
          WHERE a.id = ?
          LIMIT 1
        `,
        [appointmentId],
      );
      appointment = mapAppointmentRow(rows[0]);
    } else {
      const [followupResult] = await pool.query(
        "UPDATE appointment_followups SET status = ? WHERE id = ?",
        [nextStatus, appointmentId],
      );
      if (followupResult.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "Appointment not found.",
        });
      }
      const [rows] = await pool.query(
        "SELECT * FROM appointment_followups WHERE id = ? LIMIT 1",
        [appointmentId],
      );
      appointment = mapAppointmentRow(rows[0]);
    }

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found.",
      });
    }

    const user = appointment ? await fetchUser(appointment.user_id) : null;
    if (user && appointment) {
      notification = await createAppointmentNotifications(
        user,
        appointment,
        "Appointment status changed",
        `Your appointment for ${appointment.service} is now marked as ${nextStatus}.`,
      );
    }

    res.json({ success: true, appointment, notification });
  } catch (error) {
    console.error("updateAppointmentStatus failed", error);
    res.status(500).json({
      success: false,
      message: "Unable to update appointment status.",
    });
  }
};

exports.scheduleFollowUpAppointment = async (req, res) => {
  try {
    await ensureSupportTables();
    const { appointmentId } = req.params;
    const {
      user_id,
      hospital_id,
      hospital_name,
      service,
      appointment_date,
      notes,
    } = req.body;

    // Assign turn number based on existing bookings for same hospital+date
    const resolvedHospitalId = String(hospital_id || hospital_name || "").trim();
    const [[turnRow]] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM (
        SELECT id FROM appointments
          WHERE LOWER(COALESCE(hospital_id,'')) = LOWER(?) AND appointment_date = ? AND status NOT IN ('cancelled','done')
        UNION ALL
        SELECT id FROM appointment_followups
          WHERE LOWER(COALESCE(hospital_id,'')) = LOWER(?) AND appointment_date = ? AND status NOT IN ('cancelled','done')
      ) AS combined`,
      [resolvedHospitalId, appointment_date, resolvedHospitalId, appointment_date],
    );
    const turnNumber = Number(turnRow?.cnt || 0) + 1;
    const estimatedTime = turnNumber * 10;

    const [result] = await pool.query(
      `INSERT INTO appointment_followups
         (related_appointment_id, user_id, hospital_id, hospital_name, service, appointment_date, status, turn_number, estimated_time, source_type, scheduled_by, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        String(appointmentId), user_id,
        resolvedHospitalId, hospital_name || "Healthcare Center",
        service, appointment_date, "upcoming",
        turnNumber, estimatedTime,
        "admin-follow-up", "admin",
        notes || "Scheduled by admin.",
      ],
    );

    const appointment = mapAppointmentRow({
      id: result.insertId, user_id,
      hospital_id: resolvedHospitalId,
      hospital_name: hospital_name || "Healthcare Center",
      service, appointment_date, status: "upcoming",
      turn_number: turnNumber, estimated_time: estimatedTime,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      source_type: "admin-follow-up", scheduled_by: "admin",
      notes: notes || "Scheduled by admin.",
    });

    const user = await fetchUser(user_id);
    const notification = await createAppointmentNotifications(
      user || { id: user_id, email: req.body.patient_email, phone: req.body.patient_phone },
      appointment,
      "Next appointment scheduled",
      `Your next appointment at ${appointment.hospital_name} on ${appointment_date} is confirmed. Turn #${turnNumber}, estimated wait ${estimatedTime} min.`,
    );

    res.json({ success: true, appointment, notification });
  } catch (error) {
    console.error("scheduleFollowUpAppointment failed", error);
    res.status(500).json({ success: false, message: "Unable to schedule the follow-up appointment." });
  }
};

exports.createEmergencyRequest = async (req, res) => {
  try {
    await ensureSupportTables();
    const {
      user_id,
      patient_name,
      patient_phone,
      patient_email,
      city,
      lat,
      lng,
      notes,
    } = req.body;

    let hospital = null;
    const parsedLat = Number(lat);
    const parsedLng = Number(lng);

    if (Number.isFinite(parsedLat) && Number.isFinite(parsedLng)) {
      const [candidateHospitals] = await pool.query(
        `
          SELECT *
          FROM hospitals
          WHERE hasEmergency = 1
            AND lat IS NOT NULL
            AND lng IS NOT NULL
        `,
      );

      hospital =
        candidateHospitals
          .map((item) => ({
            ...item,
            distance: haversine(
              parsedLat,
              parsedLng,
              Number(item.lat),
              Number(item.lng),
            ),
          }))
          .sort((first, second) => {
            if (first.distance !== second.distance) {
              return first.distance - second.distance;
            }
            if (Boolean(second.is24_7) !== Boolean(first.is24_7)) {
              return Number(Boolean(second.is24_7)) - Number(Boolean(first.is24_7));
            }
            return String(first.name || "").localeCompare(String(second.name || ""));
          })[0] || null;
    }

    if (!hospital && city) {
      const [cityHospitals] = await pool.query(
        `
          SELECT *
          FROM hospitals
          WHERE LOWER(CONVERT(city USING utf8mb4) COLLATE utf8mb4_unicode_ci) = LOWER(?)
            AND hasEmergency = 1
          ORDER BY is24_7 DESC, isOpenNow DESC, name ASC
          LIMIT 1
        `,
        [city],
      );
      hospital = cityHospitals[0] || null;
    }

    if (!hospital) {
      const [fallbackHospitals] = await pool.query(
        `
          SELECT *
          FROM hospitals
          WHERE hasEmergency = 1
          ORDER BY is24_7 DESC, isOpenNow DESC, name ASC
          LIMIT 1
        `,
      );
      hospital = fallbackHospitals[0] || null;
    }

    const requestCity = hospital?.city || city || null;
    const [result] = await pool.query(
      `
        INSERT INTO emergency_requests
          (user_id, hospital_id, hospital_name, city, patient_name, patient_phone, patient_email, lat, lng, status, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        user_id || null,
        hospital?.id ? String(hospital.id) : null,
        hospital?.name || null,
        requestCity,
        patient_name || null,
        patient_phone || null,
        patient_email || null,
        Number.isFinite(parsedLat) ? parsedLat : null,
        Number.isFinite(parsedLng) ? parsedLng : null,
        "call-requested",
        notes || "Emergency button pressed by the patient.",
      ],
    );

    let notification = null;
    if (user_id) {
      notification = await createNotification({
        userId: user_id,
        title: "Emergency request received",
        body: hospital?.name
          ? `Your emergency request was sent to ${hospital.name}. Keep your phone close.`
          : "Your emergency request was saved. Please keep your phone close.",
        kind: "emergency",
      });
    }

    res.json({
      success: true,
      emergencyRequest: {
        id: result.insertId,
        user_id,
        hospital_id: hospital?.id ? String(hospital.id) : null,
        hospital_name: hospital?.name || null,
        city: requestCity,
        patient_name,
        patient_phone,
        patient_email,
        lat: Number.isFinite(parsedLat) ? parsedLat : null,
        lng: Number.isFinite(parsedLng) ? parsedLng : null,
        status: "call-requested",
        notes: notes || "Emergency button pressed by the patient.",
        created_at: new Date().toISOString(),
      },
      notification,
    });
  } catch (error) {
    console.error("createEmergencyRequest failed", error);
    res.status(500).json({
      success: false,
      message: "Unable to save the emergency request.",
    });
  }
};

exports.resolveEmergencyRequest = async (req, res) => {
  try {
    await ensureSupportTables();
    const { requestId } = req.params;
    await pool.query(
      "UPDATE emergency_requests SET status = 'resolved' WHERE id = ?",
      [requestId],
    );
    res.json({ success: true });
  } catch (error) {
    console.error("resolveEmergencyRequest failed", error);
    res.status(500).json({ success: false });
  }
};
