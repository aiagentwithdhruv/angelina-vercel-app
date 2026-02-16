export interface ApprovalDecision {
  approved: boolean;
  blockedTools: string[];
  message?: string;
}

const SENSITIVE_TOOL_PREFIXES = [
  'send_email',
  'post_',
  'publish_',
  'delete_',
  'archive_',
  'remove_',
  'execute_',
];

function isSensitiveTool(toolName: string): boolean {
  return SENSITIVE_TOOL_PREFIXES.some((prefix) => toolName.startsWith(prefix));
}

export function evaluateToolApproval(
  toolNames: string[],
  approvedTools: string[] = [],
): ApprovalDecision {
  const blockedTools = toolNames.filter((toolName) => {
    if (!isSensitiveTool(toolName)) return false;
    return !approvedTools.includes(toolName);
  });

  if (blockedTools.length === 0) {
    return { approved: true, blockedTools: [] };
  }

  return {
    approved: false,
    blockedTools,
    message: `Approval required for sensitive tools: ${blockedTools.join(', ')}`,
  };
}

