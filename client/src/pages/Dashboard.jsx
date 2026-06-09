import { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import socket from "../lib/socket";
import { formatLastSeen } from "../lib/utils";
import Navbar from "../components/Navbar";

// Chat Components
import Sidebar from "../components/chat/Sidebar";
import ChatArea from "../components/chat/ChatArea";
import CommandDock from "../components/chat/CommandDock";
import ImageViewer from "../components/chat/ImageViewer";
import { API_URL } from "../config/api";

export default function Dashboard() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unreadMessages, setUnreadMessages] = useState({});
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [lastSeenMap, setLastSeenMap] = useState({});

  // Image viewer state
  const [viewerImages, setViewerImages] = useState([]);
  const [viewerIndex, setViewerIndex] = useState(-1);

  // Responsive
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Refs for tracking without re-renders
  const selectedChatRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const wasAtBottomRef = useRef(true);
  const justSentRef = useRef(false);
  const justOpenedChatRef = useRef(false);
  const tabFocusedRef = useRef(!document.hidden);
  const lastNotifIdRef = useRef(null);
  const chatsRef = useRef([]);

  const user = JSON.parse(localStorage.getItem("userInfo"));

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Track viewport width
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Request notification permission + track tab focus
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    const onVisChange = () => { tabFocusedRef.current = !document.hidden; };
    document.addEventListener("visibilitychange", onVisChange);
    return () => document.removeEventListener("visibilitychange", onVisChange);
  }, []);

  // Helper: update message status on server + notify via socket
  const updateStatus = (chatId, status) => {
    axios
      .put(
        `${API_URL}/api/message/status/${chatId}`,
        { status },
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      .then(() => {
        socket.emit("message_status_update", {
          chatId,
          status,
          userId: user._id,
        });
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/chat`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setChats(res.data);
        chatsRef.current = res.data;
        // Join all chat rooms so we receive messages even from the sidebar
        res.data.forEach((chat) => socket.emit("join_chat", chat._id));
      } catch (error) {
        console.log(error);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/users`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setUsers(res.data);
        // Seed lastSeenMap from DB data
        const map = {};
        res.data.forEach((u) => {
          if (u.lastSeen) map[u._id] = u.lastSeen;
        });
        setLastSeenMap((prev) => ({ ...prev, ...map }));
      } catch (error) {
        console.log(error);
      }
    };

    const fetchUnread = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/message/unread`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setUnreadMessages(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchChats();
    fetchUsers();
    fetchUnread();
  }, [user.token]);

  useEffect(() => {
    socket.emit("setup", user);
    socket.on("connected", () => console.log("Connected to socket"));

    // Re-join all chat rooms on reconnection (mobile can drop connections)
    const handleReconnect = () => {
      socket.emit("setup", user);
      chatsRef.current.forEach((chat) => socket.emit("join_chat", chat._id));
      if (selectedChatRef.current) {
        socket.emit("join_chat", selectedChatRef.current._id);
      }
    };
    socket.on("reconnect", handleReconnect);
    socket.io.on("reconnect", handleReconnect);

    socket.on("get_online_users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("receive_message", (data) => {
      const incomingChatId =
        typeof data.chat === "object" ? data.chat._id : data.chat;
      const currentChatId = selectedChatRef.current?._id;

      // Update sidebar: set latestMessage and move chat to top
      setChats((prev) => {
        const idx = prev.findIndex((c) => c._id === incomingChatId);
        if (idx === -1) return prev;
        const updatedChat = { ...prev[idx], latestMessage: data };
        return [updatedChat, ...prev.filter((c) => c._id !== incomingChatId)];
      });

      // SAME opened chat
      if (currentChatId === incomingChatId) {
        fetchMessages(currentChatId);

        axios
          .put(
            `${API_URL}/api/message/${currentChatId}/read`,
            {},
            { headers: { Authorization: `Bearer ${user.token}` } }
          )
          .catch((err) => console.log(err));

        if (isAtBottomRef.current) {
          updateStatus(currentChatId, "seen");
        } else {
          setHasNewMessages(true);
          updateStatus(currentChatId, "inchat");
        }
      } else {
        // DIFFERENT chat
        if (data.sender._id !== user._id) {
          setUnreadMessages((prev) => {
            const currentCount = Number(prev[String(incomingChatId)]) || 0;
            return {
              ...prev,
              [String(incomingChatId)]:
                currentCount >= 4 ? "4+" : currentCount + 1,
            };
          });
        }
      }

      // ── Browser Notification ──
      const isOwn = data.sender?._id === user._id;
      const isChatOpen = currentChatId === incomingChatId && tabFocusedRef.current;
      if (
        !isOwn &&
        !isChatOpen &&
        "Notification" in window &&
        Notification.permission === "granted" &&
        lastNotifIdRef.current !== data._id
      ) {
        lastNotifIdRef.current = data._id;
        const senderName = data.sender?.name || "Someone";
        let body;
        if (data.deleted) body = "Message deleted";
        else {
          switch (data.type) {
            case "gif":   body = "🎞 GIF"; break;
            case "image": body = "🖼 Image"; break;
            case "video": body = "🎥 Video"; break;
            case "audio": body = "🎤 Voice Message"; break;
            default:      body = data.content || "New message";
          }
        }

        // Use Service Worker notification for mobile support, fall back to constructor
        const notifOptions = {
          body,
          icon: "/logo.png",
          tag: data._id,
          badge: "/logo.png",
          vibrate: [200, 100, 200],
          renotify: true,
        };

        if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then((registration) => {
            registration.showNotification(senderName, notifOptions);
          }).catch(() => {
            // Fallback to constructor if SW fails
            try { new Notification(senderName, notifOptions); } catch (_) {}
          });
        } else {
          try { new Notification(senderName, notifOptions); } catch (_) {}
        }
      }
    });

    socket.on("show_typing", (chatId) => {
      if (selectedChatRef.current?._id === chatId) setIsTyping(true);
    });
    socket.on("hide_typing", (chatId) => {
      if (selectedChatRef.current?._id === chatId) setIsTyping(false);
    });

    socket.on("message_status_update", (data) => {
      const currentChatId = selectedChatRef.current?._id;
      if (currentChatId === data.chatId) {
        // Update statuses in-place — avoids refetch which disrupts scroll
        const statusOrder = { sent: 0, inchat: 1, seen: 2 };
        setMessages((prev) =>
          prev.map((msg) => {
            // Only upgrade own messages' status (recipient sends the update)
            if (msg.sender?._id !== user._id) return msg;
            if ((statusOrder[msg.status] || 0) < (statusOrder[data.status] || 0)) {
              return { ...msg, status: data.status };
            }
            return msg;
          })
        );
      }
    });

    socket.on("user_last_seen", ({ userId, lastSeen }) => {
      setLastSeenMap((prev) => ({ ...prev, [userId]: lastSeen }));
    });

    socket.on("message_unsent", (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === data._id ? { ...msg, deleted: true } : msg
        )
      );
    });

    return () => {
      socket.off("connected");
      socket.off("reconnect");
      socket.io.off("reconnect");
      socket.off("get_online_users");
      socket.off("receive_message");
      socket.off("message_unsent");
      socket.off("show_typing");
      socket.off("hide_typing");
      socket.off("message_status_update");
      socket.off("user_last_seen");
    };
  }, [user.token, user._id]);

  const fetchMessages = async (chatId) => {
    try {
      const res = await axios.get(
        `${API_URL}/api/message/${chatId}`,
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      setMessages(res.data);

      if (selectedChatRef.current?._id === chatId && isAtBottomRef.current) {
        updateStatus(chatId, "seen");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const createChat = async (userId) => {
    try {
      const res = await axios.post(
        `${API_URL}/api/chat`,
        { userId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (!chats.find((c) => c._id === res.data._id)) {
        setChats([res.data, ...chats]);
        chatsRef.current = [res.data, ...chatsRef.current];
        // Join the new chat room immediately
        socket.emit("join_chat", res.data._id);
      }
      handleChatSelect(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim()) return;

    socket.emit("stop_typing", selectedChat._id);
    justSentRef.current = true;

    try {
      const res = await axios.post(
        `${API_URL}/api/message`,
        {
          content: message,
          chatId: selectedChat._id,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setMessage("");
      socket.emit("new_message", res.data);
      setMessages((prev) => [...prev, res.data]);

      // Move chat to top
      const updatedChat = { ...selectedChat, latestMessage: res.data };
      setChats((prev) => [
        updatedChat,
        ...prev.filter((c) => c._id !== updatedChat._id),
      ]);
    } catch (error) {
      console.log(error);
    }
  };

  const sendMediaMessage = async (fileOrUrl, type, metadata = {}) => {
    if (!selectedChat) return;
    justSentRef.current = true;

    try {
      let contentUrl = fileOrUrl;

      // If it's a File object, upload first
      if (fileOrUrl instanceof File) {
        const formData = new FormData();
        formData.append("file", fileOrUrl);
        const uploadRes = await axios.post(
          `${API_URL}/api/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );
        contentUrl = uploadRes.data.url;
        if (uploadRes.data.duration) {
          metadata.duration = uploadRes.data.duration;
        }
      }

      const res = await axios.post(
        `${API_URL}/api/message`,
        {
          content: contentUrl,
          chatId: selectedChat._id,
          type,
          metadata,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      socket.emit("new_message", res.data);
      setMessages((prev) => [...prev, res.data]);

      const updatedChat = { ...selectedChat, latestMessage: res.data };
      setChats((prev) => [
        updatedChat,
        ...prev.filter((c) => c._id !== updatedChat._id),
      ]);
    } catch (error) {
      console.log(error);
    }
  };

  const unsendMessage = async (messageId) => {
    try {
      const res = await axios.put(
        `${API_URL}/api/message/${messageId}/unsend`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === messageId ? { ...msg, deleted: true } : msg
        )
      );

      socket.emit("message_unsent", res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const markChatAsRead = async (chatId) => {
    setUnreadMessages((prev) => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });

    axios
      .put(
        `${API_URL}/api/message/${chatId}/read`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      .catch((err) => console.log(err));
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setHasNewMessages(false);
    setIsTyping(false);
    isAtBottomRef.current = true;
    justOpenedChatRef.current = true;
    
    socket.emit("join_chat", chat._id);
    fetchMessages(chat._id);
    markChatAsRead(chat._id);
    updateStatus(chat._id, "seen");
  };

  return (
    <div className="dashboard-shell flex flex-col bg-zinc-950 overflow-hidden">
      {(!isMobile || !selectedChat) && <Navbar />}

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Sidebar: on mobile, show only when no chat is selected */}
        {(!isMobile || !selectedChat) && (
          <Sidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            chats={chats}
            users={users}
            user={user}
            onlineUsers={onlineUsers}
            selectedChat={selectedChat}
            setSelectedChat={handleChatSelect}
            unreadMessages={unreadMessages}
            createChat={createChat}
            markChatAsRead={markChatAsRead}
            isMobile={isMobile}
          />
        )}

        {/* Chat area: on mobile, show only when a chat is selected */}
        {(!isMobile || selectedChat) && (
        <div className="flex-1 flex flex-col relative min-h-0 overflow-hidden bg-black/20">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-3 sm:p-4 border-b border-white/5 glass flex items-center justify-between z-40 backdrop-blur-xl flex-shrink-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  {/* Mobile back button */}
                  {isMobile && (
                    <button
                      onClick={() => setSelectedChat(null)}
                      className="p-2 -ml-1 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg">
                    {selectedChat.users
                      .find((u) => u._id !== user._id)
                      ?.name.charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-100 text-sm sm:text-base">
                      {selectedChat.users.find((u) => u._id !== user._id)?.name}
                    </h2>
                    <p className="text-[10px] sm:text-xs font-medium tracking-wide">
                      {(() => {
                        const otherUserId = selectedChat.users.find((u) => u._id !== user._id)?._id;
                        if (onlineUsers.includes(otherUserId)) {
                          return <span className="text-emerald-400">Active now</span>;
                        }
                        const lastSeen = lastSeenMap[otherUserId];
                        const text = formatLastSeen(lastSeen);
                        return <span className="text-zinc-500">{text}</span>;
                      })()}
                    </p>
                  </div>
                </div>
              </div>

              <ChatArea
                messages={messages}
                user={user}
                selectedChat={selectedChat}
                isTyping={isTyping}
                hasNewMessages={hasNewMessages}
                setHasNewMessages={setHasNewMessages}
                updateStatus={updateStatus}
                fetchMessages={fetchMessages}
                justSentRef={justSentRef}
                justOpenedChatRef={justOpenedChatRef}
                isAtBottomRef={isAtBottomRef}
                wasAtBottomRef={wasAtBottomRef}
                onUnsend={unsendMessage}
                onImageClick={(msgId) => {
                  const imageUrls = messages
                    .filter((m) => m.type === "image" && !m.deleted)
                    .map((m) => m.content);
                  const clickedMsg = messages.find((m) => m._id === msgId);
                  const idx = imageUrls.indexOf(clickedMsg?.content);
                  setViewerImages(imageUrls);
                  setViewerIndex(idx >= 0 ? idx : 0);
                }}
              />

              <CommandDock
                message={message}
                setMessage={setMessage}
                sendMessage={sendMessage}
                sendMediaMessage={sendMediaMessage}
                selectedChat={selectedChat}
                socket={socket}
                token={user.token}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center opacity-50 select-none">
                <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-glow">
                    <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                  Welcome to yappo
                </h2>
                <p className="text-zinc-400 max-w-sm mx-auto text-sm sm:text-base">
                  Select a yapper for yapping..
                </p>
              </div>
            </div>
          )}
        </div>
        )}
      </div>

      {/* Image Viewer Modal */}
      {viewerIndex >= 0 && viewerImages.length > 0 && (
        <ImageViewer
          images={viewerImages}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(-1)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  );
}