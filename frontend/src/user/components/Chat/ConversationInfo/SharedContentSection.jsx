// frontend/src/components/Chat/ConversationInfo/SharedContentSection.jsx

import React from 'react';
import { Image, Video, Music, File, Link2, ChevronDown } from 'lucide-react';
import useConversationMedia from '../../../hooks/chat/useConversationMedia';
import InfoSection from './InfoSection';
import MediaRenderer from './MediaRenderer';

export default function SharedContentSection({
  activeTab,
  setActiveTab,
  activeConversationId,
  counters,
  infoLoading,
  t,
}) {
  const mediaTypeMap = {
    media: 'image',
    video: 'video',
    audio: 'audio',
    files: 'file',
    links: 'link',
  };

  const getItemsPerRow = () => {
    switch (activeTab) {
      case 'media': return 3;
      case 'video': return 2;
      case 'audio':
      case 'files':
      case 'links':
        return 1;
      default: return 1;
    }
  };

  const initialLimit = getItemsPerRow() * 2;

  const { items, loading: mediaLoading, hasMore, loadMore } = useConversationMedia(
    activeConversationId,
    mediaTypeMap[activeTab],
    initialLimit
  );

  const getGridLayout = () => {
    switch (activeTab) {
      case 'media':
        return 'grid grid-cols-3 gap-0';
      case 'video':
        return 'grid grid-cols-2 gap-2';
      case 'audio':
        return 'space-y-2';
      case 'files':
        return 'space-y-2';
      case 'links':
        return 'space-y-3';
      default:
        return 'space-y-2';
    }
  };

  const tabs = ['media', 'video', 'audio', 'files', 'links'];
  const icons = { 
    media: Image, 
    video: Video, 
    audio: Music, 
    files: File, 
    links: Link2 
  };
  const counts = {
    media: counters.sharedImages,
    video: counters.sharedVideos,
    audio: counters.sharedAudios,
    files: counters.sharedFiles,
    links: counters.sharedLinks,
  };

  return (
    <InfoSection>
      {/* Tabs */}
      <div className="border-b border-gray-100">
        <div className="flex px-2 overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = icons[tab];

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap cursor-pointer ${
                  activeTab === tab ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Icon className="w-4 h-4" />
                  <span>{t(`tabs.${tab}`)}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">
                    {infoLoading ? '...' : counts[tab]}
                  </span>
                </div>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {mediaLoading && items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-gray-500 text-sm">{t('loading')}</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              {activeTab === 'media' && <Image className="w-8 h-8 text-gray-400" />}
              {activeTab === 'video' && <Video className="w-8 h-8 text-gray-400" />}
              {activeTab === 'audio' && <Music className="w-8 h-8 text-gray-400" />}
              {activeTab === 'files' && <File className="w-8 h-8 text-gray-400" />}
              {activeTab === 'links' && <Link2 className="w-8 h-8 text-gray-400" />}
            </div>
            <p className="text-gray-500 text-sm">{t('noData')}</p>
          </div>
        ) : (
          <>
            <div className={getGridLayout()}>
              {items.map((item) => (
                <div 
                  key={item.id} 
                  className={`
                    relative
                    overflow-hidden
                    bg-white 
                    hover:opacity-90
                    transition-opacity
                    ${activeTab === 'media' ? 'aspect-square border border-black cursor-pointer' : 'cursor-pointer'}
                  `}
                >
                  <MediaRenderer item={item} activeTab={activeTab} t={t} />
                </div>
              ))}
            </div>

            {hasMore && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={loadMore}
                  disabled={mediaLoading}
                  className="group relative px-6 py-2.5 bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 cursor-pointer"
                >
                  {mediaLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t('loadingMore')}</span>
                    </>
                  ) : (
                    <>
                      <span>{t('loadMore')}</span>
                      <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </InfoSection>
  );
}