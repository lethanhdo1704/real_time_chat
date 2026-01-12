// frontend/src/user/components/Chat/FileUpload/FilePreview.jsx

import { X, File, Image, Video, Music } from 'lucide-react';
import { uploadService } from '../../../services/uploadService';
import { useTranslation } from 'react-i18next';

/**
 * 🔥 FIXED: FilePreview Component
 * 
 * Now uses preparedFile structure with previewUrl:
 * {
 *   id: string,
 *   file: File,
 *   name: string,
 *   size: number,
 *   type: string,
 *   previewUrl: string,  // Blob URL created by useFileUpload
 * }
 */
export default function FilePreview({ files, onRemove, onClear }) {
  const { t } = useTranslation("chat");

  console.log('🔍 [FilePreview] Render:', {
    filesCount: files.length,
    files: files.map(f => ({
      name: f.name,
      hasPreview: !!f.previewUrl,
    })),
  });

  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) return <Image className="w-5 h-5" />;
    if (file.type.startsWith('video/')) return <Video className="w-5 h-5" />;
    if (file.type.startsWith('audio/')) return <Music className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getTotalSize = () => {
    const total = files.reduce((sum, file) => sum + file.size, 0);
    return uploadService.formatFileSize(total);
  };

  if (files.length === 0) {
    console.log('⚠️ [FilePreview] No files to display');
    return null;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {t('filePreview.filesSelected', { count: files.length })}
          </span>
          <span className="text-xs text-gray-500">
            ({getTotalSize()})
          </span>
        </div>
        
        <button
          onClick={onClear}
          className="text-xs text-gray-500 hover:text-red-600 transition-colors"
        >
          {t('filePreview.clearAll')}
        </button>
      </div>

      {/* File List */}
      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
        {files.map((preparedFile, index) => (
          <div
            key={preparedFile.id}
            className="relative group"
          >
            {/* Image Preview */}
            {preparedFile.type.startsWith('image/') && preparedFile.previewUrl ? (
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img
                  src={preparedFile.previewUrl}
                  alt={preparedFile.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Remove Button */}
                <button
                  onClick={() => onRemove(index)}
                  className="absolute top-1 right-1 p-1 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                  title={t('actions.remove')}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              /* File Item */
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-gray-200 min-w-40">
                <div className="text-gray-500">
                  {getFileIcon(preparedFile)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-700 truncate">
                    {preparedFile.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {uploadService.formatFileSize(preparedFile.size)}
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onRemove(index)}
                  className="shrink-0 p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title={t('actions.remove')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}