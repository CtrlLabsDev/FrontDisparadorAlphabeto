import { TabView, TabPanel } from "primereact/tabview";
import { useNavigate, useLocation, Outlet } from "react-router-dom";


export default function Configuracao() {
  const navigate = useNavigate();
  const location = useLocation();

  const index = location.pathname.includes("whatsapp") ? 1 :
                location.pathname.includes("usuarios") ? 2 : 0;

  const handleTabChange = (e) => {
    if (e.index === 0) navigate("/configuracao");
    if (e.index === 1) navigate("/configuracao/whatsapp");
    if (e.index === 2) navigate("/configuracao/usuarios");
  };

  return (
    <div className="p-4">
      <h2>Configurações</h2>
      <TabView activeIndex={index} onTabChange={handleTabChange}>
        <TabPanel header="Geral">
          {index === 0 && <Outlet />}
        </TabPanel>
        <TabPanel header="WhatsApps">
          {index === 1 && <Outlet />}
        </TabPanel>
        <TabPanel header="Usuários">
          {index === 2 && <Outlet />}
        </TabPanel>
      </TabView>
    </div>
  );
}
