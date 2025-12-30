// frontend/src/hooks/settings/useProfileUpdate.js
import { useState, useEffect } from "react";
import userService from "../../services/userService";

/**
 * Custom hook for profile update functionality
 * Handles nickname editing and saving
 */
export function useProfileUpdate(user) {
  const [editedNickname, setEditedNickname] = useState(user?.nickname || "");
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Update edited nickname when user changes
  useEffect(() => {
    if (user?.nickname) {
      setEditedNickname(user.nickname);
    }
  }, [user?.nickname]);

  // Check if nickname has changed
  const hasNicknameChanged = editedNickname !== user?.nickname && editedNickname.trim().length > 0;

  // Save profile
  const handleSaveProfile = async () => {
    if (!hasNicknameChanged) return;

    try {
      setIsSaving(true);

      // Update nickname on server
      await userService.updateProfile({
        nickname: editedNickname.trim(),
      });

      // Show success message
      showSuccessMessage();

      // Reload page to get updated user data
      // Note: Better approach is to update user context, but this is simpler
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error("❌ [Profile] Update failed:", error);
      alert("Cập nhật thất bại. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  // Show success toast
  const showSuccessMessage = () => {
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return {
    editedNickname,
    setEditedNickname,
    isSaving,
    showSuccess,
    hasNicknameChanged,
    handleSaveProfile,
  };
}