import { useEffect, useMemo, useState } from "react";
import Nav from "../components/nav/nav.jsx";
import "./dashboardPages.css";
import { getStoredUser } from "../utils/auth.js";
import { createPatientFollowUp, loadPatientRecords, readSettings } from "../utils/appointments.js";

const COPY = {
  en: {
    badge:"Appointments", title:"Your current care line and every next visit in one place.",
    subtitle:"See the appointment you are actively preparing for, the future ones added by medical staff, and add your own follow-up when needed.",
    current:"Current appointment", currentSub:"The appointment that matters most right now.",
    next:"Next appointments", nextSub:"Admin-added visits and self-added follow-ups.",
    selfAdd:"Add your next appointment yourself", selfAddSub:"Use this only when staff could not add it for you.",
    emptyCurrent:"No current appointment yet.", emptyUpcoming:"No future appointments yet.",
    save:"Save next appointment", success:"Your next appointment was added successfully.",
    activeVisits:"Active visits", queueTurn:"Queue turn", estimatedWait:"Estimated wait",
    scheduledBy:"Scheduled by", statusLabel:"Status", hospitalName:"Hospital name",
    service:"Service", servicePh:"Cardiology, surgery, pediatrics...",
    date:"Date", notes:"Notes", notesPh:"Any note that can help staff confirm it later.",
    addedBy:"Added by", turnLabel:"Turn #", minWait:"min estimated wait",
    loading:"Loading appointments...",
    sUpcoming:"Upcoming", sOngoing:"Ongoing", sDone:"Done", sCancelled:"Cancelled",
  },
  fr: {
    badge:"Rendez-vous", title:"Votre rendez-vous actuel et les prochains dans un seul espace.",
    subtitle:"Consultez le rendez-vous en cours, les suivants ajoutes par le personnel medical, et ajoutez vous-meme un suivi si besoin.",
    current:"Rendez-vous actuel", currentSub:"Le rendez-vous le plus important en ce moment.",
    next:"Prochains rendez-vous", nextSub:"Visites admin et suivis personnels.",
    selfAdd:"Ajouter vous-meme le prochain rendez-vous", selfAddSub:"Utilisez ceci uniquement si le personnel n'a pas pu l'ajouter.",
    emptyCurrent:"Aucun rendez-vous actuel.", emptyUpcoming:"Aucun prochain rendez-vous.",
    save:"Enregistrer le rendez-vous", success:"Votre prochain rendez-vous a ete ajoute.",
    activeVisits:"Visites actives", queueTurn:"Numero de tour", estimatedWait:"Attente estimee",
    scheduledBy:"Planifie par", statusLabel:"Statut", hospitalName:"Nom de l'hopital",
    service:"Service", servicePh:"Cardiologie, chirurgie, pediatrie...",
    date:"Date", notes:"Notes", notesPh:"Une note pour aider le personnel a confirmer.",
    addedBy:"Ajoute par", turnLabel:"Tour n°", minWait:"min d'attente estimee",
    loading:"Chargement des rendez-vous...",
    sUpcoming:"A venir", sOngoing:"En cours", sDone:"Termine", sCancelled:"Annule",
  },
  ar: {
    badge:"المواعيد", title:"موعدك الحالي والمواعيد القادمة في مكان واحد.",
    subtitle:"شاهد الموعد الحالي والمواعيد القادمة التي يضيفها الطاقم الطبي، ويمكنك اضافة موعدك القادم بنفسك.",
    current:"الموعد الحالي", currentSub:"الموعد الاهم في الوقت الحالي.",
    next:"المواعيد القادمة", nextSub:"الزيارات المضافة من الادارة والمتابعات الشخصية.",
    selfAdd:"اضف موعدك القادم بنفسك", selfAddSub:"استخدم هذا فقط اذا لم يتمكن الموظفون من اضافته.",
    emptyCurrent:"لا يوجد موعد حالي.", emptyUpcoming:"لا توجد مواعيد قادمة.",
    save:"حفظ الموعد", success:"تمت اضافة موعدك القادم.",
    activeVisits:"الزيارات النشطة", queueTurn:"رقم الدور", estimatedWait:"وقت الانتظار",
    scheduledBy:"مجدول بواسطة", statusLabel:"الحالة", hospitalName:"اسم المستشفى",
    service:"الخدمة", servicePh:"قلب، جراحة، اطفال...",
    date:"التاريخ", notes:"ملاحظات", notesPh:"ملاحظة تساعد الموظفين على التأكيد.",
    addedBy:"اضيف بواسطة", turnLabel:"دور #", minWait:"دقيقة انتظار تقريبا",
    loading:"جاري تحميل المواعيد...",
    sUpcoming:"قادم", sOngoing:"جاري", sDone:"منتهي", sCancelled:"ملغى",
  },
};

function formatDate(v) {
  if (!v) return "--";
  return new Date(`${v}T00:00:00`).toLocaleDateString("en-GB", { weekday:"short", day:"2-digit", month:"short", year:"numeric" });
}

export default function AppointmentsPage({ setUser }) {
  const user = getStoredUser();
  const [records, setRecords] = useState({ appointments:[], history:[], notifications:[], settings:{ language:"en" } });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ type:"", text:"" });
  const [formData, setFormData] = useState({ hospital_name:"", service:"", appointment_date:"", notes:"" });
  const [language, setLanguage] = useState(() => readSettings().language || "en");

  useEffect(() => {
    const sync = () => setLanguage(readSettings().language || "en");
    window.addEventListener("urgentflow-settings-changed", sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener("urgentflow-settings-changed", sync); window.removeEventListener("storage", sync); };
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      const data = await loadPatientRecords(user);
      if (!active) return;
      setRecords(data);
      setLoading(false);
      setFormData((p) => ({ ...p, hospital_name: p.hospital_name || data.appointments[0]?.hospital_name || "" }));
    }
    load();
    return () => { active = false; };
  }, [user]);

  useEffect(() => { if (records.settings?.language) setLanguage(records.settings.language); }, [records.settings?.language]);

  const copy = COPY[language] || COPY.en;
  const sl = (s) => ({ ongoing:copy.sOngoing, done:copy.sDone, cancelled:copy.sCancelled })[s] || copy.sUpcoming;

  const currentAppointment = useMemo(
    () => records.appointments.find((a) => a.status === "ongoing") || records.appointments[0] || null,
    [records.appointments],
  );
  const nextAppointments = useMemo(
    () => records.appointments.filter((a) => a.id !== currentAppointment?.id),
    [currentAppointment?.id, records.appointments],
  );

  const handleField = (key) => (e) => setFormData((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type:"", text:"" });
    const res = await createPatientFollowUp({
      user_id: user?.id, hospital_name: formData.hospital_name,
      hospital_id: currentAppointment?.hospital_id || formData.hospital_name,
      service: formData.service, appointment_date: formData.appointment_date,
      notes: formData.notes, patient_name: user?.fullName,
      patient_phone: user?.phone, patient_email: user?.email, city: user?.city,
    });
    const refreshed = await loadPatientRecords(user);
    setRecords(refreshed);
    setMessage({ type:"success", text: res.notification?.body || copy.success });
    setFormData((p) => ({ ...p, service:"", appointment_date:"", notes:"" }));
  };

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
            <div className="portal-stat-card"><strong>{records.appointments.length}</strong><span>{copy.activeVisits}</span></div>
            <div className="portal-stat-card"><strong>{currentAppointment?.turn_number || "--"}</strong><span>{copy.queueTurn}</span></div>
            <div className="portal-stat-card"><strong>{currentAppointment?.estimated_time || 0} min</strong><span>{copy.estimatedWait}</span></div>
          </div>
        </section>

        <div className="portal-shell">
          {message.text && <div className={`portal-inline-message ${message.type}`}>{message.text}</div>}

          <section className="portal-grid portal-grid-main">
            <article className="portal-card portal-card-large">
              <div className="portal-section-head">
                <div><h2>{copy.current}</h2><p>{copy.currentSub}</p></div>
                {currentAppointment && <span className={`portal-status ${currentAppointment.status}`}>{sl(currentAppointment.status)}</span>}
              </div>
              {loading ? (
                <div className="portal-empty-state">{copy.loading}</div>
              ) : currentAppointment ? (
                <article className="appointment-feature-card">
                  <div className="appointment-feature-main">
                    <h3>{currentAppointment.service}</h3>
                    <p>{currentAppointment.hospital_name}</p>
                    <div className="appointment-feature-meta">
                      <span>{formatDate(currentAppointment.appointment_date)}</span>
                      <span>{copy.turnLabel}{currentAppointment.turn_number || "--"}</span>
                      <span>{currentAppointment.estimated_time || 0} {copy.minWait}</span>
                    </div>
                  </div>
                  <div className="appointment-feature-rail">
                    <div><small>{copy.scheduledBy}</small><strong>{currentAppointment.scheduled_by || "Admin"}</strong></div>
                    <div><small>{copy.statusLabel}</small><strong>{sl(currentAppointment.status)}</strong></div>
                  </div>
                </article>
              ) : (
                <div className="portal-empty-state">{copy.emptyCurrent}</div>
              )}
            </article>

            <article className="portal-card portal-card-side">
              <div className="portal-section-head">
                <div><h2>{copy.selfAdd}</h2><p>{copy.selfAddSub}</p></div>
              </div>
              <form className="portal-form" onSubmit={handleSubmit}>
                <label>{copy.hospitalName}<input type="text" value={formData.hospital_name} onChange={handleField("hospital_name")} required /></label>
                <label>{copy.service}<input type="text" value={formData.service} onChange={handleField("service")} placeholder={copy.servicePh} required /></label>
                <label>{copy.date}<input type="date" value={formData.appointment_date} onChange={handleField("appointment_date")} required /></label>
                <label>{copy.notes}<textarea value={formData.notes} onChange={handleField("notes")} placeholder={copy.notesPh} /></label>
                <button className="portal-primary-button" type="submit">{copy.save}</button>
              </form>
            </article>
          </section>

          <section className="portal-grid portal-grid-single-admin">
            <article className="portal-card portal-card-large">
              <div className="portal-section-head">
                <div><h2>{copy.next}</h2><p>{copy.nextSub}</p></div>
                <span className="portal-pill">{nextAppointments.length}</span>
              </div>
              {nextAppointments.length > 0 ? (
                <div className="appointment-list">
                  {nextAppointments.map((a) => (
                    <article className="appointment-row" key={a.id}>
                      <div className="appointment-row-main">
                        <div className="appointment-row-title">
                          <h3>{a.service}</h3>
                          <span className={`portal-status ${a.status}`}>{sl(a.status)}</span>
                        </div>
                        <p>{a.hospital_name}</p>
                        <div className="appointment-row-meta">
                          <span>{formatDate(a.appointment_date)}</span>
                          <span>{copy.turnLabel}{a.turn_number || "--"}</span>
                          <span>{a.estimated_time || 0} {copy.minWait}</span>
                        </div>
                      </div>
                      <div className="appointment-row-side">
                        <small>{copy.addedBy}</small>
                        <strong>{a.scheduled_by || "Admin"}</strong>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="portal-empty-state">{copy.emptyUpcoming}</div>
              )}
            </article>
          </section>
        </div>
      </main>
    </>
  );
}
