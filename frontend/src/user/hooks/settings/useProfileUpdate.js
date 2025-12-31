// frontend/src/hooks/settings/useProfileUpdate.js
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import userService from "../../services/userService";

/**
 * Custom hook for profile update functionality
 * Handles nickname editing and saving
 */
export function useProfileUpdate() {
  const { user, updateUser } = useContext(AuthContext);
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

    const trimmedNickname = editedNickname.trim();

    try {
      setIsSaving(true);

      // Update nickname on server
      await userService.updateProfile({
        nickname: trimmedNickname,
      });

      // 🔥 UPDATE USER CONTEXT - BỎ RELOAD
      updateUser({
        nickname: trimmedNickname,
      });

      // Show success message
      showSuccessMessage();

      console.log("✅ [Profile] Update successful");

    } catch (error) {
      console.error("❌ [Profile] Update failed:", error);
      alert("Cập nhật thất bại. Vui lòng thử lại.");
      // Revert nickname on error
      setEditedNickname(user?.nickname || "");
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