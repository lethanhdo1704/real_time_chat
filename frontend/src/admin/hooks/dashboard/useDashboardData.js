// frontend/src/admin/hooks/dashboard/useDashboardData.js
import { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';

export const useDashboardData = () => {
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

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, [filters]);

  const handleSearch = (e) => {
    setFilters(prev => ({ ...prev, q: e.target.value, page: 1 }));
  };

  const handleStatusFilter = (status) => {
    setFilters(prev => ({ 
      ...prev, 
      status: status === prev.status ? '' : status, 
      page: 1 
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const refreshData = () => {
    fetchUsers();
    fetchStats();
  };

  return {
    stats,
    users,
    loading,
    filters,
    pagination,
    handleSearch,
    handleStatusFilter,
    handlePageChange,
    refreshData
  };
};