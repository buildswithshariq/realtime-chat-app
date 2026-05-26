import { useEffect, useState, useRef } from "react";
import {io} from "socket.io-client";
import axios from "axios";
import Navbar from "../components/Navbar";

const socket = io("http://localhost:5000",{
      transports: ["websocket"],
});

function Dashboard() {


 const [message, setMessage] = useState("");

const [messages, setMessages] = useState([]);

const [chats, setChats] = useState([]);

const [selectedChat, setSelectedChat] = useState(null);

const [users, setUsers]= useState([]);

const messagesEndRef = useRef(null);

const [onlineUsers, setOnlineUsers] = useState([]);

const [isTyping, setIsTyping]= useState(false);

const typingTimeoutRef = useRef(null);

const [sidebarOpen, setSidebarOpen] = useState(true);

const [showUsers, setShowUsers] = useState(false);

const [unreadMessages, setUnreadMessages] = useState({});

const user = JSON.parse(
  localStorage.getItem("userInfo")
);

  useEffect(()=>{

    const fetchChats = async () => {

  try {

    const res = await axios.get(
      "http://localhost:5000/api/chat",
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    setChats(res.data);

  } catch (error) {

    console.log(error);

  }

};



const fetchUsers = async () => {

  try {

    const res = await axios.get(
      "http://localhost:5000/api/users",
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    setUsers(res.data);

  } catch (error) {

    console.log(error);

  }

};



fetchUsers();
fetchChats();



    socket.off("connect");

    socket.on("connect", () => {
    console.log("Connected:", socket.id);
  });
  socket.emit("user_online", user._id);

  socket.off("get_online_users");

socket.on("get_online_users", (users) => {

  setOnlineUsers(users);

});


  socket.off("receive_message");
    
  socket.on("receive_message", (data) => {

  console.log("Received:", data);

  const incomingChatId =
    typeof data.chat === "object"
      ? data.chat._id
      : data.chat;

  const currentChatId =
    selectedChat?._id;

  // Opened chat
  if (currentChatId === incomingChatId) {

    fetchMessages(currentChatId);

    fetchChats();

  }

  // Other chat unread
  else if (data.sender._id !== user._id) {

    setUnreadMessages((prev) => {

      const currentCount =
        Number(prev[incomingChatId]) || 0;

      return {

        ...prev,

        [incomingChatId]:
          currentCount >= 4
            ? "4+"
            : currentCount + 1,

      };

    });
    

  }

});


socket.off("show_typing");

socket.on("show_typing", () => {

  setIsTyping(true);

});

socket.off("hide_typing");

socket.on("hide_typing", () => {

  setIsTyping(false);

});

  },[selectedChat]);

  useEffect(() => {

  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
  });

}, [messages, isTyping]);


  const fetchMessages = async (chatId) => {

  try {

    const res = await axios.get(
      `http://localhost:5000/api/message/${chatId}`,
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    setMessages(res.data);


  } catch (error) {

    console.log(error);

  }

};  
const createChat = async (userId) => {

  try {

    const res = await axios.post(
      "http://localhost:5000/api/chat",
      { userId },
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    // Refresh chats
    const chatsRes = await axios.get(
      "http://localhost:5000/api/chat",
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    setChats(chatsRes.data);

    // Auto select new chat
    setSelectedChat(res.data);

    socket.emit("join_chat", res.data._id);

    // Load messages
    fetchMessages(res.data._id);

  } catch (error) {

    console.log(error);

  }

};

const sendMessage = async () => {

  if (!message || !selectedChat) return;

  try {

    const res = await axios.post(
      "http://localhost:5000/api/message",
      {
        content: message,
        chatId: selectedChat._id,
      },
      {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      }
    );

    socket.emit("send_message", res.data);

    socket.emit("stop_typing", selectedChat._id);
    
   fetchMessages(selectedChat._id);

    setMessage("");

  } catch (error) {

    console.log(error);

  }

};


   return (
  <div className="min-h-screen bg-black text-white">

    <Navbar />

    <div className="p-3 border-b border-zinc-800 flex items-center">

  <button
    onClick={() => setSidebarOpen(!sidebarOpen)}
    className="text-2xl"
  >
    ☰
  </button>

</div>

    <div className="flex h-[90vh]">

      {/* SIDEBAR */}

      <div
  className={`bg-zinc-900 border-r border-zinc-800 transition-all duration-300 overflow-hidden ${
    sidebarOpen
      ? "w-[350px] p-4"
      : "w-0 p-0"
  }`}
>

        <h2 className="text-2xl font-bold mb-6">
          Chats
        </h2>
        <div className="mb-6">

</div>

        <div className="space-y-3 flex flex-col">

          <button
  onClick={() => setShowUsers(!showUsers)}
  className="w-full bg-white text-black p-3 rounded-xl font-semibold mb-4"
>
  + New Chat
</button>

{showUsers && (

  <div className="space-y-2 mb-6">

    {users.map((u) => (

      <div
        key={u._id}
        onClick={() => {

          createChat(u._id);

          setShowUsers(false);

        }}
        className="bg-zinc-800 p-3 rounded-lg cursor-pointer hover:bg-zinc-700 transition"
      >
        {u.name}
      </div>

    ))}

  </div>

)}

          {chats.map((chat) => {

            const otherUser = chat.users.find(
              (u) => u._id !== user._id
            );

            return (
              <div
                key={chat._id}
                onClick={() => { setSelectedChat(chat);

                   setUnreadMessages((prev) => {

  const updated = { ...prev };

  delete updated[chat._id];

  return updated;

});
                                  socket.emit("join_chat", chat._id);
                                fetchMessages(chat._id);
                                

                      }}

                className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
  selectedChat?._id === chat._id
    ? "bg-blue-600"
    : "bg-zinc-800 hover:bg-zinc-700"
}`}
              >
               <div className="flex items-center justify-between">

  <p className="font-semibold">
    {otherUser?.name}
  </p>

  {onlineUsers.includes(otherUser?._id) && (

    <div className="w-3 h-3 bg-green-500 rounded-full"></div>

  )}

</div>

{chat.latestMessage && (

  <p className="text-sm text-zinc-400 truncate mt-1">

    {chat.latestMessage.content}

  </p>

)}

{unreadMessages[String(chat._id)] && (

  <div className="mt-2">

    <span className="bg-white text-black text-xs px-2 py-1 rounded-full font-semibold">

      {unreadMessages[String(chat._id)]}

    </span>

  </div>

)}
              </div>
            );

          })}

        </div>

      </div>

      {/* CHAT AREA */}

      <div className="flex-1 flex flex-col">

        {selectedChat && (

  <div className="p-4 border-b border-zinc-800 bg-zinc-900">

    <h2 className="text-xl font-bold">

      {
        selectedChat.users.find(
          (u) => u._id !== user._id
        )?.name
      }

    </h2>

    <p className="text-sm text-zinc-400">
      {
  onlineUsers.includes(
    selectedChat.users.find(
      (u) => u._id !== user._id
    )?._id
  )
    ? "Online"
    : "Offline"
}
    </p>

  </div>

)}

        <div className="flex-1 p-6 overflow-y-auto scrollbar-hide">

          {selectedChat ? (

            <div className="space-y-3">

              {messages.map((msg, index) => (

                <div
  key={index}
  className={`flex ${
    msg.sender?._id === user._id
      ? "justify-end"
      : "justify-start"
  }`}
>

  <div
    className={`max-w-[300px] p-3 rounded-2xl ${
      msg.sender?._id === user._id
        ? "bg-blue-600"
        : "bg-zinc-800"
    }`}
  >

    <p className="text-xs font-semibold mb-1 text-gray-400">
      {msg.sender?.name}
    </p>

    <p>
      {msg.content || msg.text}
    </p>
    <p className="text-xs text-zinc-300 mt-2 text-right">
  {new Date(msg.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  })}
</p>

  </div>
  

</div>

              ))}

              {isTyping && (

  <div className="flex justify-start mb-3">

    <div className="bg-zinc-800 px-4 py-2 rounded-2xl">

      <p className="text-sm text-zinc-400 ">
        Typing...
      </p>

    </div>

  </div>

)}

              <div ref={messagesEndRef}></div>

            </div>

          ) : (

            <div className="h-full flex items-center justify-center text-zinc-500 text-2xl">
              Select a chat 
            </div>

          )}

        </div>
        {selectedChat && (

  <div className="p-4 border-t border-zinc-800 flex gap-3">


    <input
      type="text"
      placeholder="Type a message..."
      value={message}
      onChange={(e) => {setMessage(e.target.value);
                   socket.emit("typing", selectedChat._id);
                  if (typingTimeoutRef.current){
                    clearTimeout(typingTimeoutRef.current);
                  } 

                  typingTimeoutRef.current = setTimeout(()=>{
                    socket.emit(
                      "stop_typing", selectedChat._id
                    );
                  }, 2000);
      }}
      className="flex-1 bg-zinc-900 p-3 rounded-lg outline-none"
    />

    <button
      onClick={sendMessage}
      className="bg-white text-black px-6 rounded-lg font-semibold"
    >
      Send
    </button>

  </div>

)}

      </div>

    </div>

  </div>
 );
}

export default Dashboard;