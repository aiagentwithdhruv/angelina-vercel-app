"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * Gemini Live Voice Hook — drop-in replacement for useRealtimeVoice
 *
 * Uses Google's Multimodal Live API (WebSocket) instead of OpenAI Realtime.
 * Free tier: 15 RPM, 1500 RPD. Paid: $1/$4 per 1M audio tokens (5-10x cheaper than OpenAI).
 *
 * Audio: Input 16kHz PCM16 mono, Output 24kHz PCM16 mono
 * Voices: Zephyr (warm female), Aoede, Kore, Puck, Charon, etc.
 */

export type GeminiVoice = "Zephyr" | "Aoede" | "Kore" | "Puck" | "Charon" | "Fenrir" | "Leda" | "Orus" | "Perseus";

interface UseGeminiLiveVoiceOptions {
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAIResponse?: (text: string) => void;
  onError?: (error: string) => void;
  systemPrompt?: string;
  voice?: GeminiVoice;
  model?: string;
}

interface UseGeminiLiveVoiceReturn {
  isConnected: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  userTranscript: string;
  aiTranscript: string;
  connect: () => Promise<void>;
  disconnect: () => void;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
}

const GEMINI_WS_URL = "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

export function useGeminiLiveVoice(options: UseGeminiLiveVoiceOptions = {}): UseGeminiLiveVoiceReturn {
  const {
    onTranscript,
    onAIResponse,
    onError,
    systemPrompt,
    voice = "Zephyr",
    model,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userTranscript, setUserTranscript] = useState("");
  const [aiTranscript, setAiTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const shouldStopPlaybackRef = useRef(false);
  const setupSentRef = useRef(false);
  const aiTextRef = useRef("");

  // Stop audio playback (for interruption)
  const stopAudioPlayback = useCallback(() => {
    shouldStopPlaybackRef.current = true;
    playbackQueueRef.current = [];
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
        currentSourceRef.current.disconnect();
      } catch { /* already stopped */ }
      currentSourceRef.current = null;
    }
    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // PCM16 helpers
  const floatTo16BitPCM = (float32: Float32Array): Int16Array => {
    const pcm = new Int16Array(float32.length);
    for (let i = 0; i < float32.length; i++) {
      const s = Math.max(-1, Math.min(1, float32[i]));
      pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return pcm;
  };

  const int16ToBase64 = (int16: Int16Array): string => {
    const bytes = new Uint8Array(int16.buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const base64ToInt16 = (b64: string): Int16Array => {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Int16Array(bytes.buffer);
  };

  // Downsample from browser's sample rate to 16kHz for Gemini input
  const downsample = (float32: Float32Array, fromRate: number, toRate: number): Float32Array => {
    if (fromRate === toRate) return float32;
    const ratio = fromRate / toRate;
    const newLength = Math.round(float32.length / ratio);
    const result = new Float32Array(newLength);
    for (let i = 0; i < newLength; i++) {
      result[i] = float32[Math.round(i * ratio)];
    }
    return result;
  };

  // Play audio from queue (24kHz output)
  const playAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || playbackQueueRef.current.length === 0) return;

    isPlayingRef.current = true;
    shouldStopPlaybackRef.current = false;
    setIsSpeaking(true);

    try {
      const ctx = audioContextRef.current || new AudioContext({ sampleRate: 24000 });
      if (!audioContextRef.current) audioContextRef.current = ctx;
      if (ctx.state === "suspended") await ctx.resume();

      while (playbackQueueRef.current.length > 0 && !shouldStopPlaybackRef.current) {
        const audioData = playbackQueueRef.current.shift()!;
        if (shouldStopPlaybackRef.current) break;

        const float32 = new Float32Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) float32[i] = audioData[i] / 32768;

        const buffer = ctx.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        currentSourceRef.current = source;

        await new Promise<void>((resolve) => {
          source.onended = () => { currentSourceRef.current = null; resolve(); };
          source.start();
        });
      }
    } catch (err) {
      console.error("[GeminiLive] Playback error:", err);
    }

    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  // Handle Gemini WebSocket messages
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);

      // Log all non-audio events for debugging
      const hasAudio = data.serverContent?.modelTurn?.parts?.some((p: any) => p.inlineData?.mimeType?.startsWith("audio/"));
      if (!hasAudio) {
        console.log("[GeminiLive] Event:", JSON.stringify(data).slice(0, 300));
      }

      // Setup complete
      if (data.setupComplete) {
        console.log("[GeminiLive] Setup complete");
        setIsConnected(true);
        return;
      }

      // Tool call from Gemini
      if (data.toolCall) {
        const calls = data.toolCall.functionCalls || [];
        for (const call of calls) {
          console.log("[GeminiLive] Tool call:", call.name, call.args);

          fetch(`/api/tools/${call.name}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(call.args || {}),
          })
            .then((res) => res.json())
            .then((result) => {
              console.log("[GeminiLive] Tool result:", result);
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  toolResponse: {
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: result,
                    }],
                  },
                }));
              }
            })
            .catch((err) => {
              console.error("[GeminiLive] Tool error:", err);
              if (wsRef.current?.readyState === WebSocket.OPEN) {
                wsRef.current.send(JSON.stringify({
                  toolResponse: {
                    functionResponses: [{
                      id: call.id,
                      name: call.name,
                      response: { error: "Tool execution failed" },
                    }],
                  },
                }));
              }
            });
        }
        return;
      }

      // Server content (audio + text from model)
      if (data.serverContent) {
        const sc = data.serverContent;

        // Model turn — contains audio and/or text parts
        if (sc.modelTurn?.parts) {
          for (const part of sc.modelTurn.parts) {
            // Audio output
            if (part.inlineData?.mimeType?.startsWith("audio/")) {
              const audioData = base64ToInt16(part.inlineData.data);
              playbackQueueRef.current.push(audioData);
              playAudioQueue();
            }
            // Text transcript of what AI is saying
            if (part.text) {
              aiTextRef.current += part.text;
              setAiTranscript(aiTextRef.current);
            }
          }
        }

        // Turn complete — finalize the response
        if (sc.turnComplete) {
          if (aiTextRef.current) {
            onAIResponse?.(aiTextRef.current);
          }
          aiTextRef.current = "";
          setAiTranscript("");
        }

        // Input transcription (what user said)
        if (sc.inputTranscription?.text) {
          const text = sc.inputTranscription.text;
          console.log("[GeminiLive] User said:", text);
          setUserTranscript(text);
          onTranscript?.(text, true);
        }

        // Interrupted — user spoke while AI was speaking
        if (sc.interrupted) {
          console.log("[GeminiLive] Interrupted by user");
          stopAudioPlayback();
          aiTextRef.current = "";
        }
      }

    } catch (err) {
      console.error("[GeminiLive] Parse error:", err);
    }
  }, [onTranscript, onAIResponse, playAudioQueue, stopAudioPlayback]);

  // Connect to Gemini Live API
  const connect = useCallback(async () => {
    setError(null);
    setupSentRef.current = false;

    // Get API key + config from our backend
    const tokenRes = await fetch("/api/ai/gemini-live-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voice, model, instructions: systemPrompt }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      const msg = err.error || "Failed to get Gemini Live config";
      setError(msg);
      onError?.(msg);
      throw new Error(msg);
    }

    const config = await tokenRes.json();
    console.log("[GeminiLive] Config:", config.model, config.voice);

    return new Promise<void>((resolve, reject) => {
      let settled = false;
      const settle = (fn: () => void) => { if (!settled) { settled = true; fn(); } };

      const wsUrl = `${GEMINI_WS_URL}?key=${config.apiKey}`;
      const ws = new WebSocket(wsUrl);

      // Timeout — if setupComplete never arrives, don't hang forever
      const timeout = setTimeout(() => {
        settle(() => {
          const msg = "Gemini Live setup timed out (10s). API may be rate-limited.";
          console.error("[GeminiLive]", msg);
          setError(msg);
          onError?.(msg);
          ws.close();
          reject(new Error(msg));
        });
      }, 10000);

      ws.onopen = () => {
        console.log("[GeminiLive] WebSocket connected, sending setup");

        // Build tool declarations for Gemini format
        const functionDeclarations = (config.tools || []).map((t: any) => ({
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        }));

        // Send setup message
        const setup: any = {
          setup: {
            model: config.model,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: {
                    voiceName: config.voice,
                  },
                },
              },
              // Enable transcription of user speech
              inputAudioTranscription: {},
            },
            systemInstruction: {
              parts: [{ text: config.instructions }],
            },
            // Affective Dialogue — detects emotion in user's voice and responds appropriately
            realtimeInputConfig: {
              automaticActivityDetection: {
                disabled: false,
              },
            },
          },
        };

        if (functionDeclarations.length > 0) {
          setup.setup.tools = [{ functionDeclarations }];
        }

        console.log("[GeminiLive] Setup message:", JSON.stringify(setup).slice(0, 500));
        ws.send(JSON.stringify(setup));
        setupSentRef.current = true;
        wsRef.current = ws;
      };

      // Wait for setupComplete before resolving
      ws.onmessage = (event: MessageEvent) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[GeminiLive] Pre-setup event:", JSON.stringify(data).slice(0, 300));
          if (data.setupComplete) {
            clearTimeout(timeout);
            console.log("[GeminiLive] Setup complete — ready for audio");
            setIsConnected(true);
            // Now switch to the main handler for all future messages
            ws.onmessage = handleMessage;
            settle(() => resolve());
            return;
          }
        } catch (err) {
          console.error("[GeminiLive] Pre-setup parse error:", err);
        }
        // Forward any non-setup messages to main handler
        handleMessage(event);
      };

      ws.onerror = (evt) => {
        clearTimeout(timeout);
        console.error("[GeminiLive] WebSocket error:", evt);
        settle(() => {
          const msg = "Gemini Live connection error";
          setError(msg);
          onError?.(msg);
          reject(new Error(msg));
        });
      };

      ws.onclose = (event) => {
        clearTimeout(timeout);
        console.log("[GeminiLive] Disconnected:", event.code, event.reason);
        setIsConnected(false);
        setIsListening(false);
        settle(() => {
          const msg = `Gemini Live closed before setup: ${event.reason || `code ${event.code}`}`;
          setError(msg);
          onError?.(msg);
          reject(new Error(msg));
        });
      };

      wsRef.current = ws;
    });
  }, [voice, model, systemPrompt, handleMessage, onError]);

  // Disconnect
  const disconnect = useCallback(() => {
    stopAudioPlayback();
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close().catch(() => {});
      inputContextRef.current = null;
    }
    setIsConnected(false);
    setIsListening(false);
    setIsSpeaking(false);
    setupSentRef.current = false;
  }, [stopAudioPlayback]);

  // Start listening — capture mic at native rate, downsample to 16kHz for Gemini
  const startListening = useCallback(async () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      setError("Not connected");
      return;
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        const msg = "Voice requires HTTPS. Use the installed app or localhost.";
        setError(msg);
        onError?.(msg);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
      });
      streamRef.current = stream;

      // Use native sample rate, we'll downsample to 16kHz
      const ctx = new AudioContext();
      inputContextRef.current = ctx;
      const nativeRate = ctx.sampleRate;

      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const downsampled = downsample(inputData, nativeRate, 16000);
        const pcm16 = floatTo16BitPCM(downsampled);
        const b64 = int16ToBase64(pcm16);

        // Gemini expects realtimeInput format
        wsRef.current.send(JSON.stringify({
          realtimeInput: {
            mediaChunks: [{
              mimeType: "audio/pcm;rate=16000",
              data: b64,
            }],
          },
        }));
      };

      source.connect(processor);
      processor.connect(ctx.destination);

      setIsListening(true);
      setUserTranscript("");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start listening";
      setError(msg);
      onError?.(msg);
    }
  }, [onError]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close().catch(() => {});
      inputContextRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
    };
  }, [disconnect]);

  return {
    isConnected,
    isListening,
    isSpeaking,
    userTranscript,
    aiTranscript,
    connect,
    disconnect,
    startListening,
    stopListening,
    error,
  };
}
