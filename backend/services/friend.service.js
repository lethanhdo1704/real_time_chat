// backend/services/friend.service.js
import Friend from "../models/Friend.js";
import User from "../models/User.js";
import friendEmitter from "./friendEmitter.service.js";
import mongoose from "mongoose";

class FriendService {
  /**
   * Helper: Convert uid → ObjectId
   */
  async uidToId(uid) {
    const user = await User.findOne({ uid }).select("_id uid nickname avatar");
    if (!user) throw new Error("USER_NOT_FOUND");
    return user;
  }

  /**
   * Helper: Ensure ObjectId
   */
  toObjectId(value) {
    if (value instanceof mongoose.Types.ObjectId) return value;
    return new mongoose.Types.ObjectId(value);
  }

  /**
   * Gửi lời mời kết bạn
   */
  async sendRequest(userId, friendUid) {
    userId = this.toObjectId(userId);
    const friendUser = await this.uidToId(friendUid);
    const friendId = friendUser._id;

    // Không thể tự kết bạn
    if (userId.equals(friendId)) {
      const error = new Error("Không thể tự kết bạn với chính mình");
      error.code = "SELF_FRIEND";
      throw error;
    }

    // Kiểm tra đã là bạn bè
    const alreadyFriends = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId, status: "accepted" },
        { user: friendId, friend: userId, status: "accepted" }
      ]
    });
    
    if (alreadyFriends) {
      const error = new Error("Bạn đã là bạn bè với người này rồi");
      error.code = "ALREADY_FRIENDS";
      throw error;
    }

    // Kiểm tra lời mời pending
    const existingRequest = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId, status: "pending" },
        { user: friendId, friend: userId, status: "pending" }
      ]
    });
    
    if (existingRequest) {
      if (existingRequest.user.equals(friendId)) {
        const error = new Error("Người này đã gửi lời mời kết bạn cho bạn");
        error.code = "REQUEST_ALREADY_RECEIVED";
        throw error;
      }
      const error = new Error("Bạn đã gửi lời mời kết bạn cho người này rồi");
      error.code = "REQUEST_ALREADY_SENT";
      throw error;
    }

    // Tạo lời mời mới
    const newFriend = new Friend({ 
      user: userId, 
      friend: friendId, 
      status: "pending" 
    });
    await newFriend.save();

    // Lấy thông tin sender
    const sender = await User.findById(userId).select("uid nickname avatar");

    // ✅ Emit event cho socket
    friendEmitter.emitRequestSent({
      sender: {
        uid: sender.uid,
        nickname: sender.nickname,
        avatar: sender.avatar
      },
      receiver: {
        uid: friendUser.uid
      },
      requestId: newFriend._id,
      timestamp: newFriend.createdAt
    });

    return newFriend;
  }

  /**
   * Chấp nhận lời mời kết bạn
   */
  async acceptRequest(userId, friendUid) {
    userId = this.toObjectId(userId);
    const friendUser = await this.uidToId(friendUid);
    const friendId = friendUser._id;

    // Kiểm tra đã là bạn bè
    const alreadyFriends = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId, status: "accepted" },
        { user: friendId, friend: userId, status: "accepted" }
      ]
    });
    
    if (alreadyFriends) {
      const error = new Error("Bạn đã là bạn bè với người này rồi");
      error.code = "ALREADY_FRIENDS";
      throw error;
    }

    // Tìm lời mời
    const friendDoc = await Friend.findOne({
      user: friendId,
      friend: userId,
      status: "pending",
    });
    
    if (!friendDoc) {
      const error = new Error("Không tìm thấy lời mời kết bạn");
      error.code = "REQUEST_NOT_FOUND";
      throw error;
    }

    // Cập nhật trạng thái
    friendDoc.status = "accepted";
    await friendDoc.save();

    // Lấy thông tin accepter
    const accepter = await User.findById(userId).select("uid nickname avatar");

    // ✅ Emit event cho socket
    friendEmitter.emitRequestAccepted({
      accepter: {
        uid: accepter.uid,
        nickname: accepter.nickname,
        avatar: accepter.avatar
      },
      requester: {
        uid: friendUser.uid,
        nickname: friendUser.nickname,
        avatar: friendUser.avatar
      }
    });

    return friendDoc;
  }

  /**
   * Từ chối lời mời kết bạn
   */
  async rejectRequest(userId, friendUid) {
    userId = this.toObjectId(userId);
    const friendUser = await this.uidToId(friendUid);
    const friendId = friendUser._id;

    const deleted = await Friend.findOneAndDelete({
      user: friendId,
      friend: userId,
      status: "pending",
    });
    
    if (!deleted) {
      const error = new Error("Không tìm thấy lời mời kết bạn");
      error.code = "REQUEST_NOT_FOUND";
      throw error;
    }

    // Lấy thông tin rejecter
    const rejecter = await User.findById(userId).select("uid");

    // ✅ Emit event cho socket
    friendEmitter.emitRequestRejected({
      rejecter: {
        uid: rejecter.uid
      },
      requester: {
        uid: friendUser.uid
      }
    });

    return deleted;
  }

  /**
   * Hủy lời mời đã gửi
   */
  async cancelRequest(userId, friendUid) {
    userId = this.toObjectId(userId);
    const friendUser = await this.uidToId(friendUid);
    const friendId = friendUser._id;

    const deleted = await Friend.findOneAndDelete({
      user: userId,
      friend: friendId,
      status: "pending",
    });
    
    if (!deleted) {
      const error = new Error("Không tìm thấy lời mời kết bạn");
      error.code = "REQUEST_NOT_FOUND";
      throw error;
    }

    // Lấy thông tin canceller
    const canceller = await User.findById(userId).select("uid");

    // ✅ Emit event cho socket
    friendEmitter.emitRequestCancelled({
      canceller: {
        uid: canceller.uid
      },
      receiver: {
        uid: friendUser.uid
      }
    });

    return deleted;
  }

  /**
   * Hủy kết bạn
   */
  async unfriend(userId, friendUid) {
    userId = this.toObjectId(userId);
    const friendUser = await this.uidToId(friendUid);
    const friendId = friendUser._id;

    const deleted = await Friend.findOneAndDelete({
      $or: [
        { user: userId, friend: friendId, status: "accepted" },
        { user: friendId, friend: userId, status: "accepted" }
      ]
    });
    
    if (!deleted) {
      const error = new Error("Không tìm thấy mối quan hệ bạn bè");
      error.code = "FRIENDSHIP_NOT_FOUND";
      throw error;
    }

    // Lấy thông tin unfriender
    const unfriender = await User.findById(userId).select("uid");

    // ✅ Emit event cho socket
    friendEmitter.emitUnfriended({
      unfriender: {
        uid: unfriender.uid
      },
      unfriended: {
        uid: friendUser.uid
      }
    });

    return deleted;
  }

  /**
   * Lấy danh sách bạn bè và lời mời
   */
  async getFriendsList(userId) {
    userId = this.toObjectId(userId);

    // Bạn bè đã chấp nhận
    const friendsDocs = await Friend.find({
      $or: [
        { user: userId, status: "accepted" },
        { friend: userId, status: "accepted" }
      ]
    }).populate("user friend", "uid nickname avatar");

    const friends = friendsDocs.map((doc) => {
      const friendUser = doc.user._id.equals(userId) ? doc.friend : doc.user;
      return {
        _id: doc._id,
        uid: friendUser.uid,
        nickname: friendUser.nickname,
        avatar: friendUser.avatar,
      };
    });

    // Lời mời đến
    const requestsDocs = await Friend.find({ 
      friend: userId, 
      status: "pending" 
    }).populate("user", "uid nickname avatar");

    const requests = requestsDocs.map((doc) => ({
      _id: doc._id,
      uid: doc.user.uid,
      nickname: doc.user.nickname,
      avatar: doc.user.avatar,
      seenAt: doc.seenAt,
    }));

    // Lời mời đã gửi
    const sentRequestsDocs = await Friend.find({ 
      user: userId, 
      status: "pending" 
    }).populate("friend", "uid nickname avatar");

    const sentRequests = sentRequestsDocs.map((doc) => ({
      _id: doc._id,
      uid: doc.friend.uid,
      nickname: doc.friend.nickname,
      avatar: doc.friend.avatar,
    }));

    return { friends, requests, sentRequests };
  }

  /**
   * Kiểm tra trạng thái quan hệ - ✅ FIXED: Always return user info
   */
  async getFriendStatus(userId, friendUid) {
    userId = this.toObjectId(userId);
    const friendUser = await this.uidToId(friendUid);
    const friendId = friendUser._id;

    // Check if searching for self
    if (userId.equals(friendId)) {
      return { 
        status: "self",
        user: {
          uid: friendUser.uid,
          nickname: friendUser.nickname,
          avatar: friendUser.avatar
        }
      };
    }

    const friendship = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId },
        { user: friendId, friend: userId }
      ]
    });

    // ✅ ALWAYS return user info along with status
    const result = {
      status: "none",
      user: {
        uid: friendUser.uid,
        nickname: friendUser.nickname,
        avatar: friendUser.avatar
      }
    };

    if (!friendship) {
      return result;
    }

    if (friendship.status === "accepted") {
      result.status = "friends";
      return result;
    }

    // Pending
    if (friendship.user.equals(userId)) {
      result.status = "request_sent";
    } else {
      result.status = "request_received";
    }

    return result;
  }

  /**
   * 🔥 NEW: Đánh dấu một lời mời đã xem
   */
  async markRequestAsSeen(userId, requestId) {
    userId = this.toObjectId(userId);
    requestId = this.toObjectId(requestId);

    // Tìm và kiểm tra quyền (chỉ người nhận mới được mark as seen)
    const friendRequest = await Friend.findOne({
      _id: requestId,
      friend: userId,
      status: "pending"
    });

    if (!friendRequest) {
      const error = new Error("Không tìm thấy lời mời kết bạn");
      error.code = "REQUEST_NOT_FOUND";
      throw error;
    }

    // Update seenAt
    friendRequest.seenAt = new Date();
    await friendRequest.save();

    // Lấy thông tin người gửi và người nhận
    const sender = await User.findById(friendRequest.user).select("uid");
    const receiver = await User.findById(userId).select("uid");

    // ✅ Emit socket event cho người gửi
    friendEmitter.emitRequestSeen({
      requestId: friendRequest._id,
      senderUid: sender.uid,
      receiverUid: receiver.uid,
      seenAt: friendRequest.seenAt
    });

    return { seenAt: friendRequest.seenAt };
  }

  /**
   * 🔥 NEW: Đánh dấu tất cả lời mời đã xem
   */
  async markAllRequestsAsSeen(userId) {
    userId = this.toObjectId(userId);

    const result = await Friend.updateMany(
      {
        friend: userId,
        status: "pending",
        seenAt: null
      },
      {
        $set: { seenAt: new Date() }
      }
    );

    return { updatedCount: result.modifiedCount };
  }

  /**
   * 🔥 NEW: Lấy số lượng lời mời chưa xem
   */
  async getUnseenRequestCount(userId) {
    userId = this.toObjectId(userId);

    const count = await Friend.countDocuments({
      friend: userId,
      status: "pending",
      seenAt: null
    });

    return count;
  }
}

// Singleton instance
const friendService = new FriendService();
export default friendService;