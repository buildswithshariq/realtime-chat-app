import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Paperclip, Mic, Image, Video, X, Square, Play, Pause, Trash2 } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import MediaPicker from "./MediaPicker";

const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_SIZE = 200 * 1024 * 1024;
const ALLOWED_IMAGE = ".jpg,.jpeg,.png,.webp";
const ALLOWED_VIDEO = ".mp4,.webm,.mov";

export default function CommandDock({ message, setMessage, sendMessage, sendMediaMessage, selectedChat, socket, token }) {
  const typingTimeoutRef = useRef(null);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Staged media
  const [stagedImages, setStagedImages] = useState([]);   // [{ file, preview }]
  const [stagedVideo, setStagedVideo] = useState(null);    // { file, preview }
  const [stagedAudio, setStagedAudio] = useState(null);    // { file, url, duration }
  const [uploading, setUploading] = useState(false);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingIntervalRef = useRef(null);

  // Audio preview playback
  const audioPreviewRef = useRef(null);
  const [audioPlaying, setAudioPlaying] = useState(false);

  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      stagedImages.forEach((s) => URL.revokeObjectURL(s.preview));
      if (stagedVideo) URL.revokeObjectURL(stagedVideo.preview);
      if (stagedAudio) URL.revokeObjectURL(stagedAudio.url);
    };
  }, []);

  const hasStagedMedia = stagedImages.length > 0 || stagedVideo || stagedAudio;

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (!selectedChat) return;
    socket.emit("typing", selectedChat._id);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", selectedChat._id);
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEmojiSelect = (emoji) => {
    setMessage((prev) => prev + emoji);
  };

  const handleGifSelect = (gifUrl, metadata) => {
    setShowMediaPicker(false);
    sendMediaMessage(gifUrl, "gif", metadata);
  };

  // ─── FILE STAGING ─────────────────────────────────────────

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    setShowAttachMenu(false);

    const valid = files.filter((f) => {
      if (f.size > MAX_IMAGE_SIZE) {
        alert(`${f.name} is over 20MB`);
        return false;
      }
      return true;
    });

    const newStaged = valid.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setStagedImages((prev) => [...prev, ...newStaged]);
    // Clear video if images are added
    if (stagedVideo) {
      URL.revokeObjectURL(stagedVideo.preview);
      setStagedVideo(null);
    }
    e.target.value = "";
  };

  const removeImage = (index) => {
    setStagedImages((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleVideoSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setShowAttachMenu(false);

    if (file.size > MAX_VIDEO_SIZE) {
      alert("Video must be under 200MB");
      return;
    }

    // Clear images if video is selected
    stagedImages.forEach((s) => URL.revokeObjectURL(s.preview));
    setStagedImages([]);

    if (stagedVideo) URL.revokeObjectURL(stagedVideo.preview);
    setStagedVideo({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    });
    e.target.value = "";
  };

  const removeVideo = () => {
    if (stagedVideo) URL.revokeObjectURL(stagedVideo.preview);
    setStagedVideo(null);
  };

  // ─── VOICE RECORDING ─────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordingIntervalRef.current);
        const dur = recordingTime;
        setRecordingTime(0);
        setIsRecording(false);

        if (blob.size > 0) {
          const file = new File([blob], "voice-note.webm", { type: "audio/webm" });
          setStagedAudio({
            file,
            url: URL.createObjectURL(blob),
            duration: dur,
          });
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.log("Microphone access denied:", err);
      alert("Microphone access is required for voice notes");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingIntervalRef.current);
    setRecordingTime(0);
    setIsRecording(false);
    audioChunksRef.current = [];
  };

  const removeAudio = () => {
    if (stagedAudio) URL.revokeObjectURL(stagedAudio.url);
    setStagedAudio(null);
    setAudioPlaying(false);
  };

  const toggleAudioPreview = () => {
    if (!audioPreviewRef.current) return;
    if (audioPlaying) {
      audioPreviewRef.current.pause();
    } else {
      audioPreviewRef.current.play();
    }
    setAudioPlaying(!audioPlaying);
  };

  // ─── UNIFIED SEND ─────────────────────────────────────────

  const handleSend = async () => {
    if (uploading) return;
    const caption = message.trim();

    // Voice note
    if (stagedAudio) {
      setUploading(true);
      await sendMediaMessage(stagedAudio.file, "audio", { duration: stagedAudio.duration });
      removeAudio();
      setUploading(false);
      return;
    }

    // Images
    if (stagedImages.length > 0) {
      setUploading(true);
      for (let i = 0; i < stagedImages.length; i++) {
        const meta = i === 0 && caption ? { caption } : {};
        await sendMediaMessage(stagedImages[i].file, "image", meta);
      }
      stagedImages.forEach((s) => URL.revokeObjectURL(s.preview));
      setStagedImages([]);
      setMessage("");
      setUploading(false);
      return;
    }

    // Video
    if (stagedVideo) {
      setUploading(true);
      const meta = caption ? { caption } : {};
      await sendMediaMessage(stagedVideo.file, "video", meta);
      removeVideo();
      setMessage("");
      setUploading(false);
      return;
    }

    // Text only
    if (caption) {
      sendMessage();
    }
  };

  const formatTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (!selectedChat) return null;

  // ─── RECORDING UI ─────────────────────────────────────────

  if (isRecording) {
    return (
      <div className="p-2 sm:p-4 md:p-6 w-full flex justify-center pb-3 sm:pb-6 flex-shrink-0">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-4xl glass-card rounded-full p-2 flex items-center gap-3 relative shadow-2xl shadow-black/50"
        >
          <button onClick={cancelRecording} className="p-2 ml-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-3 px-2">
            <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-mono text-red-400 font-semibold">{formatTime(recordingTime)}</span>
            <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div className="h-full bg-red-500/60 rounded-full" animate={{ width: ["0%", "100%"] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} />
            </div>
          </div>
          <motion.button onClick={stopRecording} whileTap={{ scale: 0.9 }} className="bg-red-500 hover:bg-red-400 text-white p-3 rounded-full shadow-lg shadow-red-600/30 transition-all flex items-center justify-center mr-1">
            <Square className="w-4 h-4 fill-current" />
          </motion.button>
        </motion.div>
      </div>
    );
  }

  // ─── MAIN UI ──────────────────────────────────────────────

  return (
    <div className="p-2 sm:p-4 md:p-6 w-full flex justify-center pb-3 sm:pb-6 relative flex-shrink-0">
      {/* Hidden file inputs */}
      <input ref={imageInputRef} type="file" accept={ALLOWED_IMAGE} multiple onChange={handleImageSelect} className="hidden" />
      <input ref={videoInputRef} type="file" accept={ALLOWED_VIDEO} onChange={handleVideoSelect} className="hidden" />

      {/* Media Picker Popup */}
      <MediaPicker isOpen={showMediaPicker} onClose={() => setShowMediaPicker(false)} onEmojiSelect={handleEmojiSelect} onGifSelect={handleGifSelect} token={token} />

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-4xl glass-card rounded-3xl p-1.5 sm:p-2 flex flex-col relative shadow-2xl shadow-black/50 overflow-hidden"
      >
        {/* ─── STAGED PREVIEW AREA ─── */}
        <AnimatePresence>
          {hasStagedMedia && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="overflow-hidden"
            >
              <div className="staged-preview-area">
                {/* Staged Images */}
                {stagedImages.length > 0 && (
                  <div className="staged-image-strip">
                    {stagedImages.map((item, i) => (
                      <div key={i} className="staged-thumb">
                        <img src={item.preview} alt="" />
                        <button className="staged-remove" onClick={() => removeImage(i)}>
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <button className="staged-add-more" onClick={() => imageInputRef.current?.click()}>
                      <span className="text-lg">+</span>
                    </button>
                  </div>
                )}

                {/* Staged Video */}
                {stagedVideo && (
                  <div className="staged-video-card">
                    <video src={stagedVideo.preview} className="staged-video-preview" muted />
                    <div className="staged-video-info">
                      <Video className="w-4 h-4 text-purple-400" />
                      <span className="text-xs text-zinc-300 truncate flex-1">{stagedVideo.name}</span>
                      <button className="staged-remove-inline" onClick={removeVideo}>
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Staged Audio */}
                {stagedAudio && (
                  <div className="staged-audio-card">
                    <audio ref={audioPreviewRef} src={stagedAudio.url}
                      onEnded={() => setAudioPlaying(false)}
                    />
                    <button onClick={toggleAudioPreview} className="staged-audio-play">
                      {audioPlaying
                        ? <Pause className="w-4 h-4 fill-current" />
                        : <Play className="w-4 h-4 fill-current ml-0.5" />}
                    </button>
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="h-1 bg-white/10 rounded-full" />
                      <span className="text-[10px] text-zinc-400 font-mono">Voice note · {formatTime(stagedAudio.duration)}</span>
                    </div>
                    <button className="staged-remove-inline" onClick={removeAudio}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Upload progress bar */}
              {uploading && (
                <div className="w-full h-0.5 bg-white/5">
                  <motion.div
                    className="h-full bg-blue-500"
                    animate={{ width: ["0%", "100%"] }}
                    transition={{ duration: 3, ease: "easeInOut" }}
                  />
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── INPUT ROW ─── */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Paperclip / Attach Menu */}
          <div className="flex gap-1 pl-1 sm:pl-2 relative flex-shrink-0">
            <button
              onClick={() => setShowAttachMenu((prev) => !prev)}
              className={`p-2 rounded-full transition-colors ${
                showAttachMenu ? "text-blue-400 bg-blue-500/15" : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Paperclip className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {showAttachMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="attach-menu"
                >
                  <button onClick={() => { imageInputRef.current?.click(); }} className="attach-menu-item">
                    <div className="attach-icon bg-emerald-500/15 text-emerald-400"><Image className="w-4 h-4" /></div>
                    <span>Image</span>
                  </button>
                  <button onClick={() => { videoInputRef.current?.click(); }} className="attach-menu-item">
                    <div className="attach-icon bg-purple-500/15 text-purple-400"><Video className="w-4 h-4" /></div>
                    <span>Video</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <input
            type="text"
            placeholder={hasStagedMedia ? "Add a caption..." : "Type a message..."}
            value={message}
            onChange={handleTyping}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-white placeholder:text-zinc-500 px-2 sm:px-3 py-2 text-sm sm:text-base"
          />

          <div className="flex gap-1 pr-0.5 sm:pr-1 flex-shrink-0">
            <button
              data-media-picker-toggle
              onClick={() => setShowMediaPicker((prev) => !prev)}
              className={`p-2 rounded-full transition-colors ${
                showMediaPicker ? "text-blue-400 bg-blue-500/15" : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
            >
              <Smile className="w-5 h-5" />
            </button>

            <AnimatePresence mode="popLayout">
              {message.trim() || hasStagedMedia ? (
                <motion.button
                  key="send"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  onClick={handleSend}
                  disabled={uploading}
                  className={`p-2.5 sm:p-3 rounded-full shadow-lg transition-all flex items-center justify-center flex-shrink-0 ${
                    uploading
                      ? "bg-blue-800 text-blue-300 cursor-wait"
                      : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30"
                  }`}
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </motion.button>
              ) : (
                <motion.button
                  key="mic"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  onClick={startRecording}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 p-2.5 sm:p-3 rounded-full transition-all flex items-center justify-center flex-shrink-0"
                >
                  <Mic className="w-4 h-4" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
