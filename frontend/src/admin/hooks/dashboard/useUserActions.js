// frontend/src/admin/hooks/dashboard/useUserActions.js
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import adminApi from '../../services/adminApi';

export const useUserActions = (refreshData) => {
  const { t } = useTranslation();
  const [banModalUser, setBanModalUser] = useState(null);

  const handleBanUser = async (userId, banData) => {
    console.log('🔧 useUserActions - handleBanUser called:', { userId, banData });
    
    try {
      const response = await adminApi.banUser(userId, banData);
      console.log('✅ Ban successful:', response);
      
      refreshData();
      setBanModalUser(null);
    } catch (error) {
      console.error('❌ Ban failed:', error);
      alert(t('banFailed'));
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await adminApi.unbanUser(userId);
      refreshData();
    } catch (error) {
      alert(t('unbanFailed'));
    }
  };

  return {
    banModalUser,
    setBanModalUser,
    handleBanUser,
    handleUnbanUser
  };
};