const express = require('express');
const router = express.Router();
const buyController = require('../controllers/buycontroller');
const { authMiddleware } = require('../middleware/middleware');

router.post('/buyProduct', authMiddleware, buyController.buyProduct);

module.exports = router;
