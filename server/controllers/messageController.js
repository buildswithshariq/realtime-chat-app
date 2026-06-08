const Message = require("../models/Message");
const Chat = require("../models/Chat");

const sendMessage = async (req, res)=>{
    
    try{
        const {content, chatId, type, metadata} = req.body;
        if(!content || !chatId){
            return res.status(400).json({
                message:"please provide content and chatId",
            });

        }

        let message = await Message.create({
            sender: req.user._id,
            content,
            chat: chatId,
            type: type || "text",
            metadata: metadata || {},
        });

        message = await message.populate("sender", "name username");

        res.status(201).json(message);

    } catch(error){
        console.log(error);

        res.status(500).json({
            message: "Server Error",
        });
    }

};

const getMessages= async (req,res)=>{
    try{
        const messages = await Message.find({
            chat: req.params.chatId,
        })
        .populate("sender","name username")
        .sort({createdAt: 1});

        res.status(200).json(messages);
    } catch(error){
        console.log(error);

        res.status(500).json({
            error: error.message,
        });
    }
};

const markAsRead = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id.toString();

        await Chat.findByIdAndUpdate(chatId, {
            [`lastReadAt.${userId}`]: new Date(),
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server Error",
        });
    }
};

const getUnreadCounts = async (req, res) => {
    try {
        const userId = req.user._id.toString();

        const chats = await Chat.find({
            users: req.user._id,
        });

        const unreadCounts = {};

        for (const chat of chats) {
            const lastRead = chat.lastReadAt?.get(userId) || new Date(0);

            const count = await Message.countDocuments({
                chat: chat._id,
                sender: { $ne: req.user._id },
                createdAt: { $gt: lastRead },
            });

            if (count > 0) {
                unreadCounts[chat._id.toString()] = count >= 5 ? "4+" : count;
            }
        }

        res.status(200).json(unreadCounts);
    } catch (error) {
        console.log(error);

        res.status(500).json({
            message: "Server Error",
        });
    }
};

// Update message status: sent → inchat → seen (never downgrades)
const updateMessageStatus = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { status } = req.body; // "inchat" or "seen"

        if (!["inchat", "seen"].includes(status)) {
            return res.status(400).json({
                message: "Invalid status. Must be 'inchat' or 'seen'.",
            });
        }

        // Build query to only UPGRADE status, never downgrade
        const query = {
            chat: chatId,
            sender: { $ne: req.user._id },
        };

        if (status === "inchat") {
            // Only upgrade "sent" → "inchat", don't touch already "seen"
            query.status = "sent";
        } else if (status === "seen") {
            // Upgrade both "sent" and "inchat" → "seen"
            query.status = { $in: ["sent", "inchat"] };
        }

        await Message.updateMany(query, { status });

        res.status(200).json({ success: true });
    } catch (error) {
        console.log(error);

        res.status(500).json({
            error: error.message,
        });
    }
};

// Unsend (soft-delete) a message
const unsendMessage = async (req, res) => {
    try {
        const { messageId } = req.params;

        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Only sender can unsend
        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "You can only unsend your own messages" });
        }

        message.deleted = true;
        await message.save();

        await message.populate("sender", "name username");

        res.status(200).json(message);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server Error" });
    }
};

module.exports = {sendMessage, getMessages, markAsRead, getUnreadCounts, updateMessageStatus, unsendMessage};