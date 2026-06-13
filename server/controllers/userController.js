const User = require("../models/User");

const getUsers = async (req, res) => {

  try {

    const users = await User.find({
      _id: { $ne: req.user._id },
    }).select("-password");

    res.status(200).json(users);

  } catch (error) {

    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });

  }

};

const savePushSubscription = async (req, res) => {
  try {
    const { subscription, userAgent } = req.body;
    
    // Check if it already exists
    const user = await User.findById(req.user._id);
    const exists = user.pushSubscriptions.some(sub => sub.endpoint === subscription.endpoint);
    
    if (!exists) {
      user.pushSubscriptions.push({
        endpoint: subscription.endpoint,
        keys: subscription.keys,
        userAgent: userAgent || "Unknown",
        createdAt: new Date()
      });
      await user.save();
    }
    
    res.status(200).json({ message: "Subscription saved successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  getUsers,
  savePushSubscription,
};