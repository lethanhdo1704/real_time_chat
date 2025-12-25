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
   * Kiểm tra trạng thái quan hệ
   */
  async getFriendStatus(userId, friendUid) {
    userId = this.toObjectId(userId);
    const friendUser = await this.uidToId(friendUid);
    const friendId = friendUser._id;

    if (userId.equals(friendId)) {
      return { status: "self" };
    }

    const friendship = await Friend.findOne({
      $or: [
        { user: userId, friend: friendId },
        { user: friendId, friend: userId }
      ]
    });

    if (!friendship) {
      return { status: "none" };
    }

    if (friendship.status === "accepted") {
      return { status: "friends" };
    }

    // Pending
    if (friendship.user.equals(userId)) {
      return { status: "request_sent" };
    } else {
      return { status: "request_received" };
    }
  }
}

// Singleton instance
const friendService = new FriendService();
export default friendService;