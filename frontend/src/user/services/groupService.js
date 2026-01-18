// frontend/src/services/groupService.js - COMBINED VERSION

import axios from 'axios';

/**
 * Group API Instance
 * ✅ FIXED: Base URL changed to /api/groups (matches backend)
 * ❌ OLD: /api/conversations/group (was causing 404 errors)
 * 
 * Backend routes are split into 2 controllers:
 * 1. /api/conversations - ConversationController (create, list)
 * 2. /api/groups - GroupController (invite, kick, settings)
 */
const groupApi = axios.create({
  baseURL: "/api/groups", // ✅ FIXED: Was /api/conversations/group
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

/**
 * Separate axios instance for conversation operations
 * Used for createGroup only (POST /api/conversations/group)
 */
const conversationApi = axios.create({
  baseURL: "/api/conversations",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// ============================================
// REQUEST INTERCEPTOR (for both instances)
// ============================================
const requestInterceptor = (config) => {
  const token =
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
};

groupApi.interceptors.request.use(requestInterceptor, (error) => {
  console.error("❌ [GroupAPI] Request error:", error);
  return Promise.reject(error);
});

conversationApi.interceptors.request.use(requestInterceptor, (error) => {
  console.error("❌ [ConversationAPI] Request error:", error);
  return Promise.reject(error);
});

// ============================================
// RESPONSE INTERCEPTOR (for both instances)
// ============================================
const responseInterceptor = (response) => response;

const responseErrorInterceptor = (error) => {
  if (error.response) {
    const { status, data } = error.response;

    switch (status) {
      case 401:
        console.error("❌ [GroupAPI] 401 Unauthorized");
        localStorage.removeItem("token");
        sessionStorage.removeItem("token");

        if (
          window.location.pathname !== "/login" &&
          !window.location.pathname.startsWith("/register") &&
          !window.location.pathname.startsWith("/forgot")
        ) {
          setTimeout(() => {
            const stillNoToken =
              !localStorage.getItem("token") &&
              !sessionStorage.getItem("token");

            if (stillNoToken) {
              console.log("🚪 [GroupAPI] Redirecting to /login");
              window.location.href = "/login";
            }
          }, 100);
        }
        break;

      case 403:
        console.error("❌ [GroupAPI] 403 Forbidden");
        break;

      case 404:
        console.error("❌ [GroupAPI] 404 Not Found");
        break;

      case 429:
        console.error("❌ [GroupAPI] 429 Rate Limited");
        break;

      case 500:
        console.error("❌ [GroupAPI] 500 Server Error");
        break;

      default:
        console.error(
          `❌ [GroupAPI] Error ${status}:`,
          data?.error || data?.message || error.message
        );
    }

    return Promise.reject(error);
  }

  if (error.request) {
    console.error("❌ [GroupAPI] Network error");
    const networkError = new Error(
      "Network error. Please check your connection."
    );
    networkError.request = error.request;
    return Promise.reject(networkError);
  }

  console.error("❌ [GroupAPI] Request setup error:", error.message);
  return Promise.reject(error);
};

groupApi.interceptors.response.use(responseInterceptor, responseErrorInterceptor);
conversationApi.interceptors.response.use(responseInterceptor, responseErrorInterceptor);

// ============================================
// HELPER FUNCTION
// ============================================

/**
 * Unwrap API response
 * Backend format: { success: true, data: {...} }
 */
const unwrapResponse = (response) => {
  return response.data.data || response.data;
};

// ============================================
// GROUP MANAGEMENT
// ============================================

/**
 * Create a new group
 * POST /api/conversations/group
 * ✅ FIXED: Uses conversationApi instead of groupApi
 * 
 * @param {Object} groupData - { name, memberUids, avatar?, messagePermission? }
 * @returns {Promise<Object>} Created group conversation
 */
export const createGroup = async (groupData) => {
  console.log('📤 [groupService] Creating group:', groupData);
  const response = await conversationApi.post('/group', groupData);
  console.log('✅ [groupService] Group created:', response.data);
  return unwrapResponse(response);
};

/**
 * Get group info (members, roles, settings)
 * GET /api/groups/:conversationId
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Group info with members and settings
 */
export const getGroupInfo = async (conversationId) => {
  console.log('📤 [groupService] Getting group info:', conversationId);
  const response = await groupApi.get(`/${conversationId}`);
  console.log('✅ [groupService] Group info received:', response.data);
  return unwrapResponse(response);
};

/**
 * Update group info (name, avatar, settings)
 * PATCH /api/groups/:conversationId
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} conversationId - Conversation ID
 * @param {Object} updates - { name?, avatar?, messagePermission? }
 * @returns {Promise<Object>} Updated group info
 */
export const updateGroupInfo = async (conversationId, updates) => {
  console.log('📤 [groupService] Updating group info:', conversationId, updates);
  const response = await groupApi.patch(`/${conversationId}`, updates);
  console.log('✅ [groupService] Group info updated:', response.data);
  return unwrapResponse(response);
};

// ============================================
// MEMBER MANAGEMENT
// ============================================

/**
 * Invite users to group
 * POST /api/groups/:conversationId/invite
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} conversationId - Conversation ID
 * @param {Array<string>} userUids - Array of user UIDs to invite
 * @returns {Promise<Object>} Invite results
 */
export const inviteUsers = async (conversationId, userUids) => {
  console.log('📤 [groupService] Inviting users:', conversationId, userUids);
  const response = await groupApi.post(`/${conversationId}/invite`, {
    userUids,
  });
  console.log('✅ [groupService] Users invited:', response.data);
  return unwrapResponse(response);
};

/**
 * Kick member from group
 * DELETE /api/groups/:conversationId/members/:memberUid
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} memberUid - Member UID to kick
 * @returns {Promise<Object>} Kick result
 */
export const kickMember = async (conversationId, memberUid) => {
  console.log('📤 [groupService] Kicking member:', conversationId, memberUid);
  const response = await groupApi.delete(`/${conversationId}/members/${memberUid}`);
  console.log('✅ [groupService] Member kicked:', response.data);
  return unwrapResponse(response);
};

/**
 * Leave group
 * POST /api/groups/:conversationId/leave
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Leave result
 */
export const leaveGroup = async (conversationId) => {
  console.log('📤 [groupService] Leaving group:', conversationId);
  const response = await groupApi.post(`/${conversationId}/leave`);
  console.log('✅ [groupService] Left group:', response.data);
  return unwrapResponse(response);
};

/**
 * Change member role
 * PATCH /api/groups/:conversationId/members/:memberUid/role
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} memberUid - Member UID
 * @param {string} role - New role ('admin' or 'member')
 * @returns {Promise<Object>} Role change result
 */
export const changeMemberRole = async (conversationId, memberUid, role) => {
  console.log('📤 [groupService] Changing member role:', conversationId, memberUid, role);
  const response = await groupApi.patch(
    `/${conversationId}/members/${memberUid}/role`,
    { role }
  );
  console.log('✅ [groupService] Member role changed:', response.data);
  return unwrapResponse(response);
};

/**
 * Transfer ownership
 * POST /api/groups/:conversationId/transfer-ownership
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} newOwnerUid - New owner UID
 * @returns {Promise<Object>} Transfer result
 */
export const transferOwnership = async (conversationId, newOwnerUid) => {
  console.log('📤 [groupService] Transferring ownership:', conversationId, newOwnerUid);
  const response = await groupApi.post(
    `/${conversationId}/transfer-ownership`,
    { newOwnerUid }
  );
  console.log('✅ [groupService] Ownership transferred:', response.data);
  return unwrapResponse(response);
};

// ============================================
// INVITATIONS & JOIN
// ============================================

/**
 * Accept group invite
 * POST /api/groups/invites/:notificationId/accept
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Accept result
 */
export const acceptInvite = async (notificationId) => {
  console.log('📤 [groupService] Accepting invite:', notificationId);
  const response = await groupApi.post(`/invites/${notificationId}/accept`);
  console.log('✅ [groupService] Invite accepted:', response.data);
  return unwrapResponse(response);
};

/**
 * Reject group invite
 * POST /api/groups/invites/:notificationId/reject
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Reject result
 */
export const rejectInvite = async (notificationId) => {
  console.log('📤 [groupService] Rejecting invite:', notificationId);
  const response = await groupApi.post(`/invites/${notificationId}/reject`);
  console.log('✅ [groupService] Invite rejected:', response.data);
  return unwrapResponse(response);
};

/**
 * Send join request
 * POST /api/groups/:conversationId/join-request
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} Join request result
 */
export const sendJoinRequest = async (conversationId) => {
  console.log('📤 [groupService] Sending join request:', conversationId);
  const response = await groupApi.post(`/${conversationId}/join-request`);
  console.log('✅ [groupService] Join request sent:', response.data);
  return unwrapResponse(response);
};

/**
 * Approve join request (admin/owner only)
 * POST /api/groups/join-requests/:notificationId/approve
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} notificationId - Notification ID
 * @param {string} requesterId - Requester user ID
 * @returns {Promise<Object>} Approve result
 */
export const approveJoinRequest = async (notificationId, requesterId) => {
  console.log('📤 [groupService] Approving join request:', notificationId, requesterId);
  const response = await groupApi.post(
    `/join-requests/${notificationId}/approve`,
    { requesterId }
  );
  console.log('✅ [groupService] Join request approved:', response.data);
  return unwrapResponse(response);
};

/**
 * Reject join request (admin/owner only)
 * POST /api/groups/join-requests/:notificationId/reject
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} notificationId - Notification ID
 * @param {string} requesterId - Requester user ID
 * @returns {Promise<Object>} Reject result
 */
export const rejectJoinRequest = async (notificationId, requesterId) => {
  console.log('📤 [groupService] Rejecting join request:', notificationId, requesterId);
  const response = await groupApi.post(
    `/join-requests/${notificationId}/reject`,
    { requesterId }
  );
  console.log('✅ [groupService] Join request rejected:', response.data);
  return unwrapResponse(response);
};

// ============================================
// INVITE LINKS
// ============================================

/**
 * Create invite link
 * POST /api/groups/:conversationId/invite-links
 * ✅ UPDATED: Changed endpoint from /invite-link to /invite-links (plural)
 * 
 * @param {string} conversationId - Conversation ID
 * @param {Object} options - { expiresIn?, maxUses? }
 * @returns {Promise<Object>} { _id, code, url, expiresAt, maxUses, usedCount, isActive }
 */
export const createInviteLink = async (conversationId, options = {}) => {
  console.log('🔗 [groupService] Creating invite link:', conversationId, options);
  const response = await groupApi.post(
    `/${conversationId}/invite-links`,
    options
  );
  console.log('✅ [groupService] Invite link created:', response.data);
  return unwrapResponse(response);
};

/**
 * Get all invite links for a group (Owner/Admin only)
 * GET /api/groups/:conversationId/invite-links
 * ✅ NEW: Added method to retrieve all links
 * 
 * @param {string} conversationId - Conversation ID
 * @returns {Promise<Object>} { links: [...] }
 */
export const getInviteLinks = async (conversationId) => {
  console.log('📋 [groupService] Getting invite links:', conversationId);
  const response = await groupApi.get(`/${conversationId}/invite-links`);
  console.log('✅ [groupService] Invite links received:', response.data);
  return unwrapResponse(response);
};

/**
 * Deactivate invite link
 * DELETE /api/groups/:conversationId/invite-links/:linkId
 * ✅ NEW: Added method to deactivate links
 * 
 * @param {string} conversationId - Conversation ID
 * @param {string} linkId - Link ID
 * @returns {Promise<Object>} { _id, code, isActive }
 */
export const deactivateInviteLink = async (conversationId, linkId) => {
  console.log('🗑️ [groupService] Deactivating invite link:', linkId);
  const response = await groupApi.delete(`/${conversationId}/invite-links/${linkId}`);
  console.log('✅ [groupService] Invite link deactivated:', response.data);
  return unwrapResponse(response);
};

/**
 * Join via invite link (Public - no auth required for viewing)
 * POST /api/groups/join/:code
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} code - Invite link code
 * @returns {Promise<Object>} Join result with conversation data
 */
export const joinViaLink = async (code) => {
  console.log('🔗 [groupService] Joining via link:', code);
  const response = await groupApi.post(`/join/${code}`);
  console.log('✅ [groupService] Joined via link:', response.data);
  return unwrapResponse(response);
};

// ============================================
// NOTIFICATIONS
// ============================================

/**
 * Get group notifications
 * GET /api/groups/notifications
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {Object} params - { limit?, skip?, type? }
 * @returns {Promise<Object>} Notifications list
 */
export const getNotifications = async (params = {}) => {
  const { limit = 20, skip = 0, type } = params;
  
  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
  });
  
  if (type) {
    queryParams.append('type', type);
  }
  
  console.log('📤 [groupService] Getting notifications:', queryParams.toString());
  const response = await groupApi.get(`/notifications?${queryParams.toString()}`);
  console.log('✅ [groupService] Notifications received:', response.data);
  return unwrapResponse(response);
};

/**
 * Mark notification as read
 * POST /api/groups/notifications/:notificationId/read
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @param {string} notificationId - Notification ID
 * @returns {Promise<Object>} Mark read result
 */
export const markNotificationAsRead = async (notificationId) => {
  console.log('📤 [groupService] Marking notification as read:', notificationId);
  const response = await groupApi.post(`/notifications/${notificationId}/read`);
  console.log('✅ [groupService] Notification marked as read:', response.data);
  return unwrapResponse(response);
};

/**
 * Mark all notifications as read
 * POST /api/groups/notifications/read-all
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @returns {Promise<Object>} Mark all read result
 */
export const markAllNotificationsAsRead = async () => {
  console.log('📤 [groupService] Marking all notifications as read');
  const response = await groupApi.post('/notifications/read-all');
  console.log('✅ [groupService] All notifications marked as read:', response.data);
  return unwrapResponse(response);
};

/**
 * Get unread notification count
 * GET /api/groups/notifications/unread-count
 * ✅ FIXED: Now uses correct /api/groups endpoint
 * 
 * @returns {Promise<Object>} Unread count
 */
export const getUnreadCount = async () => {
  console.log('📤 [groupService] Getting unread count');
  const response = await groupApi.get('/notifications/unread-count');
  console.log('✅ [groupService] Unread count received:', response.data);
  return unwrapResponse(response);
};

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  // Management
  createGroup,
  getGroupInfo,
  updateGroupInfo,
  
  // Members
  inviteUsers,
  kickMember,
  leaveGroup,
  changeMemberRole,
  transferOwnership,
  
  // Invitations
  acceptInvite,
  rejectInvite,
  sendJoinRequest,
  approveJoinRequest,
  rejectJoinRequest,
  
  // Invite Links (Enhanced)
  createInviteLink,
  getInviteLinks,
  deactivateInviteLink,
  joinViaLink,
  
  // Notifications
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadCount,
};