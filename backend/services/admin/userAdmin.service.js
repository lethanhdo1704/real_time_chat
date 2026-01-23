// backend/services/admin/userAdmin.service.js
import User from '../../models/User.js';

/**
 * 📋 LIST USERS WITH FILTERS & PAGINATION
 */
export const listUsers = async (filters = {}, adminRole) => {
  const {
    page = 1,
    limit = 20,
    status,
    role,
    q, // search query
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  // Build query
  const query = {};
  
  // ✅ FIX: Admin thường không được xem super_admin
  if (adminRole !== 'super_admin') {
    query.role = { $ne: 'super_admin' };
  }
  
  if (status) {
    query.status = status;
  }
  
  if (role) {
    // Nếu admin thường cố tình filter role=super_admin
    if (adminRole !== 'super_admin' && role === 'super_admin') {
      throw new Error('Permission denied: Cannot view super_admin users');
    }
    query.role = role;
  }
  
  if (q) {
    query.$or = [
      { email: { $regex: q, $options: 'i' } },
      { nickname: { $regex: q, $options: 'i' } },
      { uid: { $regex: q, $options: 'i' } }
    ];
  }

  // Pagination
  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  // Execute queries
  const [users, total] = await Promise.all([
    User.find(query)
      .select('-passwordHash')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    User.countDocuments(query)
  ]);

  return {
    users,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

/**
 * 👤 GET USER DETAIL
 */
export const getUserDetail = async (userId, adminRole) => {
  const user = await User.findById(userId)
    .select('-passwordHash')
    .lean();

  if (!user) {
    throw new Error('User not found');
  }

  // ✅ FIX: Admin thường không được xem chi tiết super_admin
  if (adminRole !== 'super_admin' && user.role === 'super_admin') {
    throw new Error('Permission denied: Cannot view super_admin details');
  }

  return user;
};

/**
 * 🚫 BAN USER
 */
export const banUser = async (userId, adminId, banData, adminRole) => {
  const { reason, banEndAt } = banData;

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.status === 'banned') {
    throw new Error('User is already banned');
  }

  // ✅ FIX: Không thể ban admin khác (bao gồm cả super_admin)
  if (user.role === 'admin' || user.role === 'super_admin') {
    throw new Error('Cannot ban admin users');
  }

  user.status = 'banned';
  user.banStartAt = new Date();
  user.banEndAt = banEndAt ? new Date(banEndAt) : null;
  user.bannedBy = adminId;

  await user.save();

  return {
    uid: user.uid,
    email: user.email,
    nickname: user.nickname,
    status: user.status,
    banStartAt: user.banStartAt,
    banEndAt: user.banEndAt,
    banReason: reason || null
  };
};

/**
 * ✅ UNBAN USER
 */
export const unbanUser = async (userId, adminRole) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.status !== 'banned') {
    throw new Error('User is not banned');
  }

  // ✅ FIX: Đảm bảo không thể unban super_admin
  if (adminRole !== 'super_admin' && user.role === 'super_admin') {
    throw new Error('Permission denied: Cannot unban super_admin');
  }

  user.status = 'active';
  user.banStartAt = null;
  user.banEndAt = null;
  user.bannedBy = null;

  await user.save();

  return {
    uid: user.uid,
    email: user.email,
    nickname: user.nickname,
    status: user.status
  };
};

/**
 * 🗑️ SOFT DELETE USER
 */
export const deleteUser = async (userId, adminId, adminRole) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.status === 'deleted') {
    throw new Error('User is already deleted');
  }

  // ✅ FIX: Không thể xóa admin khác (bao gồm cả super_admin)
  if (user.role === 'admin' || user.role === 'super_admin') {
    throw new Error('Cannot delete admin users');
  }

  user.status = 'deleted';
  await user.save();

  return {
    uid: user.uid,
    email: user.email,
    nickname: user.nickname,
    status: user.status
  };
};

/**
 * ♻️ RESTORE USER
 */
export const restoreUser = async (userId, adminRole) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.status !== 'deleted') {
    throw new Error('User is not deleted');
  }

  // ✅ FIX: Đảm bảo không thể restore super_admin
  if (adminRole !== 'super_admin' && user.role === 'super_admin') {
    throw new Error('Permission denied: Cannot restore super_admin');
  }

  user.status = 'active';
  await user.save();

  return {
    uid: user.uid,
    email: user.email,
    nickname: user.nickname,
    status: user.status
  };
};

/**
 * 🔄 UPDATE USER ROLE (SUPER_ADMIN ONLY)
 */
export const updateUserRole = async (userId, newRole, adminRole) => {
  if (adminRole !== 'super_admin') {
    throw new Error('Only super_admin can change user roles');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (!['user', 'admin', 'super_admin'].includes(newRole)) {
    throw new Error('Invalid role');
  }

  // Ngăn chặn nâng quyền admin khác lên super_admin
  if (newRole === 'super_admin' && (user.role === 'admin' || user.role === 'user')) {
    throw new Error('Cannot promote users to super_admin role');
  }

  user.role = newRole;
  await user.save();

  return {
    uid: user.uid,
    email: user.email,
    nickname: user.nickname,
    role: user.role
  };
};

/**
 * 📊 GET USER STATISTICS
 */
export const getUserStatistics = async (adminRole) => {
  // ✅ FIX: Điều chỉnh query dựa trên role của admin
  const baseQuery = adminRole !== 'super_admin' 
    ? { role: { $ne: 'super_admin' } } 
    : {};

  const [
    totalUsers,
    activeUsers,
    bannedUsers,
    deletedUsers,
    adminUsers,
    onlineUsers
  ] = await Promise.all([
    User.countDocuments(baseQuery),
    User.countDocuments({ ...baseQuery, status: 'active' }),
    User.countDocuments({ ...baseQuery, status: 'banned' }),
    User.countDocuments({ ...baseQuery, status: 'deleted' }),
    User.countDocuments({ 
      ...baseQuery, 
      role: adminRole === 'super_admin' 
        ? { $in: ['admin', 'super_admin'] } 
        : 'admin' 
    }),
    User.countDocuments({ ...baseQuery, isOnline: true })
  ]);

  return {
    totalUsers,
    activeUsers,
    bannedUsers,
    deletedUsers,
    adminUsers,
    onlineUsers
  };
};

/**
 * 🔄 AUTO UNBAN EXPIRED BANS
 */
export const checkAndUnbanUser = async (user) => {
  if (user.status === 'banned' && user.banEndAt && user.banEndAt < new Date()) {
    user.status = 'active';
    user.banStartAt = null;
    user.banEndAt = null;
    user.bannedBy = null;
    await user.save();
    return true;
  }
  return false;
};