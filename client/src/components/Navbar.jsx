import { useNavigate } from "react-router-dom";
import socket from "../lib/socket";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("userInfo"));

  const logoutHandler = () => {
    socket.emit("logout");
    localStorage.removeItem("userInfo");
    navigate("/");
  };

  return (
    <div className="z-50 bg-zinc-900 px-4 sm:px-6 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:py-4 flex items-center justify-between border-b border-white/5 flex-shrink-0">
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Yappo
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 truncate">
          {user?.name}
        </p>
      </div>

      <button
        onClick={logoutHandler}
        className="bg-white/10 hover:bg-white/15 text-zinc-200 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors border border-white/5 flex-shrink-0"
      >
        Logout
      </button>
    </div>
  );
}

export default Navbar;