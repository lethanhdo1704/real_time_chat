// frontend/src/admin/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import viLogin from "./locales/vi/AdminLogin.json";
import enLogin from "./locales/en/AdminLogin.json";

const resources = {
  vi: {
    adminlogin: viLogin,
  },
  en: {
    adminlogin: enLogin,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("adminLang") || "vi",
  ns: ["adminlogin"],
  defaultNS: "adminlogin",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;