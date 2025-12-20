// backend/socket/privateChat.js
import Message from "../models/Message.js";

export default (io) => {
  const onlineUsers = new Map();

  io.on("connection", (socket) => {

    // Join private room
    socket.on("joinPrivate", (uid) => {
      if (!uid) {
        console.error("❌ joinPrivate: missing uid");
        return;
      }
      
      onlineUsers.set(uid, socket.id);
      socket.join(uid);
      
      // CHỈ LOG KHI USER LOGIN
      console.log(`✅ User ${uid} logged in and joined room (${socket.id})`);
      console.log(`📊 Total online: ${onlineUsers.size} users`);
    });

    // Send private message
    socket.on("sendPrivateMessage", async ({ senderId, receiverId, text }) => {
      if (!senderId || !receiverId || !text) {
        console.error("❌ Missing fields:", { senderId, receiverId, text });
        return;
      }

      try {
        const msg = await Message.create({ 
          sender: senderId, 
          receiver: receiverId, 
          text,
          read: false 
        });

        const msgObj = {
          _id: msg._id,
          sender: msg.sender,
          receiver: msg.receiver,
          text: msg.text,
          read: msg.read,
          createdAt: msg.createdAt,
          updatedAt: msg.updatedAt
        };

        console.log(`📤 Message: ${senderId} -> ${receiverId}`);

        io.to(receiverId).emit("receivePrivateMessage", msgObj);
        io.to(senderId).emit("receivePrivateMessage", msgObj);
        
        console.log(`✅ Delivered to rooms: ${receiverId} & ${senderId}`);
      } catch (err) {
        console.error("❌ Error saving message:", err);
        socket.emit("messageError", { error: "Failed to send message" });
      }
    });

    socket.on("markAsRead", async ({ userId, friendId }) => {
      if (!userId || !friendId) return;

      try {
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
        
        console.log(`✅ Marked ${result.modifiedCount} messages as read`);
        
        io.to(friendId).emit("messagesRead", { 
          userId, 
          friendId,
          count: result.modifiedCount
        });
        
        io.to(userId).emit("messagesMarkedAsRead", {
          friendId,
          count: result.modifiedCount
        });
        
      } catch (err) {
        console.error("❌ Error marking as read:", err);
      }
    });

    socket.on("typing", ({ senderId, receiverId, isTyping }) => {
      io.to(receiverId).emit("userTyping", { 
        userId: senderId, 
        isTyping 
      });
    });

    socket.on("disconnect", () => {
      // CHỈ LOG KHI USER ĐÃ LOGIN
      for (const [uid, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(uid);
          console.log(`❌ User ${uid} logged out`);
          console.log(`📊 Total online: ${onlineUsers.size} users`);
          break;
        }
      }
      // Nếu chưa login thì disconnect im lặng
    });
  });
};