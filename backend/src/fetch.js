const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const SCRAPEDO_TOKEN = 'ce5b103fcb1f4c35b806930ffe77bf8a545567f2118';
const BASE_LISTING_URL = 'https://steamcommunity.com/market/listings/730';
const BASE_SEARCH_URL = 'https://steamcommunity.com/market/search/render/';

function wrapWithScrapeDo(steamUrl) {
  return `http://api.scrape.do/?url=${encodeURIComponent(steamUrl)}&token=${SCRAPEDO_TOKEN}`;
}

const fetcher = {
  fetchFirstPage: null,
  fetchSpecificPage: null,
  fetchSearchPage: null,
  ready: null
};

async function initialize() {

  async function fetchPage(url, itemName, pageNumber, maxRetries = 3) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`➡️ A buscar [${itemName}] (página ${pageNumber}, tentativa ${attempt})...`);
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
        });

        if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);

        const data = await response.json();
        console.log(`✔️ Sucesso para [${itemName}] (página ${pageNumber})`);
        return data;
      } catch (err) {
        console.error(`❌ Falha para [${itemName}] (página ${pageNumber}, tentativa ${attempt}): ${err.message}`);
        if (attempt === maxRetries) return null;
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  async function fetchFirstPage(itemName) {
    const url = wrapWithScrapeDo(`${BASE_LISTING_URL}/${encodeURIComponent(itemName)}/render/?start=0&count=100&country=PT&language=portuguese&currency=3`);
    console.log('URL da Steam (primeira página):', url);
    return await fetchPage(url, itemName, 1);
  }

  async function fetchSpecificPage(itemName, pageNumber) {
    const start = (pageNumber - 1) * 100;
    const url = wrapWithScrapeDo(`${BASE_LISTING_URL}/${encodeURIComponent(itemName)}/render/?start=${start}&count=100&country=PT&language=portuguese&currency=3`);
    console.log('URL da Steam (Página especifica):', url);
    return await fetchPage(url, itemName, pageNumber);
  }

  async function fetchSearchPage(query, start = 0, count = 10) {
    const url = wrapWithScrapeDo(`${BASE_SEARCH_URL}?query=${encodeURIComponent(query)}&appid=730&start=${start}&count=${count}&country=PT&language=portuguese&currency=3`);
    return await fetchPage(url, `Busca por "${query}"`, 1);
  }

  fetcher.fetchFirstPage = fetchFirstPage;
  fetcher.fetchSpecificPage = fetchSpecificPage;
  fetcher.fetchSearchPage = fetchSearchPage;

  console.log("Módulo fetch inicializado com ScrapeDo.");
}

fetcher.ready = initialize().catch(err => { 
  console.error("Falha ao inicializar fetch.js:", err); 
  process.exit(1); 
});

module.exports = fetcher;
