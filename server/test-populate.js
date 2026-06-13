const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({ name: String, pushSubscriptions: [String] });
const chatSchema = new Schema({ users: [{ type: Schema.Types.ObjectId, ref: 'UserTest' }] });

const UserTest = mongoose.model('UserTest', userSchema);
const ChatTest = mongoose.model('ChatTest', chatSchema);

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/test-populate');
  
  const u1 = await UserTest.create({ name: 'Alice', pushSubscriptions: ['sub1', 'sub2'] });
  const u2 = await UserTest.create({ name: 'Bob', pushSubscriptions: ['sub3'] });
  
  const c = await ChatTest.create({ users: [u1._id, u2._id] });
  
  const fetchedChat = await ChatTest.findById(c._id).populate('users', 'pushSubscriptions');
  console.log('Populated Chat Users:');
  console.log(JSON.stringify(fetchedChat.users, null, 2));
  
  await mongoose.disconnect();
}

run().catch(console.error);
