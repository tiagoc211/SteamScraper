process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const { HttpsProxyAgent } = require('https-proxy-agent');
const { knives } = require('./data');

const fetcher = {
  fetchFirstPage: null,
  fetchSpecificPage: null,
  fetchSearchPage: null,
  ready: null
};

function AddStar(itemName) {
  // procura se começa com algum nome de faca da lista
    if (!itemName.startsWith("★ ") && knives.some(knife => itemName.startsWith(knife))) {
      return "★ " + itemName;
    }
    return itemName;
  }


async function initialize() {
  // ## NOTA IMPORTANTE ##
  // Esta abordagem usa um ÚNICO endpoint de proxy fixo. Se este proxy falhar
  // ou for bloqueado, TODOS os pedidos irão falhar.
  // A sua lista de proxies anterior não será usada aqui.
  const MUBENG_PROXY_URL = 'http://pool-basic-cc-mt:d8zcnxc0e6kvlcit@residential.byteproxies.io:8888';
  const agent = new HttpsProxyAgent(MUBENG_PROXY_URL);
  
  const BASE_LISTING_URL = 'https://steamcommunity.com/market/listings/730';
  const BASE_SEARCH_URL = 'https://steamcommunity.com/market/search/render/';

  async function fetchPage(url, itemName, pageNumber, maxRetries = 5) { // Aumentado para 5 tentativas
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`➡️  A buscar [${itemName}] (página ${pageNumber}, tentativa ${attempt})...`);
      try {
        const response = await fetch(url, { 
          agent, 
          headers: { 
            // Cabeçalhos mais realistas para evitar bloqueios
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://steamcommunity.com/market/'
          },
          timeout: 25000 // Timeout mais longo
        });
        
        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
        
        const text = await response.text();
        if (!text) throw new Error('Resposta vazia da Steam.');

        const data = JSON.parse(text);
        if (data.success === false) throw new Error('API da Steam retornou "success": false.');

        console.log(`✔️  Sucesso para [${itemName}] (página ${pageNumber})`);
        return data;
      } catch (error) {
        console.error(`❌  Falha para [${itemName}] (página ${pageNumber}, tentativa ${attempt}): ${error.message}`);
        if (attempt === maxRetries) {
          console.error(`Falha permanente para [${itemName}] após ${maxRetries} tentativas.`);
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Espera crescente
      }
    }
  }

  async function fetchFirstPage(itemName) {
    itemName = AddStar(itemName);
    const url = `${BASE_LISTING_URL}/${encodeURIComponent(itemName)}/render/?start=0&count=100&country=PT&language=portuguese&currency=3`;
    return await fetchPage(url, itemName, 1);
  }

  async function fetchSpecificPage(itemName, pageNumber) {
    itemName = AddStar(itemName);
    const start = (pageNumber - 1) * 100;
    const url = `${BASE_LISTING_URL}/${encodeURIComponent(itemName)}/render/?start=${start}&count=100&country=PT&language=portuguese&currency=3`;
    return await fetchPage(url, itemName, pageNumber);
  }
  
  async function fetchSearchPage(query, start, count) {
      const params = new URLSearchParams({
          query: query, start: start, count: count,
          search_descriptions: 1, sort_column: 'popular', sort_dir: 'desc',
          appid: 730, norender: 1
      });
      const url = `${BASE_SEARCH_URL}?${params.toString()}`;
      return await fetchPage(url, `Busca por "${query}"`, 1);
  }

  fetcher.fetchFirstPage = fetchFirstPage;
  fetcher.fetchSpecificPage = fetchSpecificPage;
  fetcher.fetchSearchPage = fetchSearchPage;
  console.log("Módulo de fetch (Proxy Fixo) inicializado e pronto.");
}

fetcher.ready = initialize().catch(err => { console.error("Falha ao inicializar fetch.js:", err); process.exit(1); });

module.exports = fetcher;