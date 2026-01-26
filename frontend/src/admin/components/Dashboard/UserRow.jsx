// frontend/src/admin/components/Dashboard/UserRow.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserX, Trash2, Clock } from 'lucide-react';

const UserRow = ({ user, onBan, onUnban, onDelete }) => {
  const { t } = useTranslation("admindashboard");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Cập nhật thời gian mỗi giây để hiển thị real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Cập nhật mỗi 1 giây

    return () => clearInterval(interval);
  }, []);

  const getBanEndDate = () => {
    if (!user.banEndAt) return null;
    const endDate = new Date(user.banEndAt);
    const timeDiff = endDate - currentTime;
    
    // Tính toán thời gian còn lại
    const daysLeft = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutesLeft = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const secondsLeft = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    return { 
      endDate, 
      daysLeft, 
      hoursLeft, 
      minutesLeft,
      secondsLeft,
      totalHours: Math.floor(timeDiff / (1000 * 60 * 60)),
      isExpired: timeDiff <= 0
    };
  };

  const banInfo = user.status === 'banned' ? getBanEndDate() : null;

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    banned: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    deleted: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };

  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
      {/* User info - có truncate để không tràn */}
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <img
            src={user.avatar || `https://ui-avatars.com/api/?name=${user.nickname}`}
            alt={user.nickname}
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-full shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">
              {user.nickname}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
              {user.email}
            </p>
          </div>
        </div>
      </td>

      {/* UID - thêm max-w để tránh quá dài */}
      <td className="px-4 sm:px-6 py-4">
        <span className="text-xs sm:text-sm text-gray-900 dark:text-white block truncate max-w-20 sm:max-w-none">
          {user.uid}
        </span>
      </td>

      {/* Status - hiển thị thời gian chi tiết real-time */}
      <td className="px-4 sm:px-6 py-4">
        <div className="flex flex-col gap-1 min-w-0">
          <span className={`px-2 py-1 text-xs font-medium rounded-full inline-flex items-center gap-1 w-fit ${statusColors[user.status]}`}>
            {user.status === 'banned' && banInfo && !banInfo.isExpired && (
              <Clock className="w-3 h-3 shrink-0" />
            )}
            <span className="whitespace-nowrap">{t(`status.${user.status}`)}</span>
          </span>
          {user.status === 'banned' && banInfo && (
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate font-mono">
              {banInfo.isExpired ? (
                t('banExpired') || 'Đã hết hạn'
              ) : banInfo.daysLeft > 0 ? (
                `${banInfo.daysLeft}d ${banInfo.hoursLeft}h ${banInfo.minutesLeft}m ${banInfo.secondsLeft}s`
              ) : banInfo.totalHours > 0 ? (
                `${banInfo.totalHours}h ${banInfo.minutesLeft}m ${banInfo.secondsLeft}s`
              ) : banInfo.minutesLeft > 0 ? (
                `${banInfo.minutesLeft}m ${banInfo.secondsLeft}s`
              ) : (
                `${banInfo.secondsLeft}s`
              )}
            </span>
          )}
        </div>
      </td>

      {/* Role */}
      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-900 dark:text-white hidden lg:table-cell">
        {user.role}
      </td>

      {/* Created date */}
      <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 hidden xl:table-cell whitespace-nowrap">
        {new Date(user.createdAt).toLocaleDateString()}
      </td>

      {/* Actions - compact hơn trên mobile */}
      <td className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-end gap-1 sm:gap-2 shrink-0">
          {user.status === 'active' && (
            <>
              <button
                onClick={() => onBan(user)}
                className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors"
                title={t('actions.ban')}
              >
                <UserX className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(user.uid || user._id)}
                className="p-1.5 sm:p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={t('actions.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {user.status === 'banned' && (
            <button
              onClick={() => onUnban(user.uid || user._id)}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors whitespace-nowrap"
            >
              {t('actions.unban')}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default UserRow;