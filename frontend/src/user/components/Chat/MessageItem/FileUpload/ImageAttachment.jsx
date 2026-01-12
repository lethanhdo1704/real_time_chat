// frontend/src/user/components/Chat/MessageItem/FileUpload/ImageAttachment.jsx

import { useState } from 'react';
import { Download, X, ZoomIn, ZoomOut, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * ImageAttachment Component - BEAUTIFUL GRADIENT STYLE
 * 
 * Features:
 * - Beautiful gradient overlay on hover
 * - Smooth animations
 * - Lightbox with zoom controls
 * - Download functionality
 */
export default function ImageAttachment({ attachment, isMe }) {
  const { t } = useTranslation("chat");
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
      <div className="p-4 bg-linear-to-br from-red-50 to-red-100 rounded-xl border border-red-200">
        <p className="text-sm text-red-600">{t('file.loadError')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Image Thumbnail */}
      <div 
        className="relative rounded-xl overflow-hidden cursor-pointer group max-w-sm shadow-md hover:shadow-xl transition-all duration-300"
        onClick={handleImageClick}
      >
        {/* Blur placeholder with gradient */}
        {!loaded && (
          <div className="absolute inset-0 bg-linear-to-br from-blue-100 via-purple-100 to-pink-100 animate-pulse" />
        )}

        {/* Actual image */}
        <img
          src={url}
          alt={name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`
            w-full h-auto transition-all duration-500
            ${loaded ? 'opacity-100' : 'opacity-0'}
            group-hover:scale-105
          `}
        />

        {/* Hover overlay with gradient */}
        {loaded && (
          <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
            {/* Info overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{name}</p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="p-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg transition-all ml-2"
                title={t('file.download')}
              >
                <Download className="w-4 h-4 text-white" />
              </button>
            </div>
            
            {/* Center zoom icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-full">
                <Eye className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-200"
          onClick={handleCloseLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all hover:scale-110 z-10"
            title={t('actions.close')}
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
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
              title={t('actions.zoomOut')}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              disabled={zoom >= 3}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all hover:scale-110 disabled:opacity-50 disabled:hover:scale-100"
              title={t('actions.zoomIn')}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="px-4 py-3 rounded-full bg-white/10 backdrop-blur-sm text-white text-sm font-medium">
              {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="absolute bottom-4 right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white transition-all hover:scale-110 z-10"
            title={t('file.download')}
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