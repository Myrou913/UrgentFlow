import { useEffect, useState } from "react";
import Nav from "../components/nav/nav.jsx";
import "./dashboardPages.css";
import { getStoredUser } from "../utils/auth.js";
import {
  loadPatientRecords,
  markNotificationsSeen,
} from "../utils/appointments.js";

function formatDateTime(value) {
  if (!value) return "--";

  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function NotificationsPage({ setUser }) {
  const user = getStoredUser();
  const [records, setRecords] = useState({
    appointments: [],
    notifications: [],
    settings: { reminderWindow: "10" },
  });

  useEffect(() => {
    if (user?.id) {
      markNotificationsSeen(user.id);
    }
  }, [user?.id]);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const data = await loadPatientRecords(user);
      if (!active) return;
      setRecords(data);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user]);

  // Deduplicate: keep only the latest notification per appointment
  const seenAppointments = new Set();
  const deduped = [...records.notifications].filter((n) => {
    if (!n.appointment_id) return true;
    // Only keep in_app kind, skip sms/email/reminder duplicates from the feed
    if (n.kind === "sms" || n.kind === "email") return false;
    const key = `${n.appointment_id}-${n.kind}`;
    if (seenAppointments.has(key)) return false;
    seenAppointments.add(key);
    return true;
  });

  // One reminder per upcoming appointment based on user's reminder window
  const reminderMessages = records.appointments
    .filter((a) => !["done", "cancelled"].includes(a.status))
    .slice(0, 3)
    .map((appointment) => ({
      id: `reminder-${appointment.id}`,
      title: appointment.status === "ongoing"
        ? "Your turn is now"
        : `Reminder: ${records.settings?.reminderWindow || 10} min before your turn`,
      body: `${appointment.hospital_name} — ${appointment.service}. Queue #${appointment.turn_number || "--"}, ~${appointment.estimated_time || 0} min wait.`,
      created_at: appointment.created_at || new Date().toISOString(),
      kind: "reminder",
      delivery_status: "delivered",
    }));

  const feed = [...reminderMessages, ...deduped].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <>
      <Nav user={user} setUser={setUser} />
      <main className="portal-page">
        <section className="portal-header">
          <div className="portal-header-copy">
            <span className="portal-badge">Notifications</span>
            <h1>A quiet message feed for reminders, queue updates, and care news.</h1>
            <p>
              This page is shaped like a simple message inbox so it feels more
              natural when your doctor time is soon, when your queue moves, or
              when medical staff schedule your next visit.
            </p>
          </div>
          <div className="portal-header-stats">
            <div className="portal-stat-card">
              <strong>{feed.length}</strong>
              <span>Total messages</span>
            </div>
            <div className="portal-stat-card">
              <strong>{records.settings?.reminderWindow || 10} min</strong>
              <span>Reminder window</span>
            </div>
            <div className="portal-stat-card">
              <strong>{records.appointments.length}</strong>
              <span>Tracked appointments</span>
            </div>
          </div>
        </section>

        <div className="portal-shell">
          <section className="portal-grid portal-grid-single-admin">
            <article className="portal-card portal-card-large">
              <div className="portal-section-head">
                <div>
                  <h2>Message feed</h2>
                  <p>Reminders, queue updates, and appointment news.</p>
                </div>
                <span className="portal-pill">{feed.length} items</span>
              </div>

              {feed.length > 0 ? (
                <div className="message-thread notif-scroll">
                  {feed.map((notification, index) => (
                    <article
                      className={`message-bubble ${index % 2 === 0 ? "incoming" : "system"}`}
                      key={notification.id}
                    >
                      <div className="message-bubble-head">
                        <strong>{notification.title}</strong>
                        <span>{formatDateTime(notification.created_at)}</span>
                      </div>
                      <p>{notification.body}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="portal-empty-state">
                  No notifications yet. Messages will appear when your queue or appointments change.
                </div>
              )}
            </article>
          </section>
        </div>
      </main>
    </>
  );
}
