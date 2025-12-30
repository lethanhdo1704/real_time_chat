// frontend/src/components/Settings/AvatarSection.jsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Camera, Check, X, User } from "lucide-react";
import AvatarCropModal from "./AvatarCropModal";
import { getAvatarUrlWithCache, getUserInitials } from "../../utils/avatarUtils";

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
  const [imageError, setImageError] = useState(false);

  const currentAvatar = getAvatarUrlWithCache(user.avatar, user.avatarUpdatedAt);
  const initials = getUserInitials(user.nickname);
  const displayAvatar = croppedAvatar || currentAvatar;

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
    setImageError(false); // Reset error when new image selected
    onAvatarSelect(croppedDataUrl);
    setShowCropModal(false);
    setOriginalImage(null);
  };

  // Handle crop cancel
  const handleCropCancel = () => {
    setShowCropModal(false);
    setOriginalImage(null);
  };

  // Handle image error
  const handleImageError = () => {
    console.error("❌ Avatar failed to load:", displayAvatar);
    setImageError(true);
  };

  // Handle image load success
  const handleImageLoad = () => {
    console.log("✅ Avatar loaded successfully");
    setImageError(false);
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
          <div className="relative group">
            {/* Container với conditional background */}
            <div className={`w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 shadow-md ${
              displayAvatar && !imageError 
                ? '' // Không cần background khi có ảnh
                : 'bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center'
            }`}>
              {displayAvatar && !imageError ? (
                <img
                  src={displayAvatar}
                  alt={t("settings.avatar.alt")}
                  className="w-full h-full object-cover"
                  onError={handleImageError}
                  onLoad={handleImageLoad}
                  style={{ display: 'block' }} // Fix flexbox issue
                />
              ) : (
                // Fallback UI
                <div className="w-full h-full flex items-center justify-center text-white text-4xl font-bold">
                  {initials || <User className="w-16 h-16" />}
                </div>
              )}
            </div>

            {/* Upload Button Overlay */}
            {!croppedAvatar && (
              <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-40 rounded-full cursor-pointer transition-all">
                <Camera className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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