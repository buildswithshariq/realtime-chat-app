const express = require("express");
const router = express.Router();

const { searchGifs, getTrendingGifs } = require("../controllers/gifController");
const { protect } = require("../middleware/authMiddleware");

router.get("/search", protect, searchGifs);
router.get("/trending", protect, getTrendingGifs);

module.exports = router;
