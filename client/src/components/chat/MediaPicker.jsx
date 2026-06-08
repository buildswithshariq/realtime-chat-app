import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import EmojiPicker from "emoji-picker-react";
import { Search, X, TrendingUp, Clock, Smile, Film } from "lucide-react";
import axios from "axios";
import { API_URL } from "../../config/api";

const RECENT_EMOJIS_KEY = "recentEmojis";
const MAX_RECENT = 20;

function getRecentEmojis() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_EMOJIS_KEY)) || [];
  } catch {
    return [];
  }
}

function saveRecentEmoji(emoji) {
  const recent = getRecentEmojis().filter((e) => e !== emoji);
  recent.unshift(emoji);
  localStorage.setItem(
    RECENT_EMOJIS_KEY,
    JSON.stringify(recent.slice(0, MAX_RECENT))
  );
}

export default function MediaPicker({
  isOpen,
  onClose,
  onEmojiSelect,
  onGifSelect,
  token,
}) {
  const [activeTab, setActiveTab] = useState("emoji");
  const [gifSearch, setGifSearch] = useState("");
  const [gifs, setGifs] = useState([]);
  const [loadingGifs, setLoadingGifs] = useState(false);
  const [recentEmojis, setRecentEmojis] = useState(getRecentEmojis);
  const pickerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        // Don't close if clicking the toggle button (parent handles that)
        if (e.target.closest("[data-media-picker-toggle]")) return;
        onClose();
      }
    };
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Fetch trending GIFs when GIF tab opens
  useEffect(() => {
    if (isOpen && activeTab === "gif" && gifs.length === 0 && !gifSearch) {
      fetchTrendingGifs();
    }
  }, [isOpen, activeTab]);

  const fetchTrendingGifs = async () => {
    setLoadingGifs(true);
    try {
      const res = await axios.get(`${API_URL}/api/gif/trending`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 20 },
      });
      setGifs(res.data.results);
    } catch (err) {
      console.log("Failed to fetch trending GIFs:", err);
    } finally {
      setLoadingGifs(false);
    }
  };

  const searchGifsApi = useCallback(
    async (query) => {
      if (!query.trim()) {
        fetchTrendingGifs();
        return;
      }
      setLoadingGifs(true);
      try {
        const res = await axios.get(`${API_URL}/api/gif/search`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { q: query, limit: 20 },
        });
        setGifs(res.data.results);
      } catch (err) {
        console.log("Failed to search GIFs:", err);
      } finally {
        setLoadingGifs(false);
      }
    },
    [token]
  );

  // Debounced GIF search
  const handleGifSearch = (e) => {
    const value = e.target.value;
    setGifSearch(value);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchGifsApi(value);
    }, 300);
  };

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji;
    saveRecentEmoji(emoji);
    setRecentEmojis(getRecentEmojis());
    onEmojiSelect(emoji);
  };

  const handleGifClick = (gif) => {
    onGifSelect(gif.gifUrl, {
      giphyId: gif.id,
    });
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={pickerRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="media-picker"
      >
        {/* Tab Bar */}
        <div className="media-picker-tabs">
          <button
            onClick={() => setActiveTab("emoji")}
            className={`media-picker-tab ${activeTab === "emoji" ? "active" : ""}`}
          >
            <Smile className="w-4 h-4" />
            <span>Emoji</span>
          </button>
          <button
            onClick={() => {
              setActiveTab("gif");
            }}
            className={`media-picker-tab ${activeTab === "gif" ? "active" : ""}`}
          >
            <Film className="w-4 h-4" />
            <span>GIF</span>
          </button>

          <button
            onClick={onClose}
            className="media-picker-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="media-picker-content">
          {activeTab === "emoji" && (
            <div className="media-picker-emoji">
              {/* Recent Emojis */}
              {recentEmojis.length > 0 && (
                <div className="recent-emojis">
                  <div className="recent-emojis-label">
                    <Clock className="w-3 h-3" />
                    <span>Recent</span>
                  </div>
                  <div className="recent-emojis-grid">
                    {recentEmojis.map((emoji, i) => (
                      <button
                        key={`${emoji}-${i}`}
                        className="recent-emoji-btn"
                        onClick={() => handleEmojiClick({ emoji })}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <EmojiPicker
                onEmojiClick={handleEmojiClick}
                theme="dark"
                width="100%"
                height={recentEmojis.length > 0 ? 310 : 370}
                searchPlaceHolder="Search emojis..."
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
                lazyLoadEmojis
              />
            </div>
          )}

          {activeTab === "gif" && (
            <div className="media-picker-gif">
              {/* GIF Search */}
              <div className="gif-search-bar">
                <Search className="w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search GIFs..."
                  value={gifSearch}
                  onChange={handleGifSearch}
                  className="gif-search-input"
                  autoFocus
                />
                {gifSearch && (
                  <button
                    onClick={() => {
                      setGifSearch("");
                      fetchTrendingGifs();
                    }}
                    className="gif-search-clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Trending label */}
              {!gifSearch && (
                <div className="gif-section-label">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Trending</span>
                </div>
              )}

              {/* GIF Grid */}
              <div className="gif-grid scrollbar-hide">
                {loadingGifs ? (
                  <>
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="gif-shimmer" />
                    ))}
                  </>
                ) : gifs.length > 0 ? (
                  gifs.map((gif) => (
                    <button
                      key={gif.id}
                      className="gif-item"
                      onClick={() => handleGifClick(gif)}
                      title={gif.title}
                    >
                      <img
                        src={gif.previewUrl}
                        alt={gif.title}
                        loading="lazy"
                      />
                    </button>
                  ))
                ) : (
                  <div className="gif-empty">
                    <p>No GIFs found</p>
                  </div>
                )}
              </div>

              {/* GIPHY attribution */}
              <div className="giphy-attribution">
                <span>Powered by</span>
                <span className="giphy-brand">GIPHY</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
