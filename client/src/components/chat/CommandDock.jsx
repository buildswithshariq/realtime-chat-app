import { motion, AnimatePresence } from "framer-motion";
import { Send, Smile, Paperclip, Mic } from "lucide-react";
import { useRef } from "react";

export default function CommandDock({ message, setMessage, sendMessage, selectedChat, socket }) {
  const typingTimeoutRef = useRef(null);

  const handleTyping = (e) => {
    setMessage(e.target.value);
    if (!selectedChat) return;

    socket.emit("typing", selectedChat._id);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", selectedChat._id);
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!selectedChat) return null;

  return (
    <div className="p-4 md:p-6 w-full flex justify-center pb-6">
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="w-full max-w-4xl glass-card rounded-full p-2 flex items-center gap-2 relative shadow-2xl shadow-black/50"
      >
        <div className="flex gap-1 pl-2">
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
        </div>

        <input
          type="text"
          placeholder="Type a message..."
          value={message}
          onChange={handleTyping}
          onKeyDown={handleKeyDown}
          className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-zinc-500 px-3 py-2"
        />

        <div className="flex gap-1 pr-1">
          <button className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:block">
            <Smile className="w-5 h-5" />
          </button>
          
          <AnimatePresence mode="popLayout">
            {message.trim() ? (
              <motion.button
                key="send"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                onClick={sendMessage}
                className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </motion.button>
            ) : (
              <motion.button
                key="mic"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-white/5 p-3 rounded-full transition-all flex items-center justify-center"
              >
                <Mic className="w-4 h-4" />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
