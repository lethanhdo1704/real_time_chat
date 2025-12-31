// frontend/src/pages/Settings.jsx
import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { AuthContext } from "../context/AuthContext";
import SettingsHeader from "../components/Settings/SettingsHeader";
import AvatarSection from "../components/Settings/AvatarSection";
import ProfileInfoSection from "../components/Settings/ProfileInfoSection";
import SecurityNotice from "../components/Settings/SecurityNotice";
import SuccessToast from "../components/Settings/SuccessToast";
import { useAvatarUpload } from "../hooks/settings/useAvatarUpload";
import { useProfileUpdate } from "../hooks/settings/useProfileUpdate";

export default function Settings() {
  const { t } = useTranslation("settings");
  const { user } = useContext(AuthContext);

  // Avatar upload logic - BỎ PARAM user
  const {
    croppedAvatar,
    isUploading,
    showSuccess: showAvatarSuccess,
    handleAvatarSelect,
    handleUploadAvatar,
    handleCancelAvatar,
  } = useAvatarUpload(); // ✅ Không truyền user nữa

  // Profile update logic - BỎ PARAM user
  const {
    editedNickname,
    setEditedNickname,
    isSaving,
    showSuccess: showProfileSuccess,
    hasNicknameChanged,
    handleSaveProfile,
  } = useProfileUpdate(); // ✅ Không truyền user nữa

  const showSuccess = showAvatarSuccess || showProfileSuccess;

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Success Toast */}
      <SuccessToast show={showSuccess} />

      {/* Header */}
      <SettingsHeader />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Avatar Section */}
          <AvatarSection
            user={user}
            croppedAvatar={croppedAvatar}
            isUploading={isUploading}
            onAvatarSelect={handleAvatarSelect}
            onUploadAvatar={handleUploadAvatar}
            onCancelAvatar={handleCancelAvatar}
          />

          {/* Profile Info Section */}
          <ProfileInfoSection
            user={user}
            editedNickname={editedNickname}
            setEditedNickname={setEditedNickname}
            isSaving={isSaving}
            hasNicknameChanged={hasNicknameChanged}
            onSaveProfile={handleSaveProfile}
          />

          {/* Security Notice */}
          <SecurityNotice />
        </div>
      </div>
    </div>
  );
}