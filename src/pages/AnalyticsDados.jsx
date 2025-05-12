// AnalyticsDados.jsx 

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { Card } from "primereact/card";
import { ProgressBar } from "primereact/progressbar";
import { PrimeIcons } from "primereact/api";
import { Tooltip } from "primereact/tooltip";
import "../styles/analyticsDados.css";
import { Button } from "primereact/button";



export default function AnalyticsDados() {
    const navigate = useNavigate();
    const campanhaId = localStorage.getItem("campanhaId");
    const [dados, setDados] = useState(null);
  
    useEffect(() => {
      api.get(`/analytics-dados-campanha/${campanhaId}/`)
        .then(res => setDados(res.data))
        .catch(err => console.error("Erro ao carregar dados da campanha:", err));
    }, [campanhaId]);
  
    if (!dados) {
      return <div>Carregando dados da campanha...</div>;
    }
  
    const formatNumber = (num) => (num || 0).toLocaleString("pt-BR");
    const formatCurrency = (num) => (num || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const cards = [
        { title: "Conversões", value: formatNumber(dados.conversoes) },
        { title: "Conversão %", value: `${dados.percentual_conversao.toFixed(2)}%` },
        { title: "Valor de Conversão", value: formatCurrency(dados.valor_conversao) },
        { title: "Outro Valor", value: formatCurrency(dados.outro_valor) }
      ];
    
      const indicadores = [
        { label: "Disponibilizadas", key: "disponibilizadas" },
        { label: "Enviadas", key: "enviadas" },
        { label: "Entregues", key: "entregues" },
        { label: "Lidas", key: "lidas" },
        { label: "Engajadas", key: "engajadas" },
        { label: "Erros", key: "erros" }
      ];



      return (
        <div className="analytics-dados-wrapper">
          <div className="analytics-header-title">
          <Button rounded text severity="secondary" aria-label="Bookmark" onClick={() => navigate(-1)} icon="pi pi-arrow-left"
          /> 
          <h2>{dados.nome_campanha}</h2>
          </div>

          <div className="analytics-cards">
            {cards.map((item, idx) => (
              <Card key={idx} className="dashboard-card">
                <div className="card-header">
                  <span className="card-title">{item.title}</span>
                </div>
                <div className="card-value">{item.value}</div>
              </Card>
            ))}
          </div>
    
          <div className="analytics-content">
            <div className="left-pane">
              <h3>Mensagem Enviada</h3>
              <div className="message-preview">
                {/* Aqui pode renderizar uma imagem ou texto mock do WhatsApp */}
                <p>{dados.mensagem}</p>
              </div>
            </div>
    
            <div className="right-pane">
              <h3>Resultados</h3>
              {indicadores.map((item) => {
                const valor = dados[item.key];
                const percentual = dados[`percentual_${item.key}`];
                return (
                  <div key={item.key} className="kpi-bar">
                    <div className="kpi-label">
                      {item.label} <Tooltip target={`#${item.key}-tooltip`} content={`Total: ${valor}`} />
                      <i id={`${item.key}-tooltip`} className={PrimeIcons.INFO_CIRCLE}></i>
                    </div>
                    <ProgressBar value={percentual.toFixed(2)} showValue style={{ height: "20px" }}>
                      {`${percentual.toFixed(2)}% (${formatNumber(valor)})`}
                    </ProgressBar>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }