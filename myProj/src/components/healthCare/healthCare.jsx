import { useState, useEffect, useCallback } from "react";
import "./healthCare.css";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleRight, faAngleLeft } from "@fortawesome/free-solid-svg-icons";
import hospital1 from "../../assets/ahmed.png";
import hospital2 from "../../assets/gaserine.png";
import clinic1 from "../../assets/clinique.png";
import clinic2 from "../../assets/clinic.jpg";
import pharmacie1 from "../../assets/pharmacie.png";
import pharmacie2 from "../../assets/pharmacie1.jpeg";
import healthcareCatalog from "../../data/healthcareCatalog.json";
import { places as localPlaces } from "./places.js";

// ─── Base URL: change once if your backend port changes ───
const API = "http://127.0.0.1:5000";

// ─── Haversine (for client-side distance filter) ───
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

// ─── Open/closed label helper ───
// isOpenNow from OSM: true = open, false = closed, null = unknown
function OpenBadge({ isOpenNow }) {
  if (isOpenNow === true) return <p className="open">Open Now</p>;
  if (isOpenNow === false) return <p className="close">Closed Now</p>;
  return (
    <p className="available" style={{ color: "#888" }}>
      Hours Unknown
    </p>
  );
}

function normaliseKey(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function mergeServices(primaryServices = [], secondaryServices = []) {
  const merged = new Map();

  [...primaryServices, ...secondaryServices]
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .forEach((service) => {
      const key = normaliseKey(service);
      if (!merged.has(key)) {
        merged.set(key, service);
      }
    });

  return Array.from(merged.values());
}

function parseTimeToMinutes(value) {
  const [hours, minutes] = String(value || "00:00")
    .split(":")
    .map((part) => Number(part));
  return hours * 60 + minutes;
}

function isOpenFromSchedule(schedule, currentDate = new Date()) {
  if (!schedule) return null;

  const dayKeys = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];
  const currentDay = dayKeys[currentDate.getDay()];
  const minutesNow = currentDate.getHours() * 60 + currentDate.getMinutes();

  if (Array.isArray(schedule.closedDays) && schedule.closedDays.includes(currentDay)) {
    return false;
  }

  if (schedule.type === "split") {
    return (schedule.windows || []).some((window) => {
      const open = parseTimeToMinutes(window.open);
      const close = parseTimeToMinutes(window.close);
      return minutesNow >= open && minutesNow < close;
    });
  }

  const open = parseTimeToMinutes(schedule.open);
  const close = parseTimeToMinutes(schedule.close);
  if (close <= open) {
    return minutesNow >= open || minutesNow < close;
  }
  return minutesNow >= open && minutesNow < close;
}

// ─── Count services for a place ───
function serviceCount(item) {
  if (Array.isArray(item.services)) return item.services.length;
  if (typeof item.services === "string") {
    return item.services.split(",").filter(Boolean).length;
  }
  return 0;
}

// ─── Offensive / vague name patterns to exclude ───
const BLOCKED_NAME_PATTERNS = [
  /fuck/i, /shit/i, /test\s*hospital/i, /fake/i, /dummy/i,
];

function isVagueName(name) {
  if (!name) return true;
  if (BLOCKED_NAME_PATTERNS.some((re) => re.test(name))) return true;
  // Names that are just a type word with no real identifier
  const stripped = name.trim().toLowerCase();
  if (/^(hospital|clinic|pharmacy|pharmacie|clinique|hopital)$/.test(stripped)) return true;
  return false;
}

// ─── Sort: local places.js first (by service count desc), then OSM (by service count desc) ───
function sortMergedPlaces(mergedList) {
  const localNames = new Set(localPlaces.map((p) => normaliseKey(p.name)));

  const localGroup = mergedList
    .filter((p) => localNames.has(normaliseKey(p.name)) && !isVagueName(p.name))
    .sort((a, b) => serviceCount(b) - serviceCount(a));

  const fetchedGroup = mergedList
    .filter((p) => !localNames.has(normaliseKey(p.name)) && !isVagueName(p.name))
    .sort((a, b) => serviceCount(b) - serviceCount(a));

  const vagueGroup = mergedList
    .filter((p) => isVagueName(p.name))
    .sort((a, b) => serviceCount(b) - serviceCount(a));

  return [...localGroup, ...fetchedGroup, ...vagueGroup];
}

const CATALOG_OVERRIDES = healthcareCatalog.map((item) => ({
  ...item,
  lat: item.coordinates?.lat ?? item.lat ?? null,
  lng: item.coordinates?.lng ?? item.lng ?? null,
  normalizedName: normaliseKey(item.name),
}));

const PHARMACY_SCHEDULE_OVERRIDES = {
  "pharmacie bayoudh": {
    schedule: {
      type: "range",
      open: "08:30",
      close: "00:00",
      closedDays: ["sunday"],
    },
  },
  "narjes kamoun pharmacy": {
    schedule: {
      type: "split",
      windows: [
        { open: "08:30", close: "19:30" },
      ],
      saturdayWindows: [{ open: "08:30", close: "13:00" }],
      closedDays: ["sunday"],
    },
  },
  "pharmacie du marche central dr omar khabthani": {
    schedule: {
      type: "range",
      open: "08:30",
      close: "00:00",
      closedDays: ["sunday"],
    },
  },
};

function resolvePharmacySchedule(item) {
  const nameKey = normaliseKey(item.name);
  const match = PHARMACY_SCHEDULE_OVERRIDES[nameKey];
  if (!match?.schedule) {
    return null;
  }

  if (nameKey === "narjes kamoun pharmacy") {
    const dayKeys = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    const currentDay = dayKeys[new Date().getDay()];
    return currentDay === "saturday"
      ? {
          type: "split",
          windows: match.schedule.saturdayWindows,
          closedDays: ["sunday"],
        }
      : match.schedule;
  }

  return match.schedule;
}

function enrichPlacesWithCatalog(fetchedPlaces = []) {
  const mergedPlaces = [];
  const seenNames = new Set();

  fetchedPlaces.forEach((item) => {
    const normalizedName = normaliseKey(item.name);
    const override = CATALOG_OVERRIDES.find(
      (catalogItem) => catalogItem.normalizedName === normalizedName,
    );

    const merged = {
      ...item,
      ...(override
        ? {
            city: override.city || item.city,
            lat: override.lat ?? item.lat,
            lng: override.lng ?? item.lng,
            is24_7: override.is24_7 ?? item.is24_7,
            hasEmergency: override.hasEmergency ?? item.hasEmergency,
          }
        : {}),
    };

    const mergedServices = mergeServices(
      typeof item.services === "string"
        ? item.services.split(",")
        : Array.isArray(item.services)
          ? item.services
          : [],
      override?.services || [],
    );
    merged.services = mergedServices.join(", ");

    if (merged.type?.toLowerCase() === "pharmacy") {
      const schedule = resolvePharmacySchedule(merged);
      if (merged.is24_7) {
        merged.isOpenNow = true;
      } else if (schedule) {
        merged.isOpenNow = isOpenFromSchedule(schedule);
      } else if (override && typeof override.isOpenNow === "boolean") {
        merged.isOpenNow = override.isOpenNow;
      }
    } else if (override && typeof override.isOpenNow === "boolean" && merged.isOpenNow == null) {
      merged.isOpenNow = override.isOpenNow;
    }

    seenNames.add(normalizedName);
    mergedPlaces.push(merged);
  });

  CATALOG_OVERRIDES.forEach((override) => {
    if (seenNames.has(override.normalizedName)) return;

    const item = {
      id: override.id,
      name: override.name,
      type: override.type,
      city: override.city,
      lat: override.lat,
      lng: override.lng,
      is24_7: override.is24_7,
      hasEmergency: override.hasEmergency,
      services: mergeServices(override.services || []).join(", "),
      isOpenNow:
        override.type?.toLowerCase() === "pharmacy"
          ? override.is24_7
            ? true
            : isOpenFromSchedule(resolvePharmacySchedule(override)) ?? override.isOpenNow
          : override.isOpenNow,
    };

    mergedPlaces.push(item);
  });

  return mergedPlaces;
}

export default function HealthCare({
  filters,
  search,
  section,
  setSection,
  user,
}) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState("all");
  const [coords, setCoords] = useState(null);
  const itemsPerPage = 10;

  // ── 1. Get GPS coordinates once ──
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.warn("GPS unavailable:", err.message),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // ── 2. Fetch data based on viewMode ──
  const loadPlaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let url = `${API}/osm/hospitals`;
      let nearbyPosition = null;

      if (viewMode === "myCity") {
        // Get fresh GPS position on demand — don't rely on stale coords state
        const position = await new Promise((resolve) => {
          if (!navigator.geolocation) { resolve(null); return; }
          const timer = window.setTimeout(() => resolve(null), 5000);
          navigator.geolocation.getCurrentPosition(
            (pos) => { clearTimeout(timer); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }); },
            () => { clearTimeout(timer); resolve(null); },
            { enableHighAccuracy: true, timeout: 5000 },
          );
        });

        if (position) {
          setCoords(position);
          nearbyPosition = position;
          url = `${API}/osm/hospitals/nearby?lat=${position.lat}&lng=${position.lng}&radius=20`;
        } else if (user?.email) {
          // GPS unavailable — fall back to registered city
          url = `${API}/osm/hospitals/user/${encodeURIComponent(user.email)}`;
        }
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success) {
        const fetched = data.data || [];

        if (viewMode === "myCity" && nearbyPosition) {
          // For nearby mode: only show catalog entries within the radius too
          const enriched = enrichPlacesWithCatalog(fetched);
          const filtered = enriched
            .map((item) => {
              // Attach distance to catalog-only entries that don't have it yet
              if (item.distance == null && item.lat != null && item.lng != null) {
                return { ...item, distance: haversine(nearbyPosition.lat, nearbyPosition.lng, item.lat, item.lng) };
              }
              return item;
            })
            .filter((item) => item.distance != null && item.distance <= 20)
            .sort((a, b) => a.distance - b.distance); // nearest first
          setPlaces(filtered);
        } else {
          setPlaces(sortMergedPlaces(enrichPlacesWithCatalog(fetched)));
        }
      } else {
        setError("Could not load healthcare centers.");
      }
    } catch (err) {
      console.error(err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, user]);

  useEffect(() => {
    loadPlaces();
  }, [loadPlaces]);

  // ── 3. Reset to page 1 on any filter/search/section change ──
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, search, section, viewMode]);

  // ── 4. Client-side filtering ──
  const filteredPlaces = places.filter((item) => {
    // Text search: name or city
    const query = typeof search === "string" ? search.toLowerCase() : "";
    const matchesSearch =
      item.name.toLowerCase().includes(query) ||
      item.city.toLowerCase().includes(query);

    // Section tabs: hospital / clinic / pharmacy
    const matchesSection =
      !section || item.type.toLowerCase() === section.toLowerCase();

    // Services filter (comma-separated string from OSM)
    const servicesArray =
      typeof item.services === "string"
        ? item.services.split(",").map((s) => s.trim().toLowerCase())
        : [];
    const matchesServices =
      !filters.services ||
      filters.services.length === 0 ||
      filters.services.some((s) => servicesArray.includes(s.toLowerCase()));

    // Availability filter
    const matchesAvailability =
      !filters.availability ||
      (filters.availability === "open now" && item.isOpenNow === true) ||
      (filters.availability === "24/7" && Boolean(item.is24_7)) ||
      (filters.availability === "emergency" && Boolean(item.hasEmergency));

    // Distance filter — requires GPS coords
    const maxKm = filters.distance
      ? parseInt(filters.distance.replace("km", ""), 10)
      : null;

    const matchesDistance =
      !maxKm || !coords || isNaN(item.lat) || isNaN(item.lng)
        ? true
        : haversine(coords.lat, coords.lng, item.lat, item.lng) <= maxKm;

    return (
      matchesSearch &&
      matchesSection &&
      matchesServices &&
      matchesAvailability &&
      matchesDistance
    );
  });

  // ── 5. Pagination ──
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentItems = filteredPlaces.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredPlaces.length / itemsPerPage);

  const paginate = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const getVisiblePages = () => {
    const range = 2;
    let start = Math.max(1, currentPage - range);
    let end = Math.min(totalPages, currentPage + range);

    const pages = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };

  // ── Render ──
  return (
    <div className="all-wrapper1">
      {/* Sort tabs */}
      <div className="sort-wrapper">
        <p
          className={viewMode === "all" ? "active-sort" : ""}
          onClick={() => {
            setViewMode("all");
            setSection && setSection(""); // safe reset
          }}
        >
          All
        </p>

        <p
          className={viewMode === "myCity" ? "active-sort" : ""}
          onClick={() => {
            setViewMode("myCity");
            setSection && setSection("");
          }}
        >
          {user?.email ? "My City" : "Nearby"}
        </p>
      </div>

      {/* Loading / error states */}
      {loading && (
        <p className="no-results" style={{ padding: "40px 0" }}>
          Loading healthcare centers…
        </p>
      )}
      {!loading && error && (
        <p className="no-results" style={{ color: "red", padding: "40px 0" }}>
          {error}
        </p>
      )}

      {/* Hospital cards */}
      {!loading && !error && (
        <div className="all-hospitals-wrapper">
          {currentItems.length > 0 ? (
            currentItems.map((item) => (
              <div className="hospitals-div" key={item.id}>
                {/* Generic healthcare image — cycles through a set of quality photos */}
                <img
                  src={getImageUrl(item)}
                  alt={item.name}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=400&q=80";
                  }}
                />

                <div className="app">
                  <h3>{item.name}</h3>
                  <p className="texts">
                    {capitalise(item.type)} — {item.city}
                    {item.distance != null && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: "0.9rem",
                          color: "#888",
                        }}
                      >
                        ({item.distance.toFixed(1)} km away)
                      </span>
                    )}
                  </p>

                  <div className="features">
                    {Boolean(item.is24_7) && (
                      <p className="available">24/7 available</p>
                    )}
                    <OpenBadge isOpenNow={item.isOpenNow} />
                    {Boolean(item.hasEmergency) && (
                      <p className="available" style={{ color: "#e74c3c" }}>
                        Emergency
                      </p>
                    )}
                  </div>

                  {/* Services */}
                  <ul>
                    {typeof item.services === "string" &&
                      item.services
                        .split(",")
                        .filter(Boolean)
                        .map((s) => <li key={s}>{s.trim()}</li>)}
                  </ul>

                  {/* Phone & website if available */}
                  {(item.phone || item.website) && (
                    <p style={{ fontSize: "0.85rem", color: "#888" }}>
                      {item.phone && <span>📞 {item.phone} </span>}
                      {item.website && (
                        <a
                          href={item.website}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#5B9BFF" }}
                        >
                          Website
                        </a>
                      )}
                    </p>
                  )}

                  {item.type.toLowerCase() !== "pharmacy" ? (
                    <Link
                      className="book-app"
                      to="/form"
                      state={{
                        hospital: {
                          ...item,
                          services: Array.isArray(item.services)
                            ? item.services
                            : typeof item.services === "string"
                              ? item.services.split(",").filter(Boolean)
                              : [],
                        },
                      }}
                    >
                      Book A Place Now
                    </Link>
                  ) : (
                    <a
                      className="book-app pharmacy-map-link"
                      href={buildGoogleMapsUrl(item)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Walk-in on Google Maps
                    </a>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="no-results">
              No healthcare centers found matching your criteria.
            </p>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="next-prev"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faAngleLeft} size="lg" />
          </button>

          {getVisiblePages().map((page) => (
            <button
              key={page}
              onClick={() => paginate(page)}
              className={`page-number${currentPage === page ? " active-page" : ""}`}
            >
              {page}
            </button>
          ))}

          <button
            className="next-prev"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <FontAwesomeIcon icon={faAngleRight} size="lg" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Deterministic image from a curated healthcare photo set ───
const IMAGE_MAP = {
  hospital: [hospital1, hospital2],
  clinic: [clinic1, clinic2],
  pharmacy: [pharmacie1, pharmacie2],
};
function getImageUrl(item) {
  const list = IMAGE_MAP[item.type] || IMAGE_MAP.hospital;
  return list[Math.abs(hashCode(String(item.id || item.name || "hospital"))) % list.length];
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

function capitalise(str = "") {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function buildGoogleMapsUrl(item) {
  if (Number.isFinite(item.lat) && Number.isFinite(item.lng)) {
    return `https://www.google.com/maps/search/?api=1&query=${item.lat},${item.lng}`;
  }

  const query = encodeURIComponent(
    [item.name, item.address, item.city].filter(Boolean).join(", "),
  );
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}
