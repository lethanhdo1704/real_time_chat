import express from 'express';
import { adminLogin, verifyAdminToken } from '../../controllers/admin/admin.auth.controller.js';
import adminIpWhitelist from '../../middleware/admin/admin.Ip.Whitelist.js';
import adminAuth from '../../middleware/admin/admin.Auth.js';
import { adminLoginLimiter } from '../../middleware/rateLimit.js'; // ✅ Named import

const router = express.Router();

router.get('/ip-check',
  adminIpWhitelist,
  (req, res) => {
    res.json({ success: true });
  }
);

router.post('/login',
  adminIpWhitelist,
  adminLoginLimiter,  // ✅ Correct usage
  adminLogin
);

router.get('/verify',
  adminAuth,
  verifyAdminToken
);

export default router;