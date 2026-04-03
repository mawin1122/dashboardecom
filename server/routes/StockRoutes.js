const express = require('express');
const router = express.Router();
const stockController = require('../controllers/stockcontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/middleware');

router.post('/addStock', authMiddleware, adminMiddleware, stockController.addStock);
router.get('/getStock', authMiddleware, adminMiddleware, stockController.getStock);
router.get('/getStockByProduct/:productId', authMiddleware, adminMiddleware, stockController.getStockByProduct);
    router.put('/updateStock/:id', authMiddleware, adminMiddleware, stockController.updateStockByid);
    router.delete('/deleteStock/:id', authMiddleware, adminMiddleware, stockController.deleteStockById);

module.exports = router;