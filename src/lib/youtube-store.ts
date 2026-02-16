/**
 * YouTube Data Store
 * JSON file-based persistence for YouTube channel & video analytics.
 * Pattern: same as tasks-store.ts (readFile/writeFile at process.cwd())
 */

import fs from 'fs';
import path from 'path';

// ── Types ──

export interface YouTubeChannel {
  id: string;
  title: string;
  customUrl: string;
  subscriberCount: number;
  totalViews: number;
  videoCount: number;
  thumbnailUrl: string;
  publishedAt: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  duration: string;
  durationSeconds: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  tags?: string[];
}

export interface YouTubeAnalytics {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalDurationSeconds: number;
  averageViewsPerVideo: number;
  averageLikesPerVideo: number;
  averageCommentsPerVideo: number;
  averageDurationSeconds: number;
  engagementRate: number;
  topVideosByViews: YouTubeVideo[];
  topVideosByLikes: YouTubeVideo[];
  recentUploads: YouTubeVideo[];
  viewsOverTime: Array<{ date: string; views: number; title: string }>;
  uploadFrequency: Array<{ month: string; count: number }>;
}

export interface YouTubeDataStore {
  channel: YouTubeChannel | null;
  videos: YouTubeVideo[];
  analytics: YouTubeAnalytics | null;
  lastFetched: string | null;
  channelId: string | null;
}

// ── File I/O ──

const DATA_FILE = path.join(process.cwd(), 'youtube-data.json');
const CACHE_HOURS = 6;

function readStore(): YouTubeDataStore {
  try {
    if (!fs.existsSync(DATA_FILE)) return emptyStore();
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as YouTubeDataStore;
  } catch {
    return emptyStore();
  }
}

function writeStore(data: YouTubeDataStore): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function emptyStore(): YouTubeDataStore {
  return {
    channel: null,
    videos: [],
    analytics: null,
    lastFetched: null,
    channelId: null,
  };
}

// ── Public API ──

export function getYouTubeData(): YouTubeDataStore {
  return readStore();
}

export function isCacheValid(): boolean {
  const data = readStore();
  if (!data.lastFetched) return false;
  const age = Date.now() - new Date(data.lastFetched).getTime();
  return age < CACHE_HOURS * 60 * 60 * 1000;
}

export function getCacheAge(): string | null {
  const data = readStore();
  if (!data.lastFetched) return null;
  const ms = Date.now() - new Date(data.lastFetched).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function updateYouTubeData(
  channel: YouTubeChannel,
  videos: YouTubeVideo[],
): YouTubeDataStore {
  const analytics = computeAnalytics(videos);
  const store: YouTubeDataStore = {
    channel,
    videos,
    analytics,
    lastFetched: new Date().toISOString(),
    channelId: channel.id,
  };
  writeStore(store);
  return store;
}

// ── Duration Parsing ──

export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  return h * 3600 + m * 60 + s;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ── Analytics Computation (zero API cost, pure math) ──

function computeAnalytics(videos: YouTubeVideo[]): YouTubeAnalytics {
  const count = videos.length || 1;

  const totalViews = videos.reduce((s, v) => s + v.viewCount, 0);
  const totalLikes = videos.reduce((s, v) => s + v.likeCount, 0);
  const totalComments = videos.reduce((s, v) => s + v.commentCount, 0);
  const totalDurationSeconds = videos.reduce((s, v) => s + v.durationSeconds, 0);

  const sorted = [...videos].sort((a, b) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  const topByViews = [...videos].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
  const topByLikes = [...videos].sort((a, b) => b.likeCount - a.likeCount).slice(0, 5);

  // Views over time (recent 20 videos, oldest first for chart)
  const viewsOverTime = sorted.slice(0, 20).reverse().map(v => ({
    date: new Date(v.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: v.viewCount,
    title: v.title.length > 30 ? v.title.substring(0, 30) + '...' : v.title,
  }));

  // Upload frequency by month (last 12 months)
  const monthCounts: Record<string, number> = {};
  videos.forEach(v => {
    const d = new Date(v.publishedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthCounts[key] = (monthCounts[key] || 0) + 1;
  });
  const uploadFrequency = Object.entries(monthCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, count]) => ({
      month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      count,
    }));

  return {
    totalViews,
    totalLikes,
    totalComments,
    totalDurationSeconds,
    averageViewsPerVideo: Math.round(totalViews / count),
    averageLikesPerVideo: Math.round(totalLikes / count),
    averageCommentsPerVideo: Math.round(totalComments / count),
    averageDurationSeconds: Math.round(totalDurationSeconds / count),
    engagementRate: totalViews > 0
      ? parseFloat(((totalLikes + totalComments) / totalViews * 100).toFixed(2))
      : 0,
    topVideosByViews: topByViews,
    topVideosByLikes: topByLikes,
    recentUploads: sorted.slice(0, 5),
    viewsOverTime,
    uploadFrequency,
  };
}
