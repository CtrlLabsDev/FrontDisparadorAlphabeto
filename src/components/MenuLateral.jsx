import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { useState, useEffect } from "react";
import "../styles/menu.css";

export default function MenuLateral() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Menu items
  const menu = [
    { label: "Home", icon: "pi pi-home", to: "/" },
    { label: "Campanhas", icon: "pi pi-send", to: "/campanhas" },
    { label: "Analytics", icon: "pi pi-chart-line", to: "/analytics" },
    { label: "BlackList", icon: "pi pi-inbox", to: "/blacklist" },
    { label: "Configurações", icon: "pi pi-cog", to: "/configuracao" },
  ];

  // Detectar mudanças no tamanho da tela
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile && isOpen) {
        setIsOpen(false);
      }
    };

    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, [isOpen]);

  // Fechar menu ao clicar fora (ESC key)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    navigate("/login");
    if (isMobile) {
      setIsOpen(false);
    }
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* HEADER MOBILE */}
      {isMobile && (
        <header className="mobile-header">
          <button 
            className="menu-toggle"
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <i className={`pi ${isOpen ? 'pi-times' : 'pi-bars'}`}></i>
          </button>
          
          <div className="mobile-logo">
            <h2>📊 Dashboard</h2>
          </div>

          <button 
            className="mobile-create-btn"
            onClick={() => navigate("/nova-campanha")}
            aria-label="Criar campanha"
          >
            <i className="pi pi-plus"></i>
          </button>
        </header>
      )}

      {/* OVERLAY MOBILE */}
      {isMobile && isOpen && (
        <div 
          className="drawer-overlay active"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* SIDEBAR/DRAWER */}
      <aside className={`menu-lateral ${isMobile ? 'mobile' : 'desktop'} ${isMobile && isOpen ? 'open' : ''}`}>
        {/* HEADER DO DRAWER (só mobile) */}
        {isMobile && (
          <div className="drawer-header">
            <h3>📊 Menu</h3>
            <button 
              className="drawer-close"
              onClick={() => setIsOpen(false)}
              aria-label="Fechar menu"
            >
              <i className="pi pi-times"></i>
            </button>
          </div>
        )}

        {/* TOPO (desktop) */}
        {!isMobile && (
          <div className="menu-top">
            <div className="logo-section">
              <h3>📊 Dashboard</h3>
            </div>
            <Button
              label="Criar Campanha"
              icon="pi pi-plus"
              onClick={() => navigate("/nova-campanha")}
              className="create-campaign-btn"
            />
          </div>
        )}

        {/* BOTÃO CRIAR (mobile) */}
        {isMobile && (
          <div className="drawer-create-btn">
            <Button
              label="Criar Campanha"
              icon="pi pi-plus"
              onClick={() => {
                navigate("/nova-campanha");
                setIsOpen(false);
              }}
              className="create-campaign-btn mobile"
            />
          </div>
        )}

        {/* NAVEGAÇÃO */}
        <nav className="menu-nav">
          <ul className="menu-list">
            {menu.map((item, i) => (
              <li
                key={i}
                className={location.pathname === item.to ? "ativo" : ""}
              >
                <Link to={item.to} onClick={handleLinkClick}>
                  <i className={item.icon} />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* BOTTOM/LOGOUT */}
        <div className={`${isMobile ? 'drawer-bottom' : 'menu-bottom'}`}>
          <button onClick={handleLogout} className="logout-button">
            <i className="pi pi-sign-out" />
            <span>Sair</span>
          </button>
        </div>
      </aside>
    </>
  );
}