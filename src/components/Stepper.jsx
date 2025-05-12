import { Steps } from "primereact/steps";
import { useNavigate, useLocation } from "react-router-dom";

export default function Stepper() {
    const navigate = useNavigate();
    const location = useLocation();

    // Definição das etapas
    const steps = [
        { label: "Dados da Campanha", path: "/nova-campanha/dados" },
        { label: "Configurações", path: "/nova-campanha/configuracoes" },
        { label: "Importar Dados", path: "/nova-campanha/importar" },
        { label: "Template", path: "/nova-campanha/template" },
        
    ];

    // Encontrar índice da etapa atual
    const activeIndex = steps.findIndex((step) => step.path === location.pathname);

    return (
        <div className="card">
            <Steps 
                model={steps.map((step) => ({
                    label: step.label,
                    command: () => navigate(step.path),
                }))}
                activeIndex={activeIndex >= 0 ? activeIndex : 0}
            />
        </div>
    );
}
