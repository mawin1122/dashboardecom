const exparess = require('express');
const router = exparess.Router();
const userController = require('../controllers/usercontrollers');
const { authMiddleware, adminMiddleware } = require('../middleware/middleware');

router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/profile', authMiddleware, userController.getProfile);
router.post('/logout', authMiddleware, userController.logout);
router.get('/getUsers', authMiddleware, adminMiddleware, userController.getUsers);
router.post('/addUser', authMiddleware, adminMiddleware, userController.addUserByAdmin);
router.put('/updateUser/:id', authMiddleware, adminMiddleware, userController.updateUserByAdmin);
router.delete('/deleteUser/:id', authMiddleware, adminMiddleware, userController.deleteUserByAdmin);

module.exports = router;