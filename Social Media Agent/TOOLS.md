# Social Media Agent – Tools Research

## Image Generation (Free/Low-Cost)

### fal.ai
- **Free Tier:** Yes, generous
- **Models:** Flux, SDXL, Stable Diffusion, many more
- **Speed:** Fast (< 10s)
- **API:** REST, easy integration
- **Link:** https://fal.ai
- **Verdict:** ✅ Best free option

### Leonardo.ai
- **Free Tier:** 150 credits/day
- **Models:** Custom fine-tuned, good quality
- **Speed:** Medium
- **API:** Yes
- **Link:** https://leonardo.ai
- **Verdict:** ✅ Good backup

### Ideogram
- **Free Tier:** Yes
- **Models:** Good for text-in-image
- **Speed:** Medium
- **API:** Limited
- **Link:** https://ideogram.ai
- **Verdict:** ✅ For text-heavy images

### Replicate
- **Free Tier:** Pay-per-use (cheap)
- **Models:** Thousands
- **Speed:** Varies
- **API:** Easy
- **Link:** https://replicate.com
- **Verdict:** ⚠️ Not free, but flexible

### DALL-E 3 (OpenAI)
- **Free Tier:** No
- **Quality:** Highest
- **Verdict:** ❌ Paid only

---

## Video Generation (Avatar)

### Kling AI
- **Free Tier:** Yes (limited daily)
- **Quality:** Good
- **Length:** Up to 5-10s free
- **Link:** https://klingai.com
- **Verdict:** ✅ Best free avatar video

### HeyGen
- **Free Tier:** 1 min trial
- **Quality:** Highest
- **Pricing:** $24/mo starter
- **Link:** https://heygen.com
- **Verdict:** ⚠️ Paid, but best quality

### D-ID
- **Free Tier:** 5 min total
- **Quality:** High
- **Link:** https://d-id.com
- **Verdict:** ⚠️ Limited free

### Synthesia
- **Free Tier:** No
- **Quality:** Enterprise
- **Verdict:** ❌ Not for us

### MuseTalk (Open Source)
- **Free:** Yes, self-host
- **Quality:** Medium-Good
- **Requires:** GPU, Python
- **Link:** https://github.com/TMElyralab/MuseTalk
- **Verdict:** ✅ Free if self-hosted

### SadTalker (Open Source)
- **Free:** Yes, self-host
- **Quality:** Medium
- **Requires:** GPU, Python
- **Link:** https://github.com/OpenTalker/SadTalker
- **Verdict:** ✅ Free if self-hosted

### Wav2Lip (Open Source)
- **Free:** Yes, self-host
- **Quality:** Good lip-sync
- **Requires:** GPU, Python
- **Link:** https://github.com/Rudrabha/Wav2Lip
- **Verdict:** ✅ Good for lip-sync on existing video

---

## Text/LLM (Free)

### Groq
- **Free Tier:** Yes, generous
- **Models:** Llama 3, Mixtral
- **Speed:** Fastest
- **Link:** https://groq.com
- **Verdict:** ✅ Best free LLM

### Ollama (Local)
- **Free:** Yes
- **Models:** Llama 3, Mistral, etc.
- **Requires:** Local machine
- **Link:** https://ollama.ai
- **Verdict:** ✅ Free, private

### Euri Gateway (Euron)
- **Free Tier:** Yes (student)
- **Models:** Multiple providers
- **Link:** https://euron.one/euri
- **Verdict:** ✅ If you have access

---

## TTS (Text-to-Speech)

### ElevenLabs
- **Free Tier:** 10k chars/month
- **Quality:** Highest
- **Link:** https://elevenlabs.io
- **Verdict:** ✅ Best quality, limited free

### PlayHT
- **Free Tier:** Limited
- **Quality:** High
- **Link:** https://play.ht
- **Verdict:** ⚠️ Limited free

### Coqui TTS (Open Source)
- **Free:** Yes, self-host
- **Quality:** Good
- **Link:** https://github.com/coqui-ai/TTS
- **Verdict:** ✅ Free if self-hosted

### Edge TTS (Microsoft)
- **Free:** Yes
- **Quality:** Good
- **Link:** Python package `edge-tts`
- **Verdict:** ✅ Free, easy

---

## Posting APIs

### LinkedIn
- **Method:** LinkedIn API (OAuth 2.0)
- **n8n Node:** Yes
- **Requirements:** Company page or personal profile
- **Limits:** 100 posts/day (generous)

### Twitter/X
- **Method:** Twitter API v2
- **n8n Node:** Yes
- **Free Tier:** 1,500 tweets/month (read), limited write
- **Requirements:** Developer account

### Instagram
- **Method:** Meta Graph API
- **n8n Node:** Yes
- **Requirements:** Business/Creator account + Facebook Page
- **Note:** Video posts require specific formats

### YouTube
- **Method:** YouTube Data API v3
- **n8n Node:** Yes
- **Quota:** 10,000 units/day (upload = 1,600 units)
- **Requirements:** Google Cloud project + OAuth

---

## Recommended Stack (Free, Practical)

| Component       | Tool               | Why |
|-----------------|--------------------|-----|
| Images          | fal.ai             | Free, fast, high quality |
| LLM             | Groq               | Free, fast |
| Avatar Video    | Kling AI           | Free tier, decent quality |
| TTS             | Edge TTS           | Free, good quality |
| Lip Sync        | Wav2Lip (self-host)| Free, good results |
| Posting         | n8n                | Already set up |
| Scheduling      | n8n + Cron         | Already set up |

---

## Quick Start APIs

### fal.ai Image Generation
```bash
pip install fal-client
```

```python
import fal_client

result = fal_client.run("fal-ai/flux/schnell", {
    "prompt": "Professional LinkedIn post image about AI automation",
    "image_size": "landscape_16_9"
})
print(result["images"][0]["url"])
```

### Groq Text Generation
```bash
pip install groq
```

```python
from groq import Groq

client = Groq(api_key="your_key")
response = client.chat.completions.create(
    model="llama3-8b-8192",
    messages=[{"role": "user", "content": "Write a LinkedIn post about AI automation"}]
)
print(response.choices[0].message.content)
```

### Edge TTS
```bash
pip install edge-tts
```

```python
import edge_tts
import asyncio

async def speak(text, output_file):
    communicate = edge_tts.Communicate(text, "en-US-AriaNeural")
    await communicate.save(output_file)

asyncio.run(speak("Hello, this is Angelina AI", "output.mp3"))
```
