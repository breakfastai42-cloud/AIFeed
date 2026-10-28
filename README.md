# Intelligence Briefing AI

A personalized AI-powered intelligence curator that builds your mind through daily curated links from research papers, NY Times economics, Wikipedia, and more. Includes a chat interface for exploring specific topics.

## Features

### Daily Briefing (Automatic on Load)
- **🔬 Research Papers**: Curated breakthrough papers from arXiv, Nature, Science, PNAS
- **📈 Macroeconomics**: Latest developments from NY Times Economy, The Economist, Bloomberg, IMF
- **📚 Wikipedia Deep Dives**: High-quality comprehensive articles for foundational knowledge
- **🎓 College Admissions Intel**: Insider strategies from Reddit, MIT/Yale/Stanford admissions
- **🧠 Cognitive Titan Strategies**: Mental models from Feynman, Musk, Huang, Hassabis + neuroscience research

### Interactive Chat
- **Personalized AI Curator**: Ask questions and get responses with live, verified links
- **Primary Sources**: Always links to arXiv, NY Times, Wikipedia, official admissions sites
- **Conversation Memory**: Remembers context across your chat session
- **Ethiopian Calendar**: Displays current date in Ethiopian calendar format

### PWA Features
- **Installable**: Add to home screen on iOS and Android
- **Offline Support**: Works offline with service worker caching
- **Mobile-First Design**: Optimized for touch interfaces

## Prerequisites

- Node.js 18+ (for local testing)
- Google AI Studio API key with Gemini Flash access

## Setup

### 1. Clone or Initialize

```bash
git clone <your-repo-url>
cd intelligence-briefing-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your API key:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

**Getting the API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy it to your `.env`

### 4. Local Testing (Optional)

Install `vercel` CLI globally:

```bash
npm install -g vercel
```

Run locally:

```bash
vercel dev
```

Visit `http://localhost:3000` to test the app.

## Deployment to Vercel

### 1. Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 2. Login to Vercel

```bash
vercel login
```

### 3. Deploy

```bash
vercel
```

Follow the prompts:
- Set project name (or accept default)
- Link to existing Vercel project (or create new)
- Confirm settings

### 4. Add Environment Variables in Vercel Dashboard

1. Go to your project in [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to **Settings** → **Environment Variables**
3. Add `GEMINI_API_KEY`
4. Click **Save** and redeploy if prompted

### 5. Access the App

Visit your Vercel URL to access the app. The daily briefing will load automatically.

## File Structure

```
.
├── api/
│   ├── chat.js          # Chat API endpoint with conversation history
│   └── daily.js         # Daily briefing API endpoint
├── public/
│   ├── index.html       # Chat interface UI
│   ├── styles.css       # Dark theme styles
│   ├── app.js           # Ethiopian calendar & chat logic
│   ├── manifest.json    # PWA manifest
│   ├── service-worker.js # Offline support
│   ├── icon-192.svg     # App icon
│   └── icon-512.svg     # App icon
├── index.html           # Root redirect
├── vercel.json          # Vercel config
├── package.json         # Dependencies
├── .env.example         # Environment variable template
├── .gitignore           # Git ignore
└── README.md            # This file
```

## How It Works

### Daily Briefing
1. **Auto-Load**: When you open the app, it automatically fetches today's briefing
2. **AI Search**: Gemini searches the web for 5 curated sections
3. **Structured Results**: Returns JSON with 5 sections, each with 3-5 live links
4. **Display**: Shows formatted briefing with clickable links
5. **Refresh**: Click "Get New Briefing" to fetch fresh links

### Chat Interface
1. **User Input**: Type any question or topic
2. **AI Search**: Gemini searches primary sources (arXiv, NY Times, Wikipedia)
3. **Response**: Returns answer with 3-5 live, verified links
4. **Context**: Remembers conversation history for follow-up questions

### Model Priority
The AI tries models in this order (fallback if one fails):
- `gemini-2.0-flash` (fastest, highest priority)
- `gemini-1.5-flash`
- `gemini-1.5-flash-lite`
- `gemini-1.5-pro`
- `gemini-1.0-pro` (fallback)

## Customization

**Modify Daily Briefing Sections:**
Edit the prompt in `api/daily.js` (lines 35-68) to change the 5 sections or sources.

**Change Chat Persona:**
Edit the system prompt in `api/chat.js` (lines 41-63) to adjust the AI's behavior.

**Modify Model Priority:**
Edit the `MODEL_PRIORITY` array in both `api/chat.js` and `api/daily.js` (lines 4-10).

**Add Quick Suggestions:**
Edit suggestion chips in `public/index.html` (lines 42-49) and `public/app.js` (lines 264-274).

## Troubleshooting

**Daily briefing not loading:**
- Verify `GEMINI_API_KEY` is set in Vercel environment variables
- Check Vercel Function Logs for errors
- Try clicking "Get New Briefing" button

**Chat not responding:**
- Verify `GEMINI_API_KEY` is valid
- Check API quota limits in Google AI Studio
- Review Vercel Function Logs

**PWA not installing:**
- Ensure service worker is registered (check browser console)
- Verify manifest.json is accessible
- Try clearing cache and reloading

## License

MIT
