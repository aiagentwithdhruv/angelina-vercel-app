/**
 * YouTube Analytics Tool
 * Returns cached YouTube data for Angelina to analyze on-demand.
 * Zero API calls — reads from youtube-data.json cache.
 */

import { NextResponse } from 'next/server';
import { getYouTubeData, formatDuration } from '@/lib/youtube-store';

export async function POST() {
  try {
    const data = getYouTubeData();

    if (!data.channel || !data.analytics) {
      return NextResponse.json({
        result: 'No YouTube data available yet. Ask Dhruv to go to the Social Media dashboard (/social) and click Refresh to fetch his YouTube data first.',
      });
    }

    const { channel, analytics, videos } = data;

    // Build a concise summary for the AI (token-efficient)
    const topVideos = analytics.topVideosByViews.slice(0, 5).map((v, i) =>
      `${i + 1}. "${v.title}" — ${v.viewCount.toLocaleString()} views, ${v.likeCount} likes, ${v.commentCount} comments`
    ).join('\n');

    const recentVideos = analytics.recentUploads.slice(0, 5).map((v, i) =>
      `${i + 1}. "${v.title}" — ${v.viewCount.toLocaleString()} views (${new Date(v.publishedAt).toLocaleDateString()})`
    ).join('\n');

    const summary = `## YouTube Channel: ${channel.title} (${channel.customUrl})

### Channel Stats
- Subscribers: ${channel.subscriberCount.toLocaleString()}
- Total Views: ${channel.totalViews.toLocaleString()}
- Total Videos: ${channel.videoCount}
- Engagement Rate: ${analytics.engagementRate}% (likes + comments / views)

### Averages Per Video
- Views: ${analytics.averageViewsPerVideo.toLocaleString()}
- Likes: ${analytics.averageLikesPerVideo}
- Comments: ${analytics.averageCommentsPerVideo}
- Duration: ${formatDuration(analytics.averageDurationSeconds)}

### Top 5 Videos (by views)
${topVideos}

### Recent 5 Uploads
${recentVideos}

### Upload Pattern
- Total content duration: ${formatDuration(analytics.totalDurationSeconds)}
- Total likes: ${analytics.totalLikes.toLocaleString()}
- Total comments: ${analytics.totalComments.toLocaleString()}
- Like-to-view ratio: ${analytics.totalViews > 0 ? ((analytics.totalLikes / analytics.totalViews) * 100).toFixed(2) : 0}%

Data last updated: ${data.lastFetched || 'never'}`;

    return NextResponse.json({ result: summary });
  } catch (error: any) {
    console.error('[YouTube Analytics Tool] Error:', error);
    return NextResponse.json({
      result: `Error reading YouTube data: ${error.message}`,
    });
  }
}
