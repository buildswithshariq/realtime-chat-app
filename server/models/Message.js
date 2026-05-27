const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
        },

        status: {
            type: String,
            enum: ["sent", "inchat", "seen"],
            default: "sent",
        },

        content: {
            type: String,
            required: true,
        },

        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
        },
    },
    {timestamps: true},
);

module.exports= mongoose.model("Message", messageSchema);