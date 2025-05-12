import { TabView, TabPanel } from 'primereact/tabview';
import ConfiguracoesGerais from '../pages/Configuracao/Gerais';
import ConfiguracoesWhatsApp from '../pages/Configuracao/WhatsApp';
import ConfiguracoesUsuarios from '../pages/Configuracao/Usuarios';
import { useState } from 'react';
import "../styles/ConfiguracoesLayout.css";


export default function ConfiguracoesLayout() {
    const [activeIndex, setActiveIndex] = useState(0);

    return (
        <div className="p-4">
            <h2>Configurações</h2>
            <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
                <TabPanel header="Geral">
                    <ConfiguracoesGerais />
                </TabPanel>
                <TabPanel header="WhatsApps">
                    <ConfiguracoesWhatsApp />
                </TabPanel>
                <TabPanel header="Usuários">
                    <ConfiguracoesUsuarios />
                </TabPanel>
            </TabView>
        </div>
    );
}
