// frontend/src/components/Chat/ConversationInfo/MediaRenderer.jsx

import React from 'react';
import ImageAttachment from '../MessageItem/FileUpload/ImageAttachment';
import VideoAttachment from '../MessageItem/FileUpload/VideoAttachment';
import AudioAttachment from '../MessageItem/FileUpload/AudioAttachment';
import FileAttachment from '../MessageItem/FileUpload/FileAttachment';
import DocumentAttachment from '../MessageItem/FileUpload/DocumentAttachment';
import LinkPreview from '../MessageItem/FileUpload/LinkPreview';

export default function MediaRenderer({ item, activeTab, t }) {
  const attachment = {
    url: item.url,
    thumbnailUrl: item.thumbnailUrl,
    name: item.name,
    size: item.size,
    mime: item.mime || 'application/octet-stream',
    mediaType: item.type,
  };

  const { type } = item;
  const isPDF = type === 'file' && 
                (attachment.mime?.toLowerCase().includes('pdf') || 
                 attachment.name?.toLowerCase().endsWith('.pdf'));

  const isGridMode = activeTab === 'media';

  switch (type) {
    case 'image':
      return <ImageAttachment attachment={attachment} isMe={false} isGridMode={isGridMode} />;
    
    case 'video':
      return <VideoAttachment attachment={attachment} isMe={false} isCompact={true} />;
    
    case 'audio':
      return <AudioAttachment attachment={attachment} isMe={false} isCompact={true} />;
    
    case 'file':
      if (isPDF) {
        return <DocumentAttachment attachment={attachment} isMe={false} isCompact={true} />;
      }
      return <FileAttachment attachment={attachment} isMe={false} t={t} isCompact={true} />;
    
    case 'link':
      return <LinkPreview attachment={attachment} isMe={false} />;
    
    default:
      return <FileAttachment attachment={attachment} isMe={false} t={t} isCompact={true} />;
  }
}