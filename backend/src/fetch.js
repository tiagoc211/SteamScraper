process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const { HttpsProxyAgent } = require('https-proxy-agent');
const { knives } = require('./data');
const pool = require('./db');

const fetcher = {
  fetchFirstPage: null,
  fetchSpecificPage: null,
  fetchSearchPage: null,
  ready: null
};

// Guarda o preço mais barato (primeira listing) no histórico
async function savePriceSnapshot(marketHashName, listings) {
  try {
    if (!listings || listings.length === 0) return;
    
    // Pegar os preços das listings
    const prices = listings
      .map(l => l.converted_price)
      .filter(p => p && p > 0);
    
    if (prices.length === 0) return;
    
    const today = new Date().toISOString().split('T')[0];
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    
    await pool.query(`
      INSERT INTO price_history 
        (market_hash_name, date, avg_price, min_price, max_price, listing_count)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (market_hash_name, date) 
      DO UPDATE SET
        avg_price = EXCLUDED.avg_price,
        min_price = EXCLUDED.min_price,
        max_price = EXCLUDED.max_price,
        listing_count = EXCLUDED.listing_count,
        updated_at = CURRENT_TIMESTAMP
    `, [marketHashName, today, avgPrice, minPrice, maxPrice, prices.length]);
    
    console.log(`📊 Preço guardado: ${marketHashName} = ${minPrice}¢`);
  } catch (error) {
    // Ignora erros silenciosamente (tabela pode não existir ainda)
  }
}

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

  const REQUEST_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/javascript, text/html, application/xml, text/xml, */*',
    'Accept-Language': 'en-US,en;q=0.9',
    'X-Requested-With': 'XMLHttpRequest',
    'Referer': 'https://steamcommunity.com/market/'
  };

  // O endpoint /render/ da Steam faz 302 para um URL canónico (G...) e remove o
  // segmento /render/. Aqui seguimos os redirects manualmente reinserindo /render/.
  async function fetchRenderJson(url, maxHops = 3) {
    let currentUrl = url;
    for (let hop = 0; hop <= maxHops; hop++) {
      const response = await fetch(currentUrl, {
        agent,
        redirect: 'manual',
        headers: REQUEST_HEADERS,
        timeout: 25000
      });

      if (response.status >= 300 && response.status < 400) {
        const loc = response.headers.get('location');
        if (!loc) throw new Error(`Redirect ${response.status} sem cabeçalho Location.`);
        currentUrl = loc.replace(/(\/listings\/730\/[^/?]+)(\?|$)/, '$1/render/$2');
        continue;
      }

      if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

      const text = await response.text();
      if (!text) throw new Error('Resposta vazia da Steam.');

      // Steam devolveu uma página HTML (bloqueio anti-bot / página genérica)
      if (text.trimStart().startsWith('<')) {
        const blockErr = new Error('Steam devolveu HTML em vez de JSON (bloqueio anti-bot).');
        blockErr.isHtmlBlock = true;
        throw blockErr;
      }

      const data = JSON.parse(text);
      if (data.success === false) throw new Error('API da Steam retornou "success": false.');
      return data;
    }

    const hopsErr = new Error('Demasiados redirects ao obter dados da Steam.');
    hopsErr.isHtmlBlock = true;
    throw hopsErr;
  }

  async function fetchPage(url, itemName, pageNumber, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const data = await fetchRenderJson(url);
        return data;
      } catch (error) {
        // Bloqueio HTML do Steam: não vale a pena repetir, falha de forma limpa.
        if (error.isHtmlBlock) {
          console.warn(`⚠️  Steam indisponível para [${itemName}] (p${pageNumber}): ${error.message} A usar dados da BD.`);
          return null;
        }
        if (attempt === maxRetries) {
          console.warn(`⚠️  Não foi possível obter [${itemName}] (p${pageNumber}) da Steam após ${maxRetries} tentativas: ${error.message} A usar dados da BD.`);
          return null;
        }
        await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
      }
    }
    return null;
  }

  async function fetchFirstPage(itemName) {
    itemName = AddStar(itemName);
    const url = `${BASE_LISTING_URL}/${encodeURIComponent(itemName)}/render/?start=0&count=100&country=PT&language=portuguese&currency=3`;
    const result = await fetchPage(url, itemName, 1);
    
    // Guardar snapshot do preço (não bloqueia a resposta)
    if (result && result.success && result.listinginfo) {
      const listings = Object.values(result.listinginfo);
      savePriceSnapshot(itemName, listings).catch(() => {});
    }
    
    return result;
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