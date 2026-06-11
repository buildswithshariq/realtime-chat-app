import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { Play, Pause, Trash2, Ban, Maximize2, Copy, Download, Film } from "lucide-react";

// ─── AUDIO PLAYER ───────────────────────────────────────────

function AudioPlayer({ src }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onLoaded = () => setDuration(audio.duration || 0);
    const onTime = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100);
    };
    const onEnded = () => { setPlaying(false); setProgress(0); };
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, []);

  const toggle = () => {
    if (playing) audioRef.current.pause();
    else audioRef.current.play();
    setPlaying(!playing);
  };

  const seek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * audioRef.current.duration;
  };

  const fmt = (s) => {
    if (!s || !isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <audio ref={audioRef} src={src} preload="metadata" />
      <button onClick={toggle} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0">
        {playing ? <Pause className="w-4 h-4 text-white fill-current" /> : <Play className="w-4 h-4 text-white fill-current ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="audio-bar" onClick={seek}>
          <div className="audio-bar-fill" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] text-zinc-400 font-mono">{fmt(audioRef.current?.currentTime || 0)} / {fmt(duration)}</span>
      </div>
    </div>
  );
}

// ─── VIDEO CARD ─────────────────────────────────────────────

function VideoCard({ src }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setPlaying(!playing);
  };

  return (
    <div className="video-card" onClick={togglePlay}>
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        className={cn("video-card-player", loaded ? "opacity-100" : "opacity-0")}
        onLoadedData={() => setLoaded(true)}
        onEnded={() => setPlaying(false)}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
      />
      {!loaded && <div className="gif-message-shimmer" />}

      {/* Play overlay */}
      <AnimatePresence>
        {!playing && loaded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="video-play-overlay"
          >
            <Play className="w-7 h-7 text-white fill-white ml-1" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen button */}
      {loaded && (
        <button
          className="video-fullscreen-btn"
          onClick={(e) => {
            e.stopPropagation();
            videoRef.current?.requestFullscreen?.();
          }}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

// ─── MESSAGE BUBBLE ─────────────────────────────────────────

export default function MessageBubble({ msg, isOwnMessage, onUnsend, onImageClick }) {
  const [gifLoaded, setGifLoaded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [showUnsend, setShowUnsend] = useState(false);
  const longPressTimer = useRef(null);
  const isGif = msg.type === "gif";
  const isImage = msg.type === "image";
  const isVideo = msg.type === "video";
  const isAudio = msg.type === "audio";
  const isMedia = isGif || isImage || isVideo || isAudio;

  const handlePressStart = () => {
    if (msg.deleted) return;
    longPressTimer.current = setTimeout(() => setShowUnsend(true), 500);
  };

  const handlePressEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const handleUnsend = () => {
    setShowUnsend(false);
    onUnsend(msg._id);
  };

  const handleCopy = async () => {
    try {
      const textToCopy = msg.content || msg.text || msg.metadata?.caption || "";
      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy);
      }
      setShowUnsend(false);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(msg.content);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      const ext = isVideo ? "mp4" : "jpg";
      a.download = `yappo-${msg._id}.${ext}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setShowUnsend(false);
    } catch (err) {
      console.error("Failed to download:", err);
      // Fallback if fetch fails (e.g. CORS)
      window.open(msg.content, "_blank");
      setShowUnsend(false);
    }
  };

  const handleSeeAllGif = () => {
    window.dispatchEvent(new CustomEvent("open-gif-picker"));
    setShowUnsend(false);
  };

  const popupRef = useRef(null);

  useEffect(() => {
    if (!showUnsend) return;
    
    const handleOutsideClick = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowUnsend(false);
      }
    };
    const handleScroll = () => setShowUnsend(false);

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("touchstart", handleOutsideClick, { capture: true });
    window.addEventListener("mousedown", handleOutsideClick, { capture: true });

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("touchstart", handleOutsideClick, { capture: true });
      window.removeEventListener("mousedown", handleOutsideClick, { capture: true });
    };
  }, [showUnsend]);

  // ─── DELETED ──────────────────────────────────────────────

  if (msg.deleted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn("flex w-full mb-4", isOwnMessage ? "justify-end" : "justify-start")}
      >
        <div className={cn(
          "max-w-[75%] sm:max-w-[60%] p-4 rounded-3xl border border-white/5",
          isOwnMessage ? "bg-zinc-800/40 rounded-tr-sm" : "bg-zinc-800/40 rounded-tl-sm"
        )}>
          <div className="flex items-center gap-2 text-zinc-500 italic">
            <Ban className="w-4 h-4" />
            <span className="text-[14px]">This message was deleted</span>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── RENDER ───────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn("flex w-full mb-4 relative", isOwnMessage ? "justify-end" : "justify-start")}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <div
        className={cn(
          "max-w-[75%] sm:max-w-[60%] rounded-3xl shadow-lg relative group",
          isMedia && !isAudio ? "p-1.5" : "p-4",
          isOwnMessage
            ? isMedia && !isAudio
              ? "bg-blue-600/30 rounded-tr-sm border border-blue-500/20"
              : "bg-blue-600 text-white rounded-tr-sm shadow-blue-900/20"
            : isMedia && !isAudio
              ? "bg-zinc-800/40 backdrop-blur-md rounded-tl-sm border border-white/5"
              : "bg-zinc-800/80 backdrop-blur-md border border-white/5 text-zinc-100 rounded-tl-sm"
        )}
      >
        {!isOwnMessage && (
          <p className={cn(
            "text-[11px] font-bold tracking-wide mb-1 text-zinc-400 uppercase",
            isMedia && !isAudio && "px-2 pt-1"
          )}>
            {msg.sender?.name}
          </p>
        )}

        {/* Text */}
        {!isMedia && <p className="text-[15px] leading-relaxed">{msg.content || msg.text}</p>}

        {/* GIF */}
        {isGif && (
          <div className="gif-message-container">
            {!gifLoaded && <div className="gif-message-shimmer" />}
            <img
              src={msg.content}
              alt="GIF"
              className={cn("gif-message-img", gifLoaded ? "opacity-100" : "opacity-0")}
              onLoad={() => setGifLoaded(true)}
              loading="lazy"
            />
          </div>
        )}

        {/* Image */}
        {isImage && (
          <div className="media-message-container">
            {!imgLoaded && <div className="gif-message-shimmer" />}
            <img
              src={msg.content}
              alt="Image"
              className={cn("media-message-img", imgLoaded ? "opacity-100" : "opacity-0")}
              onLoad={() => setImgLoaded(true)}
              loading="lazy"
              onClick={() => onImageClick?.(msg._id)}
            />
          </div>
        )}

        {/* Caption for image/video */}
        {(isImage || isVideo) && msg.metadata?.caption && (
          <p className={cn(
            "text-[14px] leading-relaxed px-2 pt-2",
            isOwnMessage ? "text-white" : "text-zinc-200"
          )}>
            {msg.metadata.caption}
          </p>
        )}

        {/* Video */}
        {isVideo && <VideoCard src={msg.content} />}

        {/* Audio */}
        {isAudio && <AudioPlayer src={msg.content} />}

        {/* Timestamp + Status */}
        <div className={cn(
          "flex items-center gap-1.5 mt-2",
          isOwnMessage ? "justify-end" : "justify-start",
          isMedia && !isAudio && "px-2 pb-1"
        )}>
          <span className={cn("text-[10px] font-medium", isOwnMessage ? "text-blue-200" : "text-zinc-500")}>
            {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </span>
          {isOwnMessage && (
            <span className={cn(
              "text-[10px] font-bold uppercase tracking-wider ml-1",
              msg.status === "seen" ? "text-green-300" : msg.status === "inchat" ? "text-blue-300" : "text-blue-200/50"
            )}>
              {msg.status === "seen" ? "Seen" : msg.status === "inchat" ? "In Chat" : "Sent"}
            </span>
          )}
        </div>
      </div>

      {/* Action popup */}
      <AnimatePresence>
        {showUnsend && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={cn("absolute z-50 flex gap-2 top-full mt-1", isOwnMessage ? "right-0" : "left-0")}
          >
            {!isMedia && (
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800/90 backdrop-blur-md border border-white/10 rounded-xl text-white text-xs font-semibold shadow-xl hover:bg-zinc-700 transition-colors whitespace-nowrap"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>
            )}
            {(isImage || isVideo) && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-500/90 backdrop-blur-md border border-blue-500/30 rounded-xl text-white text-xs font-semibold shadow-xl hover:bg-blue-600 transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {isImage ? "Image" : "Video"}</span>
              </button>
            )}
            {isGif && (
              <button
                onClick={handleSeeAllGif}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-500/90 backdrop-blur-md border border-purple-500/30 rounded-xl text-white text-xs font-semibold shadow-xl hover:bg-purple-600 transition-colors whitespace-nowrap"
              >
                <Film className="w-3.5 h-3.5" />
                <span>See all GIF</span>
              </button>
            )}
              {isOwnMessage && (
                <button
                  onClick={handleUnsend}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-500/90 backdrop-blur-md border border-red-500/30 rounded-xl text-white text-xs font-semibold shadow-xl hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Unsend</span>
                </button>
              )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
