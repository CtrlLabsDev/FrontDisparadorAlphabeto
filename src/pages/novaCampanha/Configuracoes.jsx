import { useState, useEffect, useRef } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useNavigate } from "react-router-dom";
import { Checkbox } from 'primereact/checkbox';
import api from "../../services/api";

export default function Configuracoes() {
  const [inicio, setInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [campanhaId, setCampanhaId] = useState(null);
  const [checked, setChecked] = useState(false);
  const navigate = useNavigate();
  const toast = useRef(null);

  useEffect(() => {
    const id = localStorage.getItem("campanhaId");
    if (id) {
      setCampanhaId(id);
      

      api.get(`/campanhas/${id}/`)
        .then((res) => {
          const dados = res.data;
          setInicio(dados.data_inicio || "");
          setHoraInicio(dados.hora_inicio?.slice(0, 5) || "08:00");
          setHoraFim(dados.hora_termino?.slice(0, 5) || "18:00");
          setChecked(dados.campanha_continua || false);
        })
        .catch((err) => {
          console.error("Erro ao carregar dados da campanha:", err);
        });
    }
  }, []);

  const handleFinalizar = async () => {
    if (!campanhaId) return;

    try {
      await api.patch(`/campanhas/${campanhaId}/`, {
        data_inicio: inicio,
        hora_inicio: horaInicio,
        hora_termino: horaFim,
        campanha_continua: checked,
      });

      toast.current.show({
        severity: "success",
        summary: "Sucesso",
        detail: "Configurações atualizadas com sucesso!",
        life: 3000,
      });

      navigate("/campanhas");
    } catch (error) {
      toast.current.show({
        severity: "error",
        summary: "Erro",
        detail: error.response?.data?.detail || "Erro ao salvar as configurações.",
        life: 3000,
      });
    }
  };

  return (
    <div className="p-4">
      <Toast ref={toast} />
      <h2>Passo 4: Configurações de Envio</h2>

      <div className="p-fluid">
        <div className="field">
          <label>Início da Campanha:</label>
          <InputText
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            min={new Date().toLocaleDateString('en-CA')}
          />
        </div>
        <div className="field">
          <label>Período de Envio:</label>
          <div className="flex gap-2">
            <InputText type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} />
            <span>até</span>
            <InputText type="time" value={horaFim} onChange={(e) => setHoraFim(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="card flex align-items-center gap-2 mt-3">
        <Checkbox onChange={e => setChecked(e.checked)} checked={checked} />
        <span>Campanha Contínua</span>
      </div>

      <div className="flex justify-content-between mt-4">
        <Button label="Voltar" icon="pi pi-arrow-left" onClick={() => navigate("/nova-campanha/template")} />
        <Button
          label="Finalizar"
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleFinalizar}
          disabled={!inicio || !horaInicio || !horaFim}
        />
      </div>
    </div>
  );
}