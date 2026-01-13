// frontend/src/user/components/Chat/MessageItem/FileUpload/VideoAttachment.jsx

import { useState } from 'react';
import { Play, Download, Video as VideoIcon } from 'lucide-react';
import { truncateFilename } from '../../../../utils/fileUtils';
import { useTranslation } from 'react-i18next';

/**
 * VideoAttachment Component - BEAUTIFUL VIOLET GRADIENT
 * 
 * Features:
 * - Violet gradient (violet-500 → #8B5CF6)
 * - Gradient play button overlay
 * - Smooth thumbnail-to-player transition
 * - Download functionality
 */
export default function VideoAttachment({ attachment, isMe }) {
  const { t } = useTranslation("chat");
  const [showPlayer, setShowPlayer] = useState(false);
  const [posterError, setPosterError] = useState(false);

  const { url, name, mime } = attachment;

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
    <div className="rounded-xl overflow-hidden bg-linear-to-br from-violet-500 to-violet-600 max-w-sm shadow-lg hover:shadow-2xl transition-all duration-300">
      {!showPlayer ? (
        // Thumbnail with gradient play button
        <div
          onClick={() => setShowPlayer(true)}
          className="relative aspect-video cursor-pointer group"
        >
          {/* Video poster or gradient background */}
          {!posterError ? (
            <video
              src={url}
              className="w-full h-full object-cover"
              preload="metadata"
              onError={() => setPosterError(true)}
            />
          ) : (
            <div className="w-full h-full bg-linear-to-br from-violet-400 via-violet-500 to-violet-600 flex items-center justify-center">
              <VideoIcon className="w-16 h-16 text-white/50" />
            </div>
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/40 transition-all duration-300">
            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-white to-white/90 group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-2xl">
                <Play className="w-8 h-8 text-violet-600 ml-1" fill="currentColor" />
              </div>
            </div>

            {/* Bottom info */}
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <div className="flex items-center gap-2">
                <VideoIcon className="w-4 h-4 text-white" />
                <p className="text-sm text-white font-medium truncate flex-1" title={name}>
                  {truncateFilename(name, 35)}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Video player
        <div className="relative bg-black">
          <video
            controls
            autoPlay
            className="w-full h-auto"
            preload="metadata"
          >
            <source src={url} type={mime} />
            {t('file.videoNotSupported')}
          </video>

          {/* Download button overlay */}
          <button
            onClick={handleDownload}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white transition-all hover:scale-110"
            title={t('file.download')}
          >
            <Download className="w-4 h-4" />
          </button>

          {/* File info bar */}
          <div className="bg-linear-to-r from-violet-500 to-violet-600 p-3">
            <div className="flex items-center gap-2 text-white">
              <VideoIcon className="w-4 h-4" />
              <p className="text-sm font-medium truncate flex-1" title={name}>
                {truncateFilename(name, 35)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}