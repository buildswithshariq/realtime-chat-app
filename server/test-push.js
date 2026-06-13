const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const User = require('./models/User');
  const users = await User.find({});
  let totalSubs = 0;
  users.forEach(u => {
    if (u.pushSubscriptions && u.pushSubscriptions.length > 0) {
      console.log(`User: ${u.username}, Subs: ${u.pushSubscriptions.length}`);
      totalSubs += u.pushSubscriptions.length;
    }
  });
  console.log(`Total subscriptions in DB: ${totalSubs}`);
  process.exit(0);
}).catch(e => {
  console.error(e);
  process.exit(1);
});
