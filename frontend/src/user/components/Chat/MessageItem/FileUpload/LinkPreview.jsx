// frontend/src/user/components/Chat/MessageItem/FileUpload/LinkPreview.jsx

import { ExternalLink, Globe } from 'lucide-react';

/**
 * LinkPreview Component - Hiển thị link URL preview
 */
export default function LinkPreview({ attachment, isMe }) {
  const { url, name } = attachment;

  // Extract domain and clean up display name
  const getDomain = (urlString) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return '';
    }
  };

  const domain = getDomain(url);
  const displayName = name?.replace('www.', '') || domain;
  
  // Get favicon from Google
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

  const handleClick = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center gap-3 p-3 rounded-xl transition-all w-full
        ${isMe 
          ? 'bg-white/10 hover:bg-white/20 backdrop-blur-sm' 
          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
        }
        group shadow-sm hover:shadow-md
      `}
    >
      {/* Favicon */}
      <div className={`
        w-10 h-10 rounded-lg shrink-0 flex items-center justify-center overflow-hidden
        ${isMe ? 'bg-white/20' : 'bg-white border border-gray-200'}
      `}>
        <img 
          src={faviconUrl} 
          alt=""
          className="w-5 h-5"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.nextElementSibling.style.display = 'block';
          }}
        />
        <Globe 
          className={`w-5 h-5 hidden ${isMe ? 'text-white' : 'text-gray-500'}`}
          style={{ display: 'none' }}
        />
      </div>

      {/* Link info */}
      <div className="flex-1 min-w-0 text-left">
        <p className={`text-sm font-semibold truncate ${isMe ? 'text-white' : 'text-gray-900'}`} title={displayName}>
          {displayName}
        </p>
        <p className={`text-xs truncate ${isMe ? 'text-white/80' : 'text-gray-500'}`} title={url}>
          {url.replace(/^https?:\/\//, '')}
        </p>
      </div>

      {/* External link icon */}
      <div className="shrink-0">
        <ExternalLink className={`w-4 h-4 ${isMe ? 'text-white/80' : 'text-gray-400'} group-hover:scale-110 transition-transform`} />
      </div>
    </button>
  );
}