import express from 'express';
import Groq from 'groq-sdk';

const router = express.Router();

const groq = (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('YOUR_KEY'))
  ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

if (groq) console.log('✅ Groq LLM configured successfully');
else console.warn('⚠️  Groq not configured. AI search will use fallback parser.');

function fallbackParse(query) {
  const lower = query.toLowerCase();
  const priceMatch = lower.match(/(\d+)\s*(rupees?|rs|₹|rupaye|rupay)/);
  const maxPrice = priceMatch ? parseInt(priceMatch[1]) : null;
  
  let priority = 'balanced';
  if (/cheap|sasta|kam price|budget/i.test(query)) priority = 'cheapest';
  else if (/fast|jaldi|urgent|minute|quick|turant/i.test(query)) priority = 'fastest';
  else if (/fresh|taaz|new|latest/i.test(query)) priority = 'freshest';
  else if (/near|paas|close|nearby|nazdik/i.test(query)) priority = 'nearest';
  
  let category = null;
  if (/tomato|onion|potato|sabji|vegetable|bhaji|palak|spinach/i.test(query)) category = 'vegetables';
  else if (/apple|banana|mango|fruit|phal|orange|grape/i.test(query)) category = 'fruits';
  else if (/milk|dahi|curd|paneer|butter|dairy|doodh/i.test(query)) category = 'dairy';
  else if (/bread|pav|cake|bakery|cookie/i.test(query)) category = 'bakery';
  else if (/chicken|egg|meat|anda/i.test(query)) category = 'meat';
  else if (/fish|prawn|seafood|machli/i.test(query)) category = 'seafood';
  else if (/flower|marigold|rose|phool|mogra/i.test(query)) category = 'flowers';
  
  return {
    primaryProduct: null, category,
    keywords: query.split(/\s+/).filter(w => w.length > 2),
    maxPrice, minPrice: null, priority, quantity: null,
    userIntent: `Search for: ${query}`,
    requiresLiveFeed: /fresh|taaz|quality|dekh/i.test(query)
  };
}

router.post('/interpret', async (req, res) => {
  try {
    const { userQuery } = req.body;
    if (!userQuery || typeof userQuery !== 'string' || userQuery.trim().length < 2) {
      return res.status(400).json({ error: 'Query must be at least 2 characters', original: userQuery || '' });
    }
    const cleanQuery = userQuery.trim().slice(0, 200);
    
    if (!groq) {
      return res.json({
        original: cleanQuery, interpretation: fallbackParse(cleanQuery),
        fallback: true, reason: 'Groq not configured'
      });
    }
    
    const startTime = Date.now();
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Groq timeout')), 5000)
    );
    
    const groqPromise = groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are a smart grocery search assistant for HyperCon, an Indian hybrid commerce app. Users speak in English, Hindi, or Hinglish.

Available product categories:
- vegetables (tomatoes, onions, potatoes, spinach/palak, capsicum, cucumber, cauliflower, green chillies)
- fruits (bananas, apples, mangoes, grapes, pomegranate, watermelon)
- dairy (paneer, curd/dahi, milk, butter, cheese)
- bakery (bread, pav, cake, cookies)
- meat (chicken, eggs)
- seafood (fish/pomfret, prawns)
- flowers (marigold, rose, mogra)
- staples (rice, atta, sugar)
- beverages (coconut water, sugarcane juice)

Convert user query to structured JSON:
{
  "primaryProduct": "specific product name OR null",
  "category": "one category OR null",
  "keywords": ["array"],
  "maxPrice": number or null,
  "minPrice": number or null,
  "priority": "cheapest" or "fastest" or "freshest" or "nearest" or "balanced",
  "quantity": "1kg, 500g, etc or null",
  "userIntent": "1-line summary in English",
  "requiresLiveFeed": true or false
}

EXAMPLES:
Input: "fresh tomato chahiye"
Output: {"primaryProduct":"Tomatoes","category":"vegetables","keywords":["tomato","fresh"],"maxPrice":null,"minPrice":null,"priority":"freshest","quantity":null,"userIntent":"Fresh tomatoes","requiresLiveFeed":true}

Input: "sabji 100 rupees ke andar"
Output: {"primaryProduct":null,"category":"vegetables","keywords":["vegetables","sabji"],"maxPrice":100,"minPrice":null,"priority":"cheapest","quantity":null,"userIntent":"Vegetables under 100 rupees","requiresLiveFeed":false}

Input: "10 minute mein milk"
Output: {"primaryProduct":"Milk (Full Cream)","category":"dairy","keywords":["milk"],"maxPrice":null,"minPrice":null,"priority":"fastest","quantity":null,"userIntent":"Fastest milk delivery","requiresLiveFeed":false}

Input: "premium mangoes 1kg"
Output: {"primaryProduct":"Mangoes (Alphonso)","category":"fruits","keywords":["mango","alphonso"],"maxPrice":null,"minPrice":null,"priority":"balanced","quantity":"1kg","userIntent":"Premium 1kg mangoes","requiresLiveFeed":true}

Input: "paas ke store se dahi"
Output: {"primaryProduct":"Curd (Dahi)","category":"dairy","keywords":["curd","dahi"],"maxPrice":null,"minPrice":null,"priority":"nearest","quantity":null,"userIntent":"Nearest curd store","requiresLiveFeed":false}`
        },
        { role: "user", content: cleanQuery }
      ],
      response_format: { type: "json_object" },
      max_tokens: 300, temperature: 0.2
    });
    
    const response = await Promise.race([groqPromise, timeoutPromise]);
    const latency = Date.now() - startTime;
    
    let interpretation;
    try {
      interpretation = JSON.parse(response.choices[0].message.content);
    } catch (parseErr) {
      return res.json({
        original: cleanQuery, interpretation: fallbackParse(cleanQuery),
        fallback: true, reason: 'Invalid JSON from LLM'
      });
    }
    
    if (!interpretation.priority) interpretation.priority = 'balanced';
    if (!interpretation.keywords) interpretation.keywords = [cleanQuery];
    if (typeof interpretation.requiresLiveFeed !== 'boolean') interpretation.requiresLiveFeed = false;
    
    return res.json({
      original: cleanQuery, interpretation, fallback: false,
      model: 'llama-3.3-70b-versatile', latencyMs: latency, provider: 'Groq'
    });
    
  } catch (err) {
    console.error('AI search error:', err.message);
    return res.json({
      original: req.body?.userQuery || '',
      interpretation: fallbackParse(req.body?.userQuery || ''),
      fallback: true, error: err.message, reason: 'LLM call failed'
    });
  }
});

router.get('/status', (req, res) => {
  res.json({
    groqConfigured: !!groq,
    provider: groq ? 'Groq (llama-3.3-70b-versatile)' : 'Rule-based fallback',
    ready: true
  });
});

export default router;
