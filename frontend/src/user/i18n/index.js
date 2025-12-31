import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import viLogin from "./locales/vi/pages/Login.json";
import viRegister from "./locales/vi/pages/Register.json";
import enLogin from "./locales/en/pages/Login.json";
import enRegister from "./locales/en/pages/Register.json";
import viNotFound from "./locales/vi/pages/NotFound.json";
import enNotFound from "./locales/en/pages/NotFound.json";
import viForgotPassword from "./locales/vi/pages/ForgotPassword.json";
import enForgotPassword from "./locales/en/pages/ForgotPassword.json";
import viHome from "./locales/vi/pages/Home.json";
import enHome from "./locales/en/pages/Home.json";
import viChat from "./locales/vi/pages/Chat.json";
import enChat from "./locales/en/pages/Chat.json";
import viFriendFeature from "./locales/vi/pages/friendFeature.json";
import enFriendFeature from "./locales/en/pages/friendFeature.json";
import viSettings from "./locales/vi/pages/Settings.json";
import enSettings from "./locales/en/pages/Settings.json";

const resources = {
  vi: {
    login: viLogin,
    register: viRegister,
    notFound: viNotFound,
    forgotPassword: viForgotPassword,
    home: viHome,
    chat: viChat,
    friendFeature: viFriendFeature,
    settings: viSettings,
  },
  en: {
    login: enLogin,
    register: enRegister,
    notFound: enNotFound,
    forgotPassword: enForgotPassword,
    home: enHome,
    chat: enChat,
    friendFeature: enFriendFeature,
    settings: enSettings,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("lang") || "vi",
    ns: ["login", "register", "notFound", "forgotPassword", "home", "chat", "friendFeature", "settings"],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
