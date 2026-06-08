const axios = require("axios");

const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const GIPHY_BASE = "https://api.giphy.com/v1/gifs";

const searchGifs = async (req, res) => {
    try {
        const { q, limit = 20, offset = 0 } = req.query;

        if (!q) {
            return res.status(400).json({ message: "Search query (q) is required" });
        }

        const response = await axios.get(`${GIPHY_BASE}/search`, {
            params: {
                api_key: GIPHY_API_KEY,
                q,
                limit,
                offset,
                rating: "pg-13",
                lang: "en",
            },
        });

        res.status(200).json({
            results: response.data.data.map((gif) => ({
                id: gif.id,
                title: gif.title,
                previewUrl: gif.images.fixed_width_small.url,
                gifUrl: gif.images.fixed_width.url,
            })),
            pagination: response.data.pagination,
        });
    } catch (error) {
        console.log("GIPHY search error:", error.message);
        res.status(500).json({ message: "Failed to search GIFs" });
    }
};

const getTrendingGifs = async (req, res) => {
    try {
        const { limit = 20, offset = 0 } = req.query;

        const response = await axios.get(`${GIPHY_BASE}/trending`, {
            params: {
                api_key: GIPHY_API_KEY,
                limit,
                offset,
                rating: "pg-13",
            },
        });

        res.status(200).json({
            results: response.data.data.map((gif) => ({
                id: gif.id,
                title: gif.title,
                previewUrl: gif.images.fixed_width_small.url,
                gifUrl: gif.images.fixed_width.url,
            })),
            pagination: response.data.pagination,
        });
    } catch (error) {
        console.log("GIPHY trending error:", error.message);
        res.status(500).json({ message: "Failed to fetch trending GIFs" });
    }
};

module.exports = { searchGifs, getTrendingGifs };
