import React, { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Chart } from 'primereact/chart';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { TabView, TabPanel } from 'primereact/tabview';
import { Badge } from 'primereact/badge';
import { Toast } from 'primereact/toast';
import { Dialog } from 'primereact/dialog';
import { Timeline } from 'primereact/timeline';
import { Tooltip } from 'primereact/tooltip';
import '../styles/monitoramento.css';

export default function Monitoramento() {
    const [dashboardData, setDashboardData] = useState(null);
    const [realtimeStats, setRealtimeStats] = useState(null);
    const [selectedCampaign, setSelectedCampaign] = useState(null);
    const [campaignLogs, setCampaignLogs] = useState(null);
    const [loading, setLoading] = useState(false);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [showLogsDialog, setShowLogsDialog] = useState(false);
    
    const toast = useRef(null);
    const refreshInterval = useRef(null);

    // Buscar dados do dashboard
    const fetchDashboard = async () => {
        try {
            const res = await api.get('monitor/dashboard/');
            setDashboardData(res.data);
        } catch (err) {
            console.error('Erro ao buscar dashboard:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Erro ao carregar dashboard',
                life: 3000
            });
        }
    };

    // Buscar estatísticas em tempo real
    const fetchRealtimeStats = async () => {
        try {
            const res = await api.get('monitor/realtime/');
            setRealtimeStats(res.data);
        } catch (err) {
            console.error('Erro ao buscar stats:', err);
        }
    };

    // Buscar logs de uma campanha
    const fetchCampaignLogs = async (campanhaId) => {
        try {
            setLoading(true);
            const res = await api.get(`monitor/logs/${campanhaId}/`);
            setCampaignLogs(res.data);
            setSelectedCampaign(campanhaId);
            setShowLogsDialog(true);
        } catch (err) {
            console.error('Erro ao buscar logs:', err);
            toast.current?.show({
                severity: 'error',
                summary: 'Erro',
                detail: 'Erro ao carregar logs',
                life: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    // Auto refresh
    useEffect(() => {
        fetchDashboard();
        fetchRealtimeStats();

        if (autoRefresh) {
            refreshInterval.current = setInterval(() => {
                fetchDashboard();
                fetchRealtimeStats();
            }, 5000); // Atualiza a cada 5 segundos
        }

        return () => {
            if (refreshInterval.current) {
                clearInterval(refreshInterval.current);
            }
        };
    }, [autoRefresh]);

    // Template de status
    const statusTemplate = (rowData) => {
        const { running, paused } = rowData.cache_status;
        
        if (paused) {
            return <Tag severity="warning" value="⏸️ Pausada" />;
        } else if (running) {
            return <Tag severity="success" value="🚀 Rodando" />;
        } else {
            return <Tag severity="secondary" value="⏹️ Parada" />;
        }
    };

    // Template de health
    const healthTemplate = (rowData) => {
        const health = rowData.health;
        
        if (health.healthy) {
            return <Badge value="✅" severity="success" size="large" />;
        } else {
            return (
                <div>
                    <Badge value="⚠️" severity="danger" size="large" />
                    <Tooltip target=".health-issues" />
                    <i 
                        className="pi pi-info-circle health-issues ml-2" 
                        data-pr-tooltip={health.issues?.join('\n')}
                        style={{ cursor: 'pointer' }}
                    />
                </div>
            );
        }
    };

    // Template de progresso
    const progressTemplate = (rowData) => {
        const { total, enviadas } = rowData.mensagens;
        const percentage = total > 0 ? Math.round((enviadas / total) * 100) : 0;
        
        return (
            <div>
                <ProgressBar 
                    value={percentage} 
                    showValue={false}
                    style={{ height: '6px' }}
                />
                <small>{enviadas}/{total} ({percentage}%)</small>
            </div>
        );
    };

    // Template de taxa de envio
    const taxaEnvioTemplate = (rowData) => {
        const taxa = rowData.taxa_envio_5min;
        const severity = taxa > 10 ? 'success' : taxa > 0 ? 'warning' : 'secondary';
        
        return <Badge value={`${taxa}/5min`} severity={severity} />;
    };

    // Template de ações
    const actionsTemplate = (rowData) => {
        return (
            <Button 
                icon="pi pi-eye" 
                className="p-button-rounded p-button-text"
                tooltip="Ver logs detalhados"
                onClick={() => fetchCampaignLogs(rowData.id)}
            />
        );
    };

    // Gráfico de taxa de envio
    const getRateChart = () => {
        if (!campaignLogs?.taxa_envio_minuto) return null;

        const data = {
            labels: campaignLogs.taxa_envio_minuto.slice(0, 30).reverse().map(d => `${d.minuto}m`),
            datasets: [{
                label: 'Mensagens/min',
                data: campaignLogs.taxa_envio_minuto.slice(0, 30).reverse().map(d => d.enviadas),
                borderColor: '#00D4FF',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(0, 212, 255, 0.1)'
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: { beginAtZero: true }
            }
        };

        return <Chart type="line" data={data} options={options} style={{ height: '200px' }} />;
    };

    // Timeline de mensagens
    const messageTimeline = () => {
        if (!campaignLogs?.ultimas_mensagens) return null;

        const events = campaignLogs.ultimas_mensagens.slice(0, 10).map(msg => ({
            status: msg.enviado ? '✅ Enviada' : '❌ Erro',
            date: new Date(msg.data_envio).toLocaleString('pt-BR'),
            icon: msg.enviado ? 'pi pi-check' : 'pi pi-times',
            color: msg.enviado ? '#22C55E' : '#EF4444',
            telefone: msg.telefone,
            erro: msg.erro_envio
        }));

        const customContent = (item) => (
            <Card className="timeline-card">
                <div className="flex justify-content-between align-items-center">
                    <div>
                        <div className="font-bold">{item.status}</div>
                        <div className="text-sm">{item.telefone}</div>
                        {item.erro && <div className="text-sm text-red-500">{item.erro}</div>}
                    </div>
                    <div className="text-sm text-500">{item.date}</div>
                </div>
            </Card>
        );

        return <Timeline value={events} content={customContent} />;
    };

    if (!dashboardData) {
        return <div className="flex justify-content-center p-5">
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
        </div>;
    }

    return (
        <div className="monitoramento-container">
            <Toast ref={toast} />

            {/* Header */}
            <div className="monitor-header">
                <div>
                    <h1>🎯 Centro de Monitoramento</h1>
                    <p>Acompanhe suas campanhas em tempo real</p>
                </div>
                <div className="flex gap-2">
                    <Button 
                        label={autoRefresh ? "⏸️ Pausar" : "▶️ Retomar"} 
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        className="p-button-outlined"
                    />
                    <Button 
                        icon="pi pi-refresh" 
                        onClick={() => {
                            fetchDashboard();
                            fetchRealtimeStats();
                        }}
                        tooltip="Atualizar agora"
                    />
                </div>
            </div>

            {/* Cards de resumo */}
            <div className="stats-grid">
                <Card className="stat-card">
                    <div className="stat-content">
                        <i className="pi pi-send stat-icon" style={{ color: '#00D4FF' }}></i>
                        <div>
                            <div className="stat-value">{dashboardData.resumo.ativas}</div>
                            <div className="stat-label">Ativas</div>
                        </div>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-content">
                        <i className="pi pi-pause stat-icon" style={{ color: '#FFA726' }}></i>
                        <div>
                            <div className="stat-value">{dashboardData.resumo.pausadas}</div>
                            <div className="stat-label">Pausadas</div>
                        </div>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-content">
                        <i className="pi pi-exclamation-triangle stat-icon" style={{ color: '#EF4444' }}></i>
                        <div>
                            <div className="stat-value">{dashboardData.resumo.com_problemas}</div>
                            <div className="stat-label">Problemas</div>
                        </div>
                    </div>
                </Card>

                <Card className="stat-card">
                    <div className="stat-content">
                        <i className="pi pi-bolt stat-icon" style={{ color: '#22C55E' }}></i>
                        <div>
                            <div className="stat-value">{dashboardData.resumo.threads_ativas}</div>
                            <div className="stat-label">Threads</div>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Stats em tempo real */}
            {realtimeStats && (
                <Card className="realtime-card">
                    <h3>📊 Atividade em Tempo Real</h3>
                    <div className="realtime-stats">
                        <div className="stat-item">
                            <span className="label">Últimos 5 min:</span>
                            <Badge value={`${realtimeStats.ultimos_5min.total_enviadas} enviadas`} severity="info" />
                            {realtimeStats.ultimos_5min.total_erros > 0 && (
                                <Badge value={`${realtimeStats.ultimos_5min.total_erros} erros`} severity="danger" className="ml-2" />
                            )}
                        </div>
                        <div className="stat-item">
                            <span className="label">Última hora:</span>
                            <Badge value={`${realtimeStats.ultima_hora.total_enviadas} enviadas`} severity="success" />
                        </div>
                    </div>
                </Card>
            )}

            {/* Tabela de campanhas */}
            <Card className="campaigns-table-card">
                <h3>🚀 Campanhas Monitoradas</h3>
                <DataTable 
                    value={dashboardData.campanhas} 
                    paginator 
                    rows={10}
                    className="monitor-table"
                    emptyMessage="Nenhuma campanha em execução"
                >
                    <Column field="nome" header="Campanha" style={{ minWidth: '200px' }} />
                    <Column header="Status" body={statusTemplate} style={{ width: '120px' }} />
                    <Column header="Saúde" body={healthTemplate} style={{ width: '80px' }} />
                    <Column header="Progresso" body={progressTemplate} style={{ minWidth: '150px' }} />
                    <Column header="Taxa" body={taxaEnvioTemplate} style={{ width: '100px' }} />
                    <Column field="cache_status.uptime" header="Uptime" style={{ width: '100px' }} />
                    <Column header="Ações" body={actionsTemplate} style={{ width: '80px' }} />
                </DataTable>
            </Card>

            {/* Dialog de logs */}
            <Dialog 
                visible={showLogsDialog} 
                onHide={() => setShowLogsDialog(false)}
                header={`📋 Logs Detalhados - Campanha #${selectedCampaign}`}
                style={{ width: '80vw' }}
                maximizable
            >
                {campaignLogs && (
                    <TabView>
                        <TabPanel header="📈 Taxa de Envio">
                            {getRateChart()}
                        </TabPanel>
                        <TabPanel header="📜 Últimas Mensagens">
                            {messageTimeline()}
                        </TabPanel>
                        <TabPanel header="ℹ️ Status">
                            <div className="status-details">
                                <div className="detail-item">
                                    <strong>Heartbeat Count:</strong> {campaignLogs.status_atual.heartbeat_count || 0}
                                </div>
                                <div className="detail-item">
                                    <strong>Último Heartbeat:</strong> {campaignLogs.status_atual.last_heartbeat ? new Date(campaignLogs.status_atual.last_heartbeat).toLocaleString('pt-BR') : 'N/A'}
                                </div>
                                <div className="detail-item">
                                    <strong>Processo ID:</strong> {campaignLogs.status_atual.processo_id || 'N/A'}
                                </div>
                                {campaignLogs.health.issues && campaignLogs.health.issues.length > 0 && (
                                    <div className="detail-item">
                                        <strong>Problemas:</strong>
                                        <ul>
                                            {campaignLogs.health.issues.map((issue, idx) => (
                                                <li key={idx} className="text-orange-500">{issue}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </TabPanel>
                    </TabView>
                )}
            </Dialog>
        </div>
    );
}