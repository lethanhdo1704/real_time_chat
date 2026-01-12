// frontend/src/user/components/Chat/MessageItem/FileUpload/AttachmentsGrid.jsx

import ImageAttachment from './ImageAttachment';
import VideoAttachment from './VideoAttachment';
import AudioAttachment from './AudioAttachment';
import FileAttachment from './FileAttachment';

export default function AttachmentsGrid({ attachments, isMe, t }) {
  if (!attachments || attachments.length === 0) return null;

  const renderAttachment = (attachment, index) => {
    const { mediaType } = attachment;

    const commonProps = { attachment, isMe, t };

    switch (mediaType) {
      case 'image':
        return <ImageAttachment key={index} {...commonProps} />;
      case 'video':
        return <VideoAttachment key={index} {...commonProps} />;
      case 'audio':
        return <AudioAttachment key={index} {...commonProps} />;
      case 'file':
      default:
        return <FileAttachment key={index} {...commonProps} />;
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
    <div className={`${getGridClass()} animate-in slide-in-from-bottom duration-300`}>
      {attachments.map((attachment, index) => renderAttachment(attachment, index))}
    </div>
  );
}