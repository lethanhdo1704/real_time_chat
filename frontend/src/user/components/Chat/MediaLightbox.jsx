// frontend/src/components/Chat/MediaLightbox.jsx
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ExternalLink } from 'lucide-react';

/**
 * MediaLightbox Component
 * 
 * Full-screen preview for media items from ConversationInfo
 * Supports: images, videos, files, links
 * 
 * Features:
 * ✅ Full screen overlay
 * ✅ Navigate between items (prev/next)
 * ✅ Close on ESC or click outside
 * ✅ Download button
 * ✅ Responsive
 */
export default function MediaLightbox({ 
  items = [], 
  initialIndex = 0, 
  onClose 
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentItem = items[currentIndex];
  const hasMultiple = items.length > 1;

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && hasMultiple) {
        handlePrev();
      } else if (e.key === 'ArrowRight' && hasMultiple) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, hasMultiple]);

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1));
  };

  const handleDownload = () => {
    if (!currentItem?.url) return;

    const link = document.createElement('a');
    link.href = currentItem.url;
    link.download = currentItem.name || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ============================================
  // RENDER CONTENT BY TYPE
  // ============================================
  const renderContent = () => {
    if (!currentItem) return null;

    const { type, url, thumbnailUrl, name } = currentItem;

    switch (type) {
      case 'image':
        return (
          <img
            src={url}
            alt={name || 'Image'}
            className="max-h-full max-w-full object-contain"
          />
        );

      case 'video':
        return (
          <video
            src={url}
            poster={thumbnailUrl}
            controls
            autoPlay
            className="max-h-full max-w-full"
          >
            Your browser does not support video playback.
          </video>
        );

      case 'audio':
        return (
          <div className="bg-white rounded-lg p-8 max-w-md">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{name}</p>
                <p className="text-sm text-gray-500">Audio File</p>
              </div>
            </div>
            <audio src={url} controls className="w-full">
              Your browser does not support audio playback.
            </audio>
          </div>
        );

      case 'file':
        return (
          <div className="bg-white rounded-lg p-8 max-w-md">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900 mb-1">{name}</p>
                <p className="text-sm text-gray-500">{currentItem.size || 'Unknown size'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Open
                </a>
              </div>
            </div>
          </div>
        );

      case 'link':
        return (
          <div className="bg-white rounded-lg p-8 max-w-md">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center">
                <ExternalLink className="w-10 h-10 text-purple-600" />
              </div>
              <div className="text-center">
                <p className="font-medium text-gray-900 mb-1">{name || 'Link'}</p>
                <p className="text-sm text-gray-500 break-all">{url}</p>
              </div>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Link
              </a>
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-white rounded-lg p-8">
            <p className="text-gray-500">Preview not available</p>
          </div>
        );
    }
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div 
      className="fixed inset-0 z-99999 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Download Button */}
      {currentItem?.type !== 'link' && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="absolute top-4 right-16 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-10"
        >
          <Download className="w-6 h-6" />
        </button>
      )}

      {/* Counter */}
      {hasMultiple && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-black/50 text-white rounded-full text-sm z-10">
          {currentIndex + 1} / {items.length}
        </div>
      )}

      {/* Previous Button */}
      {hasMultiple && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrev();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Content */}
      <div 
        className="flex items-center justify-center max-w-7xl max-h-[90vh] w-full p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {renderContent()}
      </div>

      {/* Next Button */}
      {hasMultiple && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Info */}
      {currentItem && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 bg-black/50 text-white rounded-full text-sm max-w-md truncate">
          {currentItem.name || 'Untitled'}
        </div>
      )}
    </div>
  );
}