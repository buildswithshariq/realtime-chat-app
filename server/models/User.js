const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+$/, "Username cannot contain spaces"],
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        password:{
            type: String,
            required: true,
        },
        lastSeen:{
            type: Date,
            default: null,
        },
        pushSubscriptions: [
            {
                endpoint: { type: String, required: true },
                keys: {
                    p256dh: { type: String, required: true },
                    auth: { type: String, required: true },
                },
                createdAt: { type: Date, default: Date.now },
                userAgent: { type: String },
            }
        ],
    },
    {timestamps:true,}
);

module.exports= mongoose.model("User", userSchema)