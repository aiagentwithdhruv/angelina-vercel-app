/**
 * Angelina Integrations
 * 
 * Connect with external services:
 * - Gmail: Read, send emails
 * - GitHub: Store memory, access code
 * - ClickUp: Manage tasks
 * - Perplexity: Real-time web search
 */

// ============================================
// GITHUB INTEGRATION
// ============================================
export const github = {
  async getFile(repo: string, path: string): Promise<string | null> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GitHub token not configured');

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) return null;
      
      const data = await response.json();
      return Buffer.from(data.content, 'base64').toString('utf-8');
    } catch (error) {
      console.error('[GitHub] Error:', error);
      return null;
    }
  },

  async createOrUpdateFile(
    repo: string,
    path: string,
    content: string,
    message: string
  ): Promise<boolean> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GitHub token not configured');

    try {
      // Check if file exists to get SHA
      const existsResponse = await fetch(
        `https://api.github.com/repos/${repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      let sha: string | undefined;
      if (existsResponse.ok) {
        const existing = await existsResponse.json();
        sha = existing.sha;
      }

      const response = await fetch(
        `https://api.github.com/repos/${repo}/contents/${path}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            content: Buffer.from(content).toString('base64'),
            sha,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('[GitHub] Error:', error);
      return false;
    }
  },

  async listFiles(repo: string, path: string): Promise<string[]> {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('GitHub token not configured');

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repo}/contents/${path}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );

      if (!response.ok) return [];
      
      const files = await response.json();
      return Array.isArray(files) ? files.map((f: { name: string }) => f.name) : [];
    } catch (error) {
      console.error('[GitHub] Error:', error);
      return [];
    }
  },
};

// ============================================
// CLICKUP INTEGRATION
// ============================================
export const clickup = {
  async getUser(): Promise<{ id: string; username: string; email: string } | null> {
    const token = process.env.CLICKUP_API_KEY;
    if (!token) throw new Error('ClickUp API key not configured');

    try {
      const response = await fetch('https://api.clickup.com/api/v2/user', {
        headers: { 'Authorization': token },
      });

      if (!response.ok) return null;
      
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('[ClickUp] Error:', error);
      return null;
    }
  },

  async getWorkspaces(): Promise<{ id: string; name: string }[]> {
    const token = process.env.CLICKUP_API_KEY;
    if (!token) throw new Error('ClickUp API key not configured');

    try {
      const response = await fetch('https://api.clickup.com/api/v2/team', {
        headers: { 'Authorization': token },
      });

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.teams || [];
    } catch (error) {
      console.error('[ClickUp] Error:', error);
      return [];
    }
  },

  async getTasks(listId: string): Promise<{ id: string; name: string; status: { status: string } }[]> {
    const token = process.env.CLICKUP_API_KEY;
    if (!token) throw new Error('ClickUp API key not configured');

    try {
      const response = await fetch(
        `https://api.clickup.com/api/v2/list/${listId}/task`,
        {
          headers: { 'Authorization': token },
        }
      );

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.tasks || [];
    } catch (error) {
      console.error('[ClickUp] Error:', error);
      return [];
    }
  },

  async createTask(listId: string, name: string, description?: string): Promise<{ id: string; name: string } | null> {
    const token = process.env.CLICKUP_API_KEY;
    if (!token) throw new Error('ClickUp API key not configured');

    try {
      const response = await fetch(
        `https://api.clickup.com/api/v2/list/${listId}/task`,
        {
          method: 'POST',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            description,
          }),
        }
      );

      if (!response.ok) return null;
      
      return await response.json();
    } catch (error) {
      console.error('[ClickUp] Error:', error);
      return null;
    }
  },

  async updateTaskStatus(taskId: string, status: string): Promise<boolean> {
    const token = process.env.CLICKUP_API_KEY;
    if (!token) throw new Error('ClickUp API key not configured');

    try {
      const response = await fetch(
        `https://api.clickup.com/api/v2/task/${taskId}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': token,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('[ClickUp] Error:', error);
      return false;
    }
  },
};

// ============================================
// PERPLEXITY SEARCH
// ============================================
export const perplexity = {
  async search(query: string): Promise<{ answer: string; sources: string[] }> {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) throw new Error('Perplexity API key not configured');

    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            {
              role: 'system',
              content: 'Be precise and concise. Provide factual, up-to-date information.',
            },
            {
              role: 'user',
              content: query,
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error('Perplexity API error');
      }

      const data = await response.json();
      return {
        answer: data.choices?.[0]?.message?.content || 'No answer found',
        sources: data.citations || [],
      };
    } catch (error) {
      console.error('[Perplexity] Error:', error);
      return { answer: 'Search failed', sources: [] };
    }
  },
};

// ============================================
// GMAIL INTEGRATION (OAuth)
// ============================================
export const gmail = {
  // OAuth URL generation
  getAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new Error('Google Client ID not configured');

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;
    const scope = encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send');

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
  },

  // Exchange code for tokens
  async getTokens(code: string): Promise<{ access_token: string; refresh_token: string } | null> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) throw new Error('Google OAuth not configured');

    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/google/callback`;

    try {
      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      if (!response.ok) return null;
      
      return await response.json();
    } catch (error) {
      console.error('[Gmail] Token error:', error);
      return null;
    }
  },

  // Get emails (requires access token)
  async getEmails(accessToken: string, maxResults = 10): Promise<{ id: string; snippet: string; from: string; subject: string; date: string }[]> {
    try {
      // Get message list
      const listResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      if (!listResponse.ok) return [];
      
      const listData = await listResponse.json();
      const messages = listData.messages || [];

      // Get message details
      const emails = await Promise.all(
        messages.slice(0, 5).map(async (msg: { id: string }) => {
          const msgResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            {
              headers: { 'Authorization': `Bearer ${accessToken}` },
            }
          );

          if (!msgResponse.ok) return null;
          
          const msgData = await msgResponse.json();
          const headers = msgData.payload?.headers || [];
          
          return {
            id: msg.id,
            snippet: msgData.snippet || '',
            from: headers.find((h: { name: string }) => h.name === 'From')?.value || '',
            subject: headers.find((h: { name: string }) => h.name === 'Subject')?.value || '',
            date: headers.find((h: { name: string }) => h.name === 'Date')?.value || '',
          };
        })
      );

      return emails.filter(Boolean) as { id: string; snippet: string; from: string; subject: string; date: string }[];
    } catch (error) {
      console.error('[Gmail] Error:', error);
      return [];
    }
  },

  // Send email (requires access token)
  async sendEmail(
    accessToken: string,
    to: string,
    subject: string,
    body: string
  ): Promise<boolean> {
    try {
      const email = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'Content-Type: text/plain; charset=utf-8',
        '',
        body,
      ].join('\r\n');

      const encodedEmail = Buffer.from(email).toString('base64url');

      const response = await fetch(
        'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ raw: encodedEmail }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('[Gmail] Send error:', error);
      return false;
    }
  },
};

// ============================================
// TOOL DEFINITIONS FOR AI
// ============================================
export const toolDefinitions = [
  {
    name: 'search_web',
    description: 'Search the web for real-time information using Perplexity',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'The search query',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'check_email',
    description: 'Check recent emails from Gmail',
    parameters: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of emails to fetch (default 5)',
        },
      },
    },
  },
  {
    name: 'send_email',
    description: 'Send an email via Gmail',
    parameters: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address' },
        subject: { type: 'string', description: 'Email subject' },
        body: { type: 'string', description: 'Email body' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'create_task',
    description: 'Create a task in ClickUp',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Task name' },
        description: { type: 'string', description: 'Task description' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_tasks',
    description: 'Get tasks from ClickUp',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'remember',
    description: 'Save something to memory for later recall',
    parameters: {
      type: 'object',
      properties: {
        topic: { type: 'string', description: 'Topic or category' },
        content: { type: 'string', description: 'What to remember' },
        importance: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'How important is this',
        },
      },
      required: ['topic', 'content'],
    },
  },
  {
    name: 'recall',
    description: 'Search memory for relevant information',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'What to search for' },
      },
      required: ['query'],
    },
  },
];
