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

        type: {
            type: String,
            enum: ["text", "gif", "image", "audio", "video"],
            default: "text",
        },

        content: {
            type: String,
            required: true,
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },

        deleted: {
            type: Boolean,
            default: false,
        },

        chat: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Chat",
        },
        reactions: [{
            userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            emoji: String,
        }],
    },
    {timestamps: true},
);

module.exports= mongoose.model("Message", messageSchema);