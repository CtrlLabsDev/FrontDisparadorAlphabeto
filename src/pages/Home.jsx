// Home.jsx - Versão com Date Picker HTML Nativo (Mais Confiável)
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { useState, useEffect, useRef, useCallback } from "react";
import { Tooltip } from "primereact/tooltip";
import { PrimeIcons } from 'primereact/api';
import api from "../services/api";
import "../styles/home.css";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';

export default function Home() {
  const chartRef = useRef(null);
  
  // Estados principais
  const [periodoSelecionado, setPeriodoSelecionado] = useState("7 days");
  const [campanhasAtivas, setCampanhasAtivas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Estados para dados
  const [dadosResumo, setDadosResumo] = useState({
    total: 0, enviadas: 0, aguardando: 0, com_erro: 0, 
    variacao: { total: 0, enviadas: 0, aguardando: 0, com_erro: 0 }
  });
  
  const [dadosCardsPrincipais, setDadosCardsPrincipais] = useState({
    mensagens_enviadas: 0, clicks: 0, 
    variacao: { mensagens_enviadas: 0, clicks: 0 }
  });
  
  const [dadosGrafico, setDadosGrafico] = useState({ 
    labels: [], datasets: [] 
  });
  
  const [dadosReceitaConversao, setDadosReceitaConversao] = useState({
    receita: 0, pedidos: 0, 
    variacao: { receita: 0, pedidos: 0 }
  });
  
  // Estados para date picker (SIMPLIFICADO)
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDataInicio, setTempDataInicio] = useState("");
  const [tempDataFim, setTempDataFim] = useState("");

  // Função para obter parâmetro de período
  const getPeriodoParam = useCallback(() => {
    if (periodoSelecionado === "custom") {
      if (dataInicio && dataFim) {
        return `custom&inicio=${dataInicio}&fim=${dataFim}`;
      }
      return "7 days"; // Fallback
    }
    return periodoSelecionado;
  }, [periodoSelecionado, dataInicio, dataFim]);

  // Função para carregar todos os dados
  const carregarDados = useCallback(async () => {
    const periodoParam = getPeriodoParam();
    console.log('🔄 Carregando dados com período:', periodoParam);

    setIsLoading(true);
    
    try {
      // Carregar dados em paralelo
      const [
        kpisResponse,
        receitaResponse,
        campanhasResponse,
        cardsResponse,
        graficoResponse
      ] = await Promise.allSettled([
        api.get(`dashboard-kpis/?periodo=${periodoParam}`),
        api.get(`dashboard-receita-conversao/?periodo=${periodoParam}`),
        api.get('campanhas-ativas-dashboard/'),
        api.get(`dados-cards-principais/?periodo=${periodoParam}`),
        api.get(`mensagens-por-dia/?periodo=${periodoParam}`)
      ]);

      // Processar respostas (mesmo código anterior)
      if (kpisResponse.status === 'fulfilled') {
        const data = kpisResponse.value.data;
        const variacao = data.variacao || { total: 0, enviadas: 0, aguardando: 0, com_erro: 0 };
        setDadosResumo({
          total: data.total || 0,
          enviadas: data.enviadas || 0,
          aguardando: data.aguardando || 0,
          com_erro: data.com_erro || 0,
          variacao
        });
      }

      if (receitaResponse.status === 'fulfilled') {
        setDadosReceitaConversao(receitaResponse.value.data);
      }

      if (campanhasResponse.status === 'fulfilled') {
        setCampanhasAtivas(campanhasResponse.value.data);
      }

      if (cardsResponse.status === 'fulfilled') {
        const data = cardsResponse.value.data;
        const variacao = data.variacao || { mensagens_enviadas: 0, clicks: 0 };
        setDadosCardsPrincipais({
          mensagens_enviadas: data.mensagens_enviadas || 0,
          clicks: data.clicks || 0,
          variacao
        });
      }

      if (graficoResponse.status === 'fulfilled') {
        const data = graficoResponse.value.data;
        setDadosGrafico({
          labels: data.labels || [],
          datasets: [
            {
              type: 'line',
              label: "Receita por Dia (R$)",
              data: data.receitas || [],
              borderColor: "#10B981",
              backgroundColor: "rgba(16, 185, 129, 0.2)",
              tension: 0.4,
              yAxisID: 'y1',
              borderWidth: 3,
              order: 1,
              fill: true
            },
            {
              type: 'bar',
              label: "Mensagens por Dia",
              backgroundColor: "rgba(99, 102, 241, 0.8)",
              data: data.mensagens || [],
              borderRadius: 8,
              barThickness: 'flex',
              maxBarThickness: 50,
              order: 2
            }
          ]
        });
      }

    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getPeriodoParam]);

  // Efeito para carregar dados
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Opções do gráfico
  const opcoesBarra = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { family: 'Inter', size: 12, weight: 500 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(99, 102, 241, 0.5)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            if (context.datasetIndex === 0) {
              return `Receita: R$ ${context.raw.toLocaleString('pt-BR')}`;
            } else {
              return `Mensagens: ${context.raw.toLocaleString('pt-BR')}`;
            }
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { font: { family: 'Inter', size: 11 } }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: { display: true, text: 'Mensagens', font: { family: 'Inter', size: 12, weight: 600 } },
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { font: { family: 'Inter', size: 11 } }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        title: { display: true, text: 'Receita (R$)', font: { family: 'Inter', size: 12, weight: 600 } },
        ticks: {
          callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`,
          font: { family: 'Inter', size: 11 }
        }
      }
    }
  };

  // Funções utilitárias
  const getVariacaoColor = (valor) => valor > 0 ? "#10b981" : valor < 0 ? "#ef4444" : "#6b7280";
  const getVariacaoBackground = (valor) => valor > 0 ? "rgba(16, 185, 129, 0.1)" : valor < 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(107, 114, 128, 0.1)";
  const formatarNumero = (numero) => new Intl.NumberFormat('pt-BR').format(numero || 0);
  const formatarMoeda = (valor) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);

  // Tooltips
  const kpiDescriptions = {
    enviadas: "Número de mensagens enviadas com sucesso no período selecionado",
    clicks: "Número total de cliques registrados nas mensagens enviadas",
    receita: "Valor total em vendas rastreadas no período",
    conversao: "Percentual de conversão baseado em mensagens enviadas vs pedidos"
  };

  // Templates para tabela
  const statusBodyTemplate = (rowData) => {
    const statusMap = {
      agendada: { color: 'info', label: 'Agendada', icon: '🕐' },
      pausada: { color: 'secondary', label: 'Pausada', icon: '⏸️' },
      emexecucao: { color: 'warning', label: 'Em Execução', icon: '🚀' },
      finalizada: { color: 'success', label: 'Finalizada', icon: '✅' },
    };
    const { color, label, icon } = statusMap[rowData.status] || { color: 'secondary', label: 'Desconhecido', icon: '❓' };
    return <Tag value={`${icon} ${label}`} severity={color} style={{ fontWeight: 500 }} />;
  };

  const progressBodyTemplate = (rowData) => {
    const progresso = rowData.concluido != null ? (rowData.concluido * 100).toFixed(1) : 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressBar 
          value={progresso} 
          style={{ height: '8px', flex: 1 }}
          color={progresso === 100 ? '#10b981' : '#6366f1'}
        />
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>{progresso}%</span>
      </div>
    );
  };

  // Funções do Date Picker (SIMPLIFICADAS)
  const handlePeriodoPersonalizado = () => {
    setShowDatePicker(true);
    setTempDataInicio(dataInicio);
    setTempDataFim(dataFim);
  };

  const aplicarPeriodoPersonalizado = () => {
    if (tempDataInicio && tempDataFim) {
      setDataInicio(tempDataInicio);
      setDataFim(tempDataFim);
      setPeriodoSelecionado("custom");
      console.log('📅 Período aplicado:', { inicio: tempDataInicio, fim: tempDataFim });
    }
    setShowDatePicker(false);
  };

  const cancelarPeriodoPersonalizado = () => {
    setTempDataInicio(dataInicio);
    setTempDataFim(dataFim);
    setShowDatePicker(false);
  };

  const handlePeriodoChange = (novoPeriodo) => {
    console.log('📅 Mudando período para:', novoPeriodo);
    setPeriodoSelecionado(novoPeriodo);
    if (novoPeriodo !== "custom") {
      setDataInicio("");
      setDataFim("");
    }
  };

  // Função para formatar data para exibição
  const formatarDataExibicao = (dataString) => {
    if (!dataString) return '';
    const data = new Date(dataString + 'T00:00:00');
    return data.toLocaleDateString('pt-BR');
  };

  // Loading component
  const LoadingCard = () => (
    <Card className="dashboard-card loading-shimmer">
      <div style={{ height: '80px' }}></div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="home-wrapper">
        <div className="home-header">
          <h2>📊 Resumo das Campanhas</h2>
          <div className="periodo-filter">
            <div className="loading-shimmer" style={{ width: '200px', height: '40px', borderRadius: '16px' }}></div>
          </div>
        </div>
        <div className="dashboard-cards">
          {[1, 2, 3, 4].map(i => <LoadingCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="home-wrapper">
      {/* HEADER */}
      <div className="home-header">
        <h2>📊 Resumo das Campanhas</h2>
        
        {/* Filtro de Período */}
        <div className="periodo-filter">
          <button 
            className={`periodo-btn ${periodoSelecionado === "today" ? "active" : ""}`} 
            onClick={() => handlePeriodoChange("today")}
          >
            📅 Hoje
          </button>
          <button 
            className={`periodo-btn ${periodoSelecionado === "7 days" ? "active" : ""}`} 
            onClick={() => handlePeriodoChange("7 days")}
          >
            📊 7 Dias
          </button>
          <button 
            className={`periodo-btn ${periodoSelecionado === "30 days" ? "active" : ""}`} 
            onClick={() => handlePeriodoChange("30 days")}
          >
            📈 30 Dias
          </button>
          <button
            className={`periodo-btn ${periodoSelecionado === "custom" ? "active" : ""}`}
            onClick={handlePeriodoPersonalizado}
          >
            {periodoSelecionado === "custom" && dataInicio && dataFim
              ? `🗓️ ${formatarDataExibicao(dataInicio)} - ${formatarDataExibicao(dataFim)}`
              : "🗓️ Personalizado"}
          </button>
        </div>

        {/* Date Picker Modal MELHORADO */}
        {showDatePicker && (
          <div className="date-picker-overlay" onClick={cancelarPeriodoPersonalizado}>
            <div className="date-picker-modal" onClick={(e) => e.stopPropagation()}>
              <h4>🗓️ Selecionar Período Personalizado</h4>
              
              <div className="date-picker-content">
                <div className="date-input-group">
                  <label>📅 Data Inicial</label>
                  <input
                    type="date"
                    value={tempDataInicio}
                    onChange={(e) => setTempDataInicio(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="date-input"
                    placeholder="Selecione a data inicial"
                  />
                  {tempDataInicio && (
                    <small style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 500 }}>
                      ✓ {new Date(tempDataInicio + 'T00:00:00').toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </small>
                  )}
                </div>
                
                <div className="date-input-group">
                  <label>📅 Data Final</label>
                  <input
                    type="date"
                    value={tempDataFim}
                    onChange={(e) => setTempDataFim(e.target.value)}
                    min={tempDataInicio}
                    max={new Date().toISOString().split('T')[0]}
                    className="date-input"
                    placeholder="Selecione a data final"
                    disabled={!tempDataInicio}
                  />
                  {tempDataFim && (
                    <small style={{ color: '#6366f1', fontSize: '0.8rem', fontWeight: 500 }}>
                      ✓ {new Date(tempDataFim + 'T00:00:00').toLocaleDateString('pt-BR', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </small>
                  )}
                </div>
              </div>

              {/* Preview do período selecionado */}
              {tempDataInicio && tempDataFim && (
                <div style={{
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
                  padding: '1rem',
                  borderRadius: '12px',
                  marginBottom: '1.5rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <div style={{ textAlign: 'center', color: '#4f46e5', fontWeight: 600 }}>
                    📊 Período Selecionado
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.9rem', color: '#6b7280' }}>
                    {(() => {
                      const inicio = new Date(tempDataInicio + 'T00:00:00');
                      const fim = new Date(tempDataFim + 'T00:00:00');
                      const diffTime = Math.abs(fim - inicio);
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                      return `${diffDays} dia${diffDays > 1 ? 's' : ''} de dados`;
                    })()}
                  </div>
                </div>
              )}

              <div className="date-picker-actions">
                <button className="btn-secondary" onClick={cancelarPeriodoPersonalizado}>
                  ✕ Cancelar
                </button>
                <button 
                  className="btn-primary" 
                  onClick={aplicarPeriodoPersonalizado}
                  disabled={!tempDataInicio || !tempDataFim}
                >
                  ✓ Aplicar Período
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cards Principais */}
      <div className="dashboard-cards">
        {/* Card Mensagens Enviadas */}
        <Card className="dashboard-card">
          <div className="card-header">
            <div className="card-title-container">
              <span className="card-title">📤 Enviadas</span>
              <span className="card-info" id="enviadas-info">
                <i className={PrimeIcons.INFO_CIRCLE}></i>
              </span>
              <Tooltip target="#enviadas-info" position="top">
                {kpiDescriptions.enviadas}
              </Tooltip>
            </div>
            <div 
              className="variacao-badge"
              style={{ 
                backgroundColor: getVariacaoBackground(dadosCardsPrincipais.variacao.mensagens_enviadas),
                color: getVariacaoColor(dadosCardsPrincipais.variacao.mensagens_enviadas)
              }}
            >
              {dadosCardsPrincipais.variacao.mensagens_enviadas > 0 ? "↗️ +" : dadosCardsPrincipais.variacao.mensagens_enviadas < 0 ? "↘️ " : "➡️ "}
              {Math.abs(dadosCardsPrincipais.variacao.mensagens_enviadas).toFixed(1)}%
            </div>
          </div>
          <div className="card-value">{formatarNumero(dadosCardsPrincipais.mensagens_enviadas)}</div>
        </Card>
        
        {/* Card Clicks */}
        <Card className="dashboard-card">
          <div className="card-header">
            <div className="card-title-container">
              <span className="card-title">👆 Clicks</span>
              <span className="card-info" id="clicks-info">
                <i className={PrimeIcons.INFO_CIRCLE}></i>
              </span>
              <Tooltip target="#clicks-info" position="top">
                {kpiDescriptions.clicks}
              </Tooltip>
            </div>
            <div 
              className="variacao-badge"
              style={{ 
                backgroundColor: getVariacaoBackground(dadosCardsPrincipais.variacao.clicks),
                color: getVariacaoColor(dadosCardsPrincipais.variacao.clicks)
              }}
            >
              {dadosCardsPrincipais.variacao.clicks > 0 ? "↗️ +" : dadosCardsPrincipais.variacao.clicks < 0 ? "↘️ " : "➡️ "}
              {Math.abs(dadosCardsPrincipais.variacao.clicks).toFixed(1)}%
            </div>
          </div>
          <div className="card-value">{formatarNumero(dadosCardsPrincipais.clicks)}</div>
        </Card>
        
        {/* Card Receita */}
        <Card className="dashboard-card">
          <div className="card-header">
            <div className="card-title-container">
              <span className="card-title">💰 Receita</span>
              <span className="card-info" id="receita-info">
                <i className={PrimeIcons.INFO_CIRCLE}></i>
              </span>
              <Tooltip target="#receita-info" position="top">
                {kpiDescriptions.receita}
              </Tooltip>
            </div>
            <div
              className="variacao-badge"
              style={{
                backgroundColor: getVariacaoBackground(dadosReceitaConversao.variacao.receita),
                color: getVariacaoColor(dadosReceitaConversao.variacao.receita),
              }}
            >
              {dadosReceitaConversao.variacao.receita > 0 ? "↗️ +" : dadosReceitaConversao.variacao.receita < 0 ? "↘️ " : "➡️ "}
              {Math.abs(dadosReceitaConversao.variacao.receita).toFixed(1)}%
            </div>
          </div>
          <div className="card-value">{formatarMoeda(dadosReceitaConversao.receita)}</div>
        </Card>

        {/* Card Conversão */}
        <Card className="dashboard-card">
          <div className="card-header">
            <div className="card-title-container">
              <span className="card-title">🎯 Conversão</span>
              <span className="card-info" id="conversao-info">
                <i className={PrimeIcons.INFO_CIRCLE}></i>
              </span>
              <Tooltip target="#conversao-info" position="top">
                {kpiDescriptions.conversao}
              </Tooltip>
            </div>
            <div
              className="variacao-badge"
              style={{
                backgroundColor: getVariacaoBackground(dadosReceitaConversao.variacao.pedidos),
                color: getVariacaoColor(dadosReceitaConversao.variacao.pedidos),
              }}
            >
              {dadosReceitaConversao.variacao.pedidos > 0 ? "↗️ +" : dadosReceitaConversao.variacao.pedidos < 0 ? "↘️ " : "➡️ "}
              {Math.abs(dadosReceitaConversao.variacao.pedidos).toFixed(1)}%
            </div>
          </div>
          <div className="card-value">
            {dadosCardsPrincipais.mensagens_enviadas > 0
              ? ((dadosReceitaConversao.pedidos / dadosCardsPrincipais.mensagens_enviadas) * 100).toFixed(1) + "%"
              : "0%"}
          </div>
        </Card>
      </div>

      {/* Gráfico Principal */}
      <Card className="chart-card-full">
        <div className="chart-header">
          <h3>📊 Mensagens × Receita por Dia</h3>
        </div>
        <div className="chart-wrapper">
          <Chart
            ref={chartRef}
            type="bar"
            data={dadosGrafico}
            options={opcoesBarra}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </Card>

      {/* Tabela de Campanhas Ativas */}
      <Card className="mt-4">
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🚀 Campanhas Ativas
          </h3>
        </div>
        <DataTable 
          value={campanhasAtivas} 
          paginator 
          rows={5} 
          responsiveLayout="scroll"
          emptyMessage="Nenhuma campanha ativa encontrada"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Mostrando {first} a {last} de {totalRecords} campanhas"
        >
          <Column field="campanha" header="📋 Campanha" sortable />
          <Column field="status" header="📊 Status" body={statusBodyTemplate} sortable />
          <Column field="total_mensagem" header="📤 Total" sortable body={(data) => formatarNumero(data.total_mensagem)} />
          <Column field="enviado" header="✅ Enviadas" sortable body={(data) => formatarNumero(data.enviado)} />
          <Column field="erro" header="❌ Erros" sortable body={(data) => formatarNumero(data.erro)} />
          <Column header="📈 Progresso" body={progressBodyTemplate} sortable sortField="concluido" />
        </DataTable>
      </Card>

      {/* Cards Extras */}
      <div className="dashboard-extras">
        {/* Taxa de Entrega */}
        <Card className="chart-card">
          <h3>📊 Taxa de Entrega</h3>
          <div className="chart-with-center">
            <Chart
              type="doughnut"
              data={{
                labels: ["✅ Entregues", "❌ Não Entregues"],
                datasets: [{
                  data: [dadosResumo.enviadas, dadosResumo.total - dadosResumo.enviadas],
                  backgroundColor: ["#10b981", "#f59e0b"],
                  borderWidth: 0,
                  cutout: '70%'
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    display: true, 
                    position: 'bottom',
                    labels: { usePointStyle: true, padding: 15, font: { family: 'Inter', size: 12 } }
                  },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `${ctx.label}: ${formatarNumero(ctx.raw)} mensagens`,
                    },
                  },
                },
              }}
            />
            <div className="chart-center-overlay">
              <span style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                {(dadosResumo.total > 0 ? (dadosResumo.enviadas / dadosResumo.total) * 100 : 0).toFixed(1)}%
              </span>
            </div>
          </div>
        </Card>

        {/* Média de Envio por Dia */}
        <Card className="chart-card">
          <div className="chart-media-envio">
            <h3>📈 Média Diária</h3>
            <i className="pi pi-send chart-icon"></i>
          </div>
          <div className="chart-center-large">
            {formatarNumero(Math.round(
              (dadosGrafico.datasets[1]?.data.reduce((acc, val) => acc + val, 0) || 0) /
              (dadosGrafico.datasets[1]?.data.length || 1)
            ))}
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem' }}>
            mensagens por dia
          </div>
        </Card>
      </div>
    </div>
  );
}