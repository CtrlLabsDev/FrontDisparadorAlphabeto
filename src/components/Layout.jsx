import Header from "./Header";
import MenuLateral from "./MenuLateral";
import { Outlet } from "react-router-dom";
import "../styles/Layout.css";

export default function Layout() {
    return (
        <div className="layout">
            <Header />
            <div className="conteudo-principal">
                <MenuLateral />
                <main className="conteudo">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

