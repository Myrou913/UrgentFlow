import { useEffect, useState } from "react";
import Nav from "../components/nav/nav.jsx";
import "./dashboardPages.css";
import { getStoredUser } from "../utils/auth.js";
import { loadPatientRecords } from "../utils/appointments.js";

const COPY = {
  en: {
    badge: "History",
    title: "A clear archive of the appointments that already ended.",
    subtitle:
      "Completed and cancelled visits stay structured like your active appointments, so your medical journey remains easy to review later.",
    empty: "No completed or cancelled appointments yet.",
  },
  fr: {
    badge: "Historique",
    title: "Un archive clair des rendez-vous deja termines.",
    subtitle:
      "Les rendez-vous termines ou annules gardent la meme structure que vos rendez-vous actifs pour rester faciles a relire.",
    empty: "Aucun rendez-vous termine ou annule pour le moment.",
  },
  ar: {
    badge: "السجل",
    title: "ارشيف واضح للمواعيد المنتهية او الملغاة.",
    subtitle:
      "المواعيد المنجزة او الملغاة تبقى بنفس الهيكلة حتى يبقى مسارك الطبي واضحا.",
    empty: "لا توجد مواعيد منتهية او ملغاة حاليا.",
  },
};

function formatDate(dateValue) {
  if (!dateValue) return "--";

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function HistoryPage({ setUser }) {
  const user = getStoredUser();
  const [records, setRecords] = useState({
    history: [],
    settings: { language: "en" },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const data = await loadPatientRecords(user);
      if (!active) return;
      setRecords(data);
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user]);

  const copy = COPY[records.settings?.language] || COPY.en;
  const doneCount = records.history.filter((item) => item.status === "done").length;
  const cancelledCount = records.history.filter(
    (item) => item.status === "cancelled",
  ).length;

  return (
    <>
      <Nav user={user} setUser={setUser} />
      <main className="portal-page">
        <section className="portal-header">
          <div className="portal-header-copy">
            <span className="portal-badge">{copy.badge}</span>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>
          <div className="portal-header-stats">
            <div className="portal-stat-card">
              <strong>{records.history.length}</strong>
              <span>Total archived visits</span>
            </div>
            <div className="portal-stat-card">
              <strong>{doneCount}</strong>
              <span>Done appointments</span>
            </div>
            <div className="portal-stat-card">
              <strong>{cancelledCount}</strong>
              <span>Cancelled appointments</span>
            </div>
          </div>
        </section>

        <div className="portal-shell">
          <section className="portal-grid portal-grid-single-admin">
            <article className="portal-card portal-card-large">
              <div className="portal-section-head">
                <div>
                  <h2>Appointments archive</h2>
                  <p>Same structure as your active timeline, but finished.</p>
                </div>
                <span className="portal-pill">{records.history.length} records</span>
              </div>

              {loading ? (
                <div className="portal-empty-state">Loading history...</div>
              ) : records.history.length > 0 ? (
                <div className="appointment-list">
                  {records.history.map((appointment) => (
                    <article className="appointment-row" key={appointment.id}>
                      <div className="appointment-row-main">
                        <div className="appointment-row-title">
                          <h3>{appointment.service}</h3>
                          <span className={`portal-status ${appointment.status}`}>
                            {appointment.status === "done" ? "Done" : "Cancelled"}
                          </span>
                        </div>
                        <p>{appointment.hospital_name}</p>
                        <div className="appointment-row-meta">
                          <span>{formatDate(appointment.appointment_date)}</span>
                          <span>Turn #{appointment.turn_number || "--"}</span>
                          <span>{appointment.estimated_time || 0} min estimated wait</span>
                        </div>
                      </div>
                      <div className="appointment-row-side">
                        <small>Recorded by</small>
                        <strong>{appointment.scheduled_by || "System"}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="portal-empty-state">{copy.empty}</div>
              )}
            </article>
          </section>
        </div>
      </main>
    </>
  );
}
