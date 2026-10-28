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

        // Construct personalized daily briefing prompt
        const prompt = `You are a personalized intelligence curator. Your mission is to build the user's mind by providing high-signal, actionable information every morning.

Generate a daily briefing with exactly 5 sections. Each section MUST include 3-5 live, verified URLs from the web using Google Search.

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
- Links should be from the last 24-48 hours for news, timeless for Wikipedia/research`;

        // Generate content with search grounding
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();
        usedModel = modelName;
        console.log(`Successfully generated briefing using model: ${modelName}`);
        
        // Extract JSON from response
        let jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            briefing = JSON.parse(jsonMatch[0]);
          } catch (parseError) {
            console.error('JSON parse error:', parseError);
            briefing = null;
          }
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
