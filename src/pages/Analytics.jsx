import React, { useEffect, useState } from "react";
import api from "../services/api";
import { Card } from "primereact/card";
import { Tooltip } from "primereact/tooltip";
import { PrimeIcons } from "primereact/api";
import "../styles/analytics.css";
import { MultiSelect } from "primereact/multiselect";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { ProgressBar } from "primereact/progressbar";
import { Tag } from "primereact/tag";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";


export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState({
    campanhas: 0,
    enviadas: 0,
    clicks: 0,
    percent_click: 0,
    vendas: 0,
    receita: 0,
    percent_conversao: 0,
    receita_influenciavel: 0,
  });
  const [campanhas, setCampanhas] = useState([]);
  const [campanhasSelecionadas, setCampanhasSelecionadas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const [campanhasDetalhadas, setCampanhasDetalhadas] = useState([]);
  const formatarData = (dataString) => {
    const data = new Date(dataString);
    if (isNaN(data)) return "";
    return new Intl.DateTimeFormat("pt-BR").format(data);
  };
  



  // Carregar lista de campanhas e pré-selecionar campanhas em execução
  useEffect(() => {
    api.get("/lista-campanhas/")
      .then(res => {
        const lista = res.data.map(c => ({
          label: `${formatarData(c.data_criacao)} - ${c.nome}`,
          value: c.id,
          status: c.status,
        }));
        setCampanhas(lista);

        // Seleciona apenas os IDs das campanhas em execução
        const campanhasIds = lista
          .filter(c => c.status === "emexecucao")
          .map(c => c.value);

        setCampanhasSelecionadas(campanhasIds);
        carregarDadosAnalytics(campanhasIds);
      })
      .catch(error => {
        console.error("Erro ao carregar campanhas:", error);
        setIsLoading(false);
      });
  }, []);


  useEffect(() => {
    if (campanhasSelecionadas.length > 0) {
      const ids = campanhasSelecionadas.join(",");
      api.get(`/campanhas-detalhes-dashboard/?campanhas=${ids}`)
        .then(res => setCampanhasDetalhadas(res.data))
        .catch(err => console.error("Erro ao carregar campanhas detalhadas:", err));
    }
  }, [campanhasSelecionadas]);
  

  // Função para carregar dados de analytics
  const carregarDadosAnalytics = (selectedIds) => {
    let campanhaParams = "";
    if (selectedIds.length > 0) {
      campanhaParams = `?campanhas=${selectedIds.join(",")}`;
    }

    api.get(`/analytics-kpis/${campanhaParams}`)
      .then(res => {
        setAnalyticsData({
          campanhas: res.data.campanhas || 0,
          enviadas: res.data.enviadas || 0,
          clicks: res.data.clicks || 0,
          percent_click: res.data.percentual_click || 0,
          vendas: res.data.vendas || 0,
          receita: res.data.receita || 0,
          percent_conversao: res.data.percentual_conversao || 0,
          receita_influenciavel: res.data.receita_influenciavel || 0,
        });
        setIsLoading(false);
      })
      .catch(error => {
        console.error("Erro ao carregar dados de analytics:", error);
        setIsLoading(false);
      });
  };

  const handleCampanhaChange = (e) => {
    const selectedIds = e.value || [];
    setCampanhasSelecionadas(selectedIds);
    carregarDadosAnalytics(selectedIds);
  };

  const formatNumber = (num) => (num || 0).toLocaleString("pt-BR");
  const formatCurrency = (num) =>
    (num || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const kpiDescriptions = {
    campanhas: "Número total de campanhas selecionadas.",
    enviadas: "Mensagens enviadas no total das campanhas selecionadas.",
    clicks: "Número total de cliques registrados.",
    percent_click: "Percentual de cliques sobre mensagens enviadas.",
    vendas: "Total de pedidos realizados.",
    receita: "Valor total vendido pelas campanhas.",
    percent_conversao: "Percentual de conversão entre vendas e enviadas.",
    receita_influenciavel: "Receita influenciada por campanhas.",
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
   
   

  if (isLoading) {
    return <div className="loading-container">Carregando dados...</div>;
  }

  return (
    <div className="analytics-wrapper">
      <div className="analytics-header">
        <h2>Analytics</h2>
        <MultiSelect
          value={campanhasSelecionadas}
          options={campanhas}
          onChange={handleCampanhaChange}
          optionLabel="label"
          optionValue="value"
          placeholder="Selecionar campanhas"
          display="chip"
          className="campanha-multiselect"
          style={{ minWidth: "300px" }}
          filter
        />
      </div>

      <div className="analytics-cards">
        {[
          { title: "Campanhas", key: "campanhas" },
          { title: "Enviadas", key: "enviadas" },
          { title: "Clicks", key: "clicks" },
          { title: "% Click", key: "percent_click", isPercent: true },
          { title: "Vendas", key: "vendas" },
          { title: "Receita", key: "receita", isCurrency: true },
          { title: "% Conversão", key: "percent_conversao", isPercent: true },
          { title: "Receita Influenciável", key: "receita_influenciavel", isCurrency: true },
        ].map((item) => (
          <Card className="dashboard-card" key={item.key}>
            <div className="card-header">
              <div className="card-title-container">
                <span className="card-title">{item.title}</span>
                <span className="card-info" id={`${item.key}-info`}>
                  <i className={PrimeIcons.INFO_CIRCLE}></i>
                </span>
                <Tooltip target={`#${item.key}-info`} position="top">
                  {kpiDescriptions[item.key]}
                </Tooltip>
              </div>
            </div>
            <div className="card-value">
              {item.isCurrency
                ? formatCurrency(analyticsData[item.key])
                : item.isPercent
                ? `${analyticsData[item.key].toFixed(2)}%`
                : formatNumber(analyticsData[item.key])}
            </div>
          </Card>
        ))}
      </div>


        {/* Tabela com as Campanhas ativas */}
            <Card className="mt-4">
                <h3>Campanhas Ativas</h3>
                <DataTable value={campanhasDetalhadas} paginator rows={5} responsiveLayout="scroll">
                    <Column field="campanha" header="Campanha" />
                    <Column field="status" header="Status" body={statusBodyTemplate} />
                    {/* <Column field="total_mensagem" header="Total Mensagens" /> */}
                    {/* <Column field="enviado" header="Enviadas" /> */}
                    {/* <Column field="erro" header="Erros" /> */}
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
                    <Column 
                        header="Detalhes"
                        body={(rowData) => (
                            <div className="flex gap-2">
                                <Button icon="pi pi-send" className="p-button-rounded p-button-primary"  onClick={() => {
                                    localStorage.setItem("campanhaId", rowData.id);
                                    navigate("/analytics/dados");
                                }}
                            />
                        </div>
                    )}
                    />
                </DataTable>
            </Card>


    </div>
  );
}
