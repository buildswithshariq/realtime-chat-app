const Message = require("../models/Message");

const sendMessage = async (req, res)=>{
    
    try{
        const {content, chatId} = req.body;
        if(!content || !chatId){
            return res.status(400).json({
                message:"please provide content and chatId",
            });

        }

        const message = await Message.create({
            sender: req.user._id,
            content,
            chat: chatId,
        });

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
        .populate("sender","name email")
        .sort({createdAt: 1});

        res.status(200).json(messages);
    } catch(error){
        console.log(error);

        res.status(500).json({
            error: error.message,
        });
    }
};

module.exports = {sendMessage, getMessages};