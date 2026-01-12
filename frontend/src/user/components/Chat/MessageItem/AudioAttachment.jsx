// frontend/src/user/components/Chat/MessageItem/AudioAttachment.jsx

import { Music, Download } from 'lucide-react';
import { uploadService } from '../../../services/uploadService';

/**
 * AudioAttachment Component
 * 
 * Simple audio player with waveform placeholder
 */
export default function AudioAttachment({ attachment, isMe }) {
  const { url, name, size, mime } = attachment;

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
    <div className={`
      p-3 rounded-lg border max-w-sm
      ${isMe 
        ? 'bg-blue-50 border-blue-200' 
        : 'bg-gray-50 border-gray-200'
      }
    `}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className={`
          p-2 rounded-lg
          ${isMe ? 'bg-blue-100' : 'bg-gray-200'}
        `}>
          <Music className={`w-4 h-4 ${isMe ? 'text-blue-600' : 'text-gray-600'}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium truncate ${isMe ? 'text-blue-900' : 'text-gray-900'}`}>
            {name}
          </p>
          <p className={`text-xs ${isMe ? 'text-blue-600' : 'text-gray-500'}`}>
            {uploadService.formatFileSize(size)}
          </p>
        </div>

        <button
          onClick={handleDownload}
          className={`
            p-2 rounded-lg transition-colors
            ${isMe 
              ? 'hover:bg-blue-100 text-blue-600' 
              : 'hover:bg-gray-200 text-gray-600'
            }
          `}
          title="Download audio"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Audio player */}
      <audio
        controls
        className="w-full h-8"
        preload="none"
        style={{
          filter: isMe ? 'hue-rotate(200deg)' : 'none'
        }}
      >
        <source src={url} type={mime} />
        Your browser does not support the audio tag.
      </audio>
    </div>
  );
}