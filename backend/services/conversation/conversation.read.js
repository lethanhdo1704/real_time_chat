// backend/services/conversation/conversation.read.js
import Conversation from "../../models/Conversation.js";
import ConversationMember from "../../models/ConversationMember.js";
import User from "../../models/User.js";
import socketEmitter from "../socketEmitter.service.js";

/**
 * Conversation Read Service - WITH READ RECEIPTS
 * 
 * Handles marking conversations as read and broadcasting read receipts
 * 
 * 🎯 LOGIC CHUẨN:
 * - Chỉ update khi có lastMessage
 * - Chỉ update khi lastMessage khác lastSeenMessage (có tin mới)
 * - Guard chặn spam calls
 * - Semantics đúng: "đã đọc" = "đã đọc tin mới"
 * - 🆕 EMIT socket event for read receipts (message_read_receipt)
 * 
 * @class ConversationReadService
 */
class ConversationReadService {
  /**
   * Mark conversation as read
   * 
   * Flow:
   * 1. Get user info (uid, nickname, avatar)
   * 2. Verify membership
   * 3. Get conversation's lastMessage
   * 4. Guard: Skip if no messages
   * 5. Guard: Skip if already read
   * 6. Update DB (lastSeenMessage, unreadCount=0)
   * 7. 🔥 Emit socket event (message_read_receipt)
   * 8. Return result
   * 
   * @param {string} conversationId - Conversation ID (MongoDB ObjectId)
   * @param {string} userUid - User's public UID
   * @returns {Promise<Object>} Result { success, conversationId, unreadCount, lastSeenMessageId, lastSeenAt, updated }
   */
  async markAsRead(conversationId, userUid) {
    try {
      console.log('📖 [ConversationRead] markAsRead called:', { conversationId, userUid });

      // ============================================
      // 1️⃣ CONVERT UID → _ID & GET USER INFO
      // ============================================
      const currentUser = await User.findOne({ uid: userUid })
        .select('_id uid nickname avatar')
        .lean();

      if (!currentUser) {
        throw new Error('User not found');
      }

      const userId = currentUser._id;

      console.log('✅ [ConversationRead] User found:', {
        userId: userId.toString(),
        uid: currentUser.uid,
        nickname: currentUser.nickname,
      });

      // ============================================
      // 2️⃣ VERIFY MEMBERSHIP
      // ============================================
      const member = await ConversationMember.findOne({
        conversation: conversationId,
        user: userId,
        leftAt: null
      }).select('lastSeenMessage lastSeenAt unreadCount').lean();

      if (!member) {
        throw new Error("Not a member of this conversation");
      }

      console.log('✅ [ConversationRead] Current member state:', {
        lastSeenMessage: member.lastSeenMessage,
        unreadCount: member.unreadCount,
        lastSeenAt: member.lastSeenAt
      });

      // ============================================
      // 3️⃣ GET LAST MESSAGE
      // ============================================
      const conversation = await Conversation.findById(conversationId)
        .select('lastMessage')
        .lean();

      const lastMessageId = conversation?.lastMessage || null;

      console.log('📨 [ConversationRead] Conversation lastMessage:', lastMessageId);

      // ============================================
      // 4️⃣ GUARD 1: NO MESSAGE IN CONVERSATION
      // Không có tin nhắn nào → không cần update
      // ============================================
      if (!lastMessageId) {
        console.log('⏩ [ConversationRead] No messages in conversation, skipping update');
        return {
          success: true,
          conversationId: conversationId.toString(),
          unreadCount: member.unreadCount || 0,
          lastSeenMessageId: member.lastSeenMessage?.toString() || null,
          lastSeenAt: member.lastSeenAt || null,
          updated: false
        };
      }

      // ============================================
      // 5️⃣ GUARD 2: ALREADY READ
      // lastSeenMessage đã là lastMessage → không có tin mới
      // ============================================
      if (
        member.lastSeenMessage && 
        member.lastSeenMessage.toString() === lastMessageId.toString()
      ) {
        console.log('⏩ [ConversationRead] Already read latest message, skipping update');
        return {
          success: true,
          conversationId: conversationId.toString(),
          unreadCount: 0,
          lastSeenMessageId: member.lastSeenMessage.toString(),
          lastSeenAt: member.lastSeenAt,
          updated: false
        };
      }

      // ============================================
      // 6️⃣ UPDATE DB (CHỈ KHI CÓ TIN MỚI)
      // ============================================
      console.log('🔄 [ConversationRead] Updating member: new message detected');
      
      const updatedMember = await ConversationMember.markAsRead(
        conversationId,
        userId,
        lastMessageId
      );

      if (!updatedMember) {
        throw new Error("Failed to mark as read");
      }

      console.log('✅ [ConversationRead] Member updated successfully:', {
        oldLastSeen: member.lastSeenMessage,
        newLastSeen: updatedMember.lastSeenMessage,
        oldUnread: member.unreadCount,
        newUnread: updatedMember.unreadCount,
        lastSeenAt: updatedMember.lastSeenAt
      });

      // ============================================
      // 7️⃣ 🔥 EMIT READ RECEIPT SOCKET EVENT
      // Broadcast to conversation room so other members see avatar
      // ============================================
      try {
        socketEmitter.emitReadReceipt(
          conversationId.toString(),
          userUid,
          updatedMember.lastSeenMessage.toString()
        );

        console.log('📡 [ConversationRead] Read receipt emitted:', {
          conversationId: conversationId.toString(),
          userUid,
          lastSeenMessageId: updatedMember.lastSeenMessage.toString(),
        });
      } catch (socketError) {
        // Don't fail the request if socket emit fails
        console.error('⚠️ [ConversationRead] Socket emit failed:', socketError.message);
      }

      // ============================================
      // 8️⃣ RETURN COMPLETE DATA
      // ============================================
      return {
        success: true,
        conversationId: conversationId.toString(),
        unreadCount: 0,
        lastSeenMessageId: updatedMember.lastSeenMessage.toString(),
        lastSeenAt: updatedMember.lastSeenAt,
        updated: true
      };

    } catch (error) {
      console.error("❌ [ConversationRead] markAsRead error:", error);
      throw error;
    }
  }
}

export default new ConversationReadService();