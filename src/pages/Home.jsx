// Home.jsx - Versão Melhorada e Responsiva
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
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

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
  
  // Estados para date picker
  const [dataInicio, setDataInicio] = useState(null);
  const [dataFim, setDataFim] = useState(null);
  const [showRange, setShowRange] = useState(false);
  const [range, setRange] = useState([{
    startDate: new Date(),
    endDate: new Date(),
    key: 'selection',
  }]);

  // Função para obter parâmetro de período
  const getPeriodoParam = useCallback(() => {
    if (periodoSelecionado === "custom") {
      if (dataInicio && dataFim) {
        return `custom&inicio=${dataInicio.toISOString().slice(0, 10)}&fim=${dataFim.toISOString().slice(0, 10)}`;
      }
      return null;
    }
    return periodoSelecionado;
  }, [periodoSelecionado, dataInicio, dataFim]);

  // Função para carregar todos os dados
  const carregarDados = useCallback(async () => {
    const periodoParam = getPeriodoParam();
    if (!periodoParam) return;

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

      // Processar KPIs
      if (kpisResponse.status === 'fulfilled') {
        const variacao = kpisResponse.value.data.variacao || {
          total: 0, enviadas: 0, aguardando: 0, com_erro: 0
        };
        setDadosResumo({
          total: kpisResponse.value.data.total || 0,
          enviadas: kpisResponse.value.data.enviadas || 0,
          aguardando: kpisResponse.value.data.aguardando || 0,
          com_erro: kpisResponse.value.data.com_erro || 0,
          variacao
        });
      }

      // Processar receita
      if (receitaResponse.status === 'fulfilled') {
        setDadosReceitaConversao(receitaResponse.value.data);
      }

      // Processar campanhas
      if (campanhasResponse.status === 'fulfilled') {
        setCampanhasAtivas(campanhasResponse.value.data);
      }

      // Processar cards principais
      if (cardsResponse.status === 'fulfilled') {
        const variacao = cardsResponse.value.data.variacao || {
          mensagens_enviadas: 0, clicks: 0
        };
        setDadosCardsPrincipais({
          mensagens_enviadas: cardsResponse.value.data.mensagens_enviadas || 0,
          clicks: cardsResponse.value.data.clicks || 0,
          variacao
        });
      }

      // Processar gráfico
      if (graficoResponse.status === 'fulfilled') {
        setDadosGrafico({
          labels: graficoResponse.value.data.labels,
          datasets: [
            {
              type: 'line',
              label: "Receita por Dia (R$)",
              data: graficoResponse.value.data.receitas,
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
              data: graficoResponse.value.data.mensagens,
              borderRadius: 8,
              barThickness: 'flex',
              maxBarThickness: 50,
              order: 2
            }
          ]
        });
      }

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getPeriodoParam]);

  // Efeito para carregar dados
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Opções melhoradas para o gráfico
  const opcoesBarra = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Inter',
            size: 12,
            weight: 500
          }
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
        grid: {
          display: false
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11
          }
        }
      },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Mensagens',
          font: {
            family: 'Inter',
            size: 12,
            weight: 600
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            family: 'Inter',
            size: 11
          }
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: 'Receita (R$)',
          font: {
            family: 'Inter',
            size: 12,
            weight: 600
          }
        },
        ticks: {
          callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`,
          font: {
            family: 'Inter',
            size: 11
          }
        }
      }
    }
  };

  // Funções utilitárias
  const getVariacaoColor = (valor) => {
    if (valor > 0) return "#10b981";
    if (valor < 0) return "#ef4444";
    return "#6b7280";
  };

  const getVariacaoBackground = (valor) => {
    if (valor > 0) return "rgba(16, 185, 129, 0.1)";
    if (valor < 0) return "rgba(239, 68, 68, 0.1)";
    return "rgba(107, 114, 128, 0.1)";
  };

  const formatarNumero = (numero) => {
    return new Intl.NumberFormat('pt-BR').format(numero);
  };

  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  // Tooltips personalizados
  const kpiDescriptions = {
    enviadas: "Número de mensagens enviadas com sucesso no período selecionado",
    clicks: "Número total de cliques registrados nas mensagens enviadas",
    aguardando: "Mensagens que estão na fila aguardando processamento",
    com_erro: "Mensagens que falharam no envio por algum motivo",
    receita: "Valor total em vendas rastreadas no período",
    conversao: "Percentual de conversão baseado em mensagens enviadas vs pedidos"
  };

  // Template para status das campanhas
  const statusBodyTemplate = (rowData) => {
    const statusMap = {
      agendada: { color: 'info', label: 'Agendada', icon: '🕐' },
      pausada: { color: 'secondary', label: 'Pausada', icon: '⏸️' },
      emexecucao: { color: 'warning', label: 'Em Execução', icon: '🚀' },
      finalizada: { color: 'success', label: 'Finalizada', icon: '✅' },
    };
    const { color, label, icon } = statusMap[rowData.status] || { 
      color: 'secondary', label: 'Desconhecido', icon: '❓' 
    };
    return (
      <Tag 
        value={`${icon} ${label}`} 
        severity={color}
        style={{ fontWeight: 500 }}
      />
    );
  };

  // Template para progresso
  const progressBodyTemplate = (rowData) => {
    const progresso = rowData.concluido != null ? (rowData.concluido * 100).toFixed(1) : 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressBar 
          value={progresso} 
          style={{ height: '8px', flex: 1 }}
          color={progresso === 100 ? '#10b981' : '#6366f1'}
        />
        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
          {progresso}%
        </span>
      </div>
    );
  };

  // Função para aplicar período personalizado
  const aplicarPeriodoPersonalizado = () => {
    setDataInicio(range[0].startDate);
    setDataFim(range[0].endDate);
    setPeriodoSelecionado("custom");
    setShowRange(false);
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
          <h2>Resumo das Campanhas</h2>
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
      <div className="home-header">
        <h2>📊 Resumo das Campanhas</h2>
        
        {/* Filtro de Período Melhorado */}
        <div className="periodo-filter">
          <button 
            className={`periodo-btn ${periodoSelecionado === "today" ? "active" : ""}`} 
            onClick={() => setPeriodoSelecionado("today")}
          >
            📅 Hoje
          </button>
          <button 
            className={`periodo-btn ${periodoSelecionado === "7 days" ? "active" : ""}`} 
            onClick={() => setPeriodoSelecionado("7 days")}
          >
            📊 7 Dias
          </button>
          <button 
            className={`periodo-btn ${periodoSelecionado === "30 days" ? "active" : ""}`} 
            onClick={() => setPeriodoSelecionado("30 days")}
          >
            📈 30 Dias
          </button>
          <button
            className={`periodo-btn ${periodoSelecionado === "custom" ? "active" : ""}`}
            onClick={() => setShowRange(true)}
          >
            {periodoSelecionado === "custom" && dataInicio && dataFim
              ? `🗓️ ${dataInicio.toLocaleDateString('pt-BR')} - ${dataFim.toLocaleDateString('pt-BR')}`
              : "🗓️ Personalizado"}
          </button>

          {showRange && (
            <div className="date-range-popup">
              <DateRangePicker
                onChange={(item) => setRange([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={range}
                months={window.innerWidth > 768 ? 2 : 1}
                direction={window.innerWidth > 768 ? "horizontal" : "vertical"}
              />
              <div className="date-range-actions">
                <button onClick={() => setShowRange(false)}>
                  Cancelar
                </button>
                <button onClick={aplicarPeriodoPersonalizado}>
                  Aplicar Período
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cards Principais Melhorados */}
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

      {/* Gráfico Principal Melhorado */}
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

      {/* Tabela de Campanhas Ativas Melhorada */}
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
          <Column 
            header="📈 Progresso" 
            body={progressBodyTemplate}
            sortable
            sortField="concluido"
          />
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
                    labels: { 
                      usePointStyle: true,
                      padding: 15,
                      font: {
                        family: 'Inter',
                        size: 12
                      }
                    }
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
