import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();

  const logoutHandler = () => {
    localStorage.removeItem("token");

    navigate("/");
  };

  return (
    <div className="bg-zinc-900 px-6 py-4 flex items-center justify-between">
      <h1 className="text-xl font-bold">
        Chat App
      </h1>

      <button
        onClick={logoutHandler}
        className="bg-white text-black px-4 py-2 rounded-lg font-semibold"
      >
        Logout
      </button>
    </div>
  );
}

export default Navbar;