const express = require('express');
const router = express.Router();
const planController = require('../../controllers/PlanController');
const authMiddleware = require('../../middleware/authMiddleware');

// Public Route for Marketplace
router.get('/', planController.getAllPlans);
router.post('/seed', planController.seedDefaultPlans); // [NEW] Seeder
router.get('/my-plans', authMiddleware, planController.getMyActivePlans);
router.post('/purchase/:planId', authMiddleware, planController.purchasePlan);

module.exports = router;
