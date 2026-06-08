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
    },
    {timestamps:true,}
);

module.exports= mongoose.model("User", userSchema)