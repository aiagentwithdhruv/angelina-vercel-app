# Angelina AI - Backend Setup Guide

## 🎯 Architecture: OpenAI Realtime Voice

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                       │
│                    🎤 YOU SPEAK      🔊 ANGELINA SPEAKS               │
│                         │                    ▲                        │
│                         ▼                    │                        │
│              ┌───────────────────────────────┴──────────┐            │
│              │                                          │            │
│              │        OpenAI Realtime API               │            │
│              │        (GPT-4o with Voice)               │            │
│              │                                          │            │
│              │   • ~300ms latency (natural!)            │            │
│              │   • Interruption handling ✅              │            │
│              │   • Emotional voice tones 🎭             │            │
│              │   • Tool calling built-in 🔧             │            │
│              │                                          │            │
│              └─────────────────┬────────────────────────┘            │
│                                │                                      │
│                                ▼                                      │
│              ┌─────────────────────────────────────────────┐         │
│              │                TOOL LAYER                    │         │
│              │                                              │         │
│              │   📧 Gmail API ◄──── Gets your real emails  │         │
│              │   📋 ClickUp   ◄──── Your tasks             │         │
│              │   📅 Calendar  ◄──── Your events            │         │
│              │   📄 Doc Gen   ◄──── Creates PDFs           │         │
│              │                                              │         │
│              └─────────────────────────────────────────────┘         │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Setup (Just 1 API Key!)

### Step 1: Get OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create account → API Keys → Create new key
3. Copy the key starting with `sk-`

### Step 2: Create Environment File

```bash
cd "Angelina AI System/angelina-app/web"
```

Create `.env.local`:

```env
# Only ONE key needed! 🎉
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-key-here
OPENAI_API_KEY=sk-your-key-here
```

### Step 3: Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click the microphone!

---

## 🎙️ How Voice Works

### OpenAI Realtime API Flow:

1. **You speak** into microphone
2. **Audio streams** directly to OpenAI
3. **GPT-4o processes** your voice (no text conversion needed!)
4. **AI generates** response with voice
5. **You hear** Angelina speak in ~300ms

### Why This is Better:

| Feature | Old Way (Deepgram+OpenAI) | New Way (OpenAI Realtime) |
|---------|---------------------------|---------------------------|
| Latency | 2-3 seconds | ~300ms ⚡ |
| Interruptions | ❌ Complex | ✅ Native |
| Voice quality | Good | Natural (emotional!) |
| Cost | ~$0.02/exchange | ~$0.06/min |
| Complexity | 3 services | 1 service |

---

## 🛠️ Available Tools

Angelina can use these tools via voice or text:

| Tool | Voice Command Example | Status |
|------|----------------------|--------|
| `check_email` | "Check my email" | ✅ Ready |
| `create_task` | "Create a task to call John tomorrow" | ✅ Ready |
| `check_calendar` | "What's on my calendar this week?" | ✅ Ready |
| `send_email` | "Send an email to..." | 🔧 Add Gmail OAuth |
| `generate_document` | "Create a quotation for..." | 🔧 Coming |

---

## 📧 Gmail Integration (Optional)

To let Angelina read/send your actual emails:

### Step 1: Google Cloud Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project "Angelina AI"
3. Enable **Gmail API**
4. Create **OAuth 2.0 credentials**
5. Add your email to test users

### Step 2: Get Refresh Token

1. Go to [OAuth 2.0 Playground](https://developers.google.com/oauthplayground/)
2. Select Gmail API scopes
3. Authorize with your account
4. Exchange code for tokens
5. Copy the **refresh_token**

### Step 3: Add to Environment

```env
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=your-refresh-token
```

---

## 💰 Cost Breakdown

### OpenAI Realtime API Pricing:

| Type | Cost |
|------|------|
| Audio input | $0.06 / minute |
| Audio output | $0.24 / minute |
| Text tokens | Same as GPT-4o |

### Example Usage:

- **1 minute conversation**: ~$0.30
- **10 conversations/day**: ~$3/day
- **Monthly (casual use)**: ~$50-100

### Cost Optimization Tips:

1. Use text chat for quick queries
2. Voice for complex/hands-free tasks
3. Set daily spending limits in OpenAI dashboard

---

## 🔧 Adding New Tools

Want Angelina to do more? Easy!

### 1. Add Tool Definition (in `page.tsx`):

```typescript
{
  name: 'whatsapp_message',
  description: 'Send a WhatsApp message',
  parameters: {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Phone number' },
      message: { type: 'string', description: 'Message text' },
    },
    required: ['to', 'message'],
  },
}
```

### 2. Create API Endpoint:

Create `src/app/api/tools/whatsapp_message/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const { to, message } = await request.json();
  
  // Your WhatsApp API logic here
  
  return NextResponse.json({ success: true, sent: true });
}
```

That's it! Angelina will automatically know how to use it.

---

## 📁 File Structure

```
angelina-app/web/
├── src/
│   ├── lib/
│   │   ├── voice.ts          # OpenAI Realtime Voice client
│   │   └── ai-agent.ts       # Text chat agent
│   │
│   └── app/
│       ├── page.tsx          # Main chat interface
│       └── api/
│           ├── chat/route.ts         # Text chat API
│           ├── tts/route.ts          # TTS fallback
│           └── tools/
│               └── check_email/route.ts  # Gmail tool
```

---

## 🔐 Security Notes

1. **API Keys**: Never commit `.env.local` to git
2. **Browser Keys**: `NEXT_PUBLIC_*` keys are exposed to browser
3. **Rate Limits**: Set spending limits in OpenAI dashboard
4. **OAuth**: Use refresh tokens, not access tokens

---

## ❓ Troubleshooting

**Voice not working?**
- Check browser microphone permissions
- Verify OpenAI API key has Realtime API access
- Check console for WebSocket errors

**"API key invalid"?**
- Make sure key starts with `sk-`
- Verify billing is set up in OpenAI

**High latency?**
- Check internet connection
- OpenAI Realtime requires stable connection

---

## 🚀 Next Steps

Once basic voice works:

1. **Add Gmail** for real email integration
2. **Add ClickUp** for task management  
3. **Add Calendar** for scheduling
4. **Deploy** to Vercel for public access

Ready to go! Just add your OpenAI key and start talking to Angelina! 🎤
