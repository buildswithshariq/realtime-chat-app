import { useState, useEffect } from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom";

function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const navigate = useNavigate();

  useEffect(() => {
  const user = localStorage.getItem("userInfo");

  if (user) {
    navigate("/dashboard");
  }
}, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/register",
        formData
      );

      console.log(res.data);

      localStorage.setItem("userInfo", JSON.stringify(res.data));

      navigate("/dashboard");
    } catch (error) {
      console.log(error);

      alert(error.response.data.message);
    }
  };

  const loginRedirect = ()=>{
    navigate("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Signup
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-zinc-800 outline-none"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-zinc-800 outline-none"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-3 rounded-lg bg-zinc-800 outline-none"
          />

          <button
            className="w-full bg-white text-black py-3 rounded-lg font-semibold hover:opacity-90 transition"
          >
            Signup
          </button>
        </form>
        <p className="w-full text-gray-400 text-sm text-center pt-4 ">Already have an account?  <button onClick={loginRedirect} className="cursor-pointer text-blue-300 text-sm">Login</button></p>
      </div>
    </div>
  );
}

export default Signup;