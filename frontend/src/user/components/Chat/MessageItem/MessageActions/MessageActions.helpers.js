import useChatStore from "../../../../store/chat/chatStore";

/**
 * Update conversation's lastMessage after hide/delete/recall
 * Finds the last visible message and updates the conversation
 */
export const updateConversationLastMessage = (conversationId, removedMessageId) => {
  const { conversations, messages, updateConversation } = useChatStore.getState();

  const conversation = conversations.get(conversationId);
  if (!conversation?.lastMessage) {
    console.log("⏭️ No lastMessage in conversation, skip update");
    return;
  }

  const lastMessageId = conversation.lastMessage.messageId || conversation.lastMessage._id;

  // Only update if the removed message was the lastMessage
  if (lastMessageId !== removedMessageId) {
    console.log("⏭️ Removed message is not lastMessage, no update needed");
    return;
  }

  console.log("🔥 Removed message IS lastMessage - finding alternative");

  // Get conversation messages
  const conversationMessages = messages.get(conversationId) || [];

  // Find the last visible message (not the one we just removed)
  const visibleMessages = conversationMessages.filter((msg) => {
    const msgId = msg.messageId || msg._id;
    return (
      msgId !== removedMessageId && // Not the removed message
      !msg.deletedAt && // Not admin deleted
      !msg.isRecalled // Not recalled
    );
  });

  if (visibleMessages.length > 0) {
    // Get the last visible message
    const newLastMessage = visibleMessages[visibleMessages.length - 1];

    console.log("✅ Found alternative lastMessage:", newLastMessage.messageId || newLastMessage._id);

    updateConversation(conversationId, {
      lastMessage: {
        messageId: newLastMessage.messageId || newLastMessage._id,
        _id: newLastMessage._id,
        content: newLastMessage.content,
        type: newLastMessage.type,
        sender: newLastMessage.sender,
        createdAt: newLastMessage.createdAt,
        isRecalled: false,
      },
    });
  } else {
    // No visible messages left
    console.log("⚠️ No visible messages left - clearing lastMessage");
    updateConversation(conversationId, {
      lastMessage: null,
    });
  }
};

/**
 * Check if message can be recalled
 */
export const canRecall = (message, isMe) => {
  if (!isMe) return false;
  if (message.isRecalled) return false;
  if (message.deletedAt) return false;
  return true; // ✅ No time limit
};

/**
 * Check if message can be hidden
 */
export const canHide = (message) => {
  return !message.deletedAt && !message.isRecalled;
};

/**
 * Check if message can be deleted for me
 */
export const canDeleteForMe = (message, isMe) => {
  return isMe && !message.deletedAt && !message.isRecalled;
};