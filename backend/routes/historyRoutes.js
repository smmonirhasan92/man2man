const express = require('express');
const router = express.Router();
const controller = require('../controllers/historyController');
const auth = require('../middleware/authMiddleware');

router.get('/all', auth, controller.getHistory);
router.get('/ledger', auth, controller.getHistory);

module.exports = router;
