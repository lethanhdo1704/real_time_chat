// frontend/src/admin/components/Dashboard/UsersTable.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import UserRow from './UserRow';

const UsersTable = ({ users, loading, onBanClick, onUnban, onDelete }) => {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              {t('table.user')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              {t('table.uid')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              {t('table.status')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden lg:table-cell">
              {t('table.role')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase hidden xl:table-cell">
              {t('table.created')}
            </th>
            <th className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">
              {t('table.actions')}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <tr>
              <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                {t('loading')}
              </td>
            </tr>
          ) : users.length === 0 ? (
            <tr>
              <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                {t('noUsers')}
              </td>
            </tr>
          ) : (
            users.map(user => (
              <UserRow
                key={user._id}
                user={user}
                onBan={onBanClick}
                onUnban={onUnban}
                onDelete={onDelete}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default UsersTable;