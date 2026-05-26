/* global require, process */
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const db = require("./config/db");
const nodemailer = require("nodemailer");
const appointmentRoutes = require("./routes/appointmentRoutes");
const app = express();
app.use(cors());
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

// ═══════════════════════════════════════════════════════
//  HELPER — parse opening_hours tag into isOpenNow
//  Supports: "24/7", "Mo-Fr 08:00-18:00", "Mo-Su 08:00-20:00", etc.
// ═══════════════════════════════════════════════════════
function isOpenNow(openingHours) {
  if (!openingHours) return null; // unknown

  const oh = openingHours.trim().toLowerCase();

  if (oh === "24/7") return true;

  const now = new Date();
  const day = now.getDay(); // 0=Sun,1=Mon,...,6=Sat
  const hhmm = now.getHours() * 60 + now.getMinutes(); // minutes since midnight

  // Day abbreviation index map (OSM uses Mo,Tu,We,Th,Fr,Sa,Su)
  const DAY_MAP = { su: 0, mo: 1, tu: 2, we: 3, th: 4, fr: 5, sa: 6 };

  // Parse one rule like "Mo-Fr 08:00-20:00" or "Sa 09:00-14:00"
  function parseRule(rule) {
    rule = rule.trim();
    const match = rule.match(
      /^([a-z]{2})(?:-([a-z]{2}))?\s+(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})$/i,
    );
    if (!match) return false;

    const [, d1, d2, h1, m1, h2, m2] = match;
    const startDay = DAY_MAP[d1.toLowerCase()] ?? -1;
    const endDay = d2 ? (DAY_MAP[d2.toLowerCase()] ?? -1) : startDay;
    const openMin = parseInt(h1) * 60 + parseInt(m1);
    const closeMin = parseInt(h2) * 60 + parseInt(m2);

    // Check if today is within the day range
    let inDayRange = false;
    if (startDay <= endDay) {
      inDayRange = day >= startDay && day <= endDay;
    } else {
      // Wraps around week (e.g. Sa-Mo)
      inDayRange = day >= startDay || day <= endDay;
    }

    if (!inDayRange) return false;
    return hhmm >= openMin && hhmm < closeMin;
  }

  // Split on semicolons (multiple rules) and try each
  const rules = oh.split(";");
  for (const rule of rules) {
    if (parseRule(rule.trim())) return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════
//  HELPER — map OSM amenity tags to medical services array
// ═══════════════════════════════════════════════════════
function osmTagsToServices(tags) {
  const services = new Set();
  if (!tags) return services;

  const amenity = (tags.amenity || "").toLowerCase();
  const rawServiceFields = [
    tags.speciality,
    tags.healthcare,
    tags["healthcare:speciality"],
    tags["healthcare:services"],
    tags.service,
    tags.department,
    tags.description,
  ]
    .filter(Boolean)
    .join(";");

  rawServiceFields
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => services.add(item));

  if (amenity === "hospital") {
    services.add("Emergency");
    if (!rawServiceFields) {
      ["General Medicine", "Surgery", "Radiology"].forEach((item) =>
        services.add(item),
      );
    }
  } else if (amenity === "clinic") {
    if (!rawServiceFields) {
      ["General Medicine", "Consultations"].forEach((item) =>
        services.add(item),
      );
    }
  } else if (amenity === "pharmacy") {
    services.add("Medicines");
    services.add("Prescriptions");
    if (tags["dispensing:prescription"] === "yes")
      services.add("Prescription Dispensing");
  }

  return Array.from(services);
}

// ═══════════════════════════════════════════════════════
//  HELPER — build a single normalised place object from OSM element
// ═══════════════════════════════════════════════════════
function normaliseOSM(el) {
  const tags = el.tags || {};
  const amenity = tags.amenity || "hospital";
  const typeMap = {
    hospital: "hospital",
    clinic: "clinic",
    pharmacy: "pharmacy",
  };
  const type = typeMap[amenity] || "hospital";

  const lat = el.lat ?? el.center?.lat ?? null;
  const lng = el.lon ?? el.center?.lon ?? null;

  const openStatus = isOpenNow(tags.opening_hours);

  // is24_7 true if explicitly tagged or if opening_hours is "24/7"
  const is24_7 =
    tags.opening_hours === "24/7" || tags["opening_hours:covid19"] === "24/7";

  const services = osmTagsToServices(tags);

  return {
    id: `osm-${el.type}-${el.id}`,
    name:
      tags.name || tags["name:fr"] || tags["name:ar"] || capitalise(amenity),
    type,
    city:
      tags["addr:city"] ||
      tags["addr:state"] ||
      tags["is_in:city"] ||
      "Tunisia",
    address:
      [tags["addr:street"], tags["addr:housenumber"]]
        .filter(Boolean)
        .join(" ") || "",
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    services: services.join(","),
    isOpenNow: openStatus, // null = unknown, true/false = computed
    is24_7: is24_7,
    hasEmergency: type === "hospital" || tags.emergency === "yes",
    phone: tags.phone || tags["contact:phone"] || null,
    website: tags.website || tags["contact:website"] || null,
    opening_hours: tags.opening_hours || null,
    source: "osm",
  };
}

function capitalise(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ─── All valid service scopes (from the filter sidebar) ──────────────────────
const ALL_SERVICE_SCOPES = [
  "emergency",
  "cardiology",
  "endocrinology",
  "gastroenterology",
  "pulmonology",
  "nephrology",
  "rheumatology",
  "hematology",
  "infectious diseases",
  "general medicine",
  "family medicine",
  "pediatrics",
  "general surgery",
  "orthopedic surgery",
  "neurosurgery",
  "cardiothoracic surgery",
  "plastic surgery",
  "vascular surgery",
  "urology",
  "ent",
  "dentistry",
  "dermatology",
  "radiology",
  "anesthesiology",
  "oncology",
  "pathology",
  "nutrition",
  "pharmacy",
];

function extractAdminService(email) {
  const normalisedEmail = String(email || "").trim().toLowerCase();
  if (!normalisedEmail.includes("admin")) return "";
  const compact = normalisedEmail.replace(/[^a-z]/g, "");
  const match = ALL_SERVICE_SCOPES.find((s) =>
    compact.includes(s.replace(/[^a-z]/g, "")),
  );
  if (!match) return "all";
  return match.charAt(0).toUpperCase() + match.slice(1);
}

function isSuperAdminEmail(email) {
  const e = String(email || "").trim().toLowerCase();
  return e.includes("superadmin") || (e.includes("super") && e.includes("admin"));
}

// ─── Sentiment dictionary ───────────────────────────────────────────────────
// Only words that carry real opinion signal are counted.
const SENTIMENT_POSITIVE = new Set([
  "good", "great", "excellent", "amazing", "awesome", "fantastic", "perfect",
  "wonderful", "outstanding", "superb", "brilliant", "love", "loved", "best",
  "helpful", "fast", "quick", "easy", "smooth", "clean", "friendly",
  "professional", "efficient", "satisfied", "happy", "pleased", "recommend",
  "improved", "better", "nice", "clear", "reliable", "responsive",
]);

const SENTIMENT_NEGATIVE = new Set([
  "bad", "terrible", "awful", "horrible", "worst", "poor", "slow", "broken",
  "confusing", "difficult", "hard", "frustrating", "annoying", "useless",
  "unhelpful", "rude", "late", "delayed", "error", "crash", "bug", "issue",
  "problem", "fail", "failed", "missing", "wrong", "ugly", "complicated",
  "disappointed", "disappointing", "unresponsive", "unclear", "expensive",
]);

const SENTIMENT_NEUTRAL_TOPICS = new Set([
  "booking", "appointment", "queue", "wait", "waiting", "hospital", "clinic",
  "doctor", "nurse", "staff", "service", "interface", "design", "navigation",
  "notification", "sms", "email", "profile", "login", "signup", "search",
  "filter", "map", "location", "emergency", "feedback", "average", "okay",
  "ok", "fine", "normal", "decent", "experience", "app", "website", "system",
  "feature", "support", "response", "time", "speed", "access",
]);

function classifySentiment(word) {
  if (SENTIMENT_POSITIVE.has(word)) return "positive";
  if (SENTIMENT_NEGATIVE.has(word)) return "negative";
  if (SENTIMENT_NEUTRAL_TOPICS.has(word)) return "topic";
  return null;
}

function tokeniseFeedback(messages) {
  const counts = new Map();

  messages.forEach((message) => {
    String(message || "")
      .toLowerCase()
      .replace(/[^a-z\s]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length >= 3 && classifySentiment(word) !== null)
      .forEach((word) => {
        const existing = counts.get(word) || { count: 0, sentiment: classifySentiment(word) };
        counts.set(word, { ...existing, count: existing.count + 1 });
      });
  });

  return Array.from(counts.entries())
    .sort((first, second) => second[1].count - first[1].count)
    .slice(0, 10)
    .map(([word, data]) => ({ word, count: data.count, sentiment: data.sentiment }));
}

function buildSmartRecommendation(topThemes, weeklyFeedback) {
  if (!topThemes.length || !weeklyFeedback.length) {
    return "Not enough weekly feedback yet to generate a recommendation.";
  }

  const positiveThemes = topThemes.filter((t) => t.sentiment === "positive");
  const negativeThemes = topThemes.filter((t) => t.sentiment === "negative");
  const topicThemes = topThemes.filter((t) => t.sentiment === "topic");

  const totalFeedback = weeklyFeedback.length;
  const positiveCount = weeklyFeedback.filter((row) => {
    const msg = String(row.message || "").toLowerCase();
    return [...SENTIMENT_POSITIVE].some((w) => msg.includes(w));
  }).length;
  const negativeCount = weeklyFeedback.filter((row) => {
    const msg = String(row.message || "").toLowerCase();
    return [...SENTIMENT_NEGATIVE].some((w) => msg.includes(w));
  }).length;

  const positiveRatio = totalFeedback > 0 ? positiveCount / totalFeedback : 0;
  const negativeRatio = totalFeedback > 0 ? negativeCount / totalFeedback : 0;

  if (negativeThemes.length > 0 && negativeRatio > 0.3) {
    const topNeg = negativeThemes[0];
    const relatedTopic = topicThemes[0];
    return `${Math.round(negativeRatio * 100)}% of this week's feedback is negative. The most critical signal is "${topNeg.word}" (${topNeg.count} mentions)${relatedTopic ? ` related to "${relatedTopic.word}"` : ""}. Prioritise fixing this before anything else.`;
  }

  if (positiveThemes.length > 0 && positiveRatio > 0.6) {
    const topPos = positiveThemes[0];
    return `${Math.round(positiveRatio * 100)}% of feedback is positive this week — "${topPos.word}" is the strongest signal. Keep the current direction and consider expanding what users love.`;
  }

  if (negativeThemes.length > 0) {
    const topNeg = negativeThemes[0];
    return `Mixed feedback this week. The top concern is "${topNeg.word}" (${topNeg.count} mentions). Address this to shift sentiment in the right direction.`;
  }

  if (topicThemes.length > 0) {
    return `Users are mostly talking about "${topicThemes[0].word}" this week. Dig into the raw comments to understand if this is a pain point or a strength.`;
  }

  return "Feedback is too varied this week to isolate a single priority. Read the raw comments for context.";
}

function buildWeeklyFeedbackSummary(feedbackRows) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const weeklyFeedback = feedbackRows.filter((row) => {
    const createdAt = new Date(row.created_at);
    return !Number.isNaN(createdAt.getTime()) && createdAt >= sevenDaysAgo;
  });

  const repeatedMessages = new Map();
  weeklyFeedback.forEach((row) => {
    const key = String(row.message || "").trim().toLowerCase();
    if (!key) return;
    repeatedMessages.set(key, {
      message: String(row.message || "").trim(),
      count: (repeatedMessages.get(key)?.count || 0) + 1,
    });
  });

  const mostRepeatedMessage = Array.from(repeatedMessages.values()).sort(
    (first, second) => second.count - first.count,
  )[0] || null;

  const topThemes = tokeniseFeedback(weeklyFeedback.map((row) => row.message));

  // Rating distribution
  const ratingCounts = {};
  weeklyFeedback.forEach((row) => {
    const r = String(row.rating || "unknown").toLowerCase();
    ratingCounts[r] = (ratingCounts[r] || 0) + 1;
  });

  return {
    generated_at: new Date().toISOString(),
    week_range: {
      from: sevenDaysAgo.toISOString(),
      to: new Date().toISOString(),
    },
    total_feedback: weeklyFeedback.length,
    most_repeated_feedback: mostRepeatedMessage,
    top_themes: topThemes,
    rating_distribution: ratingCounts,
    recommendation: buildSmartRecommendation(topThemes, weeklyFeedback),
  };
}

async function ensureDefaultSuperAdminAccount() {
  try {
    const [rows] = await db.promise().query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1",
      ["superadmin@urgentflow.com"],
    );

    if (rows.length) return;

    const hashedPassword = await bcrypt.hash("superAdmin123", 10);
    await db.promise().query(
      `
        INSERT INTO users
          (fullName, email, phone, city, address, date_of_birth, gender, blood_type, diseases, allergies, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        "Super Admin",
        "superadmin@urgentflow.com",
        "20111222",
        "Tunis",
        "UrgentFlow HQ",
        "1990-01-01",
        "female",
        "O+",
        "",
        "",
        hashedPassword,
      ],
    );
  } catch (error) {
    console.error(
      "Unable to seed the default super admin account:",
      error.message,
    );
  }
}

// ═══════════════════════════════════════════════════════
//  OVERPASS — fetch all hospitals/clinics/pharmacies in Tunisia
//  Called once on startup, cached in memory, refreshed every 6h
// ═══════════════════════════════════════════════════════
let osmCache = [];
let osmCacheTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

// Tunisia bounding box: south,west,north,east
const TUNISIA_BBOX = "30.0,7.5,38.0,12.0";

async function fetchOSMTunisia() {
  const now = Date.now();
  if (osmCache.length > 0 && now - osmCacheTime < CACHE_TTL) {
    return osmCache;
  }

  console.log("🔄 Fetching healthcare data from Overpass API…");

  // Overpass QL — nodes AND ways (buildings) with amenity=hospital|clinic|pharmacy
  // inside Tunisia bbox
  const query = `
    [out:json][timeout:60];
    (
      node["amenity"~"^(hospital|clinic|pharmacy)$"](${TUNISIA_BBOX});
      way["amenity"~"^(hospital|clinic|pharmacy)$"](${TUNISIA_BBOX});
    );
    out center tags;
  `;

  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "UrgentFlow/1.0 (urgentflow.app@gmail.com)" },
    });

    if (!response.ok) throw new Error(`Overpass returned ${response.status}`);

    const data = await response.json();

    // Offensive / placeholder names to exclude
    const BLOCKED_NAME_PATTERNS = [
      /fuck/i,
      /shit/i,
      /test\s*hospital/i,
      /fake/i,
      /dummy/i,
    ];

    // Filter out elements without a name, without valid coordinates, or with offensive names
    const places = data.elements
      .map(normaliseOSM)
      .filter(
        (p) =>
          p.name &&
          !isNaN(p.lat) &&
          !isNaN(p.lng) &&
          !BLOCKED_NAME_PATTERNS.some((re) => re.test(p.name)),
      );

    console.log(`✅ Loaded ${places.length} healthcare places from OSM`);

    osmCache = places;
    osmCacheTime = now;

    return places;
  } catch (err) {
    console.error("❌ Overpass fetch failed:", err.message);
    // Return stale cache if available
    return osmCache.length > 0 ? osmCache : [];
  }
}

async function fetchDatabaseHospitals() {
  try {
    const [rows] = await db.promise().query("SELECT * FROM hospitals");
    return rows.map((row) => ({
      id: String(row.id),
      name: row.name || "Healthcare Center",
      type: row.type || "hospital",
      city: row.city || row.location || "Tunisia",
      address: row.address || row.location || "",
      lat: Number.isFinite(parseFloat(row.lat)) ? parseFloat(row.lat) : null,
      lng: Number.isFinite(parseFloat(row.lng)) ? parseFloat(row.lng) : null,
      services: row.services || "",
      isOpenNow:
        row.isOpenNow === null || row.isOpenNow === undefined
          ? null
          : Boolean(row.isOpenNow),
      is24_7: Boolean(row.is24_7),
      hasEmergency: Boolean(row.hasEmergency),
      phone: row.phone || null,
      website: row.website || null,
      opening_hours: row.opening_hours || null,
      source: "database",
    }));
  } catch (error) {
    console.error("Database hospitals fetch failed:", error.message);
    return [];
  }
}

function mergeServices(...serviceValues) {
  const services = new Set();

  serviceValues.forEach((value) => {
    const items = Array.isArray(value)
      ? value
      : String(value || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);
    items.forEach((item) => services.add(item));
  });

  return Array.from(services).join(",");
}

function mergeHealthcarePlaces(osmPlaces, databasePlaces) {
  const merged = new Map();

  [...databasePlaces, ...osmPlaces].forEach((place) => {
    const key = `${String(place.name || "").trim().toLowerCase()}::${String(
      place.city || "",
    )
      .trim()
      .toLowerCase()}::${String(place.type || "hospital")
      .trim()
      .toLowerCase()}`;
    const current = merged.get(key);

    if (!current) {
      merged.set(key, { ...place });
      return;
    }

    merged.set(key, {
      ...current,
      ...place,
      id:
        current.source === "database" || current.source === "merged"
          ? current.id
          : place.source === "database"
            ? place.id
            : place.id || current.id,
      lat: Number.isFinite(place.lat) ? place.lat : current.lat,
      lng: Number.isFinite(place.lng) ? place.lng : current.lng,
      address: place.address || current.address,
      phone: place.phone || current.phone,
      website: place.website || current.website,
      isOpenNow: place.isOpenNow ?? current.isOpenNow,
      is24_7: Boolean(place.is24_7 || current.is24_7),
      hasEmergency: Boolean(place.hasEmergency || current.hasEmergency),
      services: mergeServices(current.services, place.services),
      source:
        current.source === "database" || place.source === "database"
          ? "merged"
          : place.source,
    });
  });

  return Array.from(merged.values());
}

async function fetchAllHealthcarePlaces() {
  const [osmPlaces, databasePlaces] = await Promise.all([
    fetchOSMTunisia(),
    fetchDatabaseHospitals(),
  ]);
  return mergeHealthcarePlaces(osmPlaces, databasePlaces);
}

// Warm up the cache on server start
fetchOSMTunisia();

// ═══════════════════════════════════════════════════════
//  ROUTE: GET /osm/hospitals
//  Returns all OSM healthcare places for Tunisia
//  Query params: city, type, search
// ═══════════════════════════════════════════════════════
app.get("/osm/hospitals", async (req, res) => {
  const { city, type, search } = req.query;

  try {
    let places = await fetchAllHealthcarePlaces();

    // Recompute isOpenNow on every request (time has passed)
    places = places.map((p) => ({
      ...p,
      isOpenNow: isOpenNow(p.opening_hours),
    }));

    if (city)
      places = places.filter((p) =>
        p.city.toLowerCase().includes(city.toLowerCase()),
      );
    if (type) places = places.filter((p) => p.type === type);
    if (search)
      places = places.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.city.toLowerCase().includes(search.toLowerCase()),
      );

    res.json({ success: true, data: places });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

// ═══════════════════════════════════════════════════════
//  ROUTE: GET /osm/hospitals/nearby
//  Returns OSM places within radius km of lat/lng
// ═══════════════════════════════════════════════════════
app.get("/osm/hospitals/nearby", async (req, res) => {
  const { lat, lng, radius = 10 } = req.query;
  const userLat = parseFloat(lat);
  const userLng = parseFloat(lng);
  const maxKm = parseFloat(radius);

  if (isNaN(userLat) || isNaN(userLng)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid coordinates" });
  }

  try {
    let places = await fetchAllHealthcarePlaces();

    places = places
      .map((p) => ({
        ...p,
        isOpenNow: isOpenNow(p.opening_hours),
        distance: haversine(userLat, userLng, p.lat, p.lng),
      }))
      .filter((p) => p.distance <= maxKm)
      .sort((a, b) => a.distance - b.distance);

    res.json({ success: true, data: places });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ═══════════════════════════════════════════════════════
//  ROUTE: GET /osm/hospitals/city/:city
//  Returns OSM places in a specific city
// ═══════════════════════════════════════════════════════
app.get("/osm/hospitals/city/:city", async (req, res) => {
  const city = decodeURIComponent(req.params.city);

  try {
    let places = await fetchAllHealthcarePlaces();
    places = places
      .filter((p) => p.city.toLowerCase().includes(city.toLowerCase()))
      .map((p) => ({ ...p, isOpenNow: isOpenNow(p.opening_hours) }));

    res.json({ success: true, data: places, city });
  } catch {
    res.status(500).json({ success: false });
  }
});

// ═══════════════════════════════════════════════════════
//  ROUTE: GET /osm/hospitals/user/:email
//  Returns OSM places in the city registered by the user
// ═══════════════════════════════════════════════════════
app.get("/osm/hospitals/user/:email", async (req, res) => {
  db.query(
    "SELECT city FROM users WHERE email = ?",
    [req.params.email],
    async (err, results) => {
      if (err || !results.length)
        return res.json({ success: false, message: "User not found" });

      const city = String(results[0].city || "").trim();

      if (!city) {
        return res.json({
          success: true,
          data: [],
          city: "",
          message: "No city is saved for this user yet.",
        });
      }

      try {
        let places = await fetchAllHealthcarePlaces();
        places = places
          .filter((p) =>
            String(p.city || "")
              .trim()
              .toLowerCase()
              .includes(city.toLowerCase()),
          )
          .map((p) => ({ ...p, isOpenNow: isOpenNow(p.opening_hours) }));

        res.json({ success: true, data: places, city });
      } catch {
        res.status(500).json({ success: false });
      }
    },
  );
});

// ═══════════════════════════════════════════════════════
//  ROUTE: POST /osm/refresh
//  Force-clears the OSM cache (useful after testing)
// ═══════════════════════════════════════════════════════
app.post("/osm/refresh", async (req, res) => {
  osmCache = [];
  osmCacheTime = 0;
  const places = await fetchOSMTunisia();
  res.json({ success: true, count: places.length });
});

// ═══════════════════════════════════════════════════════
//  Haversine distance helper (km)
// ═══════════════════════════════════════════════════════
function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ═══════════════════════════════════════════════════════
//  Keep your existing MySQL-based routes untouched below
// ═══════════════════════════════════════════════════════

app.get("/", (_, res) => res.send("API is working ✅"));

app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Ensure role + service_scope columns exist (runs once, safe to repeat)
  await db.promise().query(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS role VARCHAR(30) DEFAULT 'patient',
      ADD COLUMN IF NOT EXISTS service_scope VARCHAR(100) DEFAULT ''
  `).catch(() => {});

  db.query(
    "SELECT * FROM users WHERE LOWER(email) = LOWER(?)",
    [email],
    async (err, results) => {
      if (err) return res.status(500).send(err);
      if (!results.length)
        return res.json({ success: false, message: "User not found" });

      const user = results[0];
      let isMatch = false;
      try {
        isMatch = await bcrypt.compare(password, user.password);
      } catch { isMatch = false; }
      if (!isMatch && password === user.password) isMatch = true;
      if (!isMatch)
        return res.json({ success: false, message: "Wrong password" });

      // Role comes from DB — never derived from email at login time
      const role = user.role || "patient";
      const serviceScope = user.service_scope || "";

      res.json({
        success: true,
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          city: user.city,
          address: user.address,
          gender: user.gender,
          bloodType: user.blood_type,
          diseases: user.diseases ? String(user.diseases).split(",") : [],
          allergies: user.allergies,
          date: user.date_of_birth
            ? new Date(user.date_of_birth).toISOString().slice(0, 10)
            : "",
          role,
          serviceScope,
        },
      });
    },
  );
});

app.post("/signup", async (req, res) => {
  const {
    fullName,
    email,
    phone,
    city,
    address,
    date,
    gender,
    bloodType,
    diseases,
    allergies,
    password,
  } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const diseasesString = Array.isArray(diseases)
      ? diseases.map((d) => (typeof d === "object" ? d.value : d)).join(",")
      : "";
    const sql = `INSERT INTO users (fullName,email,phone,city,address,date_of_birth,gender,blood_type,diseases,allergies,password) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
    db.query(
      sql,
      [
        fullName,
        email,
        phone,
        city,
        address,
        date,
        gender,
        bloodType?.value || null,
        diseasesString,
        allergies,
        hashedPassword,
      ],
      (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY")
            return res.json({
              success: false,
              message: "Email already exists",
            });
          return res.json({ success: false });
        }
        res.json({ success: true });
      },
    );
  } catch {
    res.json({ success: false });
  }
});

app.post("/send-code", (req, res) => {
  const { email } = req.body;
  db.query("SELECT * FROM users WHERE email=?", [email], (err, results) => {
    if (err) return res.json({ success: false });
    if (!results.length)
      return res.json({ success: false, message: "Email not found" });
    const code = Math.floor(1000 + Math.random() * 9000);
    const expiresAt = Date.now() + 10 * 60 * 1000;
    db.query(
      "INSERT INTO password_resets (email, code, expires_at) VALUES (?, ?, ?)",
      [email, code, expiresAt],
      (err) => {
        if (err) return res.json({ success: false });
        transporter.sendMail(
          {
            from: '"UrgentFlow" <urgentflow.app@gmail.com>',
            to: email,
            subject: "Password Reset Code",
            html: `<div style="font-family:Arial;background:#f4f6f8;padding:40px;text-align:center;"><div style="max-width:500px;margin:auto;background:white;padding:30px;border-radius:10px;"><h2 style="color:#589BFF;">UrgentFlow</h2><p>Your reset code:</p><div style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:20px 0;">${code}</div><p style="color:#888;">Expires in 5 minutes</p></div></div>`,
          },
          (error) => {
            if (error)
              return res.json({ success: false, message: "Email not sent" });
            res.json({ success: true });
          },
        );
      },
    );
  });
});

app.post("/verify-code", (req, res) => {
  const { email, code } = req.body;
  db.query(
    "SELECT * FROM password_resets WHERE email = ? ORDER BY expires_at DESC LIMIT 1",
    [email],
    (err, results) => {
      if (err || !results.length)
        return res.json({ success: false, message: "No code found" });
      const record = results[0];
      if (Date.now() > record.expires_at)
        return res.json({ success: false, message: "Code expired" });
      if (record.code != code)
        return res.json({ success: false, message: "Invalid code" });
      res.json({ success: true });
    },
  );
});

app.post("/reset-password", async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    db.query(
      "UPDATE users SET password=? WHERE email=?",
      [hashed, email],
      (err) => {
        if (err) return res.json({ success: false });
        db.query("DELETE FROM password_resets WHERE email=?", [email]);
        res.json({ success: true });
      },
    );
  } catch {
    res.json({ success: false });
  }
});

app.post("/feedback", async (req, res) => {
  const { user_id, rating, message } = req.body;

  if (!user_id) {
    return res
      .status(401)
      .json({ success: false, message: "Please sign in before sending feedback." });
  }

  if (!rating || !String(message || "").trim()) {
    return res.status(400).json({
      success: false,
      message: "Choose a reaction and write your feedback before sending.",
    });
  }

  try {
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        rating VARCHAR(40) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    await db.promise().query(
      "INSERT INTO feedback (user_id, rating, message) VALUES (?, ?, ?)",
      [user_id, rating, String(message).trim()],
    );

    res.json({ success: true, message: "Thank you for your feedback." });
  } catch (err) {
    console.error("feedback failed", err);
    res.status(500).json({
      success: false,
      message: "Unable to save feedback right now.",
    });
  }
});

app.get("/feedback/admin/insights", async (_, res) => {
  try {
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        rating VARCHAR(40) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    const [rows] = await db.promise().query(`
      SELECT
        f.id,
        f.user_id,
        f.rating,
        f.message,
        f.created_at,
        u.fullName,
        u.email
      FROM feedback f
      LEFT JOIN users u ON u.id = f.user_id
      ORDER BY f.created_at DESC
    `);

    res.json({
      success: true,
      feedback: rows,
      weekly_summary: buildWeeklyFeedbackSummary(rows),
    });
  } catch (error) {
    console.error("feedback insights failed", error);
    res.status(500).json({
      success: false,
      message: "Unable to load feedback insights right now.",
    });
  }
});

app.get("/hospitals", (req, res) => {
  const { city, type, search } = req.query;
  let sql = "SELECT * FROM hospitals WHERE 1=1";
  let params = [];
  if (city) {
    sql += " AND city = ?";
    params.push(city);
  }
  if (type) {
    sql += " AND type = ?";
    params.push(type);
  }
  if (search) {
    sql += " AND name LIKE ?";
    params.push(`%${search}%`);
  }
  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: results });
  });
});

app.get("/hospitals/nearby", (req, res) => {
  const { lat, lng, radius = 10 } = req.query;
  const sql = `SELECT *, (6371 * ACOS(COS(RADIANS(?)) * COS(RADIANS(lat)) * COS(RADIANS(lng) - RADIANS(?)) + SIN(RADIANS(?)) * SIN(RADIANS(lat)))) AS distance FROM hospitals HAVING distance < ? ORDER BY distance ASC`;
  db.query(sql, [lat, lng, lat, radius], (err, results) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: results });
  });
});

app.get("/hospitals/user/:email", (req, res) => {
  db.query(
    "SELECT city FROM users WHERE email = ?",
    [req.params.email],
    (err, userResult) => {
      if (err || !userResult.length) return res.json({ success: false });
      const city = userResult[0].city;
      db.query(
        "SELECT * FROM hospitals WHERE city = ?",
        [city],
        (err, hospitals) => {
          if (err) return res.json({ success: false });
          res.json({ success: true, city, data: hospitals });
        },
      );
    },
  );
});

app.use("/api/appointments", appointmentRoutes);
ensureDefaultSuperAdminAccount();
app.listen(5000, () => console.log("Server running on port 5000 ✅"));
