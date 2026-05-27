const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({

    users:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref:"User"
        },
    ],
    lastReadAt: {
        type: Map,
        of: Date,
        default: {},
    },
},
{
    timestamps:true,
}
);

module.exports= mongoose.model("Chat", chatSchema);