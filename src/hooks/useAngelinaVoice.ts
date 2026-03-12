"use client";

/**
 * Angelina AI - Real-time Voice Hook
 * 
 * Provides always-on voice conversation with Angelina.
 * Based on proven implementation from AI Sales Coach.
 * 
 * Features:
 * - Server VAD: Auto-detects when you speak (no button clicking!)
 * - Interruptions: Tap to stop Angelina mid-sentence
 * - High-quality audio: 24kHz PCM
 * - Tool calling: Angelina can check email, create tasks, etc.
 */

import { useState, useRef, useCallback, useEffect } from "react";

// Voice options for Angelina (Realtime API supported voices)
// shimmer = warm female, coral = friendly female, sage = calm female
export type AngelinaVoice = "shimmer" | "coral" | "sage" | "alloy" | "ash" | "ballad" | "echo" | "verse";

/** push-to-talk = manual; continuous = hold to talk; ambient = always listening for wake word "Hey Angelina" (requires VAD + keyword spotting) */
export type VoiceMode = "push-to-talk" | "continuous" | "ambient";

interface UseAngelinaVoiceOptions {
  voice?: AngelinaVoice;
  mode?: VoiceMode;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onResponse?: (text: string) => void;
  onToolCall?: (name: string, args: object) => Promise<any>;
  onError?: (error: string) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
  autoConnect?: boolean;
}

interface UseAngelinaVoiceReturn {
  // State
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  userTranscript: string;
  aiTranscript: string;
  error: string | null;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  startListening: () => Promise<void>;
  stopListening: () => void;
  interrupt: () => void;
  sendText: (text: string) => void;
}

export function useAngelinaVoice(options: UseAngelinaVoiceOptions = {}): UseAngelinaVoiceReturn {
  const {
    voice = "shimmer",
    mode = "push-to-talk",
    onTranscript,
    onResponse,
    onToolCall,
    onError,
    onSpeakingChange,
    autoConnect = false,
  } = options;
  const isAmbient = mode === "ambient";

  // State
  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAmbientActive, setIsAmbientActive] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const ambientReconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleToolCallRef = useRef<(data: any) => void>(() => {});

  // ─────────────────────────────────────────────────────────────
  // Audio Conversion Utilities
  // ─────────────────────────────────────────────────────────────

  const floatTo16BitPCM = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return int16Array;
  };

  const int16ToBase64 = (int16Array: Int16Array): string => {
    const uint8Array = new Uint8Array(int16Array.buffer);
    let binary = "";
    for (let i = 0; i < uint8Array.length; i++) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary);
  };

  const base64ToInt16 = (base64: string): Int16Array => {
    const binary = atob(base64);
    const uint8Array = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      uint8Array[i] = binary.charCodeAt(i);
    }
    return new Int16Array(uint8Array.buffer);
  };

  // ─────────────────────────────────────────────────────────────
  // Audio Playback
  // ─────────────────────────────────────────────────────────────

  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || playbackQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    setIsSpeaking(true);
    onSpeakingChange?.(true);

    try {
      const audioContext = audioContextRef.current || new AudioContext({ sampleRate: 24000 });
      if (!audioContextRef.current) audioContextRef.current = audioContext;
      
      // Resume audio context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      while (playbackQueueRef.current.length > 0) {
        const audioData = playbackQueueRef.current.shift()!;

        // Convert Int16 to Float32
        const float32Array = new Float32Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
          float32Array[i] = audioData[i] / 32768;
        }

        const audioBuffer = audioContext.createBuffer(1, float32Array.length, 24000);
        audioBuffer.getChannelData(0).set(float32Array);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        await new Promise<void>((resolve) => {
          source.onended = () => resolve();
          source.start();
        });
      }
    } catch (err) {
      console.error("[Angelina] Audio playback error:", err);
    }

    isPlayingRef.current = false;
    setIsSpeaking(false);
    onSpeakingChange?.(false);
  }, [onSpeakingChange]);

  // ─────────────────────────────────────────────────────────────
  // WebSocket Message Handler
  // ─────────────────────────────────────────────────────────────

  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      // Log important events (not audio chunks)
      if (!data.type?.includes("audio.delta")) {
        console.log("[Angelina]", data.type);
      }

      switch (data.type) {
        case "session.created":
        case "session.updated":
          console.log("[Angelina] ✅ Session ready");
          break;

        case "input_audio_buffer.speech_started":
          console.log("[Angelina] 🎤 You started speaking");
          setUserTranscript("");
          break;

        case "input_audio_buffer.speech_stopped":
          console.log("[Angelina] 🎤 You stopped speaking");
          break;

        case "conversation.item.input_audio_transcription.completed":
          const userText = data.transcript || "";
          console.log("[Angelina] 📝 You said:", userText);

          // Ambient mode: only process if wake word detected
          if (isAmbient && !isAmbientActive) {
            const lower = userText.toLowerCase().trim();
            const WAKE_PATTERNS = ["hey angelina", "hi angelina", "angelina"];
            const woke = WAKE_PATTERNS.some(w => lower.startsWith(w) || lower.includes(w));
            if (!woke) {
              console.log("[Angelina] 🔇 Ambient: no wake word, ignoring");
              break;
            }
            console.log("[Angelina] 🔔 Wake word detected!");
            setIsAmbientActive(true);
            // Strip wake word prefix and forward the rest as the actual query
            let command = lower;
            for (const w of WAKE_PATTERNS) {
              if (command.startsWith(w)) { command = command.slice(w.length).trim(); break; }
            }
            if (command.length > 0) {
              setUserTranscript(command);
              onTranscript?.(command, true);
            } else {
              setUserTranscript(userText);
              onTranscript?.(userText, true);
            }
            break;
          }

          setUserTranscript(userText);
          onTranscript?.(userText, true);
          break;

        case "response.created":
          console.log("[Angelina] 🤖 Thinking...");
          setAiTranscript("");
          break;

        case "response.audio_transcript.delta":
        case "response.output_audio_transcript.delta":
          const aiDelta = data.delta || "";
          setAiTranscript(prev => prev + aiDelta);
          break;

        case "response.audio_transcript.done":
        case "response.output_audio_transcript.done":
          const fullAiText = data.transcript || "";
          console.log("[Angelina] 💬 Said:", fullAiText);
          setAiTranscript(fullAiText);
          onResponse?.(fullAiText);
          break;

        case "response.audio.delta":
        case "response.output_audio.delta":
          // Queue audio for playback
          if (data.delta) {
            try {
              const audioData = base64ToInt16(data.delta);
              playbackQueueRef.current.push(audioData);
              playAudioQueue();
            } catch (err) {
              console.error("[Angelina] Audio decode error:", err);
            }
          }
          break;

        case "response.function_call_arguments.done":
          // Handle tool calls
          handleToolCallRef.current(data);
          break;

        case "response.done":
          console.log("[Angelina] ✅ Response complete");
          if (isAmbient) {
            setIsAmbientActive(false);
          }
          break;

        case "error":
          const errorMsg = data.error?.message || "Unknown error";
          // Suppress known non-fatal session config errors (voice still works)
          const nonFatalPattern = /session\.(type|modalities|voice)|unknown_parameter|missing_required_parameter/i;
          if (nonFatalPattern.test(errorMsg)) {
            console.warn("[Angelina] Non-fatal session config warning:", errorMsg);
          } else {
            console.error("[Angelina] ❌ Error:", errorMsg);
            setError(errorMsg);
            onError?.(errorMsg);
          }
          break;
      }
    } catch (err) {
      console.error("[Angelina] Failed to parse message:", err);
    }
  }, [isAmbient, isAmbientActive, onTranscript, onResponse, onError, playAudioQueue]);

  // ─────────────────────────────────────────────────────────────
  // Tool Call Handler
  // ─────────────────────────────────────────────────────────────

  const handleToolCall = useCallback(async (data: any) => {
    const { name, arguments: argsJson, call_id } = data;
    
    try {
      const args = JSON.parse(argsJson);
      console.log(`[Angelina] 🔧 Tool: ${name}`, args);
      
      let result: any = { success: true };

      // Execute tool via callback or API
      if (onToolCall) {
        result = await onToolCall(name, args);
      } else {
        // Default: call API endpoint
        try {
          const response = await fetch(`/api/tools/${name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(args),
          });
          result = await response.json();
        } catch (err) {
          result = { error: "Tool execution failed" };
        }
      }

      // Send result back to OpenAI
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: "conversation.item.create",
          item: {
            type: "function_call_output",
            call_id,
            output: JSON.stringify(result),
          },
        }));
        
        // Continue the response
        wsRef.current.send(JSON.stringify({
          type: "response.create",
        }));
      }
      
    } catch (error) {
      console.error("[Angelina] Tool error:", error);
    }
  }, [onToolCall]);

  useEffect(() => {
    handleToolCallRef.current = handleToolCall;
  }, [handleToolCall]);

  // ─────────────────────────────────────────────────────────────
  // Connection Management
  // ─────────────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    try {
      setError(null);
      console.log("[Angelina] 🔗 Connecting...");

      // Get ephemeral token from our API
      const tokenResponse = await fetch("/api/ai/realtime-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voice }),
      });
      
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get realtime token");
      }
      
      const tokenData = await tokenResponse.json();
      const token = tokenData.token;
      const model = tokenData.model || "gpt-4o-realtime-preview-2024-12-17";
      
      console.log("[Angelina] Token type:", tokenData.type);
      const needsSessionConfig = tokenData.type === "api_key";

      // Connect to OpenAI Realtime API
      const wsUrl = `wss://api.openai.com/v1/realtime?model=${model}`;
      const ws = new WebSocket(wsUrl, [
        "realtime",
        `openai-insecure-api-key.${token}`
      ]);

      ws.onopen = () => {
        console.log("[Angelina] ✅ Connected!");
        setIsConnected(true);
        
        // If using direct API key, we need to configure the session manually
        if (needsSessionConfig) {
          console.log("[Angelina] Configuring session...");
          ws.send(JSON.stringify({
            type: "session.update",
            session: {
              instructions: `You are Angelina, a warm and helpful AI assistant. Be conversational and friendly.`,
              input_audio_format: "pcm16",
              output_audio_format: "pcm16",
              input_audio_transcription: {
                model: "whisper-1"
              },
              turn_detection: {
                type: "server_vad",
                threshold: 0.5,
                prefix_padding_ms: 300,
                silence_duration_ms: 800
              }
            }
          }));
        }
      };

      ws.onmessage = handleMessage;

      ws.onerror = (err) => {
        console.error("[Angelina] WebSocket error:", err);
        setError("Connection error");
        onError?.("Connection error");
      };

      ws.onclose = (event) => {
        console.log("[Angelina] 🔌 Disconnected:", event.code);
        setIsConnected(false);
        setIsListening(false);
        if (event.code !== 1000 && event.code !== 1005) {
          setError(`Connection closed: ${event.reason || 'Unknown reason'}`);
        }
        // Ambient mode: auto-reconnect on unexpected close
        if (isAmbient && event.code !== 1000) {
          console.log("[Angelina] 🔄 Ambient: auto-reconnect in 3s...");
          ambientReconnectRef.current = setTimeout(() => connect(), 3000);
        }
      };

      wsRef.current = ws;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to connect";
      console.error("[Angelina] Connection error:", message);
      setError(message);
      onError?.(message);
    }
  }, [voice, handleMessage, isAmbient, onError]);

  const disconnect = useCallback(() => {
    console.log("[Angelina] Disconnecting...");
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    
    playbackQueueRef.current = [];
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Microphone Control
  // ─────────────────────────────────────────────────────────────

  const startListening = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected");
      return;
    }

    try {
      console.log("[Angelina] 🎤 Starting microphone...");
      
      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 24000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      streamRef.current = stream;

      // Create audio context and processor
      const audioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      // Stream audio to OpenAI
      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcm16 = floatTo16BitPCM(inputData);
          const base64Audio = int16ToBase64(pcm16);

          wsRef.current.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64Audio
          }));
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      setIsListening(true);
      setUserTranscript("");
      console.log("[Angelina] 🎤 Listening! Speak naturally...");

    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to start listening";
      console.error("[Angelina] Microphone error:", message);
      setError(message);
      onError?.(message);
    }
  }, [onError]);

  const stopListening = useCallback(() => {
    console.log("[Angelina] 🛑 Stopping microphone...");
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    setIsListening(false);
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Interruption & Text Input
  // ─────────────────────────────────────────────────────────────

  const interrupt = useCallback(() => {
    console.log("[Angelina] 🛑 Interrupting...");
    
    // Clear audio queue
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
    onSpeakingChange?.(false);
    
    // Cancel current response
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "response.cancel"
      }));
    }
  }, [onSpeakingChange]);

  const sendText = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected");
      return;
    }

    console.log("[Angelina] 📝 Sending text:", text);

    // Add user message
    wsRef.current.send(JSON.stringify({
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [{
          type: "input_text",
          text
        }]
      }
    }));

    // Request response
    wsRef.current.send(JSON.stringify({
      type: "response.create"
    }));
  }, []);

  // ─────────────────────────────────────────────────────────────
  // Auto-connect & Cleanup
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (autoConnect || isAmbient) {
      connect().then(() => {
        if (isAmbient) startListening();
      });
    }
    
    return () => {
      if (ambientReconnectRef.current) clearTimeout(ambientReconnectRef.current);
      disconnect();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [autoConnect, isAmbient, connect, disconnect, startListening]);

  return {
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
    interrupt,
    sendText,
  };
}
