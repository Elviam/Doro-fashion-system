import express from 'express';
import { globalSearch } from './search.controller.js';
import { authenticate } from '../../middlewares/auth.js';
import { requireStaffAccount } from '../../middlewares/requirePermissions.js';

const router = express.Router();

router.get('/', authenticate, requireStaffAccount, globalSearch);

export default router;
