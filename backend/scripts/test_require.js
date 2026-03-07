const deps = [
    '../modules/user/UserModel',
    '../modules/wallet/TransactionModel',
    '../modules/wallet/WithdrawalModel',
    '../modules/wallet/DepositModel',
    '../modules/p2p/P2POrderModel',
    '../modules/p2p/P2PAdModel',
    '../modules/game/LotteryTicketModel',
    '../modules/task/TaskHistoryModel',
    '../modules/notification/NotificationModel'
];

deps.forEach(dep => {
    try {
        require(dep);
        console.log("OK:", dep);
    } catch (e) {
        if (e.code === 'MODULE_NOT_FOUND') {
            console.log("MISSING:", dep);
        } else {
            console.log("ERROR LOAD:", dep, e.message);
        }
    }
});
