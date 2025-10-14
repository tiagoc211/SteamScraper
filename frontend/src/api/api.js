import axios from 'axios';


const CSGO_API_BASE = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en';

// Cache para armazenar os dados e evitar múltiplas chamadas
let itemsCache = null;

/**
 * Busca e armazena em cache todos os itens da API externa.
 * Agora usa 'skins.json' para obter os dados base das skins.
 * @returns {Promise<Array>} Uma promessa que resolve para a lista de itens.
 */
const getAllSkins = async () => {
  if (itemsCache) {
    return itemsCache;
  }
  try {
    console.log("A buscar e a colocar em cache a lista de skins pela primeira vez...");
    // Usamos o endpoint 'skins.json' que agrupa por skin base
    const response = await fetch(`${CSGO_API_BASE}/skins.json`);
    if (!response.ok) {
      throw new Error(`Erro na API CSGO: ${response.statusText}`);
    }
    const data = await response.json();
    itemsCache = data;
    console.log(`Cache preenchido com ${data.length} skins base.`);
    return data;
  } catch (error) {
    console.error("Falha ao buscar a lista de skins:", error);
    return [];
  }
};

// Pré-aquece o cache em segundo plano.
getAllSkins();

/**
 * Procura skins na lista em cache.
 * @param {string} query - O termo a ser procurado.
 * @returns {Promise<Array>} Uma lista filtrada de skins.
 */
export const searchSkinsByQuery = async (query) => {
  const lowerCaseQuery = query.toLowerCase();
  const allSkins = await getAllSkins();

  if (!allSkins || allSkins.length === 0) {
    return [];
  }

  // Filtra as skins cujo nome inclui o termo pesquisado
  const filteredSkins = allSkins.filter(skin =>
    skin.name.toLowerCase().includes(lowerCaseQuery)
  );

  return filteredSkins.slice(0, 50); // Retorna até 50 resultados
};

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
    const response = await apiClient.get(`/skin/${encodeURIComponent(marketHashName)}`, { signal });
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
