/**
 * Angelina AI - Agent Core
 * The brain that processes requests and calls tools
 */

// Tool definitions that Angelina can use
export const tools = {
  // Email tools
  check_email: {
    name: 'check_email',
    description: 'Check and summarize emails from inbox',
    parameters: {
      count: { type: 'number', description: 'Number of emails to check', default: 5 },
      filter: { type: 'string', description: 'Filter: unread, important, all', default: 'unread' },
    },
  },
  send_email: {
    name: 'send_email',
    description: 'Send an email',
    parameters: {
      to: { type: 'string', description: 'Recipient email', required: true },
      subject: { type: 'string', description: 'Email subject', required: true },
      body: { type: 'string', description: 'Email body', required: true },
    },
  },
  draft_email: {
    name: 'draft_email',
    description: 'Draft an email reply',
    parameters: {
      emailId: { type: 'string', description: 'ID of email to reply to' },
      tone: { type: 'string', description: 'Tone: professional, friendly, brief' },
    },
  },

  // Task tools
  create_task: {
    name: 'create_task',
    description: 'Create a task in ClickUp',
    parameters: {
      title: { type: 'string', required: true },
      description: { type: 'string' },
      dueDate: { type: 'string' },
      priority: { type: 'string', description: '1=urgent, 2=high, 3=normal, 4=low' },
    },
  },
  list_tasks: {
    name: 'list_tasks',
    description: 'List tasks from ClickUp',
    parameters: {
      status: { type: 'string', description: 'Filter by status' },
      limit: { type: 'number', default: 10 },
    },
  },

  // Calendar tools
  check_calendar: {
    name: 'check_calendar',
    description: 'Check upcoming calendar events',
    parameters: {
      days: { type: 'number', description: 'Days to look ahead', default: 7 },
    },
  },
  create_event: {
    name: 'create_event',
    description: 'Create a calendar event',
    parameters: {
      title: { type: 'string', required: true },
      date: { type: 'string', required: true },
      time: { type: 'string' },
      duration: { type: 'number', description: 'Duration in minutes', default: 60 },
    },
  },

  // Document tools
  generate_document: {
    name: 'generate_document',
    description: 'Generate a document (PDF, DOCX)',
    parameters: {
      type: { type: 'string', description: 'quotation, invoice, report, letter' },
      data: { type: 'object', description: 'Document data' },
      format: { type: 'string', description: 'pdf, docx', default: 'pdf' },
    },
  },

  // Search tools
  web_search: {
    name: 'web_search',
    description: 'Search the web for information',
    parameters: {
      query: { type: 'string', required: true },
    },
  },
};

// Note: The actual chat handling uses /api/chat/route.ts with ANGELINA_SYSTEM_PROMPT
// from angelina-context.ts. This file only exports tool definitions for reuse
// (e.g., Telegram bot imports `tools` from here).
