// frontend/src/hooks/settings/useAvatarUpload.js
import { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import userService from "../../services/userService";

/**
 * Custom hook for avatar upload functionality
 * Handles file selection, cropping, and uploading to server
 */
export function useAvatarUpload() {
  const { updateUser } = useContext(AuthContext);
  const [croppedAvatar, setCroppedAvatar] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Handle avatar selection from crop modal
  const handleAvatarSelect = (croppedDataUrl) => {
    setCroppedAvatar(croppedDataUrl);
  };

  // Upload avatar to server
  const handleUploadAvatar = async () => {
    if (!croppedAvatar) return;

    try {
      setIsUploading(true);

      // Convert data URL to Blob
      const blob = await fetch(croppedAvatar).then((res) => res.blob());
      
      // Create FormData
      const formData = new FormData();
      formData.append("avatar", blob, "avatar.jpg");

      // Upload to server
      // ✅ userService.uploadAvatar already returns response.data.data || response.data
      const userData = await userService.uploadAvatar(formData);

      // 🔥 UPDATE USER CONTEXT - BỎ RELOAD
      updateUser({
        avatar: userData.avatar,
        avatarUpdatedAt: userData.avatarUpdatedAt,
      });

      // Show success message
      showSuccessMessage();

      // Clear cropped avatar (will show new avatar from user.avatar)
      setCroppedAvatar(null);

      console.log("✅ [Avatar] Upload successful");

    } catch (error) {
      console.error("❌ [Avatar] Upload failed:", error);
      alert("Tải ảnh lên thất bại. Vui lòng thử lại.");
    } finally {
      setIsUploading(false);
    }
  };

  // Cancel cropped avatar
  const handleCancelAvatar = () => {
    setCroppedAvatar(null);
  };

  // Show success toast
  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return {
    croppedAvatar,
    isUploading,
    showSuccess,
    handleAvatarSelect,
    handleUploadAvatar,
    handleCancelAvatar,
  };
}