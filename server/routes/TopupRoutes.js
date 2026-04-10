const express = require('express');
const router = express.Router();
const topupController = require('../controllers/topupcontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/middleware');

router.post('/redeem', authMiddleware, topupController.redeemVoucher);
router.get('/settings', authMiddleware, topupController.getTopupSettingsPublic);
router.get('/settings/admin', authMiddleware, adminMiddleware, topupController.getTopupSettingsAdmin);
router.put('/settings/admin', authMiddleware, adminMiddleware, topupController.updateTopupSettingsAdmin);

module.exports = router;
