const API_URL = "http://localhost:5000/api";

// Lấy header auth
function getAuthHeaders() {
  const token = localStorage.getItem("token"); // token lưu sau khi login
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
export async function sendFriendRequest(userUid, friendUid) {
  const res = await fetch(`${API_URL}/friends/request`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userUid, friendUid }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    // Tạo error object với response để component có thể access error code
    const error = new Error(data.message || "Error sending request");
    error.response = { data }; // Attach response data
    throw error;
  }
  
  return data;
}

// Lấy danh sách bạn bè và lời mời
export async function getFriendsAndRequests(userUid) {
  const res = await fetch(`${API_URL}/friends/list/${userUid}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || "Error fetching friends");
  }
  return res.json();
}

// Chấp nhận lời mời kết bạn
export async function acceptFriendRequest(userUid, friendUid) {
  const res = await fetch(`${API_URL}/friends/accept`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userUid, friendUid }),
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
export async function rejectFriendRequest(userUid, friendUid) {
  const res = await fetch(`${API_URL}/friends/reject`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userUid, friendUid }),
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
export async function getFriendStatus(userUid, friendUid) {
  const res = await fetch(`${API_URL}/friends/status/${userUid}/${friendUid}`, {
    headers: getAuthHeaders(),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.message || "Error checking friend status");
  }
  
  return data.status; // "self", "none", "friends", "request_sent", "request_received"
}

// Hủy lời mời kết bạn đã gửi
export async function cancelFriendRequest(userUid, friendUid) {
  const res = await fetch(`${API_URL}/friends/cancel`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userUid, friendUid }),
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
export async function unfriend(userUid, friendUid) {
  const res = await fetch(`${API_URL}/friends/unfriend`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ userUid, friendUid }),
  });
  
  const data = await res.json();
  
  if (!res.ok) {
    const error = new Error(data.message || "Error unfriending");
    error.response = { data };
    throw error;
  }
  
  return data;
}