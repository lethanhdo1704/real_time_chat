// frontend/src/admin/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Shield, 
  Users, 
  UserCheck, 
  UserX, 
  Trash2,
  Search,
  RefreshCw
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import adminApi from '../services/adminApi';

const AdminDashboard = () => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    role: '',
    q: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [filters]);

  const fetchStats = async () => {
    try {
      const response = await adminApi.getUserStatistics();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminApi.listUsers(filters);
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, q: e.target.value, page: 1 }));
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ ...prev, status: status === prev.status ? '' : status, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleBanUser = async (userId) => {
    if (!confirm('Are you sure you want to ban this user?')) return;
    
    try {
      await adminApi.banUser(userId, { reason: 'Banned by admin' });
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert('Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId) => {
    try {
      await adminApi.unbanUser(userId);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert('Failed to unban user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await adminApi.deleteUser(userId);
      fetchUsers();
      fetchStats();
    } catch (error) {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden"> {/* ✅ overflow-x-hidden */}
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4"> {/* ✅ Bỏ max-w-7xl */}
          <div className="flex items-center justify-between gap-4"> {/* ✅ Thêm gap-4 */}
            <div className="flex items-center gap-3 min-w-0"> {/* ✅ min-w-0 để text truncate */}
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0"> {/* ✅ min-w-0 */}
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  Admin Dashboard
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
                  User Management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0"> {/* ✅ flex-shrink-0 */}
              <div className="text-right hidden md:block min-w-0"> {/* ✅ md thay vì sm */}
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {admin?.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {admin?.role || 'Admin'}
                </p>
              </div>
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex-shrink-0"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-8"> {/* ✅ Bỏ max-w-7xl */}
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-4 sm:mb-8"> {/* ✅ grid-cols-2 */}
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon={UserCheck}
            color="green"
          />
          <StatCard
            title="Banned Users"
            value={stats?.bannedUsers || 0}
            icon={UserX}
            color="red"
          />
          <StatCard
            title="Online Now"
            value={stats?.onlineUsers || 0}
            icon={Users}
            color="purple"
          />
        </div>

        {/* Filters & Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4"> {/* ✅ Luôn flex-col */}
            {/* Search */}
            <div className="relative w-full"> {/* ✅ w-full */}
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by email, nickname, or UID..."
                value={filters.q}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Status Filters */}
            <div className="flex flex-wrap gap-2"> {/* ✅ flex-wrap */}
              <FilterButton
                active={filters.status === 'active'}
                onClick={() => handleStatusFilter('active')}
              >
                Active
              </FilterButton>
              <FilterButton
                active={filters.status === 'banned'}
                onClick={() => handleStatusFilter('banned')}
              >
                Banned
              </FilterButton>
              <FilterButton
                active={filters.status === 'deleted'}
                onClick={() => handleStatusFilter('deleted')}
              >
                Deleted
              </FilterButton>
              
              {/* Refresh */}
              <button
                onClick={() => { fetchUsers(); fetchStats(); }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto"> {/* ✅ Giữ overflow-x-auto CHỈ ở table container */}
            <table className="w-full min-w-[640px]"> {/* ✅ min-w để table không bị squash */}
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    User
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    UID
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden lg:table-cell">
                    Role
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden xl:table-cell">
                    Created
                  </th>
                  <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map(user => (
                    <UserRow
                      key={user._id}
                      user={user}
                      onBan={handleBanUser}
                      onUnban={handleUnbanUser}
                      onDelete={handleDeleteUser}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

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
    </div>
  );
};

// Helper Components
const StatCard = ({ title, value, icon: Icon, color }) => {
  const colors = {
    blue: 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400',
    red: 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400',
    purple: 'bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1"> {/* ✅ min-w-0 flex-1 */}
          <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 truncate">
            {title}
          </p>
          <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 sm:mt-2">
            {value.toLocaleString()}
          </p>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
        </div>
      </div>
    </div>
  );
};

const FilterButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
      active
        ? 'bg-blue-600 text-white'
        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
    }`}
  >
    {children}
  </button>
);

const UserRow = ({ user, onBan, onUnban, onDelete }) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    banned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    deleted: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0"> {/* ✅ min-w-0 */}
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${user.nickname}`}
            alt={user.nickname}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex-shrink-0"
          />
          <div className="min-w-0 flex-1"> {/* ✅ min-w-0 flex-1 */}
            <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
              {user.nickname}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </td>
      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 dark:text-white">
        {user.uid}
      </td>
      <td className="px-4 sm:px-6 py-4">
        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${statusColors[user.status]}`}>
          {user.status}
        </span>
      </td>
      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 dark:text-white hidden lg:table-cell">
        {user.role}
      </td>
      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-end gap-1 sm:gap-2">
          {user.status === 'active' && (
            <>
              <button
                onClick={() => onBan(user._id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                title="Ban user"
              >
                <UserX className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(user._id)}
                className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Delete user"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {user.status === 'banned' && (
            <button
              onClick={() => onUnban(user._id)}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              Unban
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

const Pagination = ({ currentPage, totalPages, onPageChange }) => (
  <div className="flex items-center justify-between gap-4">
    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
      Page {currentPage} of {totalPages}
    </p>
    <div className="flex gap-2">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Previous
      </button>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        Next
      </button>
    </div>
  </div>
);

export default AdminDashboard;