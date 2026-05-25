import { useEffect, useState } from "react";
import {io} from "socket.io-client";
import axios from "axios";
import Navbar from "../components/Navbar";

const socket = io("http://localhost:5000");

function Dashboard() {


 const [message, setMessage] = useState("");

const [messages, setMessages] = useState([]);

const [chats, setChats] = useState([]);

const [selectedChat, setSelectedChat] = useState(null);

const [users, setUsers]= useState([]);

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


    socket.on("connect", () => {
    console.log("Connected:", socket.id);
  });
    
    socket.on("receive_message", (data) => {

  console.log("Received:", data);

  fetchMessages(selectedChat?._id);

});

    return ()=>{
      socket.disconnect();
    };

  },[selectedChat]);


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



    setMessage("");

  } catch (error) {

    console.log(error);

  }

};


   return (
  <div className="min-h-screen bg-black text-white">

    <Navbar />

    <div className="flex h-[90vh]">

      {/* SIDEBAR */}

      <div className="w-[350px] bg-zinc-900 p-4 border-r border-zinc-800">

        <h2 className="text-2xl font-bold mb-6">
          Chats
        </h2>
        <div className="mb-6">

  <h3 className="text-lg font-semibold mb-3">
    Users
  </h3>

  <div className="space-y-2">

    {users.map((u) => (

      <div
        key={u._id}
        onClick={() => createChat(u._id)}
        className="bg-zinc-800 p-3 rounded-lg cursor-pointer hover:bg-zinc-700 transition"
      >
        {u.name}
      </div>

    ))}

  </div>

</div>

        <div className="space-y-3">

          {chats.map((chat) => {

            const otherUser = chat.users.find(
              (u) => u._id !== user._id
            );

            return (
              <div
                key={chat._id}
                onClick={() => { setSelectedChat(chat);
                                fetchMessages(chat._id);

                      }}

                className="bg-zinc-800 p-4 rounded-xl cursor-pointer hover:bg-zinc-700 transition"
              >
                <p className="font-semibold">
                  {otherUser?.name}
                </p>
              </div>
            );

          })}

        </div>

      </div>

      {/* CHAT AREA */}

      <div className="flex-1 flex flex-col">

        <div className="flex-1 p-6 overflow-y-auto">

          {selectedChat ? (

            <div className="space-y-3">

              {messages.map((msg, index) => (

                <div
                  key={index}
                  className="bg-zinc-900 p-3 rounded-lg"
                >
                  <p className="font-semibold">
                    {msg.sender?.name}
                  </p>

                  <p>
                    {msg.content || msg.text}
                  </p>

                </div>

              ))}

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
      onChange={(e) => setMessage(e.target.value)}
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