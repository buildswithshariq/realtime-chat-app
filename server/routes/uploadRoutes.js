const express = require("express");
const router = express.Router();
const { uploadFile } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");

router.post("/", protect, upload.single("file"), uploadFile);

module.exports = router;
