import {BrowserRouter, Routes, Route} from "react-router-dom";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";


function App() {
  return (
    <BrowserRouter>
    <div className="h-full bg-black text-white">
      <Routes>
        < Route path="/" element={<Login/>} />
        < Route path="/signup" element={<Signup/>} />
        < Route path="/dashboard" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
      </Routes>
    </div>
    </BrowserRouter>
  );
}

export default App;