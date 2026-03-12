"use client";

import { useState, useRef, useCallback } from "react";

export interface UseLocalRecordingReturn {
  isRecording: boolean;
  error: string | null;
  recordingBlob: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<Blob | null>;
  clearRecording: () => void;
}

const MIME_TYPE = "audio/webm";
const AUDIO_OPTIONS: MediaRecorderOptions = { mimeType: MIME_TYPE, audioBitsPerSecond: 128000 };

export function useLocalRecording(): UseLocalRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    setRecordingBlob(null);
    chunksRef.current = [];

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Microphone not available. Use HTTPS or the app.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        },
      });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported(MIME_TYPE) ? MIME_TYPE : "audio/webm";
      const recorder = new MediaRecorder(stream, { ...AUDIO_OPTIONS, mimeType });
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
      };

      recorder.start(1000);
      setIsRecording(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start recording";
      setError(msg);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<Blob | null> => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      return null;
    }

    return new Promise((resolve) => {
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
        setIsRecording(false);
        const blob =
          chunksRef.current.length > 0
            ? new Blob(chunksRef.current, { type: MIME_TYPE })
            : null;
        setRecordingBlob(blob);
        chunksRef.current = [];
        resolve(blob);
      };
      recorder.stop();
    });
  }, []);

  const clearRecording = useCallback(() => {
    setRecordingBlob(null);
    setError(null);
  }, []);

  return {
    isRecording,
    error,
    recordingBlob,
    startRecording,
    stopRecording,
    clearRecording,
  };
}
