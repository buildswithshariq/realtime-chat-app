const http = require("http");
const {Server}= require("socket.io");

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const webpush = require("web-push");

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT || "mailto:admin@localhost",
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);
const connectDB = require("./config/db");
const User = require("./models/User");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const gifRoutes = require("./routes/gifRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth",authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/gif", gifRoutes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
  res.send("Server is running...");
});

const PORT = process.env.PORT;

connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

let onlineUsers= [];

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  // Handle both event names the client may emit
  const handleMessage = (data) => {
    console.log("Message Received:", data);
    const chatId = typeof data.chat === "object" ? data.chat._id : data.chat;
    socket.broadcast
      .to(chatId)
      .emit("receive_message", data);
  };
  socket.on("send_message", handleMessage);
  socket.on("new_message", handleMessage);
  socket.on("join_chat", (chatId) => {

  socket.join(chatId);

  console.log("Joined Chat:", chatId);

});
  // Shared helper: mark user offline, persist lastSeen, broadcast
  const handleGoOffline = async () => {
    if (!socket.userId) return;
    const userId = socket.userId;
    onlineUsers = onlineUsers.filter((id) => id !== userId);
    const now = new Date();
    try {
      await User.findByIdAndUpdate(userId, { lastSeen: now });
    } catch (err) {
      console.log("Failed to update lastSeen:", err);
    }
    io.emit("get_online_users", onlineUsers);
    io.emit("user_last_seen", { userId, lastSeen: now });
  };

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.userId);
    handleGoOffline();
  });

  socket.on("logout", () => {
    console.log("User Logged Out:", socket.userId);
    handleGoOffline();
    socket.disconnect(true);
  });

  // Handle both event names the client may emit for going online
  const handleUserOnline = (userData) => {
    // Support both raw userId string and user object with _id
    const userId = typeof userData === "object" ? userData._id : userData;
    socket.userId = userId;
    if (!onlineUsers.includes(userId)) {
      onlineUsers.push(userId);
    }
    io.emit("get_online_users", onlineUsers);
  };
  socket.on("user_online", handleUserOnline);
  socket.on("setup", handleUserOnline);
socket.on("typing", (chatId) => {
  socket.broadcast
    .to(chatId)
    .emit("show_typing", chatId);
});

socket.on("stop_typing", (chatId) => {
  socket.broadcast
    .to(chatId)
    .emit("hide_typing", chatId);
});

socket.on("message_status_update", (data) => {
  socket.broadcast
    .to(data.chatId)
    .emit("message_status_update", data);
});

socket.on("message_unsent", (data) => {
  const chatId = typeof data.chat === "object" ? data.chat._id : data.chat;
  socket.broadcast
    .to(chatId)
    .emit("message_unsent", data);
});

});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

