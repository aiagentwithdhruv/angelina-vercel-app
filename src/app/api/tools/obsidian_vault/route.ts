/**
 * Obsidian Vault Tool
 * Read, write, list, and search Dhruv's Obsidian vault (ai-second-brain)
 * This makes Angelina aware of ALL projects, clients, skills, and context
 */

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const VAULT_PATH = process.env.OBSIDIAN_VAULT_PATH || '/Volumes/Dhruv_SSD/AIwithDhruv/Claude/ai-second-brain';

function isPathSafe(filePath: string): boolean {
  const resolved = path.resolve(VAULT_PATH, filePath);
  return resolved.startsWith(path.resolve(VAULT_PATH));
}

function listFilesRecursive(dir: string, base: string = ''): string[] {
  const files: string[] = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      const relative = base ? `${base}/${entry.name}` : entry.name;
      if (entry.isDirectory()) {
        files.push(...listFilesRecursive(path.join(dir, entry.name), relative));
      } else if (entry.name.endsWith('.md')) {
        files.push(relative);
      }
    }
  } catch {
    // skip unreadable dirs
  }
  return files;
}

function searchFiles(query: string, folder?: string): Array<{ path: string; matches: string[] }> {
  const searchDir = folder ? path.join(VAULT_PATH, folder) : VAULT_PATH;
  const files = listFilesRecursive(searchDir);
  const results: Array<{ path: string; matches: string[] }> = [];
  const queryLower = query.toLowerCase();

  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(searchDir, file), 'utf-8');
      if (content.toLowerCase().includes(queryLower)) {
        const lines = content.split('\n');
        const matches = lines
          .filter(line => line.toLowerCase().includes(queryLower))
          .slice(0, 5)
          .map(line => line.trim());
        results.push({ path: folder ? `${folder}/${file}` : file, matches });
      }
    } catch {
      // skip unreadable files
    }
    if (results.length >= 15) break;
  }
  return results;
}

export async function POST(request: Request) {
  try {
    const { action, file_path, content, query, folder } = await request.json();

    if (!action) {
      return NextResponse.json({ error: 'action required (read, write, list, search, summary)' }, { status: 400 });
    }

    // Check vault exists
    if (!fs.existsSync(VAULT_PATH)) {
      return NextResponse.json({
        error: `Vault not found at ${VAULT_PATH}. Set OBSIDIAN_VAULT_PATH env var.`
      }, { status: 500 });
    }

    switch (action) {
      case 'read': {
        if (!file_path) {
          return NextResponse.json({ error: 'file_path required for read' }, { status: 400 });
        }
        if (!isPathSafe(file_path)) {
          return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
        }
        const fullPath = path.join(VAULT_PATH, file_path);
        if (!fs.existsSync(fullPath)) {
          return NextResponse.json({ error: `File not found: ${file_path}` }, { status: 404 });
        }
        const fileContent = fs.readFileSync(fullPath, 'utf-8');
        console.log(`[Vault] Read: ${file_path} (${fileContent.length} chars)`);
        return NextResponse.json({
          success: true,
          message: `Read ${file_path}`,
          content: fileContent,
          path: file_path,
          size: fileContent.length,
        });
      }

      case 'write': {
        if (!file_path || !content) {
          return NextResponse.json({ error: 'file_path and content required for write' }, { status: 400 });
        }
        if (!isPathSafe(file_path)) {
          return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
        }
        const fullPath = path.join(VAULT_PATH, file_path);
        const dir = path.dirname(fullPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        const existed = fs.existsSync(fullPath);
        fs.writeFileSync(fullPath, content, 'utf-8');
        console.log(`[Vault] ${existed ? 'Updated' : 'Created'}: ${file_path}`);
        return NextResponse.json({
          success: true,
          message: `${existed ? 'Updated' : 'Created'} ${file_path}`,
          path: file_path,
          action: existed ? 'updated' : 'created',
        });
      }

      case 'list': {
        const listDir = folder || '';
        const targetDir = listDir ? path.join(VAULT_PATH, listDir) : VAULT_PATH;
        if (!fs.existsSync(targetDir)) {
          return NextResponse.json({ error: `Folder not found: ${listDir}` }, { status: 404 });
        }

        // If listing root, return folder summary
        if (!listDir) {
          const topFolders = fs.readdirSync(VAULT_PATH, { withFileTypes: true })
            .filter(e => e.isDirectory() && !e.name.startsWith('.'))
            .map(e => {
              const files = listFilesRecursive(path.join(VAULT_PATH, e.name));
              return { folder: e.name, fileCount: files.length };
            });
          return NextResponse.json({
            success: true,
            message: `Vault has ${topFolders.length} folders`,
            folders: topFolders,
            totalFiles: topFolders.reduce((sum, f) => sum + f.fileCount, 0),
          });
        }

        const files = listFilesRecursive(targetDir);
        console.log(`[Vault] Listed ${listDir}: ${files.length} files`);
        return NextResponse.json({
          success: true,
          message: `${files.length} files in ${listDir}`,
          files: files.slice(0, 50),
          total: files.length,
          folder: listDir,
        });
      }

      case 'search': {
        if (!query) {
          return NextResponse.json({ error: 'query required for search' }, { status: 400 });
        }
        const results = searchFiles(query, folder);
        console.log(`[Vault] Search "${query}": ${results.length} results`);
        return NextResponse.json({
          success: true,
          message: `Found ${results.length} files matching "${query}"`,
          results,
          query,
        });
      }

      case 'summary': {
        // Quick vault overview — projects, clients, skills
        const sections: Record<string, number> = {};
        const topFolders = fs.readdirSync(VAULT_PATH, { withFileTypes: true })
          .filter(e => e.isDirectory() && !e.name.startsWith('.'));
        for (const f of topFolders) {
          sections[f.name] = listFilesRecursive(path.join(VAULT_PATH, f.name)).length;
        }
        const totalFiles = Object.values(sections).reduce((s, n) => s + n, 0);
        return NextResponse.json({
          success: true,
          message: `Vault: ${totalFiles} files across ${topFolders.length} folders`,
          sections,
          totalFiles,
        });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}. Use: read, write, list, search, summary` }, { status: 400 });
    }
  } catch (error) {
    console.error('[Vault] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Vault tool failed' },
      { status: 500 }
    );
  }
}
