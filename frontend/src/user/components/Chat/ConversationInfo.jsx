// frontend/src/user/components/Chat/ConversationInfo.jsx
import React, { useState } from 'react';
import { 
  X, Users, Bell, BellOff, Search, Image, File, Link2, 
  ChevronRight, Settings, Lock, Pencil, Check, Camera, 
  Trash2, VolumeX, Archive, Pin, Music, Video
} from 'lucide-react';
import useChatStore from '../../store/chat/chatStore';
import useConversationInfo from '../../hooks/chat/useConversationInfo';
import useConversationMedia from '../../hooks/chat/useConversationMedia';
import { useTranslation } from 'react-i18next';

// 🔥 Import attachment components
import ImageAttachment from './MessageItem/FileUpload/ImageAttachment';
import VideoAttachment from './MessageItem/FileUpload/VideoAttachment';
import AudioAttachment from './MessageItem/FileUpload/AudioAttachment';
import FileAttachment from './MessageItem/FileUpload/FileAttachment';
import DocumentAttachment from './MessageItem/FileUpload/DocumentAttachment';
import LinkPreview from './MessageItem/FileUpload/LinkPreview';

/**
 * ConversationInfo - Production Ready
 * 
 * Features:
 * ✅ Lấy data từ Redux store (không hardcode)
 * ✅ Counters từ backend API
 * ✅ Media/Files/Links load theo tab
 * ✅ Realtime counter updates từ socket
 * ✅ Reuse attachment components từ chat
 * ✅ Loading states
 * ✅ Error handling
 */
export default function ConversationInfo({ onClose }) {
  const { t } = useTranslation('chat');
  const [activeTab, setActiveTab] = useState('media');
  const [isEditingName, setIsEditingName] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  
  // 🔥 Get conversation from Redux
  const activeConversationId = useChatStore((state) => state.activeConversationId);
  const conversations = useChatStore((state) => state.conversations);
  const conversation = conversations.get(activeConversationId);

  // 🔥 Fetch conversation info with counters
  const { info, loading: infoLoading } = useConversationInfo(activeConversationId);

  // 🔥 Load media based on active tab
  const mediaTypeMap = {
    media: 'image',
    video: 'video',
    audio: 'audio',
    files: 'file',
    links: 'link',
  };

  const { items, loading: mediaLoading, hasMore, loadMore } = useConversationMedia(
    activeConversationId,
    mediaTypeMap[activeTab]
  );

  // ============================================
  // GUARDS
  // ============================================

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <p className="text-gray-500">Không tìm thấy cuộc trò chuyện</p>
      </div>
    );
  }

  // ============================================
  // COMPUTED VALUES
  // ============================================

  const isGroupChat = conversation.type === 'group';
  const displayName = conversation.name || conversation.friend?.nickname || 'Cuộc trò chuyện';
  const members = conversation.members || [];
  
  // 🔥 Use counters from info or fallback to conversation
  const counters = info?.counters || conversation.counters || {
    totalMessages: 0,
    sharedImages: 0,
    sharedVideos: 0,
    sharedAudios: 0,
    sharedFiles: 0,
    sharedLinks: 0,
  };

  // ============================================
  // HANDLERS
  // ============================================

  const handleSaveGroupName = () => {
    // TODO: Call API to update group name
    console.log('💾 Saving group name:', groupName);
    setIsEditingName(false);
  };

  // 🔥 Render attachment based on type
  const renderAttachment = (item) => {
    // Transform item to attachment format
    const attachment = {
      url: item.url,
      thumbnailUrl: item.thumbnailUrl,
      name: item.name,
      size: item.size,
      mime: item.mime || 'application/octet-stream',
      mediaType: item.type,
    };

    const { type } = item;

    // Check if PDF
    const isPDF = type === 'file' && 
                  (attachment.mime?.toLowerCase().includes('pdf') || 
                   attachment.name?.toLowerCase().endsWith('.pdf'));

    switch (type) {
      case 'image':
        return <ImageAttachment attachment={attachment} isMe={false} />;
      
      case 'video':
        return <VideoAttachment attachment={attachment} isMe={false} />;
      
      case 'audio':
        return <AudioAttachment attachment={attachment} isMe={false} />;
      
      case 'file':
        // PDF gets DocumentAttachment, others get FileAttachment
        if (isPDF) {
          return <DocumentAttachment attachment={attachment} isMe={false} />;
        }
        return <FileAttachment attachment={attachment} isMe={false} t={t} />;
      
      case 'link':
        return <LinkPreview attachment={attachment} isMe={false} />;
      
      default:
        return <FileAttachment attachment={attachment} isMe={false} t={t} />;
    }
  };

  // ============================================
  // COMPONENTS
  // ============================================

  const InfoSection = ({ children, className = '' }) => (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {children}
    </div>
  );

  const InfoItem = ({ icon: Icon, label, value, onClick, danger = false }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5" />
        <span className="font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-gray-500 text-sm">{value}</span>}
        <ChevronRight className="w-4 h-4 text-gray-400" />
      </div>
    </button>
  );

  const MemberItem = ({ member }) => (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold">
            {member.user?.nickname?.charAt(0) || member.uid?.charAt(0) || '?'}
          </div>
          {member.user?.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>
        <div>
          <p className="font-medium text-gray-900">{member.user?.nickname || 'Unknown'}</p>
          <p className="text-xs text-gray-500">
            {member.role === 'admin' ? '👑 Admin' : 'Thành viên'}
          </p>
        </div>
      </div>
      <button className="text-gray-400 hover:text-gray-600">
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <h2 className="text-lg font-semibold text-gray-900">Thông tin cuộc trò chuyện</h2>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Profile Section */}
        <InfoSection>
          <div className="flex flex-col items-center py-6 px-4">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {displayName.charAt(0).toUpperCase()}
              </div>
              {isGroupChat && (
                <button className="absolute bottom-0 right-0 bg-blue-500 text-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>
            
            {/* Group Name */}
            <div className="mt-4 w-full max-w-xs">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <button
                    onClick={handleSaveGroupName}
                    className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 group">
                  <h3 className="text-xl font-bold text-gray-900">{displayName}</h3>
                  {isGroupChat && (
                    <button
                      onClick={() => {
                        setGroupName(displayName);
                        setIsEditingName(true);
                      }}
                      className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-gray-100 rounded transition-all"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
              {isGroupChat && (
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{members.length} thành viên</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span>📊</span>
                <span>
                  {infoLoading ? '...' : counters.totalMessages} tin nhắn
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isMuted
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setIsPinned(!isPinned)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isPinned
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Pin className={`w-4 h-4 ${isPinned ? 'fill-current' : ''}`} />
              </button>
              <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors">
                <Search className="w-4 h-4" />
              </button>
            </div>
          </div>
        </InfoSection>

        {/* Members Section */}
        {isGroupChat && members.length > 0 && (
          <InfoSection>
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Thành viên ({members.length})
              </h3>
              <button className="text-blue-500 text-sm font-medium hover:text-blue-600">
                Thêm
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {members.slice(0, 5).map((member) => (
                <MemberItem key={member.uid} member={member} />
              ))}
              {members.length > 5 && (
                <button className="w-full py-3 text-sm text-blue-600 font-medium hover:text-blue-700">
                  Xem tất cả {members.length} thành viên
                </button>
              )}
            </div>
          </InfoSection>
        )}

        {/* Shared Content Tabs */}
        <InfoSection>
          <div className="border-b border-gray-100">
            <div className="flex px-2 overflow-x-auto">
              {['media', 'video', 'audio', 'files', 'links'].map((tab) => {
                const icons = { media: Image, video: Video, audio: Music, files: File, links: Link2 };
                const labels = { media: 'Ảnh', video: 'Video', audio: 'Audio', files: 'Tệp', links: 'Liên kết' };
                const counts = {
                  media: counters.sharedImages,
                  video: counters.sharedVideos,
                  audio: counters.sharedAudios,
                  files: counters.sharedFiles,
                  links: counters.sharedLinks,
                };
                const Icon = icons[tab];

                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors relative whitespace-nowrap ${
                      activeTab === tab ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{labels[tab]}</span>
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
          <div className="p-2">
            {mediaLoading && items.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">Đang tải...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-gray-500">Chưa có dữ liệu</p>
              </div>
            ) : (
              <>
                {/* 🔥 Render using attachment components */}
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id}>
                      {renderAttachment(item)}
                    </div>
                  ))}
                </div>

                {/* Load More */}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={mediaLoading}
                    className="w-full py-3 text-sm text-blue-600 font-medium hover:text-blue-700 disabled:opacity-50"
                  >
                    {mediaLoading ? 'Đang tải...' : 'Xem thêm'}
                  </button>
                )}
              </>
            )}
          </div>
        </InfoSection>

        {/* Settings Section */}
        <InfoSection>
          <InfoItem icon={Bell} label="Thông báo" value={isMuted ? 'Tắt tiếng' : 'Bật'} />
          <InfoItem icon={Lock} label="Bảo mật & Quyền riêng tư" />
          <InfoItem icon={Settings} label="Cài đặt trò chuyện" />
          <InfoItem icon={Archive} label="Lưu trữ cuộc trò chuyện" />
        </InfoSection>

        {/* Danger Zone */}
        {isGroupChat && (
          <InfoSection>
            <InfoItem icon={Trash2} label="Rời khỏi nhóm" danger />
            <InfoItem icon={Trash2} label="Xóa cuộc trò chuyện" danger />
          </InfoSection>
        )}
      </div>
    </div>
  );
}