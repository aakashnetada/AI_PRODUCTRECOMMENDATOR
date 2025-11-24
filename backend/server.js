const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fetch = require('node-fetch');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const GEMINI_KEY = process.env.GEMINI_KEY;

const localFilter = (query, items) => {
  const q = (query || '').toLowerCase();
  const underMatch = q.match(/under\s*\$?\s*(\d+)/);
  if (underMatch) {
    const price = parseInt(underMatch[1], 10);
    return items.filter(p => p.price <= price);
  }
  const priceOnly = q.match(/\$?\s*(\d{2,6})/);
  if (priceOnly && q.includes('$')) {
    const price = parseInt(priceOnly[1], 10);
    return items.filter(p => p.price <= price);
  }
  if (q.includes('phone') || q.includes('mobile')) return items.filter(p => p.category === 'phone');
  if (q.includes('tablet')) return items.filter(p => p.category === 'tablet');
  return items.filter(p => p.name.toLowerCase().includes(q));
};

app.post('/api/recommend', async (req, res) => {
  try {
    const { input, products } = req.body || {};
    if (!products || !Array.isArray(products)) return res.status(400).json({ error: 'products array required' });

    if (!GEMINI_KEY) {
      const local = localFilter(input, products);
      return res.json({ recommendations: local });
    }

    const prompt = `User preference: ${input}. Product list: ${products.map(p => `${p.name} (${p.category}, $${p.price})`).join(', ')}. Recommend products from the list that match the user's preference. Return only product names, comma separated.`;
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_KEY}`;
    const body = {
      contents: [
        {
          parts: [
            { text: prompt }
          ]
        }
      ]
    };
    const r = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await r.json();
    let recommendedNames = [];
    if (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      const text = data.candidates[0].content.parts[0].text || '';
      recommendedNames = text.split(/,|\n/).map(s => s.trim()).filter(Boolean);
    }

    const recommendations = products.filter(p => recommendedNames.includes(p.name));
    if (!recommendations.length) {
      return res.json({ recommendations: localFilter(input, products) });
    }

    res.json({ recommendations });
  } catch (err) {
    console.error('Recommendation error:', err);
    res.status(500).json({ error: 'internal error' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
