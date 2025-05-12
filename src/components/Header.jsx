import { useEffect, useState } from "react";
import { Avatar } from "primereact/avatar";
import { useLocation } from "react-router-dom";
import api from "../services/api"; // substituído
import "../styles/header.css";
import logo from "/logoazul.png";

export default function Header() {
  const location = useLocation();
  const [user, setUser] = useState({ nome: "", email: "", grupo: "" });

  const getSaudacao = () => {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
  };

  const getIniciais = (nome) => {
    const partes = nome.trim().split(" ");
    return partes.length === 1
      ? partes[0][0]
      : partes[0][0] + partes[partes.length - 1][0];
  };

  const formatarNomePagina = (path) => {
    if (path === "/") return null;

    const partes = path.split("/").filter(Boolean);
    const ultima = partes[partes.length - 1];
    return ultima.charAt(0).toUpperCase() + ultima.slice(1).toLowerCase();
  };

  useEffect(() => {
    api
      .get("/user-profile/")
      .then((res) => setUser(res.data))
      .catch((err) => console.error("Erro ao buscar usuário:", err));
  }, []);

  const saudacaoOuPagina = location.pathname === "/" 
    ? `${getSaudacao()}, ${user.nome?.split(" ")[0]}` 
    : formatarNomePagina(location.pathname);

  return (
    <header className="header-wrapper">
      <div className="header-left">
        <img src={logo} alt="Ctrl Labs" className="header-logo" />
        <span className="header-greeting">
          <strong>{saudacaoOuPagina}</strong>
        </span>
      </div>

      <div className="header-right">
        <Avatar
          label={getIniciais(user.nome || "U")}
          shape="circle"
          className="header-avatar"
        />
        <div className="header-user-info">
          <span className="header-usergroup">{user.grupo}</span>
          <span className="header-username">{user.nome}</span>
          <span className="header-useremail">{user.email}</span>
        </div>
      </div>
    </header>
  );
}