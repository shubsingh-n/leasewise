import express from 'express';
import {
  adminLogin,
  getAdminListings,
  approveProperty,
  rejectProperty,
  approveFlatmate,
  rejectFlatmate,
  deleteProperty,
  deleteFlatmate,
  updateProperty,
  updateFlatmate,
  reactivateProperty,
  reactivateFlatmate,
  reactivatePublic
} from '../controllers/admin.controller';
import {
  getContactRequests,
  retriggerContactNotification,
  debugTelegramSetup
} from '../controllers/contact.controller';
import { requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Public: Login only
router.post('/login', adminLogin);

// All below require valid JWT
router.get('/listings', requireAdmin, getAdminListings);

router.patch('/properties/:id/approve', requireAdmin, approveProperty);
router.patch('/properties/:id/reject',  requireAdmin, rejectProperty);
router.delete('/properties/:id',        requireAdmin, deleteProperty);
router.patch('/properties/:id',         requireAdmin, updateProperty);

router.patch('/flatmates/:id/approve',  requireAdmin, approveFlatmate);
router.patch('/flatmates/:id/reject',   requireAdmin, rejectFlatmate);
router.delete('/flatmates/:id',         requireAdmin, deleteFlatmate);
router.patch('/flatmates/:id',          requireAdmin, updateFlatmate);
router.patch('/properties/:id/reactivate', requireAdmin, reactivateProperty);
router.patch('/flatmates/:id/reactivate',  requireAdmin, reactivateFlatmate);

// Public route for Telegram link
router.get('/listings/reactivate-public/:type/:id', reactivatePublic);

// Contact Request management
router.get('/contact/logs',      requireAdmin, getContactRequests);
router.post('/contact/retrigger/:id', requireAdmin, retriggerContactNotification);
router.post('/contact/test-telegram', requireAdmin, debugTelegramSetup);

export default router;
