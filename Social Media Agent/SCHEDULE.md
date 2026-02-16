# Social Media Agent – Posting Schedule

## Optimal Posting Times (IST)

| Platform   | Best Times (IST)        | Why |
|------------|-------------------------|-----|
| LinkedIn   | 8-9 AM, 12-1 PM, 5-6 PM | Before work, lunch, after work |
| Twitter/X  | 9 AM, 12 PM, 6 PM, 9 PM | Multiple touchpoints |
| Instagram  | 11 AM, 7-9 PM           | Lunch scroll, evening relax |
| YouTube    | 2-4 PM, 9-11 PM         | Afternoon + late night viewers |

## Weekly Schedule

### Monday
| Time      | Platform  | Content |
|-----------|-----------|---------|
| 8:30 AM   | LinkedIn  | Motivation / Week ahead post |
| 9:00 AM   | Twitter   | Quick tip tweet |
| 12:00 PM  | Twitter   | Thread or insight |
| 7:00 PM   | Instagram | Reel (avatar) |

### Tuesday
| Time      | Platform  | Content |
|-----------|-----------|---------|
| 8:30 AM   | LinkedIn  | Tutorial / How-to post |
| 9:00 AM   | Twitter   | Engagement tweet (question) |
| 6:00 PM   | Twitter   | Retweet + comment on trending |

### Wednesday
| Time      | Platform  | Content |
|-----------|-----------|---------|
| 8:30 AM   | LinkedIn  | Story / Personal insight |
| 9:00 AM   | Twitter   | Quick tip |
| 12:00 PM  | Twitter   | Thread |
| 7:00 PM   | Instagram | Reel (avatar) |
| 3:00 PM   | YouTube   | Short upload |

### Thursday
| Time      | Platform  | Content |
|-----------|-----------|---------|
| 8:30 AM   | LinkedIn  | Industry news / Opinion |
| 9:00 AM   | Twitter   | Hot take or insight |
| 6:00 PM   | Twitter   | Engagement |

### Friday
| Time      | Platform  | Content |
|-----------|-----------|---------|
| 8:30 AM   | LinkedIn  | Case study / Results post |
| 9:00 AM   | Twitter   | Quick tip |
| 12:00 PM  | Twitter   | Weekend preview |
| 7:00 PM   | Instagram | Reel (avatar) |

### Saturday
| Time      | Platform  | Content |
|-----------|-----------|---------|
| 10:00 AM  | Twitter   | Casual / BTS tweet |
| 3:00 PM   | YouTube   | Short or Long video |

### Sunday
| Time      | Platform  | Content |
|-----------|-----------|---------|
| 10:00 AM  | Twitter   | Weekly recap / learnings |
| 5:00 PM   | LinkedIn  | Week reflection (optional) |

## Content Types per Platform

### LinkedIn (7/week)
- 2x How-to / Tutorial
- 2x Personal story / Insight
- 1x Industry news / Opinion
- 1x Case study / Results
- 1x Motivation / Engagement

### Twitter (14/week)
- 4x Quick tips
- 3x Threads
- 3x Questions / Engagement
- 2x Hot takes
- 2x Retweets + comments

### Instagram (3/week)
- 3x Short avatar videos (Reels)
- Topics: AI tips, automation demos, quick tutorials

### YouTube (2/week)
- 1-2x Shorts (30-60s)
- 1x Long-form (optional, every 2 weeks)

## Automation Flow

```
[Cron Trigger] → [Fetch scheduled content from queue]
                           ↓
              [Generate image/video if needed]
                           ↓
                    [Post to platform]
                           ↓
                  [Log to Google Sheet]
```

## Content Queue Structure

| Field          | Type     | Example |
|----------------|----------|---------|
| id             | UUID     | abc-123 |
| platform       | String   | linkedin |
| scheduled_time | DateTime | 2026-02-04 08:30:00 |
| content_type   | String   | post |
| text           | String   | "AI automation is..." |
| image_prompt   | String   | "Professional AI image..." |
| image_url      | String   | (generated) |
| video_url      | String   | (if applicable) |
| status         | String   | pending / posted / failed |
| posted_at      | DateTime | (after posting) |

## Metrics to Track

- Impressions
- Engagement (likes, comments, shares)
- Follower growth
- Click-through rate
- Best performing content types
