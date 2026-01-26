// frontend/src/admin/hooks/dashboard/useUserActions.js
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import adminApi from '../../services/adminApi';

export const useUserActions = (refreshData) => {
  const { t } = useTranslation();
  const [banModalUser, setBanModalUser] = useState(null);
  const [roleModalUser, setRoleModalUser] = useState(null);

  const handleBanUser = async (userId, banData) => {
    console.log('🔧 useUserActions - handleBanUser called:', { userId, banData });
    
    try {
      const response = await adminApi.banUser(userId, banData);
      console.log('✅ Ban successful:', response);
      
      refreshData();
      setBanModalUser(null);
    } catch (error) {
      console.error('❌ Ban failed:', error);
      alert(t('banFailed') || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await adminApi.unbanUser(userId);
      refreshData();
    } catch (error) {
      console.error('❌ Unban failed:', error);
      alert(t('unbanFailed') || 'Failed to unban user');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    console.log('🔧 useUserActions - handleUpdateRole called:', { userId, newRole });
    
    try {
      const response = await adminApi.updateUserRole(userId, newRole);
      console.log('✅ Role update successful:', response);
      
      refreshData();
      setRoleModalUser(null);
      
      // Show success message
      alert(t('roleUpdateSuccess') || 'User role updated successfully');
    } catch (error) {
      console.error('❌ Role update failed:', error);
      alert(error.message || t('roleUpdateFailed') || 'Failed to update user role');
    }
  };

  return {
    banModalUser,
    setBanModalUser,
    roleModalUser,
    setRoleModalUser,
    handleBanUser,
    handleUnbanUser,
    handleUpdateRole
  };
};