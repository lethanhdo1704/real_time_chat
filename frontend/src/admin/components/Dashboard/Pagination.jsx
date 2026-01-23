// frontend/src/admin/components/Dashboard/Pagination.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation("admindashboard");

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
        {t('pagination.page', { current: currentPage, total: totalPages })}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('pagination.previous')}
        </button>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('pagination.next')}
        </button>
      </div>
    </div>
  );
};

export default Pagination;