// frontend/src/user/components/Chat/MessageItem/ImageAttachment.jsx

import { useState } from 'react';
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * ImageAttachment Component - MESSENGER STYLE
 * 
 * Features:
 * - Rounded corners to match message bubble
 * - Lazy load with blur placeholder
 * - Click to open lightbox
 * - Zoom in/out in lightbox
 */
export default function ImageAttachment({ attachment, isMe }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [zoom, setZoom] = useState(1);

  const { url, name } = attachment;

  const handleImageClick = (e) => {
    e.stopPropagation();
    setShowLightbox(true);
    setZoom(1);
  };

  const handleCloseLightbox = () => {
    setShowLightbox(false);
    setZoom(1);
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') handleCloseLightbox();
    if (e.key === '+') handleZoomIn();
    if (e.key === '-') handleZoomOut();
  };

  if (error) {
    return (
      <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
        <p className="text-sm text-gray-500">Failed to load image</p>
      </div>
    );
  }

  return (
    <>
      {/* Image Thumbnail */}
      <div 
        className="relative rounded-lg overflow-hidden cursor-pointer group max-w-sm"
        onClick={handleImageClick}
      >
        {/* Blur placeholder */}
        {!loaded && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}

        {/* Actual image */}
        <img
          src={url}
          alt={name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`
            w-full h-auto transition-all duration-300
            ${loaded ? 'opacity-100' : 'opacity-0'}
            group-hover:scale-105
          `}
        />

        {/* Hover overlay */}
        {loaded && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={handleCloseLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Zoom controls */}
          <div className="absolute top-4 left-4 flex gap-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              disabled={zoom <= 0.5}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
            >
              <ZoomOut className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              disabled={zoom >= 3}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
            >
              <ZoomIn className="w-6 h-6" />
            </button>
            <span className="px-3 py-2 rounded-full bg-white/10 text-white text-sm">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Download button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="absolute bottom-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
          >
            <Download className="w-6 h-6" />
          </button>

          {/* Image */}
          <img
            src={url}
            alt={name}
            onClick={(e) => e.stopPropagation()}
            className="max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          />

          {/* Filename */}
          <div className="absolute bottom-4 left-4 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm max-w-md truncate">
            {name}
          </div>
        </div>
      )}
    </>
  );
}