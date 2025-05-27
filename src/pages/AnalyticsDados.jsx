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
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { saveAs } from 'file-saver';
import * as XLSX from "xlsx";




export default function AnalyticsDados() {
    const navigate = useNavigate();
    const campanhaId = localStorage.getItem("campanhaId");
    const [dados, setDados] = useState(null);
    const [registros, setRegistros] = useState([]);
    const [filtrosSelecionados, setFiltrosSelecionados] = useState([]);


    useEffect(() => {
      api.get(`/analytics-dados-campanha/${campanhaId}/`)
        .then(res => setDados(res.data))
        .catch(err => console.error("Erro ao carregar dados da campanha:", err));
    }, [campanhaId]);


    useEffect(() => {
      const filtroQuery = filtrosSelecionados.join(',');
      api.get(`/dados-disparados/${campanhaId}/?filtro=${filtroQuery}`)
        .then((res) => setRegistros(res.data))
        .catch((err) => console.error("Erro ao buscar dados disparados:", err));
    }, [filtrosSelecionados, campanhaId]);
    
    
    const toggleFiltro = (valor) => {
      setFiltrosSelecionados((prev) =>
        prev.includes(valor)
          ? prev.filter((f) => f !== valor)
          : [...prev, valor]
      );
    };
    
        
    // ⚠️ Mantenha todos os hooks acima do return
    if (!dados) {
      return <div>Carregando dados da campanha...</div>;
    }
    
  
    const formatNumber = (num) => (num || 0).toLocaleString("pt-BR");
    const formatCurrency = (num) => (num || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

    const cards = [
        { title: "Conversões", value: formatNumber(dados.conversoes) },
        { title: "Conversão %", value: `${dados.percentual_conversao.toFixed(2)}%` },
        { title: "Receita Real", value: formatCurrency(dados.valor_conversao) },
        { title: "Receita Influenciavel", value: formatCurrency(dados.outro_valor) }
      ];
    
      const indicadores = [
        { label: "Disponibilizadas", key: "disponibilizadas" },
        { label: "Enviadas", key: "enviadas" },
        { label: "Entregues", key: "entregues" },
        { label: "Lidas", key: "lidas" },
        { label: "Engajadas", key: "engajadas" },
        { label: "Erros", key: "erros" }
      ];

      
      
      
      
      const botoesFiltro = [
        { label: "Enviadas", value: "enviado" },
        { label: "Entregues", value: "entregue" },
        { label: "Lidas", value: "lido" },
        { label: "Engajadas", value: "engajada" },
        { label: "Erros", value: "erro" },
        { label: "Comprado", value: "comprado" }
      ];
      
      const exportarParaExcel = () => {
        const ws = XLSX.utils.json_to_sheet(registros);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Disparos");
        const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "dados_disparados.xlsx");
      };

      const renderStatusIcon = (valor) => {
        return (
          <i
            className={`pi ${valor ? "pi-check" : "pi-times"}`}
            style={{ color: valor ? "green" : "red", fontSize: "1.2rem" }}
          ></i>
        );
      };
      
      const formatarCPF = (cpf) => {
        if (!cpf) return "";
        return cpf.toString().padStart(11, "0");
      };
      


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
          <div className="analytics-dados-tabela">
          <h3>Dados Clientes Campanha</h3>
          <div className="filtros-exportacao">
          {botoesFiltro.map((btn) => (
            <Button
              key={btn.value}
              label={btn.label}
              className={`p-button-sm ${filtrosSelecionados.includes(btn.value) ? 'p-button-info' : 'p-button-outlined'}`}
              onClick={() => toggleFiltro(btn.value)}
            />
          ))}

            <Button label="Exportar" icon="pi pi-file-excel" className="p-button-success p-button-sm ml-2" onClick={exportarParaExcel} />
          </div>

          <DataTable value={registros} paginator rows={10} className="mt-3">
          <Column field="cpf" header="CPF" body={(row) => formatarCPF(row.cpf)} />
            <Column field="telefone" header="Telefone" />
            <Column field="nome" header="Nome" />
            <Column
              field="data_envio"
              header="Data de Envio"
              body={(row) => {
                const data = new Date(row.data_envio);
                return data.toLocaleDateString("pt-BR");
              }}
          />

            {/* <Column field="campanha" header="Campanha" /> */}
            <Column field="enviado" header="Enviado" body={(row) => renderStatusIcon(row.enviado)} />
            <Column field="entregue" header="Entregue" body={(row) => renderStatusIcon(row.entregue)} />
            <Column field="lido" header="Lido" body={(row) => renderStatusIcon(row.lido)} />
            <Column field="click" header="Click" body={(row) => renderStatusIcon(row.click)} />
            <Column field="erro" header="Erro" body={(row) => renderStatusIcon(row.erro)} />
            <Column field="total_venda" header="Total Venda (R$)" body={(row) => row.total_venda?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} />
          
          </DataTable>
        </div>

        </div>
        
      );
    }