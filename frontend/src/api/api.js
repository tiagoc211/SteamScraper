// frontend/src/api/api.js

import axios from 'axios';

// --- CONFIGURAÇÃO PARA A API DO SEU BACKEND ---
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const apiClient = axios.create({
  baseURL: BACKEND_URL,
  withCredentials: true,
});


// ===================================================================================
// LÓGICA PARA A BARRA DE PESQUISA DO HEADER (USA API EXTERNA ByMykel)
// ===================================================================================
const CSGO_API_BASE = 'https://raw.githubusercontent.com/ByMykel/CSGO-API/main/public/api/en';
let searchCache = null;

const normalizeString = (str) => {
  if (!str) return '';
  return str.toLowerCase().replace(/[★|™()]/g, '').replace(/\s+/g, ' ').trim();
};

const formatItemName = (item) => {
  const isSpecial = item.weapon?.name?.includes('Knife') || item.weapon?.name?.includes('Gloves');
  return isSpecial ? `★ ${item.name}` : item.name;
};

const populateSearchCache = async () => {
  if (searchCache) return searchCache;
  try {
    const [skinsRes, keychainsRes, agentsRes] = await Promise.all([
      fetch(`${CSGO_API_BASE}/skins.json`),
      fetch(`${CSGO_API_BASE}/keychains.json`),
      fetch(`${CSGO_API_BASE}/agents.json`)
    ]);
    const skins = await skinsRes.json();
    const keychains = await keychainsRes.json();
    const agents = await agentsRes.json();

    const allItems = [
      ...skins.map(item => ({...item, name: formatItemName(item)})),
      ...keychains,
      ...agents
    ].map(item => ({...item, market_hash_name: item.market_hash_name || item.name, searchableName: normalizeString(item.name)}));

    searchCache = allItems;
    console.log(`API search cache filled with ${allItems.length} items.`);
    return searchCache;
  } catch (error) {
    console.error("Failed to populate API search cache:", error);
    return [];
  }
};
populateSearchCache();

export const searchSkinsByQuery = async (query) => {
  const allItems = await populateSearchCache();
  if (!allItems || allItems.length === 0) return [];
  const searchTerms = normalizeString(query).split(' ');
  return allItems.filter(item => searchTerms.every(term => item.searchableName.includes(term))).slice(0, 50);
};


// ===================================================================================
// LÓGICA PARA A PÁGINA /SKINS (USA A SUA BASE DE DADOS com paginação)
// ===================================================================================

export const getBrowseItemsFromDB = async (params) => {
  try {
    const response = await apiClient.get('/api/items', { params });
    const mappedData = {
      ...response.data,
      items: response.data.items.map(dbItem => {
        const rarityMap = {
            1: { name: 'Common', color: '#b0c3d9' }, 2: { name: 'Uncommon', color: '#5e98d9' },
            3: { name: 'Rare', color: '#4b69ff' }, 4: { name: 'Mythical', color: '#8847ff' },
            5: { name: 'Legendary', color: '#d32ce6' }, 6: { name: 'Ancient', color: '#eb4b4b' },
            7: { name: 'Exceedingly Rare', color: '#ffd700' },
        };
        const rarityInfo = rarityMap[dbItem.rarity] || { name: 'Unknown', color: 'grey' };

        // CORREÇÃO: Mapeia todos os dados que vêm do JOIN
        return {
            id: dbItem.listing_id, // Usar o listing_id como chave única
            name: dbItem.market_hash_name, 
            image: dbItem.icon_url ? `https://community.akamai.steamstatic.com/economy/image/${dbItem.icon_url}` : '', 
            category: { name: dbItem.category_name || 'Unknown' }, 
            rarity: rarityInfo,
            stattrak: dbItem.stattrak,
            souvenir: dbItem.souvenir,
            // Passa os novos campos para o card
            float: dbItem.float_value, // O nome da coluna na tabela listings
            pattern: dbItem.paint_seed,
            price: dbItem.price, // O preço já vem da tabela listings
            stickers: dbItem.stickers,
            keychains: dbItem.keychains,
        };
      })
    };
    return mappedData;
  } catch (error) {
    console.error('Error fetching browse items from DB:', error);
    return { items: [], pagination: { totalPages: 0 } };
  }
};


// ===================================================================================
// FUNÇÕES RESTANTES (PARA PÁGINA DE DETALHES, ETC.)
// ===================================================================================

export const getSubscriptionPlans = async () => {
  try {
    const response = await apiClient.get('/api/subscriptions');
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return null;
  }
};

export const getSkinDetails = async (marketHashName, signal) => {
  try {
    const response = await apiClient.get(`/api/skin/${encodeURIComponent(marketHashName)}`, { signal });
    return response.data;
  } catch (err) {
    if (!axios.isCancel(err)) console.error('Error fetching skin details:', err);
    return null;
  }
};

export const getSkinPage = async (marketHashName, pageNumber, signal) => {
    try {
        const { data } = await apiClient.get(`/api/skin/${marketHashName}/page/${pageNumber}`, { signal });
        return data;
    } catch (err) {
        if (!axios.isCancel(err)) console.error(`Error fetching skin page ${pageNumber}:`, err);
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