/**
 * Google Services Integration
 * 
 * Full access to Google Workspace:
 * - Gmail: Read, send, manage emails
 * - Calendar: Events, schedules
 * - Drive: Files, folders
 * - Sheets: Spreadsheets
 * - Docs: Documents
 */

// All Google OAuth scopes we need
export const GOOGLE_SCOPES = [
  // Gmail
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
  // Calendar
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  // Drive
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  // Sheets
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
  // Docs
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/documents',
  // YouTube (readonly)
  'https://www.googleapis.com/auth/youtube.readonly',
].join(' ');

// ============================================
// GMAIL
// ============================================
export const gmail = {
  async getEmails(accessToken: string, maxResults = 10) {
    try {
      const listResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!listResponse.ok) return [];
      
      const listData = await listResponse.json();
      const messages = listData.messages || [];

      const emails = await Promise.all(
        messages.slice(0, 5).map(async (msg: { id: string }) => {
          const msgResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
            { headers: { 'Authorization': `Bearer ${accessToken}` } }
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

      return emails.filter(Boolean);
    } catch (error) {
      console.error('[Gmail] Error:', error);
      return [];
    }
  },

  async sendEmail(accessToken: string, to: string, subject: string, body: string) {
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
// CALENDAR
// ============================================
export const calendar = {
  async getEvents(accessToken: string, maxResults = 10) {
    try {
      const now = new Date().toISOString();
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=${maxResults}&orderBy=startTime&singleEvents=true&timeMin=${now}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!response.ok) return [];
      
      const data = await response.json();
      return (data.items || []).map((event: {
        id: string;
        summary?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
        location?: string;
        description?: string;
      }) => ({
        id: event.id,
        title: event.summary || 'No title',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        location: event.location,
        description: event.description,
      }));
    } catch (error) {
      console.error('[Calendar] Error:', error);
      return [];
    }
  },

  async createEvent(accessToken: string, event: {
    title: string;
    start: string;
    end: string;
    description?: string;
    location?: string;
  }) {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: event.title,
            start: { dateTime: event.start },
            end: { dateTime: event.end },
            description: event.description,
            location: event.location,
          }),
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[Calendar] Create error:', error);
      return null;
    }
  },

  async getTodayEvents(accessToken: string) {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${startOfDay}&timeMax=${endOfDay}&singleEvents=true&orderBy=startTime`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('[Calendar] Today events error:', error);
      return [];
    }
  },
};

// ============================================
// GOOGLE DRIVE
// ============================================
export const drive = {
  async listFiles(accessToken: string, maxResults = 20) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?pageSize=${maxResults}&fields=files(id,name,mimeType,modifiedTime,webViewLink)`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('[Drive] Error:', error);
      return [];
    }
  },

  async searchFiles(accessToken: string, query: string) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name contains '${query}'&fields=files(id,name,mimeType,modifiedTime,webViewLink)`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!response.ok) return [];
      
      const data = await response.json();
      return data.files || [];
    } catch (error) {
      console.error('[Drive] Search error:', error);
      return [];
    }
  },

  async getFileContent(accessToken: string, fileId: string) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!response.ok) return null;
      return await response.text();
    } catch (error) {
      console.error('[Drive] Get content error:', error);
      return null;
    }
  },
};

// ============================================
// GOOGLE SHEETS
// ============================================
export const sheets = {
  async getSpreadsheet(accessToken: string, spreadsheetId: string) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[Sheets] Error:', error);
      return null;
    }
  },

  async getSheetData(accessToken: string, spreadsheetId: string, range: string) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!response.ok) return null;
      
      const data = await response.json();
      return data.values || [];
    } catch (error) {
      console.error('[Sheets] Get data error:', error);
      return null;
    }
  },

  async updateSheetData(accessToken: string, spreadsheetId: string, range: string, values: string[][]) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('[Sheets] Update error:', error);
      return false;
    }
  },

  async appendToSheet(accessToken: string, spreadsheetId: string, range: string, values: string[][]) {
    try {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('[Sheets] Append error:', error);
      return false;
    }
  },
};

// ============================================
// GOOGLE DOCS
// ============================================
export const docs = {
  async getDocument(accessToken: string, documentId: string) {
    try {
      const response = await fetch(
        `https://docs.googleapis.com/v1/documents/${documentId}`,
        { headers: { 'Authorization': `Bearer ${accessToken}` } }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[Docs] Error:', error);
      return null;
    }
  },

  async getDocumentText(accessToken: string, documentId: string) {
    try {
      const doc = await this.getDocument(accessToken, documentId);
      if (!doc) return null;

      // Extract text from document body
      let text = '';
      const content = doc.body?.content || [];
      
      for (const element of content) {
        if (element.paragraph) {
          for (const elem of element.paragraph.elements || []) {
            if (elem.textRun) {
              text += elem.textRun.content;
            }
          }
        }
      }
      
      return text;
    } catch (error) {
      console.error('[Docs] Get text error:', error);
      return null;
    }
  },

  async createDocument(accessToken: string, title: string) {
    try {
      const response = await fetch(
        'https://docs.googleapis.com/v1/documents',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title }),
        }
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('[Docs] Create error:', error);
      return null;
    }
  },
};

// ============================================
// AUTH HELPER
// ============================================
export function getGoogleAuthUrl(baseUrlOverride?: string) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('Google Client ID not configured');

  const baseUrl = (baseUrlOverride || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
  const redirectUri = `${baseUrl}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}
