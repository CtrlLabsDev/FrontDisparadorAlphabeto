import { useEffect } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import Stepper from "../components/Stepper";

export default function NovaCampanha() {
    const navigate = useNavigate();
    const location = useLocation();

    // Redireciona para o primeiro passo se estiver em "/nova-campanha"
    useEffect(() => {
        if (location.pathname === "/nova-campanha") {
            navigate("/nova-campanha/dados", { replace: true });
        }
    }, [location, navigate]);


    useEffect(() => {
        localStorage.removeItem("campanhaId"); // 👈 limpa a referência antiga
    
        if (location.pathname === "/nova-campanha") {
            navigate("/nova-campanha/dados", { replace: true });
        }
    }, [location, navigate]);
    

    return (
        <div className="p-4">
            <h2>Nova Campanha</h2>
            <Stepper />
            <div className="mt-4">
                <Outlet />
            </div>
        </div>
    );
}
