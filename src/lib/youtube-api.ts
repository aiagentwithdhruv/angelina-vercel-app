/**
 * YouTube Data API v3 Client
 * Cost-effective: channels.list (1 unit) + playlistItems (1/page) + videos.list (1/batch of 50)
 * Total: ~3-7 units per full fetch for channels with <200 videos
 */

import { YouTubeChannel, YouTubeVideo, parseDuration } from './youtube-store';

const YT_BASE = 'https://www.googleapis.com/youtube/v3';

async function ytFetch(endpoint: string, params: Record<string, string>, accessToken: string) {
  const url = new URL(`${YT_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `YouTube API error: ${res.status}`);
  }
  return res.json();
}

/**
 * Fetch channel info. Uses `mine=true` for authenticated user's channel,
 * or `id={channelId}` / `forHandle={handle}` for specific channels.
 * Cost: 1 quota unit
 */
export async function fetchChannelInfo(
  accessToken: string,
  channelId?: string,
): Promise<{ channel: YouTubeChannel; uploadsPlaylistId: string } | null> {
  const params: Record<string, string> = {
    part: 'snippet,statistics,contentDetails',
  };

  if (channelId) {
    if (channelId.startsWith('@')) {
      params.forHandle = channelId;
    } else {
      params.id = channelId;
    }
  } else {
    params.mine = 'true';
  }

  const data = await ytFetch('channels', params, accessToken);
  const item = data.items?.[0];
  if (!item) return null;

  return {
    channel: {
      id: item.id,
      title: item.snippet.title,
      customUrl: item.snippet.customUrl || '',
      subscriberCount: parseInt(item.statistics.subscriberCount || '0', 10),
      totalViews: parseInt(item.statistics.viewCount || '0', 10),
      videoCount: parseInt(item.statistics.videoCount || '0', 10),
      thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
      publishedAt: item.snippet.publishedAt,
    },
    uploadsPlaylistId: item.contentDetails.relatedPlaylists.uploads,
  };
}

/**
 * Fetch all video IDs from the uploads playlist.
 * Cost: 1 unit per page of 50 items
 */
export async function fetchAllVideoIds(
  accessToken: string,
  uploadsPlaylistId: string,
  maxVideos = 200,
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  while (ids.length < maxVideos) {
    const params: Record<string, string> = {
      part: 'contentDetails',
      playlistId: uploadsPlaylistId,
      maxResults: '50',
    };
    if (pageToken) params.pageToken = pageToken;

    const data = await ytFetch('playlistItems', params, accessToken);
    const items = data.items || [];
    items.forEach((item: any) => {
      if (item.contentDetails?.videoId) {
        ids.push(item.contentDetails.videoId);
      }
    });

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return ids;
}

/**
 * Fetch video details in batches of 50.
 * Cost: 1 unit per batch
 */
export async function fetchVideoDetails(
  accessToken: string,
  videoIds: string[],
): Promise<YouTubeVideo[]> {
  const videos: YouTubeVideo[] = [];

  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const data = await ytFetch('videos', {
      part: 'snippet,statistics,contentDetails',
      id: batch.join(','),
    }, accessToken);

    for (const item of data.items || []) {
      const duration = item.contentDetails?.duration || 'PT0S';
      videos.push({
        id: item.id,
        title: item.snippet.title,
        publishedAt: item.snippet.publishedAt,
        thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
        duration,
        durationSeconds: parseDuration(duration),
        viewCount: parseInt(item.statistics?.viewCount || '0', 10),
        likeCount: parseInt(item.statistics?.likeCount || '0', 10),
        commentCount: parseInt(item.statistics?.commentCount || '0', 10),
        tags: item.snippet.tags?.slice(0, 10),
      });
    }
  }

  return videos;
}

/**
 * Full fetch: channel info + all videos.
 * Cost: 3-7 units total depending on video count.
 */
export async function fetchAllYouTubeData(
  accessToken: string,
  channelId?: string,
): Promise<{ channel: YouTubeChannel; videos: YouTubeVideo[] }> {
  const channelResult = await fetchChannelInfo(accessToken, channelId);
  if (!channelResult) throw new Error('Channel not found');

  const videoIds = await fetchAllVideoIds(accessToken, channelResult.uploadsPlaylistId);
  const videos = videoIds.length > 0
    ? await fetchVideoDetails(accessToken, videoIds)
    : [];

  return { channel: channelResult.channel, videos };
}
