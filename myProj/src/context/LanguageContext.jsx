import { createContext, useContext, useEffect, useState } from "react";
import { readSettings, saveSettingsLocally } from "../utils/appointments.js";

const LanguageContext = createContext({ language: "en", setLanguage: () => {} });

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => readSettings().language || "en");

  useEffect(() => {
    const sync = () => setLanguageState(readSettings().language || "en");
    window.addEventListener("urgentflow-settings-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("urgentflow-settings-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setLanguage = (lang) => {
    setLanguageState(lang);
    saveSettingsLocally({ ...readSettings(), language: lang });
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
