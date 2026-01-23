// frontend/src/admin/components/Dashboard/StatusFilters.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';
import FilterButton from './FilterButton';

const StatusFilters = ({ activeStatus, onStatusChange, onRefresh }) => {
  const { t } = useTranslation("admindashboard");

  return (
    <div className="flex flex-wrap gap-2">
      <FilterButton
        active={activeStatus === 'active'}
        onClick={() => onStatusChange('active')}
      >
        {t('filters.active')}
      </FilterButton>
      <FilterButton
        active={activeStatus === 'banned'}
        onClick={() => onStatusChange('banned')}
      >
        {t('filters.banned')}
      </FilterButton>
      <FilterButton
        active={activeStatus === 'deleted'}
        onClick={() => onStatusChange('deleted')}
      >
        {t('filters.deleted')}
      </FilterButton>
      
      {/* Refresh */}
      <button
        onClick={onRefresh}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
        title={t('refresh')}
      >
        <RefreshCw className="w-5 h-5" />
      </button>
    </div>
  );
};

export default StatusFilters;