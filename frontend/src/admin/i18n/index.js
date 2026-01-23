// frontend/src/admin/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import viLogin from "./locales/vi/AdminLogin.json";
import enLogin from "./locales/en/AdminLogin.json";
import viAdminDashboard from "./locales/vi/AdminDashboard.json";
import enAdminDashboard from "./locales/en/AdminDashboard.json";

const resources = {
  vi: {
    adminlogin: viLogin,
    admindashboard: viAdminDashboard, // ✅ ĐÚNG TÊN
  },
  en: {
    adminlogin: enLogin,
    admindashboard: enAdminDashboard, // ✅ ĐÚNG TÊN
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("adminLang") || "vi",
  ns: ["adminlogin", "admindashboard"], // ✅
  defaultNS: "admindashboard",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
