const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Tất cả route admin đều yêu cầu: đăng nhập + là admin
router.use(authMiddleware, adminController.requireAdmin);

// Dashboard
router.get('/stats', adminController.getDashboardStats);

// Quản lý user
router.get('/users', adminController.getAllUsers);

// Quản lý game
router.get('/games', adminController.getAllGamesAdmin);
router.patch('/games/:id/price', adminController.updateGamePrice);
router.delete('/games/:id', adminController.deleteGame);

module.exports = router;
