/**
 * GitHub Tool — Full repo access for Angelina
 *
 * Actions:
 *   list_repos   — List user's repos
 *   list_files   — List files in a repo path
 *   read_file    — Read a file's content
 *   write_file   — Create or update a file
 *   search_code  — Search code across repos
 *   list_issues  — List open issues
 *   create_issue — Create a new issue
 *
 * Auth: GITHUB_TOKEN env var or cookie (Settings UI)
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { withToolRetry } from '@/lib/tool-retry';

async function getToken(): Promise<string | null> {
  const envVal = process.env.GITHUB_TOKEN;
  if (envVal) return envVal;
  try {
    const cookieStore = await cookies();
    return cookieStore.get('api_key_github')?.value || null;
  } catch {
    return null;
  }
}

async function ghFetch(path: string, token: string, options?: RequestInit) {
  return fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
}

export async function POST(request: Request) {
  return withToolRetry(async () => {
    try {
      const { action, repo, path, content, message, query, title, body, labels } = await request.json();

      const token = await getToken();
      if (!token) {
        return NextResponse.json({
          success: false,
          error: 'GitHub token not configured. Add it in Settings → Other Integrations.',
        });
      }

      switch (action) {
        // ── List user repos ──
        case 'list_repos': {
          const res = await ghFetch('/user/repos?sort=updated&per_page=20', token);
          if (!res.ok) return NextResponse.json({ success: false, error: `GitHub API: ${res.status}` });
          const repos = await res.json();
          return NextResponse.json({
            success: true,
            repos: repos.map((r: any) => ({
              name: r.full_name,
              description: r.description,
              language: r.language,
              stars: r.stargazers_count,
              updated: r.updated_at,
              private: r.private,
              url: r.html_url,
            })),
          });
        }

        // ── List files in a path ──
        case 'list_files': {
          if (!repo) return NextResponse.json({ success: false, error: 'repo is required' });
          const filePath = path || '';
          const res = await ghFetch(`/repos/${repo}/contents/${filePath}`, token);
          if (!res.ok) return NextResponse.json({ success: false, error: `Path not found: ${res.status}` });
          const items = await res.json();
          const files = Array.isArray(items)
            ? items.map((f: any) => ({ name: f.name, type: f.type, size: f.size, path: f.path }))
            : [{ name: items.name, type: items.type, size: items.size, path: items.path }];
          return NextResponse.json({ success: true, files });
        }

        // ── Read a file ──
        case 'read_file': {
          if (!repo || !path) return NextResponse.json({ success: false, error: 'repo and path required' });
          const res = await ghFetch(`/repos/${repo}/contents/${path}`, token);
          if (!res.ok) return NextResponse.json({ success: false, error: `File not found: ${res.status}` });
          const data = await res.json();
          const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
          return NextResponse.json({
            success: true,
            file: { path: data.path, size: data.size, sha: data.sha },
            content: fileContent.length > 10000 ? fileContent.slice(0, 10000) + '\n\n... (truncated)' : fileContent,
          });
        }

        // ── Write / update a file ──
        case 'write_file': {
          if (!repo || !path || !content) {
            return NextResponse.json({ success: false, error: 'repo, path, and content required' });
          }
          // Get existing SHA if file exists
          let sha: string | undefined;
          const existsRes = await ghFetch(`/repos/${repo}/contents/${path}`, token);
          if (existsRes.ok) {
            const existing = await existsRes.json();
            sha = existing.sha;
          }
          const res = await ghFetch(`/repos/${repo}/contents/${path}`, token, {
            method: 'PUT',
            body: JSON.stringify({
              message: message || `Update ${path} via Angelina`,
              content: Buffer.from(content).toString('base64'),
              sha,
            }),
          });
          if (!res.ok) {
            const err = await res.text();
            return NextResponse.json({ success: false, error: `Write failed: ${err.slice(0, 200)}` });
          }
          const result = await res.json();
          return NextResponse.json({
            success: true,
            message: sha ? `Updated ${path}` : `Created ${path}`,
            url: result.content?.html_url,
            sha: result.content?.sha,
          });
        }

        // ── Search code ──
        case 'search_code': {
          if (!query) return NextResponse.json({ success: false, error: 'query required' });
          const q = repo ? `${query}+repo:${repo}` : `${query}+user:aiagentwithdhruv`;
          const res = await ghFetch(`/search/code?q=${encodeURIComponent(q)}&per_page=10`, token);
          if (!res.ok) return NextResponse.json({ success: false, error: `Search failed: ${res.status}` });
          const data = await res.json();
          return NextResponse.json({
            success: true,
            total: data.total_count,
            results: (data.items || []).map((item: any) => ({
              file: item.path,
              repo: item.repository?.full_name,
              url: item.html_url,
            })),
          });
        }

        // ── List issues ──
        case 'list_issues': {
          if (!repo) return NextResponse.json({ success: false, error: 'repo required' });
          const res = await ghFetch(`/repos/${repo}/issues?state=open&per_page=15`, token);
          if (!res.ok) return NextResponse.json({ success: false, error: `Issues fetch failed: ${res.status}` });
          const issues = await res.json();
          return NextResponse.json({
            success: true,
            issues: issues.map((i: any) => ({
              number: i.number,
              title: i.title,
              state: i.state,
              labels: i.labels?.map((l: any) => l.name),
              created: i.created_at,
              url: i.html_url,
            })),
          });
        }

        // ── Create issue ──
        case 'create_issue': {
          if (!repo || !title) return NextResponse.json({ success: false, error: 'repo and title required' });
          const res = await ghFetch(`/repos/${repo}/issues`, token, {
            method: 'POST',
            body: JSON.stringify({
              title,
              body: body || '',
              labels: labels || [],
            }),
          });
          if (!res.ok) {
            const err = await res.text();
            return NextResponse.json({ success: false, error: `Issue creation failed: ${err.slice(0, 200)}` });
          }
          const issue = await res.json();
          return NextResponse.json({
            success: true,
            message: `Issue #${issue.number} created: ${issue.title}`,
            url: issue.html_url,
            number: issue.number,
          });
        }

        default:
          return NextResponse.json({
            success: false,
            error: `Unknown action: ${action}. Use: list_repos, list_files, read_file, write_file, search_code, list_issues, create_issue`,
          });
      }
    } catch (error) {
      console.error('[GitHub Tool] Error:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'GitHub operation failed',
      });
    }
  }, 'github');
}
