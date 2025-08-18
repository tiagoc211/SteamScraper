// --- fetch.js Otimizado para "Passo Único" ---

// Ignora erros de certificado SSL para todas as requisições.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
const { HttpsProxyAgent } = require('https-proxy-agent');

const fetcher = {
  fetchAllListingsPages: null,
  ready: null
};

async function initialize() {
  const pLimit = (await import('p-limit')).default;
  
  const MUBENG_PROXY_URL = 'http://localhost:8089';
  const agent = new HttpsProxyAgent(MUBENG_PROXY_URL);
  const BASE_LISTING_URL = 'https://steamcommunity.com/market/listings/730';

  async function fetchPage(itemName, start) {
    const encodedItem = encodeURIComponent(itemName);
    const steamUrl = `${BASE_LISTING_URL}/${encodedItem}/render/?start=${start}&count=100&country=PT&language=portuguese&currency=3`;
    const pageNumber = start / 100 + 1;
    console.log(`➡️  A buscar [${itemName}] (página ${pageNumber})...`);
    try {
      const response = await fetch(steamUrl, { agent, headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!response.ok) throw new Error(`Erro HTTP ${response.status}`);
      const data = await response.json();
      console.log(`✔️  Sucesso para [${itemName}] (página ${pageNumber})`);
      return data;
    } catch (error) {
      console.error(`❌  Falha para [${itemName}] (página ${pageNumber}): ${error.message}`);
      return null;
    }
  }
  
  async function fetchAllListingsPages(itemName) {
    console.log(`\n🚀 A iniciar busca otimizada para o item: ${itemName}`);
    
    // 1. (OTIMIZAÇÃO) Busca a primeira página diretamente em JSON
    const firstPageData = await fetchPage(itemName, 0);

    if (!firstPageData || !firstPageData.success || typeof firstPageData.total_count === 'undefined') {
      console.error(`Falha crítica ao obter a primeira página para ${itemName}. A cancelar.`);
      return null;
    }

    const totalListings = firstPageData.total_count;
    const totalPages = Math.ceil(totalListings / 100);
    console.log(`ℹ️  Item tem ${totalListings} listagens em ${totalPages} páginas.`);

    const allPages = [firstPageData];

    // 2. Se houver mais páginas, busca as restantes em paralelo
    if (totalPages > 1) {
      const limit = pLimit(15);
      const tasks = [];
      // Começa o loop a partir da segunda página (i = 1)
      for (let i = 1; i < totalPages; i++) {
        tasks.push(limit(() => fetchPage(itemName, i * 100)));
      }
      
      console.log(`⏳ A executar ${tasks.length} buscas restantes em paralelo...`);
      const remainingPages = await Promise.all(tasks);
      allPages.push(...remainingPages.filter(Boolean));
    }
    
    console.log(`🏁 Concluído: ${allPages.length} de ${totalPages} páginas obtidas para [${itemName}].`);
    return allPages;
  }
  
  fetcher.fetchAllListingsPages = fetchAllListingsPages;
  console.log("Módulo de fetch (otimizado) inicializado e pronto.");
}

fetcher.ready = initialize().catch(err => { console.error("Falha ao inicializar fetch.js:", err); process.exit(1); });

module.exports = fetcher;