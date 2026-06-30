import express from 'express';
import { createContactRequest, getContactRequests } from '../controllers/contact.controller.js';
import { requireAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public route for users to request contact
router.post('/request', createContactRequest);

// Protected route for admin to view logs
router.get('/logs', requireAdmin, getContactRequests);

export default router;
