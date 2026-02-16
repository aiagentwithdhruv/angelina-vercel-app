/**
 * Angelina AI - OpenAI Realtime Voice
 * Real-time voice conversation using OpenAI's Realtime API
 * 
 * Benefits:
 * - ~300ms latency (feels like real conversation)
 * - Native interruption handling
 * - Emotional voice tones
 * - Function calling support
 */

export interface VoiceConfig {
  apiKey: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  model?: string;
  instructions?: string;
  tools?: Array<{
    name: string;
    description: string;
    parameters: object;
  }>;
}

export interface VoiceEvents {
  onConnected?: () => void;
  onDisconnected?: () => void;
  onListening?: () => void;
  onSpeaking?: (text: string) => void;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onToolCall?: (name: string, args: object) => Promise<any>;
  onError?: (error: Error) => void;
}

/**
 * OpenAI Realtime Voice Client
 * Handles bidirectional voice communication
 */
export class OpenAIRealtimeVoice {
  private ws: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private processor: ScriptProcessorNode | null = null;
  private config: VoiceConfig;
  private events: VoiceEvents;
  private isConnected = false;

  constructor(config: VoiceConfig, events: VoiceEvents = {}) {
    this.config = {
      voice: 'nova', // Friendly female voice for Angelina
      model: 'gpt-4o-realtime-preview',
      instructions: `You are Angelina, a friendly and efficient AI assistant.
You help with emails, tasks, calendar, and various business operations.
Be conversational, warm, and concise. Don't be verbose.
When asked to do something, confirm what you're doing naturally.`,
      ...config,
    };
    this.events = events;
  }

  /**
   * Connect to OpenAI Realtime API
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Connect to OpenAI Realtime WebSocket
        const url = `wss://api.openai.com/v1/realtime?model=${this.config.model}`;
        
        this.ws = new WebSocket(url, [
          'realtime',
          `openai-insecure-api-key.${this.config.apiKey}`,
          'openai-beta.realtime-v1',
        ]);

        this.ws.onopen = () => {
          console.log('🔗 Connected to OpenAI Realtime');
          this.isConnected = true;
          
          // Configure the session
          this.sendEvent('session.update', {
            session: {
              modalities: ['text', 'audio'],
              voice: this.config.voice,
              instructions: this.config.instructions,
              input_audio_format: 'pcm16',
              output_audio_format: 'pcm16',
              input_audio_transcription: {
                model: 'whisper-1',
              },
              turn_detection: {
                type: 'server_vad', // Voice Activity Detection
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 500,
              },
              tools: this.config.tools?.map(t => ({
                type: 'function',
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              })) || [],
            },
          });

          this.events.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleServerEvent(data);
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.events.onError?.(new Error('WebSocket connection failed'));
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('🔌 Disconnected from OpenAI Realtime');
          this.isConnected = false;
          this.events.onDisconnected?.();
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Start listening (microphone input)
   */
  async startListening(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    try {
      // Get microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Create audio context for processing
      this.audioContext = new AudioContext({ sampleRate: 24000 });
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Process audio and send to OpenAI
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.processor.onaudioprocess = (event) => {
        if (!this.isConnected) return;
        
        const inputData = event.inputBuffer.getChannelData(0);
        const pcm16 = this.float32ToPCM16(inputData);
        const base64 = this.arrayBufferToBase64(pcm16.buffer as ArrayBuffer);
        
        this.sendEvent('input_audio_buffer.append', {
          audio: base64,
        });
      };

      source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);

      console.log('🎤 Listening...');
      this.events.onListening?.();

    } catch (error) {
      console.error('Failed to start listening:', error);
      this.events.onError?.(error as Error);
      throw error;
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    // Commit the audio buffer to trigger response
    if (this.isConnected) {
      this.sendEvent('input_audio_buffer.commit', {});
    }

    console.log('🛑 Stopped listening');
  }

  /**
   * Send text message (for typing)
   */
  sendMessage(text: string): void {
    if (!this.isConnected) {
      console.error('Not connected');
      return;
    }

    this.sendEvent('conversation.item.create', {
      item: {
        type: 'message',
        role: 'user',
        content: [{
          type: 'input_text',
          text,
        }],
      },
    });

    this.sendEvent('response.create', {});
  }

  /**
   * Interrupt Angelina (stop her speaking)
   */
  interrupt(): void {
    if (this.isConnected) {
      this.sendEvent('response.cancel', {});
    }
  }

  /**
   * Disconnect
   */
  disconnect(): void {
    this.stopListening();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.isConnected = false;
  }

  // ─────────────────────────────────────────────────────────────
  // Private methods
  // ─────────────────────────────────────────────────────────────

  private sendEvent(type: string, data: object): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  private handleServerEvent(event: any): void {
    switch (event.type) {
      case 'session.created':
        console.log('📝 Session created');
        break;

      case 'session.updated':
        console.log('✅ Session configured');
        break;

      case 'input_audio_buffer.speech_started':
        console.log('🎙️ User speaking...');
        break;

      case 'input_audio_buffer.speech_stopped':
        console.log('🎙️ User stopped speaking');
        break;

      case 'conversation.item.input_audio_transcription.completed':
        // User's speech transcribed
        const userText = event.transcript;
        console.log('📝 You said:', userText);
        this.events.onTranscript?.(userText, true);
        break;

      case 'response.audio_transcript.delta':
        // Angelina is speaking (streaming text)
        this.events.onSpeaking?.(event.delta);
        break;

      case 'response.audio_transcript.done':
        // Angelina finished speaking
        console.log('💬 Angelina:', event.transcript);
        this.events.onResponse?.(event.transcript);
        break;

      case 'response.audio.delta':
        // Play audio
        this.playAudio(event.delta);
        break;

      case 'response.function_call_arguments.done':
        // Tool call completed
        this.handleToolCall(event);
        break;

      case 'error':
        console.error('Server error:', event.error);
        this.events.onError?.(new Error(event.error?.message || 'Unknown error'));
        break;
    }
  }

  private async handleToolCall(event: any): Promise<void> {
    const { name, arguments: argsJson, call_id } = event;
    
    try {
      const args = JSON.parse(argsJson);
      console.log(`🔧 Tool call: ${name}`, args);
      
      // Execute the tool via callback
      const result = await this.events.onToolCall?.(name, args);
      
      // Send result back to OpenAI
      this.sendEvent('conversation.item.create', {
        item: {
          type: 'function_call_output',
          call_id,
          output: JSON.stringify(result || {}),
        },
      });
      
      // Continue the response
      this.sendEvent('response.create', {});
      
    } catch (error) {
      console.error('Tool execution error:', error);
    }
  }

  private playAudio(base64Audio: string): void {
    // Decode and play audio
    const audioData = this.base64ToArrayBuffer(base64Audio);
    const pcm16 = new Int16Array(audioData);
    const float32 = this.pcm16ToFloat32(pcm16);
    
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ sampleRate: 24000 });
    }
    
    const buffer = this.audioContext.createBuffer(1, float32.length, 24000);
    buffer.copyToChannel(new Float32Array(float32), 0);
    
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.audioContext.destination);
    source.start();
  }

  // Audio conversion utilities
  private float32ToPCM16(float32: Float32Array): Int16Array {
    const pcm16 = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return pcm16;
  }

  private pcm16ToFloat32(pcm16: Int16Array): Float32Array {
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / (pcm16[i] < 0 ? 0x8000 : 0x7FFF);
    }
    return float32;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

// ─────────────────────────────────────────────────────────────
// Singleton for easy use
// ─────────────────────────────────────────────────────────────

let voiceInstance: OpenAIRealtimeVoice | null = null;

export const angelinaVoice = {
  /**
   * Initialize with API key
   */
  init(apiKey: string, events: VoiceEvents = {}, tools?: VoiceConfig['tools']) {
    voiceInstance = new OpenAIRealtimeVoice(
      { apiKey, tools },
      events
    );
    return voiceInstance;
  },

  /**
   * Connect and start conversation
   */
  async start() {
    if (!voiceInstance) throw new Error('Call init() first');
    await voiceInstance.connect();
    await voiceInstance.startListening();
  },

  /**
   * Stop listening (triggers response)
   */
  stop() {
    voiceInstance?.stopListening();
  },

  /**
   * Send text message
   */
  send(text: string) {
    voiceInstance?.sendMessage(text);
  },

  /**
   * Interrupt Angelina
   */
  interrupt() {
    voiceInstance?.interrupt();
  },

  /**
   * Disconnect completely
   */
  disconnect() {
    voiceInstance?.disconnect();
    voiceInstance = null;
  },

  /**
   * Check if connected
   */
  get isConnected() {
    return voiceInstance?.['isConnected'] ?? false;
  },
};
