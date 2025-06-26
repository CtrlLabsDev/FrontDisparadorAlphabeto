import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { useNavigate } from 'react-router-dom';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { FilterMatchMode } from 'primereact/api';
import { IconField } from 'primereact/iconfield';
import { InputIcon } from 'primereact/inputicon';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Card } from 'primereact/card';
import { Badge } from 'primereact/badge';
import "../styles/campanhas.css";

export default function Campanhas() {
    const [campanhas, setCampanhas] = useState([]);
    const [statusCampanhas, setStatusCampanhas] = useState({});
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        global: { value: null, matchMode: FilterMatchMode.CONTAINS },
        nome: { value: null, matchMode: FilterMatchMode.CONTAINS },
        descricao: { value: null, matchMode: FilterMatchMode.CONTAINS },
        status: { value: null, matchMode: FilterMatchMode.EQUALS },
        data_criacao: { value: null, matchMode: FilterMatchMode.DATE_IS },
        data_finalizacao: { value: null, matchMode: FilterMatchMode.DATE_IS }
    });
    
    const navigate = useNavigate();
    const toast = useRef(null);

    const statusOptions = [
        { label: 'Agendada', value: 'agendada', icon: '🕐', color: 'info' },
        { label: 'Em Execução', value: 'emexecucao', icon: '🚀', color: 'warning' },
        { label: 'Pausada', value: 'pausada', icon: '⏸️', color: 'secondary' },
        { label: 'Finalizada', value: 'finalizada', icon: '✅', color: 'success' }
    ];

    const getStatusConfig = (status) => {
        return statusOptions.find(s => s.value === status) || 
               { label: 'Desconhecido', icon: '❓', color: 'secondary' };
    };

    // Stats para o header
    const [stats, setStats] = useState({
        total: 0,
        ativas: 0,
        pausadas: 0,
        finalizadas: 0
    });

    // ✅ Buscar campanhas do banco
    const buscarCampanhas = async () => {
        try {
            setLoading(true);
            const res = await api.get('campanhas/');
            const campanhasComDatas = res.data.map(c => ({
                ...c,
                data_criacao: c.data_criacao ? new Date(c.data_criacao) : null,
                data_finalizacao: c.data_finalizacao ? new Date(c.data_finalizacao) : null
            }));
            setCampanhas(campanhasComDatas);
            
            // Calcular stats
            const newStats = {
                total: campanhasComDatas.length,
                ativas: campanhasComDatas.filter(c => c.status === 'emexecucao').length,
                pausadas: campanhasComDatas.filter(c => c.status === 'pausada').length,
                finalizadas: campanhasComDatas.filter(c => c.status === 'finalizada').length
            };
            setStats(newStats);
            
        } catch (err) {
            console.error('Erro ao buscar campanhas:', err);
            toast.current.show({
                severity: "error",
                summary: "Erro",
                detail: "Erro ao carregar campanhas",
                life: 3000,
            });
        } finally {
            setLoading(false);
        }
    };

    // ✅ Buscar status das campanhas em cache
    const buscarStatusCampanhas = async () => {
        try {
            const res = await api.get('status-campanhas/');
            const statusMap = {};
            res.data.forEach(item => {
                statusMap[item.campanha_id] = {
                    is_running: item.status_cache?.running || false,
                    is_paused: item.status_cache?.paused || false,
                    status_db: item.status_db
                };
            });
            setStatusCampanhas(statusMap);
        } catch (err) {
            console.error('Erro ao buscar status das campanhas:', err);
        }
    };

    useEffect(() => {
        buscarCampanhas();
        buscarStatusCampanhas();
        
        // Atualizar a cada 1 minuto
        const interval = setInterval(() => {
            buscarCampanhas();
            buscarStatusCampanhas();
        }, 60000);
        
        return () => clearInterval(interval);
    }, []);

    // ✅ INICIAR CAMPANHA
    const iniciarCampanha = async (campanhaId) => {
        const campanha = campanhas.find(c => c.id === campanhaId);
        
        if (!campanha) {
            toast.current.show({
                severity: "error",
                summary: "❌ Erro",
                detail: "Campanha não encontrada",
                life: 3000,
            });
            return;
        }

        if (!['agendada', 'pausada'].includes(campanha.status)) {
            toast.current.show({
                severity: "warn",
                summary: "⚠️ Ação Inválida",
                detail: `Campanha não pode ser iniciada. Status atual: ${campanha.status}`,
                life: 4000,
            });
            return;
        }

        const statusCache = statusCampanhas[campanhaId];
        if (statusCache?.is_running) {
            toast.current.show({
                severity: "warn",
                summary: "⚠️ Campanha Ativa",
                detail: "Esta campanha já está em execução",
                life: 3000,
            });
            return;
        }

        confirmDialog({
            message: `Deseja iniciar a campanha "${campanha.nome}"?`,
            header: '🚀 Confirmar Início',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, Iniciar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    setLoading(true);
                    
                    toast.current.show({
                        severity: "info",
                        summary: "🔄 Iniciando Campanha",
                        detail: "Preparando disparo das mensagens...",
                        life: 3000,
                    });

                    await api.post("iniciar-campanha/", { campanha_id: campanhaId });
                    
                    toast.current.show({
                        severity: "success",
                        summary: "✅ Campanha Iniciada",
                        detail: "O processo de envio foi iniciado com sucesso!",
                        life: 4000,
                    });

                    await buscarCampanhas();
                    await buscarStatusCampanhas();
                    
                } catch (err) {
                    console.error('Erro ao iniciar campanha:', err);
                    toast.current.show({
                        severity: "error",
                        summary: "❌ Erro ao Iniciar",
                        detail: err.response?.data?.erro || "Erro inesperado ao iniciar campanha",
                        life: 5000,
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // ✅ PAUSAR CAMPANHA
    const pausarCampanha = async (campanhaId) => {
        const campanha = campanhas.find(c => c.id === campanhaId);
        
        if (!campanha) {
            toast.current.show({
                severity: "error",
                summary: "❌ Erro",
                detail: "Campanha não encontrada",
                life: 3000,
            });
            return;
        }

        const statusCache = statusCampanhas[campanhaId];
        if (!statusCache?.is_running) {
            toast.current.show({
                severity: "warn",
                summary: "⚠️ Ação Inválida",
                detail: "Esta campanha não está em execução",
                life: 3000,
            });
            return;
        }

        confirmDialog({
            message: `Deseja pausar a campanha "${campanha.nome}"?`,
            header: '⏸️ Confirmar Pausa',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, Pausar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    setLoading(true);
                    
                    await api.post("pausar-campanha/", { campanha_id: campanhaId });
                    
                    toast.current.show({
                        severity: "warn",
                        summary: "⏸️ Campanha Pausada",
                        detail: "Disparo pausado com sucesso!",
                        life: 3000,
                    });

                    await buscarCampanhas();
                    await buscarStatusCampanhas();
                    
                } catch (err) {
                    console.error('Erro ao pausar campanha:', err);
                    toast.current.show({
                        severity: "error",
                        summary: "❌ Erro ao Pausar",
                        detail: err.response?.data?.erro || "Erro inesperado ao pausar campanha",
                        life: 4000,
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // ✅ FINALIZAR CAMPANHA
    const finalizarCampanha = async (campanhaId) => {
        const campanha = campanhas.find(c => c.id === campanhaId);
        
        if (!campanha) return;

        confirmDialog({
            message: `Deseja finalizar definitivamente a campanha "${campanha.nome}"? Esta ação não pode ser desfeita.`,
            header: '🛑 Confirmar Finalização',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, Finalizar',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    setLoading(true);
                    
                    await api.post("parar-campanha/", { campanha_id: campanhaId });
                    
                    toast.current.show({
                        severity: "success",
                        summary: "✅ Campanha Finalizada",
                        detail: "Campanha finalizada com sucesso!",
                        life: 3000,
                    });

                    await buscarCampanhas();
                    await buscarStatusCampanhas();
                    
                } catch (err) {
                    console.error('Erro ao finalizar campanha:', err);
                    toast.current.show({
                        severity: "error",
                        summary: "❌ Erro ao Finalizar",
                        detail: err.response?.data?.erro || "Erro inesperado",
                        life: 4000,
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // ✅ PAUSAR TODAS AS CAMPANHAS
    const pausarTodasCampanhas = async () => {
        confirmDialog({
            message: 'Deseja pausar TODAS as campanhas ativas?',
            header: '⏸️ Pausar Todas',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sim, Pausar Todas',
            rejectLabel: 'Cancelar',
            accept: async () => {
                try {
                    setLoading(true);
                    
                    await api.post("pausar-todas-campanhas/");
                    
                    toast.current.show({
                        severity: "warn",
                        summary: "⏸️ Campanhas Pausadas",
                        detail: "Todas as campanhas ativas foram pausadas!",
                        life: 3000,
                    });

                    await buscarCampanhas();
                    await buscarStatusCampanhas();
                    
                } catch (err) {
                    console.error('Erro ao pausar todas:', err);
                    toast.current.show({
                        severity: "error",
                        summary: "❌ Erro",
                        detail: err.response?.data?.erro || "Erro inesperado",
                        life: 4000,
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // ✅ Template de status melhorado
    const statusBodyTemplate = (rowData) => {
        const statusConfig = getStatusConfig(rowData.status);
        const statusCache = statusCampanhas[rowData.id];
        
        return (
            <div className="status-container">
                <Tag 
                    value={`${statusConfig.icon} ${statusConfig.label}`} 
                    severity={statusConfig.color}
                    className="status-tag"
                />
                <div className="status-indicators">
                    {statusCache?.is_running && (
                        <Badge 
                            value="●" 
                            severity="warning" 
                            className="running-indicator"
                            title="Executando em background"
                        />
                    )}
                    {statusCache?.is_paused && statusCache?.is_running && (
                        <Badge 
                            value="⏸" 
                            severity="secondary" 
                            className="paused-indicator"
                            title="Pausada temporariamente"
                        />
                    )}
                </div>
            </div>
        );
    };

    // ✅ Template de nome com mais destaque
    const nomeBodyTemplate = (rowData) => {
        return (
            <div className="nome-container">
                <div className="nome-principal">{rowData.nome}</div>
                {rowData.descricao && (
                    <div className="nome-descricao">{rowData.descricao}</div>
                )}
            </div>
        );
    };

    const statusItemTemplate = (option) => {
        return <Tag value={`${option.icon} ${option.label}`} severity={option.color} />;
    };

    const statusFilterTemplate = (options) => {
        return (
            <Dropdown
                value={options.value}
                options={statusOptions}
                onChange={(e) => options.filterCallback(e.value, options.index)}
                placeholder="Filtrar status"
                className="p-column-filter"
                itemTemplate={statusItemTemplate}
                showClear
            />
        );
    };

    const dateFilterTemplate = (options) => {
        return (
            <Calendar
                value={options.value || null}
                onChange={(e) => options.filterCallback(e.value, options.index)}
                placeholder="Filtrar por data"
                dateFormat="dd/mm/yy"
                showIcon
            />
        );
    };

    const formatDate = (dateInput) => {
        if (!dateInput) return "";
        
        const date = typeof dateInput === "string" && dateInput.length === 10
            ? new Date(dateInput + "T00:00:00")
            : new Date(dateInput);
        
        return new Intl.DateTimeFormat("pt-BR").format(date);
    };

    const onGlobalFilterChange = (e) => {
        const value = e.target.value;
        setFilters((prev) => ({
            ...prev,
            global: { value, matchMode: FilterMatchMode.CONTAINS }
        }));
    };

    const renderHeader = () => {
        return (
            <div className="table-header">
                <div className="search-container">
                    <IconField iconPosition="left">
                        <InputIcon className="pi pi-search" />
                        <InputText
                            value={filters.global?.value || ""}
                            onChange={onGlobalFilterChange}
                            placeholder="🔍 Buscar campanhas..."
                            className="search-input"
                        />
                    </IconField>
                </div>
                
                <div className="header-actions">
                    <Button
                        label="⏸️ Pausar Todas"
                        className="pause-all-btn"
                        onClick={pausarTodasCampanhas}
                        disabled={loading || stats.ativas === 0}
                        tooltip="Pausar todas as campanhas ativas"
                    />
                </div>
            </div>
        );
    };

    // ✅ Template de ações melhorado
    const actionsBodyTemplate = (rowData) => {
        const statusCache = statusCampanhas[rowData.id];
        const isRunning = statusCache?.is_running || false;
        const isPaused = statusCache?.is_paused || false;
        
        return (
            <div className="actions-container">
                {/* Botão Editar */}
                <Button 
                    icon="pi pi-pencil" 
                    className="action-btn edit-btn" 
                    tooltip="Editar Campanha"
                    disabled={isRunning}
                    onClick={() => {
                        localStorage.setItem("campanhaId", rowData.id);
                        navigate("/nova-campanha/dados");
                    }} 
                />
                
                {/* Botão Iniciar/Retomar */}
                {(!isRunning || isPaused) && ['agendada', 'pausada'].includes(rowData.status) && (
                    <Button 
                        icon="pi pi-play" 
                        className="action-btn start-btn" 
                        tooltip={isPaused ? "Retomar Campanha" : "Iniciar Campanha"}
                        disabled={loading}
                        onClick={() => iniciarCampanha(rowData.id)} 
                    />
                )}
                
                {/* Botão Pausar */}
                {isRunning && !isPaused && (
                    <Button 
                        icon="pi pi-pause" 
                        className="action-btn pause-btn" 
                        tooltip="Pausar Campanha"
                        disabled={loading}
                        onClick={() => pausarCampanha(rowData.id)} 
                    />
                )}
                
                {/* Botão Finalizar */}
                {(isRunning || ['agendada', 'pausada'].includes(rowData.status)) && (
                    <Button 
                        icon="pi pi-stop" 
                        className="action-btn stop-btn" 
                        tooltip="Finalizar Campanha"
                        disabled={loading}
                        onClick={() => finalizarCampanha(rowData.id)} 
                    />
                )}
                
                {/* Botão Analytics */}
                <Button 
                    icon="pi pi-chart-bar" 
                    className="action-btn analytics-btn" 
                    tooltip="Ver Analytics"
                    onClick={() => navigate(`/analytics/campanha/${rowData.id}`)} 
                />
            </div>
        );
    };

    return (
        <div className="campanhas-wrapper">
            <Toast ref={toast} />
            <ConfirmDialog />

            {/* Header com título e stats */}
            <div className="page-header">
                <div className="header-content">
                    <div className="title-section">
                        <h1>🚀 Campanhas</h1>
                        <p>Gerencie e monitore suas campanhas de WhatsApp</p>
                    </div>
                    
                    <Button
                        label="➕ Nova Campanha"
                        className="create-btn"
                        onClick={() => navigate("/nova-campanha")}
                    />
                </div>

                {/* Cards de estatísticas */}
                <div className="stats-cards">
                    <Card className="stat-card total">
                        <div className="stat-content">
                            <div className="stat-icon">📊</div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.total}</div>
                                <div className="stat-label">Total</div>
                            </div>
                        </div>
                    </Card>

                    <Card className="stat-card active">
                        <div className="stat-content">
                            <div className="stat-icon">🚀</div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.ativas}</div>
                                <div className="stat-label">Ativas</div>
                            </div>
                        </div>
                    </Card>

                    <Card className="stat-card paused">
                        <div className="stat-content">
                            <div className="stat-icon">⏸️</div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.pausadas}</div>
                                <div className="stat-label">Pausadas</div>
                            </div>
                        </div>
                    </Card>

                    <Card className="stat-card finished">
                        <div className="stat-content">
                            <div className="stat-icon">✅</div>
                            <div className="stat-info">
                                <div className="stat-value">{stats.finalizadas}</div>
                                <div className="stat-label">Finalizadas</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Tabela de campanhas */}
            <Card className="table-card">
                <DataTable
                    value={campanhas}
                    loading={loading}
                    paginator
                    rows={10}
                    filters={filters}
                    onFilter={(e) => setFilters(e.filters)}
                    globalFilterFields={['nome', 'descricao', 'status', 'data_criacao']}
                    header={renderHeader()}
                    responsiveLayout="scroll"
                    emptyMessage="📭 Nenhuma campanha encontrada."
                    stripedRows
                    className="modern-table"
                    paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                    currentPageReportTemplate="Exibindo {first} a {last} de {totalRecords} campanhas"
                >
                    <Column 
                        field="nome" 
                        header="📋 Campanha" 
                        body={nomeBodyTemplate}
                        showFilterMatchModes={false} 
                        sortable 
                        filter 
                        filterPlaceholder="Filtrar por nome" 
                        style={{ minWidth: '20rem' }} 
                    />
                    
                    <Column  
                        field="data_criacao" 
                        header="📅 Criada em" 
                        sortable 
                        filter  
                        dataType="date" 
                        filterElement={dateFilterTemplate} 
                        body={(rowData) => formatDate(rowData.data_criacao)} 
                        style={{ minWidth: "10rem" }} 
                    />
                    
                    <Column 
                        field="data_finalizacao" 
                        header="🏁 Finalizada em" 
                        sortable 
                        filter  
                        dataType="date" 
                        filterElement={dateFilterTemplate} 
                        body={(rowData) => formatDate(rowData.data_finalizacao)} 
                        style={{ minWidth: '10rem' }} 
                    />
                    
                    <Column 
                        field="status" 
                        header="📊 Status" 
                        showFilterMatchModes={false} 
                        sortable 
                        filter 
                        filterElement={statusFilterTemplate} 
                        body={statusBodyTemplate} 
                        style={{ minWidth: '12rem' }} 
                    />
                    
                    <Column
                        header="⚙️ Ações"
                        body={actionsBodyTemplate}
                        style={{ minWidth: '16rem' }}
                    />
                </DataTable>
            </Card>
        </div>
    );
}