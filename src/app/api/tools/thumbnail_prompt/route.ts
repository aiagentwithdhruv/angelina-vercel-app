/**
 * Thumbnail Prompt Tool — Generates AI image prompts in Dhruv's style
 *
 * Creates photorealistic thumbnail prompts using Dhruv's locked visual identity:
 * - Dark moody workspace, natural wooden desk
 * - Black t-shirt (NEVER hoodie), glasses, trimmed beard
 * - MacBook Pro showing actual UI
 * - Teal (#00D4FF) default, purple neon for automation topics
 * - Realistic base (70%) + futuristic overlay (30%)
 *
 * Can be used with generate_image (Euri) or pasted into any image generator.
 */

import { apiSuccess, apiError } from '@/lib/api-response';

const QUALITY = 'photorealistic, 8K, sharp focus, natural skin tones, professional photography, cinematic color grading, DSLR quality, shallow depth of field, realistic lighting';

const RATIOS: Record<string, string> = {
  youtube: '16:9',
  linkedin: '4:5',
  twitter: '16:9',
  instagram: '1:1',
  github: '16:9',
};

const HOOKS: Record<string, (topic: string) => string> = {
  ghost_copies: (topic: string) => `3 translucent purple ghost copies of himself working simultaneously — one coding, one analyzing data, one managing ${topic}. Each ghost has a neon purple glow outline. Holographic glassmorphism UI panels floating near each ghost. Volumetric fog between the ghosts.`,

  holographic_command: (topic: string) => `Surrounded by floating holographic displays showing ${topic} dashboards and data. Frosted glass UI panels with teal and cyan neon glow. Semi-transparent data dashboards layered at different depths. Brushed aluminum desk surface reflecting holographic light.`,

  pipeline_flow: (topic: string) => `Above the laptop, a holographic pipeline showing the ${topic} flow with green checkmarks on each step. Glowing cyan connection lines between stages. Each stage rendered as a frosted glass card. Chrome connectors between cards.`,

  before_after: (topic: string) => `Split image. Left side (warm red tint, stressed): chaotic scene with multiple tabs and overwhelmed expression. Right side (cool teal tint, calm): clean ${topic} scene with single terminal, everything flowing automated. Dramatic frosted glass dividing line in center with neon glow.`,

  usb_hub: (topic: string) => `Holding a glowing cyan USB-style connector that splits into multiple glowing teal connections, each plugging into a floating frosted glass icon panel for different ${topic} services. Chrome and brushed aluminum cable connectors. Behind him, massive holographic text in electric cyan.`,

  sleeping_ghosts: (topic: string) => `Sleeping peacefully at desk with head resting on arms, MacBook Pro open showing terminal with "${topic}" running in green text. Behind him, 3 translucent purple ghost copies wide awake and working — each operating a different floating holographic screen. Volumetric fog between the ghosts.`,

  floating_logos: (topic: string) => `Sitting at MacBook Pro with confident expression. Floating around him in orbital rings: frosted glass cards each containing a tech logo related to ${topic}. Each card has a subtle cyan neon edge glow. Brushed aluminum ring connecting the orbiting cards. Holographic connection lines between related technologies.`,
};

export async function POST(request: Request) {
  try {
    const { topic, hook, platform, text_overlay } = await request.json();

    if (!topic) {
      return apiError('MISSING_PARAM', 'topic is required. What is the thumbnail about?', 400);
    }

    const hookKey = hook || 'holographic_command';
    const platformKey = platform || 'youtube';
    const ratio = RATIOS[platformKey] || '16:9';
    const hookFn = HOOKS[hookKey] || HOOKS.holographic_command;
    const hookText = hookFn(topic);

    const isPurple = hookKey === 'ghost_copies' || hookKey === 'sleeping_ghosts';
    const palette = isPurple
      ? 'purple and teal neon ambient lighting, volumetric fog'
      : 'ice blue and teal neon ambient lighting, frosted glass overlays';

    const prompt = `Cinematic movie still, dark moody workspace with natural wooden desk. Young Indian male developer with short hair, trimmed beard, and glasses, wearing a plain black t-shirt, sitting confidently. MacBook Pro open showing ${topic} interface. ${hookText} Dark navy background (#0A0A1A), ${palette}, dramatic rim lighting, cinematic shallow depth of field, ${QUALITY}, ${ratio} ratio.`;

    const result: Record<string, any> = {
      prompt,
      topic,
      hook: hookKey,
      platform: platformKey,
      ratio,
      palette: isPurple ? 'purple_neon' : 'blue_metallic',
      instructions: 'Use this prompt with generate_image tool (Euri API) or paste into any AI image generator. For best results, use Midjourney or DALL-E 3.',
    };

    if (text_overlay) {
      result.text_overlay_guide = {
        text: text_overlay,
        rules: 'Max 6 words. Yellow highlight on numbers/results. Cyan on tech terms. White on dark background. Mobile-readable size.',
      };
    }

    result.available_hooks = Object.keys(HOOKS);

    return apiSuccess(result);
  } catch (error) {
    return apiError('INTERNAL_ERROR', error instanceof Error ? error.message : 'Thumbnail prompt generation failed');
  }
}
