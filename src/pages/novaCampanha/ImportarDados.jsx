import { useState, useEffect, useRef } from "react";
import { FileUpload } from "primereact/fileupload";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import { Dialog } from "primereact/dialog";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

export default function ImportarDados() {
    const [arquivo, setArquivo] = useState(null);
    const [importando, setImportando] = useState(false);
    const [campanhaId, setCampanhaId] = useState(null);
    const [whatsapps, setWhatsapps] = useState([]);
    const [whatsappSelecionado, setWhatsappSelecionado] = useState(null);
    const [destinoSelecionado, setDestinoSelecionado] = useState(null); // Futuro uso para listas/segmentos
    const [showSkipDialog, setShowSkipDialog] = useState(false);
    const [dadosExistentes, setDadosExistentes] = useState(null);
    const toast = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const id = localStorage.getItem("campanhaId");
        if (id && id !== "null" && id !== "undefined") {
            setCampanhaId(id);
    
            // Busca a campanha e seta o WhatsApp vinculado
            api.get(`/campanhas/${id}/`)
                .then((res) => {
                    const idWpp = res.data.whatsapp;
                    setWhatsappSelecionado(idWpp);
                })
                .catch((err) => console.error("Erro ao carregar campanha", err));

            // Verifica se já existem dados na campanha
            verificarDadosExistentes(id);
        }
    
        // Carrega lista de WhatsApps
        api.get("/whatsapps/")
            .then((res) => {
                setWhatsapps(res.data.whatsapps || []);
            })
            .catch((err) => {
                console.error("Erro ao carregar instâncias de WhatsApp", err);
                setWhatsapps([]);
            });
    }, []);

    const verificarDadosExistentes = async (id) => {
        try {
            const response = await api.get(`/estatisticas-importacao/?campanha_id=${id}`);
            setDadosExistentes(response.data);
        } catch (error) {
            console.error("Erro ao verificar dados existentes", error);
            setDadosExistentes(null);
        }
    };

    const handleUpload = async () => {
        if (!campanhaId) {
            toast.current.show({
                severity: "warn",
                summary: "Aviso",
                detail: "Certifique-se que a campanha foi criada.",
                life: 3000,
            });
            return;
        }

        if (!whatsappSelecionado) {
            toast.current.show({
                severity: "warn",
                summary: "Aviso",
                detail: "Selecione um número de WhatsApp para o disparo.",
                life: 3000,
            });
            return;
        }

        if (!arquivo) {
            toast.current.show({
                severity: "warn",
                summary: "Aviso",
                detail: "Selecione um arquivo CSV para importar.",
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

            // Aguarda um pouco e vai para o próximo passo
            setTimeout(() => {
                navigate("/nova-campanha/template");
            }, 1500);
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

    const handlePularImportacao = () => {
        if (!whatsappSelecionado) {
            toast.current.show({
                severity: "warn",
                summary: "Aviso",
                detail: "Selecione um número de WhatsApp antes de prosseguir.",
                life: 3000,
            });
            return;
        }

        // Se não tem dados existentes, mostra o dialog de confirmação
        if (!dadosExistentes || dadosExistentes.total_registros === 0) {
            setShowSkipDialog(true);
        } else {
            // Se já tem dados, vai direto para o template
            navigate("/nova-campanha/template");
        }
    };

    const confirmarPularImportacao = () => {
        setShowSkipDialog(false);
        navigate("/nova-campanha/template");
    };

    const podeAvancar = () => {
        return whatsappSelecionado && (arquivo || (dadosExistentes && dadosExistentes.total_registros > 0));
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <h2 className="text-xl font-bold mb-4">Passo 2: Importar Dados</h2>

            {/* SEÇÃO "DE" */}
            <Card className="mb-4">
                <h3 className="text-lg font-semibold mb-2">📱 De (Remetente)</h3>
                <p className="mb-3 text-gray-600">Escolha qual conta WhatsApp Business será usada para o disparo.</p>
                <Dropdown
                    value={whatsapps.find(w => w.id === whatsappSelecionado) || null}
                    options={whatsapps}
                    onChange={(e) => {
                        setWhatsappSelecionado(e.value.id);
                        atualizarWhatsAppNaCampanha(e.value.id);
                    }}
                    optionLabel="whatsapp"
                    placeholder="Selecione um número"
                    className="w-full md:w-20rem"
                />
                {whatsappSelecionado && (
                    <div className="mt-2">
                        <i className="pi pi-check-circle text-green-500"></i>
                        <span className="text-green-600 text-sm ml-2">Número selecionado!</span>
                    </div>
                )}
            </Card>

            {/* SEÇÃO "PARA" */}
            <Card className="mb-4">
                <h3 className="text-lg font-semibold mb-2">👥 Para (Destinatários)</h3>
                
                {/* Status dos dados existentes */}
                {dadosExistentes && dadosExistentes.total_registros > 0 && (
                    <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                        <h4 className="font-semibold text-blue-800 mb-2">📊 Dados já importados:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="font-medium">Total:</span>
                                <span className="ml-2 text-blue-700">{dadosExistentes.total_registros}</span>
                            </div>
                            <div>
                                <span className="font-medium">Enviados:</span>
                                <span className="ml-2 text-green-600">{dadosExistentes.enviados}</span>
                            </div>
                            <div>
                                <span className="font-medium">Pendentes:</span>
                                <span className="ml-2 text-orange-600">{dadosExistentes.aguardando_envio}</span>
                            </div>
                            <div>
                                <span className="font-medium">Erros:</span>
                                <span className="ml-2 text-red-600">{dadosExistentes.com_erro}</span>
                            </div>
                        </div>
                    </div>
                )}

                <p className="mb-3 text-gray-600">Importe uma nova base de dados ou utilize dados já existentes.</p>
                
                {/* Futuro: Dropdown para listas/segmentos */}
                <Dropdown
                    value={destinoSelecionado}
                    options={[]} // Placeholder para quando houver listas/segmentos
                    onChange={(e) => setDestinoSelecionado(e.value)}
                    placeholder="Selecione uma lista (em breve)"
                    className="mb-4 w-full md:w-20rem"
                    disabled={true}
                />

                <div className="flex flex-column md:flex-row gap-3 align-items-start">
                    <Button
                        label="📥 Baixar Modelo CSV"
                        icon="pi pi-download"
                        className="p-button-outlined"
                        onClick={() => window.open(`${api.defaults.baseURL}download-modelo-excel/`, "_blank")}
                    />
                    
                    <FileUpload
                        mode="basic"
                        accept=".csv,.xlsx"
                        maxFileSize={5000000}
                        chooseLabel={arquivo ? `✅ ${arquivo.name}` : "📁 Selecionar Arquivo"}
                        customUpload
                        auto={false}
                        onSelect={(e) => setArquivo(e.files[0])}
                        className="file-upload-custom"
                    />
                </div>

                {arquivo && (
                    <div className="mt-3 p-2 bg-green-50 border-l-4 border-green-400 rounded">
                        <div className="flex align-items-center">
                            <i className="pi pi-file text-green-600 mr-2"></i>
                            <span className="text-green-700 text-sm">
                                Arquivo selecionado: <strong>{arquivo.name}</strong>
                            </span>
                        </div>
                    </div>
                )}
            </Card>

            {/* BOTÕES DE NAVEGAÇÃO */}
            <div className="flex justify-content-between align-items-center">
                <Button 
                    label="← Voltar" 
                    icon="pi pi-arrow-left" 
                    className="p-button-outlined"
                    onClick={() => navigate("/nova-campanha/dados")} 
                />
                
                <div className="flex gap-2">
                    {/* Botão Pular - sempre disponível se WhatsApp selecionado */}
                    <Button
                        label="Pular Importação"
                        icon="pi pi-step-forward"
                        className="p-button-text"
                        onClick={handlePularImportacao}
                        disabled={!whatsappSelecionado}
                        tooltip={!whatsappSelecionado ? "Selecione um WhatsApp primeiro" : "Pular esta etapa"}
                    />
                    
                    {/* Botão Próximo */}
                    <Button
                        label={importando ? "Importando..." : "Importar e Próximo →"}
                        icon={importando ? "pi pi-spin pi-spinner" : "pi pi-arrow-right"}
                        onClick={handleUpload}
                        disabled={!arquivo || importando || !whatsappSelecionado}
                        loading={importando}
                    />
                </div>
            </div>

            {/* Dica de navegação */}
            <div className="mt-4 p-3 bg-gray-50 rounded border">
                <div className="flex align-items-start">
                    <i className="pi pi-info-circle text-blue-500 mr-2 mt-1"></i>
                    <div className="text-sm text-gray-700">
                        <strong>💡 Dica:</strong> Você pode pular a importação se já possui dados na campanha ou 
                        se preferir adicionar os destinatários posteriormente. 
                        O número do WhatsApp é obrigatório para prosseguir.
                    </div>
                </div>
            </div>

            {/* Dialog de confirmação para pular */}
            <Dialog 
                header="🤔 Pular Importação?" 
                visible={showSkipDialog} 
                style={{ width: '450px' }}
                onHide={() => setShowSkipDialog(false)}
                modal
            >
                <div className="p-4">
                    <div className="flex align-items-start mb-4">
                        <i className="pi pi-exclamation-triangle text-orange-500 text-2xl mr-3"></i>
                        <div>
                            <p className="mb-3">
                                Você está prestes a pular a importação de dados. Isso significa que sua campanha 
                                não terá destinatários configurados.
                            </p>
                            <p className="text-gray-600 text-sm mb-3">
                                <strong>Você poderá:</strong>
                            </p>
                            <ul className="text-sm text-gray-600 mb-4">
                                <li>• Importar dados depois na aba de gerenciamento</li>
                                <li>• Configurar o template da mensagem</li>
                                <li>• Definir horários e outras configurações</li>
                            </ul>
                        </div>
                    </div>
                    
                    <div className="flex justify-content-end gap-2">
                        <Button 
                            label="Cancelar" 
                            className="p-button-text"
                            onClick={() => setShowSkipDialog(false)}
                        />
                        <Button 
                            label="Sim, Pular" 
                            className="p-button-primary"
                            onClick={confirmarPularImportacao}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
