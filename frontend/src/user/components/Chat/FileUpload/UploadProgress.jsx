// frontend/src/user/components/Chat/FileUpload/UploadProgress.jsx

import { X } from 'lucide-react';
import { uploadService } from '../../../services/uploadService';
import { useTranslation } from 'react-i18next';

/**
 * UploadProgress Component
 * 
 * Shows upload progress with:
 * - Progress bar
 * - Percentage
 * - Upload speed
 * - Cancel button
 */
export default function UploadProgress({ 
  progress = 0, 
  speed = 0, 
  filesCount = 0,
  onCancel 
}) {
  const { t } = useTranslation("chat");

  if (progress === 0 && speed === 0) return null;

  return (
    <div className="mb-2 rounded-lg border border-blue-200 bg-blue-50 p-3 animate-in slide-in-from-bottom-2 duration-200">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-blue-900">
            {t('uploadProgress.uploading', { count: filesCount })}
          </span>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="shrink-0 p-1 rounded-full text-blue-600 hover:bg-blue-100 transition-colors"
            title={t('uploadProgress.cancelUpload')}
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out rounded-full"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-blue-700">
        <span>
          {Math.round(progress)}%
        </span>
        
        {speed > 0 && (
          <span>
            {uploadService.formatSpeed(speed)}
          </span>
        )}
      </div>
    </div>
  );
}