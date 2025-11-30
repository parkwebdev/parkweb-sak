import * as React from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Microphone01 as Mic, Square } from "@untitledui/icons";

interface VoiceInputProps extends React.HTMLAttributes<HTMLDivElement> {
  onRecordingComplete: (audioBlob: Blob) => void;
  onCancel?: () => void;
  className?: string;
}

export function VoiceInput({
  onRecordingComplete,
  onCancel,
  className,
  ...props
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [duration, setDuration] = React.useState(0);
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const durationIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        onRecordingComplete(blob);
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setDuration(0);
      };

      mediaRecorder.start();
      setIsRecording(true);

      // Start duration counter
      durationIntervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      setIsRecording(false);
      setDuration(0);
      onCancel?.();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  React.useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, [isRecording]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border bg-background p-3",
        className
      )}
      {...props}
    >
      {!isRecording ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={startRecording}
          className="h-10 w-10 rounded-full"
        >
          <Mic className="h-5 w-5" />
          <span className="sr-only">Start recording</span>
        </Button>
      ) : (
        <>
          <div className="flex flex-1 items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 animate-pulse rounded-full bg-destructive" />
              <span className="text-sm font-medium text-foreground">
                {formatDuration(duration)}
              </span>
            </div>
            <div className="flex-1">
              <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${Math.min((duration / 60) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={cancelRecording}
              className="h-10 w-10 rounded-full"
            >
              <span className="text-lg">✕</span>
              <span className="sr-only">Cancel recording</span>
            </Button>
            <Button
              type="button"
              variant="default"
              size="icon"
              onClick={stopRecording}
              className="h-10 w-10 rounded-full"
            >
              <Square className="h-4 w-4" />
              <span className="sr-only">Stop and send recording</span>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
