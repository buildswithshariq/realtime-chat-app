const express = require("express");

const router = express.Router();

const { createChat, getChats } = require("../controllers/chatController");

const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createChat);
router.get("/",protect, getChats)

module.exports = router;