import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import "../styles/menu.css";

export default function MenuLateral() {
  const location = useLocation();
  const navigate = useNavigate();

  const menu = [
    { label: "Home", icon: "pi pi-home", to: "/" },
    { label: "Campanhas", icon: "pi pi-send", to: "/campanhas" },
    { label: "Analytics", icon: "pi pi-chart-line", to: "/analytics" },
    { label: "BlackList", icon: "pi pi-inbox", to: "/blacklist" },
    // { label: "Contatos", icon: "pi pi-user", to: "/contatos" },
    // { label: "Automatização", icon: "pi pi-refresh", to: "/automatizacao" },
    { label: "Configurações", icon: "pi pi-cog", to: "/configuracao" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
  };

  return (
    <aside className="menu-lateral">
      {/* TOPO */}
      <div className="menu-top">
        <Button
          label="Criar Campanha"
          icon="pi pi-plus"
          onClick={() => navigate("/nova-campanha")}
          className="p-button-outlined p-button-secondary w-full mb-4"
        />
      </div>

      {/* LINKS */}
      <nav>
        <ul className="menu-list">
          {menu.map((item, i) => (
            <li
              key={i}
              className={location.pathname === item.to ? "ativo" : ""}
            >
              <Link to={item.to}>
                <i className={`${item.icon} mr-2`} />
                {item.label}
              </Link>
            </li>
          ))}

          {/* LOGOUT COMO ITEM DO MENU */}
          <li>
            <button onClick={handleLogout} className="logout-button">
              <i className="pi pi-sign-out mr-2" />
              Sair
            </button>
          </li>
        </ul>
      </nav>
    </aside>
  );
}