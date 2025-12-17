import express from "express";
import Message from "../models/Message.js";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ message: "Messages route is working!" });
});

// Send message (HTTP fallback)
router.post("/", verifyToken, async (req, res) => {
  const { receiverId, text } = req.body;
  if (!receiverId || !text) {
    return res.status(400).json({ msg: "Thiếu dữ liệu" });
  }

  try {
    const message = new Message({ 
      sender: req.user.uid, 
      receiver: receiverId, 
      text,
      read: false 
    });
    const savedMessage = await message.save();
    res.status(200).json(savedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get messages between 2 users
router.get("/:userId", verifyToken, async (req, res) => {
  const { userId } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user.uid, receiver: userId },
        { sender: userId, receiver: req.user.uid },
      ],
    }).sort({ createdAt: 1 });
    
    res.status(200).json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get last messages and unread counts for multiple friends
router.post("/last-messages", verifyToken, async (req, res) => {
  try {
    const { userId, friendIds } = req.body;
    
    if (!userId || !friendIds || !Array.isArray(friendIds)) {
      return res.status(400).json({ error: "Invalid request data" });
    }
    
    const lastMessages = {};
    const unreadCounts = {};
    
    for (const friendId of friendIds) {
      // Get last message
      const lastMsg = await Message.findOne({
        $or: [
          { sender: userId, receiver: friendId },
          { sender: friendId, receiver: userId }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(1)
      .lean();
      
      if (lastMsg) {
        lastMessages[friendId] = {
          text: lastMsg.text,
          timestamp: lastMsg.createdAt,
          senderId: lastMsg.sender,
          read: lastMsg.read
        };
      }
      
      // Count unread messages from friend
      const unreadCount = await Message.countDocuments({
        sender: friendId,
        receiver: userId,
        read: false
      });
      
      if (unreadCount > 0) {
        unreadCounts[friendId] = unreadCount;
      }
    }
    
    res.json({ lastMessages, unreadCounts });
  } catch (err) {
    console.error("Error fetching last messages:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Mark messages as read
router.post("/mark-read", verifyToken, async (req, res) => {
  try {
    const { userId, friendId } = req.body;
    
    if (!userId || !friendId) {
      return res.status(400).json({ error: "Missing userId or friendId" });
    }
    
    const result = await Message.updateMany(
      {
        sender: friendId,
        receiver: userId,
        read: false
      },
      {
        $set: { read: true }
      }
    );
    
    res.json({ 
      success: true, 
      modifiedCount: result.modifiedCount 
    });
  } catch (err) {
    console.error("Error marking messages as read:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get total unread count for user
router.get("/unread/total", verifyToken, async (req, res) => {
  try {
    const totalUnread = await Message.countDocuments({
      receiver: req.user.uid,
      read: false
    });
    
    res.json({ count: totalUnread });
  } catch (err) {
    console.error("Error getting unread count:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;