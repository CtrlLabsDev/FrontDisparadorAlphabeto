// services/api.js - Versão corrigida

import axios from 'axios';

// ✅ Configuração da API com melhor tratamento de erros
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://disparador.ctrllabs.com.br/api',
  timeout: 30000,  // ✅ Timeout de 30 segundos
  withCredentials: true,  // ✅ Importante para CORS com credenciais
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// ✅ Interceptor para requisições - Adicionar token JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // ✅ Log para debug
    console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      data: config.data
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// ✅ Interceptor para respostas - Tratamento de erros melhorado
api.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
      data: error.response?.data
    });
    
    // ✅ Tratamento específico de erros CORS
    if (error.code === 'ERR_NETWORK' || error.message.includes('CORS')) {
      console.error('🚫 CORS Error - Backend não está permitindo requisições do frontend');
      
      // Mostrar erro para o usuário
      if (typeof window !== 'undefined') {
        const errorMsg = 'Erro de conexão com o servidor. Verifique a configuração CORS.';
        // Se você tiver um sistema de notificação, use aqui
        // toast.error(errorMsg);
        console.error(errorMsg);
      }
    }
    
    // ✅ Tratamento de erro 401 (Não autorizado)
    if (error.response?.status === 401) {
      console.warn('🔐 Token expirado ou inválido. Redirecionando para login...');
      
      // Limpar storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      // Redirecionar para login (apenas no browser)
      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/login';
      }
    }
    
    // ✅ Tratamento de erro 403 (Proibido)
    if (error.response?.status === 403) {
      console.warn('🚫 Acesso negado. Verificar permissões.');
    }
    
    // ✅ Tratamento de erro 500 (Erro do servidor)
    if (error.response?.status >= 500) {
      console.error('🔥 Erro interno do servidor');
    }
    
    return Promise.reject(error);
  }
);

// ✅ Função helper para verificar se o token é válido
export const isTokenValid = () => {
  const token = localStorage.getItem("access_token");
  
  if (!token) return false;
  
  try {
    // Decode JWT payload (sem verificar assinatura)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    // Verificar se o token não expirou
    return payload.exp > currentTime;
  } catch (error) {
    console.error('Erro ao decodificar token:', error);
    return false;
  }
};

// ✅ Função helper para fazer login
export const login = async (credentials) => {
  try {
    const response = await api.post('/token/', credentials);
    
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      
      if (response.data.refresh) {
        localStorage.setItem('refresh_token', response.data.refresh);
      }
      
      console.log('✅ Login realizado com sucesso');
      return response.data;
    }
    
    throw new Error('Token não retornado');
  } catch (error) {
    console.error('❌ Erro no login:', error);
    throw error;
  }
};

// ✅ Função helper para logout
export const logout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  console.log('👋 Logout realizado');
};

// ✅ Função para testar conexão com API
export const testConnection = async () => {
  try {
    console.log('🔍 Testando conexão com API...');
    const response = await fetch(`${api.defaults.baseURL}/`, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin
      }
    });
    
    console.log('📡 Status da conexão:', response.status);
    console.log('🔧 Headers CORS:', {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
    });
    
    return response.ok;
  } catch (error) {
    console.error('❌ Falha no teste de conexão:', error);
    return false;
  }
};

export default api;
