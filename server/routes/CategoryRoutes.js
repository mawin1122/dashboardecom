const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categorycontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/middleware');

router.get('/getCategories', categoryController.getCategories);
router.get('/getCategory/:id', categoryController.getCategoryById);
router.get('/getProductsByCategory/:category', categoryController.getProductsByCategory);
router.post('/addCategory', authMiddleware, adminMiddleware, categoryController.addCategory);
router.put('/updateCategory/:id', authMiddleware, adminMiddleware, categoryController.updateCategory);
router.delete('/deleteCategory/:id', authMiddleware, adminMiddleware, categoryController.deleteCategory);

module.exports = router;
