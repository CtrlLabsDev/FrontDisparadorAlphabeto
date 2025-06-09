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
        { label: 'Agendada', value: 'agendada' },
        { label: 'Em Execução', value: 'emexecucao' },
        { label: 'Pausada', value: 'pausada' },
        { label: 'Finalizada', value: 'finalizada' }
    ];

    const getStatusTag = (status) => {
        const map = {
            agendada: 'info',
            pausada: 'secondary',
            emexecucao: 'warning',
            finalizada: 'success'
        };
        return map[status] || 'secondary';
    };

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
        
        // Atualizar a cada 10 segundos
        const interval = setInterval(() => {
            buscarCampanhas();
            buscarStatusCampanhas();
        }, 60000);
        
        return () => clearInterval(interval);
    }, []);

    // ✅ INICIAR CAMPANHA - Nova API Z-API
    const iniciarCampanha = async (campanhaId) => {
        const campanha = campanhas.find(c => c.id === campanhaId);
        
        if (!campanha) {
            toast.current.show({
                severity: "error",
                summary: "Erro",
                detail: "Campanha não encontrada",
                life: 3000,
            });
            return;
        }

        // Verificar se campanha pode ser iniciada
        if (!['agendada', 'pausada'].includes(campanha.status)) {
            toast.current.show({
                severity: "warn",
                summary: "Ação Inválida",
                detail: `Campanha não pode ser iniciada. Status atual: ${campanha.status}`,
                life: 4000,
            });
            return;
        }

        // Verificar se já está rodando
        const statusCache = statusCampanhas[campanhaId];
        if (statusCache?.is_running) {
            toast.current.show({
                severity: "warn",
                summary: "Campanha Ativa",
                detail: "Esta campanha já está em execução",
                life: 3000,
            });
            return;
        }

        confirmDialog({
            message: `Deseja iniciar a campanha "${campanha.nome}"?`,
            header: 'Confirmar Início',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    setLoading(true);
                    
                    toast.current.show({
                        severity: "info",
                        summary: "Iniciando Campanha",
                        detail: "Preparando disparo das mensagens...",
                        life: 3000,
                    });

                    await api.post("iniciar-campanha/", { campanha_id: campanhaId });
                    
                    toast.current.show({
                        severity: "success",
                        summary: "Campanha Iniciada",
                        detail: "O processo de envio foi iniciado com sucesso!",
                        life: 4000,
                    });

                    // Atualizar dados
                    await buscarCampanhas();
                    await buscarStatusCampanhas();
                    
                } catch (err) {
                    console.error('Erro ao iniciar campanha:', err);
                    toast.current.show({
                        severity: "error",
                        summary: "Erro ao Iniciar",
                        detail: err.response?.data?.erro || "Erro inesperado ao iniciar campanha",
                        life: 5000,
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // ✅ PAUSAR CAMPANHA - Nova API Z-API
    const pausarCampanha = async (campanhaId) => {
        const campanha = campanhas.find(c => c.id === campanhaId);
        
        if (!campanha) {
            toast.current.show({
                severity: "error",
                summary: "Erro",
                detail: "Campanha não encontrada",
                life: 3000,
            });
            return;
        }

        // Verificar se campanha está rodando
        const statusCache = statusCampanhas[campanhaId];
        if (!statusCache?.is_running) {
            toast.current.show({
                severity: "warn",
                summary: "Ação Inválida",
                detail: "Esta campanha não está em execução",
                life: 3000,
            });
            return;
        }

        confirmDialog({
            message: `Deseja pausar a campanha "${campanha.nome}"?`,
            header: 'Confirmar Pausa',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    setLoading(true);
                    
                    await api.post("pausar-campanha/", { campanha_id: campanhaId });
                    
                    toast.current.show({
                        severity: "warn",
                        summary: "Campanha Pausada",
                        detail: "Disparo pausado com sucesso!",
                        life: 3000,
                    });

                    // Atualizar dados
                    await buscarCampanhas();
                    await buscarStatusCampanhas();
                    
                } catch (err) {
                    console.error('Erro ao pausar campanha:', err);
                    toast.current.show({
                        severity: "error",
                        summary: "Erro ao Pausar",
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
            header: 'Confirmar Finalização',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    setLoading(true);
                    
                    await api.post("parar-campanha/", { campanha_id: campanhaId });
                    
                    toast.current.show({
                        severity: "success",
                        summary: "Campanha Finalizada",
                        detail: "Campanha finalizada com sucesso!",
                        life: 3000,
                    });

                    // Atualizar dados
                    await buscarCampanhas();
                    await buscarStatusCampanhas();
                    
                } catch (err) {
                    console.error('Erro ao finalizar campanha:', err);
                    toast.current.show({
                        severity: "error",
                        summary: "Erro ao Finalizar",
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
            header: 'Pausar Todas',
            icon: 'pi pi-exclamation-triangle',
            accept: async () => {
                try {
                    setLoading(true);
                    
                    await api.post("pausar-todas-campanhas/");
                    
                    toast.current.show({
                        severity: "warn",
                        summary: "Campanhas Pausadas",
                        detail: "Todas as campanhas ativas foram pausadas!",
                        life: 3000,
                    });

                    // Atualizar dados
                    await buscarCampanhas();
                    await buscarStatusCampanhas();
                    
                } catch (err) {
                    console.error('Erro ao pausar todas:', err);
                    toast.current.show({
                        severity: "error",
                        summary: "Erro",
                        detail: err.response?.data?.erro || "Erro inesperado",
                        life: 4000,
                    });
                } finally {
                    setLoading(false);
                }
            }
        });
    };

    // ✅ Template de status com indicador de execução
    const statusBodyTemplate = (rowData) => {
        const label = statusOptions.find(s => s.value === rowData.status)?.label || 'Desconhecido';
        const statusCache = statusCampanhas[rowData.id];
        
        return (
            <div className="flex align-items-center gap-2">
                <Tag value={label} severity={getStatusTag(rowData.status)} />
                {statusCache?.is_running && (
                    <i className="pi pi-spin pi-spinner text-orange-500" title="Executando em background" />
                )}
                {statusCache?.is_paused && statusCache?.is_running && (
                    <i className="pi pi-pause text-yellow-500" title="Pausada temporariamente" />
                )}
            </div>
        );
    };

    const statusItemTemplate = (option) => {
        return <Tag value={option.label} severity={getStatusTag(option.value)} />;
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
            <div className="flex justify-between align-items-center">
                <IconField iconPosition="left">
                    <InputIcon className="pi pi-search" />
                    <InputText
                        value={filters.global?.value || ""}
                        onChange={onGlobalFilterChange}
                        placeholder="Buscar campanhas..."
                    />
                </IconField>
                
                <Button
                    label="Pausar Todas"
                    icon="pi pi-pause"
                    className="p-button-warning p-button-outlined"
                    onClick={pausarTodasCampanhas}
                    disabled={loading}
                />
            </div>
        );
    };

    // ✅ Template de ações com botões condicionais
    const actionsBodyTemplate = (rowData) => {
        const statusCache = statusCampanhas[rowData.id];
        const isRunning = statusCache?.is_running || false;
        const isPaused = statusCache?.is_paused || false;
        
        return (
            <div className="flex gap-2">
                {/* Botão Editar */}
                <Button 
                    icon="pi pi-pencil" 
                    className="p-button-rounded p-button-warning" 
                    tooltip="Editar"
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
                        className="p-button-rounded p-button-success" 
                        tooltip={isPaused ? "Retomar Campanha" : "Iniciar Campanha"}
                        disabled={loading}
                        onClick={() => iniciarCampanha(rowData.id)} 
                    />
                )}
                
                {/* Botão Pausar */}
                {isRunning && !isPaused && (
                    <Button 
                        icon="pi pi-pause" 
                        className="p-button-rounded p-button-warning" 
                        tooltip="Pausar Campanha"
                        disabled={loading}
                        onClick={() => pausarCampanha(rowData.id)} 
                    />
                )}
                
                {/* Botão Finalizar */}
                {(isRunning || ['agendada', 'pausada'].includes(rowData.status)) && (
                    <Button 
                        icon="pi pi-stop" 
                        className="p-button-rounded p-button-danger" 
                        tooltip="Finalizar Campanha"
                        disabled={loading}
                        onClick={() => finalizarCampanha(rowData.id)} 
                    />
                )}
                
                {/* Botão Analytics */}
                <Button 
                    icon="pi pi-chart-bar" 
                    className="p-button-rounded p-button-info" 
                    tooltip="Ver Analytics"
                    onClick={() => navigate(`/analytics/campanha/${rowData.id}`)} 
                />
            </div>
        );
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />
            <ConfirmDialog />

            <div className="header-campanhas-title mb-3 flex justify-between items-center">
                <h2>Campanhas</h2>
                <Button
                    label="Criar Campanha"
                    icon="pi pi-plus"
                    className="p-button-primary"
                    onClick={() => navigate("/nova-campanha")}
                />
            </div>

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
                emptyMessage="Nenhuma campanha encontrada."
                stripedRows
            >
                <Column 
                    field="nome" 
                    header="Nome" 
                    showFilterMatchModes={false} 
                    sortable 
                    filter 
                    filterPlaceholder="Filtrar por nome" 
                    style={{ minWidth: '20rem' }} 
                />
                
                <Column 
                    field="descricao" 
                    header="Descrição" 
                    showFilterMatchModes={false} 
                    sortable 
                    filter 
                    filterPlaceholder="Filtrar por descrição" 
                    style={{ minWidth: '10rem' }} 
                />
                
                <Column  
                    field="data_criacao" 
                    header="Criada em" 
                    sortable 
                    filter  
                    dataType="date" 
                    filterElement={dateFilterTemplate} 
                    body={(rowData) => formatDate(rowData.data_criacao)} 
                    style={{ minWidth: "8rem" }} 
                />
                
                <Column 
                    field="data_finalizacao" 
                    header="Finalizada em" 
                    sortable 
                    filter  
                    dataType="date" 
                    filterElement={dateFilterTemplate} 
                    body={(rowData) => formatDate(rowData.data_finalizacao)} 
                    style={{ minWidth: '8rem' }} 
                />
                
                <Column 
                    field="status" 
                    header="Status" 
                    showFilterMatchModes={false} 
                    sortable 
                    filter 
                    filterElement={statusFilterTemplate} 
                    body={statusBodyTemplate} 
                    style={{ minWidth: '12rem' }} 
                />
                
                <Column
                    header="Ações"
                    body={actionsBodyTemplate}
                    style={{ minWidth: '18rem' }}
                />
            </DataTable>
        </div>
    );
}