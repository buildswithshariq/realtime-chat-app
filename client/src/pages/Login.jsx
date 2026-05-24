import { useState , useEffect} from "react";
import axios from "axios";
import {useNavigate} from "react-router-dom"; 

function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
  const token = localStorage.getItem("token");

  if (token) {
    navigate("/dashboard");
  }
}, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );

      console.log(res.data);

      localStorage.setItem("token", res.data.token);

      navigate("/dashboard");
    } catch (error) {
      console.log(error);

      alert(error.response.data.message);
    }
  };

  const signupRedirect= ()=>{
    navigate("/signup")
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md shadow-lg">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Login
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
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
            Login
          </button>
        </form>
        <p className="w-full text-gray-400 text-sm text-center pt-4 ">Don't have an account?  <button onClick={signupRedirect} className="cursor-pointer text-blue-300 text-sm">SignUp</button></p>
        
      </div>
    </div>
  );
}

export default Login;