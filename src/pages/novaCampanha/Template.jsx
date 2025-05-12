import { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/Template.css";
import EmojiPicker from 'emoji-picker-react';
import { Smile, Bold, Italic, Strikethrough } from 'lucide-react';


export default function TemplateMensagem() {
    const [mensagem, setMensagem] = useState("");
    const [variaveisUsadas, setVariaveisUsadas] = useState([]);
    const [header, setHeader] = useState("");
    const [footer, setFooter] = useState("");
    const [url, setUrl] = useState("");
    const [labelBotao, setLabelBotao] = useState("");
    const [campanhaId, setCampanhaId] = useState(null);
    const textareaRef = useRef(null);
    const navigate = useNavigate();
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const variaveis = [
        { label: "Var A", value: "{variavel_a}" },
        { label: "Var B", value: "{variavel_b}" },
        { label: "Var C", value: "{variavel_c}" },
        { label: "Var D", value: "{variavel_d}" },
    ];


    useEffect(() => {
        const id = localStorage.getItem("campanhaId");
        if (id) {
            setCampanhaId(id);
            api.get(`/campanhas/${id}/`)
                .then((res) => {
                    setMensagem(res.data.mensagem || "");
                    setHeader(res.data.header || "");
                    setFooter(res.data.footer || "");
                    setUrl(res.data.url || "");
                    setLabelBotao(res.data.labelbotao || "");
                    const usadas = variaveis.filter(v => res.data.mensagem?.includes(v));
                    setVariaveisUsadas(usadas);
                })
                .catch((err) => console.error("Erro ao carregar mensagem", err));
        }
    }, []);

    const inserirVariavel = (variavel) => {
        if (variaveisUsadas.includes(variavel)) {
            const novaMensagem = mensagem.replaceAll(variavel, "");
            setMensagem(novaMensagem);
            setVariaveisUsadas((prev) => prev.filter((v) => v !== variavel));
        } else {
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const novaMensagem = mensagem.slice(0, start) + variavel + mensagem.slice(end);
            setMensagem(novaMensagem);
            setVariaveisUsadas((prev) => [...prev, variavel]);

            setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + variavel.length;
            }, 0);
        }
    };

    const handleProximo = async () => {
        if (!campanhaId) return;

        if (!mensagem.trim() || !url.trim() || !labelBotao.trim()) {
            alert("Preencha todos os campos obrigatórios: mensagem, URL e nome do botão.");
            return;
        }

        try {
            await api.patch(`/campanhas/${campanhaId}/`, {
                mensagem,
                header,
                footer,
                url,
                labelbotao: labelBotao,
            });
            navigate("/nova-campanha/configuracoes");
        } catch {
            alert("Erro ao salvar mensagem.");
        }
    };

    
    const onEmojiClick = (emojiObject) => {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
    
        const novoTexto = mensagem.slice(0, start) + emojiObject.emoji + mensagem.slice(end);
        setMensagem(novoTexto);
    
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = start + emojiObject.emoji.length;
        }, 0);
    };


    const aplicarFormato = (caractere) => {
        const textarea = textareaRef.current;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
    
        const textoSelecionado = mensagem.slice(start, end);
        const novoTexto = mensagem.slice(0, start) + caractere + textoSelecionado + caractere + mensagem.slice(end);
    
        setMensagem(novoTexto);
    
        setTimeout(() => {
            textarea.focus();
            textarea.selectionStart = textarea.selectionEnd = end + (caractere.length * 2);
        }, 0);
    };
    
    
    
    

    return (
        <div className="p-5">
            <h2 className="font-bold mb-2">Passo 3: Template da Mensagem</h2>

            <div className=" grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="template-form">
                    <div className="mb-1">
                        <label className="font-semibold block mb-1">Header</label>
                        <InputText value={header} onChange={(e) => setHeader(e.target.value)} className="w-full" maxLength={40} />
                    </div>

                    <div className="mb-1">
                        <label className="font-semibold block mb-1">Footer</label>
                        <InputText value={footer} onChange={(e) => setFooter(e.target.value)} className="w-full" maxLength={40} />
                    </div>

                    <div className="mb-1">
                        <label className="font-semibold block mb-1">URL *</label>
                        <InputText value={url} onChange={(e) => setUrl(e.target.value)} className="w-full" maxLength={200} />
                    </div>

                    <div className="mb-1">
                        <label className="font-semibold block mb-1">Nome do Botão *</label>
                        <InputText value={labelBotao} onChange={(e) => setLabelBotao(e.target.value)} className="w-full" maxLength={20} />
                    </div>

                    <div className="mb-2">
                        <label className="font-semibold block mb-1">Mensagem *</label>
                        
                        
                        
                        
                        <div className="textarea-container relative">
                        <InputTextarea
                            ref={textareaRef}
                            value={mensagem}
                            onChange={(e) => setMensagem(e.target.value)}
                            placeholder="Insira o corpo do texto aqui"
                            rows={10}
                            maxLength={800}
                            className="w-full"
                        />
                        <div className="contador-caracters">
                                {mensagem.length}/800
                            </div>
                        </div>
                        

                        <div className="emoji-toolbar">
                        <div className="flex items-center gap-2">
                            <Button className="p-button-text" onClick={() => aplicarFormato("*")}>
                                <Bold className="w-12" />
                            </Button>
                            <Button className="p-button-text" onClick={() => aplicarFormato("_")}>
                                <Italic className="w-12" />
                            </Button>
                            <Button className="p-button-text" onClick={() => aplicarFormato("~")}>
                                <Strikethrough className="w-12" />
                            </Button>
                           
                        </div>

                        <div className="relative inline-block">
                            <Button className="p-button-text" onClick={() => setShowEmojiPicker(prev => !prev)}>
                                <Smile className="w-12" />
                            </Button>

                            {showEmojiPicker && (
                                <div
                                    className="absolute z-50 mt-2 right-0 bg-white border shadow-lg rounded"
                                    style={{ zIndex: 9999 }}
                                >
                                    <EmojiPicker onEmojiClick={onEmojiClick} height={320} width={300} />
                                </div>
                                )}

                        </div>

                            
                        </div>
                        

                    </div>

                    <div className="flex flex-wrap gap-3 mb-4">
                        {variaveis.map(({label, value}) => (
                            <Button
                                key={value}
                                label={label}
                                className={`p-button-sm ${variaveisUsadas.includes(value) ? 'p-button-outlined p-button-secondary' : 'p-button-primary'}`}
                                onClick={() => inserirVariavel(value)}
                            />
                        ))}
                    </div>

                    <div className="flex justify-between gap-3">
                        <Button label="Voltar" icon="pi pi-arrow-left" onClick={() => navigate("/nova-campanha/importar")} />
                        <Button label="Próximo" icon="pi pi-arrow-right" onClick={handleProximo} />
                    </div>
                </div>

                <div className="template-preview flex justify-center items-start">
                    <div className="bg-white border shadow-md p-4 rounded w-full max-w-xs">
                        <div className="text-sm text-center text-gray-600 mb-2">18 Abr 2025</div>
                        {header && <div className="font-bold text-center text-black text-sm mb-2">{header}</div>}
                        <div className="bg-gray-100 text-sm p-3 rounded mb-2 whitespace-pre-line">
                            {mensagem || "Sua mensagem aparecerá aqui..."}
                        </div>
                        {footer && <div className="text-xs text-gray-600 mt-1 italic text-center">{footer}</div>}
                        {url && labelBotao && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block mt-4 bg-green-500 hover:bg-green-600 text-white text-center py-2 rounded text-sm"
                            >
                                {labelBotao}
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
