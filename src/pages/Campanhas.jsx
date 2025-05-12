// Campanhas.jsx

import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { useNavigate } from "react-router-dom";
import { Toast } from "primereact/toast";
import { Tag } from 'primereact/tag';
import "../styles/campanhas.css"; // ajuste o caminho conforme necessário

export default function Campanhas() {
    const [filtro, setFiltro] = useState("");
    const navigate = useNavigate();
    const [campanhas, setCampanhas] = useState([]);
    const toast = useRef(null);

    const buscarCampanhas = () => {
        api.get('campanhas/')
            .then(res => setCampanhas(res.data))
            .catch(err => console.error('Erro ao buscar campanhas:', err));
    };

    useEffect(() => {
        buscarCampanhas();
        const interval = setInterval(buscarCampanhas, 10000);
        return () => clearInterval(interval);
    }, []);

    const campanhasFiltradas = campanhas.filter((c) =>
        c.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    

    const enviarViaZapi = async (campanhaId) => {
        try {
            const res = await api.post("orquestrar-envio-zapi/", { campanha_id: campanhaId }); // 👈 novo endpoint correto
            toast.current.show({
                severity: "success",
                summary: "Z-API",
                detail: res.data.mensagem || "Mensagens enviadas com sucesso!",
                life: 3000,
            });
        } catch (err) {
            toast.current.show({
                severity: "error",
                summary: "Erro ao Enviar",
                detail: err.response?.data?.erro || "Erro ao enviar pela Z-API",
                life: 3000,
            });
        }
    };
    
    const pausarCampanhazapi = async (campanhaId) => {
        try {
            // Primeiro: pausar no banco
            await api.post("pausar-campanha-zapi/", { campanha_id: campanhaId });
    
            // Segundo: pausar o orquestrador que está rodando
            await api.post("pausar-orquestrador/");
    
            toast.current.show({
                severity: "warn",
                summary: "Campanha Pausada",
                detail: "Disparo pausado com sucesso!",
                life: 3000,
            });
    
            buscarCampanhas();
        } catch (err) {
            toast.current.show({
                severity: "error",
                summary: "Erro ao pausar",
                detail: err.response?.data?.erro || "Erro inesperado.",
                life: 3000,
            });
        }
    };
    
    


    const statusBodyTemplate = (rowData) => {
        const statusMap = {
            agendada: { color: 'info', label: 'Agendada' },
            pausada: { color: 'secondary', label: 'Pausada' },
            emexecucao: { color: 'warning', label: 'Em Execução' },
            finalizada: { color: 'success', label: 'Finalizada' },
        };
        const { color, label } = statusMap[rowData.status] || { color: 'secondary', label: 'Desconhecido' };
        return <Tag value={label} severity={color} />;
    };

    return (
        <div className="p-4">
            <Toast ref={toast} />

            <div className='header-campanhas-title'>
                <div className="header-campanhas-input">
                    <InputText
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        placeholder="Buscar campanha..."
                        className="w-full p-inputtext-lg"
                    />
                </div>

                <div className="header-campanhas-button">
                    {/* <h2 className="text-xl font-semibold mb-4">Campanhas</h2> */}
                    <Button label="Criar Campanha" icon="pi pi-plus" className="p-button-primary" onClick={() => navigate("/nova-campanha")} />
                </div>
            </div>
            

            <DataTable value={campanhasFiltradas} paginator rows={10} responsiveLayout="scroll">
                <Column field="nome" header="Nome" style={{ minWidth: '6rem' }} />
                <Column field="descricao" header="Descrição" />
                <Column field="data_inicio" header="Início" style={{ minWidth: '6rem' }} 
                    body={(rowData) => { const data = new Date(rowData.data_inicio);
                    return isNaN(data) ? '' : new Intl.DateTimeFormat('pt-BR').format(data);
                }}/>
                <Column field="data_criacao" header="Criada em" style={{ minWidth: '6rem' }}
                    body={(rowData) => { const data = new Date(rowData.data_criacao);
                    return isNaN(data) ? '' : new Intl.DateTimeFormat('pt-BR').format(data);
                }}/>
                <Column field="status" header="Status" body={statusBodyTemplate} style={{ minWidth: '8rem' }} />
                <Column
                    header="Ações"
                    body={(rowData) => (
                        <div className="flex gap-2">
                            <Button icon="pi pi-pencil" className="p-button-rounded p-button-warning" tooltip="Editar"
                                onClick={() => {
                                    localStorage.setItem("campanhaId", rowData.id);
                                    navigate("/nova-campanha/dados");
                                }} />
                            <Button icon="pi pi-send" className="p-button-rounded p-button-secondary" tooltip="Iniciar Campanha" 
                                onClick={() => 
                                enviarViaZapi(rowData.id)}
                             />
                            <Button icon="pi pi-pause" className="p-button-rounded p-button-warning" tooltip="Pausar Campanha" 
                                onClick={() => 
                                pausarCampanhazapi(rowData.id)} 
                            />
                            
                        </div>
                    )}
                    style={{ minWidth: '14rem' }} />

            </DataTable>
        </div>
    );
}