import { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function DadosCampanha() {
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [campanhaId, setCampanhaId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const id = localStorage.getItem("campanhaId");
        if (id) {
            setCampanhaId(id);
            api.get(`/campanhas/${id}/`)
                .then((res) => {
                    setNome(res.data.nome);
                    setDescricao(res.data.descricao);
                })
                .catch((err) => {
                    console.error("Erro ao carregar campanha:", err);
                });
        }
    }, []);

    const handleAvancar = async () => {
        if (campanhaId) {
            // Atualiza campanha existente
            api.patch(`/campanhas/${campanhaId}/`, {
                nome,
                descricao
            }).then(() => {
                navigate("/nova-campanha/importar");
            });
        } else {
            // Cria nova campanha
            api.post("/campanhas/", {
                nome,
                descricao
            }).then((res) => {
                localStorage.setItem("campanhaId", res.data.id);
                navigate("/nova-campanha/importar");
            });
        }
    };

    return (
        <div className="p-4">
            <h2>Passo 1: Dados da Campanha</h2>
            <div className="p-fluid">
                <div className="field">
                    <label>Nome da Campanha:</label>
                    <InputText value={nome} onChange={(e) => setNome(e.target.value)} />
                </div>
                <div className="field">
                    <label>Descrição da Campanha:</label>
                    <InputText value={descricao} onChange={(e) => setDescricao(e.target.value)} />
                </div>
            </div>

            {/* Botão para avançar */}
            <div className="flex justify-content-between mt-4">
                <Button label="Próximo" icon="pi pi-arrow-right" onClick={handleAvancar} />
            </div>
        </div>
    );
}
