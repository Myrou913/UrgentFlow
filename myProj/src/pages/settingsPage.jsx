import { useEffect, useState } from "react";
import Nav from "../components/nav/nav.jsx";
import "./dashboardPages.css";
import { getStoredUser } from "../utils/auth.js";
import { loadUserSettings, updateUserSettings } from "../utils/appointments.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "fr", label: "Francais" },
  { value: "ar", label: "العربية" },
];

const COPY = {
  en: {
    badge: "Settings",
    title: "Choose how UrgentFlow talks to you and fits your routine.",
    subtitle:
      "Language, reminders, privacy, delivery channel, and comfort options all live here so the app feels personal without getting noisy.",
    saved: "Your settings were updated.",
    communication: "Communication preferences",
    communicationText:
      "Control how queue and appointment information reaches you.",
    language: "Language",
    languageText: "Change the interface language across the patient pages.",
    sms: "SMS updates",
    smsText:
      "Receive turn number and waiting-time updates by text when the backend messaging provider is connected.",
    email: "Email updates",
    emailText:
      "Keep confirmations and non-urgent reminders in your inbox as well.",
    reminder: "Reminder window",
    reminderText:
      "Choose when the app should warn you that your doctor entry time is getting close.",
    extras: "Extra app controls",
    extrasText: "Small settings that make a healthcare app feel calmer.",
    privacy: "Privacy mode",
    privacyText: "Hide sensitive details in shared spaces",
    campaigns: "Health campaigns",
    campaignsText: "Receive service information and health campaigns",
    comfort: "Comfort mode",
    comfortText: "Use a softer dark interface when available",
    currentLanguage: "Current language",
    delivery: "Main delivery preference",
    sync: "Sync status",
  },
  fr: {
    badge: "Parametres",
    title: "Choisissez comment UrgentFlow vous informe et s'adapte a votre routine.",
    subtitle:
      "La langue, les rappels, la confidentialite, le canal d'envoi et le confort sont regroupes ici.",
    saved: "Vos parametres ont ete mis a jour.",
    communication: "Preferences de communication",
    communicationText:
      "Controlez comment les informations de file et de rendez-vous vous arrivent.",
    language: "Langue",
    languageText: "Changez la langue de l'interface dans les pages patient.",
    sms: "Mises a jour SMS",
    smsText:
      "Recevez le numero de tour et le temps d'attente par SMS quand le service est connecte.",
    email: "Mises a jour email",
    emailText:
      "Gardez aussi les confirmations et rappels non urgents dans votre boite mail.",
    reminder: "Fenetre de rappel",
    reminderText:
      "Choisissez quand l'application doit vous prevenir que l'entree chez le medecin approche.",
    extras: "Autres reglages",
    extrasText: "De petits reglages qui rendent l'application plus calme.",
    privacy: "Mode prive",
    privacyText: "Masquer les details sensibles dans les espaces partages",
    campaigns: "Campagnes de sante",
    campaignsText: "Recevoir des informations et campagnes de sante",
    comfort: "Mode confort",
    comfortText: "Utiliser une interface plus douce quand elle est disponible",
    currentLanguage: "Langue actuelle",
    delivery: "Canal principal",
    sync: "Etat de synchronisation",
  },
  ar: {
    badge: "الاعدادات",
    title: "اختر كيف يتواصل معك UrgentFlow وكيف يناسب روتينك.",
    subtitle:
      "اللغة والتنبيهات والخصوصية وطريقة الارسال وخيارات الراحة كلها موجودة هنا.",
    saved: "تم تحديث الاعدادات.",
    communication: "تفضيلات التواصل",
    communicationText: "تحكم في طريقة وصول معلومات الطابور والمواعيد اليك.",
    language: "اللغة",
    languageText: "غير لغة الواجهة في صفحات المريض.",
    sms: "تحديثات SMS",
    smsText: "استقبل رقم الدور ووقت الانتظار برسائل نصية عند ربط الخدمة.",
    email: "تحديثات البريد",
    emailText: "احتفظ بالتأكيدات والتنبيهات غير المستعجلة في بريدك ايضا.",
    reminder: "نافذة التذكير",
    reminderText: "اختر متى يجب ان يحذرك التطبيق من اقتراب موعد الدخول للطبيب.",
    extras: "اعدادات اضافية",
    extrasText: "خيارات صغيرة تجعل التطبيق اهدأ.",
    privacy: "وضع الخصوصية",
    privacyText: "اخف التفاصيل الحساسة في الاماكن المشتركة",
    campaigns: "حملات صحية",
    campaignsText: "استقبال معلومات وخدمات وحملات صحية",
    comfort: "وضع الراحة",
    comfortText: "استخدام واجهة اكثر هدوءا عندما تكون متاحة",
    currentLanguage: "اللغة الحالية",
    delivery: "قناة الارسال الرئيسية",
    sync: "حالة المزامنة",
  },
};

export default function SettingsPage({ setUser }) {
  const user = getStoredUser();
  const { setLanguage: setGlobalLanguage } = useLanguage();
  const [settings, setSettings] = useState({
    language: "en",
    smsAlerts: true,
    emailAlerts: true,
    reminderWindow: "10",
    privacyMode: false,
    marketingUpdates: false,
    darkMode: false,
  });
  const [saved, setSaved] = useState(false);
  const copy = COPY[settings.language] || COPY.en;

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      const nextSettings = await loadUserSettings(user?.id);
      if (!active) return;
      setSettings(nextSettings);
    }

    loadSettings();

    return () => {
      active = false;
    };
  }, [user?.id]);

  const updateSetting = async (key, value) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    if (key === "language") setGlobalLanguage(value);
    await updateUserSettings(user?.id, nextSettings);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1500);
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
            <div className="portal-stat-card">
              <strong>{settings.language.toUpperCase()}</strong>
              <span>{copy.currentLanguage}</span>
            </div>
            <div className="portal-stat-card">
              <strong>{settings.smsAlerts ? "SMS" : "Email"}</strong>
              <span>{copy.delivery}</span>
            </div>
            <div className="portal-stat-card">
              <strong>{saved ? "Saved" : "Live"}</strong>
              <span>{copy.sync}</span>
            </div>
          </div>
        </section>

        <div className="portal-shell">
          {saved && (
            <div className="portal-inline-message success">
              {copy.saved}
            </div>
          )}

          <section className="portal-grid portal-grid-single-admin">
            <article className="portal-card portal-card-large">
              <div className="portal-section-head">
                <div>
                  <h2>{copy.communication}</h2>
                  <p>{copy.communicationText}</p>
                </div>
              </div>

              <div className="settings-grid">
                <article className="settings-card">
                  <h3>{copy.language}</h3>
                  <p>{copy.languageText}</p>
                  <select className="portal-select" value={settings.language} onChange={(e) => updateSetting("language", e.target.value)}>
                    {LANGUAGE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </article>

                <article className="settings-card">
                  <h3>{copy.sms}</h3>
                  <p>{copy.smsText}</p>
                  <label className="toggle-row">
                    <span>Enable SMS</span>
                    <input type="checkbox" checked={settings.smsAlerts} onChange={(e) => updateSetting("smsAlerts", e.target.checked)} />
                  </label>
                </article>

                <article className="settings-card">
                  <h3>{copy.email}</h3>
                  <p>{copy.emailText}</p>
                  <label className="toggle-row">
                    <span>Enable email</span>
                    <input type="checkbox" checked={settings.emailAlerts} onChange={(e) => updateSetting("emailAlerts", e.target.checked)} />
                  </label>
                </article>

                <article className="settings-card">
                  <h3>{copy.reminder}</h3>
                  <p>{copy.reminderText}</p>
                  <select className="portal-select" value={settings.reminderWindow} onChange={(e) => updateSetting("reminderWindow", e.target.value)}>
                    <option value="5">5 minutes before</option>
                    <option value="10">10 minutes before</option>
                    <option value="15">15 minutes before</option>
                    <option value="30">30 minutes before</option>
                  </select>
                </article>

                <article className="settings-card">
                  <h3>{copy.privacy}</h3>
                  <label className="toggle-row">
                    <span>{copy.privacyText}</span>
                    <input type="checkbox" checked={settings.privacyMode} onChange={(e) => updateSetting("privacyMode", e.target.checked)} />
                  </label>
                </article>

                <article className="settings-card">
                  <h3>{copy.campaigns}</h3>
                  <label className="toggle-row">
                    <span>{copy.campaignsText}</span>
                    <input type="checkbox" checked={settings.marketingUpdates} onChange={(e) => updateSetting("marketingUpdates", e.target.checked)} />
                  </label>
                </article>
              </div>
            </article>
          </section>
        </div>
      </main>
    </>
  );
}
