// frontend/src/admin/components/Dashboard/SearchBar.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search } from 'lucide-react';

const SearchBar = ({ value, onChange }) => {
  const { t } = useTranslation("admindashboard");

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
      <input
        type="text"
        placeholder={t('searchPlaceholder')}
        value={value}
        onChange={onChange}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
      />
    </div>
  );
};

export default SearchBar;