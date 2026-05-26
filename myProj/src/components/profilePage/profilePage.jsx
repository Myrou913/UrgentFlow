import { useEffect, useRef, useState } from "react";
import Select from "react-select";
import Nav from "../nav/nav.jsx";
import "./profilePage.css";
import "../../pages/dashboardPages.css";
import { getStoredUser, setStoredUser } from "../../utils/auth.js";
import { readSettings } from "../../utils/appointments.js";

function InitialsAvatar({ name }) {
  const initials = String(name || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <svg width="126" height="126" viewBox="0 0 126 126" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
      <defs>
        <linearGradient id="avatarGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4e8eff" />
          <stop offset="100%" stopColor="#2f76f6" />
        </linearGradient>
      </defs>
      <circle cx="63" cy="63" r="63" fill="url(#avatarGrad)" />
      <text x="63" y="63" dominantBaseline="central" textAnchor="middle"
        fill="white" fontSize="42" fontWeight="700" fontFamily="system-ui, sans-serif">
        {initials}
      </text>
    </svg>
  );
}

const BLOOD_TYPE_OPTIONS = [
  { value: "A+", label: "A+" },
  { value: "A-", label: "A-" },
  { value: "B+", label: "B+" },
  { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" },
  { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" },
  { value: "O-", label: "O-" },
];

const DISEASE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "Hypertension", label: "Hypertension" },
  { value: "Heart Disease", label: "Heart Disease" },
  { value: "Arrhythmia", label: "Arrhythmia" },
  { value: "Diabetes", label: "Diabetes" },
  { value: "Asthma", label: "Asthma" },
  {
    value: "Chronic Obstructive Pulmonary Disease",
    label: "Chronic Obstructive Pulmonary Disease",
  },
  { value: "Epilepsy", label: "Epilepsy" },
  { value: "Stroke history", label: "Stroke history" },
  { value: "Cancer", label: "Cancer" },
  { value: "Kidney Disease", label: "Kidney Disease" },
  { value: "Liver Disease", label: "Liver Disease" },
  { value: "Other", label: "Other" },
];

const COPY = {
  en: {
    badge: "Profile",
    title: "Your personal and medical details in the same calm workspace.",
    subtitle:
      "Update the information that helps hospitals understand you faster, and keep your profile photo and contact details ready for every visit.",
    basic: "Basic information",
    contact: "Contact information",
    personal: "Personal information",
    save: "Save profile",
    saved: "Profile saved successfully.",
    unavailable: "Please sign in to view and edit your profile.",
    firstName: "First Name", lastName: "Last Name", city: "City",
    address: "Address", email: "Email", phone: "Phone",
    gender: "Gender", female: "Female", male: "Male",
    dob: "Date of Birth", bloodType: "Blood Type", diseases: "Chronic Diseases",
    allergies: "Allergies", changePhoto: "Change photo",
    quickNotes: "Quick notes", photoPersistence: "Photo persistence",
    photoPersistenceText: "The profile picture is stored per user, so reopening the profile keeps the image you chose.",
    sharedStyle: "Shared style",
    sharedStyleText: "This profile uses the same private-area language as the appointments and settings pages.",
    detailsUsed: "The details used most often by the care team.",
    contactUsed: "These details are used for appointment reminders.",
    medicalContext: "Medical context that can help staff prepare faster.",
    photoSaves: "Your photo now saves right away after you change it.",
  },
  fr: {
    badge: "Profil",
    title: "Vos details personnels et medicaux dans le meme espace clair.",
    subtitle: "Mettez a jour les informations utiles pour les hopitaux et gardez votre photo et vos coordonnees pretes.",
    basic: "Informations de base",
    contact: "Coordonnees",
    personal: "Informations personnelles",
    save: "Enregistrer le profil",
    saved: "Profil enregistre avec succes.",
    unavailable: "Veuillez vous connecter pour voir et modifier votre profil.",
    firstName: "Prenom", lastName: "Nom", city: "Ville",
    address: "Adresse", email: "Email", phone: "Telephone",
    gender: "Genre", female: "Femme", male: "Homme",
    dob: "Date de naissance", bloodType: "Groupe sanguin", diseases: "Maladies chroniques",
    allergies: "Allergies", changePhoto: "Changer la photo",
    quickNotes: "Notes rapides", photoPersistence: "Persistance de la photo",
    photoPersistenceText: "La photo de profil est sauvegardee par utilisateur.",
    sharedStyle: "Style partage",
    sharedStyleText: "Ce profil utilise le meme style que les pages rendez-vous et parametres.",
    detailsUsed: "Les details les plus utilises par l'equipe soignante.",
    contactUsed: "Ces details sont utilises pour les rappels de rendez-vous.",
    medicalContext: "Le contexte medical aide le personnel a se preparer plus vite.",
    photoSaves: "Votre photo est sauvegardee immediatement apres modification.",
  },
  ar: {
    badge: "الملف الشخصي",
    title: "بياناتك الشخصية والطبية في نفس المساحة الهادئة.",
    subtitle: "قم بتحديث المعلومات التي تساعد المستشفى على خدمتك بسرعة واحتفظ بصورتك ووسائل الاتصال جاهزة.",
    basic: "المعلومات الاساسية",
    contact: "معلومات التواصل",
    personal: "المعلومات الشخصية",
    save: "حفظ الملف",
    saved: "تم حفظ الملف بنجاح.",
    unavailable: "يرجى تسجيل الدخول لعرض ملفك وتعديله.",
    firstName: "الاسم الاول", lastName: "اللقب", city: "المدينة",
    address: "العنوان", email: "البريد الالكتروني", phone: "الهاتف",
    gender: "الجنس", female: "انثى", male: "ذكر",
    dob: "تاريخ الميلاد", bloodType: "فصيلة الدم", diseases: "الامراض المزمنة",
    allergies: "الحساسية", changePhoto: "تغيير الصورة",
    quickNotes: "ملاحظات سريعة", photoPersistence: "حفظ الصورة",
    photoPersistenceText: "يتم حفظ صورة الملف الشخصي لكل مستخدم.",
    sharedStyle: "نمط موحد",
    sharedStyleText: "يستخدم هذا الملف نفس نمط صفحات المواعيد والاعدادات.",
    detailsUsed: "التفاصيل الاكثر استخداما من قبل الفريق الطبي.",
    contactUsed: "تستخدم هذه التفاصيل لتذكيرات المواعيد.",
    medicalContext: "السياق الطبي يساعد الموظفين على الاستعداد بشكل اسرع.",
    photoSaves: "يتم حفظ صورتك فور تغييرها.",
  },
};

function getProfileStorageKey(userId) {
  return `profileData:${userId || "guest"}`;
}

function getInitialProfile() {
  const user = getStoredUser();
  const savedProfile = JSON.parse(
    localStorage.getItem(getProfileStorageKey(user?.id)) || "null",
  );
  const names = user?.fullName?.split(" ") || [];

  return {
    user,
    avatarSrc: savedProfile?.avatar || user?.avatar || null,
    settings: readSettings(),
    formData: {
      firstName: savedProfile?.formData?.firstName || names[0] || "",
      lastName:
        savedProfile?.formData?.lastName || names.slice(1).join(" ") || "",
      city: savedProfile?.formData?.city || user?.city || "",
      address: savedProfile?.formData?.address || user?.address || "",
      gender: savedProfile?.formData?.gender || user?.gender || "",
      email: savedProfile?.formData?.email || user?.email || "",
      phone: savedProfile?.formData?.phone || user?.phone || "",
      date: savedProfile?.formData?.date || user?.date || "",
      bloodType: savedProfile?.formData?.bloodType || user?.bloodType || "",
      diseases: savedProfile?.formData?.diseases || user?.diseases || [],
      allergies: savedProfile?.formData?.allergies || user?.allergies || "",
    },
  };
}

export default function ProfilePage({ setUser }) {
  const initialState = getInitialProfile();
  const [user, setLocalUser] = useState(initialState.user);
  const [avatarSrc, setAvatarSrc] = useState(initialState.avatarSrc);
  const [formData, setFormData] = useState(initialState.formData);
  const [saved, setSaved] = useState(false);
  const [language, setLanguage] = useState(initialState.settings.language || "en");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const syncLanguage = () => setLanguage(readSettings().language || "en");
    window.addEventListener("urgentflow-settings-changed", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener("urgentflow-settings-changed", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  const copy = COPY[language] || COPY.en;

  const selectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: 46,
      borderRadius: "14px",
      borderColor: state.isFocused ? "#5b9bff" : "#d8d8d8",
      backgroundColor: state.isFocused ? "white" : "#f8fbff",
      boxShadow: state.isFocused ? "0 0 0 4px rgba(91,155,255,0.12)" : "none",
      "&:hover": { borderColor: "#5b9bff" },
    }),
    valueContainer: (base) => ({ ...base, padding: "0 12px" }),
    placeholder: (base) => ({ ...base, color: "#aaa", fontSize: "14px" }),
    singleValue: (base) => ({ ...base, fontSize: "14px" }),
    menu: (base) => ({ ...base, borderRadius: "14px", overflow: "hidden" }),
  };

  const persistProfile = (nextFormData, nextAvatar) => {
    if (!user) return;

    localStorage.setItem(
      getProfileStorageKey(user.id),
      JSON.stringify({ formData: nextFormData, avatar: nextAvatar }),
    );

    const nextUser = {
      ...user,
      fullName: `${nextFormData.firstName} ${nextFormData.lastName}`.trim(),
      city: nextFormData.city,
      address: nextFormData.address,
      gender: nextFormData.gender,
      email: nextFormData.email,
      phone: nextFormData.phone,
      date: nextFormData.date,
      bloodType: nextFormData.bloodType,
      diseases: nextFormData.diseases,
      allergies: nextFormData.allergies,
      avatar: nextAvatar,
    };

    setLocalUser(nextUser);
    setStoredUser(nextUser, true);
    if (setUser) {
      setUser(nextUser);
    }
  };

  // Keep local user in sync with App-level user (so Nav shows updated avatar)
  const navUser = { ...user, avatar: avatarSrc };

  const updateField = (key) => (event) => {
    setFormData((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const nextAvatar = loadEvent.target?.result || null;
      setAvatarSrc(nextAvatar);
      persistProfile(formData, nextAvatar);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    persistProfile(formData, avatarSrc);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  if (!user) {
    return (
      <>
        <Nav user={null} setUser={setUser} />
        <main className="portal-page">
          <div className="portal-shell">
            <div className="portal-empty-state">{copy.unavailable}</div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Nav user={navUser} setUser={setUser} />

      <main className="portal-page profile-page-shell">
        <section className="portal-header">
          <div className="portal-header-copy">
            <span className="portal-badge">{copy.badge}</span>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>

          <div className="profile-hero-avatar">
            <div
              className="avatar-wrapper"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarSrc ? (
                <img src={avatarSrc} alt="Profile" />
              ) : (
                <InitialsAvatar name={user.fullName} />
              )}
              <div className="avatar-overlay">
                <span>{copy.changePhoto}</span>
              </div>
              <input
                ref={fileInputRef}
                className="avatar-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
              />
            </div>
            <div className="profile-hero-name">
              <h2>{user.fullName || "User"}</h2>
              <p>{user.email}</p>
            </div>
          </div>
        </section>

        <div className="portal-shell">
          {saved && (
            <div className="portal-inline-message success">{copy.saved}</div>
          )}

          <section className="portal-grid portal-grid-main">
            <article className="portal-card portal-card-large">
              <div className="portal-section-head">
                <div>
                  <h2>{copy.basic}</h2>
                  <p>{copy.detailsUsed}</p>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="form-field">
                  <label>{copy.firstName}</label>
                  <input type="text" placeholder={copy.firstName} value={formData.firstName} onChange={updateField("firstName")} />
                </div>
                <div className="form-field">
                  <label>{copy.lastName}</label>
                  <input type="text" placeholder={copy.lastName} value={formData.lastName} onChange={updateField("lastName")} />
                </div>
                <div className="form-field">
                  <label>{copy.city}</label>
                  <input type="text" placeholder={copy.city} value={formData.city} onChange={updateField("city")} />
                </div>
                <div className="form-field">
                  <label>{copy.address}</label>
                  <input type="text" placeholder={copy.address} value={formData.address} onChange={updateField("address")} />
                </div>
              </div>
            </article>

            <aside className="portal-card portal-card-side">
              <div className="portal-section-head">
                <div>
                  <h2>{copy.contact}</h2>
                  <p>{copy.contactUsed}</p>
                </div>
              </div>
              <div className="profile-form-grid profile-form-grid--single">
                <div className="form-field">
                  <label>{copy.email}</label>
                  <input type="email" placeholder="your@email.com" value={formData.email} onChange={updateField("email")} />
                </div>
                <div className="form-field">
                  <label>{copy.phone}</label>
                  <input type="tel" placeholder="+216 XX XXX XXX" value={formData.phone} onChange={updateField("phone")} />
                </div>
              </div>
            </aside>
          </section>

          <section className="portal-grid portal-grid-single-admin">
            <article className="portal-card portal-card-large">
              <div className="portal-section-head">
                <div>
                  <h2>{copy.personal}</h2>
                  <p>{copy.medicalContext}</p>
                </div>
              </div>

              <div className="profile-form-grid">
                <div className="form-field form-field--full">
                  <label>{copy.gender}</label>
                  <div className="gender-radio-group">
                    <label className={`gender-option${formData.gender === "female" ? " gender-option--active" : ""}`}>
                      <input type="radio" name="gender" value="female" checked={formData.gender === "female"} onChange={updateField("gender")} />
                      <span>♀ {copy.female}</span>
                    </label>
                    <label className={`gender-option${formData.gender === "male" ? " gender-option--active" : ""}`}>
                      <input type="radio" name="gender" value="male" checked={formData.gender === "male"} onChange={updateField("gender")} />
                      <span>♂ {copy.male}</span>
                    </label>
                  </div>
                </div>
                <div className="form-field">
                  <label>{copy.dob}</label>
                  <input type="date" value={formData.date} onChange={updateField("date")} />
                </div>
                <div className="form-field">
                  <label>{copy.bloodType}</label>
                  <Select
                    options={BLOOD_TYPE_OPTIONS}
                    styles={selectStyles}
                    placeholder="Select blood type"
                    value={BLOOD_TYPE_OPTIONS.find((o) => o.value === formData.bloodType) || null}
                    onChange={(s) => setFormData((p) => ({ ...p, bloodType: s?.value || "" }))}
                  />
                </div>
                <div className="form-field form-field--full">
                  <label>{copy.diseases}</label>
                  <Select
                    options={DISEASE_OPTIONS}
                    styles={selectStyles}
                    placeholder="Select all that apply"
                    isMulti
                    value={DISEASE_OPTIONS.filter((o) => formData.diseases.includes(o.value))}
                    onChange={(s) => setFormData((p) => ({ ...p, diseases: (s || []).map((i) => i.value) }))}
                  />
                </div>
                <div className="form-field form-field--full">
                  <label>{copy.allergies}</label>
                  <textarea placeholder={copy.allergies} value={formData.allergies} onChange={updateField("allergies")} />
                </div>
              </div>
            </article>
          </section>

          <button className="portal-primary-button profile-save-button" onClick={handleSave}>
            {copy.save}
          </button>
        </div>
      </main>
    </>
  );
}
