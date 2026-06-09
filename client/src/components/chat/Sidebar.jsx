import { motion, AnimatePresence } from "framer-motion";
import { MessageSquarePlus, Search, Menu, X, Users, MessageCircle, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  chats,
  users,
  user,
  onlineUsers,
  selectedChat,
  setSelectedChat,
  unreadMessages,
  createChat,
  markChatAsRead,
  isMobile,
}) {
  const [showUsers, setShowUsers] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredUsers = users.filter((u) => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // On mobile, sidebar is full-screen when visible
  // On desktop, sidebar animates between 350px and 100px
  return (
    <motion.div
      initial={false}
      animate={{ 
        width: isMobile ? "100%" : sidebarOpen ? 350 : 80,
      }}
      className={cn(
        "glass-panel h-full min-h-0 flex flex-col z-20 transition-all duration-300 overflow-hidden",
        isMobile ? "absolute inset-0" : "relative"
      )}
    >
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        {sidebarOpen || isMobile ? (
          <motion.h2 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/50"
          >
            Start Yapping
          </motion.h2>
        ) : (
          <div className="mx-auto w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center">
            <MessageCircle className="w-4 h-4 text-white" />
          </div>
        )}
        
        {!isMobile && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5 text-zinc-400" /> : <Menu className="w-5 h-5 text-zinc-400 mx-auto" />}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide p-3 flex flex-col gap-2">
        
        {/* Toggle Mode Button */}
        {(sidebarOpen || isMobile) && (
          <button
            onClick={() => setShowUsers(!showUsers)}
            className="w-full flex items-center justify-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/20 p-3 rounded-2xl font-semibold transition-all mb-4"
          >
            {showUsers ? <MessageCircle className="w-4 h-4" /> : <MessageSquarePlus className="w-4 h-4" />}
            {showUsers ? "Back to Chats" : "New Chat"}
          </button>
        )}

        <AnimatePresence mode="wait">
          {showUsers && (sidebarOpen || isMobile) ? (
            <motion.div 
              key="users"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-2"
            >
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:border-blue-500/50 transition-colors"
                />
              </div>

              {filteredUsers.map((u) => (
                <div
                  key={u._id}
                  onClick={() => {
                    createChat(u._id);
                    setShowUsers(false);
                  }}
                  className="p-3 rounded-xl cursor-pointer hover:bg-white/5 border border-transparent hover:border-white/5 transition-all flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium text-zinc-200">{u.name}</span>
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="chats"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col gap-2"
            >
              {chats.map((chat) => {
                const otherUser = chat.users.find((u) => u._id !== user._id);
                const isSelected = selectedChat?._id === chat._id;
                const isOnline = onlineUsers.includes(otherUser?._id);
                const unreadCount = unreadMessages[String(chat._id)];

                return (
                  <div
                    key={chat._id}
                    onClick={() => {
                      setSelectedChat(chat);
                      markChatAsRead(chat._id);
                    }}
                    className={cn(
                      "p-3 rounded-2xl cursor-pointer transition-all duration-300 border flex items-center gap-3",
                      isSelected
                        ? "bg-blue-600/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                        : "bg-transparent border-transparent hover:bg-white/5 hover:border-white/5"
                    )}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center text-lg font-bold shadow-inner border border-white/5">
                        {otherUser?.name?.charAt(0).toUpperCase()}
                      </div>
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-zinc-900 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
                      )}
                    </div>

                    {/* Content (only visible if sidebar open or mobile) */}
                    {(sidebarOpen || isMobile) && (
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-zinc-100 truncate pr-2">
                            {otherUser?.name}
                          </p>
                          {unreadCount && (
                            <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-lg shadow-blue-500/30">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        {(() => {
                          const count = unreadCount;
                          let previewText = null;
                          let isUnread = false;

                          // Format preview based on message type
                          const getPreview = (msg) => {
                            if (!msg) return null;
                            if (msg.deleted) return "🚫 This message was deleted";
                            switch (msg.type) {
                              case "gif": return "🎞 GIF";
                              case "image": return "🖼 Image";
                              case "video": return "🎬 Video";
                              case "audio": return "🎤 Voice Message";
                              default: return msg.content;
                            }
                          };

                          if (count === "4+") {
                            previewText = "4+ unread messages";
                            isUnread = true;
                          } else if (Number(count) >= 2) {
                            previewText = `${count} unread messages`;
                            isUnread = true;
                          } else if (Number(count) === 1 && chat.latestMessage) {
                            previewText = getPreview(chat.latestMessage);
                            isUnread = true;
                          } else if (chat.latestMessage) {
                            previewText = getPreview(chat.latestMessage);
                            isUnread = false;
                          }

                          return previewText ? (
                            <p className={cn(
                              "text-xs truncate",
                              isUnread ? "text-blue-300 font-medium" : "text-zinc-500"
                            )}>
                              {previewText}
                            </p>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
