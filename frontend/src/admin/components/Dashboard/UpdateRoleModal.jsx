// frontend/src/admin/components/Dashboard/UpdateRoleModal.jsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, ShieldCheck, Shield, User, AlertTriangle } from 'lucide-react';

const UpdateRoleModal = ({ user, onClose, onConfirm, currentAdminRole }) => {
  const { t } = useTranslation('admindashboard');
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Các role có thể chọn
  const roles = [
    { 
      value: 'user', 
      label: t('roles.user') || 'User',
      icon: User,
      description: t('roles.userDesc') || 'Normal user with basic permissions',
      color: 'text-gray-600 dark:text-gray-400'
    },
    { 
      value: 'admin', 
      label: t('roles.admin') || 'Admin',
      icon: Shield,
      description: t('roles.adminDesc') || 'Admin with management permissions',
      color: 'text-blue-600 dark:text-blue-400'
    }
  ];

  // Kiểm tra xem role có thể thay đổi không
  const canChangeRole = () => {
    // Không thể demote super_admin
    if (user.role === 'super_admin') {
      return false;
    }
    // Không thể promote lên super_admin
    if (selectedRole === 'super_admin' && user.role !== 'super_admin') {
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedRole === user.role) {
      onClose();
      return;
    }

    if (!canChangeRole()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(user.uid || user._id, selectedRole);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRoleWarning = () => {
    if (user.role === 'super_admin') {
      return {
        type: 'error',
        message: t('roleWarnings.cannotDemoteSuperAdmin') || 'Cannot demote super_admin to lower roles'
      };
    }
    if (selectedRole === 'super_admin' && user.role !== 'super_admin') {
      return {
        type: 'error',
        message: t('roleWarnings.cannotPromoteToSuperAdmin') || 'Cannot promote users to super_admin role'
      };
    }
    if (selectedRole === 'admin' && user.role === 'user') {
      return {
        type: 'warning',
        message: t('roleWarnings.promoteToAdmin') || 'This user will get admin management permissions'
      };
    }
    if (selectedRole === 'user' && user.role === 'admin') {
      return {
        type: 'warning',
        message: t('roleWarnings.demoteToUser') || 'This user will lose admin permissions'
      };
    }
    return null;
  };

  const warning = getRoleWarning();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t('updateRole.title') || 'Update User Role'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {user.nickname} ({user.email})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Current Role Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {t('updateRole.currentRole') || 'Current Role'}
            </p>
            <p className="font-semibold text-gray-900 dark:text-white capitalize">
              {user.role.replace('_', ' ')}
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('updateRole.selectNewRole') || 'Select New Role'}
            </label>
            
            {roles.map((role) => {
              const Icon = role.icon;
              const isDisabled = user.role === 'super_admin';
              const isSelected = selectedRole === role.value;
              
              return (
                <div
                  key={role.value}
                  className={`
                    relative border-2 rounded-lg p-4 cursor-pointer transition-all
                    ${isDisabled 
                      ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600' 
                      : isSelected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500'
                    }
                  `}
                  onClick={() => !isDisabled && setSelectedRole(role.value)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="role"
                      value={role.value}
                      checked={isSelected}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      disabled={isDisabled}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${role.color}`} />
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {role.label}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {role.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Warning Message */}
          {warning && (
            <div className={`
              flex items-start gap-3 p-4 rounded-lg
              ${warning.type === 'error' 
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
              }
            `}>
              <AlertTriangle className={`w-5 h-5 shrink-0 mt-0.5 ${
                warning.type === 'error' 
                  ? 'text-red-600 dark:text-red-400' 
                  : 'text-yellow-600 dark:text-yellow-400'
              }`} />
              <p className={`text-sm ${
                warning.type === 'error' 
                  ? 'text-red-700 dark:text-red-300' 
                  : 'text-yellow-700 dark:text-yellow-300'
              }`}>
                {warning.message}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              disabled={isSubmitting}
            >
              {t('updateRole.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !canChangeRole() || selectedRole === user.role}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {isSubmitting 
                ? (t('updateRole.updating') || 'Updating...') 
                : (t('updateRole.confirm') || 'Update Role')
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateRoleModal;