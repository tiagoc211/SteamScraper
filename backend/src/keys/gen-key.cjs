// gen-key.cjs
const fs = require('fs/promises');
const path = require('path');

(async () => {
  try {
    const { generateKeyPair, exportJWK } = await import('jose');

    // 👉 torna as chaves exportáveis para poderes usar exportJWK
    const { privateKey, publicKey } = await generateKeyPair('ES256', { extractable: true });

    const priv = await exportJWK(privateKey);
    const pub  = await exportJWK(publicKey);

    // metadados úteis
    priv.kid = pub.kid = 'steam-buy-key-1';
    priv.alg = pub.alg = 'ES256';
    priv.use = pub.use = 'sig';

    const privPath = path.resolve(process.cwd(), 'private.jwk.json');
    const pubPath  = path.resolve(process.cwd(), 'public.jwk.json');

    await fs.writeFile(privPath, JSON.stringify(priv, null, 2), 'utf8');
    await fs.writeFile(pubPath,  JSON.stringify(pub,  null, 2), 'utf8');

    console.log('Chaves geradas com sucesso:');
    console.log('  ', privPath);
    console.log('  ', pubPath);
  } catch (err) {
    console.error('Falha a gerar as chaves:', err);
    process.exit(1);
  }
})();
