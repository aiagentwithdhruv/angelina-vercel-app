import { describe, it, expect } from 'vitest';
import {
  TOOLS_REGISTRY,
  getToolByName,
  validateToolName,
  getToolsByCategory,
  getToolsForOpenAI,
} from '@/lib/tools-registry';
import type { ToolCategory } from '@/lib/tools-registry';

// ─── Registry Integrity ──────────────────────────────────────────────────────

describe('TOOLS_REGISTRY', () => {
  it('every tool has name, description, and endpoint', () => {
    for (const tool of TOOLS_REGISTRY) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.endpoint).toBeTruthy();
    }
  });

  it('every tool has a valid category', () => {
    const validCategories: ToolCategory[] = [
      'email', 'task', 'calendar', 'search', 'memory',
      'content', 'voice', 'infrastructure', 'analytics', 'communication',
    ];
    for (const tool of TOOLS_REGISTRY) {
      expect(validCategories).toContain(tool.category);
    }
  });

  it('all tool names are unique', () => {
    const names = TOOLS_REGISTRY.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('all endpoints start with /api/', () => {
    for (const tool of TOOLS_REGISTRY) {
      expect(tool.endpoint).toMatch(/^\/api\//);
    }
  });
});

// ─── getToolByName ───────────────────────────────────────────────────────────

describe('getToolByName', () => {
  it('returns the correct tool for a known name', () => {
    const tool = getToolByName('check_email');
    expect(tool).toBeDefined();
    expect(tool!.name).toBe('check_email');
    expect(tool!.category).toBe('email');
  });

  it('returns undefined for an unknown name', () => {
    expect(getToolByName('nonexistent_tool')).toBeUndefined();
  });

  it('is case-sensitive', () => {
    expect(getToolByName('Check_Email')).toBeUndefined();
  });
});

// ─── validateToolName ────────────────────────────────────────────────────────

describe('validateToolName', () => {
  it('returns true for valid tool names', () => {
    expect(validateToolName('web_search')).toBe(true);
    expect(validateToolName('send_email')).toBe(true);
    expect(validateToolName('vps_execute')).toBe(true);
  });

  it('returns false for invalid tool names', () => {
    expect(validateToolName('fake_tool')).toBe(false);
    expect(validateToolName('')).toBe(false);
    expect(validateToolName('WEB_SEARCH')).toBe(false);
  });
});

// ─── getToolsByCategory ──────────────────────────────────────────────────────

describe('getToolsByCategory', () => {
  it('returns email tools', () => {
    const emailTools = getToolsByCategory('email');
    expect(emailTools.length).toBeGreaterThan(0);
    for (const tool of emailTools) {
      expect(tool.category).toBe('email');
    }
  });

  it('returns task tools', () => {
    const taskTools = getToolsByCategory('task');
    expect(taskTools.length).toBeGreaterThan(0);
    expect(taskTools.some((t) => t.name === 'manage_task')).toBe(true);
  });

  it('returns empty array for a category with no tools', () => {
    // Cast to bypass type check — simulates a runtime category string
    const result = getToolsByCategory('nonexistent' as ToolCategory);
    expect(result).toEqual([]);
  });

  it('every returned tool belongs to the requested category', () => {
    const categories: ToolCategory[] = [
      'email', 'task', 'calendar', 'search', 'memory',
      'content', 'voice', 'infrastructure', 'analytics', 'communication',
    ];
    for (const cat of categories) {
      const tools = getToolsByCategory(cat);
      for (const tool of tools) {
        expect(tool.category).toBe(cat);
      }
    }
  });
});

// ─── getToolsForOpenAI ───────────────────────────────────────────────────────

describe('getToolsForOpenAI', () => {
  it('returns all tools when no names filter is provided', () => {
    const openAITools = getToolsForOpenAI();
    expect(openAITools.length).toBe(TOOLS_REGISTRY.length);
  });

  it('returns only requested tools when names filter is provided', () => {
    const openAITools = getToolsForOpenAI(['web_search', 'check_email']);
    expect(openAITools.length).toBe(2);
    expect(openAITools.map((t) => t.function.name)).toEqual(
      expect.arrayContaining(['web_search', 'check_email']),
    );
  });

  it('every returned tool has the correct OpenAI schema shape', () => {
    const openAITools = getToolsForOpenAI(['send_email']);
    expect(openAITools.length).toBe(1);

    const tool = openAITools[0];
    expect(tool.type).toBe('function');
    expect(tool.function.name).toBe('send_email');
    expect(tool.function.description).toBeTruthy();
    expect(tool.function.parameters.type).toBe('object');
    expect(tool.function.parameters.properties).toBeDefined();
    // send_email has 3 required params: to, subject, body
    expect(tool.function.parameters.required).toEqual(
      expect.arrayContaining(['to', 'subject', 'body']),
    );
  });
});
