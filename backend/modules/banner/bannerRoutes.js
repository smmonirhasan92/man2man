const express = require('express');
const router = express.Router();
const bannerController = require('./bannerController');
const authMiddleware = require('../../middleware/authMiddleware');
const adminMiddleware = require('../../middleware/adminMiddleware');

// [PUBLIC] Anyone can read active banners for the slider
router.get('/', bannerController.getBanners);

// [ADMIN ONLY] Manage banners - secured with auth + admin check
router.post('/', authMiddleware, adminMiddleware, bannerController.createBanner);
router.put('/:id', authMiddleware, adminMiddleware, bannerController.updateBanner);
router.patch('/:id/toggle', authMiddleware, adminMiddleware, bannerController.toggleBanner);
router.delete('/:id', authMiddleware, adminMiddleware, bannerController.deleteBanner);

module.exports = router;
