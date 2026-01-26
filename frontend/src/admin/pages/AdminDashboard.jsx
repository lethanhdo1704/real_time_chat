// frontend/src/admin/pages/AdminDashboard.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, UserX } from 'lucide-react';
import {
  DashboardHeader,
  StatCard,
  SearchBar,
  StatusFilters,
  UsersTable,
  Pagination,
  BanUserModal
} from '../components/Dashboard';
import UpdateRoleModal from '../components/Dashboard/UpdateRoleModal';
import { useDashboardData } from '../hooks/dashboard/useDashboardData';
import { useUserActions } from '../hooks/dashboard/useUserActions';
import { useAdminAuth } from '../context/AdminAuthContext';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { admin } = useAdminAuth(); // Lấy thông tin admin hiện tại
  
  const {
    stats,
    users,
    loading,
    filters,
    pagination,
    handleSearch,
    handleStatusFilter,
    handlePageChange,
    refreshData
  } = useDashboardData();

  const { 
    banModalUser, 
    setBanModalUser, 
    roleModalUser,
    setRoleModalUser,
    handleBanUser, 
    handleUnbanUser,
    handleUpdateRole
  } = useUserActions(refreshData);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Header */}
      <DashboardHeader />

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8">
          <StatCard
            title={t('stats.totalUsers')}
            value={stats?.totalUsers || 0}
            icon={Users}
            color="blue"
          />
          <StatCard
            title={t('stats.activeUsers')}
            value={stats?.activeUsers || 0}
            icon={UserCheck}
            color="green"
          />
          <StatCard
            title={t('stats.bannedUsers')}
            value={stats?.bannedUsers || 0}
            icon={UserX}
            color="red"
          />
          <StatCard
            title={t('stats.onlineNow')}
            value={stats?.onlineUsers || 0}
            icon={Users}
            color="purple"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <SearchBar value={filters.q} onChange={handleSearch} />
            <StatusFilters
              activeStatus={filters.status}
              onStatusChange={handleStatusFilter}
              onRefresh={refreshData}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <UsersTable
            users={users}
            loading={loading}
            onBanClick={setBanModalUser}
            onUnban={handleUnbanUser}
            onChangeRole={setRoleModalUser}
            currentAdminRole={admin?.role}
          />

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </main>

      {/* Ban Modal */}
      {banModalUser && (
        <BanUserModal
          user={banModalUser}
          onClose={() => setBanModalUser(null)}
          onConfirm={(userId, banData) => {
            console.log('🎯 AdminDashboard - onConfirm called:', { userId, banData });
            handleBanUser(userId, banData);
          }}
        />
      )}

      {/* Update Role Modal */}
      {roleModalUser && (
        <UpdateRoleModal
          user={roleModalUser}
          currentAdminRole={admin?.role}
          onClose={() => setRoleModalUser(null)}
          onConfirm={(userId, newRole) => {
            console.log('🎯 AdminDashboard - Update Role:', { userId, newRole });
            handleUpdateRole(userId, newRole);
          }}
        />
      )}
    </div>
  );
};

export default AdminDashboard;