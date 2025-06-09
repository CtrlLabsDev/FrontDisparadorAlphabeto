import { useState, useEffect, useRef } from "react";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ImportarDados() {
    const [arquivo, setArquivo] = useState(null);
    const [importando, setImportando] = useState(false);
    const [campanhaId, setCampanhaId] = useState(null);
    const [whatsapps, setWhatsapps] = useState([]);
    const [whatsappSelecionado, setWhatsappSelecionado] = useState(null);
    const [destinoSelecionado, setDestinoSelecionado] = useState(null); // Futuro uso para listas/segmentos
    const toast = useRef(null);
    const navigate = useNavigate();



    useEffect(() => {
        const id = localStorage.getItem("campanhaId");
        if (id && id !== "null" && id !== "undefined") {
            setCampanhaId(id);
    
            // 🔁 Aqui você busca a campanha e seta o WhatsApp vinculado
            api.get(`/campanhas/${id}/`)
                .then((res) => {
                    const idWpp = res.data.whatsapp;
                    setWhatsappSelecionado(idWpp);
                })
                .catch((err) => console.error("Erro ao carregar campanha", err));
        }
    
        // Carrega lista de WhatsApps
        api.get("/whatsapps/")
  .then((res) => {
    setWhatsapps(res.data.whatsapps || []);
  })
  .catch((err) => {
    console.error("Erro ao carregar instâncias de WhatsApp", err);
    setWhatsapps([]); // fallback para evitar .find em undefined
  });
    }, []);
    
    

    const handleUpload = async () => {
        if (!arquivo || !campanhaId) {
            toast.current.show({
                severity: "warn",
                summary: "Aviso",
                detail: "Selecione um arquivo e certifique-se que a campanha foi criada.",
                life: 3000,
            });
            return;
        }

        const formData = new FormData();
        formData.append("arquivo", arquivo);
        formData.append("campanha_id", campanhaId);

        try {
            setImportando(true);
            const response = await api.post("/importar-csv-dados/", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            toast.current.show({
                severity: "success",
                summary: "Importação Concluída",
                detail: response.data.mensagem,
                life: 3000,
            });

            navigate("/nova-campanha/template");
        } catch (error) {
            toast.current.show({
                severity: "error",
                summary: "Erro na importação",
                detail: error.response?.data?.erro || "Falha ao importar o CSV",
                life: 3000,
            });
        } finally {
            setImportando(false);
        }
    };

    const atualizarWhatsAppNaCampanha = async (idWpp) => {
        if (!campanhaId) return;

        try {
            await api.patch(`/whatsapp/atualizar-campanha/${campanhaId}/`, {
                id_whatsapp: idWpp,
            });
        } catch {
            toast.current.show({
                severity: "error",
                summary: "Erro",
                detail: "Erro ao atualizar número da campanha",
                life: 3000,
            });
        }
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <h2 className="text-xl font-bold mb-4">Passo 2: Importar Dados</h2>

            {/* SEÇÃO "DE" */}
            <h3 className="text-lg font-semibold mt-4 mb-2">De</h3>
            <p className="mb-2">Escolha qual conta WhatsApp Business será usada para o disparo.</p>
                <Dropdown
                value={whatsapps.find(w => w.id === whatsappSelecionado) || null}
                options={whatsapps}
                onChange={(e) => {
                    setWhatsappSelecionado(e.value.id);
                    atualizarWhatsAppNaCampanha(e.value.id);
                }}
                optionLabel="whatsapp"
                placeholder="Selecione um número"
                className="mb-4 w-full md:w-40rem"
                />

            {/* SEÇÃO "PARA" */}
            <h3 className="text-lg font-semibold mt-4 mb-2">Para</h3>
            <p className="mb-2">Selecione uma lista, segmento ou importe uma nova base.</p>
            <Dropdown
                value={destinoSelecionado}
                options={[]} // Placeholder para quando houver listas/segmentos
                onChange={(e) => setDestinoSelecionado(e.value)}
                placeholder="Selecione"
                className="mb-4 w-full md:w-40rem"
            />

            <Button
                label="Baixar Modelo"
                icon="pi pi-download"
                className="mb-4"
                onClick={() => window.open(`${api.defaults.baseURL}download-modelo-excel/`, "_blank")}
            />

            <FileUpload
                mode="basic"
                accept=".csv"
                maxFileSize={1000000}
                chooseLabel="Selecionar Arquivo"
                customUpload
                auto={false}
                onSelect={(e) => setArquivo(e.files[0])}
            />

            <div className="flex justify-content-between mt-4">
                <Button label="Voltar" icon="pi pi-arrow-left" onClick={() => navigate("/nova-campanha/dados")} />
                <Button
                    label={importando ? "Importando..." : "Próximo"}
                    icon="pi pi-arrow-right"
                    onClick={handleUpload}
                    disabled={!arquivo || importando}
                />
            </div>
        </div>
    );
}
