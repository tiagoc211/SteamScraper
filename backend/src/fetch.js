const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const { knives } = require('./data');
// NOVO: Importar os agentes e o nosso gestor de proxy
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const proxyManager = require('./proxyManager');

const BASE_LISTING_URL = 'https://steamcommunity.com/market/listings/730';
const BASE_SEARCH_URL = 'https://steamcommunity.com/market/search/render/';

// REMOVIDO: A função wrapWithScrapeDo foi removida.

const fetcher = {
  fetchFirstPage: null,
  fetchSpecificPage: null,
  fetchSearchPage: null,
  ready: null
};

// NOVO: Função para criar o agente de proxy correto
function createProxyAgent(proxy) {
  const proxyUrl = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
  if (proxy.protocol.startsWith('socks')) {
    return new SocksProxyAgent(proxyUrl);
  } else {
    return new HttpsProxyAgent(proxyUrl);
  }
}

async function initialize() {

  // ALTERADO: A função fetchPage foi reescrita para usar o proxy manager
  async function fetchPage(url, itemName, pageNumber, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`➡️ A buscar [${itemName}] (página ${pageNumber}, tentativa ${attempt})...`);
      
      // 1. Adquirir um proxy para esta tentativa
      const proxy = await proxyManager.acquire(itemName); // Usamos o nome do item como session_id
      if (!proxy) {
        console.error("❌ Não foi possível adquirir um proxy. A abortar tentativa.");
        await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar antes de tentar de novo
        continue;
      }
      
      const agent = createProxyAgent(proxy);
      let success = false;

      try {
        // 2. Fazer o pedido à Steam USANDO o proxy através do agent
        const response = await fetch(url, {
          agent, // <-- A magia acontece aqui!
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://steamcommunity.com/market/search?appid=730'
          },
          timeout: 15000 // Timeout de 15 segundos
        });

        if (!response.ok) {
          throw new Error(`Erro HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) { // A Steam pode retornar 200 OK mas com "success": false
            throw new Error('A API da Steam retornou "success": false');
        }

        console.log(`✔️ Sucesso para [${itemName}] (página ${pageNumber}) com o proxy ${proxy.proxy_key}`);
        success = true; // Marcar como sucesso
        return data;

      } catch (err) {
        console.error(`❌ Falha para [${itemName}] (página ${pageNumber}, tentativa ${attempt}) usando o proxy ${proxy.proxy_key}: ${err.message}`);
        if (attempt === maxRetries) return null;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      } finally {
        // 3. Reportar o resultado do uso do proxy
        await proxyManager.report(proxy.proxy_key, success);
      }
    }
    return null; // Retorna null se todas as tentativas falharem
  }

  function AddStar(itemName) {
    if (!itemName.startsWith("★ ") && knives.some(knife => itemName.startsWith(knife))) {
      return "★ " + itemName;
    }
    return itemName;
  }

  // ALTERADO: As funções agora usam as URLs diretas da Steam
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

  async function fetchSearchPage(query, start = 0, count = 10) {
    const url = `${BASE_SEARCH_URL}?query=${encodeURIComponent(query)}&appid=730&start=${start}&count=${count}&country=PT&language=portuguese&currency=3`;
    return await fetchPage(url, `Busca por "${query}"`, 1);
  }

  fetcher.fetchFirstPage = fetchFirstPage;
  fetcher.fetchSpecificPage = fetchSpecificPage;
  fetcher.fetchSearchPage = fetchSearchPage;

  console.log("Módulo fetch inicializado com Proxy Manager personalizado.");
}

fetcher.ready = initialize().catch(err => { 
  console.error("Falha ao inicializar fetch.js:", err); 
  process.exit(1); 
});

module.exports = fetcher;