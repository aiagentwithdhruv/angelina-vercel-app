/**
 * Handdrawn Diagram Tool — Generates Gemini prompts
 *
 * Generates a complete copy-paste prompt for Google Gemini
 * to create hand-drawn whiteboard infographics in Dhruv's
 * AiwithDhruv signature style.
 *
 * No external API needed — this is pure prompt generation.
 */

import { apiSuccess, apiError } from '@/lib/api-response';

const STYLE_CONSTANTS = `Hand-drawn whiteboard infographic on white lined notebook paper, sitting on a natural wooden desk surface visible at the edges. Black marker lines, cyan (#00D4FF) marker highlights, yellow highlighter on key numbers. Real marker ink texture, natural paper grain. Photo of a real whiteboard after a brainstorming session.`;

const AMBIENT = `
=== AMBIENT DETAILS ===
- Coffee ring stain near bottom-left (subtle)
- Paper clips on 1-2 flash cards
- Tape marks on corners of some sticky notes
- Blue pen lying on the desk
- Small doodle arrows and stars in empty spaces
- Wooden desk texture at all edges
- Faint "AiwithDhruv" watermark diagonally across center in light grey

=== STYLE — CRITICAL ===
- Real black marker on white paper — authentic hand-drawn feel
- Slightly imperfect handwriting but always readable
- Cyan for headers, connections, branding
- Yellow highlighter for numbers and stats
- Pastel colored sticky notes at slight angles
- Small recognizable tech logos hand-drawn next to every tool
- Everything hand-drawn — NO computer fonts
- Clean enough to read on a phone screen`;

export async function POST(request: Request) {
  try {
    const { title, subtitle, sections, ratio } = await request.json();

    if (!title) {
      return apiError('MISSING_PARAM', 'title is required. What is the diagram about?', 400);
    }

    const aspectRatio = ratio || '16:9';
    const subtitleLine = subtitle || `A visual breakdown of ${title}`;
    const sectionContent = sections || 'Fill in your specific content for left column, center flowchart, right column, flash cards, and bottom stats.';

    const prompt = `${STYLE_CONSTANTS} ${aspectRatio} aspect ratio.

=== TOP TITLE BAR ===
Hand-written bold title: "${title}"
Below it: "${subtitleLine}" with yellow highlight on key words
Cyan marker underline stroke under the main title.
TOP-RIGHT: "AiwithDhruv" in bold cyan marker inside a hand-drawn rounded rectangle badge. Smaller text below: "youtube | github | linkedin"

${sectionContent}

=== FLASH CARDS scattered around like sticky notes, tilted at slight angles ===

Yellow sticky note (tilted): Main feature/hero capability with details and small doodle
Light Blue sticky note (tilted): Tech/skills/open source details
Pink/Coral sticky note (tilted): Data/memory/persistence info
Light Green sticky note (tilted): Products/content/quantity stats
Light Purple sticky note (tilted): Integrations/webhooks/connections

Some flash cards have paper clip or tape marks holding them on.

=== BOTTOM CENTER — Stats Row ===
Three items in a row, each circled with yellow highlight
Small star doodles around the stats

=== BOTTOM RIGHT — Author + Branding ===
"AiwithDhruv" with cyan lightning bolt
"@aiwithdhruv" and "github.com/aiagentwithdhruv"
"AD" monogram in a hand-drawn circle
${AMBIENT}`;

    return apiSuccess({
      prompt,
      title,
      ratio: aspectRatio,
      instructions: 'Copy this prompt and paste it into Google Gemini to generate the hand-drawn diagram. You can customize the flash card content and sections before pasting.',
      style: 'aiwithdhruv-handdrawn',
    });
  } catch (error) {
    return apiError('INTERNAL_ERROR', error instanceof Error ? error.message : 'Diagram prompt generation failed');
  }
}
