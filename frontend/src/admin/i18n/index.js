// frontend/src/admin/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import viLogin from "./locales/vi/AdminLogin.json";
import enLogin from "./locales/en/AdminLogin.json";
import viAdminDashboard from "./locales/vi/AdminDashboard.json";
import enAdminDashboard from "./locales/en/AdminDashboard.json";
import viAdminNotFound from "./locales/vi/NotFound.json";
import enAdminNotFound from "./locales/en/NotFound.json";

const resources = {
  vi: {
    adminlogin: viLogin,
    admindashboard: viAdminDashboard,
    adminnotfound: viAdminNotFound, // ✅ Đổi thành adminnotfound
  },
  en: {
    adminlogin: enLogin,
    admindashboard: enAdminDashboard, 
    adminnotfound: enAdminNotFound, // ✅ Đổi thành adminnotfound
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem("adminLang") || "vi",
  ns: ["adminlogin", "admindashboard", "adminnotfound"], // ✅ Đã đúng
  defaultNS: "admindashboard",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;