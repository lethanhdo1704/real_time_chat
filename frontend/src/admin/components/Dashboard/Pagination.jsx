// frontend/src/admin/components/Dashboard/Pagination.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const { t } = useTranslation("admindashboard");

  // ✅ DEBUG: Kiểm tra props
  console.log('📊 Pagination props:', { currentPage, totalPages });

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  
  // ✅ DEBUG: Kiểm tra page numbers được tạo ra
  console.log('📄 Page numbers:', pageNumbers);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
        {t('pagination.page', { current: currentPage, total: totalPages })}
      </p>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {t('pagination.previous')}
        </button>

        {/* ✅ FORCE SHOW: Bỏ hidden sm:flex để test */}
        <div className="flex items-center gap-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="px-2 py-1 text-gray-500 dark:text-gray-400"
                >
                  ...
                </span>
              );
            }

            return (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                className={`
                  min-w-8 px-2 py-1 text-xs sm:text-sm rounded-lg transition-colors
                  ${
                    currentPage === page
                      ? 'bg-purple-600 text-white font-semibold'
                      : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                  }
                `}
              >
                {page}
              </button>
            );
          })}
        </div>

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