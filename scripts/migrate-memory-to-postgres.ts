import fs from 'fs';
import path from 'path';
import { getPgPool } from '@/lib/db';
import { generateEmbedding, toVectorLiteral } from '@/lib/embeddings';

interface LegacyMemoryEntry {
  id: string;
  topic: string;
  content: string;
  timestamp: string;
  type: 'conversation' | 'fact' | 'preference' | 'task' | 'decision' | 'client';
  tags: string[];
  importance: 'low' | 'medium' | 'high';
}

async function run() {
  const sourceFile = path.join(process.cwd(), 'memory-data.json');
  if (!fs.existsSync(sourceFile)) {
    console.log('No memory-data.json found. Nothing to migrate.');
    process.exit(0);
  }

  const raw = fs.readFileSync(sourceFile, 'utf8');
  const entries = JSON.parse(raw) as LegacyMemoryEntry[];

  if (!Array.isArray(entries) || entries.length === 0) {
    console.log('No memory rows found in memory-data.json');
    process.exit(0);
  }

  const pool = getPgPool();
  let migrated = 0;
  let skipped = 0;

  for (const entry of entries) {
    try {
      const exists = await pool.query('SELECT 1 FROM memory_entries WHERE id = $1 LIMIT 1', [entry.id]);
      if (exists.rows.length > 0) {
        skipped += 1;
        continue;
      }

      const embeddingText = `${entry.topic}\n${entry.content}\n${entry.tags.join(' ')}`;
      const embedding = await generateEmbedding(embeddingText).catch(() => null);

      await pool.query(
        `
          INSERT INTO memory_entries (
            id, topic, content, type, tags, importance, created_at, embedding
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, CASE WHEN $8::text IS NULL THEN NULL ELSE $8::vector END
          )
        `,
        [
          entry.id,
          entry.topic,
          entry.content,
          entry.type,
          entry.tags || [],
          entry.importance || 'medium',
          entry.timestamp || new Date().toISOString(),
          embedding ? toVectorLiteral(embedding) : null,
        ],
      );
      migrated += 1;
    } catch (error) {
      console.error(`Failed to migrate memory row ${entry.id}:`, error);
    }
  }

  console.log(`Migration completed. Migrated=${migrated} Skipped=${skipped} Total=${entries.length}`);
  await pool.end();
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});

