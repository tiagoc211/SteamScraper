// src/server.js
require('dotenv').config();

// ROTAS
const usersRoutes = require('./routes/usersRoutes');
const rolesRoutes = require('./routes/rolesRoutes');
const listeningsRoutes = require('./routes/listeningsRoutes');
const inspectRoutes = require('./routes/inspectRoutes');
const buysRoutes = require('./routes/buysRoutes');
const logsRoutes = require('./routes/logsRoutes');
const subscriptionsRoutes = require('./routes/subscriptionsRoutes'); 

// MODELS E OUTROS
const express = require('express');
const cors = require('cors');
const session = require('express-session');

// --- MÓDULOS LOCAIS ---
const fetcher = require('./fetch');
const setupSteamAuth = require('./auth/steam');

// --- CONFIGURAÇÃO ---
const PORT = process.env.PORT || 3001;

// --- FUNÇÃO PRINCIPAL DO SERVIDOR ---
async function startServer() {
  await fetcher.ready;

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

  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {  // evita conflito com rotas API
      res.sendFile(path.join(__dirname, '../public/index.html'));
    }
  });


  app.listen(PORT, () => console.log(`🚀🚀🚀🚀🚀🚀🚀🚀 Backend a correr em http://localhost:${PORT}🚀🚀🚀🚀🚀🚀🚀🚀🚀`));
}

startServer();