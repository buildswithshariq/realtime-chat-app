import { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import Navbar from "../components/Navbar";

// Chat Components
import Sidebar from "../components/chat/Sidebar";
import ChatArea from "../components/chat/ChatArea";
import CommandDock from "../components/chat/CommandDock";

const socket = io("http://localhost:5000", {
  transports: ["websocket"],
});

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

  // Refs for tracking without re-renders
  const selectedChatRef = useRef(null);
  const isAtBottomRef = useRef(true);
  const wasAtBottomRef = useRef(true);
  const justSentRef = useRef(false);
  const justOpenedChatRef = useRef(false);

  const user = JSON.parse(localStorage.getItem("userInfo"));

  useEffect(() => {
    selectedChatRef.current = selectedChat;
  }, [selectedChat]);

  // Helper: update message status on server + notify via socket
  const updateStatus = (chatId, status) => {
    axios
      .put(
        `http://localhost:5000/api/message/status/${chatId}`,
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
        const res = await axios.get("http://localhost:5000/api/chat", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setChats(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchUsers = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/user", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        setUsers(res.data);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchUnread = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/message/unread", {
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

    socket.on("get_online_users", (users) => {
      setOnlineUsers(users);
    });

    socket.on("receive_message", (data) => {
      const incomingChatId =
        typeof data.chat === "object" ? data.chat._id : data.chat;
      const currentChatId = selectedChatRef.current?._id;

      // SAME opened chat
      if (currentChatId === incomingChatId) {
        fetchMessages(currentChatId);

        axios
          .put(
            `http://localhost:5000/api/message/${currentChatId}/read`,
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
    });

    socket.on("show_typing", () => setIsTyping(true));
    socket.on("hide_typing", () => setIsTyping(false));

    socket.on("message_status_update", (data) => {
      const currentChatId = selectedChatRef.current?._id;
      if (currentChatId === data.chatId) {
        fetchMessages(currentChatId);
      }
    });

    return () => {
      socket.off("connected");
      socket.off("get_online_users");
      socket.off("receive_message");
      socket.off("show_typing");
      socket.off("hide_typing");
      socket.off("message_status_update");
    };
  }, [user.token, user._id]);

  const fetchMessages = async (chatId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/message/${chatId}`,
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
        "http://localhost:5000/api/chat",
        { userId },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      if (!chats.find((c) => c._id === res.data._id)) {
        setChats([res.data, ...chats]);
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
        "http://localhost:5000/api/message",
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

  const markChatAsRead = async (chatId) => {
    setUnreadMessages((prev) => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });

    axios
      .put(
        `http://localhost:5000/api/message/${chatId}/read`,
        {},
        { headers: { Authorization: `Bearer ${user.token}` } }
      )
      .catch((err) => console.log(err));
  };

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setHasNewMessages(false);
    isAtBottomRef.current = true;
    justOpenedChatRef.current = true;
    
    socket.emit("join_chat", chat._id);
    fetchMessages(chat._id);
    markChatAsRead(chat._id);
    updateStatus(chat._id, "seen");
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-950 overflow-hidden">
      <Navbar />

      <div className="flex-1 flex overflow-hidden relative">
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
        />

        <div className="flex-1 flex flex-col relative overflow-hidden bg-black/20">
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-white/5 glass flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg">
                    {selectedChat.users
                      .find((u) => u._id !== user._id)
                      ?.name.charAt(0)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-bold text-zinc-100">
                      {selectedChat.users.find((u) => u._id !== user._id)?.name}
                    </h2>
                    <p className="text-xs font-medium tracking-wide">
                      {onlineUsers.includes(
                        selectedChat.users.find((u) => u._id !== user._id)?._id
                      ) ? (
                        <span className="text-emerald-400">Online</span>
                      ) : (
                        <span className="text-zinc-500">Offline</span>
                      )}
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
              />

              <CommandDock
                message={message}
                setMessage={setMessage}
                sendMessage={sendMessage}
                selectedChat={selectedChat}
                socket={socket}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center opacity-50 select-none">
                <div className="w-24 h-24 mx-auto mb-6 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center animate-glow">
                    <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                  </div>
                </div>
                <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-2">
                  Welcome to Nebula
                </h2>
                <p className="text-zinc-400 max-w-sm mx-auto">
                  Select a conversation from the sidebar to begin communicating.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}