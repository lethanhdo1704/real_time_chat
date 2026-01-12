// frontend/src/user/components/Chat/MessageItem/FileUpload/FileAttachment.jsx

import { 
  File, 
  FileText, 
  FileSpreadsheet, 
  Archive, 
  Download,
  FileCode
} from 'lucide-react';
import { uploadService } from '../../../../services/uploadService';

/**
 * FileAttachment Component - BEAUTIFUL GRADIENT STYLE
 * 
 * Features:
 * - Beautiful gradient backgrounds based on file type
 * - Smooth hover animations
 * - Download functionality
 */
export default function FileAttachment({ attachment, isMe, t }) {
  const { url, name, size, mime } = attachment;

  // Get icon and gradient based on mime type
  const getFileConfig = () => {
    if (mime.includes('pdf')) {
      return {
        icon: <FileText className="w-6 h-6" />,
        gradient: 'from-red-500 to-red-600',
        bgColor: 'bg-red-500/20'
      };
    }
    if (mime.includes('sheet') || mime.includes('excel')) {
      return {
        icon: <FileSpreadsheet className="w-6 h-6" />,
        gradient: 'from-green-500 to-green-600',
        bgColor: 'bg-green-500/20'
      };
    }
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) {
      return {
        icon: <Archive className="w-6 h-6" />,
        gradient: 'from-yellow-500 to-orange-600',
        bgColor: 'bg-yellow-500/20'
      };
    }
    if (mime.includes('code') || mime.includes('javascript') || mime.includes('python')) {
      return {
        icon: <FileCode className="w-6 h-6" />,
        gradient: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-500/20'
      };
    }
    return {
      icon: <File className="w-6 h-6" />,
      gradient: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-500/20'
    };
  };

  const config = getFileConfig();

  const handleDownload = async () => {
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
    <button
      onClick={handleDownload}
      className={`
        flex items-center gap-3 p-4 rounded-xl transition-all max-w-sm w-full
        bg-linear-to-br ${config.gradient} shadow-lg hover:shadow-xl hover:scale-105
        group
      `}
    >
      {/* Icon */}
      <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg shrink-0 group-hover:bg-white/30 transition-colors">
        <span className="text-white">
          {config.icon}
        </span>
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-semibold text-white truncate">
          {name}
        </p>
        <p className="text-xs text-white/80">
          {uploadService.formatFileSize(size)}
        </p>
      </div>

      {/* Download icon */}
      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg shrink-0 group-hover:bg-white/30 transition-colors">
        <Download className="w-5 h-5 text-white" />
      </div>
    </button>
  );
}