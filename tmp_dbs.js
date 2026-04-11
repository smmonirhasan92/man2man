db.getMongo().getDBNames().forEach(name => {
  var size = db.getSiblingDB(name).stats().dataSize / 1024 / 1024;
  print(name + " : " + size.toFixed(2) + " MB");
});
