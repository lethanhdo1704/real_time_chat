// frontend/src/admin/components/Dashboard/FilterButton.jsx
import React from 'react';

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

export default FilterButton;