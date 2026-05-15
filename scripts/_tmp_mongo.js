
var results = db.transactions.find({
  amount: {$lt: -1000}
}).sort({amount:1}).limit(20).toArray();
results.forEach(function(t){
  print(t.type + " | amount: " + t.amount + " | status: " + t.status + " | date: " + t.createdAt + " | desc: " + t.description);
});
print("Total suspicious count: " + db.transactions.count({amount:{$lt:-1000}}));
