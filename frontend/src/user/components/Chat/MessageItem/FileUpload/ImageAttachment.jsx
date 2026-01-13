// frontend/src/user/components/Chat/MessageItem/FileUpload/ImageAttachment.jsx

import { useState } from 'react';
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * ImageAttachment Component - SIMPLE CLEAN STYLE
 * 
 * Features:
 * - Clean, minimal design
 * - Lightbox with zoom controls
 * - Download functionality
 * - No fancy effects
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
      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
        <p className="text-sm text-red-600">{t('file.loadError')}</p>
      </div>
    );
  }

  return (
    <>
      {/* Image Thumbnail */}
      <div 
        className="relative rounded-xl overflow-hidden cursor-pointer max-w-sm border border-gray-200 hover:border-gray-300 transition-colors"
        onClick={handleImageClick}
      >
        {/* Loading placeholder */}
        {!loaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}

        {/* Actual image */}
        <img
          src={url}
          alt={name}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`
            w-full h-auto
            ${loaded ? 'opacity-100' : 'opacity-0'}
          `}
        />
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={handleCloseLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close button */}
          <button
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            title={t('actions.close')}
          >
            <X className="w-6 h-6" />
          </button>

          {/* Zoom controls */}
          <div className="absolute top-4 left-4 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              disabled={zoom <= 0.5}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
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
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
              title={t('actions.zoomIn')}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            <div className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm">
              {Math.round(zoom * 100)}%
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="absolute bottom-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
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
          <div className="absolute bottom-4 left-4 px-4 py-2 rounded-lg bg-white/10 text-white text-sm max-w-md truncate">
            {name}
          </div>
        </div>
      )}
    </>
  );
}