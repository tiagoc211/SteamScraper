// src/api/api.js

import axios from 'axios';

// --- CONFIGURAÇÃO PARA A API DO SEU BACKEND ---
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Esta é a instância do axios que estava em falta
const apiClient = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});


// --- LÓGICA PARA A API EXTERNA DO CSGO (PARA A PESQUISA) ---
const CSGO_API_BASE = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en';

let itemsCache = null;

const normalizeString = (str) => {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/[★|™()]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const formatItemName = (item) => {
  const isSpecial = item.weapon?.name?.includes('Knife') || item.weapon?.name?.includes('Gloves');
  return isSpecial ? `★ ${item.name}` : item.name;
};

const getAllItems = async () => {
  if (itemsCache) {
    return itemsCache;
  }
  try {
    console.log("Fetching and caching the complete item list for the first time...");
    
    const [skinsRes, collectiblesRes, agentsRes] = await Promise.all([
      fetch(`${CSGO_API_BASE}/skins.json`),
      fetch(`${CSGO_API_BASE}/collectibles.json`),
      fetch(`${CSGO_API_BASE}/agents.json`)
    ]);

    const skins = await skinsRes.json();
    const collectibles = await collectiblesRes.json();
    const agents = await agentsRes.json();

    const allItems = [
        ...skins.map(item => ({...item, name: formatItemName(item)})),
        ...collectibles,
        ...agents
    ].map(item => ({
      ...item,
      searchableName: normalizeString(item.name) 
    }));

    itemsCache = allItems;
    console.log(`Cache filled with ${allItems.length} items.`);
    return itemsCache;
  } catch (error) {
    console.error("Failed to fetch the item list:", error);
    return [];
  }
};

getAllItems();

// Esta é a sua função de pesquisa inteligente
export const searchSkinsByQuery = async (query) => {
  const allItems = await getAllItems();
  if (!allItems || allItems.length === 0) return [];
  const searchTerms = normalizeString(query).split(' ');
  const filtered = allItems.filter(item => {
    return searchTerms.every(term => item.searchableName.includes(term));
  });
  return filtered.slice(0, 50);
};


// --- FUNÇÕES QUE USAM O SEU BACKEND (E QUE ESTAVAM A CAUSAR ERROS) ---

// Para a página de subscrições
export const getSubscriptionPlans = async () => {
  try {
    const response = await apiClient.get('/api/subscriptions');
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return null;
  }
};

// Para a página de detalhes da skin
export const getSkinDetails = async (marketHashName, signal) => {
  try {
    const response = await apiClient.get(`/api/skin/${encodeURIComponent(marketHashName)}`, { signal });
    return response.data;
  } catch (err) {
    if (axios.isCancel(err)) {
      console.log('Request canceled:', err.message);
    } else {
      console.error('Error fetching skin details:', err);
    }
    return null;
  }
};

export const getSkinPage = async (marketHashName, pageNumber, signal) => {
    try {
        const { data } = await apiClient.get(`/api/skin/${marketHashName}/page/${pageNumber}`, { signal });
        return data;
    } catch (err) {
        if (!axios.isCancel(err)) {
          console.error(`Error fetching skin page ${pageNumber}:`, err);
        }
        return null;
    }
};

export const inspectSkin = async (inspectLink) => {
    try {
        const { data } = await apiClient.get(`/api/inspect?url=${encodeURIComponent(inspectLink)}`);
        return data;
    } catch (err) {
        console.error('Error inspecting skin:', err);
        return null;
    }
};