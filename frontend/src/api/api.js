import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// << CORREÇÃO >> Centraliza a configuração da API aqui.
// Todos os pedidos usarão este 'apiClient' para falar com o backend na porta correta.
const apiClient = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  withCredentials: true, // Aponta para o backend na porta 3001
});

/**
 * Busca a primeira página de detalhes de uma skin.
 * @param {string} marketHashName - O nome completo da skin.
 * @param {AbortSignal} signal - O sinal para cancelar o pedido.
 * @returns {Promise<Object|null>} - Os detalhes da skin ou null em caso de erro.
 */
export const getSkinDetails = async (marketHashName, signal) => {
  try {
    const response = await apiClient.get(`/skin/limitado/${encodeURIComponent(marketHashName)}`, { signal });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Pedido de detalhes da skin cancelado.');
    } else {
      console.error("Erro ao obter detalhes da skin:", error);
    }
    return null;
  }
};

/**
 * Busca uma página específica de listings de uma skin.
 * @param {string} marketHashName - O nome completo da skin.
 * @param {number} pageNumber - O número da página a buscar.
 * @param {AbortSignal} signal - O sinal para cancelar o pedido.
 * @returns {Promise<Object|null>} - Os listings da página ou null em caso de erro.
 */
export const getSkinPage = async (marketHashName, pageNumber, signal) => {
  try {
    const response = await apiClient.get(`/skin/${encodeURIComponent(marketHashName)}/page/${pageNumber}`, { signal });
    return response.data;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log(`Pedido da página ${pageNumber} cancelado.`);
    } else {
      console.error(`Erro ao obter a página ${pageNumber} da skin:`, error);
    }
    return null;
  }
};

/**
 * Pede ao backend para inspecionar uma skin.
 * @param {string} inspectLink - O link de inspeção da Steam.
 * @returns {Promise<Object|null>} - Os dados da inspeção ou null em caso de erro.
 */
export const inspectSkin = async (inspectLink) => {
  try {
    const response = await apiClient.get(`/inspect?url=${encodeURIComponent(inspectLink)}`);
    return response.data;
  } catch (error) {
    console.error("Erro ao pedir inspeção ao backend:", error);
    return null;
  }
};

/**
 * Busca os planos de subscrição ativos do backend.
 * @returns {Promise<Array|null>} - Uma lista de planos ou null em caso de erro.
 */
export const getSubscriptionPlans = async () => {
  try {
    const response = await apiClient.get('/subscriptions');
    return response.data;
  } catch (error) {
    console.error("Erro ao obter planos de subscrição:", error);
    return null;
  }
};
