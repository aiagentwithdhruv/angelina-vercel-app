# Social Media Agent – Angelina

Auto-post to LinkedIn, Twitter/X, Instagram, YouTube using AI-generated content, images, and videos.

## Platforms

| Platform   | Content Type       | Frequency Target |
|------------|--------------------|------------------|
| LinkedIn   | Post + Image       | 1/day            |
| Twitter/X  | Tweet + Image      | 2-3/day          |
| Instagram  | Video (avatar)     | 1/day or 3/week  |
| YouTube    | Shorts + Long      | 2 shorts/week, 1 long/week |

## Content Pipeline

1. **Topic Generation** – AI picks trending/relevant topics
2. **Script/Caption** – AI writes post text or video script
3. **Image Generation** – HD image via free API
4. **Video Generation** – Avatar video via free API
5. **Scheduling** – Queue and post at optimal times
6. **Analytics** – Track engagement (later phase)

## Tech Stack (Free/Low-Cost, Practical)

### Image Generation
| Tool        | Free Tier | Quality | Notes |
|-------------|-----------|---------|-------|
| fal.ai      | Yes       | High    | Fast, many models, generous free tier |
| Replicate   | Yes       | High    | Pay-per-use, many models |
| Leonardo.ai | Yes       | High    | 150 free credits/day |
| DALL-E 3    | No        | High    | OpenAI API, paid |
| Ideogram    | Yes       | High    | Good for text in images |

**Recommended:** fal.ai (fast, free, high quality)

### Video Generation (Avatar)
| Tool          | Free Tier | Quality | Notes |
|---------------|-----------|---------|-------|
| HeyGen        | Limited   | High    | Best avatar quality, paid after trial |
| D-ID          | Limited   | High    | 5 min free, then paid |
| Synthesia     | No        | High    | Enterprise only |
| Kling AI      | Yes       | Good    | Chinese, decent free tier |
| MuseTalk      | Yes (OSS) | Medium  | Open-source, self-host |
| Wav2Lip       | Yes (OSS) | Medium  | Open-source lip-sync |
| SadTalker     | Yes (OSS) | Medium  | Open-source, good results |

**Recommended:** Kling AI (free tier) or MuseTalk/SadTalker (self-host)

### Text/Script Generation
| Tool          | Free Tier | Notes |
|---------------|-----------|-------|
| OpenAI GPT    | No        | Best quality, paid |
| Claude        | No        | Best quality, paid |
| Groq          | Yes       | Fast, free tier |
| Ollama/Local  | Yes       | Self-host, free |
| Euri Gateway  | Yes       | Unified API |

**Recommended:** Groq (fast, free) or Ollama (local, free)

### Posting APIs
| Platform   | Method              | Notes |
|------------|---------------------|-------|
| LinkedIn   | LinkedIn API / n8n  | OAuth, post + image |
| Twitter/X  | Twitter API v2      | OAuth, free tier limited |
| Instagram  | Meta Graph API      | Business account required |
| YouTube    | YouTube Data API    | OAuth, upload videos |

**Recommended:** n8n nodes for all (already have n8n setup)

## Architecture

```
[Topic Generator] → [Script Writer] → [Image/Video Generator]
                                            ↓
                                      [Content Queue]
                                            ↓
                                   [Scheduler + Poster]
                                            ↓
                            [LinkedIn / X / Insta / YouTube]
```

## Phase Plan

### Phase 1 (This Week)
- LinkedIn + Twitter text posts with AI images
- Use fal.ai for images, Groq for text
- n8n workflows for posting

### Phase 2 (Next Week)
- Instagram video posts (avatar)
- YouTube Shorts
- Use Kling AI or MuseTalk for avatar videos

### Phase 3 (Later)
- YouTube long-form
- Analytics tracking
- Content calendar UI

## Folder Structure

```
Social Media Agent/
├── OVERVIEW.md (this file)
├── TOOLS.md (detailed tool research)
├── PROMPTS.md (content generation prompts)
├── WORKFLOWS.md (n8n workflow docs)
├── TEMPLATES.md (post templates)
└── SCHEDULE.md (posting schedule)
```

## Quick Start

1. Set up fal.ai account (free)
2. Set up Groq API (free)
3. Connect LinkedIn/Twitter in n8n
4. Run first automated post

## Notes

- Focus on sustainable, free tools first
- Upgrade to paid tools when ROI is clear
- Keep avatar videos short (< 60s) for free tiers
- Batch content creation to save API calls
