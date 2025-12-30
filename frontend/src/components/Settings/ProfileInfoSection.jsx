// frontend/src/components/Settings/ProfileInfoSection.jsx
import { useTranslation } from "react-i18next";
import { User, Mail, Save } from "lucide-react";

export default function ProfileInfoSection({
  user,
  editedNickname,
  setEditedNickname,
  isSaving,
  hasNicknameChanged,
  onSaveProfile,
}) {
  const { t } = useTranslation("settings");

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2 mb-6">
        <User className="w-5 h-5 text-blue-500" />
        {t("settings.profile.title")}
      </h2>

      <div className="space-y-5">
        {/* Nickname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("settings.profile.nickname")}
          </label>
          <input
            type="text"
            value={editedNickname}
            onChange={(e) => setEditedNickname(e.target.value)}
            maxLength={50}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            placeholder={t("settings.profile.nicknamePlaceholder")}
          />
          {editedNickname && (
            <p className="text-xs text-gray-500 mt-1">
              {editedNickname.length}/50 {t("settings.profile.characters")}
            </p>
          )}
        </div>

        {/* Email (Read-only) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("settings.profile.email")}
          </label>
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
              />
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t("settings.profile.emailNote")}
          </p>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={onSaveProfile}
            disabled={!hasNicknameChanged || isSaving}
            className="w-full sm:w-auto px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t("settings.profile.saving")}
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {t("settings.profile.save")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}