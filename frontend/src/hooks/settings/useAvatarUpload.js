// frontend/src/hooks/settings/useAvatarUpload.js
import { useState } from "react";
import userService from "../../services/userService";

/**
 * Custom hook for avatar upload functionality
 * Handles file selection, cropping, and uploading to server
 */
export function useAvatarUpload(user) {
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
      await userService.uploadAvatar(formData);

      // Show success message
      showSuccessMessage();

      // Clear cropped avatar (will show new avatar from user.avatar)
      setCroppedAvatar(null);

      // Reload page to get updated avatar
      // Note: Better approach is to update user context, but this is simpler
      setTimeout(() => {
        window.location.reload();
      }, 1000);

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