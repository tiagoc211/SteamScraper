// src/server.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

// ROTAS
const usersRoutes = require('./routes/usersRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const listeningsRoutes = require('./routes/listeningsRoutes');
const inspectRoutes = require('./routes/inspectRoutes');
const buysRoutes = require('./routes/buysRoutes');
const logsRoutes = require('./routes/logsRoutes');
const subscriptionsRoutes = require('./routes/subscriptionsRoutes');
const itemsRoutes = require('./routes/itemsRoutes');
const trendsRoutes = require('./routes/trendsRoutes');

// MODELS E OUTROS
const express = require('express');
const cors = require('cors');
const session = require('express-session');

// --- MÓDULOS LOCAIS ---
const fetcher = require('./fetch');
const setupSteamAuth = require('./auth/steam');

// --- CONFIGURAÇÃO ---
const PORT = process.env.PORT;

// --- TESTE DO SERVIÇO DE FLOAT INSPECT ---
async function testFloatInspectService() {
  const floatUrl = process.env.FLOAT_INSPECT_URL;
  if (!floatUrl || floatUrl === 'http://localhost/' || floatUrl === 'http://localhost') {
    console.warn('\n⚠️  ATENÇÃO: FLOAT_INSPECT_URL não está configurado corretamente!');
    console.warn('   Os floats das skins NÃO serão capturados (aparecerá N/A).');
    console.warn('   Veja backend/FLOAT_INSPECT_SETUP.md para instruções.\n');
    return;
  }

  try {
    const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));
    const testRes = await fetch(floatUrl, { timeout: 3000 });
    console.log('✅ Float Inspect Service está acessível!');
  } catch (err) {
    console.warn('\n⚠️  Float Inspect Service não está acessível!');
    console.warn(`   URL configurado: ${floatUrl}`);
    console.warn('   Erro:', err.message);
    console.warn('   Veja backend/FLOAT_INSPECT_SETUP.md para instruções.\n');
  }
}

// --- FUNÇÃO PRINCIPAL DO SERVIDOR ---
async function startServer() {
  await fetcher.ready;
  await testFloatInspectService();

  const app = express();
  app.use(cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true
  }));
  app.use(express.json());

  // app.use(express.static(path.join(__dirname, '../public')));

  app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { secure: 'auto' }
  }));

  setupSteamAuth(app);

  // --- REGISTO DAS ROTAS ---
  app.use('/api/subscriptions', subscriptionsRoutes); 
  app.use('/api/tokens/buy', buysRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/roles', rolesRoutes);
  app.use('/api/skin', listeningsRoutes);
  app.use('/api/inspect', inspectRoutes);
  app.use('/api/logs', logsRoutes);
  app.use('/api/items', itemsRoutes);
  app.use('/api/trends', trendsRoutes);
  

  //app.get(/^(?!\/api).*/, (req, res) => {
	//  res.sendFile(path.join(__dirname, '../public/index.html'));
	//});

  app.listen(PORT, () => console.log(`🚀 Backend a correr em ${process.env.DOMAIN}:${PORT}`));}

startServer();