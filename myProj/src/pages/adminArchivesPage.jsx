import { useEffect, useState } from "react";
import Nav from "../components/nav/nav.jsx";
import "./dashboardPages.css";
import { getStoredUser } from "../utils/auth.js";
import { loadAdminArchives } from "../utils/appointments.js";

function formatDate(dateValue) {
  if (!dateValue) return "--";

  return new Date(`${dateValue}T00:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function AdminArchivesPage({ setUser }) {
  const user = getStoredUser();
  const [archiveData, setArchiveData] = useState({
    archive: [],
    stats: {
      totalArchived: 0,
      doneCount: 0,
      cancelledCount: 0,
    },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadData() {
      const data = await loadAdminArchives(user?.city, user?.serviceScope);
      if (!active) return;
      setArchiveData(data);
      setLoading(false);
    }

    loadData();

    return () => {
      active = false;
    };
  }, [user?.city, user?.serviceScope]);

  if (user?.role !== "admin") {
    return (
      <>
        <Nav user={user} setUser={setUser} />
        <main className="portal-page">
          <div className="portal-shell">
            <div className="portal-empty-state">
              This archive page is reserved for admin accounts. For demo access,
              sign in with an email that contains <strong>admin</strong> and your
              service name, like <strong>emergencyadmin</strong> or{" "}
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
            <span className="portal-badge">Admin archives</span>
            <h1>
              {user?.serviceScope && user.serviceScope !== "all"
                ? `${user.serviceScope} appointment archive`
                : "Archived appointments"}
            </h1>
            <p>
              Completed and cancelled appointments stay visible here so staff can
              review past cases without losing the record from the dashboard flow.
            </p>
          </div>
          <div className="portal-header-stats">
            <div className="portal-stat-card">
              <strong>{archiveData.stats?.totalArchived || 0}</strong>
              <span>Total archived appointments</span>
            </div>
            <div className="portal-stat-card">
              <strong>{archiveData.stats?.doneCount || 0}</strong>
              <span>Done appointments</span>
            </div>
            <div className="portal-stat-card">
              <strong>{archiveData.stats?.cancelledCount || 0}</strong>
              <span>Cancelled appointments</span>
            </div>
          </div>
        </section>

        <div className="portal-shell">
          <section className="portal-grid portal-grid-single-admin">
            <article className="portal-card portal-card-large">
              <div className="portal-section-head">
                <div>
                  <h2>Archive dashboard</h2>
                  <p>Review closed appointments with patient details, service, hospital, date, and final status.</p>
                </div>
                <span className="portal-pill">{archiveData.archive.length} records</span>
              </div>

              {loading ? (
                <div className="portal-empty-state">Loading archives...</div>
              ) : archiveData.archive.length > 0 ? (
                <div className="appointment-list">
                  {archiveData.archive.map((appointment) => (
                    <article className="appointment-row" key={appointment.id}>
                      <div className="appointment-row-main">
                        <div className="appointment-row-title">
                          <h3>{appointment.patient_name || "Patient"}</h3>
                          <span className={`portal-status ${appointment.status}`}>
                            {appointment.status === "done" ? "Done" : "Cancelled"}
                          </span>
                        </div>
                        <p>Queue #{appointment.turn_number || "--"} • {appointment.service}</p>
                        <div className="appointment-row-meta">
                          <span>{appointment.patient_phone || "No phone"}</span>
                          <span>{appointment.hospital_name}</span>
                          <span>{formatDate(appointment.appointment_date)}</span>
                        </div>
                      </div>
                      <div className="appointment-row-side">
                        <small>Recorded by</small>
                        <strong>{appointment.scheduled_by || "Admin"}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="portal-empty-state">
                  No done or cancelled appointments have been archived yet.
                </div>
              )}
            </article>
          </section>
        </div>
      </main>
    </>
  );
}
