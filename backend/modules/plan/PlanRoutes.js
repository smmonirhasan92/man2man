const express = require('express');
const router = express.Router();
const planController = require('../../controllers/PlanController');
const authMiddleware = require('../../middleware/authMiddleware');
const adminMiddleware = require('../../middleware/adminMiddleware');

// Public Route for Marketplace
router.get('/', planController.getAllPlans);
router.post('/seed', planController.seedDefaultPlans);
router.get('/my-plans', authMiddleware, planController.getMyActivePlans);
router.post('/purchase/:planId', authMiddleware, planController.purchasePlan);

// [ADMIN] Plan Management
router.post('/', authMiddleware, adminMiddleware, planController.createPlan);
router.put('/:id', authMiddleware, adminMiddleware, planController.updatePlan);
router.delete('/:id', authMiddleware, adminMiddleware, planController.deletePlan);

module.exports = router;
