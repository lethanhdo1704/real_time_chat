// frontend/src/user/components/Chat/MessageItem/FileUpload/DocumentAttachment.jsx

import { FileText, Download, ExternalLink } from 'lucide-react';
import { uploadService } from '../../../../services/uploadService';
import { truncateFilename } from '../../../../utils/fileUtils';
import { useTranslation } from 'react-i18next';

/**
 * DocumentAttachment Component - PDF ONLY
 * 
 * Features:
 * - Blue gradient (blue-500 → #3B82F6)
 * - Click to open in new tab (browser native PDF viewer)
 * - Separate download button
 * - File size display
 * - Smart filename truncation (keeps .pdf extension visible)
 */
export default function DocumentAttachment({ attachment, isMe }) {
  const { t } = useTranslation("chat");
  const { url, name, size } = attachment;

  const handleOpen = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (e) => {
    e.stopPropagation(); // Prevent opening when clicking download
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="rounded-xl overflow-hidden bg-linear-to-br from-blue-500 to-blue-600 max-w-sm shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg shrink-0">
            <FileText className="w-6 h-6 text-white" />
          </div>
          
          {/* File Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate" title={name}>
              {truncateFilename(name, 30)}
            </p>
            <p className="text-xs text-white/80">
              {uploadService.formatFileSize(size)} • PDF
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-3 flex gap-2">
          {/* Open Button */}
          <button
            onClick={handleOpen}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all hover:scale-105 group"
          >
            <ExternalLink className="w-4 h-4 text-white group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-white">
              {t('file.open') || 'Open'}
            </span>
          </button>

          {/* Download Button */}
          <button
            onClick={handleDownload}
            className="px-4 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all hover:scale-105"
            title={t('file.download')}
          >
            <Download className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}