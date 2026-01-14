// frontend/src/user/components/Chat/MessageItem/FileUpload/ImageAttachment.jsx

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom'; // 🔥 Import Portal
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * ImageAttachment Component - FIXED với React Portal
 * 
 * ✅ FIXED: Lightbox render ở document.body thay vì trong grid item
 * ✅ FIXED: Không bị parent overflow/transform ảnh hưởng
 * ✅ FIXED: Body lock khi lightbox mở
 * ✅ Full image coverage trong grid mode
 * ✅ Zoom controls
 * ✅ Download functionality
 */
export default function ImageAttachment({ attachment, isMe, isGridMode = false }) {
  const { t } = useTranslation("chat");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showLightbox, setShowLightbox] = useState(false);
  const [zoom, setZoom] = useState(1);

  const { url, name } = attachment;

  // ============================================
  // 🔥 LOCK BODY WHEN LIGHTBOX OPEN
  // ============================================
  useEffect(() => {
    if (showLightbox) {
      const originalOverflow = document.body.style.overflow;
      const originalPointerEvents = document.body.style.pointerEvents;
      
      document.body.style.overflow = 'hidden';
      document.body.style.pointerEvents = 'none';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.pointerEvents = originalPointerEvents;
      };
    }
  }, [showLightbox]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleImageClick = (e) => {
    e.stopPropagation();
    setShowLightbox(true);
    setZoom(1);
  };

  const handleCloseLightbox = (e) => {
    e?.stopPropagation();
    setShowLightbox(false);
    setZoom(1);
  };

  const handleZoomIn = (e) => {
    e.stopPropagation();
    setZoom(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = (e) => {
    e.stopPropagation();
    setZoom(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleDownload = async (e) => {
    e.stopPropagation();
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = name || 'image';
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
    if (e.key === '+' || e.key === '=') handleZoomIn(e);
    if (e.key === '-') handleZoomOut(e);
  };

  // ============================================
  // RENDER: Error State
  // ============================================

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-xl border border-red-200">
        <p className="text-sm text-red-600">{t('file.loadError')}</p>
      </div>
    );
  }

  // ============================================
  // 🔥 LIGHTBOX COMPONENT - Will be rendered via Portal
  // ============================================
  const LightboxContent = () => (
    <div 
      className="fixed inset-0 bg-black/90 flex items-center justify-center"
      style={{ 
        zIndex: 999999, // Siêu cao để đè lên mọi thứ
        pointerEvents: 'auto' // Đảm bảo có thể click
      }}
      onClick={handleCloseLightbox}
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Close button */}
      <button
        onClick={handleCloseLightbox}
        className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        title={t('actions.close') || 'Close'}
      >
        <X className="w-6 h-6" />
      </button>

      {/* Zoom controls */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 0.5}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('actions.zoomOut') || 'Zoom out'}
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 3}
          className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('actions.zoomIn') || 'Zoom in'}
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <div className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm pointer-events-none">
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="absolute bottom-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
        title={t('file.download') || 'Download'}
      >
        <Download className="w-6 h-6" />
      </button>

      {/* Image */}
      <img
        src={url}
        alt={name || 'Image'}
        onClick={(e) => e.stopPropagation()}
        className="max-w-[90vw] max-h-[90vh] object-contain transition-transform duration-200 pointer-events-none select-none"
        style={{ transform: `scale(${zoom})` }}
        draggable={false}
      />

      {/* Filename */}
      {name && (
        <div className="absolute bottom-4 left-4 px-4 py-2 rounded-lg bg-white/10 text-white text-sm max-w-md truncate pointer-events-none">
          {name}
        </div>
      )}
    </div>
  );

  // ============================================
  // RENDER: Main Component
  // ============================================

  return (
    <>
      {/* Image Thumbnail */}
      <div 
        className={`
          overflow-hidden cursor-pointer
          ${isGridMode 
            ? 'absolute inset-0' 
            : 'relative rounded-xl max-w-sm border border-gray-200 hover:border-gray-300'
          }
          transition-colors
        `}
        onClick={handleImageClick}
      >
        {/* Loading placeholder */}
        {!loaded && (
          <div className="absolute inset-0 bg-gray-100 animate-pulse" />
        )}

        {/* Actual image */}
        <img
          src={url}
          alt={name || 'Image'}
          loading="lazy"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`
            block
            ${isGridMode 
              ? 'w-full h-full object-cover' 
              : 'w-full h-auto'
            }
            ${loaded ? 'opacity-100' : 'opacity-0'}
            transition-opacity
          `}
        />
      </div>

      {/* 🔥 Render Lightbox via Portal - Ở NGOÀI DOM hierarchy */}
      {showLightbox && createPortal(
        <LightboxContent />,
        document.body // Render trực tiếp vào body
      )}
    </>
  );
}