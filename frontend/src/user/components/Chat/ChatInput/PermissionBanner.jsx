// frontend/src/components/Chat/ChatInput/PermissionBanner.jsx
import React from 'react';
import { ShieldAlert } from 'lucide-react';

/**
 * Banner shown when only admins can send messages
 * Simple warning banner for admin-only message permission
 * 
 * @param {Object} props
 * @param {Function} props.t - Translation function
 */
export default function PermissionBanner({ t }) {
  return (
    <div className="bg-white border-t border-gray-200 shrink-0">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-center justify-center gap-2 text-yellow-800">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">
              {t("input.onlyAdminsCanSend") || "Chỉ quản trị viên mới có thể nhắn tin"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}