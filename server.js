import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'src', 'portfolio.json');

app.use(cors());
app.use(bodyParser.json());

// Log every request
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Get all links
app.get('/api/links', (req, res) => {
  fs.readFile(DATA_FILE, 'utf8', (err, data) => {
    if (err) {
      console.error('Read error:', err);
      return res.status(500).json({ error: 'Could not read links' });
    }
    res.json(JSON.parse(data));
  });
});

// Update all links
app.post('/api/links', (req, res) => {
  const links = req.body;
  fs.writeFile(DATA_FILE, JSON.stringify(links, null, 2), 'utf8', (err) => {
    if (err) {
      console.error('Write error:', err);
      return res.status(500).json({ error: 'Could not save links' });
    }
    console.log('Successfully saved links');
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
