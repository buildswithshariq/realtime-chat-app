const express = require("express");

const router = express.Router();

router.post("/register", (req, res)=>{
    res.json({
        message: "Registered route Working",
    });
});

module.exports= router;