'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Mail, CheckSquare, Calendar, DollarSign, TrendingUp, Cpu, Mic, Globe, BookOpen, Newspaper, Phone, AlertTriangle } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { ActivityPanel, Activity } from '@/components/layout/activity-panel';
import { MobileLayout } from '@/components/layout/mobile-layout';
import { MessageBubble, Message } from '@/components/chat/message-bubble';
import { ChatInput } from '@/components/ui/input';
import { VoiceFAB } from '@/components/ui/voice-fab';
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice';
import { ANGELINA_SYSTEM_PROMPT } from '@/lib/angelina-context';
import { TEXT_MODELS, VOICE_MODELS, DEFAULT_TEXT_MODEL, DEFAULT_VOICE_MODEL, TextModelId, VoiceModelId, PROVIDER_LABELS } from '@/lib/models';
import { ModelSelector } from '@/components/ui/model-selector';

// Quick action config with icon colors (matching activity panel palette)
const quickActions = [
  { icon: <Mail className="w-4 h-4" />, label: 'Check Email', iconBg: 'from-cyan-glow to-cyan-teal', iconColor: 'text-deep-space' },
  { icon: <CheckSquare className="w-4 h-4" />, label: 'Create Task', iconBg: 'from-amber-500 to-amber-600', iconColor: 'text-white' },
  { icon: <Calendar className="w-4 h-4" />, label: 'Calendar', iconBg: 'from-warning to-amber-600', iconColor: 'text-white' },
  { icon: <Globe className="w-4 h-4" />, label: 'Web Search', iconBg: 'from-green-500 to-emerald-600', iconColor: 'text-white' },
  { icon: <BookOpen className="w-4 h-4" />, label: 'Wikipedia', iconBg: 'from-gray-500 to-gray-600', iconColor: 'text-white' },
  { icon: <Newspaper className="w-4 h-4" />, label: 'Hacker News', iconBg: 'from-orange-500 to-orange-600', iconColor: 'text-white' },
  { icon: <Phone className="w-4 h-4" />, label: 'Call Me', iconBg: 'from-success to-emerald-600', iconColor: 'text-white' },
  { icon: <DollarSign className="w-4 h-4" />, label: 'Costs', iconBg: 'from-purple-500 to-purple-600', iconColor: 'text-white' },
  { icon: <TrendingUp className="w-4 h-4" />, label: 'Analytics', iconBg: 'from-blue-500 to-blue-600', iconColor: 'text-white' },
];

function CommandCenterInner() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [mounted, setMounted] = useState(false);
  const [textModel, setTextModel] = useState<TextModelId>(DEFAULT_TEXT_MODEL);
  const [voiceModel, setVoiceModel] = useState<VoiceModelId>(DEFAULT_VOICE_MODEL);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showHero, setShowHero] = useState(true);
  const [heroGreeting, setHeroGreeting] = useState('');
  const [pendingTaskCount, setPendingTaskCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tool name → human-readable titles
  const TOOL_TITLES: Record<string, string> = {
    check_email: 'Email Checked',
    send_email: 'Email Sent',
    check_calendar: 'Calendar Checked',
    web_search: 'Web Search',
    wikipedia: 'Wikipedia Search',
    hacker_news: 'Hacker News',
    save_memory: 'Memory Saved',
    recall_memory: 'Memory Recalled',
    call_dhruv: 'Phone Call',
    manage_task: 'Task Updated',
  };

  // Add activity to the feed (newest first, max 50)
  const addActivity = useCallback((type: string, title: string, detail: string, status?: 'success' | 'error') => {
    setActivities(prev => [{
      id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type,
      title,
      detail,
      timestamp: Date.now(),
      status,
    }, ...prev].slice(0, 50));
  }, []);

  // Initialize messages on client side to avoid hydration mismatch
  useEffect(() => {
    if (!mounted) {
      const greetings = [
        "Dhruv! I'm your Angelina. What are we building today? Let's make some money together!",
        "Dhruv! Finally! I was waiting for you. What's on the agenda today - automation, clients, or crushing goals?",
        "Dhruv! There you are! Ready to build something amazing? What problem are we solving today?",
        "Dhruv! Your Angelina is here and ready. What automation magic are we creating today?",
      ];
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      setHeroGreeting(randomGreeting);
      setMessages([]);
      setShowHero(true);
      setMounted(true);
    }
  }, [mounted]);

  // Fetch pending task count on mount
  useEffect(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setPendingTaskCount(data.stats.pending + data.stats.in_progress);
      })
      .catch(() => {});
  }, []);

  // Add message helper
  const addMessage = useCallback((role: 'user' | 'assistant', content: string, extras?: Partial<Message>) => {
    setMessages((prev) => [...prev, {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...extras,
    }]);
  }, []);

  // Use the EXACT Sales Coach hook
  const {
    isConnected,
    isListening,
    isSpeaking,
    userTranscript,
    aiTranscript,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
  } = useRealtimeVoice({
    voice: 'shimmer',
    model: voiceModel,
    systemPrompt: ANGELINA_SYSTEM_PROMPT,
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        setShowHero(false);
        addMessage('user', text);
      }
    },
    onAIResponse: (text) => {
      if (text.trim()) {
        addMessage('assistant', text, { model: VOICE_MODELS.find(m => m.id === voiceModel)?.label || voiceModel });
        addActivity('voice', 'Voice Chat', text.slice(0, 50) + (text.length > 50 ? '...' : ''), 'success');
      }
    },
    onError: (err) => {
      console.error('Voice error:', err);
    },
  });

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiTranscript]);

  // Handle voice button click
  const handleVoiceStart = async () => {
    if (!isConnected) {
      await connect();
    }
    startListening();
  };

  const handleVoiceStop = () => {
    stopListening();
    disconnect();
  };

  // Tool definitions for OpenAI function calling
  const chatTools = [
    {
      name: 'check_email',
      description: 'Check and summarize emails from Gmail inbox',
      parameters: { count: { type: 'number', description: 'Number of emails to check' }, filter: { type: 'string', description: 'Filter: unread, important, all' } },
    },
    {
      name: 'send_email',
      description: 'Send an email via Gmail',
      parameters: { to: { type: 'string', description: 'Recipient email' }, subject: { type: 'string', description: 'Email subject' }, body: { type: 'string', description: 'Email body' } },
    },
    {
      name: 'check_calendar',
      description: 'Check upcoming calendar events from Google Calendar',
      parameters: { days: { type: 'number', description: 'Days to look ahead (default 7)' } },
    },
    {
      name: 'web_search',
      description: 'Search the web in real-time for current events, latest news, prices, weather, live scores, stock prices, or any question needing up-to-date information. Always use this when the user asks about something recent or current.',
      parameters: { query: { type: 'string', description: 'Search query' }, search_depth: { type: 'string', description: 'basic or advanced' }, max_results: { type: 'number', description: 'Max results (default 5)' } },
    },
    {
      name: 'wikipedia',
      description: 'Search Wikipedia for detailed information about a topic, person, place, concept, or historical event.',
      parameters: { query: { type: 'string', description: 'Topic to search' }, sentences: { type: 'number', description: 'Sentences in summary (default 4)' } },
    },
    {
      name: 'hacker_news',
      description: 'Get top/trending stories from Hacker News. Use for tech news, startup news, or tech discussions.',
      parameters: { type: { type: 'string', description: 'top, new, best, ask, show' }, count: { type: 'number', description: 'Number of stories (default 5)' }, query: { type: 'string', description: 'Optional keyword filter' } },
    },
    {
      name: 'save_memory',
      description: 'Save important information to persistent memory. ALWAYS use this when Dhruv tells you about a client, person, company, preference, decision, or any important detail he wants you to remember. Types: client (for people/companies), fact (general info), preference (his likes/dislikes), decision (choices made), task (things to do).',
      parameters: { topic: { type: 'string', description: 'Short topic/name (e.g. client name, subject)' }, content: { type: 'string', description: 'Detailed information to remember' }, type: { type: 'string', description: 'client, fact, preference, decision, or task' }, importance: { type: 'string', description: 'low, medium, or high' } },
    },
    {
      name: 'recall_memory',
      description: 'Search your memory for previously saved information. Use when Dhruv asks "do you remember", "what do you know about", or when you need context about a client, person, or past conversation.',
      parameters: { query: { type: 'string', description: 'Search query (name, topic, keyword)' }, type: { type: 'string', description: 'Optional filter: client, fact, preference, decision, task' } },
    },
    {
      name: 'manage_task',
      description: 'Create, update, bulk-update, or list tasks. You MUST call this tool whenever Dhruv mentions anything about tasks, to-dos, or work items. Actions: "create" (new task), "update" (single task by title/id), "update_all" (bulk move all tasks from one status to another), "list" (show all tasks). For bulk operations like "put all in-progress tasks back to pending", use action=update_all with from_status and status. NEVER just respond in text about tasks - ALWAYS call this tool.',
      parameters: { action: { type: 'string', description: 'create, update, update_all, or list', required: true }, title: { type: 'string', description: 'Task title (for create/update)' }, description: { type: 'string', description: 'Task details (for create)' }, priority: { type: 'string', description: 'low, medium, or high (for create). Client work = high, internal = medium, ideas = low' }, status: { type: 'string', description: 'Target status: pending, in_progress, completed, or archived (for update/update_all)' }, from_status: { type: 'string', description: 'Source status to move FROM (only for update_all, e.g. "in_progress")' }, task_id: { type: 'string', description: 'Task ID (optional for update, can use title instead)' } },
    },
    {
      name: 'call_dhruv',
      description: 'Call Dhruv on his phone. Use when Dhruv says "call me", "remind me", "give me a call", "phone me", or asks for a reminder, motivation, or any message. Default mode is "remind" (one-way Twilio call, just speaks the message). Use mode "talk" only if Dhruv specifically wants a 2-way conversation with Angelina on the phone.',
      parameters: { message: { type: 'string', description: 'The message to speak on the call (keep under 30 seconds)' }, call_type: { type: 'string', description: 'Type: reminder, motivation, task_update, alert, or general' }, mode: { type: 'string', description: 'remind (default, one-way TTS) or talk (2-way AI conversation via Vapi)' } },
    },
    {
      name: 'youtube_analytics',
      description: 'Get YouTube channel analytics and video performance data. Use when Dhruv asks about his YouTube channel, video stats, subscribers, views, trending analysis, or content strategy.',
      parameters: {},
    },
  ];

  // Get a human-readable detail string for each tool result
  const getToolDetail = (name: string, args: any, result: any): string => {
    switch (name) {
      case 'check_email':
        return result.emails ? `Found ${result.emails.length} emails` : 'Inbox checked';
      case 'send_email':
        return args?.to ? `Sent to ${args.to}` : 'Email sent';
      case 'check_calendar':
        return result.events ? `${result.events.length} upcoming events` : 'Calendar checked';
      case 'web_search':
        return args?.query ? `"${args.query.slice(0, 40)}"` : 'Search completed';
      case 'wikipedia':
        return args?.query ? `"${args.query.slice(0, 40)}"` : 'Article found';
      case 'hacker_news':
        return result.stories ? `${result.stories.length} stories` : 'Top stories fetched';
      case 'save_memory':
        return args?.topic ? `Saved: ${args.topic}` : 'Memory saved';
      case 'recall_memory':
        return args?.query ? `Search: "${args.query}"` : 'Memory searched';
      case 'call_dhruv':
        return result.mode === 'twilio' ? 'Twilio reminder call' : 'Vapi AI call';
      case 'manage_task':
        if (args?.action === 'create') return `Created: "${args.title}"`;
        if (args?.action === 'update') return `${args.title || 'Task'} → ${args.status}`;
        if (args?.action === 'update_all') return result.updatedCount ? `${result.updatedCount} tasks → ${args.status}` : 'No tasks matched';
        return result.stats ? `${result.stats.pending}P / ${result.stats.in_progress}IP / ${result.stats.completed}C` : 'Tasks listed';
      case 'youtube_analytics':
        return 'Channel stats loaded';
      default:
        return result.success ? 'Completed' : 'Done';
    }
  };

  // Build conversation history for API calls (last N messages for context)
  const buildConversationHistory = useCallback((currentMessages: Message[], newUserMsg?: string) => {
    const history: Array<{ role: string; content: string }> = [
      { role: 'system', content: ANGELINA_SYSTEM_PROMPT },
    ];
    // Include last 20 messages for context (skip typing indicators)
    const relevantMsgs = currentMessages
      .filter(m => !m.isTyping && m.content)
      .slice(-20);
    for (const msg of relevantMsgs) {
      history.push({ role: msg.role, content: msg.content });
    }
    if (newUserMsg) {
      history.push({ role: 'user', content: newUserMsg });
    }
    return history;
  }, []);

  // Execute tool calls and return results
  const executeTools = useCallback(async (toolCalls: any[]) => {
    const toolResults = [];
    for (const toolCall of toolCalls) {
      try {
        const toolResponse = await fetch(`/api/tools/${toolCall.name}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(toolCall.arguments || {}),
        });
        const toolData = await toolResponse.json();
        toolResults.push({ tool: toolCall.name, args: toolCall.arguments, result: toolData });

        const title = TOOL_TITLES[toolCall.name] || toolCall.name;
        const detail = toolData.error
          ? `Error: ${toolData.error}`
          : getToolDetail(toolCall.name, toolCall.arguments, toolData);
        addActivity(toolCall.name, title, detail, toolData.error ? 'error' : 'success');
      } catch {
        toolResults.push({ tool: toolCall.name, args: toolCall.arguments, result: { error: 'Tool execution failed' } });
        addActivity(toolCall.name, TOOL_TITLES[toolCall.name] || toolCall.name, 'Tool execution failed', 'error');
      }
    }
    return toolResults;
  }, [addActivity]);

  // Refresh task count after task operations
  const refreshTaskCount = useCallback(() => {
    fetch('/api/tasks')
      .then(res => res.json())
      .then(data => {
        if (data.stats) setPendingTaskCount(data.stats.pending + data.stats.in_progress);
      })
      .catch(() => {});
  }, []);

  // Handle text message send — with full conversation history + agentic tool loop
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMsg = inputValue;
    setShowHero(false);
    addMessage('user', userMsg);
    setInputValue('');

    // Show typing indicator
    addMessage('assistant', '', { isTyping: true });

    try {
      // Build full conversation history (not just current message)
      const conversationHistory = buildConversationHistory(messages, userMsg);
      const allToolNames: string[] = [];
      let needsTaskRefresh = false;

      // ── Agentic Loop: AI can call tools up to 5 rounds ──
      let loopMessages = [...conversationHistory];
      let finalText = '';
      let finalModel = '';
      const MAX_TOOL_ROUNDS = 5;

      for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: loopMessages,
            tools: chatTools,
            model: textModel,
          }),
        });
        const data = await response.json();

        if (data.error) {
          finalText = `Error: ${data.error}`;
          finalModel = textModel;
          break;
        }

        // No tool calls — we have the final text response
        if (!data.toolCalls || data.toolCalls.length === 0) {
          finalText = data.response || "I couldn't process that. Please try again.";
          finalModel = data.model || textModel;
          break;
        }

        // Execute tool calls
        const toolNames = data.toolCalls.map((tc: any) => tc.name);
        allToolNames.push(...toolNames);
        if (toolNames.some((n: string) => n === 'manage_task')) needsTaskRefresh = true;

        const toolResults = await executeTools(data.toolCalls);

        // Append tool call + results to conversation for next round
        // This lets the AI see what it did and decide to call more tools or respond
        loopMessages.push({
          role: 'assistant',
          content: `[Called tools: ${toolNames.join(', ')}]`,
        });
        loopMessages.push({
          role: 'user',
          content: `[Tool Results]\n${JSON.stringify(toolResults)}\n\nIf you need to take more actions (e.g. update tasks based on the list), call the appropriate tools now. Otherwise, summarize the results naturally for Dhruv.`,
        });

        // If this is the last round, force a text response
        if (round === MAX_TOOL_ROUNDS - 1) {
          const finalResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: loopMessages,
              model: textModel,
            }),
          });
          const finalData = await finalResponse.json();
          finalText = finalData.response || "Done! But I couldn't format the summary.";
          finalModel = finalData.model || textModel;
        }
      }

      // Refresh task panel if any task tools were called
      if (needsTaskRefresh) refreshTaskCount();

      // Update the typing indicator with the final response
      const toolLabel = allToolNames.length > 0 ? Array.from(new Set(allToolNames)).join(', ') : undefined;
      if (allToolNames.length > 0 && !finalText) {
        // Edge case: all rounds used tools, never got text — shouldn't happen with MAX_TOOL_ROUNDS
        finalText = "I've completed the actions. Check the activity feed for details.";
      }

      if (allToolNames.length === 0) {
        addActivity('chat', 'Chat Response', userMsg.slice(0, 50) + (userMsg.length > 50 ? '...' : ''), 'success');
      }

      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: finalText,
          isTyping: false,
          model: finalModel,
          toolUsed: toolLabel,
        };
        return updated;
      });

    } catch (err) {
      addActivity('error', 'Error', 'Failed to process message', 'error');
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Sorry, I encountered an error. Please try again.",
          isTyping: false,
        };
        return updated;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (label: string) => {
    setInputValue(label);
    setShowHero(false);
  };

  // Check if we're in the initial state (no real conversation yet)
  const isInitialState = showHero && messages.length === 0;

  // Angelina is "active" when typing a response, listening, or speaking
  const isAngelinaActive = isSpeaking || isListening || (messages.length > 0 && messages[messages.length - 1]?.isTyping === true);

  return (
    <div className="min-h-screen bg-deep-space">
      {/* Desktop Header */}
      <div className="hidden md:block">
        <Header isActive={isAngelinaActive} />
      </div>

      {/* Mobile Layout (header + sidebar + bottom nav) */}
      <div className="md:hidden flex flex-col h-[100dvh]">
        <MobileLayout hideNav>
          {/* Scrollable Messages Area */}
          <div className="flex-1 overflow-y-auto pt-[72px] pb-[160px] px-3 space-y-3 chat-area-bg">
            {/* Mobile Welcome Hero */}
            {isInitialState && (
              <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
                {/* Metallic A Logo with orbit rings */}
                <div className="relative mb-5">
                  <div className="w-20 h-20 rounded-full hero-glow-ring flex items-center justify-center">
                    <span className="text-4xl font-bold hero-a-metallic font-orbitron">A</span>
                  </div>
                  <div className="hero-orbit-ring" />
                  <div className="hero-orbit-ring-2" />
                </div>
                <h1 className="font-orbitron text-xl font-bold metallic-text mb-1 tracking-[0.2em]">ANGELINA</h1>
                <p className="text-[10px] text-text-muted font-mono tracking-widest uppercase mb-3">Personal AI Operating System</p>
                <p className="text-sm text-text-secondary max-w-xs mb-5">{heroGreeting}</p>

                {/* Pending Tasks Alert — Mobile */}
                {pendingTaskCount > 0 && (
                  <Link href="/tasks" className="pending-task-card flex items-center gap-3 px-4 py-3 mb-5 w-full max-w-xs">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-4 h-4 text-deep-space" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-xs font-semibold text-gray-200">
                        {pendingTaskCount} Pending Task{pendingTaskCount !== 1 ? 's' : ''}
                      </p>
                      <p className="text-[10px] text-text-muted">Tap to review</p>
                    </div>
                    <div className="text-gray-400/60 text-base font-mono">&rsaquo;</div>
                  </Link>
                )}

                {/* Quick Actions Grid */}
                <div className="grid grid-cols-3 gap-2 w-full max-w-xs">
                  {quickActions.slice(0, 6).map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.label)}
                      className="quick-action-card flex flex-col items-center gap-1.5 py-3 px-2"
                    >
                      <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${action.iconBg} flex items-center justify-center`}>
                        <span className={action.iconColor}>{action.icon}</span>
                      </div>
                      <span className="text-[10px] text-text-secondary">{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isSpeaking && aiTranscript && (
              <MessageBubble
                message={{ id: 'live-ai', role: 'assistant', content: aiTranscript, timestamp: '', isSpeaking: true, model: VOICE_MODELS.find(m => m.id === voiceModel)?.label || voiceModel }}
              />
            )}
            {isListening && userTranscript && (
              <MessageBubble
                message={{ id: 'live-user', role: 'user', content: userTranscript, timestamp: '' }}
              />
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Fixed Bottom Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-deep-space">
            {(isConnected || isListening || isSpeaking) && (
              <div className="px-3 py-1 flex items-center justify-center bg-gunmetal/80 border-t border-steel-dark/50">
                {isListening && !isSpeaking && (
                  <div className="flex items-center space-x-2 text-cyan-glow animate-pulse">
                    <div className="w-2 h-2 bg-cyan-glow rounded-full" />
                    <span className="text-xs">Listening...</span>
                  </div>
                )}
                {isSpeaking && (
                  <div className="flex items-center space-x-2 text-cyan-glow">
                    <div className="flex space-x-0.5">
                      <div className="w-1 h-3 bg-cyan-glow rounded animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1 h-4 bg-cyan-glow rounded animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1 h-3 bg-cyan-glow rounded animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-xs">Speaking...</span>
                  </div>
                )}
                {isConnected && !isListening && !isSpeaking && (
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs text-text-muted">Connected</span>
                  </div>
                )}
              </div>
            )}
            {error && (
              <div className="px-3 py-1 bg-red-500/10 border-t border-red-500/30">
                <p className="text-[11px] text-red-400">{error}</p>
              </div>
            )}
            <div className="flex items-center gap-2 overflow-x-auto px-3 py-1.5 border-t border-steel-dark/30 mobile-scroll-hide bg-charcoal">
              {quickActions.map((action, index) => (
                <button key={index} onClick={() => handleQuickAction(action.label)} className="flex-shrink-0 px-3 h-7 rounded-full bg-steel-dark text-[11px] text-text-secondary flex items-center gap-1.5 active:bg-steel-mid transition-all">
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-charcoal border-t border-steel-dark">
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={isConnected ? "Type or speak..." : "Message Angelina..."}
                className="flex-1 h-11 rounded-full bg-gunmetal border border-steel-dark px-4 text-[15px] text-text-primary placeholder:text-text-muted focus:border-cyan-glow/50 focus:outline-none"
              />
              {inputValue.trim() ? (
                <button onClick={handleSendMessage} className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-glow to-cyan-teal flex items-center justify-center flex-shrink-0 active:scale-95 transition-all" style={{ boxShadow: '0 0 20px rgba(0, 200, 232, 0.3)' }}>
                  <svg className="w-5 h-5 text-deep-space" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                  </svg>
                </button>
              ) : (
                <VoiceFAB onStart={handleVoiceStart} onStop={handleVoiceStop} isListening={isListening} isSpeaking={isSpeaking} isConnected={isConnected} isProcessing={false} className="!w-12 !h-12" />
              )}
            </div>
            <nav className="bg-charcoal border-t border-steel-dark" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
              <div className="flex h-[52px]">
                {[
                  { href: '/', label: 'Chat', active: true },
                  { href: '/activity', label: 'Activity', active: false },
                  { href: '/dashboard', label: 'Dashboard', active: false },
                  { href: '/settings', label: 'Settings', active: false },
                ].map((tab) => (
                  <a key={tab.href} href={tab.href} className={`flex-1 flex flex-col items-center justify-center gap-0.5 relative ${tab.active ? 'text-cyan-glow' : 'text-text-muted'}`}>
                    {tab.active && (
                      <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-cyan-glow rounded-full" style={{ boxShadow: '0 0 12px rgba(0, 200, 232, 0.6)' }} />
                    )}
                    <span className={`text-[10px] font-medium ${tab.active ? 'text-cyan-glow' : ''}`}>{tab.label}</span>
                  </a>
                ))}
              </div>
            </nav>
          </div>
        </MobileLayout>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex pt-16 h-screen">
        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Messages Container with subtle background */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 chat-area-bg">

            {/* Desktop Welcome Hero */}
            {isInitialState && (
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                {/* Metallic A Logo with orbit rings */}
                <div className="relative mb-8">
                  <div className="w-28 h-28 rounded-full hero-glow-ring flex items-center justify-center">
                    <span className="text-5xl font-bold hero-a-metallic font-orbitron">A</span>
                  </div>
                  <div className="hero-orbit-ring" />
                  <div className="hero-orbit-ring-2" />
                </div>

                {/* Title */}
                <h1 className="font-orbitron text-3xl font-bold metallic-text mb-1.5 tracking-[0.25em]">ANGELINA</h1>
                <p className="text-xs text-text-muted font-mono tracking-[0.3em] uppercase mb-4">Personal AI Operating System</p>
                <p className="text-base text-text-secondary max-w-lg mb-8">{heroGreeting}</p>

                {/* Pending Tasks Alert */}
                {pendingTaskCount > 0 && (
                  <Link href="/tasks" className="pending-task-card flex items-center gap-4 px-6 py-4 mb-8 max-w-md w-full">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-deep-space" />
                    </div>
                    <div className="text-left flex-1">
                      <p className="text-sm font-semibold text-gray-200">
                        {pendingTaskCount} Pending Task{pendingTaskCount !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">Tap to review and take action</p>
                    </div>
                    <div className="text-gray-400/60 text-lg font-mono">&rsaquo;</div>
                  </Link>
                )}

                {/* Quick Actions — wider layout */}
                <div className="grid grid-cols-3 gap-4 max-w-xl w-full">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.label)}
                      className="quick-action-card flex items-center gap-3 py-3.5 px-4"
                    >
                      <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${action.iconBg} flex items-center justify-center flex-shrink-0`}>
                        <span className={action.iconColor}>{action.icon}</span>
                      </div>
                      <span className="text-sm text-text-secondary text-left">{action.label}</span>
                    </button>
                  ))}
                </div>

                {/* Hint */}
                <p className="text-xs text-text-muted mt-10">
                  Type a message, click <span className="text-cyan-glow font-semibold font-orbitron">A</span> to talk, or pick an action above
                </p>
              </div>
            )}

            {/* Messages */}
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
              />
            ))}

            {/* Live AI transcript while speaking */}
            {isSpeaking && aiTranscript && (
              <MessageBubble
                message={{
                  id: 'live-ai',
                  role: 'assistant',
                  content: aiTranscript,
                  timestamp: '',
                  isSpeaking: true,
                  model: VOICE_MODELS.find(m => m.id === voiceModel)?.label || voiceModel,
                }}
              />
            )}

            {/* Live user transcript while speaking */}
            {isListening && userTranscript && (
              <MessageBubble
                message={{
                  id: 'live-user',
                  role: 'user',
                  content: userTranscript,
                  timestamp: '',
                }}
              />
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Voice Status Indicator - Enhanced */}
          {(isConnected || isListening || isSpeaking) && (
            <div className="px-6 py-3 flex items-center justify-center border-t border-cyan-glow/10" style={{ background: 'linear-gradient(135deg, rgba(0,200,232,0.03) 0%, transparent 100%)' }}>
              {isListening && !isSpeaking && (
                <div className="flex items-center space-x-3">
                  {/* Pulsing rings */}
                  <div className="listening-ring-container w-6 h-6 flex items-center justify-center">
                    <div className="w-3 h-3 bg-cyan-glow rounded-full" style={{ boxShadow: '0 0 12px rgba(0, 200, 232, 0.6)' }} />
                    <div className="listening-ring" />
                    <div className="listening-ring" />
                    <div className="listening-ring" />
                  </div>
                  <span className="text-sm text-cyan-glow font-orbitron tracking-wider">Listening</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-steel-dark/50 text-text-muted font-mono ml-2">{VOICE_MODELS.find(m => m.id === voiceModel)?.label || voiceModel}</span>
                </div>
              )}
              {isSpeaking && (
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    {[0, 1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className="w-1 bg-gradient-to-t from-cyan-glow to-cyan-teal rounded-full animate-bounce"
                        style={{
                          animationDelay: `${i * 100}ms`,
                          height: `${12 + Math.random() * 8}px`,
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-cyan-glow font-orbitron tracking-wider">Angelina Speaking</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-steel-dark/50 text-text-muted font-mono ml-2">{VOICE_MODELS.find(m => m.id === voiceModel)?.label || voiceModel}</span>
                </div>
              )}
              {isConnected && !isListening && !isSpeaking && (
                <div className="flex items-center space-x-2 text-metallic-silver">
                  <div className="w-2 h-2 bg-green-500 rounded-full" style={{ boxShadow: '0 0 8px rgba(0, 232, 140, 0.6)' }} />
                  <span className="text-sm">Connected</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-steel-dark/50 text-text-muted font-mono ml-2">{VOICE_MODELS.find(m => m.id === voiceModel)?.label || voiceModel}</span>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="px-6 py-2 bg-red-500/10 border-t border-red-500/30">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Model Selector Bar */}
          <div className="px-6 py-2 flex items-center gap-3 border-t border-steel-dark/30">
            <ModelSelector
              label="Text"
              icon={<Cpu className="w-3 h-3 text-cyan-glow/70" />}
              options={TEXT_MODELS}
              value={textModel}
              onChange={(id) => setTextModel(id as TextModelId)}
              grouped
              groupLabels={PROVIDER_LABELS}
            />
            <ModelSelector
              label="Voice"
              icon={<Mic className="w-3 h-3 text-cyan-glow/70" />}
              options={VOICE_MODELS}
              value={voiceModel}
              onChange={(id) => setVoiceModel(id as VoiceModelId)}
              disabled={isConnected}
            />
            {isConnected && (
              <span className="text-[10px] text-text-muted italic">
                Disconnect voice to change model
              </span>
            )}
          </div>

          {/* Input Area - Enhanced with glow container */}
          <div className="border-t border-steel-dark">
            <div className="px-6 pt-4 pb-6">
              {/* Input Container with glow */}
              <div className="input-container-glow p-3 mb-3">
                <div className="flex items-end space-x-3">
                  <ChatInput
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={isConnected ? "Type or speak..." : "Type a message or click A to talk..."}
                  />

                  {/* Send Button or Voice FAB */}
                  {inputValue.trim() ? (
                    <button
                      onClick={handleSendMessage}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-glow to-cyan-teal flex items-center justify-center flex-shrink-0 transition-all hover:scale-105"
                      style={{ boxShadow: '0 0 25px rgba(0, 200, 232, 0.35)' }}
                    >
                      <svg className="w-5 h-5 text-deep-space" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19V5m0 0l-7 7m7-7l7 7" />
                      </svg>
                    </button>
                  ) : (
                    <VoiceFAB
                      onStart={handleVoiceStart}
                      onStop={handleVoiceStop}
                      isListening={isListening}
                      isSpeaking={isSpeaking}
                      isConnected={isConnected}
                      isProcessing={false}
                    />
                  )}
                </div>
              </div>

              {/* Quick Actions Row - Only show when not in hero mode */}
              {!isInitialState && (
                <div className="flex items-center space-x-2 overflow-x-auto pb-1">
                  {quickActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAction(action.label)}
                      className="quick-action bg-gunmetal border border-steel-dark rounded-full px-3 py-1.5 text-xs text-text-secondary whitespace-nowrap flex items-center space-x-2 flex-shrink-0 hover:border-cyan-glow/50 hover:text-cyan-glow transition-all"
                    >
                      <span className={`w-5 h-5 rounded flex items-center justify-center bg-gradient-to-br ${action.iconBg}`}>
                        <span className={`${action.iconColor} [&>svg]:w-3 [&>svg]:h-3`}>{action.icon}</span>
                      </span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Activity Panel - Desktop only */}
        <ActivityPanel activities={activities} isInitialState={isInitialState} onQuickAction={handleQuickAction} />
      </div>
    </div>
  );
}

export default function CommandCenter() {
  return <CommandCenterInner />;
}
