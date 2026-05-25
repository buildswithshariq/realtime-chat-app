import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const user = JSON.parse(
  localStorage.getItem("userInfo")
);
  const logoutHandler = () => {
    localStorage.removeItem("userInfo");

    navigate("/");
  };

  return (
    <div className="bg-zinc-900 px-6 py-4 flex items-center justify-between">
      <div>
  <h1 className="text-xl font-bold">
    Chat App 
  </h1>

  <p className="text-sm text-zinc-400">
    {user?.name}
  </p>
</div>

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