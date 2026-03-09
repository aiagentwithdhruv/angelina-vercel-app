import { describe, it, expect } from 'vitest';
import {
  getAgentForTask,
  getAgent,
  getAllAgents,
  getAgentsByModel,
} from '@/lib/agent-router';
import type { AgentName } from '@/lib/agent-router';

// ─── Routing: Scout ──────────────────────────────────────────────────────────

describe('routing to Scout', () => {
  it('routes "research competitors" to Scout', () => {
    const result = getAgentForTask('research competitors');
    expect(result.agent.name).toBe('scout');
    expect(result.matchedKeywords).toContain('research');
    expect(result.matchedKeywords).toContain('competitor');
  });

  it('routes "analyze market trends" to Scout', () => {
    const result = getAgentForTask('analyze market trends');
    expect(result.agent.name).toBe('scout');
    expect(result.matchedKeywords).toContain('analyze');
    expect(result.matchedKeywords).toContain('trend');
  });

  it('routes "investigate lead sources" to Scout', () => {
    const result = getAgentForTask('investigate lead sources');
    expect(result.agent.name).toBe('scout');
    expect(result.matchedKeywords).toContain('investigate');
    expect(result.matchedKeywords).toContain('lead');
  });
});

// ─── Routing: Creator ────────────────────────────────────────────────────────

describe('routing to Creator', () => {
  it('routes "write linkedin post" to Creator', () => {
    const result = getAgentForTask('write linkedin post');
    expect(result.agent.name).toBe('creator');
    expect(result.matchedKeywords).toContain('write');
    expect(result.matchedKeywords).toContain('linkedin');
    expect(result.matchedKeywords).toContain('post');
  });

  it('routes "draft a blog article" to Creator', () => {
    const result = getAgentForTask('draft a blog article');
    expect(result.agent.name).toBe('creator');
    expect(result.matchedKeywords).toContain('draft');
    expect(result.matchedKeywords).toContain('blog');
    expect(result.matchedKeywords).toContain('article');
  });

  it('routes "create video script for youtube" to Creator', () => {
    const result = getAgentForTask('create video script for youtube');
    expect(result.agent.name).toBe('creator');
    expect(result.matchedKeywords).toContain('video');
    expect(result.matchedKeywords).toContain('script');
    expect(result.matchedKeywords).toContain('youtube');
  });
});

// ─── Routing: Builder ────────────────────────────────────────────────────────

describe('routing to Builder', () => {
  it('routes "deploy to server" to Builder', () => {
    const result = getAgentForTask('deploy to server');
    expect(result.agent.name).toBe('builder');
    expect(result.matchedKeywords).toContain('deploy');
    expect(result.matchedKeywords).toContain('server');
  });

  it('routes "fix the docker build" to Builder', () => {
    const result = getAgentForTask('fix the docker build');
    expect(result.agent.name).toBe('builder');
    expect(result.matchedKeywords).toContain('fix');
    expect(result.matchedKeywords).toContain('docker');
    expect(result.matchedKeywords).toContain('build');
  });

  it('routes "review the API endpoint code" to Builder', () => {
    const result = getAgentForTask('review the API endpoint code');
    expect(result.agent.name).toBe('builder');
    expect(result.matchedKeywords).toContain('review');
    expect(result.matchedKeywords).toContain('api');
    expect(result.matchedKeywords).toContain('endpoint');
    expect(result.matchedKeywords).toContain('code');
  });
});

// ─── Routing: Ops ────────────────────────────────────────────────────────────

describe('routing to Ops', () => {
  it('routes "check email" to Ops', () => {
    const result = getAgentForTask('check email');
    expect(result.agent.name).toBe('ops');
    expect(result.matchedKeywords).toContain('email');
  });

  it('routes "schedule a meeting for tomorrow" to Ops', () => {
    const result = getAgentForTask('schedule a meeting for tomorrow');
    expect(result.agent.name).toBe('ops');
    expect(result.matchedKeywords).toContain('schedule');
    expect(result.matchedKeywords).toContain('meeting');
  });

  it('routes "send invoice and follow-up reminder" to Ops', () => {
    const result = getAgentForTask('send invoice and follow-up reminder');
    expect(result.agent.name).toBe('ops');
    expect(result.matchedKeywords).toContain('invoice');
    expect(result.matchedKeywords).toContain('follow-up');
    expect(result.matchedKeywords).toContain('reminder');
  });
});

// ─── Routing: Angelina Prime (default) ───────────────────────────────────────

describe('routing to Angelina Prime (default)', () => {
  it('routes a generic message to Angelina Prime', () => {
    const result = getAgentForTask('hello, how are you?');
    expect(result.agent.name).toBe('angelina-prime');
    expect(result.matchedKeywords).toEqual([]);
    expect(result.confidence).toBe(1);
  });

  it('routes a nonsense message to Angelina Prime', () => {
    const result = getAgentForTask('xyzzy foobar baz');
    expect(result.agent.name).toBe('angelina-prime');
  });
});

// ─── Confidence Scoring ──────────────────────────────────────────────────────

describe('confidence scoring', () => {
  it('returns higher confidence for more keyword matches', () => {
    const singleMatch = getAgentForTask('research');
    const multiMatch = getAgentForTask('research competitor analysis market trend');
    expect(multiMatch.confidence).toBeGreaterThanOrEqual(singleMatch.confidence);
  });

  it('confidence is between 0 and 1 (inclusive)', () => {
    const queries = [
      'research competitors',
      'write post',
      'deploy server',
      'check email',
      'random text',
    ];
    for (const q of queries) {
      const result = getAgentForTask(q);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('default route has confidence of 1', () => {
    const result = getAgentForTask('something completely unrelated');
    expect(result.confidence).toBe(1);
  });
});

// ─── Utility Functions ───────────────────────────────────────────────────────

describe('getAgent', () => {
  it('returns the correct agent config by name', () => {
    const scout = getAgent('scout');
    expect(scout.name).toBe('scout');
    expect(scout.label).toBe('Scout');
    expect(scout.toolSubset).toContain('web_search');
  });

  it('returns angelina-prime config', () => {
    const prime = getAgent('angelina-prime');
    expect(prime.label).toBe('Angelina Prime');
    expect(prime.toolSubset).toContain('manage_task');
  });
});

describe('getAllAgents', () => {
  it('returns all 5 agents', () => {
    const agents = getAllAgents();
    expect(agents.length).toBe(5);
    const names = agents.map((a) => a.name);
    expect(names).toContain('angelina-prime');
    expect(names).toContain('scout');
    expect(names).toContain('creator');
    expect(names).toContain('builder');
    expect(names).toContain('ops');
  });
});

describe('getAgentsByModel', () => {
  it('returns agents using gpt-4.1-mini', () => {
    const agents = getAgentsByModel('gpt-4.1-mini');
    expect(agents.length).toBeGreaterThan(0);
    for (const agent of agents) {
      expect(agent.preferredModel).toBe('gpt-4.1-mini');
    }
  });

  it('returns empty array for unknown model', () => {
    const agents = getAgentsByModel('nonexistent-model');
    expect(agents).toEqual([]);
  });
});

// ─── Description as Secondary Signal ─────────────────────────────────────────

describe('description as secondary signal', () => {
  it('description can influence routing when title is ambiguous', () => {
    // "help" alone has no keyword matches -> Angelina Prime
    const withoutDesc = getAgentForTask('help me with something');
    expect(withoutDesc.agent.name).toBe('angelina-prime');

    // Adding a description with strong builder keywords should route to builder
    const withDesc = getAgentForTask('help me with something', 'need to deploy the docker server and fix the api endpoint');
    expect(withDesc.agent.name).toBe('builder');
  });
});
