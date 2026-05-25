import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
 const user = localStorage.getItem("userInfo");

  if (!user) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;