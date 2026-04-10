const express = require('express');
const router = express.Router();
const carouselController = require('../controllers/carouselcontroller');
const { authMiddleware, adminMiddleware } = require('../middleware/middleware');

router.get('/getCarousels', carouselController.getCarousels);
router.post('/addCarousel', authMiddleware, adminMiddleware, carouselController.addCarousel);
router.put('/updateCarousel/:id', authMiddleware, adminMiddleware, carouselController.updateCarousel);
router.delete('/deleteCarousel/:id', authMiddleware, adminMiddleware, carouselController.deleteCarousel);

module.exports = router;
