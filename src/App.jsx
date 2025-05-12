import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AppRouter from "./routes/AppRouter";

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");

    // Se não tiver token e não estiver na tela de login
    if (!token && location.pathname !== "/login") {
      navigate("/login");
    }
  }, [location.pathname, navigate]);

  return <AppRouter />;
}

export default App;