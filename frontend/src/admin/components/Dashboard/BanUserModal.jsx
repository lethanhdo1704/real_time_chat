// frontend/src/admin/components/Dashboard/BanUserModal.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, AlertTriangle } from "lucide-react";

const BanUserModal = ({ user, onClose, onConfirm }) => {
  const { t } = useTranslation("admindashboard");
  const [banData, setBanData] = useState({
    reason: "",
    banType: "permanent", // 'permanent' | 'temporary'
    durationType: "hours", // 'hours' | 'days'
    duration: "1",
    banEndAt: "",
  });

  const handleDurationChange = (value, type = banData.durationType) => {
    const parsedValue = parseInt(value);
    
    // Validate the parsed value
    if (isNaN(parsedValue) || parsedValue < 1) {
      console.error("Invalid duration:", value);
      return;
    }
    
    const endDate = new Date();
    
    // Calculate end date based on duration type
    if (type === "hours") {
      endDate.setHours(endDate.getHours() + parsedValue);
    } else {
      endDate.setDate(endDate.getDate() + parsedValue);
    }
    
    setBanData((prev) => ({
      ...prev,
      duration: value,
      durationType: type,
      banEndAt: endDate.toISOString(),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // ✅ Extract userId from user object
    const userId = user?.uid || user?._id;

    console.log('🔍 BanUserModal - Submitting:', {
      user,
      extractedUserId: userId
    });

    // Validation
    if (!userId) {
      console.error("❌ No user ID found");
      console.error("User object:", user);
      alert("Invalid user data - Cannot find user ID");
      return;
    }

    const submitData = {
      reason: banData.reason || "Banned by admin",
      banEndAt: banData.banType === "temporary" ? banData.banEndAt : null,
    };

    console.log('✅ Calling onConfirm with:', { userId, submitData });

    // Pass userId and banData
    onConfirm(userId, submitData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {t("banModal.title")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4">
          {/* User Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <img
                src={
                  user.avatar ||
                  `https://ui-avatars.com/api/?name=${user.nickname}`
                }
                alt={user.nickname}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {user.nickname}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.email}
                </p>
              </div>
            </div>
          </div>

          {/* Ban Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("banModal.banType")}
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="banType"
                  value="permanent"
                  checked={banData.banType === "permanent"}
                  onChange={(e) =>
                    setBanData((prev) => ({ ...prev, banType: e.target.value }))
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t("banModal.permanent")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("banModal.permanentDesc")}
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="banType"
                  value="temporary"
                  checked={banData.banType === "temporary"}
                  onChange={(e) =>
                    setBanData((prev) => ({ ...prev, banType: e.target.value }))
                  }
                  className="w-4 h-4 text-blue-600"
                />
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-white">
                    {t("banModal.temporary")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("banModal.temporaryDesc")}
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Duration (if temporary) */}
          {banData.banType === "temporary" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("banModal.duration")}
              </label>
              
              {/* Duration Type Selector */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => handleDurationChange(banData.duration, "hours")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    banData.durationType === "hours"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {t("banModal.hours") || "Giờ"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDurationChange(banData.duration, "days")}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    banData.durationType === "days"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {t("banModal.days") || "Ngày"}
                </button>
              </div>
              
              {/* Quick Duration Buttons */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {banData.durationType === "hours" ? (
                  <>
                    {["1", "6", "12", "24"].map((hours) => (
                      <button
                        key={hours}
                        type="button"
                        onClick={() => handleDurationChange(hours, "hours")}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          banData.duration === hours && banData.durationType === "hours"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {hours}h
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {["1", "7", "30"].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleDurationChange(days, "days")}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          banData.duration === days && banData.durationType === "days"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {days}
                      </button>
                    ))}
                  </>
                )}
              </div>
              
              {/* Custom Duration Input */}
              <input
                type="number"
                min="1"
                max={banData.durationType === "hours" ? "720" : "365"}
                value={banData.duration}
                onChange={(e) => handleDurationChange(e.target.value)}
                placeholder={
                  banData.durationType === "hours"
                    ? t("banModal.customHours") || "Số giờ tùy chỉnh"
                    : t("banModal.customDays") || "Số ngày tùy chỉnh"
                }
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t("banModal.reason")}
            </label>
            <textarea
              value={banData.reason}
              onChange={(e) =>
                setBanData((prev) => ({ ...prev, reason: e.target.value }))
              }
              placeholder={t("banModal.reasonPlaceholder")}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
            />
          </div>

          {/* Warning */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-300">
              {t("banModal.warning")}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
            >
              {t("banModal.cancel")}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
            >
              {t("banModal.confirm")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BanUserModal;