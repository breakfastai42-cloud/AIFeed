# Intelligence Briefing AI

A personalized AI-powered daily intelligence feed with curated links, topic filters, and focused search.

## Features

### Daily Briefing Topics
- **🔬 Research Papers**: Curated breakthrough papers from arXiv, Nature, Science, PNAS
- **📈 Macroeconomics**: Latest developments from NY Times Economy, The Economist, Bloomberg, IMF
- **📚 Wikipedia Deep Dives**: High-quality comprehensive articles for foundational knowledge
- **🎓 College Admissions Intel**: Insider strategies from Reddit, MIT/Yale/Stanford admissions
- **🧠 Cognitive Titan Strategies**: Mental models from Feynman, Musk, Huang, Hassabis + neuroscience research

### Daily Intelligence Feed
- **Daily Links**: Browse a daily briefing of clickable, summarized sources
- **Topic Buttons**: Filter by research, economics, foundational knowledge, admissions, or learning
- **More Links**: Append another set of links without losing the current feed
- **Focused Search**: Use a suggested search or write an instruction to tailor the links
- **Gregorian Date**: The header displays the date using the Gregorian calendar
- **Response Time**: See how long each request took after results load

### PWA Features
- **Installable**: Add to home screen on iOS and Android
- **Offline Support**: Works offline with service worker caching
- **Mobile-First Design**: Optimized for touch interfaces

## Prerequisites

- Node.js 20+ (for local testing and the current Google GenAI SDK)
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
GEMINI_API_KEY=your_primary_project_gemini_api_key_here
GEMINI_API_KEY_2=your_second_project_gemini_api_key_here
GEMINI_API_KEY_3=your_third_project_gemini_api_key_here
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
3. Add `GEMINI_API_KEY`, `GEMINI_API_KEY_2`, and `GEMINI_API_KEY_3` (use a key from each Google Cloud project)
4. Click **Save** and redeploy if prompted

### 5. Access the App

Visit your Vercel URL to access the app. The daily briefing will load automatically.

## File Structure

```
.
├── api/
│   ├── chat.js          # Legacy chat API endpoint
│   └── daily.js         # Daily briefing API endpoint
├── index.html           # Daily links feed
├── styles.css           # Dark theme and responsive feed styles
├── app.js               # Gregorian date, feed controls, and focused search
├── manifest.json        # PWA manifest
├── service-worker.js    # Offline support
├── icon-192.svg         # App icon
├── icon-512.svg         # App icon
├── vercel.json          # Vercel config
├── package.json         # Dependencies
├── .env.example         # Environment variable template
├── .gitignore           # Git ignore
└── README.md            # This file
```

## How It Works

### Daily Feed
1. **Auto-Load**: Today's link briefing loads when the app opens
2. **Choose a topic**: Select a topic button to get a focused briefing
3. **More links**: Append another fresh set to the current feed
4. **Focused search**: Select a suggestion or write a search instruction
5. **Response time**: The feed reports elapsed request time when results arrive

### Model Priority
The AI tries current stable models in this order (fallback if one fails):
- `gemini-3.8-flash`
- `gemini-3.6-flash`
- `gemini-3.5-flash-lite`

## Customization

**Modify Daily Briefing Sections:**
Edit the prompt in `api/daily.js` to change the briefing topics or sources.

**Change Daily Feed Topics:**
Edit the topic buttons in `index.html` and the matching topic list and prompt in `api/daily.js`.

**Modify Model Priority:**
Edit the `MODEL_PRIORITY` array in `api/daily.js`.

**Gemini quota failover:**
The daily feed tries `GEMINI_API_KEY` first. If that project hits quota or has invalid credentials, it tries `GEMINI_API_KEY_2`, then `GEMINI_API_KEY_3`. Google applies API rate limits per project, so use keys from separate projects if you need separate quotas; multiple keys from one project share its quota. Store all keys as Vercel environment variables and redeploy after changing them.

**Add Quick Suggestions:**
Edit the suggestion buttons in `index.html`.

## Troubleshooting

**Daily briefing not loading:**
- Verify `GEMINI_API_KEY` is set in Vercel environment variables
- Check Vercel Function Logs for errors
- The page now shows the API's error message; a missing key must be added to the Vercel project and redeployed
- If the API reports a 429 quota error, check the project limits and billing in [Google AI Studio](https://aistudio.google.com/rate-limit). Daily request limits reset at midnight Pacific; billing or plan limits may require an account change.
- Try refreshing the feed

**Focused search not responding:**
- Verify `GEMINI_API_KEY` is valid
- Check API quota limits in Google AI Studio
- Review Vercel Function Logs

**PWA not installing:**
- Ensure service worker is registered (check browser console)
- Verify manifest.json is accessible
- Try clearing cache and reloading

## License

MIT
