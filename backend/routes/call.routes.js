// backend/routes/call.routes.js
import express from 'express';
import auth from '../middleware/auth.js';
import { getCallHistory, getCallDetails } from '../controllers/call.controller.js';

const router = express.Router();

router.get('/history', auth, getCallHistory);
router.get('/:callId', auth, getCallDetails);

export default router;