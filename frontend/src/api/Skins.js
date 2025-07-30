import axios from 'axios';

// O URL base do nosso backend
const apiClient = axios.create({
  baseURL: 'http://localhost:3001/api', 
});

/**
 * Pesquisa por skins no nosso backend.
 * @param {string} weapon - A arma selecionada (ex: "AK-47")
 * @param {string} query - O termo de pesquisa (ex: "Redline")
 * @returns {Promise<Array>} - Uma promessa que resolve para um array de resultados.
 */
export const searchSkins = async (weapon, query) => {
  try {
    const response = await apiClient.get('/search', {
      params: { weapon, query }
    });
    // O backend já nos dá um objeto com uma chave "results"
    return response.data.results || [];
  } catch (error) {
    console.error("Erro ao pesquisar skins:", error);
    // Retornar um array vazio em caso de erro para não quebrar o frontend
    return [];
  }
};

/**
 * Obtém os detalhes e listings de uma skin específica.
 * @param {string} marketHashName - O nome completo e único da skin.
 * @returns {Promise<Object|null>} - Os detalhes da skin ou null em caso de erro.
 */
export const getSkinDetails = async (marketHashName) => {
  try {
    // Usamos encodeURIComponent para garantir que caracteres especiais na URL são tratados
    const response = await apiClient.get(`/skin/${encodeURIComponent(marketHashName)}`);
    console.log("debug: " + response.data);
    return response.data;
  } catch (error) {
    console.error("Erro ao obter detalhes da skin:", error);
    return null;
  }
};