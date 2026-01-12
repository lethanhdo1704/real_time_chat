// frontend/src/user/components/Chat/MessageItem/VideoAttachment.jsx

import { useState } from 'react';
import { Play, Download } from 'lucide-react';

/**
 * VideoAttachment Component - MESSENGER STYLE
 * 
 * Features:
 * - Rounded corners to match bubble
 * - Thumbnail with play icon
 * - Click to load video player
 * - Download button
 */
export default function VideoAttachment({ attachment, isMe }) {
  const [showPlayer, setShowPlayer] = useState(false);

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
    <div className="rounded-lg overflow-hidden bg-black max-w-sm">
      {!showPlayer ? (
        // Thumbnail with play button
        <div
          onClick={() => setShowPlayer(true)}
          className="relative aspect-video cursor-pointer group"
        >
          {/* Video element for poster */}
          <video
            src={url}
            className="w-full h-full object-cover"
            preload="metadata"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-white/90 group-hover:bg-white group-hover:scale-110 transition-all flex items-center justify-center shadow-lg">
              <Play className="w-8 h-8 text-gray-900 ml-1" fill="currentColor" />
            </div>
          </div>

          {/* Filename */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-linear-to-t from-black/60 to-transparent">
            <p className="text-xs text-white truncate">{name}</p>
          </div>
        </div>
      ) : (
        // Video player
        <div className="relative">
          <video
            controls
            autoPlay
            className="w-full h-auto"
            preload="metadata"
          >
            <source src={url} type={mime} />
            Your browser does not support the video tag.
          </video>

          {/* Download button overlay */}
          <button
            onClick={handleDownload}
            className="absolute top-2 right-2 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            title="Download video"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}