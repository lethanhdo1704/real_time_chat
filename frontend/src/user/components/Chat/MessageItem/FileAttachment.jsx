// frontend/src/user/components/Chat/MessageItem/FileAttachment.jsx

import { 
  File, 
  FileText, 
  FileSpreadsheet, 
  Archive, 
  Download 
} from 'lucide-react';
import { uploadService } from '../../../services/uploadService';

/**
 * FileAttachment Component
 * 
 * Display file with icon based on mime type
 */
export default function FileAttachment({ attachment, isMe }) {
  const { url, name, size, mime } = attachment;

  // Get icon based on mime type
  const getFileIcon = () => {
    if (mime.includes('pdf')) {
      return <FileText className="w-5 h-5" />;
    }
    if (mime.includes('sheet') || mime.includes('excel')) {
      return <FileSpreadsheet className="w-5 h-5" />;
    }
    if (mime.includes('zip') || mime.includes('rar') || mime.includes('7z')) {
      return <Archive className="w-5 h-5" />;
    }
    return <File className="w-5 h-5" />;
  };

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
        flex items-center gap-3 p-3 rounded-lg border transition-all max-w-sm w-full
        ${isMe 
          ? 'bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300' 
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
        }
      `}
    >
      {/* Icon */}
      <div className={`
        p-2 rounded-lg shrink-0
        ${isMe ? 'bg-blue-100' : 'bg-gray-200'}
      `}>
        <span className={isMe ? 'text-blue-600' : 'text-gray-600'}>
          {getFileIcon()}
        </span>
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm font-medium truncate ${isMe ? 'text-blue-900' : 'text-gray-900'}`}>
          {name}
        </p>
        <p className={`text-xs ${isMe ? 'text-blue-600' : 'text-gray-500'}`}>
          {uploadService.formatFileSize(size)}
        </p>
      </div>

      {/* Download icon */}
      <Download className={`w-5 h-5 shrink-0 ${isMe ? 'text-blue-600' : 'text-gray-500'}`} />
    </button>
  );
}