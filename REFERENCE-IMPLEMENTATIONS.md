# Reference Implementations & External Ideas

> External projects, patterns, and tech stacks to learn from for Angelina AI System

**Last Updated:** February 4, 2026

---

## Project Cyra (Voice Email Assistant)

**GitHub:** https://github.com/DhruvBarthwal/Project_Cyra
**Author:** Dhruv Barthwal

### What It Does
Voice-first AI email assistant that lets you read, manage, and send emails hands-free using natural conversation.

### Tech Stack (Validated)
| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js + TypeScript |
| **Backend** | FastAPI (Python) |
| **Agent Framework** | LangGraph (StateGraph) |
| **Voice STT** | Deepgram |
| **Voice TTS** | Deepgram Speak API |
| **LLM** | Groq (Llama) + Google Gemini |
| **Email API** | Gmail API with OAuth2 |

### Voice Skills (Production-Ready)

#### Email Management Commands
| Command | Action |
|---------|--------|
| "Read my emails" | Read latest inbox email |
| "Next" / "Previous" | Navigate through inbox |
| "Read emails from [sender]" | Filter by sender |
| "Summarize this email" | AI extracts sender, purpose, key points, deadlines |
| "Star this email" | Add to starred |
| "Unstar this email" | Remove from starred |
| "Delete this email" | Move to trash (with confirmation) |
| "Undo delete" | Restore from trash |
| "Reset" / "Cancel" | Cancel current action |

#### Compose Email (Conversational Flow)
Voice-guided step-by-step composition:
1. "Compose email to John" → triggers flow
2. System asks: "What's the recipient email?"
3. System asks: "What's the email provider?" (gmail, outlook, etc.)
4. System asks: "What's the subject?"
5. System asks: "What's the body?"
6. System confirms: "Ready to send?"
7. User: "Yes" → sends | "No" → cancels

### Key Patterns to Reuse

#### 1. StateGraph Architecture (LangGraph)
```
Entry Point: intent_node (classifies user input)
     ↓
Conditional Router: routes to action nodes based on intent
     ↓
Action Nodes: execute task and update state
     ↓
Session Persistence: store state between turns
```

#### 2. Intent Classification (Hybrid Approach)
- **Fast regex/keyword fallback first** (no API cost)
- **LLM only for UNKNOWN intents** (saves tokens)
- Clear intent taxonomy:
  - READ_EMAIL, DELETE_EMAIL, COMPOSE_EMAIL
  - STAR_EMAIL, UNSTAR_EMAIL
  - NEXT_EMAIL, PREV_EMAIL
  - RESET, UNKNOWN

#### 3. Conversational Multi-Step Flows
- `awaiting_field` state variable tracks which question was asked
- System remembers context across voice turns
- Confirmation gates before destructive actions (delete)
- "Reset" command escapes any flow

#### 4. State Management (AgentState)
```python
class AgentState(TypedDict):
    user_input: str
    intent: str

    # Email reading
    email_id: str
    email_from: str
    email_subject: str
    email_body: str

    # Email composing
    to: Optional[str]
    subject: Optional[str]
    body: Optional[str]
    awaiting_field: Optional[str]  # tracks multi-turn collection

    # Navigation
    navigation: Optional[str]
    email_ids: List[str]
    email_index: int
    sender_filter: Optional[str]

    response: str
```

#### 5. Email Summarization Schema
```python
class EmailSummary(BaseModel):
    sender: str        # Who sent this email
    purpose: str       # Main topic or reason
    key_points: List[str]  # Important details, offers, deadlines
    deadlines: str     # Time-sensitive information
```

### What This Proves for Angelina
1. **LangGraph StateGraph works** for conversational voice agents
2. **Deepgram STT/TTS is production-ready** (fast, accurate)
3. **FastAPI + Next.js** is a solid full-stack combo
4. **Gmail API integration** with OAuth2 works well
5. **Hybrid intent classification** saves costs
6. **Session state management** enables multi-turn flows
7. **Conversational composition** pattern is user-friendly

### Future Improvements (from Cyra roadmap)
- Paid LLM API for better summarization
- LLM tool calling for more nodes
- Message panel UI enhancement
- Pause command and interruption handling

---

## Voice & Video Agentic Platforms (Industry Research)

> Comprehensive research on platforms that enable "do anything with your voice" capabilities

**Research Date:** February 4, 2026

### Platform Categories

#### 1. Developer / API-First Platforms

| Platform | Focus | Latency | Languages | Key Features |
|----------|-------|---------|-----------|--------------|
| **OpenAI Realtime API** | Low-latency voice agents | Sub-1s | 6 voices | Speech-to-speech, tools/function calling, interruptions, WebSocket/WebRTC |
| **Vapi** | Voice AI for developers | <1s (600-900ms) | 100+ | WebSocket streaming, function calling, best for speed |
| **ElevenLabs Conversational AI** | Natural voice agents | Sub-100ms | 32+ | Premium voice quality, customer support, gaming NPCs |
| **Agora Conversational AI** | Real-time voice/video infra | Ultra-low | Many | 80B+ minutes monthly, OpenAI Realtime integration, noise handling |
| **LiveKit Agents** | Voice, video, physical agents | Low | Many | Python/Node.js, multimodal, telehealth, robotics |

**Links:**
- OpenAI Realtime API: https://platform.openai.com/docs/guides/realtime
- Vapi: https://vapi.ai
- ElevenLabs: https://elevenlabs.io/conversational-ai
- Agora: https://agora.io/en/conversational-ai
- LiveKit: https://docs.livekit.io/agents

#### 2. Enterprise / Call-Center Platforms

| Platform | Focus | Uptime | Compliance | Key Features |
|----------|-------|--------|------------|--------------|
| **Retell AI** | Phone call automation | 99.9%+ | SOC 2 | 50+ languages, inbound/outbound calls, best docs |
| **Bland AI** | Enterprise voice AI | High | SOC2/GDPR/HIPAA | Self-hosted, batch calling, voice cloning |
| **Replicant** | Customer service | 99.95% | Enterprise | 100M+ conversations, voice + chat + SMS |
| **Voiceflow** | Low-code voice agents | High | Standard | Visual builder, phone + chat, CRM integrations |

**Links:**
- Retell AI: https://retellai.com
- Bland AI: https://bland.ai
- Replicant: https://replicant.com
- Voiceflow: https://voiceflow.com

#### 3. Consumer Voice-First Devices

| Platform | Price | Key Features |
|----------|-------|--------------|
| **Rabbit R1** | $199 | Large Action Model (LAM), app automation, voice + camera + text |
| **Google Gemini Live** | Free (with Gemini) | Camera, screen share, Maps/Calendar/Tasks, 45+ languages |
| **Pi (Inflection)** | Free | Voice chat, 6 voices, coach/confidant style |

**Links:**
- Rabbit R1: https://rabbit.tech
- Gemini Live: https://gemini.google/overview/gemini-live
- Pi: https://pi.ai

#### 4. Video Avatar Platforms

| Platform | Free Tier | Quality | Key Features |
|----------|-----------|---------|--------------|
| **HeyGen LiveAvatar** | Trial | Highest | Real-time WebRTC, lip-sync, expressions, LLM integration |
| **Synthesia** | No | Enterprise | 230+ avatars, 140+ languages, text-to-video |
| **D-ID** | 5 min | High | API-first, good for prototypes |
| **Kling AI** | Yes (limited) | Good | Best free avatar video |

**Links:**
- HeyGen: https://heygen.com/interactive-avatar
- Synthesia: https://synthesia.io
- D-ID: https://d-id.com
- Kling AI: https://klingai.com

#### 5. Discontinued / Pivoted

| Platform | Status | Notes |
|----------|--------|-------|
| **Humane AI Pin** | Discontinued Feb 2025 | Cosmos OS licensed to others, acquired by HP |

### Key Metrics (2025 Benchmarks)

| Metric | Best-in-Class | Acceptable |
|--------|---------------|------------|
| **Latency** | <300ms (Bland, ElevenLabs) | <1s |
| **STT Accuracy** | 94% (clean audio) | 85% (noisy) |
| **Cost (voice)** | $0.05-0.15/min | Varies |
| **Cost (chat)** | $0.001-0.01/msg | Varies |
| **Implementation** | 2-3 weeks (platform) | 6-12 weeks (custom) |

### Architecture Patterns

#### Pattern 1: Platform-Based (Fastest)
```
User speaks → Vapi/OpenAI Realtime → Built-in LLM → Tools/Functions → TTS → User hears
```
- **Pros:** Fast to build, interruption handling built-in
- **Cons:** Less control, vendor lock-in
- **Best for:** MVPs, quick demos

#### Pattern 2: Custom Stack (More Control)
```
User speaks → WebRTC/WebSocket → Deepgram ASR → LangGraph Agent → Tools → ElevenLabs TTS → User hears
```
- **Pros:** Full control, cost optimization, custom logic
- **Cons:** More work, need to handle interruptions
- **Best for:** Production systems, unique requirements

#### Pattern 3: Hybrid (Recommended for Angelina)
```
User speaks → WebRTC → OpenAI Realtime API (voice + tools) → n8n/MCP (complex workflows) → Voice response
```
- **Pros:** Best of both worlds
- **Cons:** More integration work
- **Best for:** Agentic systems with tool execution

### What "Do Anything With Your Voice" Requires

| Capability | Implementation |
|------------|----------------|
| **Understand speech** | ASR (Whisper, Deepgram) |
| **Think & plan** | LLM + Agent framework (LangGraph) |
| **Execute actions** | Tools, MCP, n8n workflows |
| **Remember context** | Memory (vector DB, session state) |
| **Respond naturally** | TTS (ElevenLabs, PlayHT) |
| **Handle interruptions** | Realtime API or custom VAD |
| **Show avatar (optional)** | HeyGen, D-ID, Synthesia |

### Recommended Stack for Angelina

Based on research and existing PRD:

| Layer | Recommended | Alternative |
|-------|-------------|-------------|
| **Realtime Voice** | OpenAI Realtime API | Vapi, LiveKit |
| **ASR (fallback)** | Deepgram | Whisper |
| **TTS (fallback)** | ElevenLabs | PlayHT, Azure |
| **Agent Framework** | LangGraph | CrewAI |
| **Tools** | MCP + n8n | Custom |
| **Avatar (Phase 2+)** | HeyGen LiveAvatar | D-ID |
| **Frontend** | Next.js + WebRTC | - |

### Implementation Roadmap

**Phase 1: Voice MVP**
1. Add Deepgram ASR (streaming) to existing stack
2. Wire LangGraph StateGraph for intent routing
3. Connect to n8n/MCP tools
4. Test with existing TTS (`speak.sh`)

**Phase 2: Real-Time Voice**
1. Integrate OpenAI Realtime API for bidirectional voice
2. Add interruption handling
3. WebRTC in Next.js frontend
4. Voice activity detection (VAD)

**Phase 3: Avatar**
1. Integrate HeyGen LiveAvatar API
2. Sync lip-sync with TTS output
3. Web-based avatar rendering
4. Optional: Self-hosted (MuseTalk) for cost savings

### Cost Optimization Strategies

| Strategy | Savings |
|----------|---------|
| Use smaller models for simple intents | 50-70% |
| Cache common responses | 20-30% |
| Hybrid intent detection (regex first) | 40-60% |
| Batch non-urgent requests | Variable |
| Self-host avatar (MuseTalk) | 80%+ vs SaaS |

### What This Research Proves for Angelina

1. **Angelina's vision aligns** with industry direction (voice-first, agentic, multimodal)
2. **OpenAI Realtime API** is the recommended starting point for voice
3. **LangGraph pattern** (from Cyra) extends to voice agents
4. **HeyGen** is the best avatar option for Phase 2+
5. **MCP + n8n** enables "do anything" through tools
6. **Sub-1s latency** is achievable with the right stack
7. **Cost optimization** is critical for production

---

## How to Add More References

When you find a useful project:
1. Add a new section with the project name
2. Include: GitHub link, author, tech stack
3. Document key patterns that Angelina can reuse
4. Note what it proves/validates

---

## Ideas Backlog

### Voice Providers to Evaluate
- [ ] Deepgram (proven by Cyra)
- [ ] ElevenLabs (premium quality)
- [ ] PlayHT
- [ ] Azure TTS
- [ ] OpenAI Realtime API

### Agent Frameworks to Evaluate
- [x] LangGraph (proven by Cyra)
- [ ] CrewAI
- [ ] AutoGen
- [ ] Agency Swarm

### Email Integrations
- [x] Gmail API (proven by Cyra)
- [ ] Microsoft Graph API (Outlook)
- [ ] IMAP/SMTP generic
