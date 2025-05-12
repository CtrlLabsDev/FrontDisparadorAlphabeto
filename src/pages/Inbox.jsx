import { useState, useEffect, useRef } from "react";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { FileUpload } from "primereact/fileupload";
import "../styles/inbox.css";

export default function Inbox() {
  const [contatos, setContatos] = useState([]);
  const [mensagens, setMensagens] = useState([]);
  const [contatoSelecionado, setContatoSelecionado] = useState(null);
  const [mensagem, setMensagem] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [contaSelecionada, setContaSelecionada] = useState(null);
  const chatRef = useRef(null);

  const contasDisponiveis = [
    { label: "Suporte ALPHABETO", value: "alphabeto" },
    { label: "Atendimento Loja X", value: "lojax" },
  ];

  useEffect(() => {
    const mockContatos = [
      { id: 1, nome: "João Silva", telefone: "+55 11 91234-5678", naoLida: true },
      { id: 2, nome: "Maria Oliveira", telefone: "+55 21 98765-4321", naoLida: false },
      { id: 3, nome: "Carlos Lima", telefone: "+55 31 99876-5432", naoLida: true },
    ];
    setContatos(mockContatos);
  }, []);

  useEffect(() => {
    if (contatoSelecionado) {
      const mockMensagens = {
        1: [
          { texto: "Olá, tudo bem?", enviado_por: "contato" },
          { texto: "Tudo sim e você?", enviado_por: "usuario" },
        ],
        2: [
          { texto: "Pedido enviado com sucesso!", enviado_por: "usuario" },
          { texto: "Obrigada!", enviado_por: "contato" },
        ],
        3: [
          { texto: "Recebeu o orçamento?", enviado_por: "usuario" },
          { texto: "Sim, vou revisar e te dou retorno!", enviado_por: "contato" },
        ],
      };
      setMensagens(mockMensagens[contatoSelecionado.id] || []);
      scrollToBottom();
    }
  }, [contatoSelecionado]);

  const enviarMensagem = () => {
    if (!mensagem.trim()) return;
    setMensagens((prev) => [...prev, { texto: mensagem, enviado_por: "usuario" }]);
    setMensagem("");
    scrollToBottom();
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      if (chatRef.current) {
        chatRef.current.scrollTop = chatRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleImagemUpload = ({ files }) => {
    const file = files[0];
    setMensagens((prev) => [...prev, { texto: `📎 Enviou imagem: ${file.name}`, enviado_por: "usuario" }]);
    scrollToBottom();
  };

  const contatosFiltrados = contatos.filter((c) => {
    if (filtro === "todos") return true;
    if (filtro === "naoLidas") return c.naoLida;
    return true;
  });

  const getIniciais = (nome) => {
    if (!nome) return "?";
    const partes = nome.trim().split(" ");
    const primeira = partes[0]?.[0] || "";
    const segunda = partes[1]?.[0] || "";
    return (primeira + segunda).toUpperCase();
  };

  return (
    <div className="inbox-wrapper">
      <div className="inbox-contatos">
        <div className="contato-header">
          <h3>Contatos</h3>
          <Dropdown
            value={filtro}
            options={[
              { label: "Todos", value: "todos" },
              { label: "Não Lidos", value: "naoLidas" },
            ]}
            onChange={(e) => setFiltro(e.value)}
            className="w-full mb-2"
          />
          <Dropdown
            value={contaSelecionada}
            options={contasDisponiveis}
            onChange={(e) => setContaSelecionada(e.value)}
            className="w-full mb-3"
            placeholder="Selecione a conta"
          />
        </div>

        {contatosFiltrados.map((contato) => (
          <div
            key={contato.id}
            className={`contato-item ${contatoSelecionado?.id === contato.id ? "ativo" : ""}`}
            onClick={() => setContatoSelecionado(contato)}
          >
            <div className="contato-avatar">{getIniciais(contato.nome)}</div>
            <div className="contato-info">
              <strong>{contato.nome}</strong>
              <p>{contato.telefone}</p>
            </div>
            {contato.naoLida && <span className="notificacao-dot" />}
          </div>
        ))}
      </div>

      <div className="inbox-chat">
        {contatoSelecionado ? (
          <Card className="chat-card">
            <div className="chat-header">
              <h3>{contatoSelecionado.nome}</h3>
            </div>

            <div className="chat-mensagens" ref={chatRef}>
              {mensagens.map((msg, index) => (
                <div
                  key={index}
                  className={`mensagem ${msg.enviado_por === "usuario" ? "enviado" : "recebido"}`}
                >
                  {msg.texto}
                </div>
              ))}
            </div>

            <div className="chat-input-wrapper">
              <InputText
                value={mensagem}
                onChange={(e) => setMensagem(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviarMensagem()}
                placeholder="Digite sua mensagem..."
                className="w-full"
              />
              <Button icon="pi pi-send" onClick={enviarMensagem} className="p-button-sm p-button-primary" />
              <FileUpload
                mode="basic"
                chooseLabel="📷"
                customUpload
                auto
                uploadHandler={handleImagemUpload}
                accept="image/*"
                className="p-button-sm p-button-secondary ml-2"
              />
            </div>
          </Card>
        ) : (
          <div className="chat-placeholder">Selecione um contato para começar</div>
        )}
      </div>
    </div>
  );
}