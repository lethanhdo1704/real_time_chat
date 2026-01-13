// frontend/src/user/components/Chat/MessageItem/FileUpload/AttachmentsGrid.jsx

import ImageAttachment from './ImageAttachment';
import VideoAttachment from './VideoAttachment';
import AudioAttachment from './AudioAttachment';
import DocumentAttachment from './DocumentAttachment';
import FileAttachment from './FileAttachment';

/**
 * AttachmentsGrid Component
 * 
 * Renders different attachment types:
 * - image → ImageAttachment (green)
 * - video → VideoAttachment (violet)
 * - audio → AudioAttachment (orange)
 * - document → DocumentAttachment (blue) - PDF only
 * - file → FileAttachment (various colors based on type)
 */
export default function AttachmentsGrid({ attachments, isMe, t }) {
  if (!attachments || attachments.length === 0) return null;

  const renderAttachment = (attachment, index) => {
    const { mediaType, mime, name } = attachment;

    const commonProps = { attachment, isMe, t };

    // Check if it's a PDF (for DocumentAttachment)
    const isPDF = mediaType === 'document' || 
                  mime?.toLowerCase().includes('pdf') || 
                  name?.toLowerCase().endsWith('.pdf');

    switch (mediaType) {
      case 'image':
        return <ImageAttachment key={index} {...commonProps} />;
      
      case 'video':
        return <VideoAttachment key={index} {...commonProps} />;
      
      case 'audio':
        return <AudioAttachment key={index} {...commonProps} />;
      
      case 'document':
        // PDF gets special DocumentAttachment component
        if (isPDF) {
          return <DocumentAttachment key={index} {...commonProps} />;
        }
        // Other documents (Word, etc.) go to FileAttachment
        return <FileAttachment key={index} {...commonProps} />;
      
      case 'file':
      default:
        // Double-check for PDF in generic "file" type
        if (isPDF) {
          return <DocumentAttachment key={index} {...commonProps} />;
        }
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