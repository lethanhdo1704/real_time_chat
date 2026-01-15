// frontend/src/user/components/Chat/MessageItem/FileUpload/DocumentAttachment.jsx

import { FileText, Download, ExternalLink } from 'lucide-react';
import { uploadService } from '../../../../services/uploadService';
import { truncateFilename } from '../../../../utils/fileUtils';
import { useTranslation } from 'react-i18next';

/**
 * DocumentAttachment Component - PDF ONLY, giống FileAttachment
 * 
 * Features:
 * - Compact mode cho ConversationInfo
 * - Full mode cho chat messages
 * - Blue gradient (blue-500 → #3B82F6)
 * - Click to open in new tab
 * - Separate download button
 */
export default function DocumentAttachment({ attachment, isMe, isCompact = false }) {
  const { t } = useTranslation("chat");
  const { url, name, size } = attachment;

  const handleOpen = (e) => {
    e.stopPropagation();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
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

  // ============================================
  // COMPACT MODE for ConversationInfo
  // ============================================
  if (isCompact) {
    return (
      <div className="flex items-center gap-2.5 p-3 rounded-lg transition-all w-full bg-linear-to-br from-blue-500 to-blue-600 shadow-md hover:shadow-lg hover:scale-[1.02] group">
        {/* Icon */}
        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg shrink-0 group-hover:bg-white/30 transition-colors">
          <FileText className="w-5 h-5 text-white" />
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-white truncate" title={name}>
            {truncateFilename(name, 25)}
          </p>
          <p className="text-[10px] text-white/80">
            {uploadService.formatFileSize(size)} • PDF
          </p>
        </div>

        {/* Action buttons - compact */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Open button */}
          <button
            onClick={handleOpen}
            className="p-1.5 bg-white/20 backdrop-blur-sm rounded hover:bg-white/30 transition-colors"
            title={t('file.open') || 'Open'}
          >
            <ExternalLink className="w-3.5 h-3.5 text-white" />
          </button>

          {/* Download button */}
          <button
            onClick={handleDownload}
            className="p-1.5 bg-white/20 backdrop-blur-sm rounded hover:bg-white/30 transition-colors"
            title={t('file.download') || 'Download'}
          >
            <Download className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // FULL MODE for Chat Messages
  // ============================================
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
            title={t('file.download') || 'Download'}
          >
            <Download className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}