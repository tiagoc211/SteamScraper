const express = require('express');
const crypto = require('crypto');
const fs = require('fs/promises');
const router = express.Router();

let privateKey;
let SignJWT;

// Função para inicializar a chave privada e SignJWT
async function initKeys() {
  if (!privateKey || !SignJWT) {
    const jose = await import('jose');
    SignJWT = jose.SignJWT;
    const privJwk = JSON.parse(await fs.readFile('./keys/private.jwk.json', 'utf8'));
    privateKey = await jose.importJWK(privJwk, 'ES256');
    console.log('🔑 Chave privada para tokens carregada com sucesso.');
  }
}

// Endpoint para gerar tokens de compra
router.post('/', async (req, res) => {
  try {
    await initKeys();

    if (!privateKey || !SignJWT) return res.status(500).json({ error: 'Serviço de tokens indisponível.' });

    const { steamUrl, listingId, maxPriceCents, itemName } = req.body || {};
    if (!steamUrl || !listingId || !Number.isInteger(maxPriceCents)) {
      return res.status(400).json({ error: 'Parâmetros inválidos.' });
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    const token = await new SignJWT({ steamUrl, listingId, maxPriceCents, itemName, nonce })
      .setProtectedHeader({ alg: 'ES256' })
      .setIssuer('http://localhost:3001')
      .setAudience('steamscraper-extension')
      .setIssuedAt()
      .setExpirationTime('60s')
      .sign(privateKey);

    res.json({ token });
  } catch (err) {
    console.error('❌ Erro ao gerar token de compra:', err);
    res.status(500).json({ error: 'Falha a gerar token de compra.' });
  }
});

module.exports = router;
