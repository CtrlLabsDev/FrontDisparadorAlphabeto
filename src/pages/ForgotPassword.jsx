import React, { useState } from "react";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:8000/api/password_reset/", { email });
      setSent(true);
    } catch (err) {
      console.error("Erro na requisição:", err);
      setError("Erro ao enviar email. Verifique o endereço e tente novamente.");
    }
  };

  return (
    <div className="forgot-password-container">
      <h2>Recuperar Senha</h2>

      {sent ? (
        <p>Email enviado com instruções para redefinir sua senha.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>Email:</label>
          <input
            type="email"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p style={{ color: "red" }}>{error}</p>}
          <button type="submit">Enviar link de recuperação</button>
        </form>
      )}
    </div>
  );
};

export default ForgotPassword;