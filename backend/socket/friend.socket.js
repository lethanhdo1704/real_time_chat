// backend/socket/friend.socket.js
import friendEmitter, { FRIEND_EVENTS } from "../services/friendEmitter.service.js";

/**
 * Setup Friend Socket Handlers
 * Listen to friend events và emit realtime cho clients
 */
export default function setupFriendSocket(io) {
  console.log('👥 Setting up Friend socket handlers...');

  // ============================================
  // 1️⃣ FRIEND REQUEST SENT
  // ============================================
  friendEmitter.on(FRIEND_EVENTS.REQUEST_SENT, (data) => {
    console.log(`[FRIEND] ${data.sender.uid} → ${data.receiver.uid}: REQUEST_SENT`);
    
    // Emit cho người nhận
    io.to(`user:${data.receiver.uid}`).emit("friend_request_received", {
      uid: data.sender.uid,
      nickname: data.sender.nickname,
      avatar: data.sender.avatar,
      requestId: data.requestId,
      timestamp: data.timestamp
    });
  });

  // ============================================
  // 2️⃣ FRIEND REQUEST ACCEPTED
  // ============================================
  friendEmitter.on(FRIEND_EVENTS.REQUEST_ACCEPTED, (data) => {
    console.log(`[FRIEND] ${data.accepter.uid} accepted ${data.requester.uid}`);
    
    // Emit cho người gửi ban đầu (A) - request được accept
    io.to(`user:${data.requester.uid}`).emit("friend_request_accepted", {
      uid: data.accepter.uid,
      nickname: data.accepter.nickname,
      avatar: data.accepter.avatar,
      timestamp: new Date()
    });

    // Emit cho người chấp nhận (B) - thêm vào friend list
    io.to(`user:${data.accepter.uid}`).emit("friend_added", {
      uid: data.requester.uid,
      nickname: data.requester.nickname,
      avatar: data.requester.avatar,
      timestamp: new Date()
    });
  });

  // ============================================
  // 3️⃣ FRIEND REQUEST REJECTED
  // ============================================
  friendEmitter.on(FRIEND_EVENTS.REQUEST_REJECTED, (data) => {
    console.log(`[FRIEND] ${data.rejecter.uid} rejected ${data.requester.uid}`);
    
    // Emit cho người gửi ban đầu
    io.to(`user:${data.requester.uid}`).emit("friend_request_rejected", {
      uid: data.rejecter.uid,
      timestamp: new Date()
    });
  });

  // ============================================
  // 4️⃣ FRIEND REQUEST CANCELLED
  // ============================================
  friendEmitter.on(FRIEND_EVENTS.REQUEST_CANCELLED, (data) => {
    console.log(`[FRIEND] ${data.canceller.uid} cancelled request to ${data.receiver.uid}`);
    
    // Emit cho người nhận - xóa request khỏi danh sách
    io.to(`user:${data.receiver.uid}`).emit("friend_request_cancelled", {
      uid: data.canceller.uid,
      timestamp: new Date()
    });
  });

  // ============================================
  // 5️⃣ UNFRIENDED
  // ============================================
  friendEmitter.on(FRIEND_EVENTS.UNFRIENDED, (data) => {
    console.log(`[FRIEND] ${data.unfriender.uid} unfriended ${data.unfriended.uid}`);
    
    // Emit cho người bị unfriend
    io.to(`user:${data.unfriended.uid}`).emit("friend_removed", {
      uid: data.unfriender.uid,
      timestamp: new Date()
    });
  });

  console.log('✅ Friend socket handlers ready');
}