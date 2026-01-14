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
import { truncateFilename } from '../../../../utils/fileUtils';

/**
 * FileAttachment Component - OPTIMIZED cho ConversationInfo
 * 
 * Features:
 * - Compact mode cho ConversationInfo
 * - Full mode cho chat messages
 * - Smart color coding
 */
export default function FileAttachment({ attachment, isMe, t, isCompact = false }) {
  const { url, name, size, mime } = attachment;

  // Get icon and gradient based on file type
  const getFileConfig = () => {
    // CODE - slate-500
    if (name.match(/\.(js|jsx|ts|tsx|py|java|cpp|c|h|css|scss|html|htm|php|rb|go|rs|swift|kt|sh|bash|sql|r|m|vue|svelte)$/i) ||
        mime.includes('javascript') || mime.includes('typescript') || mime.includes('python') || 
        mime.includes('x-java') || mime.includes('x-c') || mime.includes('x-php')) {
      return {
        icon: <FileCode className={isCompact ? "w-5 h-5" : "w-6 h-6"} />,
        gradient: 'from-slate-500 to-slate-600',
        bgColor: 'bg-slate-500/20'
      };
    }
    
    // ARCHIVE - amber-500
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z') || 
        mime.includes('tar') || mime.includes('gz') || mime.includes('compressed') ||
        name.match(/\.(zip|rar|7z|tar|gz|bz2)$/i)) {
      return {
        icon: <Archive className={isCompact ? "w-5 h-5" : "w-6 h-6"} />,
        gradient: 'from-amber-500 to-amber-600',
        bgColor: 'bg-amber-500/20'
      };
    }
    
    // SPREADSHEET - emerald
    if (mime.includes('sheet') || mime.includes('excel') || mime.includes('csv') ||
        name.match(/\.(xlsx?|csv|ods)$/i)) {
      return {
        icon: <FileSpreadsheet className={isCompact ? "w-5 h-5" : "w-6 h-6"} />,
        gradient: 'from-emerald-500 to-emerald-600',
        bgColor: 'bg-emerald-500/20'
      };
    }
    
    // DOCUMENT - blue-500
    if (mime.includes('document') || mime.includes('word') || 
        mime.includes('presentation') || mime.includes('powerpoint') ||
        name.match(/\.(docx?|txt|rtf|odt|pptx?|odp)$/i)) {
      return {
        icon: <FileText className={isCompact ? "w-5 h-5" : "w-6 h-6"} />,
        gradient: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-500/20'
      };
    }
    
    // DEFAULT - slate-400
    return {
      icon: <File className={isCompact ? "w-5 h-5" : "w-6 h-6"} />,
      gradient: 'from-slate-400 to-slate-500',
      bgColor: 'bg-slate-400/20'
    };
  };

  const config = getFileConfig();

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
      <button
        onClick={handleDownload}
        className={`
          flex items-center gap-2.5 p-3 rounded-lg transition-all w-full
          bg-linear-to-br ${config.gradient} shadow-md hover:shadow-lg hover:scale-[1.02]
          group
        `}
      >
        {/* Icon */}
        <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg shrink-0 group-hover:bg-white/30 transition-colors">
          <span className="text-white">
            {config.icon}
          </span>
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0 text-left">
          <p className="text-xs font-semibold text-white truncate" title={name}>
            {truncateFilename(name, 25)}
          </p>
          <p className="text-[10px] text-white/80">
            {uploadService.formatFileSize(size)}
          </p>
        </div>

        {/* Download icon */}
        <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded shrink-0 group-hover:bg-white/30 transition-colors">
          <Download className="w-3.5 h-3.5 text-white" />
        </div>
      </button>
    );
  }

  // ============================================
  // FULL MODE for Chat Messages
  // ============================================
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
        <p className="text-sm font-semibold text-white truncate" title={name}>
          {truncateFilename(name, 30)}
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