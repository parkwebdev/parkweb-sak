/**
 * useWidgetAudioRecording Hook
 * 
 * Handles all audio recording functionality including:
 * - MediaRecorder API management
 * - Recording state (active, time elapsed)
 * - Audio blob creation and URL generation
 * - Cleanup on cancel/stop
 * 
 * @module widget/hooks/useWidgetAudioRecording
 * 
 * @example
 * ```tsx
 * const {
 *   isRecordingAudio,
 *   recordingTime,
 *   startAudioRecording,
 *   stopAudioRecording,
 *   cancelAudioRecording,
 * } = useWidgetAudioRecording({ setMessages });
 * ```
 */

import { useState, useRef, useCallback } from 'react';
import { widgetLogger } from '../utils/widget-logger';
import type { Message } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface UseWidgetAudioRecordingProps {
  /** Callback to add the recorded audio message to the message list */
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export interface UseWidgetAudioRecordingReturn {
  /** Whether audio is currently being recorded */
  isRecordingAudio: boolean;
  /** Current recording time in seconds */
  recordingTime: number;
  /** Start recording audio from microphone */
  startAudioRecording: () => Promise<void>;
  /** Stop recording and add audio message */
  stopAudioRecording: () => void;
  /** Cancel recording without saving */
  cancelAudioRecording: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useWidgetAudioRecording({
  setMessages,
}: UseWidgetAudioRecordingProps): UseWidgetAudioRecordingReturn {
  // === State ===
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  
  // === Refs ===
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // === Start Recording ===
  const startAudioRecording = useCallback(async () => {
    try {
      widgetLogger.info('[AudioRecording] Requesting microphone access');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        widgetLogger.info('[AudioRecording] Recording stopped, blob size:', audioBlob.size);
        setMessages(prev => [...prev, { 
          role: 'user', 
          content: 'Voice message', 
          read: false, 
          timestamp: new Date(), 
          type: 'audio', 
          audioUrl, 
          reactions: [] 
        }]);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      widgetLogger.info('[AudioRecording] Recording started');
    } catch (error: unknown) {
      widgetLogger.error('[AudioRecording] Error starting recording:', error);
    }
  }, [setMessages]);

  // === Stop Recording ===
  const stopAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      widgetLogger.debug('[AudioRecording] Stopping recording');
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  }, [isRecordingAudio]);

  // === Cancel Recording ===
  const cancelAudioRecording = useCallback(() => {
    widgetLogger.debug('[AudioRecording] Cancelling recording');
    if (mediaRecorderRef.current && isRecordingAudio) {
      // Remove onstop handler to prevent adding message
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
    }
    setIsRecordingAudio(false);
    setRecordingTime(0);
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    chunksRef.current = [];
  }, [isRecordingAudio]);

  return {
    isRecordingAudio,
    recordingTime,
    startAudioRecording,
    stopAudioRecording,
    cancelAudioRecording,
  };
}
