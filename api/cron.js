import { GoogleGenerativeAI } from '@google/generative-ai';

// Model priority: Flash → Lite → Pro → Lower versions
const MODEL_PRIORITY = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.0-pro',
];

export default async function handler(req, res) {
  // Security: Validate CRON_SECRET (bypassable in local dev)
  if (process.env.NODE_ENV !== 'development') {
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  try {
    // Initialize Gemini with Search Grounding enabled
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try models in priority order with fallback
    let briefing = null;
    let lastError = null;
    let usedModel = null;

    for (const modelName of MODEL_PRIORITY) {
      try {
        console.log(`Attempting model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          tools: [{ googleSearch: {} }],
        });

        // Construct the intelligence briefing prompt
        const prompt = `You are an intelligence analyst. Generate a morning briefing with exactly 4 sections. Each section MUST include a live, verified URL from the web using Google Search.

Format each section using ONLY these Telegram-compatible HTML tags: <b>, <i>, <code>, and <a href="URL">Title</a>. Do NOT use Markdown (** or ##).

Section 1 - 🔬 FRONTIER SCIENCE & TECH:
Find a groundbreaking paper or concept from Quanta Magazine, Nature, or arXiv. Focus on: Quantum Computing, Theoretical Physics, or AI architectures. Include a live, verified article URL.

Section 2 - 📈 MACROECONOMICS & GLOBAL FORCES:
Find a high-signal development from The Economist, NY Times Economy, or financial institutions. Focus on: monetary policy, debt, energy, or trade. Include the live article URL.

Section 3 - 🎓 COLLEGE ADMISSIONS INSIDER INTEL:
Find real, actionable admissions secrets for top-tier/Ivy League institutions. Topics:
- How admissions officers evaluate and score personal statements/essays
- Unconventional high-leverage extracurriculars and academic "spikes" that move the needle
Source with a real, clickable link from Reddit (r/ApplyingToCollege deep dives, verified admissions officer AMAs), MIT Admissions blogs, or top admissions research sources.

Section 4 - 🏛️ TITAN STRATEGY & COGNITIVE HABITS:
Provide a mental model from an industry titan (Huang, Musk, Hassabis, Feynman) combined with an actionable habit from cognitive neuroscience (memory consolidation, deep-work state).

IMPORTANT: Every section MUST include a working URL that users can click. Use <a href="URL">Title</a> format.`;

        // Generate content with search grounding
        const result = await model.generateContent(prompt);
        const response = await result.response;
        briefing = response.text();
        usedModel = modelName;
        console.log(`Successfully generated briefing using model: ${modelName}`);
        break; // Success, exit the loop
      } catch (modelError) {
        console.error(`Model ${modelName} failed:`, modelError.message);
        lastError = modelError;
        continue; // Try next model
      }
    }

    // If all models failed
    if (!briefing) {
      throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    // Telegram API call
    const telegramResponse = await sendToTelegram(briefing, 'HTML');

    return res.status(200).json({
      success: true,
      model: usedModel,
      telegram: telegramResponse,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in cron job:', error);

    // Fallback: If Telegram API failed (likely due to HTML parsing), strip tags and retry
    if (error.message && (error.message.includes('parse mode') || error.message.includes('Telegram'))) {
      try {
        const plainText = stripHtmlTags(briefing);
        await sendToTelegram(plainText, null);
        return res.status(200).json({
          success: true,
          fallback: true,
          timestamp: new Date().toISOString(),
        });
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        return res.status(500).json({ error: fallbackError.message });
      }
    }

    return res.status(500).json({ error: error.message });
  }
}

async function sendToTelegram(text, parseMode = null) {
  const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const body = {
    chat_id: process.env.TELEGRAM_CHAT_ID,
    text: text,
  };

  if (parseMode) {
    body.parse_mode = parseMode;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Telegram API error: ${error}`);
  }

  return await response.json();
}

function stripHtmlTags(text) {
  return text.replace(/<[^>]*>/g, '');
}
