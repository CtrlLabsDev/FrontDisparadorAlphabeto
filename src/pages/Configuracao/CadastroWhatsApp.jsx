import { useState, useEffect } from "react";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import api from "../../services/api";

export default function CadastroWhatsApp({ onSuccess, dadosEdicao = null }) {
  const [form, setForm] = useState({
    whatsapp: "",
    id_instancia_whatsapp: "",
    token_instancia_whatsapp: "",
    nome_instancia_whatsapp: "",
    min_envio: "",
    max_envio: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    if (dadosEdicao) {
      setForm({
        whatsapp: dadosEdicao.whatsapp || "",
        id_instancia_whatsapp: dadosEdicao.id_instancia_whatsapp || "",
        token_instancia_whatsapp: dadosEdicao.token_instancia_whatsapp || "",
        nome_instancia_whatsapp: dadosEdicao.nome_instancia_whatsapp || "",
        min_envio: dadosEdicao.min_envio || "",
        max_envio: dadosEdicao.max_envio || "",
      });
    }
  }, [dadosEdicao]);


  const handleSubmit = async () => {
    try {
      setLoading(true);
  
      const payload = {
        whatsapp: form.whatsapp,
        nome_instancia_whatsapp: form.nome_instancia_whatsapp,
        id_instancia_whatsapp: form.id_instancia_whatsapp,
        token_instancia_whatsapp: form.token_instancia_whatsapp,
        min_envio: form.min_envio,
        max_envio: form.max_envio,
      };
  
      if (dadosEdicao && dadosEdicao.id) {
        await api.patch(`/zap-config/${dadosEdicao.id}/`, payload);
      } else {
        await api.post("/zap-config/", payload);
      }
  
      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar WhatsApp:", error);
    } finally {
      setLoading(false);
    }
  };
  

  

  return (
    <div className="p-4 shadow-md border-round bg-white w-full md:w-6 mx-auto mb-5">
      <h4 className="mb-4 text-xl font-bold">Configurações do WhatsApp</h4>

      <div className="field mb-3">
        <label htmlFor="whatsapp" className="block font-medium mb-2">Número de WhatsApp</label>
        <InputText id="whatsapp" name="whatsapp" value={form.whatsapp} onChange={handleChange} className="w-full" />
      </div>

      <div className="field mb-3">
        <label htmlFor="nome_instancia_whatsapp" className="block font-medium mb-2">Nome da Instância</label>
        <InputText id="nome_instancia_whatsapp" name="nome_instancia_whatsapp" value={form.nome_instancia_whatsapp} onChange={handleChange} className="w-full" />
      </div>

      <div className="grid">
        <div className="col-12 md:col-6">
          <label htmlFor="id_instancia_whatsapp" className="block font-medium mb-2">ID da Instância</label>
          <InputText id="id_instancia_whatsapp" name="id_instancia_whatsapp" value={form.id_instancia_whatsapp} onChange={handleChange} className="w-full" />
        </div>
        <div className="col-12 md:col-6">
          <label htmlFor="token_instancia_whatsapp" className="block font-medium mb-2">Token da Instância</label>
          <InputText id="token_instancia_whatsapp" name="token_instancia_whatsapp" value={form.token_instancia_whatsapp} onChange={handleChange} className="w-full" />
        </div>
      </div>

      <div className="grid">
        <div className="col-12 md:col-6">
          <label htmlFor="min_envio" className="block font-medium mb-2">Período Mínimo (segundos)</label>
          <InputText id="min_envio" name="min_envio" value={form.min_envio} onChange={handleChange} className="w-full" />
        </div>
        <div className="col-12 md:col-6">
          <label htmlFor="max_envio" className="block font-medium mb-2">Período Máximo (segundos)</label>
          <InputText id="max_envio" name="max_envio" value={form.max_envio} onChange={handleChange} className="w-full" />
        </div>
      </div>

      <div className="flex justify-content-end mt-4">
        <Button
          label="Salvar"
          icon="pi pi-save"
          className="p-button-success"
          loading={loading}
          onClick={handleSubmit}
        />
      </div>
    </div>
  );
}
