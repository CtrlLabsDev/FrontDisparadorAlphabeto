import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "primereact/button";
import { useState, useEffect } from "react";
import "../styles/menu.css";

export default function MenuLateral() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setIsOpen(false); // Fechar drawer quando voltar ao desktop
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fechar menu ao clicar em um link (mobile)
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

  // Mobile Header
  const MobileHeader = () => (
    <header className="mobile-header">
      <button 
        className="menu-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        <i className={`pi ${isOpen ? 'pi-times' : 'pi-bars'}`}></i>
      </button>
      
      <div className="mobile-logo">
        <h2>Dashboard</h2>
      </div>

      <button 
        className="mobile-create-btn"
        onClick={() => navigate("/nova-campanha")}
        aria-label="Criar campanha"
      >
        <i className="pi pi-plus"></i>
      </button>
    </header>
  );

  // Desktop Sidebar
  const DesktopSidebar = () => (
    <aside className="menu-lateral desktop">
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

      <div className="menu-bottom">
        <button onClick={handleLogout} className="logout-button">
          <i className="pi pi-sign-out" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );

  // Mobile Drawer
  const MobileDrawer = () => (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="drawer-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Drawer */}
      <aside className={`menu-lateral mobile ${isOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <h3>📊 Menu</h3>
          <button 
            className="drawer-close"
            onClick={() => setIsOpen(false)}
          >
            <i className="pi pi-times"></i>
          </button>
        </div>

        <div className="drawer-content">
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

          <div className="drawer-bottom">
            <button onClick={handleLogout} className="logout-button">
              <i className="pi pi-sign-out" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );

  if (isMobile) {
    return (
      <>
        <MobileHeader />
        <MobileDrawer />
      </>
    );
  }

  return <DesktopSidebar />;
}
