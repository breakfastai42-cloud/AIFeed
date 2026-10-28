# Morning Intelligence Briefing

An automated serverless cron job that delivers a daily intelligence briefing to Telegram every morning at 06:00 AM East Africa Time (03:00 UTC). The briefing includes:

- 🔬 **Frontier Science & Tech**: Breakthroughs from Quanta Magazine, Nature, arXiv
- 📈 **Macroeconomics & Global Forces**: High-signal economic developments
- 🎓 **College Admissions Insider Intel**: Actionable Ivy League admissions strategies
- 🏛️ **Titan Strategy & Cognitive Habits**: Mental models from industry titans

Powered by Google Gemini API with Search Grounding to fetch live, verified URLs.

## Features

- **Live Web Search**: Uses Gemini's native Google Search tool to fetch real, non-hallucinated URLs
- **Smart Model Fallback**: Automatically tries models in priority order (Flash → Lite → Pro → Lower versions) to ensure reliability
- **Telegram Integration**: Sends formatted HTML messages with clickable links
- **Graceful Fallback**: Strips HTML and retries as plain text if Telegram parsing fails
- **Secure Endpoint**: CRON_SECRET protects the cron route from unauthorized access
- **Local Dev Friendly**: Security bypasses in development mode

## Prerequisites

- Node.js 18+ (for local testing)
- Google AI Studio API key with Gemini Flash access
- Telegram Bot token from @BotFather
- Telegram Chat ID (recipient)

## Setup

### 1. Clone or Initialize

```bash
git clone <your-repo-url>
cd morning-intelligence-briefing
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

Fill in your credentials:

```env
GEMINI_API_KEY=your_gemini_api_key_here
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
CRON_SECRET=your_random_secret_string_here
```

#### Getting the Credentials

**Gemini API Key:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Copy it to your `.env`

**Telegram Bot Token:**
1. Start a chat with [@BotFather](https://t.me/BotFather) on Telegram
2. Send `/newbot` and follow the instructions
3. Copy the token (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

**Telegram Chat ID:**
1. Send a message to your bot in Telegram
2. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Look for `"chat":{"id":123456789}` in the response
4. Copy the numeric ID

**CRON_SECRET:**
Generate a secure random string (e.g., using `openssl rand -base64 32` or a password manager)

### 4. Local Testing (Optional)

Install `vercel` CLI globally:

```bash
npm install -g vercel
```

Run locally:

```bash
vercel dev
```

Test the endpoint:

```bash
curl -X POST http://localhost:3000/api/cron \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

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
3. Add the following variables:
   - `GEMINI_API_KEY`
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `CRON_SECRET`
4. Click **Save** and redeploy if prompted

### 5. Verify Cron Job

After deployment, Vercel will automatically configure the cron job based on `vercel.json`. The job runs daily at 03:00 UTC (06:00 AM EAT).

To verify:
- Go to your project in Vercel Dashboard
- Navigate to **Cron Jobs** tab
- You should see `/api/cron` scheduled with `0 3 * * *`

## File Structure

```
.
├── api/
│   └── cron.js          # Main serverless function with model fallback
├── vercel.json          # Cron job configuration
├── package.json         # Dependencies and ES module config
├── .env.example         # Environment variable template
├── .gitignore           # Git ignore file (protects .env)
└── README.md            # This file
```

## How It Works

1. **Cron Trigger**: Vercel triggers `/api/cron` at 03:00 UTC daily
2. **Security Check**: Validates `Authorization: Bearer CRON_SECRET` header
3. **Model Selection**: Tries Gemini models in priority order:
   - `gemini-2.0-flash` (fastest, highest priority)
   - `gemini-1.5-flash`
   - `gemini-1.5-flash-lite`
   - `gemini-1.5-pro`
   - `gemini-1.0-pro` (fallback)
4. **Content Generation**: Selected model searches the web and generates 4 intelligence blocks with live URLs
5. **Telegram Dispatch**: Sends formatted HTML message to your chat
6. **Fallback Mechanism**: If HTML parsing fails, strips tags and retries as plain text

## Troubleshooting

**Cron job not running:**
- Verify `vercel.json` is present and valid
- Check Vercel Dashboard → Cron Jobs tab
- Ensure project is deployed (not just linked)

**Telegram message not sending:**
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are correct
- Check bot has permission to message you (start a conversation first)
- Check Vercel Function Logs for errors

**Gemini API errors:**
- Verify `GEMINI_API_KEY` is valid and has Gemini Flash access
- Check API quota limits in Google AI Studio
- Review Vercel Function Logs for specific error messages

**Unauthorized (401) error:**
- Ensure `CRON_SECRET` matches between Vercel env vars and your test request
- In local dev with `vercel dev`, set `NODE_ENV=development` to bypass auth

## Customization

**Change Cron Schedule:**
Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 3 * * *"  // Change this cron expression
    }
  ]
}
```

**Modify Model Priority:**
Edit the `MODEL_PRIORITY` array in `api/cron.js` (lines 4-10) to change the fallback order:
```javascript
const MODEL_PRIORITY = [
  'gemini-2.0-flash',      // Highest priority
  'gemini-1.5-flash',
  'gemini-1.5-flash-lite',
  'gemini-1.5-pro',
  'gemini-1.0-pro',        // Lowest priority
];
```

**Modify Intelligence Sections:**
Edit the prompt in `api/cron.js` (lines 39-58).

**Add More Sources:**
Expand the prompt instructions to include additional sources or topics.

## License

MIT
