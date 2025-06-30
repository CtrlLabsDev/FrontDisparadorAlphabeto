import { Route, Routes, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Campanhas from "../pages/Campanhas";
import NovaCampanha from "../pages/NovaCampanha";
import DadosCampanha from "../pages/novaCampanha/DadosCampanha";
import ImportarDados from "../pages/novaCampanha/ImportarDados";
import Template from "../pages/novaCampanha/Template";
import Configuracoes from "../pages/novaCampanha/Configuracoes";
import Configuracao from "../pages/Configuracao/Configuracao";
import ConfiguracoesGerais from "../pages/Configuracao/Gerais";
import ConfiguracoesWhatsApp from "../pages/Configuracao/WhatsApp";
import ConfiguracoesUsuarios from "../pages/Configuracao/Usuarios";
import MessageCreator from "../pages/MessageCreator";
import Login from "../pages/LoginPage";
import Layout from "../components/Layout";
import PrivateRoute from "../pages/PrivateRoute";
import Inbox from "../pages/Inbox"; 
import Analytics from "../pages/Analytics";
import AnalyticsDados from "../pages/AnalyticsDados";
import BlacklistPage from "../pages/BlacklistPage";
import Monitoramento from "../pages/Monitoramento"; // ✅ nova importação

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<Home />} />
        <Route path="campanhas" element={<Campanhas />} />
        <Route path="nova-campanha" element={<NovaCampanha />} />
        <Route path="nova-campanha/dados" element={<DadosCampanha />} />
        <Route path="nova-campanha/importar" element={<ImportarDados />} />
        <Route path="nova-campanha/template" element={<Template />} />
        <Route path="nova-campanha/configuracoes" element={<Configuracoes />} />

        <Route path="configuracao" element={<Configuracao />}>
          <Route index element={<ConfiguracoesGerais />} />
          <Route path="whatsapp" element={<ConfiguracoesWhatsApp />} />
          <Route path="usuarios" element={<ConfiguracoesUsuarios />} />
        </Route>

        <Route path="message-creator" element={<MessageCreator />} />
        <Route path="inbox" element={<Inbox />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="analytics/dados" element={<AnalyticsDados />} />
        <Route path="blacklist" element={<BlacklistPage />} />
        <Route path="monitoramento" element={<Monitoramento />} /> {/* ✅ nova rota */}
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}