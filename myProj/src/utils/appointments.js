const APPOINTMENTS_STORAGE_KEY = "urgentflow_mock_appointments";
const SETTINGS_STORAGE_KEY = "urgentflow_settings";
const NOTIFICATIONS_STORAGE_KEY = "urgentflow_notifications";
const NOTIFICATION_META_STORAGE_KEY = "urgentflow_notification_meta";
const EMERGENCY_REQUESTS_KEY = "urgentflow_emergency_requests";
const API_BASE_URL = "http://localhost:5000/api/appointments";

const DEFAULT_SETTINGS = {
  language: "en",
  smsAlerts: true,
  emailAlerts: true,
  reminderWindow: "10",
  privacyMode: false,
  marketingUpdates: false,
  darkMode: false,
};

function parseJson(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function notifySettingsChanged() {
  window.dispatchEvent(new Event("urgentflow-settings-changed"));
}

function notifyNotificationsChanged() {
  window.dispatchEvent(new Event("urgentflow-notifications-changed"));
}

function toIsoDate(dateValue) {
  if (!dateValue) return "";
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return dateValue;
  }
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return "";
  // Use LOCAL date parts to avoid UTC offset shifting the day
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function normaliseStatus(status, fallback = "upcoming") {
  const value = String(status || fallback).toLowerCase();

  if (["waiting", "confirmed", "upcoming", "coming"].includes(value)) {
    return "upcoming";
  }

  if (["in_progress", "ongoing", "live", "current"].includes(value)) {
    return "ongoing";
  }

  if (["done", "completed", "finished"].includes(value)) {
    return "done";
  }

  if (["cancelled", "canceled", "missed"].includes(value)) {
    return "cancelled";
  }

  return fallback;
}

function compareAppointments(first, second) {
  const firstMoment = new Date(
    `${toIsoDate(first.appointment_date)}T${first.slot_time || first.created_at?.slice(11, 19) || "00:00:00"}`,
  );
  const secondMoment = new Date(
    `${toIsoDate(second.appointment_date)}T${second.slot_time || second.created_at?.slice(11, 19) || "00:00:00"}`,
  );

  return firstMoment - secondMoment;
}

function createNotificationFromAppointment(appointment, message) {
  return {
    id: `notice-${appointment.id}-${Date.now()}`,
    user_id: appointment.user_id,
    appointment_id: appointment.id,
    channel: "in_app",
    kind: "appointment",
    title: "Appointment update",
    body:
      message ||
      `Your appointment at ${appointment.hospital_name || "Healthcare Center"} is scheduled with turn #${appointment.turn_number || "--"}.`,
    delivery_status: "delivered",
    created_at: new Date().toISOString(),
    trigger_at: appointment.appointment_date,
  };
}

export function readAppointments() {
  return parseJson(localStorage.getItem(APPOINTMENTS_STORAGE_KEY), []);
}

function writeAppointments(appointments) {
  writeJson(APPOINTMENTS_STORAGE_KEY, appointments);
}

export function readNotifications() {
  return parseJson(localStorage.getItem(NOTIFICATIONS_STORAGE_KEY), []);
}

function writeNotifications(notifications) {
  writeJson(NOTIFICATIONS_STORAGE_KEY, notifications);
  notifyNotificationsChanged();
}

export function readEmergencyRequests() {
  return parseJson(localStorage.getItem(EMERGENCY_REQUESTS_KEY), []);
}

function writeEmergencyRequests(requests) {
  writeJson(EMERGENCY_REQUESTS_KEY, requests);
}

export function readSettings() {
  return {
    ...DEFAULT_SETTINGS,
    ...parseJson(localStorage.getItem(SETTINGS_STORAGE_KEY), {}),
  };
}

function readNotificationMeta() {
  return parseJson(localStorage.getItem(NOTIFICATION_META_STORAGE_KEY), {});
}

function writeNotificationMeta(meta) {
  writeJson(NOTIFICATION_META_STORAGE_KEY, meta);
  notifyNotificationsChanged();
}

export function saveSettingsLocally(settings) {
  const nextSettings = { ...DEFAULT_SETTINGS, ...settings };
  writeJson(SETTINGS_STORAGE_KEY, nextSettings);
  notifySettingsChanged();
  return nextSettings;
}

function mergeById(items, mapper = (item) => item) {
  const merged = [];

  items.forEach((item) => {
    const mappedItem = mapper(item);
    const index = merged.findIndex(
      (existing) => String(existing.id) === String(mappedItem.id),
    );

    if (index === -1) {
      merged.push(mappedItem);
    } else {
      merged[index] = { ...merged[index], ...mappedItem };
    }
  });

  return merged;
}

function matchesAdminAppointmentScope(appointment, city, serviceScope = "") {
  const normalisedCity = String(city || "").trim().toLowerCase();
  const normalisedService = String(serviceScope || "").trim().toLowerCase();
  const appointmentCity = String(
    appointment.city || appointment.hospital_city || appointment.hospital_name || "",
  )
    .trim()
    .toLowerCase();
  const appointmentService = String(appointment.service || "").toLowerCase();

  const matchesCity =
    !normalisedCity || appointmentCity.includes(normalisedCity);
  const matchesService =
    !normalisedService ||
    normalisedService === "all" ||
    appointmentService.includes(normalisedService);

  return matchesCity && matchesService;
}

export function normaliseAppointment(record) {
  const appointmentDate = toIsoDate(record.appointment_date);
  const status = normaliseStatus(
    record.status,
    appointmentDate && appointmentDate < toIsoDate(new Date()) ? "done" : "upcoming",
  );

  return {
    id: record.id || Date.now(),
    user_id: record.user_id,
    hospital_id: record.hospital_id || "",
    hospital_name: record.hospital_name || "Healthcare Center",
    service: record.service || "General consultation",
    appointment_date: appointmentDate,
    slot_time: record.slot_time || "",
    turn_number: Number(record.turn_number || 0) || 0,
    estimated_time: Number(record.estimated_time || 0) || 0,
    status,
    source_type: record.source_type || "patient",
    scheduled_by: record.scheduled_by || "patient",
    notes: record.notes || "",
    queue_label: record.queue_label || `#${record.turn_number || "--"}`,
    created_at: record.created_at || new Date().toISOString(),
    updated_at: record.updated_at || record.created_at || new Date().toISOString(),
    patient_name: record.patient_name || record.name || "",
    patient_phone: record.patient_phone || record.phone || "",
    patient_email: record.patient_email || record.email || "",
    city: record.city || "",
  };
}

export function cacheAppointments(appointments) {
  const existing = readAppointments();
  const merged = [...existing];

  appointments.map(normaliseAppointment).forEach((appointment) => {
    const index = merged.findIndex((item) => String(item.id) === String(appointment.id));
    if (index === -1) {
      merged.push(appointment);
    } else {
      merged[index] = { ...merged[index], ...appointment };
    }
  });

  writeAppointments(merged);
  return merged;
}

export function createLocalAppointment(appointment) {
  const appointments = readAppointments();
  const sameQueue = appointments.filter(
    (item) =>
      String(item.hospital_id) === String(appointment.hospital_id) &&
      toIsoDate(item.appointment_date) === toIsoDate(appointment.appointment_date) &&
      item.status !== "cancelled",
  );

  const turnNumber = sameQueue.length + 1;
  const estimatedTime = turnNumber * 12;

  const savedAppointment = normaliseAppointment({
    ...appointment,
    id: appointment.id || Date.now(),
    turn_number: appointment.turn_number || turnNumber,
    estimated_time: appointment.estimated_time || estimatedTime,
    created_at: appointment.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: appointment.status || "upcoming",
    source_type: appointment.source_type || "patient",
    scheduled_by: appointment.scheduled_by || "patient",
  });

  appointments.push(savedAppointment);
  writeAppointments(appointments);

  const notifications = readNotifications();
  notifications.unshift(
    createNotificationFromAppointment(
      savedAppointment,
      `Queue #${savedAppointment.turn_number} was saved for ${savedAppointment.hospital_name}. Estimated waiting time: ${savedAppointment.estimated_time} minutes.`,
    ),
  );
  writeNotifications(notifications);

  return savedAppointment;
}

export function getUserAppointments(userId) {
  if (!userId) return [];

  return readAppointments()
    .map(normaliseAppointment)
    .filter((appointment) => String(appointment.user_id) === String(userId))
    .sort(compareAppointments);
}

export function getUpcomingAppointments(userId) {
  const today = toIsoDate(new Date());

  return getUserAppointments(userId).filter((appointment) => {
    if (["done", "cancelled"].includes(appointment.status)) return false;
    return appointment.appointment_date >= today;
  });
}

export function getPastAppointments(userId) {
  return getUserAppointments(userId).filter((appointment) => {
    return ["done", "cancelled"].includes(appointment.status);
  });
}

export function getCurrentAppointment(userId) {
  const appointments = getUpcomingAppointments(userId);
  return (
    appointments.find((appointment) => appointment.status === "ongoing") ||
    appointments[0] ||
    null
  );
}

export function getUserNotifications(userId) {
  if (!userId) return [];

  const stored = readNotifications().filter(
    (notification) => String(notification.user_id) === String(userId),
  );

  if (stored.length > 0) {
    return [...stored].sort(
      (first, second) =>
        new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
    );
  }

  return getUpcomingAppointments(userId).slice(0, 5).map((appointment, index) => ({
    id: `fallback-${appointment.id}-${index}`,
    user_id: userId,
    appointment_id: appointment.id,
    channel: "in_app",
    kind: "appointment",
    title: appointment.status === "ongoing" ? "Your turn is near" : "Upcoming appointment",
    body: `${appointment.hospital_name} • ${appointment.service} • queue #${appointment.turn_number || "--"}`,
    delivery_status: "delivered",
    created_at: appointment.created_at,
    trigger_at: appointment.appointment_date,
  }));
}

export function markNotificationsSeen(userId) {
  if (!userId) return;

  const meta = readNotificationMeta();
  meta[String(userId)] = {
    lastSeenAt: new Date().toISOString(),
  };
  writeNotificationMeta(meta);
}

export function getUnreadNotificationCount(userId) {
  if (!userId) return 0;

  const meta = readNotificationMeta();
  const lastSeenAt = meta[String(userId)]?.lastSeenAt;
  const seenTimestamp = lastSeenAt ? new Date(lastSeenAt).getTime() : 0;

  return getUserNotifications(userId).filter((notification) => {
    const createdAt = new Date(notification.created_at).getTime();
    return Number.isFinite(createdAt) && createdAt > seenTimestamp;
  }).length;
}

export function saveNotificationLocally(notification) {
  const notifications = readNotifications();
  notifications.unshift({
    id: notification.id || `notice-${Date.now()}`,
    channel: "in_app",
    delivery_status: "delivered",
    created_at: new Date().toISOString(),
    ...notification,
  });
  writeNotifications(notifications);
}

export function saveEmergencyRequestLocally(request) {
  const requests = readEmergencyRequests();
  const nextRequest = {
    id: request.id || Date.now(),
    created_at: new Date().toISOString(),
    status: request.status || "new",
    ...request,
  };
  requests.unshift(nextRequest);
  writeEmergencyRequests(requests);
  return nextRequest;
}

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok || data.success === false) {
    const error = new Error(data.message || "Request failed.");
    error.payload = data;
    throw error;
  }

  return data;
}

export async function loadPatientRecords(user) {
  if (!user?.id) {
    return {
      appointments: [],
      history: [],
      notifications: [],
      settings: readSettings(),
    };
  }

  try {
    const data = await requestJson(`${API_BASE_URL}/user/${user.id}/records`);
    const localAppointments = getUserAppointments(user.id);
    const localNotifications = getUserNotifications(user.id);
    const mergedAppointments = mergeById(
      [...localAppointments, ...(data.appointments || []), ...(data.history || [])],
      normaliseAppointment,
    ).sort(compareAppointments);
    const mergedNotifications = mergeById(
      [...localNotifications, ...(data.notifications || [])],
    ).sort(
      (first, second) =>
        new Date(second.created_at).getTime() - new Date(first.created_at).getTime(),
    );
    const mergedSettings = {
      ...readSettings(),
      ...(data.settings || DEFAULT_SETTINGS),
    };

    writeAppointments(mergeById([...readAppointments(), ...mergedAppointments], normaliseAppointment));
    writeNotifications(mergedNotifications);
    saveSettingsLocally(mergedSettings);

    const appointments = mergedAppointments.filter(
      (appointment) =>
        !["done", "cancelled"].includes(appointment.status),
    );
    const history = mergedAppointments.filter(
      (appointment) => ["done", "cancelled"].includes(appointment.status),
    );

    return {
      appointments,
      history,
      notifications: mergedNotifications,
      settings: mergedSettings,
    };
  } catch {
    const appointments = getUpcomingAppointments(user.id);
    const history = getPastAppointments(user.id);
    const notifications = getUserNotifications(user.id);
    const settings = readSettings();
    return { appointments, history, notifications, settings };
  }
}

export async function createPatientFollowUp(appointment) {
  try {
    const data = await requestJson(
      `${API_BASE_URL}/user/${appointment.user_id}/manual`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment),
      },
    );

    cacheAppointments([data.appointment]);
    if (data.notification) {
      saveNotificationLocally(data.notification);
    }
    return data;
  } catch {
    const localAppointment = createLocalAppointment({
      ...appointment,
      source_type: "manual-follow-up",
      scheduled_by: "patient",
      status: "upcoming",
      notes: appointment.notes || "Added manually by the patient.",
    });

    const notification = {
      user_id: appointment.user_id,
      appointment_id: localAppointment.id,
      title: "Next appointment added",
      body: `We saved your self-added appointment for ${localAppointment.hospital_name}.`,
      kind: "follow-up",
    };
    saveNotificationLocally(notification);

    return { success: true, appointment: localAppointment, notification };
  }
}

export async function loadUserSettings(userId) {
  if (!userId) return readSettings();

  try {
    const data = await requestJson(`${API_BASE_URL}/user/${userId}/settings`);
    return saveSettingsLocally(data.settings || DEFAULT_SETTINGS);
  } catch {
    return readSettings();
  }
}

export async function updateUserSettings(userId, settings) {
  const optimistic = saveSettingsLocally(settings);
  if (!userId) return optimistic;

  try {
    const data = await requestJson(`${API_BASE_URL}/user/${userId}/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    return saveSettingsLocally(data.settings || optimistic);
  } catch {
    return optimistic;
  }
}

export async function loadAdminDashboard(city, serviceScope = "") {
  try {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (serviceScope && serviceScope !== "all") {
      params.set("service", serviceScope);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await requestJson(`${API_BASE_URL}/admin/dashboard${query}`);
    const localQueue = readAppointments()
      .map(normaliseAppointment)
      .filter(
        (appointment) =>
          ["upcoming", "ongoing"].includes(appointment.status) &&
          matchesAdminAppointmentScope(appointment, city, serviceScope),
      );
    const localEmergencyRequests = readEmergencyRequests();

    return {
      ...data,
      queue: mergeById([...(data.queue || []), ...localQueue], normaliseAppointment).sort(
        compareAppointments,
      ),
      emergencyRequests:
        String(serviceScope).toLowerCase() === "emergency" || !serviceScope
          ? mergeById([
              ...(data.emergencyRequests || []),
              ...localEmergencyRequests,
            ])
          : data.emergencyRequests || [],
      todayStats: {
        totalPatients: mergeById([...(data.queue || []), ...localQueue], normaliseAppointment).length,
        ongoingCount: mergeById([...(data.queue || []), ...localQueue], normaliseAppointment)
          .filter((item) => item.status === "ongoing").length,
        emergencyCount:
          String(serviceScope).toLowerCase() === "emergency" || !serviceScope
            ? mergeById([
                ...(data.emergencyRequests || []),
                ...localEmergencyRequests,
              ]).length
            : data.todayStats?.emergencyCount || 0,
      },
    };
  } catch {
    const appointments = readAppointments().map(normaliseAppointment);
    const emergencyRequests = readEmergencyRequests();
    const queue = appointments.filter(
      (appointment) =>
        ["upcoming", "ongoing"].includes(appointment.status) &&
        matchesAdminAppointmentScope(appointment, city, serviceScope),
    );
    return {
      success: true,
      queue,
      emergencyRequests:
        String(serviceScope).toLowerCase() === "emergency" || !serviceScope
          ? emergencyRequests
          : [],
      hospitals: [],
      todayStats: {
        totalPatients: queue.length,
        ongoingCount: queue.filter((item) => item.status === "ongoing").length,
        emergencyCount: emergencyRequests.length,
      },
    };
  }
}

export async function loadAdminArchives(city, serviceScope = "") {
  try {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (serviceScope && serviceScope !== "all") {
      params.set("service", serviceScope);
    }
    const query = params.toString() ? `?${params.toString()}` : "";
    const data = await requestJson(`${API_BASE_URL}/admin/archives${query}`);
    const localArchive = readAppointments()
      .map(normaliseAppointment)
      .filter(
        (appointment) =>
          ["done", "cancelled"].includes(appointment.status) &&
          matchesAdminAppointmentScope(appointment, city, serviceScope),
      );
    const mergedArchive = mergeById(
      [...(data.archive || []), ...localArchive],
      normaliseAppointment,
    ).sort(compareAppointments);

    return {
      ...data,
      archive: mergedArchive,
      stats: {
        totalArchived: mergedArchive.length,
        doneCount: mergedArchive.filter((item) => item.status === "done").length,
        cancelledCount: mergedArchive.filter((item) => item.status === "cancelled")
          .length,
      },
    };
  } catch {
    const archive = readAppointments()
      .map(normaliseAppointment)
      .filter(
        (appointment) =>
          ["done", "cancelled"].includes(appointment.status) &&
          matchesAdminAppointmentScope(appointment, city, serviceScope),
      )
      .sort(compareAppointments);

    return {
      success: true,
      archive,
      stats: {
        totalArchived: archive.length,
        doneCount: archive.filter((item) => item.status === "done").length,
        cancelledCount: archive.filter((item) => item.status === "cancelled").length,
      },
    };
  }
}

export async function updateAdminAppointment(appointmentId, payload) {
  try {
    const data = await requestJson(
      `${API_BASE_URL}/admin/appointments/${appointmentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (data.appointment) {
      cacheAppointments([data.appointment]);
    }
    if (data.notification) {
      saveNotificationLocally(data.notification);
    }
    return data;
  } catch {
    const appointments = readAppointments();
    const index = appointments.findIndex(
      (item) => String(item.id) === String(appointmentId),
    );

    if (index >= 0) {
      appointments[index] = normaliseAppointment({
        ...appointments[index],
        ...payload,
        updated_at: new Date().toISOString(),
      });
      writeAppointments(appointments);
      return { success: true, appointment: appointments[index] };
    }

    throw new Error("Appointment not found.");
  }
}

export async function createAdminFollowUp(appointmentId, payload) {
  try {
    const data = await requestJson(
      `${API_BASE_URL}/admin/appointments/${appointmentId}/follow-up`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (data.appointment) {
      cacheAppointments([data.appointment]);
    }
    if (data.notification) {
      saveNotificationLocally(data.notification);
    }
    return data;
  } catch {
    const localAppointment = createLocalAppointment({
      ...payload,
      id: `followup-${Date.now()}`,
      source_type: "admin-follow-up",
      scheduled_by: "admin",
      status: "upcoming",
      notes: payload.notes || "Scheduled by admin.",
    });
    const notification = {
      user_id: payload.user_id,
      appointment_id: localAppointment.id,
      title: "Next appointment scheduled",
      body: `The medical staff scheduled your next appointment at ${localAppointment.hospital_name}.`,
      kind: "follow-up",
    };
    saveNotificationLocally(notification);
    return { success: true, appointment: localAppointment, notification };
  }
}

export async function triggerEmergencyRequest(payload) {
  try {
    const data = await requestJson(`${API_BASE_URL}/emergency`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (data.emergencyRequest) {
      saveEmergencyRequestLocally(data.emergencyRequest);
    }
    if (data.notification) {
      saveNotificationLocally(data.notification);
    }
    return data;
  } catch {
    const emergencyRequest = saveEmergencyRequestLocally(payload);
    return { success: true, emergencyRequest };
  }
}

export async function loadSuperAdminFeedback() {
  return requestJson("http://localhost:5000/feedback/admin/insights");
}
