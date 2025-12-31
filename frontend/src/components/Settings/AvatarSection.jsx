// frontend/src/components/Settings/AvatarSection.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Check, X } from "lucide-react";
import AvatarCropModal from "./AvatarCropModal";
import AvatarImage from "../common/AvatarImage";

export default function AvatarSection({
  user,
  croppedAvatar,
  isUploading,
  onAvatarSelect,
  onUploadAvatar,
  onCancelAvatar,
}) {
  const { t } = useTranslation("settings");
  const [showCropModal, setShowCropModal] = useState(false);
  const [originalImage, setOriginalImage] = useState(null);

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setOriginalImage(reader.result);
        setShowCropModal(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle crop confirmation
  const handleCropConfirm = (croppedDataUrl) => {
    onAvatarSelect(croppedDataUrl);
    setShowCropModal(false);
    setOriginalImage(null);
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropModal(false);
    setOriginalImage(null);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-500" />
            {t("settings.avatar.title")}
          </h2>
        </div>

        <div className="flex items-start gap-6">
          {/* Avatar Display */}
          <div className="relative group w-32 h-32 shrink-0">
            {croppedAvatar ? (
              // Preview của ảnh vừa crop (base64)
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-md">
                <img
                  src={croppedAvatar}
                  alt={t("settings.avatar.alt")}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              // Avatar hiện tại từ server
              <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-md">
                <AvatarImage
                  avatar={user.avatar}
                  nickname={user.nickname}
                  avatarUpdatedAt={user.avatarUpdatedAt}
                  size="full"
                  variant="header"
                  showOnlineStatus={false}
                  className="w-full h-full"
                />
              </div>
            )}

            {/* Upload Button Overlay */}
            {!croppedAvatar && (
              <label
                className="
                  absolute inset-0
                  rounded-full
                  flex items-center justify-center
                  cursor-pointer
                  opacity-0
                  group-hover:opacity-100
                  transition-opacity
                  duration-200
                "
              >
                <div className="bg-black/40 rounded-full p-3">
                  <Camera className="w-8 h-8 text-white drop-shadow-lg" />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Avatar Actions */}
          <div className="flex-1">
            <p className="text-gray-600 mb-4">
              {t("settings.avatar.description")}
            </p>

            {croppedAvatar ? (
              <div className="flex gap-3">
                <button
                  onClick={onUploadAvatar}
                  disabled={isUploading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                >
                  {isUploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      {t("settings.avatar.uploading")}
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      {t("settings.avatar.upload")}
                    </>
                  )}
                </button>
                <button
                  onClick={onCancelAvatar}
                  disabled={isUploading}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 flex items-center gap-2 transition-colors"
                >
                  <X className="w-4 h-4" />
                  {t("settings.avatar.cancel")}
                </button>
              </div>
            ) : (
              <label className="inline-block px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors">
                <span className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  {t("settings.avatar.select")}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Crop Modal */}
      {showCropModal && (
        <AvatarCropModal
          originalImage={originalImage}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}