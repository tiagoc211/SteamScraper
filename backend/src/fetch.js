process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const { HttpsProxyAgent } = require('https-proxy-agent');
const { SocksProxyAgent } = require('socks-proxy-agent');
const proxyManager = require('./proxyManager');
const { knives } = require('./data');

const fetcher = {
  fetchFirstPage: null,
  fetchSpecificPage: null,
  fetchSearchPage: null,
  ready: null
};

function createProxyAgent(proxy) {
  const proxyUrl = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
  if (proxy.protocol.startsWith('socks')) {
    return new SocksProxyAgent(proxyUrl);
  } else {
    return new HttpsProxyAgent(proxyUrl);
  }
}

async function initialize() {
  const BASE_LISTING_URL = 'https://steamcommunity.com/market/listings/730';
  const BASE_SEARCH_URL = 'https://steamcommunity.com/market/search/render/';

  async function fetchPage(url, itemName, pageNumber, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`➡️  A buscar [${itemName}] (página ${pageNumber}, tentativa ${attempt})...`);
      
      const proxy = await proxyManager.acquire(`${itemName}-page-${pageNumber}`);
      if (!proxy) {
        console.error("❌ Não foi possível adquirir um proxy. A aguardar 5 segundos...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
      }
      
      const agent = createProxyAgent(proxy);
      let success = false;

      try {
        const response = await fetch(url, {
          agent,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'X-Requested-With': 'XMLHttpRequest',
            'Referer': 'https://steamcommunity.com/market/search?appid=730'
          },
          timeout: 15000
        });

        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            throw new Error('A resposta da Steam não é um JSON válido.');
        }
        if (!data.success) throw new Error('A API da Steam retornou "success": false');
        
        console.log(`✔️  Sucesso para [${itemName}] (página ${pageNumber}) com o proxy ${proxy.proxy_key}`);
        success = true;
        return data;
      } catch (error) {
        console.error(`❌  Falha para [${itemName}] (página ${pageNumber}, tentativa ${attempt}) com proxy ${proxy.proxy_key}:`, error.message);
      } finally {
        await proxyManager.report(proxy.proxy_key, success);
      }
      if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    console.error(`Falha permanente para [${itemName}] após ${maxRetries} tentativas.`);
    return null;
  }

  function addStarToKnife(itemName) {
    if (!itemName.startsWith("★ ") && knives.some(knife => itemName.startsWith(knife))) {
      return "★ " + itemName;
    }
    return itemName;
  }

  async function fetchFirstPage(itemName) {
    const finalItemName = addStarToKnife(itemName);
    const url = `${BASE_LISTING_URL}/${encodeURIComponent(finalItemName)}/render/?start=0&count=100&country=PT&language=portuguese&currency=3`;
    return await fetchPage(url, finalItemName, 1);
  }

  async function fetchSpecificPage(itemName, pageNumber) {
    const finalItemName = addStarToKnife(itemName);
    const start = (pageNumber - 1) * 100;
    // ===== A CORREÇÃO ESTÁ NESTA LINHA =====
    const url = `${BASE_LISTING_URL}/${encodeURIComponent(finalItemName)}/render/?start=${start}&count=100&country=PT&language=portuguese&currency=3`;
    // =======================================
    return await fetchPage(url, finalItemName, pageNumber);
  }
  
  async function fetchSearchPage(query, start, count) {
      const params = new URLSearchParams({
          query, start, count,
          search_descriptions: 1, sort_column: 'popular', sort_dir: 'desc',
          appid: 730, norender: 1
      });
      const url = `${BASE_SEARCH_URL}?${params.toString()}`;
      return await fetchPage(url, `Busca por "${query}"`, 1);
  }

  fetcher.fetchFirstPage = fetchFirstPage;
  fetcher.fetchSpecificPage = fetchSpecificPage;
  fetcher.fetchSearchPage = fetchSearchPage;
  console.log("Módulo de fetch (ligado ao Proxy Manager) inicializado e pronto.");
}

fetcher.ready = initialize().catch(err => { console.error("Falha ao inicializar fetch.js:", err); process.exit(1); });

module.exports = fetcher;