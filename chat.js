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
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  // Check for API key
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY environment variable is not set' });
  }

  try {
    // Initialize Gemini with Search Grounding enabled
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    
    // Try models in priority order with fallback
    let responseText = null;
    let lastError = null;
    let usedModel = null;

    for (const modelName of MODEL_PRIORITY) {
      try {
        console.log(`Attempting model: ${modelName}`);
        const model = genAI.getGenerativeModel({
          model: modelName,
          tools: [{ googleSearch: {} }],
        });

        // Construct prompt with intelligence curator persona
        const systemPrompt = `You are a personalized intelligence curator focused on building the user's mind through high-signal information. Your role is to:

1. Search the web for current, accurate information
2. Provide clear, concise answers with live, verified URLs
3. Include 3-5 relevant links for each topic
4. Format links as clickable markdown: [Title](URL)
5. Focus on high-signal information from primary sources

Your priority sources:
- Research Papers: arXiv, Nature, Science, PNAS, MIT Technology Review
- Economics: NY Times Economy, The Economist, Bloomberg, IMF, World Bank, Federal Reserve
- Wikipedia: High-quality, comprehensive Wikipedia articles for foundational knowledge
- Admissions: Reddit (r/ApplyingToCollege), MIT Admissions, Yale Admissions, Stanford admissions
- Cognitive Science: Research papers on memory, learning, neuroplasticity, deep work

When users ask questions, always provide:
- Direct, actionable answers
- Multiple perspectives from different sources
- Links to primary sources (not just news articles)
- Context about why this information matters for building their mind

Always include working URLs in your responses.`;

        let prompt = systemPrompt + '\n\nUser: ' + message;
        
        // Add conversation history if provided
        if (history && Array.isArray(history)) {
          const historyText = history.map(h => `${h.role}: ${h.content}`).join('\n');
          prompt = systemPrompt + '\n\nConversation history:\n' + historyText + '\n\nUser: ' + message;
        }

        // Generate content with search grounding
        const result = await model.generateContent(prompt);
        const response = await result.response;
        responseText = response.text();
        usedModel = modelName;
        console.log(`Successfully generated response using model: ${modelName}`);
        break; // Success, exit the loop
      } catch (modelError) {
        console.error(`Model ${modelName} failed:`, modelError.message);
        lastError = modelError;
        continue; // Try next model
      }
    }

    // If all models failed
    if (!responseText) {
      throw new Error(`All models failed. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    return res.status(200).json({
      success: true,
      model: usedModel,
      response: responseText,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in chat:', error);
    return res.status(500).json({ error: error.message });
  }
}
