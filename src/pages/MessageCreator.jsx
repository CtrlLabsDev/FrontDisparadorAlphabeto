import { InputTextarea } from "primereact/inputtextarea";
import { Button } from "primereact/button";
import { useState } from "react";

export default function MessageCreator() {
    const [message, setMessage] = useState("");

    const handleSendMessage = () => {
        console.log("Mensagem a ser enviada:", message);
    };

    return (
        <div className="flex justify-content-center align-items-center h-screen">
            <div className="card w-5">
                <h2>Criar Mensagem</h2>
                <InputTextarea
                    rows={5}
                    cols={30}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Digite sua mensagem aqui..."
                />
                <Button label="Enviar" icon="pi pi-check" className="mt-3" onClick={handleSendMessage} />
            </div>
        </div>
    );
}
