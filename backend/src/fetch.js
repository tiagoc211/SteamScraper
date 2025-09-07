// --- fetch.js (Proxy Fixo e Cookies) ---

require('dotenv').config();
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const { HttpsProxyAgent } = require('https-proxy-agent');

const steamCookie = process.env.STEAM_LOGIN_SECURE_COOKIE;
if (!steamCookie) {
  console.warn("AVISO: O cookie STEAM_LOGIN_SECURE_COOKIE não está definido no .env. Os pedidos podem falhar.");
}

const fetcher = {
  fetchFirstPage: null,
  fetchSpecificPage: null,
  ready: null
};

async function initialize() {
  const MUBENG_PROXY_URL = 'http://pool-basic-cc-mt:d8zcnxc0e6kvlcit@residential.byteproxies.io:8888';
  const agent = new HttpsProxyAgent(MUBENG_PROXY_URL);
  
  const BASE_LISTING_URL = 'https://steamcommunity.com/market/listings/730';

  async function fetchPage(url, itemName, pageNumber, maxRetries = 5) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`➡️  A buscar [${itemName}] (página ${pageNumber}, tentativa ${attempt})...`);
      try {
        const response = await fetch(url, { 
          agent, 
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
            'Referer': 'https://steamcommunity.com/market/',
            'Cookie': `steamLoginSecure=${steamCookie}`
          },
          timeout: 25000
        });
        
        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
        const text = await response.text();
        if (!text) throw new Error('Resposta vazia da Steam.');
        const data = JSON.parse(text);
        if (data.success === false) throw new Error('API da Steam retornou "success": false.');

        console.log(`✔️  Sucesso para [${itemName}] (página ${pageNumber})`);
        return data;
      } catch (error) {
        console.error(`❌  Falha para [${itemName}] (tentativa ${attempt}): ${error.message}`);
        if (attempt === maxRetries) return null;
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  async function fetchFirstPage(itemName, currency = 3) {
    const url = `${BASE_LISTING_URL}/${encodeURIComponent(itemName)}/render/?start=0&count=100&currency=${currency}`;
    return await fetchPage(url, itemName, 1);
  }

  async function fetchSpecificPage(itemName, pageNumber, currency = 3) {
    const start = (pageNumber - 1) * 100;
    const url = `${BASE_LISTING_URL}/${encodeURIComponent(itemName)}/render/?start=${start}&count=100&currency=${currency}`;
    return await fetchPage(url, itemName, pageNumber);
  }

  fetcher.fetchFirstPage = fetchFirstPage;
  fetcher.fetchSpecificPage = fetchSpecificPage;
  console.log("Módulo de fetch (Proxy Fixo) inicializado e pronto.");
}

fetcher.ready = initialize().catch(err => { console.error("Falha ao inicializar fetch.js:", err); process.exit(1); });

module.exports = fetcher;