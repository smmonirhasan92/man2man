const express = require('express');
const router = express.Router();
const bannerController = require('./bannerController');

// Public
router.get('/', bannerController.getBanners);

// Admin (Should add auth middleware later)
router.post('/', bannerController.createBanner);
router.delete('/:id', bannerController.deleteBanner);

module.exports = router;
