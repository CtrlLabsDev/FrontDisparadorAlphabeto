import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api"; // 👈 agora usando o api.js corretamente
import "../styles/LoginPage.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = { username, password };

    try {
      const response = await api.post("/token/", data); // 👈 mudou para api.post
      localStorage.setItem("access_token", response.data.access);
      localStorage.setItem("refresh_token", response.data.refresh);
      navigate("/home"); // 👈 cuidado aqui: se sua home for "/", ajuste também
    } catch {
      setError("Credenciais inválidas");
    }
  };

  return (
    <div className="login-page">
      <div className="login-form-section">
        <div className="login-logo">
          <img src="/logo.png" alt="Ctrl Labs Logo" />
        </div>

        <h1>Login</h1>

        <form onSubmit={handleSubmit}>
          <div>
            <label>Usuário</label>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Senha</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit">Entrar</button>
        </form>

        <div className="forgot">Esqueceu a senha?</div>
      </div>

      <div className="login-bg-section"></div>
    </div>
  );
};

export default LoginPage;