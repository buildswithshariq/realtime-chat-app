const Chat = require("../models/Chat");

const createChat = async (req, res) => {
  try {
    const { userId } = req.body;

    // Check existing chat
    let chat = await Chat.findOne({
      users: {
        $all: [req.user._id, userId],
      },
    }).populate("users", "-password");

    if (chat) {
      return res.status(200).json(chat);
    }

    // Create new chat
    chat = await Chat.create({
      users: [req.user._id, userId],
    });
    chat = await chat.populate("users", "-password");

    res.status(201).json(chat);
  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Server Error",
    });
  }
};

const getChats = async (req, res) => {
    try {
        const chats = await Chat.find({
            users: req.user._id,
        }).populate("users", "-password").lean();

        const Message = require("../models/Message");
        
        // Fetch latest message for each chat to show previews in the sidebar
        for (let chat of chats) {
            const latestMsg = await Message.findOne({ chat: chat._id }).sort({ createdAt: -1 }).lean();
            if (latestMsg) {
                chat.latestMessage = latestMsg;
            }
        }

        // Only return chats that have at least one message
        const chatsWithMessages = chats.filter(chat => chat.latestMessage != null);

        // Sort by the latest message's createdAt (descending)
        chatsWithMessages.sort((a, b) => {
            return new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt);
        });

        res.status(200).json(chatsWithMessages);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server Error",
        });
    }
};

module.exports = {
  createChat,
  getChats,
};