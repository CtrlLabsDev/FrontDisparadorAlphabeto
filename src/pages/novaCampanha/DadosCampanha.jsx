import { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { useNavigate } from "react-router-dom";
import { Card } from "primereact/card";
import { Toast } from "primereact/toast";
import { ProgressBar } from "primereact/progressbar";
import { useRef } from "react";
import api from "../../services/api";
import "../../styles/DadosCampanha.css";

export default function DadosCampanha() {
    const [nome, setNome] = useState("");
    const [descricao, setDescricao] = useState("");
    const [campanhaId, setCampanhaId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isValid, setIsValid] = useState(false);
    const navigate = useNavigate();
    const toast = useRef(null);

    // Validação em tempo real
    useEffect(() => {
        setIsValid(nome.trim().length >= 3);
    }, [nome]);

    useEffect(() => {
        const id = localStorage.getItem("campanhaId");
        if (id) {
            setCampanhaId(id);
            setLoading(true);
            api.get(`/campanhas/${id}/`)
                .then((res) => {
                    setNome(res.data.nome || "");
                    setDescricao(res.data.descricao || "");
                    toast.current.show({
                        severity: "info",
                        summary: "📝 Campanha Carregada",
                        detail: "Dados da campanha carregados para edição",
                        life: 3000,
                    });
                })
                .catch((err) => {
                    console.error("Erro ao carregar campanha:", err);
                    toast.current.show({
                        severity: "error",
                        summary: "❌ Erro",
                        detail: "Erro ao carregar dados da campanha",
                        life: 5000,
                    });
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, []);

    const handleAvancar = async () => {
        if (!isValid) {
            toast.current.show({
                severity: "warn",
                summary: "⚠️ Dados Incompletos",
                detail: "O nome da campanha deve ter pelo menos 3 caracteres",
                life: 4000,
            });
            return;
        }

        setLoading(true);

        try {
            if (campanhaId) {
                // Atualiza campanha existente
                await api.patch(`/campanhas/${campanhaId}/`, {
                    nome: nome.trim(),
                    descricao: descricao.trim()
                });
                
                toast.current.show({
                    severity: "success",
                    summary: "✅ Campanha Atualizada",
                    detail: "Dados da campanha foram atualizados com sucesso!",
                    life: 3000,
                });
            } else {
                // Cria nova campanha
                const res = await api.post("/campanhas/", {
                    nome: nome.trim(),
                    descricao: descricao.trim()
                });
                
                localStorage.setItem("campanhaId", res.data.id);
                
                toast.current.show({
                    severity: "success",
                    summary: "🎉 Campanha Criada",
                    detail: "Nova campanha criada com sucesso!",
                    life: 3000,
                });
            }

            // Aguardar um pouco para mostrar o toast
            setTimeout(() => {
                navigate("/nova-campanha/importar");
            }, 1000);

        } catch (error) {
            console.error("Erro ao salvar campanha:", error);
            toast.current.show({
                severity: "error",
                summary: "❌ Erro ao Salvar",
                detail: error.response?.data?.detail || "Erro inesperado ao salvar campanha",
                life: 5000,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleVoltar = () => {
        navigate("/campanhas");
    };

    return (
        <div className="dados-campanha-wrapper">
            <Toast ref={toast} />
            
            {/* Header com progresso */}
            <div className="step-header">
                <div className="step-info">
                    <h1>📝 Dados da Campanha</h1>
                    <p>Defina o nome e descrição da sua campanha de WhatsApp</p>
                </div>
                
                <div className="step-progress">
                    <div className="progress-info">
                        <span>Passo 1 de 4</span>
                        <span>25%</span>
                    </div>
                    <ProgressBar value={25} className="progress-bar" />
                </div>
            </div>

            {/* Formulário principal */}
            <Card className="form-card">
                <div className="form-content">
                    {/* Campo Nome */}
                    <div className="input-group">
                        <label className="input-label">
                            🎯 Nome da Campanha *
                        </label>
                        <div className="input-wrapper">
                            <InputText 
                                value={nome} 
                                onChange={(e) => setNome(e.target.value)}
                                placeholder="Ex: Promoção Black Friday 2024"
                                className={`form-input ${nome.trim().length >= 3 ? 'valid' : nome.trim().length > 0 ? 'invalid' : ''}`}
                                maxLength={100}
                                disabled={loading}
                            />
                            <div className="input-feedback">
                                <div className="char-counter">
                                    {nome.length}/100 caracteres
                                </div>
                                {nome.trim().length > 0 && (
                                    <div className={`validation-icon ${nome.trim().length >= 3 ? 'valid' : 'invalid'}`}>
                                        {nome.trim().length >= 3 ? '✅' : '⚠️'}
                                    </div>
                                )}
                            </div>
                        </div>
                        <small className="input-help">
                            Nome identificador da campanha. Mínimo 3 caracteres.
                        </small>
                    </div>

                    {/* Campo Descrição */}
                    <div className="input-group">
                        <label className="input-label">
                            📄 Descrição da Campanha
                        </label>
                        <div className="input-wrapper">
                            <InputTextarea 
                                value={descricao} 
                                onChange={(e) => setDescricao(e.target.value)}
                                placeholder="Descreva o objetivo e detalhes da campanha..."
                                className="form-textarea"
                                rows={4}
                                maxLength={500}
                                disabled={loading}
                                autoResize
                            />
                            <div className="input-feedback">
                                <div className="char-counter">
                                    {descricao.length}/500 caracteres
                                </div>
                            </div>
                        </div>
                        <small className="input-help">
                            Descrição opcional para identificar o propósito da campanha.
                        </small>
                    </div>

                    {/* Preview da campanha */}
                    {(nome.trim() || descricao.trim()) && (
                        <div className="campaign-preview">
                            <h4>👀 Preview da Campanha</h4>
                            <div className="preview-card">
                                <div className="preview-header">
                                    <div className="preview-icon">🚀</div>
                                    <div className="preview-info">
                                        <div className="preview-name">
                                            {nome.trim() || "Nome da campanha"}
                                        </div>
                                        <div className="preview-status">
                                            📅 {campanhaId ? 'Editando campanha' : 'Nova campanha'}
                                        </div>
                                    </div>
                                </div>
                                {descricao.trim() && (
                                    <div className="preview-description">
                                        {descricao.trim()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            {/* Botões de navegação */}
            <div className="navigation-buttons">
                <Button 
                    label="← Voltar" 
                    className="back-btn"
                    onClick={handleVoltar}
                    disabled={loading}
                />
                
                <Button 
                    label={loading ? "Salvando..." : "Próximo →"}
                    icon={loading ? "pi pi-spin pi-spinner" : "pi pi-arrow-right"}
                    iconPos="right"
                    className="next-btn"
                    onClick={handleAvancar}
                    disabled={!isValid || loading}
                />
            </div>

            {/* Dicas e informações */}
            <Card className="tips-card">
                <h4>💡 Dicas para uma boa campanha</h4>
                <div className="tips-list">
                    <div className="tip-item">
                        <span className="tip-icon">✨</span>
                        <span>Use nomes descritivos e únicos para identificar facilmente suas campanhas</span>
                    </div>
                    <div className="tip-item">
                        <span className="tip-icon">📊</span>
                        <span>Inclua na descrição o objetivo, público-alvo e período da campanha</span>
                    </div>
                    <div className="tip-item">
                        <span className="tip-icon">🎯</span>
                        <span>Organize suas campanhas por categoria: promoções, informativos, etc.</span>
                    </div>
                </div>
            </Card>
        </div>
    );
}