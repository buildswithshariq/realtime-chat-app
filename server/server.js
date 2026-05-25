const http = require("http");
const {Server}= require("socket.io");

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const userRoutes = require("./routes/userRoutes");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth",authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);
app.use("/api/users", userRoutes);

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

io.on("connection", (socket) => {
  console.log("User Connected:", socket.id);

  socket.on("send_message", (data) => {
    console.log("Message Received:", data);
   io.emit("receive_message", data);
  });
  socket.on("disconnect", () => {

    console.log("User Disconnected");

  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

