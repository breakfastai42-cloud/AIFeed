import { GoogleGenAI } from '@google/genai';

// Try current stable models in priority order.
const MODEL_PRIORITY = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash-lite',
];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const topic = typeof body.topic === 'string' ? body.topic : 'all topics';
  const instruction = typeof body.instruction === 'string' ? body.instruction.trim() : '';
  const more = body.more === true;
  const supportedTopics = [
    'all topics',
    'frontier research',
    'macroeconomics',
    'foundational knowledge',
    'college admissions',
    'learning and cognitive science',
  ];

  if (!supportedTopics.includes(topic)) {
    return res.status(400).json({ error: 'Choose a supported briefing topic.' });
  }
  if (instruction.length > 500) {
    return res.status(400).json({ error: 'Search instructions must be 500 characters or fewer.' });
  }

  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({ error: 'GEMINI_API_KEY environment variable is not set' });
  }

  try {
    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Try models in priority order with fallback
    let briefing = null;
    let lastError = null;
    let usedModel = null;

    for (const modelName of MODEL_PRIORITY) {
      try {
        console.log(`Attempting model: ${modelName}`);

        // Construct personalized daily briefing prompt
        const prompt = `You are a daily intelligence-link curator, not a chatbot. Find and summarize useful, current sources as clickable links.

${topic === 'all topics'
    ? 'Generate exactly 5 sections, one for each topic below.'
    : `Generate exactly 1 section focused on ${topic}.`}
Include exactly 3 useful links in each section. Use Google Search to find and verify the source URLs.
${more ? 'Find a fresh set of links, different from the most obvious top results where possible.' : ''}
${instruction ? `Prioritize this user search instruction while keeping links relevant to ${topic}: "${instruction}"` : ''}

Format your response as a JSON object with this structure:
{
  "sections": [
    {
      "emoji": "🔬",
      "title": "SECTION TITLE",
      "content": "Brief description",
      "links": [
        {
          "title": "Paper/Article Title",
          "url": "https://...",
          "description": "1-2 sentence summary"
        }
      ]
    }
  ]
}

Topics:
Section 1 - 🔬 RESEARCH PAPERS (Frontier Science):
Search arXiv, Nature, Science, PNAS for today's breakthrough papers. Focus on: quantum computing, AI architectures, theoretical physics, biology breakthroughs. Include 3 paper links with abstracts.

Section 2 - 📈 MACROECONOMICS (NY Times & Financial Sources):
Search NY Times Economy section, The Economist, Bloomberg, IMF, World Bank for today's economic developments. Focus on: monetary policy, inflation, debt markets, energy economics. Include 3 article links.

Section 3 - 📚 WIKIPEDIA DEEP DIVES:
Search Wikipedia for 3 high-quality, comprehensive articles that build foundational knowledge. Topics should be: economics, physics, history, or philosophy concepts. Include 3 Wikipedia links with brief summaries.

Section 4 - 🎓 COLLEGE ADMISSIONS INTEL:
Search Reddit (r/ApplyingToCollege), MIT Admissions blog, Yale Admissions, Stanford admissions for insider strategies. Focus on: essay evaluation, unconventional extracurriculars, "spikes". Include 3 verified links.

Section 5 - 🧠 COGNITIVE TITAN STRATEGIES:
Research mental models from: Feynman, Musk, Huang, Hassabis, Buffett. Combine with cognitive neuroscience research on: memory consolidation, deep work, neuroplasticity. Include 3 research-backed links.

IMPORTANT:
- Every link MUST be live and clickable
- URLs should be from primary sources (arXiv, NY Times, Wikipedia, official admissions sites)
- Return ONLY the JSON, no additional text
- Prefer current sources for news and timeless sources for foundational knowledge
- Match the number of sections to the instructions above`;

        const result = await genAI.interactions.create({
          model: modelName,
          input: prompt,
          tools: [{ type: 'google_search' }],
        });
        const responseText = result.output_text;
        if (!responseText) {
          throw new Error(`Model ${modelName} returned an empty response`);
        }
        usedModel = modelName;
        console.log(`Successfully generated briefing using model: ${modelName}`);
        
        // Extract JSON from response
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            briefing = JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            lastError = new Error(`Model ${modelName} returned invalid JSON`);
            briefing = null;
          }
        } else {
          lastError = new Error(`Model ${modelName} returned no JSON`);
        }
        
        if (briefing) break; // Success, exit the loop
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

    return res.status(200).json({
      success: true,
      model: usedModel,
      briefing: briefing,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in daily briefing:', error);
    return res.status(500).json({ error: error.message });
  }
}
