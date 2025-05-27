// Home.jsx - Com gráfico melhorado
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { useState, useEffect, useRef } from "react";
import { Tooltip } from "primereact/tooltip";
import { PrimeIcons } from 'primereact/api';
import api from "../services/api";
import "../styles/home.css";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';
import { useCallback } from "react"; // já deve estar importado
import { Calendar } from 'primereact/calendar';
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css'; // estilo base
import 'react-date-range/dist/theme/default.css'; // tema




export default function Home() {
  const chartRef = useRef(null);
  // Estado para o período
  const [periodoSelecionado, setPeriodoSelecionado] = useState("7 days");
  const [campanhasAtivas, setCampanhasAtivas] = useState([]);
  // Estado para os dados tradicionais
  const [dadosResumo, setDadosResumo] = useState({
    total: 0, enviadas: 0, aguardando: 0, com_erro: 0, variacao: { total: 0, enviadas: 0, aguardando: 0, com_erro: 0}});
  // Estado para os dados dos cards principais
  const [dadosCardsPrincipais, setDadosCardsPrincipais] = useState({
    mensagens_enviadas: 0, clicks: 0, variacao: { mensagens_enviadas: 0, clicks: 0}});
  const [dadosGrafico, setDadosGrafico] = useState({ labels: [], datasets: [],});
  const [dadosReceitaConversao, setDadosReceitaConversao] = useState({
    receita: 0, pedidos: 0, variacao: { receita: 0, pedidos: 0,},});
    const [dataInicio, setDataInicio] = useState(null);
    const [dataFim, setDataFim] = useState(null);

      const getPeriodoParam = useCallback(() => {
      if (periodoSelecionado === "custom") {
        if (dataInicio && dataFim) {
          return `custom&inicio=${dataInicio.toISOString().slice(0, 10)}&fim=${dataFim.toISOString().slice(0, 10)}`;
        }
        return null; // evita undefined
      }
      return periodoSelecionado;
    }, [periodoSelecionado, dataInicio, dataFim]);


    const [showRange, setShowRange] = useState(false);
    const [range, setRange] = useState([
      {
        startDate: new Date(),
        endDate: new Date(),
        key: 'selection',
      },
    ]);

    
  
    
      
  // Efeito para buscar KPIs
  useEffect(() => {
    // Buscar dados do KPI
    api.get(`dashboard-kpis/?periodo=${getPeriodoParam()}`)
      .then((res) => {
        // Verificar se a API retornou dados de variação
        const variacao = res.data.variacao || {
          total: 0.00,
          enviadas: 0.00,
          aguardando: 0.00,
          com_erro: 0.00
        };
        
        setDadosResumo({
          total: res.data.total || 0,
          enviadas: res.data.enviadas || 0,
          aguardando: res.data.aguardando || 0,
          com_erro: res.data.com_erro || 0,
          variacao: variacao
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar dashboard KPIs:", err);
        // Definir valores padrão em caso de erro
        setDadosResumo({
          total: 0,
          enviadas: 0,
          aguardando: 0,
          com_erro: 0,
          variacao: {
            total: 0.00,
            enviadas: 0.00,
            aguardando: 0.00,
            com_erro: 0.00
          }
        });
      }, [getPeriodoParam]);

    // Buscar dados de receita e conversão
    api.get(`dashboard-receita-conversao/?periodo=${getPeriodoParam()}`)
      .then((res) => {
        setDadosReceitaConversao(res.data);
      })
      .catch((err) => {
        console.error("Erro ao carregar dados de receita e conversão:", err);
        setDadosReceitaConversao({
          receita: 0,
          pedidos: 0,
          variacao: {
            receita: 0,
            pedidos: 0,
          },
        });
      });

    // Buscar campanhas ativas
    api.get('campanhas-ativas-dashboard/')
      .then(res => {
        setCampanhasAtivas(res.data);
      })
      .catch(err => {
        console.error('Erro ao carregar campanhas ativas:', err);
      });
      
    // Nova chamada para os dados dos cards principais
    api.get(`dados-cards-principais/?periodo=${getPeriodoParam()}`)
      .then((res) => {
        // Verificar se a API retornou dados de variação
        const variacao = res.data.variacao || {
          mensagens_enviadas: +20806.67,
          clicks: 0.00
        };
        
        setDadosCardsPrincipais({
          mensagens_enviadas: res.data.mensagens_enviadas || 0,
          clicks: res.data.clicks || 0,
          variacao: variacao
        });
      })
      .catch((err) => {
        console.error("Erro ao carregar dados dos cards principais:", err);
        // Definir valores padrão para evitar erros de UI
        setDadosCardsPrincipais({
          mensagens_enviadas: 0,
          clicks: 0,
          variacao: {
            mensagens_enviadas: +20806.67,
            clicks: 0.00
          }
        });
      });

      const periodoParam = getPeriodoParam();
      if (!periodoParam) return;
      


  }, [getPeriodoParam, periodoSelecionado, dataInicio, dataFim]);




  // Efeito para buscar dados do gráfico
  useEffect(() => {
    api.get(`mensagens-por-dia/?periodo=${getPeriodoParam()}`)
  .then((res) => {
    setDadosGrafico({
      labels: res.data.labels,
      datasets: [
        {
          type: 'line',
          label: "Receita por Dia (R$)",
          data: res.data.receitas,
          borderColor: "#10B981",
          backgroundColor: "rgba(16, 185, 129, 0.2)",
          tension: 0.5,
          yAxisID: 'y1',
          borderWidth: 4,
          order: 1
        },
        {
          type: 'bar',
          label: "Mensagens por Dia",
          backgroundColor: "#6366F1",
          data: res.data.mensagens,
          borderRadius: 6,
          barThickness: 40,
          order: 2
        }
        
      ]      
    });
  });
  }, [getPeriodoParam]);
  

  // Opções melhoradas para o gráfico
  const opcoesBarra = {
    responsive: true,
    maintainAspectRatio: false,
    layout: {
      padding: 0, // ✅ Remove padding interno
    },
    plugins: {
      legend: {
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        title: {
          display: true,
          text: 'Mensagens'
        }      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false
        },
        title: {
          display: true,
          text: 'Receita (R$)'
        },
        ticks: {
          callback: (value) => `R$ ${value.toLocaleString('pt-BR')}`
        }}
    }
  };
  
  
  // Função para obter a cor do badge de variação
  const getVariacaoColor = (valor) => {
    if (valor > 0) return "var(--green-500)";
    if (valor < 0) return "var(--red-500)";
    return "var(--gray-500)";
  };

  // Função para obter o background do badge de variação
  const getVariacaoBackground = (valor) => {
    if (valor > 0) return "rgba(34, 197, 94, 0.1)";
    if (valor < 0) return "rgba(239, 68, 68, 0.1)";
    return "rgba(107, 114, 128, 0.1)";
  };

  // Definições dos tooltips para cada card
  const kpiDescriptions = {
    enviadas: "Número de mensagens enviadas com sucesso no período",
    clicks: "Número de cliques nas mensagens enviadas no período",
    aguardando: "Número de mensagens aguardando envio no período",
    com_erro: "Número de mensagens com erro no envio no período"
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
    <div className="home-wrapper">
      <div className="home-header">
        <h2>Resumo das Campanhas</h2>
        
        {/* Filtro de Período */}
        <div className="periodo-filter">
          <button className={`periodo-btn ${periodoSelecionado === "today" ? "active" : ""}`} onClick={() => setPeriodoSelecionado("today")}>Hoje</button>
          <button className={`periodo-btn ${periodoSelecionado === "7 days" ? "active" : ""}`} onClick={() => setPeriodoSelecionado("7 days")}>7 Dias</button>
          <button className={`periodo-btn ${periodoSelecionado === "30 days" ? "active" : ""}`} onClick={() => setPeriodoSelecionado("30 days")}>30 Dias</button>
          <button
            className={`periodo-btn ${periodoSelecionado === "custom" ? "active" : ""}`}
            onClick={() => setShowRange(true)}
          >
            {periodoSelecionado === "custom" && dataInicio && dataFim
              ? `Personalizado - ${dataInicio.toLocaleDateString('pt-BR')} até ${dataFim.toLocaleDateString('pt-BR')}`
              : "Personalizado"}
          </button>



          {showRange && (
            <div className="date-range-popup">
              <DateRangePicker
                onChange={(item) => setRange([item.selection])}
                moveRangeOnFirstSelection={false}
                ranges={range}
                months={2}
                direction="horizontal"
              />
              <div className="date-range-actions">
                <button onClick={() => setShowRange(false)}>Cancelar</button>
                <button
                  onClick={() => {
                    setDataInicio(range[0].startDate);
                    setDataFim(range[0].endDate);
                    setPeriodoSelecionado("custom");
                    setShowRange(false);
                  }}
                >
                  Aplicar
                </button>
              </div>
            </div>
          )}


        </div>

        {periodoSelecionado === "custom" && (
          <div className="periodo-display">
            <span className="periodo-label">
              Personalizado - {dataInicio?.toLocaleDateString('pt-BR')} até {dataFim?.toLocaleDateString('pt-BR')}
            </span>
          </div>
        )}


      </div>

      {/* Cards com design melhorado */}
      <div className="dashboard-cards">
        {/* Card Mensagens Enviadas */}
        <Card className="dashboard-card">
          <div className="card-header">
            <div className="card-title-container">
              <span className="card-title">Enviadas</span>
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
              {dadosCardsPrincipais.variacao.mensagens_enviadas > 0 ? "+" : ""}
              {dadosCardsPrincipais.variacao.mensagens_enviadas.toFixed(2)}%
            </div>
          </div>
          <div className="card-value">{dadosCardsPrincipais.mensagens_enviadas.toLocaleString('de-DE')}</div>
        </Card>
        
        {/* Card Clicks */}
        <Card className="dashboard-card">
          <div className="card-header">
            <div className="card-title-container">
              <span className="card-title">Clicks</span>
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
                color: getVariacaoColor(dadosCardsPrincipais.variacao.clicks.toLocaleString('de-DE'))
              }}
            >
              {dadosCardsPrincipais.variacao.clicks > 0 ? "+" : ""}
              {dadosCardsPrincipais.variacao.clicks.toFixed(2)}%
            </div>
          </div>
          <div className="card-value">{dadosCardsPrincipais.clicks}</div>
        </Card>
        
        {/* Card Receita */}
        <Card className="dashboard-card">
          <div className="card-header">
            <div className="card-title-container">
              <span className="card-title">Receita</span>
              <span className="card-info" id="receita-info">
                <i className={PrimeIcons.INFO_CIRCLE}></i>
              </span>
              <Tooltip target="#receita-info" position="top">
                Soma total das vendas no período selecionado.
              </Tooltip>
            </div>
            <div
              className="variacao-badge"
              style={{
                backgroundColor: getVariacaoBackground(dadosReceitaConversao.variacao.receita),
                color: getVariacaoColor(dadosReceitaConversao.variacao.receita),
              }}
            >
              {dadosReceitaConversao.variacao.receita > 0 ? "+" : ""}
              {dadosReceitaConversao.variacao.receita.toFixed(2)}%
            </div>
          </div>
          <div className="card-value">R$ {dadosReceitaConversao.receita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
        </Card>

        {/* Card Conversão */}
        <Card className="dashboard-card">
          <div className="card-header">
            <div className="card-title-container">
              <span className="card-title">Conversão</span>
              <span className="card-info" id="conversao-info">
                <i className={PrimeIcons.INFO_CIRCLE}></i>
              </span>
              <Tooltip target="#conversao-info" position="top">
                Quantidade de pedidos dividida pelo número de mensagens enviadas.
              </Tooltip>
            </div>
            <div
              className="variacao-badge"
              style={{
                backgroundColor: getVariacaoBackground(dadosReceitaConversao.variacao.pedidos),
                color: getVariacaoColor(dadosReceitaConversao.variacao.pedidos),
              }}
            >
              {dadosReceitaConversao.variacao.pedidos > 0 ? "+" : ""}
              {dadosReceitaConversao.variacao.pedidos.toFixed(2)}%
            </div>
          </div>
          <div className="card-value">
            {dadosCardsPrincipais.mensagens_enviadas > 0
              ? ((dadosReceitaConversao.pedidos / dadosCardsPrincipais.mensagens_enviadas) * 100).toFixed(2) + "%"
              : "0%"}
          </div>
        </Card>
      </div>

      {/* Gráfico de barras aprimorado */}
      <Card className="chart-card-full">
        <div className="chart-header">
          <h3>Mensagens x Receita por Dia</h3>
        </div>
        <div className="chart-wrapper">
        <Chart
          ref={chartRef}
          type="bar"
          data={dadosGrafico}
          options={opcoesBarra}
          style={{ width: '100%', height: '400px' }}
        />

      </div>

      </Card>

      
      {/* Tabela com as Campanhas ativas */}
      <Card className="mt-4">
          <h3>Campanhas Ativas</h3>
          <DataTable value={campanhasAtivas} paginator rows={5} responsiveLayout="scroll">
              <Column field="campanha" header="Campanha" />
              <Column field="status" header="Status" body={statusBodyTemplate} />
              <Column field="total_mensagem" header="Total Mensagens" />
              <Column field="enviado" header="Enviadas" />
              <Column field="erro" header="Erros" />
              <Column 
                header="Concluído" 
                body={(rowData) => (
                    <ProgressBar 
                        value={rowData.concluido != null ? (rowData.concluido * 100).toFixed(2) : 0} 
                        showValue 
                        style={{ height: '20px' }}
                    />
                )}
            />
          </DataTable>
      </Card>


      <div className="dashboard-extras">
        {/* Taxa de Entrega (%) */}
        <Card className="chart-card">
          <h3>Taxa de Entrega (%)</h3>
          <div className="chart-with-center">
            <Chart
              type="doughnut"
              data={{
                labels: ["Entregues", "Não Entregues"],
                datasets: [{
                  data: [dadosResumo.enviadas, dadosResumo.total - dadosResumo.enviadas],
                  backgroundColor: ["#22c55e", "#facc15"],
                }],
              }}
              options={{
                cutout: '70%',
                plugins: {
                  legend: { display: true, labels: { usePointStyle: true } },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => `${ctx.label}: ${ctx.raw} mensagens`,
                    },
                  },
                },
              }}
            />
            <div className="chart-center-overlay">
              {(dadosResumo.total > 0 ? (dadosResumo.enviadas / dadosResumo.total) * 100 : 0).toFixed(2)}%
            </div>
          </div>
        </Card>

        {/* Média de Envio por Dia */}
        <Card className="chart-card">
          <div className="chart-media-envio">
            <h3>Média de Envio por Dia</h3>
            <i className="pi pi-send chart-icon"></i>
          </div>
         
          <div className="chart-center-large">
            {(
              (dadosGrafico.datasets[0]?.data.reduce((acc, val) => acc + val, 0) || 0) /
              (dadosGrafico.datasets[0]?.data.length || 1)
            ).toFixed(0)}
          </div>
        </Card>



        </div>
      </div>

  );
}