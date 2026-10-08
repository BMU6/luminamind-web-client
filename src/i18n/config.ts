import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import de from "./locales/de.json";

i18n
  .use(LanguageDetector) // Automatically evaluates local client context profiles
  .use(initReactI18next) // Binds translation hooks smoothly to React 19 rendering timelines
  .init({
    resources: {
      en: { translation: en },
      de: { translation: de },
    },
    fallbackLng: "en", // Fallback translation base target choice
    interpolation: {
      escapeValue: false, // React natively prevents XSS string manipulation anomalies
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"], // Saves language preference securely across browser updates
    },
  });

export default i18n;
