// backend/src/utils/steamPriceHistory.js
const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

/**
 * Busca o histórico de preços de um item da Steam Market
 * @param {string} marketHashName - Nome do item (ex: "AK-47 | Redline (Field-Tested)")
 * @returns {Array} Array de objetos com {date, price, volume}
 */
async function fetchSteamPriceHistory(marketHashName) {
  const appId = 730; // CS:GO
  const url = `https://steamcommunity.com/market/pricehistory/?appid=${appId}&market_hash_name=${encodeURIComponent(marketHashName)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://steamcommunity.com/market/',
        'Origin': 'https://steamcommunity.com',
        'Cookie': 'steamCountry=PT'
      }
    });

    if (response.status === 429) {
      console.warn(`⚠️  Rate limited by Steam, waiting 5 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return fetchSteamPriceHistory(marketHashName); // Retry
    }

    if (response.status === 400 || response.status === 404) {
      console.warn(`⚠️  Item not found or unavailable: ${marketHashName}`);
      return [];
    }

    if (!response.ok) {
      throw new Error(`Steam API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.prices || data.prices.length === 0) {
      console.warn(`⚠️  No price history found for: ${marketHashName}`);
      return [];
    }

    // Processar os dados da Steam
    // Formato: ["Feb 01 2026 01: +0", 123.45, "1234"]
    // [0] = data, [1] = preço em dólares, [2] = volume
    
    const processedData = data.prices.map(entry => {
      const dateStr = entry[0];
      const priceUSD = parseFloat(entry[1]);
      const volume = parseInt(entry[2]) || 0;
      
      // Converter data "Feb 01 2026 01: +0" para Date
      const date = new Date(dateStr.split(':')[0] + ':00:00 UTC');
      
      // Converter USD para EUR (aproximado, taxa fixa de 0.92)
      // Idealmente usaria uma API de conversão, mas para simplificar...
      const priceEUR = Math.round(priceUSD * 0.92 * 100); // em cêntimos
      
      return {
        date: date.toISOString().split('T')[0], // YYYY-MM-DD
        price: priceEUR,
        volume: volume,
        timestamp: date
      };
    });

    console.log(`✅ Fetched ${processedData.length} price points for: ${marketHashName}`);
    return processedData;
    
  } catch (error) {
    console.error(`❌ Error fetching price history for ${marketHashName}:`, error.message);
    return [];
  }
}

/**
 * Busca histórico de múltiplos itens com delay entre requests
 * @param {Array<string>} marketHashNames - Array de nomes de itens
 * @param {number} delayMs - Delay entre requests (Steam rate limit)
 * @returns {Object} Mapa de marketHashName -> histórico
 */
async function fetchMultiplePriceHistories(marketHashNames, delayMs = 2000) {
  const results = {};
  
  console.log(`🔄 Fetching price history for ${marketHashNames.length} items...\n`);
  
  for (let i = 0; i < marketHashNames.length; i++) {
    const name = marketHashNames[i];
    console.log(`[${i + 1}/${marketHashNames.length}] ${name}`);
    
    const history = await fetchSteamPriceHistory(name);
    results[name] = history;
    
    // Delay para não exceder rate limits da Steam
    if (i < marketHashNames.length - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}

/**
 * Agrega dados por dia (Steam retorna por hora)
 * @param {Array} priceHistory - Histórico de preços
 * @returns {Array} Dados agregados por dia
 */
function aggregateByDay(priceHistory) {
  const dailyMap = new Map();
  
  priceHistory.forEach(entry => {
    const date = entry.date;
    
    if (!dailyMap.has(date)) {
      dailyMap.set(date, {
        prices: [],
        volumes: []
      });
    }
    
    dailyMap.get(date).prices.push(entry.price);
    dailyMap.get(date).volumes.push(entry.volume);
  });
  
  const aggregated = [];
  
  for (const [date, data] of dailyMap.entries()) {
    const prices = data.prices;
    const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const totalVolume = data.volumes.reduce((a, b) => a + b, 0);
    
    aggregated.push({
      date,
      avg_price: avgPrice,
      min_price: minPrice,
      max_price: maxPrice,
      listing_count: totalVolume
    });
  }
  
  return aggregated.sort((a, b) => new Date(a.date) - new Date(b.date));
}

module.exports = {
  fetchSteamPriceHistory,
  fetchMultiplePriceHistories,
  aggregateByDay
};
