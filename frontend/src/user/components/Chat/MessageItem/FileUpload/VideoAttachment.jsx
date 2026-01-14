// frontend/src/user/components/Chat/MessageItem/FileUpload/VideoAttachment.jsx

import { useState } from 'react';
import { Play, Download, Video as VideoIcon } from 'lucide-react';
import { truncateFilename } from '../../../../utils/fileUtils';
import { useTranslation } from 'react-i18next';

/**
 * VideoAttachment Component - OPTIMIZED cho ConversationInfo
 * 
 * Features:
 * - Compact mode với aspect-video cố định
 * - Full mode cho chat messages
 * - Violet gradient
 * - Smooth transitions
 */
export default function VideoAttachment({ attachment, isMe, isCompact = false }) {
  const { t } = useTranslation("chat");
  const [showPlayer, setShowPlayer] = useState(false);
  const [posterError, setPosterError] = useState(false);

  const { url, name, mime } = attachment;

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
      <div className="rounded-lg overflow-hidden bg-linear-to-br from-violet-500 to-violet-600 shadow-md hover:shadow-lg transition-all duration-300 w-full">
        {!showPlayer ? (
          // Compact Thumbnail
          <div
            onClick={() => setShowPlayer(true)}
            className="relative aspect-video cursor-pointer group"
          >
            {!posterError ? (
              <video
                src={url}
                className="w-full h-full object-cover"
                preload="metadata"
                onError={() => setPosterError(true)}
              />
            ) : (
              <div className="w-full h-full bg-linear-to-br from-violet-400 via-violet-500 to-violet-600 flex items-center justify-center">
                <VideoIcon className="w-12 h-12 text-white/40" />
              </div>
            )}

            {/* Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent group-hover:from-black/30 transition-all">
              {/* Play button */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white group-hover:scale-110 transition-all flex items-center justify-center shadow-lg">
                  <Play className="w-6 h-6 text-violet-600 ml-0.5" fill="currentColor" />
                </div>
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-2">
                <p className="text-xs text-white font-medium truncate" title={name}>
                  {truncateFilename(name, 30)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Compact Player
          <div className="relative bg-black aspect-video">
            <video
              controls
              autoPlay
              className="w-full h-full object-contain"
              preload="metadata"
            >
              <source src={url} type={mime} />
            </video>

            <button
              onClick={handleDownload}
              className="absolute top-1 right-1 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-all"
              title={t('file.download')}
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ============================================
  // FULL MODE for Chat Messages
  // ============================================
  return (
    <div className="rounded-xl overflow-hidden bg-linear-to-br from-violet-500 to-violet-600 max-w-sm shadow-lg hover:shadow-2xl transition-all duration-300">
      {!showPlayer ? (
        // Full Thumbnail
        <div
          onClick={() => setShowPlayer(true)}
          className="relative aspect-video cursor-pointer group"
        >
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

          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/40 transition-all duration-300">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-16 h-16 rounded-full bg-linear-to-br from-white to-white/90 group-hover:scale-110 transition-all duration-300 flex items-center justify-center shadow-2xl">
                <Play className="w-8 h-8 text-violet-600 ml-1" fill="currentColor" />
              </div>
            </div>

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
        // Full Player
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

          <button
            onClick={handleDownload}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white transition-all hover:scale-110"
            title={t('file.download')}
          >
            <Download className="w-4 h-4" />
          </button>

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