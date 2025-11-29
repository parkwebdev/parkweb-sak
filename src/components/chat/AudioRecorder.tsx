import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Microphone01 as Mic, Square, Send01 as Send, XClose as X } from '@untitledui/icons';
import { AudioRecorder as AudioRecorderUtil, formatDuration } from '@/lib/audio-recording';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel: () => void;
  primaryColor: string;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  primaryColor,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>(new Array(128).fill(128));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recorderRef = useRef<AudioRecorderUtil | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioBlob = useRef<Blob | null>(null);

  useEffect(() => {
    return () => {
      if (recorderRef.current) {
        recorderRef.current.stop();
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barCount = 64;
    const barWidth = width / barCount;

    ctx.clearRect(0, 0, width, height);

    // Sample the waveform data
    const step = Math.floor(waveformData.length / barCount);
    
    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * step;
      const value = waveformData[dataIndex];
      const percent = value / 255;
      const barHeight = Math.max(2, percent * height);

      ctx.fillStyle = isRecording ? primaryColor : '#9ca3af';
      ctx.fillRect(
        i * barWidth,
        (height - barHeight) / 2,
        barWidth - 2,
        barHeight
      );
    }
  }, [waveformData, isRecording, primaryColor]);

  const startRecording = async () => {
    try {
      recorderRef.current = new AudioRecorderUtil(
        (blob) => {
          audioBlob.current = blob;
        },
        (data: number[]) => {
          setWaveformData(data);
        }
      );

      await recorderRef.current.start();
      setIsRecording(true);
      setDuration(0);

      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.stop();
      setIsRecording(false);
    }

    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  };

  const handleSend = () => {
    if (audioBlob.current) {
      onRecordingComplete(audioBlob.current);
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    onCancel();
  };

  return (
    <div className="flex items-center gap-3 p-4 border-t bg-background">
      <Button
        size="sm"
        variant="ghost"
        onClick={handleCancel}
        className="h-10 w-10 p-0"
      >
        <X className="h-5 w-5" />
      </Button>

      <div className="flex-1 flex items-center gap-3">
        <canvas
          ref={canvasRef}
          width={400}
          height={60}
          className="w-full h-[60px] rounded"
        />
        <span className="text-sm font-medium text-foreground min-w-[50px]">
          {formatDuration(duration)}
        </span>
      </div>

      {!isRecording ? (
        <>
          <Button
            size="sm"
            onClick={startRecording}
            style={{ backgroundColor: primaryColor }}
            className="h-10 w-10 p-0 text-white"
          >
            <Mic className="h-5 w-5" />
          </Button>
          {duration > 0 && (
            <Button
              size="sm"
              onClick={handleSend}
              style={{ backgroundColor: primaryColor }}
              className="h-10 w-10 p-0 text-white"
            >
              <Send className="h-5 w-5" />
            </Button>
          )}
        </>
      ) : (
        <Button
          size="sm"
          onClick={stopRecording}
          variant="destructive"
          className="h-10 w-10 p-0"
        >
          <Square className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
