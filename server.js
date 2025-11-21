require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const path = require('path');
const { nanoid } = require('nanoid');
const db = require('./db');

const app = express();
app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/public', express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || ('http://localhost:' + PORT);
const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

// Healthcheck
app.get('/healthz', (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// Dashboard page
app.get('/', (req, res) => {
  res.render('index', { baseUrl: BASE_URL });
});

// Stats page
app.get('/code/:code', async (req, res) => {
  const code = req.params.code;
  const link = await db.get('SELECT * FROM links WHERE code = ? AND deleted = 0', code);
  if (!link) return res.status(404).render('404', { message: 'Code not found' });
  res.render('stats', { link, baseUrl: BASE_URL });
});

// Redirect handler
app.get('/:code', async (req, res) => {
  const code = req.params.code;
  const link = await db.get('SELECT * FROM links WHERE code = ? AND deleted = 0', code);
  if (!link) return res.status(404).render('404', { message: 'Not Found' });
  // increment clicks and update last_clicked
  await db.run('UPDATE links SET clicks = clicks + 1, last_clicked = datetime(' + "'now'" + ') WHERE code = ?', code);
  return res.redirect(302, link.url);
});

// API: create link
app.post('/api/links', async (req, res) => {
  const { url, code } = req.body;
  if (!url || typeof url !== 'string') return res.status(400).json({ error: 'Invalid URL' });
  // basic URL validation
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) throw new Error('invalid protocol');
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  let chosenCode = code && code.trim() ? code.trim() : null;
  if (chosenCode) {
    if (!CODE_REGEX.test(chosenCode)) {
      return res.status(400).json({ error: 'Custom code must match [A-Za-z0-9]{6,8}' });
    }
    const exists = await db.get('SELECT 1 FROM links WHERE code = ?', chosenCode);
    if (exists) return res.status(409).json({ error: 'Code already exists' });
  } else {
    // generate until unique (nanoid default url-friendly; we'll enforce length 6)
    do {
      chosenCode = nanoid(6).replace(/[^A-Za-z0-9]/g, '').slice(0, 6);
    } while (await db.get('SELECT 1 FROM links WHERE code = ?', chosenCode));
  }

  await db.run('INSERT INTO links (code, url) VALUES (?, ?)', [chosenCode, url]);
  return res.status(201).json({ code: chosenCode, shortUrl: BASE_URL + '/' + chosenCode });
});

// API: list all links
app.get('/api/links', async (req, res) => {
  const rows = await db.all('SELECT code, url, clicks, last_clicked, created_at FROM links WHERE deleted = 0 ORDER BY created_at DESC');
  res.json(rows);
});

// API: get stats for one code
app.get('/api/links/:code', async (req, res) => {
  const code = req.params.code;
  const link = await db.get('SELECT code, url, clicks, last_clicked, created_at FROM links WHERE code = ? AND deleted = 0', code);
  if (!link) return res.status(404).json({ error: 'Not found' });
  res.json(link);
});

// API: delete link
app.delete('/api/links/:code', async (req, res) => {
  const code = req.params.code;
  const link = await db.get('SELECT 1 FROM links WHERE code = ? AND deleted = 0', code);
  if (!link) return res.status(404).json({ error: 'Not found' });
  await db.run('UPDATE links SET deleted = 1 WHERE code = ?', code);
  res.json({ ok: true });
});

app.use((req, res) => {
  res.status(404).render('404', { message: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`TinyLink running on ${BASE_URL}`);
});
