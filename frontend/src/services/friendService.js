// frontend/src/services/friendService.js
const API_URL = "http://localhost:5000/api";

// Check cả localStorage VÀ sessionStorage
function getAuthHeaders() {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

// Tìm user theo UID
export async function searchUser(uid) {
  const res = await fetch(`${API_URL}/users/search?uid=${uid}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "User not found");
  }
  return res.json();
}

// Gửi lời mời kết bạn
// ✅ Backend chỉ cần friendUid, userUid lấy từ JWT
export async function sendFriendRequest(friendUid) {
  const res = await fetch(`${API_URL}/friends/request`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ friendUid }), // ← CHỈ gửi friendUid
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    const error = new Error(data.message || "Error sending request");
    error.response = { data };
    throw error;
  }
  
  return data;
}

// Lấy danh sách bạn bè và lời mời
// ✅ Backend lấy userUid từ JWT
export async function getFriendsAndRequests() {
  const res = await fetch(`${API_URL}/friends/list`, { // ← Không cần userUid trong URL
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Error fetching friends");
  }
  return res.json();
}

// Chấp nhận lời mời kết bạn
// ✅ Backend chỉ cần friendUid
export async function acceptFriendRequest(friendUid) {
  const res = await fetch(`${API_URL}/friends/accept`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ friendUid }), // ← CHỈ gửi friendUid
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    const error = new Error(data.message || "Error accepting request");
    error.response = { data };
    throw error;
  }
  
  return data;
}

// Từ chối lời mời kết bạn
// ✅ Backend chỉ cần friendUid
export async function rejectFriendRequest(friendUid) {
  const res = await fetch(`${API_URL}/friends/reject`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ friendUid }), // ← CHỈ gửi friendUid
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    const error = new Error(data.message || "Error rejecting request");
    error.response = { data };
    throw error;
  }
  
  return data;
}

// Kiểm tra trạng thái quan hệ với một user
// ✅ Backend lấy userUid từ JWT
export async function getFriendStatus(friendUid) {
  const res = await fetch(`${API_URL}/friends/status/${friendUid}`, { // ← Chỉ cần friendUid
    headers: getAuthHeaders(),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || "Error checking friend status");
  }
  
  return data.status; // "self", "none", "friends", "request_sent", "request_received"
}

// Hủy lời mời kết bạn đã gửi
// ✅ Backend chỉ cần friendUid
export async function cancelFriendRequest(friendUid) {
  const res = await fetch(`${API_URL}/friends/cancel`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ friendUid }), // ← CHỈ gửi friendUid
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    const error = new Error(data.message || "Error canceling request");
    error.response = { data };
    throw error;
  }
  
  return data;
}

// Hủy kết bạn
// ✅ Backend chỉ cần friendUid
export async function unfriend(friendUid) {
  const res = await fetch(`${API_URL}/friends/unfriend`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ friendUid }), // ← CHỈ gửi friendUid
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    const error = new Error(data.message || "Error unfriending");
    error.response = { data };
    throw error;
  }
  
  return data;
}