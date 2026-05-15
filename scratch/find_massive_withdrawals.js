const mongoose = require('mongoose');
const uri = process.env.MONGO_URI || "mongodb://root:admin123@mongo:27017/man2man?authSource=admin";

mongoose.connect(uri)
  .then(async () => {
    console.log("Connected to MongoDB.");
    
    // Find massive withdrawals
    const db = mongoose.connection.useDb('man2man');
    const transactions = db.collection('transactions');
    
    const massive = await transactions.find({
        type: { $in: ['withdraw', 'cash_out'] },
        status: 'completed',
        amount: { $lt: -1000000 } // Or gt 1M if positive
    }).toArray();
    
    console.log("Massive negative withdrawals:", massive);
    
    const massivePos = await transactions.find({
        type: { $in: ['withdraw', 'cash_out'] },
        status: 'completed',
        amount: { $gt: 1000000 }
    }).toArray();
    
    console.log("Massive positive withdrawals:", massivePos);

    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
