const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const { fetchSearchPage } = require('./fetch');

const app = express();
app.use(cors());

/**
 * Extrai todas as skins de uma arma e os respetivos estados de desgaste.
 */
async function listAllSkinsWithWear(weapon, exactSkin = null) {
  const skinMap = new Map();
  const maxPages = Infinity;
  const count = 10;

  for (let page = 0; page < maxPages; page++) {
    const start = page * count;
    const data = await fetchSearchPage(`${weapon} |`, start, count);

    if (!data || !data.results_html) break;

    const $ = cheerio.load(data.results_html);
    const items = $('span.market_listing_item_name');

    if (items.length === 0) break;

    items.each((_, el) => {
      const fullName = $(el).text().trim();
      const match = fullName.match(/^(.+?) \| (.+?) \((.+?)\)$/);

      if (match) {
        const skin = match[2].trim();
        const desgaste = match[3].trim();

        if (exactSkin && skin !== exactSkin) return;

        if (!skinMap.has(skin)) skinMap.set(skin, new Set());
        skinMap.get(skin).add(desgaste);
      }
    });

    // Para pesquisa exata, para quando encontrar a skin
    if (exactSkin && skinMap.size > 0) break;
  }

  return [...skinMap.entries()].map(([skin, desgastes]) => ({
    skin,
    desgastes: [...desgastes],
  }));
}


app.get('/api/skins', async (req, res) => {
  const weapon = req.query.weapon;
  const exactSkin = req.query.skin; // skin específica, ex: "Cartel"

  if (!weapon) return res.status(400).json({ error: 'Parâmetro "weapon" em falta.' });

  try {
    const skins = await listAllSkinsWithWear(weapon, exactSkin);
    res.json({ weapon, skins });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao obter skins.', detalhe: err.message });
  }
});


const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ API a correr em http://localhost:${PORT}/api/skins?`);
});
