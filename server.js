const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: '/tmp' }); // temporary file storage
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend from /public
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// Simple CORS for frontend during demos. In production, set specific origin.
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // change to specific origin for production
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Health check
app.get('/_health', (req, res) => res.json({ status: 'ok' }));

// POST /forward receives the multipart/form-data from browser and forwards to the real API
app.post('/forward', upload.single('input_file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'input_file is required' });

    const file = req.file;
    const { insurance_company, data_type } = req.body;

    const form = new FormData();
    form.append('input_file', fs.createReadStream(file.path), file.originalname);
    if (insurance_company !== undefined) form.append('insurance_company', insurance_company);
    if (data_type !== undefined) form.append('data_type', data_type);

    // Target API
    const API_URL = process.env.TARGET_API_URL || 'https://PIVOT-Port-PolDoc-Health.Attributum.com/api/ml_process';

    // Forward authorization from environment variable if set
    const headers = form.getHeaders();
    const API_KEY = process.env.API_KEY || process.env.TARGET_API_KEY;
    if (API_KEY) {
      // Default to Bearer token. If you need a different header format, set FORWARD_AUTH_HEADER env var (e.g. "X-API-Key")
      const authHeader = process.env.FORWARD_AUTH_HEADER || 'Authorization';
      const authValue = process.env.FORWARD_AUTH_VALUE || `Bearer ${API_KEY}`;
      headers[authHeader] = authValue;
      console.log('Forwarding auth header', authHeader);
    }

    const apiResp = await fetch(API_URL, { method: 'POST', body: form, headers });
    const text = await apiResp.text();

    // cleanup temp file
    try { fs.unlinkSync(file.path); } catch (e) {}

    // Forward status and body (try to preserve JSON content-type)
    const contentType = apiResp.headers.get('content-type') || 'application/json';
    res.status(apiResp.status).type(contentType).send(text);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Fallback to index.html for SPA routing
app.use((req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Proxy + static server running on port ${PORT}`));
