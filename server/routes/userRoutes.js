const express = require("express");

const router = express.Router();

const { getUsers, savePushSubscription } = require("../controllers/userController");

const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, getUsers);
router.post("/push-subscription", protect, savePushSubscription);

module.exports = router;