// backend/routes/admin/users.routes.js
import express from 'express';
import * as usersController from '../../controllers/admin/users.controller.js';

const router = express.Router();

// 📊 Statistics (đặt trước :id để tránh conflict)
router.get('/statistics', usersController.getUserStatistics);

// 📋 List & Detail
router.get('/', usersController.listUsers);
router.get('/:id', usersController.getUserDetail);

// 🚫 Ban & Unban
router.post('/:id/ban', usersController.banUser);
router.post('/:id/unban', usersController.unbanUser);

// 🔄 Update Role (SUPER_ADMIN ONLY - checked in controller)
router.patch('/:id/role', usersController.updateUserRole);

export default router;