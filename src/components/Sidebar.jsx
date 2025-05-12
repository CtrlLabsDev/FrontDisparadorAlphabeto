import { Link } from "react-router-dom";
import { Menubar } from "primereact/menubar";
import { Sidebar } from "primereact/sidebar";
import { useState } from "react";
import { Button } from "primereact/button";
import "../styles/sidebar.css";


export default function SideMenu() {
    const [visible, setVisible] = useState(false);

    const menuItems = [
        { label: "Dashboard", icon: "pi pi-home", url: "/" },
        { label: "Campanhas", icon: "pi pi-list", url: "/campanhas" },
        { label: "Nova Campanha", icon: "pi pi-plus", url: "/nova-campanha" },
        { label: "Configurações", icon: "pi pi-cog", url: "/configuracao" },
    ];

    return (
        <>
            {/* Botão para abrir o menu */}
            <Button icon="pi pi-bars" onClick={() => setVisible(true)} className="p-button-text" />

            {/* Sidebar */}
            <Sidebar visible={visible} onHide={() => setVisible(false)} className="w-15rem">
                <h2 className="text-center">Menu</h2>
                <ul className="list-none p-0">
                    {menuItems.map((item, index) => (
                        <li key={index} className="mb-3">
                            <Link to={item.url} className="flex align-items-center p-2 text-lg text-black hover:bg-gray-200 rounded">
                                <i className={`${item.icon} mr-2`} />
                                {item.label}
                            </Link>
                        </li>
                    ))}
                </ul>
            </Sidebar>
        </>
    );
}
