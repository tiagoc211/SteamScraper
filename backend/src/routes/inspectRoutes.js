const express = require('express');
const router = express.Router();
const { extractFloatFromSteam } = require('../utils/steamFloatExtractor');

router.get('/', async (req, res) => {
  const inspectLink = req.query.url;
  
  if (!inspectLink) {
    return res.status(400).json({ success: false, error: 'O parâmetro "url" é obrigatório.' });
  }

  try {
    const floatData = await extractFloatFromSteam(inspectLink);
    
    if (Object.keys(floatData).length === 0) {
      return res.status(404).json({ success: false, error: 'Não foi possível extrair dados do item.' });
    }
    
    res.json({ success: true, iteminfo: floatData });
  } catch (err) {
    console.error('❌ Erro ao extrair float:', err.message);
    res.status(500).json({ success: false, error: 'Erro ao extrair dados do item.' });
  }
});

module.exports = router;
