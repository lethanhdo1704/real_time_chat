// frontend/src/components/common/BanModal.jsx
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function BanModal({ isOpen, banInfo, onConfirm }) {
  const { t, i18n } = useTranslation("login");
  
  // Ngăn tương tác với background
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Xác định thông báo
  let message = t('errors.accountBanned');
  if (banInfo?.isPermanent) {
    message = t('errors.accountBannedPermanent');
  } else if (banInfo?.banEndAt) {
    const date = new Date(banInfo.banEndAt);
    if (!isNaN(date.getTime())) {
      const formattedDate = date.toLocaleString(i18n.language, {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      message = t('errors.accountBannedTemporary', { date: formattedDate });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {t('ban.title')}
          </h3>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          {/* Chỉ có 1 nút duy nhất */}
          <button
            onClick={onConfirm}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            {t('ban.action')}
          </button>
        </div>
      </div>
    </div>
  );
}