import express from 'express';
import { globalSearch } from './search.controller.js';
import { authenticate } from '../../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticate, globalSearch);

export default router;