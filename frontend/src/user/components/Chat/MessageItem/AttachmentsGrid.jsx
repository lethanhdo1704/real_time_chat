// frontend/src/user/components/Chat/MessageItem/AttachmentsGrid.jsx

import ImageAttachment from './ImageAttachment';
import VideoAttachment from './VideoAttachment';
import AudioAttachment from './AudioAttachment';
import FileAttachment from './FileAttachment';

/**
 * AttachmentsGrid Component - MESSENGER STYLE
 * 
 * Smart layout based on number of attachments:
 * - 1 file: Full width
 * - 2 files: 2 columns
 * - 3+ files: Grid 2x2
 * 
 * All attachments have beautiful gradient backgrounds
 */
export default function AttachmentsGrid({ attachments, isMe }) {
  if (!attachments || attachments.length === 0) return null;

  const renderAttachment = (attachment, index) => {
    const { mediaType } = attachment;

    switch (mediaType) {
      case 'image':
        return <ImageAttachment key={index} attachment={attachment} isMe={isMe} />;
      case 'video':
        return <VideoAttachment key={index} attachment={attachment} isMe={isMe} />;
      case 'audio':
        return <AudioAttachment key={index} attachment={attachment} isMe={isMe} />;
      case 'file':
      default:
        return <FileAttachment key={index} attachment={attachment} isMe={isMe} />;
    }
  };

  // Layout based on count
  const getGridClass = () => {
    const count = attachments.length;
    
    if (count === 1) {
      return 'flex flex-col gap-2';
    }
    
    if (count === 2) {
      return 'grid grid-cols-2 gap-2';
    }
    
    // 3+ files: 2x2 grid
    return 'grid grid-cols-2 gap-2';
  };

  return (
    <div className={getGridClass()}>
      {attachments.map((attachment, index) => renderAttachment(attachment, index))}
    </div>
  );
}