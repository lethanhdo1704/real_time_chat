// backend/services/message/unread.manager.js
import ConversationMember from "../../models/ConversationMember.js";

/**
 * Update sender's lastSeenMessage (unread = 0)
 */
export async function updateSenderRead(conversationId, senderId, messageId, session = null) {
  const query = {
    conversation: conversationId,
    user: senderId,
    leftAt: null,
  };

  const update = {
    lastSeenMessage: messageId,
    lastSeenAt: new Date(),
    unreadCount: 0, // Sender always has 0 unread
  };

  return session
    ? await ConversationMember.findOneAndUpdate(query, update, { session, new: true })
    : await ConversationMember.findOneAndUpdate(query, update, { new: true });
}

/**
 * Increment unread count for other members
 */
export async function incrementUnreadForOthers(conversationId, senderId, session = null) {
  const query = {
    conversation: conversationId,
    user: { $ne: senderId },
    leftAt: null,
  };

  const update = {
    $inc: { unreadCount: 1 },
  };

  return session
    ? await ConversationMember.updateMany(query, update, { session })
    : await ConversationMember.updateMany(query, update);
}

/**
 * Reset unread count to 0 for user
 */
export async function resetUnreadCount(conversationId, userId, lastMessageId, session = null) {
  const query = {
    conversation: conversationId,
    user: userId,
    leftAt: null,
  };

  const update = {
    lastSeenMessage: lastMessageId,
    lastSeenAt: new Date(),
    unreadCount: 0,
  };

  return session
    ? await ConversationMember.findOneAndUpdate(query, update, { session, new: true })
    : await ConversationMember.findOneAndUpdate(query, update, { new: true });
}

/**
 * 🔥 CRITICAL FIX: Get all members with their unread counts
 * Returns Map with PUBLIC UID as keys, NOT MongoDB _id
 */
export async function getMembersWithUnreadCounts(conversationId, session = null) {
  const query = {
    conversation: conversationId,
    leftAt: null,
  };

  // 🔥 FIX: Populate user to get public UID
  const members = session
    ? await ConversationMember.find(query)
        .populate('user', 'uid') // ⭐ Get public UID
        .session(session)
        .lean()
    : await ConversationMember.find(query)
        .populate('user', 'uid') // ⭐ Get public UID
        .lean();

  const memberUpdates = {};
  
  members.forEach((member) => {
    // 🔥 CRITICAL: Use public UID, NOT MongoDB _id
    const userUid = member.user?.uid;
    
    if (!userUid) {
      console.error('❌ [unread.manager] Member missing user.uid:', member);
      return;
    }
    
    memberUpdates[userUid] = {
      unreadCount: member.unreadCount,
      lastSeenMessage: member.lastSeenMessage,
    };
  });

  console.log(`✅ [unread.manager] Member updates for ${Object.keys(memberUpdates).length} users:`, 
    Object.keys(memberUpdates));

  return memberUpdates;
}