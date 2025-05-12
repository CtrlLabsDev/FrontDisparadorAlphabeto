import { useEffect, useState } from "react";
import { Button } from "primereact/button";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import api from "../../services/api";
import CadastroWhatsApp from "./CadastroWhatsApp"; // ajuste o caminho conforme necessário
import { Dialog } from "primereact/dialog";
import { Tag } from "primereact/tag";


export default function WhatsApp() {
    const [dados, setDados] = useState([]);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [registroSelecionado, setRegistroSelecionado] = useState(null);
    const [qrCodeUrl, setQrCodeUrl] = useState(null);
    const [mostrarDialog, setMostrarDialog] = useState(false);

    useEffect(() => {
        api.get("/zap-config/")
            .then((res) => setDados(res.data))
            .catch((err) => console.error("Erro ao carregar dados:", err));
            carregarDados();
    }, []);

    const carregarDados = () => {
        api.get("/zap-config/")
          .then((res) => setDados(res.data))
          .catch((err) => console.error("Erro ao carregar dados:", err));
      };


      const atualizarStatus = async (id) => {
        try {
          await api.post(`/zap-config/${id}/atualizar-status/`);
          carregarDados(); // Recarrega a tabela
        } catch (error) {
          console.error("Erro ao atualizar status:", error);
        }
      };


    const acoesTemplate = (rowData)  => (
        <div className="flex gap-2">
          <Button icon="pi pi-pencil" className="p-button-rounded p-button-warning" tooltip="Editar" 
            onClick={() => {
            setRegistroSelecionado(rowData); 
            setMostrarFormulario(true);  
          }}/>
          <Button icon="pi pi-refresh" className="p-button-rounded p-button-info" tooltip="Atualizar Status" 
            onClick={() => atualizarStatus(rowData.id)
          }/>
          <Button icon="pi pi-qrcode" className="p-button-rounded p-button-success" tooltip="Conectar WhatsApp" 
            onClick={() => exibirQrCode(rowData.id)
          }/>
          <Button icon="pi pi-times" className="p-button-rounded p-button-danger" tooltip="Desconectar WhatsApp" 
            onClick={() => desconectarWhatsapp(rowData.id)
          }/>
        </div>
    );



    const statusTemplate = (rowData) => {
        const status = rowData.status_whatsapp;
    
        const statusMap = {
            Desconectado: { color: 'danger', label: 'Desconectado' },
            Conectado: { color: 'success', label: 'Conectado' },
        };
    
        const { color, label } = statusMap[status] || { color: 'secondary', label: status || 'Desconhecido' };
    
        return <Tag value={label} severity={color} />;
    };




    const exibirQrCode = async (id) => {
        try {
          const response = await api.get(`/zap-config/${id}/qrcode/`);
          setQrCodeUrl(response.data.value); // já vem o "data:image/png;base64,..."
          setMostrarDialog(true);
        } catch (err) {
          console.error("Erro ao buscar QR Code:", err);
        }
      };

      const desconectarWhatsapp = async (id) => {
        try {
          await api.get(`/zap-config/${id}/desconectar/`);
          carregarDados(); // Atualiza a tabela após desconectar
        } catch (error) {
          console.error("Erro ao desconectar WhatsApp:", error);
        }
      };



    return (
        <div>
            <div className="flex justify-between align-items-center mb-4">
                {/* <h3>WhatsApp</h3> */}
                <Button
                    label="Cadastrar WhatsApp"
                    icon="pi pi-plus"
                    className="p-button-primary"
                    onClick={() => {
                        setRegistroSelecionado(null); // novo cadastro, sem dados
                        setMostrarFormulario(true);
                    }}
                />

                {/* <Button label="Atualizar Números" icon="pi pi-refresh" className="p-button-rounded p-button-primary" /> */}
            </div>

            {mostrarFormulario && (
                <CadastroWhatsApp
                    onSuccess={() => {
                    setMostrarFormulario(false);
                    setRegistroSelecionado(null);
                    carregarDados(); // 👈 aqui recarrega a tabela
                    }}
                    dadosEdicao={registroSelecionado}
                />
                )}


            <DataTable value={dados} stripedRows responsiveLayout="scroll">
                <Column field="whatsapp" header="WhatsApp" />
                <Column field="nome_instancia_whatsapp" header="Nome da Instância" />
                <Column field="status_whatsapp" header="Status" body={statusTemplate} />
                <Column field="data_alteracao" header="Data Alteração"
                  body={(rowData) => { const data = new Date(rowData.data_alteracao);
                  return isNaN(data) ? '' : new Intl.DateTimeFormat('pt-BR').format(data);
                }}/>
                <Column header="Ações" body={acoesTemplate} style={{ minWidth: '18rem' }} />
            </DataTable>


            <Dialog header="Conectar WhatsApp" visible={mostrarDialog} style={{ width: '30vw' }} onHide={() => setMostrarDialog(false)}>
                {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="QR Code" style={{ width: '100%' }} />
                ) : (
                    <p>Carregando QR Code...</p>
                )}
            </Dialog>

        </div>
  
    );
}











