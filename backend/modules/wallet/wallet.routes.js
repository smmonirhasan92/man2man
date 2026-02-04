const express = require('express');
const router = express.Router();
const walletController = require('./wallet.controller');
const authMiddleware = require('../../middleware/authMiddleware');
const upload = require('../../middleware/uploadMiddleware');

router.post('/transfer/game', authMiddleware, walletController.transferToGame);
router.post('/withdraw-game', authMiddleware, walletController.withdrawGameFunds);
router.post('/withdraw', authMiddleware, walletController.requestWithdrawal); // Main Withdrawal
router.post('/transfer/main', authMiddleware, walletController.transferToMain);
router.post('/transfer/purchase', authMiddleware, walletController.transferToPurchase);
router.post('/load-purchase', authMiddleware, walletController.loadPurchaseWallet);

// P2P Transfer (USA Affiliate Marketing v2.0)
router.post('/transfer', authMiddleware, walletController.transferMoney);

router.get('/balance', authMiddleware, walletController.getWallet);
router.post('/swap', authMiddleware, walletController.swapWallet); // [NEW] Wallet Swap
router.post('/recharge', authMiddleware, upload.single('proofImage'), walletController.requestRecharge);

// router.post('/activate', authMiddleware, upload.single('kycImage'), walletController.activateWallet);

module.exports = router;
