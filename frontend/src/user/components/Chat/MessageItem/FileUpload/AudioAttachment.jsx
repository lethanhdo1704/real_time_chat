// frontend/src/user/components/Chat/MessageItem/FileUpload/AudioAttachment.jsx

import { Music, Download } from 'lucide-react';
import { uploadService } from '../../../../services/uploadService';
import { useTranslation } from "react-i18next";

/**
 * AudioAttachment Component - BEAUTIFUL GRADIENT STYLE
 * 
 * Features:
 * - Beautiful green gradient background
 * - Custom styled audio player
 * - Download functionality
 */
export default function AudioAttachment({ attachment, isMe }) {
  const { url, name, size, mime } = attachment;
  const { t } = useTranslation("chat");
  
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
    <div className="rounded-xl overflow-hidden bg-linear-to-br from-green-500 to-emerald-600 max-w-sm shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
            <Music className="w-5 h-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {name}
            </p>
            <p className="text-xs text-white/80">
              {uploadService.formatFileSize(size)}
            </p>
          </div>

          <button
            onClick={handleDownload}
            className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all hover:scale-110"
            title={t("file.download")}
          >
            <Download className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Audio player */}
        <audio
          controls
          className="w-full h-10"
          preload="none"
          style={{
            filter: 'brightness(1.2) saturate(1.1)',
            borderRadius: '8px'
          }}
        >
          <source src={url} type={mime} />
          {t('file.audioNotSupported')}
        </audio>
      </div>
    </div>
  );
}