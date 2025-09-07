require('dotenv').config();

// ROTAS
const usersRoutes = require('./routes/usersRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const listeningsRoutes = require('./routes/listeningsRoutes');
const inspectRoutes = require('./routes/inspectRoutes');
const buysRoutes = require('./routes/buysRoutes');
const logsRoutes = require('./routes/logsRoutes');

// MODELS
const express = require('express');
const cors = require('cors');
const cheerio = require('cheerio');
const fs = require('fs/promises');
const crypto = require('crypto');
const NodeCache = require('node-cache');
const session = require('express-session');

// --- MÓDULOS LOCAIS ---
const fetcher = require('./fetch');
const setupSteamAuth = require('./auth/steam'); // Certifique-se que este ficheiro existe

// --- CONFIGURAÇÃO ---
const PORT = 3001;
const skinCache = new NodeCache({ stdTTL: 300 });
const ISSUER = 'http://localhost:3001';
const AUDIENCE = 'steamscraper-extension';

// --- FUNÇÃO PRINCIPAL DO SERVIDOR ---
async function startServer() {
  await fetcher.ready;

  const app = express();
  app.use(cors({
    origin: 'http://localhost:3000', // URL do seu frontend
    credentials: true
  }));
  app.use(express.json());

  app.use(session({
    secret: process.env.SESSION_SECRET || 'a-very-strong-secret-key-for-session',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: 'auto' } // Em produção, usar 'true' com HTTPS
  }));

  setupSteamAuth(app);

  app.use('/api/tokens/buy', buysRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/roles', rolesRoutes);
  app.use('/api/skin', listeningsRoutes);
  app.use('/api/inspect', inspectRoutes);
  app.use('/api/logs', logsRoutes);

  app.listen(PORT, () => console.log(`🚀 Backend (Modular) a correr em http://localhost:${PORT}`));
}



startServer();