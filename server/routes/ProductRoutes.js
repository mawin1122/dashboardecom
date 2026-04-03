const express = require('express');
const router = express.Router();
const productController = require('../controllers/productcontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/middleware');

router.post('/addProduct', authMiddleware, adminMiddleware, productController.addProduct);
router.get('/getProducts', productController.getProducts);
router.get('/getProduct/:id', productController.getProductById);
router.put('/updateProduct/:id', authMiddleware, adminMiddleware, productController.updateProduct);
router.delete('/deleteProduct/:id', authMiddleware, adminMiddleware, productController.deleteProduct);

module.exports = router;