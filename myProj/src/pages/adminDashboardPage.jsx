import { useEffect, useMemo, useState } from "react";
import Nav from "../components/nav/nav.jsx";
import "./dashboardPages.css";
import { getStoredUser } from "../utils/auth.js";
import {
  createAdminFollowUp,
  loadAdminDashboard,
  updateAdminAppointment,
} from "../utils/appointments.js";

function formatDate(dateValue) {
  if (!dateValue) return "--";

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminDashboardPage({ setUser }) {
  const user = getStoredUser();
  const isEmergencyService =
    String(user?.serviceScope || "").toLowerCase() === "emergency";
  const [dashboard, setDashboard] = useState({
    queue: [],
    emergencyRequests: [],
    todayStats: {
      totalPatients: 0,
      ongoingCount: 0,
      emergencyCount: 0,
    },
  });
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [followUpForm, setFollowUpForm] = useState({
    service: "",
    hospital_name: "",
    appointment_date: "",
    notes: "",
  });
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (!message.text) return undefined;

    const timeoutId = window.setTimeout(() => {
      setMessage({ type: "", text: "" });
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const data = await loadAdminDashboard(user?.city, user?.serviceScope);
      if (!active) return;
      setDashboard(data);
      setSelectedAppointmentId((current) => current || data.queue[0]?.id || null);
      if (data.queue[0]) {
        setFollowUpForm((previous) => ({
          ...previous,
          service: previous.service || data.queue[0].service || "",
          hospital_name:
            previous.hospital_name || data.queue[0].hospital_name || "",
        }));
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user?.city, user?.serviceScope]);

  const selectedAppointment = useMemo(
    () =>
      dashboard.queue.find(
        (appointment) => String(appointment.id) === String(selectedAppointmentId),
      ) || null,
    [dashboard.queue, selectedAppointmentId],
  );

  const [resolvedEmergencies, setResolvedEmergencies] = useState(new Set());

  const markEmergencyDone = async (requestId) => {
    setResolvedEmergencies((prev) => new Set([...prev, requestId]));
    try {
      await fetch(`http://localhost:5000/api/appointments/emergency/${requestId}/done`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
    } catch {
      // optimistic — already hidden in UI
    }
  };

  const refreshDashboard = async () => {
    const data = await loadAdminDashboard(user?.city, user?.serviceScope);
    setDashboard(data);
  };

  const [localStatuses, setLocalStatuses] = useState({});

  const handleStatusChange = async (event) => {
    if (!selectedAppointment) return;
    const status = event.target.value;
    // Update locally immediately so the select reflects the change
    setLocalStatuses((prev) => ({ ...prev, [selectedAppointment.id]: status }));
    await updateAdminAppointment(selectedAppointment.id, { status });
    setMessage({ type: "success", text: `Status updated to ${status.replace("_", " ")}.` });
    refreshDashboard();
  };

  const handleFollowUpChange = (key) => (event) => {
    setFollowUpForm((previous) => ({ ...previous, [key]: event.target.value }));
  };

  const handleFollowUpSubmit = async (event) => {
    event.preventDefault();
    if (!selectedAppointment) return;

    await createAdminFollowUp(selectedAppointment.id, {
      user_id: selectedAppointment.user_id,
      hospital_id: selectedAppointment.hospital_id,
      hospital_name: followUpForm.hospital_name,
      service: followUpForm.service,
      appointment_date: followUpForm.appointment_date,
      notes: followUpForm.notes,
      patient_name: selectedAppointment.patient_name,
      patient_phone: selectedAppointment.patient_phone,
      patient_email: selectedAppointment.patient_email,
      city: selectedAppointment.city,
    });

    setMessage({
      type: "success",
      text: "The next appointment was added and the patient was notified in-app.",
    });
    setFollowUpForm((previous) => ({
      ...previous,
      appointment_date: "",
      notes: "",
    }));
    refreshDashboard();
  };

  if (user?.role !== "admin") {
    return (
      <>
        <Nav user={user} setUser={setUser} />
        <main className="portal-page">
          <div className="portal-shell">
            <div className="portal-empty-state">
              This dashboard is reserved for admin accounts. For demo access,
              sign in with an email that contains <strong>admin</strong> and
              your service name, like <strong>emergencyadmin</strong> or{" "}
              <strong>dentistryadmin</strong>.
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav user={user} setUser={setUser} />
      <main className="portal-page">
        <section className="portal-header">
          <div className="portal-header-copy">
            <span className="portal-badge">Admin dashboard</span>
            <h1>
              {user?.serviceScope && user.serviceScope !== "all"
                ? `${user.serviceScope} service dashboard`
                : "Admin dashboard"}
            </h1>
            <p>
              Each patient row shows queue number, full name, phone number,
              booked service, hospital, and current status. Select a patient to
              update status or add the next appointment.
            </p>
          </div>
          <div className="portal-header-stats">
            <div className="portal-stat-card">
              <strong>{dashboard.todayStats?.totalPatients || 0}</strong>
              <span>Patients in queue</span>
            </div>
            <div className="portal-stat-card">
              <strong>{dashboard.todayStats?.ongoingCount || 0}</strong>
              <span>Ongoing appointments</span>
            </div>
            <div className="portal-stat-card">
              <strong>{dashboard.todayStats?.emergencyCount || 0}</strong>
              <span>Emergency requests</span>
            </div>
          </div>
        </section>

        <div className="portal-shell">
          {message.text && (
            <div className={`portal-inline-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <section
            className={`portal-grid ${
              isEmergencyService
                ? "portal-grid-dual-admin"
                : "portal-grid-single-admin"
            }`}
          >
            <article className="portal-card portal-card-large">
              <div className="portal-section-head">
                <div>
                  <h2>Patient queue</h2>
                  <p>
                    {user?.serviceScope && user.serviceScope !== "all"
                      ? `Showing only ${user.serviceScope.toLowerCase()} appointments.`
                      : "Select a patient to manage the current or next appointment."}
                  </p>
                </div>
                <span className="portal-pill">{dashboard.queue.length} patients</span>
              </div>

              <div className="appointment-list">
                {dashboard.queue.map((appointment) => (
                  <button
                    type="button"
                    key={appointment.id}
                    className={`appointment-row appointment-row-button${
                      String(selectedAppointmentId) === String(appointment.id)
                        ? " active"
                        : ""
                    }`}
                    onClick={() => {
                      setSelectedAppointmentId(appointment.id);
                      setFollowUpForm({
                        service: appointment.service || "",
                        hospital_name: appointment.hospital_name || "",
                        appointment_date: "",
                        notes: "",
                      });
                    }}
                  >
                    <div className="appointment-row-main">
                      <div className="appointment-row-title">
                        <h3>{appointment.patient_name || "Patient"}</h3>
                        <span className={`portal-status ${appointment.status}`}>
                          {appointment.status}
                        </span>
                      </div>
                      <p>
                        Queue #{appointment.turn_number || "--"} • {appointment.service}
                      </p>
                      <div className="appointment-row-meta">
                        <span>{appointment.patient_phone || "No phone"}</span>
                        <span>{appointment.hospital_name}</span>
                        <span>{formatDate(appointment.appointment_date)}</span>
                      </div>
                    </div>
                  </button>
                ))}
                {dashboard.queue.length === 0 && (
                  <div className="portal-empty-state">No patients in queue right now.</div>
                )}
              </div>
            </article>

            {isEmergencyService && (
              <article className="portal-card portal-card-large">
                <div className="portal-section-head">
                  <div>
                    <h2>Emergency requests</h2>
                    <p>Only emergency staff see this second dashboard.</p>
                  </div>
                  <span className="portal-pill">
                    {dashboard.emergencyRequests?.length || 0} requests
                  </span>
                </div>

                <div className="appointment-list">
                  {dashboard.emergencyRequests?.filter(r => !resolvedEmergencies.has(r.id)).length > 0 ? (
                    dashboard.emergencyRequests
                      .filter(r => !resolvedEmergencies.has(r.id))
                      .map((request) => (
                      <article
                        className="appointment-row appointment-row-danger"
                        key={request.id}
                      >
                        <div className="appointment-row-main">
                          <div className="appointment-row-title">
                            <h3>{request.patient_name || "Unknown patient"}</h3>
                            <span className="portal-status ongoing">Emergency</span>
                          </div>
                          <p style={{ fontWeight: 600, color: "#dc2626" }}>
                            📞 {request.patient_phone || "No phone number"}
                          </p>
                          {request.patient_email && (
                            <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                              ✉️ {request.patient_email}
                            </p>
                          )}
                          {request.notes && <p style={{ fontSize: "0.85rem" }}>{request.notes}</p>}
                          <div className="appointment-row-meta">
                            <span>
                              {request.created_at
                                ? new Date(request.created_at).toLocaleString("en-GB")
                                : "Now"}
                            </span>
                          </div>
                          <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                            {request.lat && request.lng ? (
                              <>
                                <a
                                  href={`https://www.google.com/maps?q=${request.lat},${request.lng}`}
                                  target="_blank" rel="noreferrer"
                                  style={{ padding: "5px 12px", borderRadius: 8, background: "#ef4444", color: "#fff", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}
                                >
                                  📍 Exact location
                                </a>
                                <a
                                  href={`https://www.google.com/maps/dir/?api=1&destination=${request.lat},${request.lng}`}
                                  target="_blank" rel="noreferrer"
                                  style={{ padding: "5px 12px", borderRadius: 8, background: "#3b82f6", color: "#fff", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}
                                >
                                  🧭 Get directions
                                </a>
                              </>
                            ) : request.city ? (
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.city + " Tunisia")}`}
                                target="_blank" rel="noreferrer"
                                style={{ padding: "5px 12px", borderRadius: 8, background: "#f59e0b", color: "#fff", fontSize: "0.8rem", fontWeight: 600, textDecoration: "none" }}
                              >
                                🗺️ {request.city}
                              </a>
                            ) : null}
                            <button
                              onClick={() => markEmergencyDone(request.id)}
                              style={{ padding: "5px 14px", borderRadius: 8, background: "#22c55e", color: "#fff", fontSize: "0.8rem", fontWeight: 600, border: "none", cursor: "pointer" }}
                            >
                              ✓ Mark as done
                            </button>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="portal-empty-state">No active emergency requests.</div>
                  )}
                </div>
              </article>
            )}
          </section>

          {selectedAppointment && (
            <section className="portal-grid portal-grid-main">
              <article className="portal-card portal-card-large">
                <div className="portal-section-head">
                  <div>
                    <h2>Selected patient</h2>
                    <p>Update the current case and schedule the next visit.</p>
                  </div>
                </div>

                <article className="appointment-feature-card">
                  <div className="appointment-feature-main">
                    <h3>{selectedAppointment.patient_name || "Patient"}</h3>
                    <p>
                      {selectedAppointment.service} • {selectedAppointment.hospital_name}
                    </p>
                    <div className="appointment-feature-meta">
                      <span>Queue #{selectedAppointment.turn_number || "--"}</span>
                      <span>{selectedAppointment.patient_phone || "No phone"}</span>
                      <span>{formatDate(selectedAppointment.appointment_date)}</span>
                    </div>
                  </div>
                  <div className="appointment-feature-rail">
                    <div>
                      <small>Current status</small>
                      <select
                        className="portal-select"
                        value={localStatuses[selectedAppointment.id] ?? selectedAppointment.status}
                        onChange={handleStatusChange}
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="done">Done</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                </article>
              </article>

              <article className="portal-card portal-card-side">
                <div className="portal-section-head">
                  <div>
                    <h2>Add next appointment</h2>
                    <p>The patient page and notification feed will update too.</p>
                  </div>
                </div>
                <form className="portal-form" onSubmit={handleFollowUpSubmit}>
                  <label>
                    Service
                    <input
                      type="text"
                      value={followUpForm.service}
                      onChange={handleFollowUpChange("service")}
                      required
                    />
                  </label>
                  <label>
                    Hospital
                    <input
                      type="text"
                      value={followUpForm.hospital_name}
                      onChange={handleFollowUpChange("hospital_name")}
                      required
                    />
                  </label>
                  <label>
                    Date
                    <input
                      type="date"
                      value={followUpForm.appointment_date}
                      onChange={handleFollowUpChange("appointment_date")}
                      required
                    />
                  </label>
                  <label>
                    Notes
                    <textarea
                      value={followUpForm.notes}
                      onChange={handleFollowUpChange("notes")}
                      placeholder="Add anything the patient should know."
                    />
                  </label>
                  <button type="submit" className="portal-primary-button">
                    Save follow-up
                  </button>
                </form>
              </article>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
