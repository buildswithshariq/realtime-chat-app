const express = require("express");

const router = express.Router();

const {
  sendMessage,
  getMessages,
  markAsRead,
  getUnreadCounts,
  updateMessageStatus,
} = require("../controllers/messageController");

const { protect } = require("../middleware/authMiddleware");

router.get("/unread", protect, getUnreadCounts);

router.post("/", protect, sendMessage);

router.get("/:chatId", protect, getMessages);

router.put("/:chatId/read", protect, markAsRead);

router.put("/status/:chatId", protect, updateMessageStatus);

module.exports = router;