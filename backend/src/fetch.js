const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const SCRAPER_API_KEY = '4884690a8ffa8209e924678ba8c17e6c'; // <--- Coloca aqui a tua chave da ScraperAPI

const BASE_LISTING_URL = 'https://steamcommunity.com/market/listings/730';
const BASE_SEARCH_URL = 'https://steamcommunity.com/market/search/render/';

/**
 * Envolve qualquer URL da Steam com o endpoint do ScraperAPI
 */
function wrapWithScraperApi(steamUrl) {
  return `http://api.scraperapi.com/?api_key=${SCRAPER_API_KEY}&url=${encodeURIComponent(steamUrl)}`;
}

/**
 * Faz fetch a uma página de listagens da Steam Market.
 */
async function fetchPage(itemName, start = 0, count = 100) {
  const encodedItem = encodeURIComponent(itemName);
  const steamUrl = `${BASE_LISTING_URL}/${encodedItem}/render/?start=${start}&count=${count}&country=PT&language=portuguese&currency=3`;
  const url = wrapWithScraperApi(steamUrl);

  console.log(`📦 A obter [${itemName}] de ${start} a ${start + count}...`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Erro HTTP ${response.status} em: ${steamUrl}`);
      return null;
    }
    
    return await response.json();
  } catch (err) {
    console.error(`⚠️ Erro ao tentar obter ${itemName} (${start}): ${err.message}`);
    return null;
  }
}

/**
 * Faz fetch a uma página da Steam Search API.
 */
async function fetchSearchPage(query, start = 0, count = 10) {
  const steamUrl = `${BASE_SEARCH_URL}?query=${encodeURIComponent(query)}&appid=730&start=${start}&count=${count}&country=PT&language=portuguese&currency=3`;
  const url = wrapWithScraperApi(steamUrl);

  console.log(`🔍 Search: ${query} (start=${start}, count=${count})`);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Erro HTTP ${response.status} em: ${steamUrl}`);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.error(`⚠️ Erro ao fazer fetch da search page: ${err.message}`);
    return null;
  }
}

module.exports = {
  fetchPage,
  fetchSearchPage,
};
