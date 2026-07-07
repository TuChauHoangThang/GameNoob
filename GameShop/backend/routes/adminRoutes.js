const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');

// Tất cả route admin đều yêu cầu: đăng nhập + là admin
router.use(authMiddleware, adminController.requireAdmin);

// ── Dashboard ──────────────────────────────────────────────────────────────────
router.get('/stats', adminController.getDashboardStats);

// ── Quản lý Users ──────────────────────────────────────────────────────────────
router.get('/users', adminController.getAllUsers);
router.delete('/users/:id', adminController.deleteUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch('/users/:id/ban', adminController.toggleBanUser);

// ── Quản lý Games ──────────────────────────────────────────────────────────────
router.get('/games', adminController.getAllGamesAdmin);
router.patch('/games/:id/price', adminController.updateGamePrice);
router.delete('/games/:id', adminController.deleteGame);
router.post('/games', adminController.addGame);
router.post('/games/import-steam', adminController.importGameFromSteam);

// ── Quản lý Đơn hàng ──────────────────────────────────────────────────────────
router.get('/orders', adminController.getAllOrders);

// ── Quản lý VNPay ─────────────────────────────────────────────────────────────
router.get('/vnpay-orders', adminController.getVNPayOrders);

// ── Kiểm duyệt nội dung ───────────────────────────────────────────────────────
router.get('/reviews', adminController.getAllReviews);
router.delete('/reviews/:id', adminController.deleteReview);
router.get('/posts', adminController.getAllPosts);
router.delete('/posts/:id', adminController.deletePost);

// ── Xuất dữ liệu CSV ──────────────────────────────────────────────────────────
router.get('/export/users', adminController.exportUsers);
router.get('/export/orders', adminController.exportOrders);

module.exports = router;
