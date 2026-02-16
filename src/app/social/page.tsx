'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/header';
import { MobileLayout } from '@/components/layout/mobile-layout';
import {
  RefreshCw, Youtube, Instagram, Linkedin, Twitter,
  Eye, ThumbsUp, MessageSquare, Clock, TrendingUp, Users, PlayCircle, ExternalLink,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

// ── Types (mirrors youtube-store.ts) ──
interface YouTubeChannel {
  id: string; title: string; customUrl: string;
  subscriberCount: number; totalViews: number; videoCount: number;
  thumbnailUrl: string;
}

interface YouTubeVideo {
  id: string; title: string; publishedAt: string; thumbnailUrl: string;
  duration: string; durationSeconds: number;
  viewCount: number; likeCount: number; commentCount: number;
}

interface YouTubeAnalytics {
  totalViews: number; totalLikes: number; totalComments: number;
  totalDurationSeconds: number;
  averageViewsPerVideo: number; averageLikesPerVideo: number;
  averageCommentsPerVideo: number; averageDurationSeconds: number;
  engagementRate: number;
  topVideosByViews: YouTubeVideo[];
  topVideosByLikes: YouTubeVideo[];
  recentUploads: YouTubeVideo[];
  viewsOverTime: Array<{ date: string; views: number; title: string }>;
  uploadFrequency: Array<{ month: string; count: number }>;
}

interface YouTubeData {
  channel: YouTubeChannel | null;
  videos: YouTubeVideo[];
  analytics: YouTubeAnalytics | null;
  lastFetched: string | null;
  cacheValid: boolean;
  cacheAge: string | null;
}

// ── Helpers ──
function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const days = Math.floor(ms / 86400000);
  if (days < 1) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── Custom Tooltip ──
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gunmetal border border-steel-dark/60 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-text-secondary mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-cyan-glow font-medium">
          {p.name}: {formatNumber(p.value)}
        </p>
      ))}
    </div>
  );
};

// ── Stat Card ──
function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType; label: string; value: string; sub?: string;
}) {
  return (
    <div className="full-glow-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-cyan-glow" />
        <span className="text-text-muted text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <div className="font-orbitron text-2xl font-bold text-text-primary">{value}</div>
      {sub && <div className="text-text-muted text-xs mt-1">{sub}</div>}
    </div>
  );
}

// ── Mobile Stat Card (compact) ──
function MobileStatCard({ icon: Icon, label, value }: {
  icon: React.ElementType; label: string; value: string;
}) {
  return (
    <div className="bg-gunmetal border border-steel-dark rounded-xl p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3.5 h-3.5 text-cyan-glow" />
        <span className="text-text-muted text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-orbitron text-xl font-bold text-text-primary">{value}</div>
    </div>
  );
}

// ── Platform Placeholder ──
function PlatformCard({ icon: Icon, name }: { icon: React.ElementType; name: string }) {
  return (
    <div className="full-glow-card p-6 flex flex-col items-center justify-center text-center opacity-50">
      <Icon className="w-8 h-8 text-text-muted mb-3" />
      <h3 className="text-text-secondary font-semibold text-sm mb-1">{name}</h3>
      <span className="text-text-muted text-xs">Coming Soon</span>
    </div>
  );
}

// ── Main Page ──
export default function SocialMediaPage() {
  const [data, setData] = useState<YouTubeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/youtube');
      const json = await res.json();
      setData(json);
      setError(null);
    } catch {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setData(json);
      }
    } catch {
      setError('Refresh failed');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [fetchData]);

  const channel = data?.channel;
  const analytics = data?.analytics;
  const hasData = channel && analytics && data.videos.length > 0;

  return (
    <div className="min-h-screen bg-deep-space">
      {/* Desktop */}
      <div className="hidden md:block">
      <Header />
        <main className="max-w-7xl mx-auto px-4 py-8">
          {/* Title */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-orbitron text-4xl font-bold metallic-text">Social Media</h1>
              {data?.cacheAge && (
                <p className="text-text-muted text-xs mt-1">Updated {data.cacheAge}</p>
              )}
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gunmetal border border-steel-dark hover:border-cyan-glow/50 transition-all text-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="full-glow-card p-4 mb-6 border-error/30">
              <p className="text-error text-sm">{error}</p>
              {error.includes('Google not connected') && (
                <a href="/settings" className="text-cyan-glow text-xs underline mt-1 inline-block">
                  Go to Settings to connect Google
                </a>
              )}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-8 h-8 text-cyan-glow animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!loading && !hasData && !error && (
            <div className="full-glow-card p-10 text-center">
              <Youtube className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <h2 className="text-text-primary text-lg font-semibold mb-2">Connect YouTube</h2>
              <p className="text-text-muted text-sm mb-6 max-w-md mx-auto">
                Click Refresh to fetch your YouTube channel data. Make sure Google is connected in Settings with YouTube access enabled.
              </p>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="px-6 py-2 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30 text-cyan-glow text-sm hover:bg-cyan-glow/20 transition-all disabled:opacity-50"
              >
                {refreshing ? 'Fetching...' : 'Fetch YouTube Data'}
              </button>
            </div>
          )}

          {/* Dashboard */}
          {hasData && (
            <>
              {/* Channel Header */}
              <div className="flex items-center gap-4 mb-6">
                {channel.thumbnailUrl && (
                  <img src={channel.thumbnailUrl} alt={channel.title} className="w-12 h-12 rounded-full" />
                )}
                <div>
                  <h2 className="text-text-primary font-semibold text-lg">{channel.title}</h2>
                  <p className="text-text-muted text-xs">{channel.customUrl}</p>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Users} label="Subscribers" value={formatNumber(channel.subscriberCount)} />
                <StatCard icon={Eye} label="Total Views" value={formatNumber(channel.totalViews)} />
                <StatCard icon={PlayCircle} label="Videos" value={formatNumber(channel.videoCount)} />
                <StatCard
                  icon={TrendingUp}
                  label="Engagement"
                  value={`${analytics.engagementRate}%`}
                  sub="(likes + comments) / views"
                />
              </div>

              {/* Views Chart */}
              <div className="full-glow-card p-6 mb-8">
                <h3 className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-4">
                  Views Per Video (Recent)
                </h3>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.viewsOverTime}>
                      <defs>
                        <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00c8e8" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#00c8e8" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" />
                      <XAxis dataKey="date" stroke="#606070" tick={{ fill: '#606070', fontSize: 10 }} />
                      <YAxis stroke="#606070" tick={{ fill: '#606070', fontSize: 10 }} tickFormatter={(v) => formatNumber(v)} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone" dataKey="views" name="Views"
                        stroke="#00c8e8" fill="url(#cyanGrad)" strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Two columns: Top Videos + Upload Frequency */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Top Videos */}
                <div className="full-glow-card p-6">
                  <h3 className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-4">
                    Top Videos by Views
                  </h3>
                  <div className="space-y-3 max-h-[380px] overflow-y-auto">
                    {analytics.topVideosByViews.map((video) => (
                      <a
                        key={video.id}
                        href={`https://youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-steel-dark/30 transition-colors group"
                      >
                        <img
                          src={video.thumbnailUrl} alt=""
                          className="w-20 h-12 rounded object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-text-primary text-xs font-medium truncate group-hover:text-cyan-glow transition-colors">
                            {video.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-text-muted text-[10px]">
                            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(video.viewCount)}</span>
                            <span className="flex items-center gap-1"><ThumbsUp className="w-3 h-3" />{formatNumber(video.likeCount)}</span>
                            <span className="flex items-center gap-1"><MessageSquare className="w-3 h-3" />{formatNumber(video.commentCount)}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>

                {/* Upload Frequency */}
                <div className="full-glow-card p-6">
                  <h3 className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-4">
                    Upload Frequency
                  </h3>
                  <div className="h-[340px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.uploadFrequency}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a32" />
                        <XAxis dataKey="month" stroke="#606070" tick={{ fill: '#606070', fontSize: 10 }} />
                        <YAxis stroke="#606070" tick={{ fill: '#606070', fontSize: 10 }} allowDecimals={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="count" name="Videos" fill="#00c8e8" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Two columns: Engagement Stats + Recent Uploads */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Engagement Stats */}
                <div className="full-glow-card p-6">
                  <h3 className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-4">
                    Engagement Averages
                  </h3>
                  <div className="space-y-4">
                    {[
                      { icon: Eye, label: 'Avg Views', value: formatNumber(analytics.averageViewsPerVideo) },
                      { icon: ThumbsUp, label: 'Avg Likes', value: formatNumber(analytics.averageLikesPerVideo) },
                      { icon: MessageSquare, label: 'Avg Comments', value: formatNumber(analytics.averageCommentsPerVideo) },
                      { icon: Clock, label: 'Avg Duration', value: formatDuration(analytics.averageDurationSeconds) },
                    ].map(({ icon: Icon, label, value }) => (
                      <div key={label} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="w-4 h-4 text-text-muted" />
                          <span className="text-text-secondary text-sm">{label}</span>
                        </div>
                        <span className="text-text-primary font-medium text-sm">{value}</span>
                      </div>
                    ))}
                    <div className="border-t border-steel-dark/50 pt-3 mt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-text-secondary text-sm">Like-to-View Ratio</span>
                        <span className="text-cyan-glow font-medium text-sm">
                          {analytics.totalViews > 0
                            ? ((analytics.totalLikes / analytics.totalViews) * 100).toFixed(2)
                            : '0'}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-text-secondary text-sm">Total Watch Time</span>
                        <span className="text-text-primary font-medium text-sm">
                          {formatDuration(analytics.totalDurationSeconds)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Uploads */}
                <div className="full-glow-card p-6">
                  <h3 className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-4">
                    Recent Uploads
                  </h3>
                  <div className="space-y-3">
                    {analytics.recentUploads.map((video) => (
                      <a
                        key={video.id}
                        href={`https://youtube.com/watch?v=${video.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-steel-dark/30 transition-colors group"
                      >
                        <img
                          src={video.thumbnailUrl} alt=""
                          className="w-16 h-10 rounded object-cover flex-shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-text-primary text-xs font-medium truncate group-hover:text-cyan-glow transition-colors">
                            {video.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 text-text-muted text-[10px]">
                            <span>{timeAgo(video.publishedAt)}</span>
                            <span>{formatNumber(video.viewCount)} views</span>
                            <span>{formatDuration(video.durationSeconds)}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* All Videos Table */}
              <div className="full-glow-card p-6 mb-8">
                <h3 className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-4">
                  All Videos ({data.videos.length})
                </h3>
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-deep-space z-10">
                      <tr className="text-text-muted text-left border-b border-steel-dark/50">
                        <th className="py-2 pr-3 font-semibold">Video</th>
                        <th className="py-2 px-3 font-semibold text-right">Views</th>
                        <th className="py-2 px-3 font-semibold text-right">Likes</th>
                        <th className="py-2 px-3 font-semibold text-right">Comments</th>
                        <th className="py-2 px-3 font-semibold text-right">Duration</th>
                        <th className="py-2 pl-3 font-semibold text-right">Published</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.videos
                        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
                        .map((video) => (
                          <tr
                            key={video.id}
                            className="border-b border-steel-dark/20 hover:bg-steel-dark/20 transition-colors"
                          >
                            <td className="py-2 pr-3">
                              <a
                                href={`https://youtube.com/watch?v=${video.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 hover:text-cyan-glow transition-colors"
                              >
                                <img src={video.thumbnailUrl} alt="" className="w-12 h-7 rounded object-cover flex-shrink-0" />
                                <span className="text-text-primary truncate max-w-[250px]">{video.title}</span>
                              </a>
                            </td>
                            <td className="py-2 px-3 text-right text-text-secondary">{formatNumber(video.viewCount)}</td>
                            <td className="py-2 px-3 text-right text-text-secondary">{formatNumber(video.likeCount)}</td>
                            <td className="py-2 px-3 text-right text-text-secondary">{formatNumber(video.commentCount)}</td>
                            <td className="py-2 px-3 text-right text-text-secondary">{formatDuration(video.durationSeconds)}</td>
                            <td className="py-2 pl-3 text-right text-text-muted">{timeAgo(video.publishedAt)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Platform Placeholders */}
          <div className="mt-8">
            <h2 className="text-text-secondary text-xs uppercase tracking-wider font-semibold mb-4">
              More Platforms
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <PlatformCard icon={Instagram} name="Instagram" />
              <PlatformCard icon={Linkedin} name="LinkedIn" />
              <PlatformCard icon={Twitter} name="Twitter / X" />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile */}
      <div className="md:hidden">
        <MobileLayout title="Social">
          <main className="px-3 pt-[72px] pb-[calc(72px+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Youtube className="w-4 h-4 text-red-500" />
                <span className="font-orbitron text-sm font-semibold text-text-muted uppercase tracking-wider">YouTube</span>
              </div>
              <button onClick={handleRefresh} disabled={refreshing} className="w-9 h-9 rounded-lg flex items-center justify-center bg-charcoal active:bg-steel-mid transition-all">
                <RefreshCw className={`w-4 h-4 text-text-muted ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {error && (
              <div className="p-3 mb-3 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-red-400 text-xs">{error}</p>
                {error.includes('Google not connected') && <a href="/settings" className="text-cyan-glow text-xs underline mt-1 inline-block">Connect Google in Settings</a>}
              </div>
            )}
            {loading && (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-6 h-6 text-cyan-glow animate-spin" />
              </div>
            )}
            {!loading && !hasData && !error && (
              <div className="text-center py-12">
                <Youtube className="w-10 h-10 text-text-muted mx-auto mb-3" />
                <p className="text-text-primary text-sm font-semibold mb-1">Connect YouTube</p>
                <p className="text-text-muted text-xs mb-4">Tap refresh to fetch your channel data</p>
                <button onClick={handleRefresh} disabled={refreshing} className="px-4 py-2 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30 text-cyan-glow text-xs active:bg-cyan-glow/20 transition-all">
                  {refreshing ? 'Fetching...' : 'Fetch YouTube Data'}
                </button>
              </div>
            )}
            {hasData && (
              <>
                <div className="flex items-center gap-3 mb-3 bg-gunmetal border border-steel-dark rounded-xl p-3">
                  {channel.thumbnailUrl && <img src={channel.thumbnailUrl} alt={channel.title} className="w-10 h-10 rounded-full" />}
                  <div className="min-w-0 flex-1">
                    <h2 className="text-text-primary font-semibold text-sm truncate">{channel.title}</h2>
                    <p className="text-text-muted text-[10px]">{channel.customUrl}</p>
                  </div>
                  {data?.cacheAge && <span className="text-[10px] text-text-muted flex-shrink-0">{data.cacheAge}</span>}
                </div>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <MobileStatCard icon={Users} label="Subscribers" value={formatNumber(channel.subscriberCount)} />
                  <MobileStatCard icon={Eye} label="Views" value={formatNumber(channel.totalViews)} />
                  <MobileStatCard icon={PlayCircle} label="Videos" value={formatNumber(channel.videoCount)} />
                  <MobileStatCard icon={TrendingUp} label="Engagement" value={`${analytics.engagementRate}%`} />
                </div>
                <div className="bg-gunmetal border border-steel-dark rounded-xl p-3 mb-3">
                  <h3 className="font-orbitron text-xs font-semibold text-text-primary mb-2">Views Per Video</h3>
                  <div className="h-[140px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analytics.viewsOverTime}>
                        <defs>
                          <linearGradient id="cyanGradMobile" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00c8e8" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#00c8e8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#606070" tick={{ fill: '#606070', fontSize: 8 }} />
                        <YAxis stroke="#606070" tick={{ fill: '#606070', fontSize: 8 }} tickFormatter={(v) => formatNumber(v)} width={35} />
                        <Area type="monotone" dataKey="views" name="Views" stroke="#00c8e8" fill="url(#cyanGradMobile)" strokeWidth={1.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-gunmetal border border-steel-dark rounded-xl p-3 mb-3">
                  <h3 className="font-orbitron text-xs font-semibold text-text-primary mb-2">Top Videos</h3>
                  <div className="space-y-2">
                    {analytics.topVideosByViews.slice(0, 5).map((video: any) => (
                      <a key={video.id} href={`https://youtube.com/watch?v=${video.id}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-1.5 rounded-lg active:bg-steel-dark/30 transition-colors">
                        <img src={video.thumbnailUrl} alt="" className="w-16 h-10 rounded object-cover flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-text-primary text-xs font-medium truncate">{video.title}</p>
                          <div className="flex items-center gap-2 mt-0.5 text-text-muted text-[10px]">
                            <span className="flex items-center gap-0.5"><Eye className="w-2.5 h-2.5" />{formatNumber(video.viewCount)}</span>
                            <span className="flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5" />{formatNumber(video.likeCount)}</span>
                          </div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-text-muted flex-shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="mt-4 mb-3">
              <h3 className="font-orbitron text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 px-1">More Platforms</h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Instagram, name: 'Instagram' },
                  { icon: Linkedin, name: 'LinkedIn' },
                  { icon: Twitter, name: 'X' },
                ].map(({ icon: Icon, name }) => (
                  <div key={name} className="bg-gunmetal border border-steel-dark rounded-xl p-3 flex flex-col items-center opacity-50">
                    <Icon className="w-5 h-5 text-text-muted mb-1" />
                    <span className="text-[10px] text-text-muted">Soon</span>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </MobileLayout>
      </div>
    </div>
  );
}
