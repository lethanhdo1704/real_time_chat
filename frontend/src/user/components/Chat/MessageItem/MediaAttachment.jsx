// frontend/src/user/components/Chat/MessageItem/MediaAttachment.jsx

import { useState } from 'react';
import { Download, File, Music, Video as VideoIcon } from 'lucide-react';
import { uploadService } from '../../../services/uploadService';

/**
 * MediaAttachment Component
 * 
 * Smart rendering based on mediaType:
 * - image: Lazy load with srcset
 * - video: Thumbnail only, load on click
 * - audio: Native audio player
 * - file: Icon + name + download
 */
export default function MediaAttachment({ attachment, isMe }) {
  const [imageError, setImageError] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const { url, name, size, mime, mediaType } = attachment;

  // ============================================
  // IMAGE ATTACHMENT
  // ============================================
  if (mediaType === 'image') {
    return (
      <div className="mt-2 rounded-lg overflow-hidden max-w-sm">
        {imageError ? (
          <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
            <File className="w-5 h-5 text-gray-400" />
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-700 truncate">{name}</div>
              <div className="text-xs text-gray-500">Image failed to load</div>
            </div>
          </div>
        ) : (
          <img
            src={url}
            alt={name}
            loading="lazy"
            onError={() => setImageError(true)}
            className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => window.open(url, '_blank')}
          />
        )}
      </div>
    );
  }

  // ============================================
  // VIDEO ATTACHMENT
  // ============================================
  if (mediaType === 'video') {
    return (
      <div className="mt-2 rounded-lg overflow-hidden max-w-sm bg-gray-900">
        {!videoLoaded ? (
          // Thumbnail/Placeholder
          <div
            onClick={() => setVideoLoaded(true)}
            className="relative aspect-video flex items-center justify-center cursor-pointer hover:bg-gray-800 transition-colors"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <VideoIcon className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 p-2 bg-linear-to-t from-black/50 to-transparent">
              <div className="text-xs text-white truncate">{name}</div>
            </div>
          </div>
        ) : (
          // Video Player
          <video
            controls
            className="w-full h-auto"
            preload="metadata"
          >
            <source src={url} type={mime} />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    );
  }

  // ============================================
  // AUDIO ATTACHMENT
  // ============================================
  if (mediaType === 'audio') {
    return (
      <div className="mt-2 p-3 rounded-lg bg-gray-50 border border-gray-200 max-w-sm">
        <div className="flex items-center gap-2 mb-2">
          <Music className="w-5 h-5 text-gray-500" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-gray-700 truncate">{name}</div>
            <div className="text-xs text-gray-500">{uploadService.formatFileSize(size)}</div>
          </div>
        </div>
        
        <audio controls className="w-full" preload="none">
          <source src={url} type={mime} />
          Your browser does not support the audio tag.
        </audio>
      </div>
    );
  }

  // ============================================
  // FILE ATTACHMENT (Default)
  // ============================================
  return (
    <div className="mt-2">
      <a
        href={url}
        download={name}
        target="_blank"
        rel="noopener noreferrer"
        className={`
          flex items-center gap-3 p-3 rounded-lg border transition-colors max-w-sm
          ${isMe 
            ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' 
            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
          }
        `}
      >
        <div className={`p-2 rounded-lg ${isMe ? 'bg-blue-100' : 'bg-gray-200'}`}>
          <File className={`w-5 h-5 ${isMe ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>

        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium truncate ${isMe ? 'text-blue-900' : 'text-gray-900'}`}>
            {name}
          </div>
          <div className={`text-xs ${isMe ? 'text-blue-600' : 'text-gray-500'}`}>
            {uploadService.formatFileSize(size)}
          </div>
        </div>

        <Download className={`w-5 h-5 shrink-0 ${isMe ? 'text-blue-600' : 'text-gray-500'}`} />
      </a>
    </div>
  );
}