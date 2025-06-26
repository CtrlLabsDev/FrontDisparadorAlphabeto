// Template.jsx

import { useState, useRef, useEffect } from "react";
import { Button } from "primereact/button";
import { InputTextarea } from "primereact/inputtextarea";
import { InputText } from "primereact/inputtext";
import { Dialog } from "primereact/dialog";
import { ProgressSpinner } from "primereact/progressspinner";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "../../styles/template.css";
import EmojiPicker from 'emoji-picker-react';
import { Smile, Bold, Italic, Strikethrough, Link, Copy, Check } from 'lucide-react';

const variaveis = [
    { label: "Variavel A", value: "{variavel_a}" },
    { label: "Variavel B", value: "{variavel_b}" },
    { label: "Variavel C", value: "{variavel_c}" },
    // { label: "Var D", value: "{variavel_d}" },
];

const FOOTER_PADRAO = "Não quer mais receber? Responda SAIR";

export default function TemplateMensagem() {
    const [mensagem, setMensagem] = useState("");
    const [variaveisUsadas, setVariaveisUsadas] = useState([]);
    const [header, setHeader] = useState("");
    const [footer, setFooter] = useState(FOOTER_PADRAO);
    const [url, setUrl] = useState("");
    const [labelBotao, setLabelBotao] = useState("");
    const [campanhaId, setCampanhaId] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
    // Estados para o modal de tracking
    const [showTrackingModal, setShowTrackingModal] = useState(false);
    const [linkOriginal, setLinkOriginal] = useState("");
    const [linkTrackeado, setLinkTrackeado] = useState("");
    const [linkEncurtado, setLinkEncurtado] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    
    // Estados para o modal de teste
    const [showTesteModal, setShowTesteModal] = useState(false);
    const [telefoneTest, setTelefoneTest] = useState("");
    const [variavelATest, setVariavelATest] = useState("João Silva");
    const [variavelBTest, setVariavelBTest] = useState("Produto Teste");
    const [variavelCTest, setVariavelCTest] = useState("10% desconto");
    const [enviandoTeste, setEnviandoTeste] = useState(false);
    
    const textareaRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const id = localStorage.getItem("campanhaId");
        if (id) {
            setCampanhaId(id);
            api.get(`/campanhas/${id}/`)
                .then((res) => {
                    setMensagem(res.data.mensagem || "");
                    setHeader(res.data.header || "");
                    setFooter(res.data.footer || FOOTER_PADRAO);
                    setUrl(res.data.url || "");
                    setLabelBotao(res.data.labelbotao || "");
                    const usadas = variaveis.filter(v => res.data.mensagem?.includes(v.value));
                    setVariaveisUsadas(usadas.map(v => v.value));
                })
                .catch((err) => console.error("Erro ao carregar mensagem", err));
        }
    }, []);

    const inserirVariavel = (variavel) => {
        if (variaveisUsadas.includes(variavel)) {
            const novaMensagem = mensagem.replaceAll(variavel, "");
            setMensagem(novaMensagem);
            setVariaveisUsadas(prev => prev.filter(v => v !== variavel));
        } else {
            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const novaMensagem = mensagem.slice(0, start) + variavel + mensagem.slice(end);
            setMensagem(novaMensagem);
            setVariaveisUsadas(prev => [...prev, variavel]);

            setTimeout(() => {
                textarea.focus();
                textarea.selectionStart = textarea.selectionEnd = start + variavel.length;
            }, 0);
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

    // Função para adicionar parâmetros de tracking
    const adicionarTracking = (urlOriginal, campanhaId) => {
        try {
            const url = new URL(urlOriginal);
            
            // Adicionar parâmetros de tracking
            url.searchParams.set('utm_source', 'whatsappCtrlLabs');
            url.searchParams.set('utm_medium', campanhaId);
            
            // Manter outros parâmetros UTM se já existirem
            if (!url.searchParams.has('utm_campaign')) {
                url.searchParams.set('utm_campaign', 'campanha_whatsapp');
            }
            
            return url.toString();
        } catch (error) {
            console.error('URL inválida:', error);
            return null;
        }
    };

    // Função para encurtar URL com múltiplos serviços
    const encurtarUrl = async (urlLonga) => {
        const servicos = [
            {
                nome: 'TinyURL',
                encurtar: async (url) => {
                    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`);
                    const resultado = await response.text();
                    if (resultado.startsWith('http') && resultado !== url && !resultado.includes('Error')) {
                        return resultado.trim();
                    }
                    throw new Error('TinyURL falhou');
                }
            },
            {
                nome: 'is.gd',
                encurtar: async (url) => {
                    const response = await fetch('https://is.gd/create.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: `format=simple&url=${encodeURIComponent(url)}`
                    });
                    const resultado = await response.text();
                    if (resultado.startsWith('http') && resultado !== url && !resultado.includes('Error')) {
                        return resultado.trim();
                    }
                    throw new Error('is.gd falhou');
                }
            },
            {
                nome: 'v.gd',
                encurtar: async (url) => {
                    const response = await fetch('https://v.gd/create.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: `format=simple&url=${encodeURIComponent(url)}`
                    });
                    const resultado = await response.text();
                    if (resultado.startsWith('http') && resultado !== url && !resultado.includes('Error')) {
                        return resultado.trim();
                    }
                    throw new Error('v.gd falhou');
                }
            }
        ];

        // Tentar cada serviço sequencialmente
        for (const servico of servicos) {
            try {
                console.log(`🔗 Tentando encurtar com ${servico.nome}...`);
                const urlEncurtada = await servico.encurtar(urlLonga);
                console.log(`✅ ${servico.nome} funcionou:`, urlEncurtada);
                return urlEncurtada;
            } catch (error) {
                console.log(`❌ ${servico.nome} falhou:`, error.message);
                continue;
            }
        }

        // Se todos falharam, retornar URL original
        console.log('⚠️ Todos os serviços de encurtamento falharam, usando URL original');
        return urlLonga;
    };

    const processarLink = async () => {
        if (!linkOriginal.trim() || !campanhaId) {
            alert("Por favor, insira um link válido");
            return;
        }

        setIsProcessing(true);
        
        try {
            // Opção 1: Tentar via frontend (direto)
            console.log("🔗 Tentando processamento via frontend...");
            
            // 1. Adicionar tracking
            const linkComTracking = adicionarTracking(linkOriginal, campanhaId);
            
            if (!linkComTracking) {
                alert("URL inválida. Verifique o formato do link.");
                setIsProcessing(false);
                return;
            }
            
            setLinkTrackeado(linkComTracking);
            
            // 2. Tentar encurtar via frontend
            const linkEncurtadoFrontend = await encurtarUrl(linkComTracking);
            
            // Se conseguiu encurtar via frontend
            if (linkEncurtadoFrontend !== linkComTracking) {
                console.log("✅ Encurtamento via frontend funcionou!");
                setLinkEncurtado(linkEncurtadoFrontend);
            } else {
                // Opção 2: Fallback via backend (temporariamente desabilitado)
                console.log("⚠️ Serviços de encurtamento falharam, usando URL com tracking");
                setLinkEncurtado(linkComTracking);
                
                // TODO: Implementar fallback via backend quando necessário
                // try {
                //     const response = await api.post('/encurtar-url/', {
                //         url: linkComTracking
                //     });
                //     const urlBackend = response.data.url_encurtada;
                //     setLinkEncurtado(urlBackend);
                // } catch (backendError) {
                //     setLinkEncurtado(linkComTracking);
                // }
            }
            
        } catch (error) {
            console.error('Erro ao processar link:', error);
            
            // Último fallback: apenas adicionar tracking
            const linkComTracking = adicionarTracking(linkOriginal, campanhaId);
            if (linkComTracking) {
                setLinkTrackeado(linkComTracking);
                setLinkEncurtado(linkComTracking);
                alert("Não foi possível encurtar o link, mas o tracking foi adicionado.");
            } else {
                alert("Erro ao processar o link. Verifique se é uma URL válida.");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const copiarLink = (link) => {
        navigator.clipboard.writeText(link).then(() => {
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        });
    };

    const usarLinkEncurtado = () => {
        setUrl(linkEncurtado);
        setShowTrackingModal(false);
        setLinkOriginal("");
        setLinkTrackeado("");
        setLinkEncurtado("");
    };

    const resetarFooter = () => {
        setFooter(FOOTER_PADRAO);
    };

    // Função para envio de teste
    const enviarTeste = async () => {
        if (!telefoneTest.trim()) {
            alert("Por favor, insira um número de telefone para teste");
            return;
        }

        if (!mensagem.trim() || !url.trim() || !labelBotao.trim()) {
            alert("Complete o template antes de enviar o teste (mensagem, URL e botão são obrigatórios)");
            return;
        }

        setEnviandoTeste(true);

        try {
            // Formatar mensagem com variáveis de teste
            const mensagemFormatada = mensagem
                .replace(/{variavel_a}/g, variavelATest)
                .replace(/{variavel_b}/g, variavelBTest)
                .replace(/{variavel_c}/g, variavelCTest);

            // Criar payload para envio de teste
            const payload = {
                telefone: telefoneTest,
                mensagem: mensagemFormatada,
                header: header,
                footer: footer,
                url: url,
                labelBotao: labelBotao,
                campanha_id: campanhaId,
                tipo: 'teste'
            };

            console.log('📤 Enviando teste:', payload);

            const response = await api.post('/enviar-teste/', payload);

            if (response.data.sucesso) {
                alert(`✅ Teste enviado com sucesso para ${telefoneTest}!`);
                setShowTesteModal(false);
                setTelefoneTest("");
            } else {
                alert(`❌ Erro no envio: ${response.data.erro || 'Falha desconhecida'}`);
            }

        } catch (error) {
            console.error('Erro no envio de teste:', error);
            const errorMsg = error.response?.data?.erro || error.message || 'Erro desconhecido';
            alert(`❌ Erro ao enviar teste: ${errorMsg}`);
        } finally {
            setEnviandoTeste(false);
        }
    };

    // Função para preview da mensagem formatada
    const previewMensagemTeste = () => {
        return mensagem
            .replace(/{variavel_a}/g, variavelATest)
            .replace(/{variavel_b}/g, variavelBTest)
            .replace(/{variavel_c}/g, variavelCTest);
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

    return (
        <div className="p-5">
            <h2 className="font-bold mb-4">Passo 3: Template da Mensagem</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Formulário à esquerda */}
                <div className="template-form">
                    <div className="mb-1">
                        <label className="font-semibold block mb-1">Header</label>
                        <InputText value={header} onChange={(e) => setHeader(e.target.value)} className="w-full" maxLength={40} />
                    </div>

                    <div className="mb-1">
                        <label className="font-semibold block mb-1">Footer</label>
                        <div className="flex gap-2">
                            <InputText value={footer} onChange={(e) => setFooter(e.target.value)} className="flex-1" maxLength={40} />
                            <Button 
                                label="Padrão" 
                                size="small" 
                                className="p-button-outlined p-button-sm"
                                onClick={resetarFooter}
                            />
                        </div>
                        <small className="text-gray-500">Padrão: "{FOOTER_PADRAO}"</small>
                    </div>

                    <div className="mb-1">
                        <label className="font-semibold block mb-1">URL *</label>
                        <div className="flex gap-2">
                            <InputText value={url} onChange={(e) => setUrl(e.target.value)} className="flex-1" maxLength={200} />
                            <Button 
                                icon={<Link size={16} />}
                                className="p-button-outlined"
                                onClick={() => setShowTrackingModal(true)}
                                tooltip="Gerar link com tracking"
                            />
                        </div>
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
                            <div className="contador-caracters">{mensagem.length}/800</div>
                        </div>

                        <div className="template-buttons">
                            <Button className="p-button-text" onClick={() => aplicarFormato("*")}><Bold size={16} /></Button>
                            <Button className="p-button-text" onClick={() => aplicarFormato("_")}><Italic size={16} /></Button>
                            <Button className="p-button-text" onClick={() => aplicarFormato("~")}><Strikethrough size={16} /></Button>
                            <div className="relative">
                                <Button className="p-button-text" onClick={() => setShowEmojiPicker((prev) => !prev)}><Smile size={16} /></Button>
                                {showEmojiPicker && (
                                    <div className="absolute z-50 mt-2 right-0 bg-white border shadow-lg rounded">
                                        <EmojiPicker onEmojiClick={onEmojiClick} height={320} width={300} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="template-buttons">
                        {variaveis.map(({ label, value }) => (
                            <Button
                                key={value}
                                label={label}
                                className={`p-button-sm ${variaveisUsadas.includes(value) ? 'p-button-outlined p-button-secondary' : 'p-button-primary'}`}
                                onClick={() => inserirVariavel(value)}
                            />
                        ))}
                    </div>

                    <div className="template-buttons">
                        <Button label="Voltar" icon="pi pi-arrow-left" onClick={() => navigate("/nova-campanha/importar")} />
                        <Button 
                            label="Envio Teste" 
                            icon="pi pi-send" 
                            className="p-button-outlined"
                            onClick={() => setShowTesteModal(true)}
                            disabled={!mensagem.trim() || !url.trim() || !labelBotao.trim()}
                        />
                        <Button label="Próximo" icon="pi pi-arrow-right" onClick={handleProximo} />
                    </div>
                </div>

                {/* Pré-visualização à direita */}
                <div className="template-preview">
                    <div className="whatsapp-box">
                        <div className="whatsapp-header">18 Abr 2025</div>
                        {header && <div className="font-bold text-center text-black text-sm mb-2">{header}</div>}
                        <div className="whatsapp-message">
                            {mensagem || "Sua mensagem aparecerá aqui..."}
                        </div>
                        {footer && <div className="whatsapp-footer">{footer}</div>}
                        {url && labelBotao && (
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="whatsapp-button"
                            >
                                {labelBotao}
                            </a>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Tracking */}
            <Dialog 
                header="Gerar Link com Tracking" 
                visible={showTrackingModal} 
                style={{ width: '600px' }}
                onHide={() => setShowTrackingModal(false)}
                modal
            >
                <div className="p-4">
                    <div className="mb-4">
                        <label className="font-semibold block mb-2">Cole seu link original:</label>
                        <InputText
                            value={linkOriginal}
                            onChange={(e) => setLinkOriginal(e.target.value)}
                            placeholder="https://www.exemplo.com/pagina"
                            className="w-full"
                        />
                    </div>

                    <div className="flex justify-center mb-4">
                        <Button 
                            label="Processar Link" 
                            onClick={processarLink}
                            disabled={!linkOriginal.trim() || isProcessing}
                            className="p-button-primary"
                        />
                    </div>

                    {isProcessing && (
                        <div className="text-center mb-4">
                            <ProgressSpinner size="50" />
                            <p className="mt-2">Processando link...</p>
                        </div>
                    )}

                    {linkTrackeado && (
                        <div className="mb-4">
                            <label className="font-semibold block mb-2">Link com tracking:</label>
                            <div className="flex gap-2">
                                <InputText
                                    value={linkTrackeado}
                                    className="flex-1"
                                    readOnly
                                />
                                <Button
                                    icon={copySuccess ? <Check size={16} /> : <Copy size={16} />}
                                    className="p-button-outlined"
                                    onClick={() => copiarLink(linkTrackeado)}
                                />
                            </div>
                        </div>
                    )}

                    {linkEncurtado && (
                        <div className="mb-4">
                            <label className="font-semibold block mb-2">
                                {linkEncurtado === linkTrackeado ? 
                                    "Link com tracking (não foi possível encurtar):" : 
                                    "Link encurtado (recomendado):"
                                }
                            </label>
                            <div className="flex gap-2">
                                <InputText
                                    value={linkEncurtado}
                                    className="flex-1"
                                    readOnly
                                />
                                <Button
                                    icon={copySuccess ? <Check size={16} /> : <Copy size={16} />}
                                    className="p-button-outlined"
                                    onClick={() => copiarLink(linkEncurtado)}
                                />
                            </div>
                            {linkEncurtado === linkTrackeado && (
                                <small className="text-orange-600 block mt-1">
                                    ⚠️ Serviços de encurtamento indisponíveis. O link mantém o tracking.
                                </small>
                            )}
                        </div>
                    )}

                    {linkEncurtado && (
                        <div className="flex justify-end gap-2">
                            <Button 
                                label="Cancelar" 
                                className="p-button-text"
                                onClick={() => setShowTrackingModal(false)}
                            />
                            <Button 
                                label="Usar Este Link" 
                                className="p-button-primary"
                                onClick={usarLinkEncurtado}
                            />
                        </div>
                    )}

                    <div className="mt-4 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                        <h4 className="font-semibold text-blue-800 mb-2">Como funciona:</h4>
                        <ul className="text-sm text-blue-700 space-y-1">
                            <li>• Adiciona automaticamente: utm_source=whatsappCtrlLabs</li>
                            <li>• Adiciona automaticamente: utm_medium={campanhaId || 'XX'}</li>
                            <li>• Encurta o link para facilitar o envio</li>
                            <li>• Mantém todos os parâmetros originais</li>
                        </ul>
                    </div>
                </div>
            </Dialog>

            {/* Modal de Envio Teste */}
            <Dialog 
                header="📱 Envio de Teste" 
                visible={showTesteModal} 
                style={{ width: '700px' }}
                onHide={() => setShowTesteModal(false)}
                modal
            >
                <div className="p-4">
                    {/* Campo telefone */}
                    <div className="mb-4">
                        <label className="font-semibold block mb-2">📞 Número de telefone para teste:</label>
                        <InputText
                            value={telefoneTest}
                            onChange={(e) => setTelefoneTest(e.target.value)}
                            placeholder="5511999999999 (apenas números)"
                            className="w-full"
                        />
                        <small className="text-gray-600">Digite apenas números, ex: 5511999999999</small>
                    </div>

                    {/* Variáveis de teste */}
                    <div className="mb-4">
                        <h4 className="font-semibold mb-3">🔧 Variáveis para teste:</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                                <label className="text-sm font-medium block mb-1">Variável A:</label>
                                <InputText
                                    value={variavelATest}
                                    onChange={(e) => setVariavelATest(e.target.value)}
                                    placeholder="Ex: João Silva"
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Variável B:</label>
                                <InputText
                                    value={variavelBTest}
                                    onChange={(e) => setVariavelBTest(e.target.value)}
                                    placeholder="Ex: Produto Teste"
                                    className="w-full"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Variável C:</label>
                                <InputText
                                    value={variavelCTest}
                                    onChange={(e) => setVariavelCTest(e.target.value)}
                                    placeholder="Ex: 10% desconto"
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Preview da mensagem */}
                    <div className="mb-4">
                        <h4 className="font-semibold mb-2">👀 Preview da mensagem que será enviada:</h4>
                        <div className="bg-gray-50 p-4 rounded border">
                            <div className="whatsapp-preview-mini">
                                {header && <div className="font-bold text-sm mb-2 text-center">{header}</div>}
                                <div className="bg-white p-3 rounded mb-2 text-sm">
                                    {previewMensagemTeste() || "Sua mensagem aparecerá aqui..."}
                                </div>
                                {footer && <div className="text-xs text-gray-600 text-center mb-2">{footer}</div>}
                                {url && labelBotao && (
                                    <div className="bg-green-500 text-white text-center py-2 px-4 rounded text-sm font-medium">
                                        {labelBotao}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Aviso */}
                    <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                        <div className="flex items-start">
                            <span className="text-yellow-600 mr-2">⚠️</span>
                            <div className="text-sm text-yellow-800">
                                <strong>Atenção:</strong> Este envio de teste utilizará a configuração de WhatsApp 
                                vinculada à campanha. Certifique-se de que o número está correto e que você tem 
                                permissão para enviar mensagens para ele.
                            </div>
                        </div>
                    </div>

                    {/* Loading */}
                    {enviandoTeste && (
                        <div className="text-center mb-4">
                            <ProgressSpinner size="40" />
                            <p className="mt-2 text-blue-600">Enviando mensagem de teste...</p>
                        </div>
                    )}

                    {/* Botões */}
                    <div className="flex justify-end gap-3">
                        <Button 
                            label="Cancelar" 
                            className="p-button-text"
                            onClick={() => setShowTesteModal(false)}
                            disabled={enviandoTeste}
                        />
                        <Button 
                            label={enviandoTeste ? "Enviando..." : "📨 Enviar Teste"} 
                            className="p-button-success"
                            onClick={enviarTeste}
                            disabled={!telefoneTest.trim() || enviandoTeste}
                        />
                    </div>
                </div>
            </Dialog>
        </div>
    );
}
