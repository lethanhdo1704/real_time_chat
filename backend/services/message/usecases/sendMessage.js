// backend/services/message/usecases/sendMessage.js

import {
  isValidObjectId,
  verifyConversationAccess,
  verifyReplyToMessage,
} from "../validators.js";
import {
  createMessage,
  formatMessageResponse,
} from "../message.creator.js";
import {
  updateSenderRead,
  incrementUnreadForOthers,
  getMembersWithUnreadCounts,
} from "../unread.manager.js";
import {
  updateConversationLastMessage,
} from "../conversation.helper.js";
import conversationService from "../../conversation/conversation.service.js";
import socketEmitter from "../../socketEmitter.service.js";
import { ValidationError } from "../../../middleware/errorHandler.js";

/**
 * 🔥 SEND MESSAGE USE CASE - WITH LINK ATTACHMENTS SUPPORT
 * 
 * Business rules:
 * - Must be a member of the conversation
 * - ReplyTo message must exist and be in same conversation
 * - Attachments can include files AND links
 * - Updates unread counts for other members
 * - Updates conversation counters (totalMessages, sharedImages, etc.)
 * - Emits to CONVERSATION ROOM (not individual users)
 * - Emits unread counts separately to USER ROOMS
 * 
 * ✅ IMPROVED: Better link validation (supports localhost, IPs)
 */
export async function sendMessage({
  conversationId,
  senderId,
  content,
  clientMessageId,
  type = "text",
  replyTo = null,
  attachments = [], // 🔥 Can now include links
}) {
  if (!isValidObjectId(conversationId)) {
    throw new ValidationError("Invalid conversationId");
  }

  // ============================================
  // 🔥 VALIDATE ATTACHMENTS (FILES + LINKS)
  // ============================================
  if (attachments && attachments.length > 0) {
    console.log('🔍 [SendMessage] Validating attachments:', {
      total: attachments.length,
      types: attachments.map(a => a.mediaType),
    });

    for (const att of attachments) {
      // Basic structure check
      if (!att.url || !att.mediaType || !att.name) {
        throw new ValidationError('Invalid attachment format: missing required fields (url, mediaType, name)');
      }

      // Validate mime type exists
      if (!att.mime) {
        throw new ValidationError('Invalid attachment format: missing mime type');
      }

      // ============================================
      // 🔥 LINK-SPECIFIC VALIDATION (IMPROVED)
      // ============================================
      if (att.mediaType === 'link') {
        // Must have valid URL
        if (!att.url.startsWith('http://') && !att.url.startsWith('https://')) {
          throw new ValidationError('Invalid link URL: must start with http:// or https://');
        }

        // Must have correct properties for links
        if (att.mime !== 'text/url') {
          throw new ValidationError('Invalid link mime type: must be text/url');
        }

        if (att.size !== 0) {
          throw new ValidationError('Invalid link size: must be 0');
        }

        // ✅ IMPROVED: URL format validation with localhost/IP support
        try {
          const urlObj = new URL(att.url);
          const hostname = urlObj.hostname;
          
          // Must have valid hostname
          if (!hostname || hostname.length === 0) {
            throw new ValidationError('Invalid link URL: missing hostname');
          }
          
          // ✅ Allow localhost (development)
          const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
          
          // ✅ Allow valid IP addresses
          const isValidIP = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) && 
            hostname.split('.').map(Number).every(part => part >= 0 && part <= 255);
          
          // If not localhost or IP, apply standard domain validation
          if (!isLocalhost && !isValidIP) {
            // Must not be just numbers
            if (/^\d+$/.test(hostname)) {
              throw new ValidationError('Invalid link URL: hostname cannot be just numbers');
            }
            
            // Must have at least one dot (domain.tld)
            if (!hostname.includes('.')) {
              throw new ValidationError('Invalid link URL: invalid hostname format');
            }
            
            // Additional validation: valid characters only
            if (!/^[a-zA-Z0-9.-]+$/.test(hostname)) {
              throw new ValidationError('Invalid link URL: hostname contains invalid characters');
            }
            
            // Cannot start/end with dot or hyphen
            if (/^[.-]|[.-]$/.test(hostname)) {
              throw new ValidationError('Invalid link URL: hostname cannot start/end with dot or hyphen');
            }
            
            // No consecutive dots
            if (/\.\./.test(hostname)) {
              throw new ValidationError('Invalid link URL: hostname cannot have consecutive dots');
            }
          }
          
          console.log('✅ [SendMessage] Link attachment validated:', {
            url: att.url,
            name: att.name,
            hostname,
            type: isLocalhost ? 'localhost' : isValidIP ? 'IP' : 'domain',
          });
          
        } catch (err) {
          if (err instanceof ValidationError) throw err;
          throw new ValidationError(`Invalid link URL format: ${err.message}`);
        }
      }
      
      // ============================================
      // FILE ATTACHMENT VALIDATION (EXISTING)
      // ============================================
      else if (['image', 'video', 'audio', 'file'].includes(att.mediaType)) {
        // Size must be positive for files
        if (!att.size || att.size <= 0) {
          throw new ValidationError('Invalid file size: must be greater than 0');
        }

        // URL should be valid
        if (!att.url.startsWith('http://') && !att.url.startsWith('https://')) {
          throw new ValidationError('Invalid file URL');
        }

        console.log('✅ [SendMessage] File attachment validated:', {
          url: att.url,
          name: att.name,
          type: att.mediaType,
          size: att.size,
        });
      }
      
      // Unknown mediaType
      else {
        throw new ValidationError(`Unknown attachment mediaType: ${att.mediaType}`);
      }
    }

    console.log('✅ [SendMessage] All attachments validated:', {
      total: attachments.length,
      files: attachments.filter(a => a.mediaType !== 'link').length,
      links: attachments.filter(a => a.mediaType === 'link').length,
    });
  }

  try {
    // 1️⃣ Verify access
    const { conversation, member } = await verifyConversationAccess(
      conversationId,
      senderId,
      null
    );

    // 1.5️⃣ Verify replyTo message if provided
    if (replyTo) {
      await verifyReplyToMessage(replyTo, conversationId, null);
      console.log("✅ [SendMessage] Reply-to message validated:", replyTo);
    }

    // 2️⃣ Create message
    const message = await createMessage({
      conversationId,
      senderId,
      content,
      clientMessageId,
      type,
      replyTo,
      attachments, // 🔥 Now includes links
      session: null,
    });

    console.log("✅ [SendMessage] Message created:", {
      messageId: message._id,
      hasContent: !!content && content.trim().length > 0,
      hasAttachments: attachments.length > 0,
      attachmentBreakdown: {
        files: attachments.filter(a => a.mediaType !== 'link').length,
        links: attachments.filter(a => a.mediaType === 'link').length,
      },
    });

    // 3️⃣ Update conversation's lastMessage
    await updateConversationLastMessage(
      conversationId,
      message._id,
      message.createdAt,
      null
    );

    // 🔥 3.5️⃣ UPDATE COUNTERS (includes link counting)
    // ✅ Atomic update - no race condition
    // ✅ Đếm attachments theo mediaType (including 'link')
    await conversationService.updateAfterSendMessage(conversationId, message);

    // 4️⃣ Update sender's read status (unread = 0)
    await updateSenderRead(conversationId, senderId, message._id, null);

    // 5️⃣ Increment unread for others
    await incrementUnreadForOthers(conversationId, senderId, null);

    // 6️⃣ Format response
    const messageResponse = formatMessageResponse(message);

    // 7️⃣ Get all members with updated unread counts
    const memberUpdates = await getMembersWithUnreadCounts(conversationId);

    // 8️⃣ Emit to conversation room
    socketEmitter.emitNewMessage(
      conversationId.toString(),
      messageResponse,
      memberUpdates
    );

    console.log("✅ [SendMessage] Message sent successfully:", {
      messageId: messageResponse.messageId,
      conversationId: conversationId.toString(),
      isReply: !!messageResponse.replyTo,
      replyToId: messageResponse.replyTo?.messageId,
      hasAttachments: messageResponse.attachments?.length > 0,
      attachmentsCount: messageResponse.attachments?.length || 0,
      attachmentBreakdown: {
        files: messageResponse.attachments?.filter(a => a.mediaType !== 'link').length || 0,
        links: messageResponse.attachments?.filter(a => a.mediaType === 'link').length || 0,
      },
      linkUrls: messageResponse.attachments
        ?.filter(a => a.mediaType === 'link')
        .map(a => a.url) || [],
      membersNotified: Object.keys(memberUpdates).length,
    });

    return { message: messageResponse };
  } catch (error) {
    console.error("❌ [SendMessage] Error:", error);
    throw error;
  }
}