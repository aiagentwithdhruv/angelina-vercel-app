import costPolicy from '../../cost-policy.json';
import { calculateCost } from '@/lib/pricing';
import { classifyComplexity, Complexity } from '@/lib/model-router';

type PolicyTier = 'simple' | 'moderate' | 'complex' | 'tool_call' | 'critical';

export interface CostPolicyDecision {
  originalModel: string;
  selectedModel: string;
  tier: PolicyTier;
  estimatedCost: number;
  reason: string;
  downgradedForBudget: boolean;
}

export interface CostPolicyContext {
  requestedModel: string;
  userMessage: string;
  hasTools: boolean;
  isCritical?: boolean;
  costTodayUsd?: number;
  sessionCostUsd?: number;
}

function getTier(ctx: CostPolicyContext): PolicyTier {
  if (ctx.isCritical) return 'critical';
  if (ctx.hasTools) return 'tool_call';
  const complexity = classifyComplexity(ctx.userMessage);
  return complexity as Complexity;
}

function estimateModelCost(model: string): number {
  const inputTokens = costPolicy.estimatedInputTokens ?? 900;
  const outputTokens = costPolicy.estimatedOutputTokens ?? 500;
  return calculateCost(model, inputTokens, outputTokens);
}

function getCheapestModel(models: string[]): { model: string; estimatedCost: number } {
  let winner = models[0];
  let winnerCost = estimateModelCost(winner);
  for (const model of models.slice(1)) {
    const modelCost = estimateModelCost(model);
    if (modelCost < winnerCost) {
      winner = model;
      winnerCost = modelCost;
    }
  }
  return { model: winner, estimatedCost: winnerCost };
}

function budgetExceeded(ctx: CostPolicyContext): boolean {
  if (!costPolicy.enabled) return false;
  const dailyCap = costPolicy.dailyBudgetUsd ?? 0;
  const sessionCap = costPolicy.sessionBudgetUsd ?? 0;
  if (dailyCap > 0 && (ctx.costTodayUsd || 0) >= dailyCap) return true;
  if (sessionCap > 0 && (ctx.sessionCostUsd || 0) >= sessionCap) return true;
  return false;
}

export function selectCostOptimizedModel(ctx: CostPolicyContext): CostPolicyDecision {
  const tier = getTier(ctx);
  const candidates = costPolicy.tiers[tier] || [ctx.requestedModel];
  const { model: cheapestModel, estimatedCost } = getCheapestModel(candidates);

  if (!costPolicy.enabled) {
    return {
      originalModel: ctx.requestedModel,
      selectedModel: ctx.requestedModel,
      tier,
      estimatedCost: estimateModelCost(ctx.requestedModel),
      reason: 'cost policy disabled',
      downgradedForBudget: false,
    };
  }

  if (budgetExceeded(ctx)) {
    const fallbackPool = costPolicy.tiers.simple || [ctx.requestedModel];
    const fallback = getCheapestModel(fallbackPool);
    return {
      originalModel: ctx.requestedModel,
      selectedModel: fallback.model,
      tier,
      estimatedCost: fallback.estimatedCost,
      reason: 'budget cap reached, graceful downgrade',
      downgradedForBudget: true,
    };
  }

  return {
    originalModel: ctx.requestedModel,
    selectedModel: cheapestModel,
    tier,
    estimatedCost,
    reason: cheapestModel === ctx.requestedModel ? 'requested model kept' : `optimized by ${tier} tier policy`,
    downgradedForBudget: false,
  };
}

