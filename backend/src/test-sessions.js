require('dotenv').config();
const express = require('express');
const session = require('express-session');

console.log('SESSION_SECRET =', process.env.SESSION_SECRET);

const app = express();

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false }
}));

app.get('/', (req, res) => {
  req.session.test = 'ok';
  res.send('Sessão configurada!');
});

app.listen(3002, () => console.log('Servidor a correr na porta 3002'));
