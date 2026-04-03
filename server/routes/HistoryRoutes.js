const express = require('express');
const router = express.Router();
const historyController = require('../controllers/historycontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/middleware');

router.get('/getPurchaseHistory', authMiddleware, historyController.getPurchaseHistory);
router.get('/getAllPurchaseHistory', authMiddleware, adminMiddleware, historyController.getAllPurchaseHistory);
module.exports = router;