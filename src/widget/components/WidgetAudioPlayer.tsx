/**
 * WidgetAudioPlayer
 * 
 * Widget-native audio player with waveform visualization.
 * Replaces @/components/chat/AudioPlayer without motion/react dependencies.
 * 
 * @module widget/components/WidgetAudioPlayer
 */

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/lib/audio-recording';
import { PlayCircle, PauseCircle } from '@/widget/icons';
import { WidgetSpinner } from '@/widget/ui/WidgetSpinner';

/** Window interface extended with webkit AudioContext for Safari compatibility */
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

interface WidgetAudioPlayerProps {
  /** Audio source URL */
  audioUrl: string;
  /** Primary color for theming */
  primaryColor: string;
  /** Error callback */
  onError?: (error: Error) => void;
  /** Additional CSS classes */
  className?: string;
}

export const WidgetAudioPlayer: React.FC<WidgetAudioPlayerProps> = ({
  audioUrl,
  primaryColor,
  onError,
  className,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [frequencyData, setFrequencyData] = useState<number[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Generate waveform from audio data
  const generateWaveform = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      const tempContext = new (window.AudioContext || (window as WindowWithWebkit).webkitAudioContext!)();
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await tempContext.decodeAudioData(arrayBuffer);

      const rawData = audioBuffer.getChannelData(0);
      const samples = 100;
      const blockSize = Math.floor(rawData.length / samples);
      const filteredData: number[] = [];

      for (let i = 0; i < samples; i++) {
        const blockStart = blockSize * i;
        let sum = 0;
        for (let j = 0; j < blockSize; j++) {
          sum += Math.abs(rawData[blockStart + j]);
        }
        filteredData.push(sum / blockSize);
      }

      setWaveformData(filteredData);
      tempContext.close();
    } catch (error) {
      console.error('Error generating waveform:', error);
      onError?.(error instanceof Error ? error : new Error('Failed to generate waveform'));
    }
  }, [audioUrl, onError]);

  // Setup audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
      generateWaveform();
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      isPlayingRef.current = false;
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsLoading(false);
      onError?.(new Error('Failed to load audio'));
    };

    const handleCanPlay = () => {
      setIsLoading(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);

      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl, generateWaveform, onError]);

  // Setup audio analyser for frequency visualization
  const setupAudioAnalyser = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;

    try {
      audioContextRef.current = new (window.AudioContext || (window as WindowWithWebkit).webkitAudioContext!)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      analyserRef.current.smoothingTimeConstant = 0.8;

      sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceNodeRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } catch (error) {
      console.error('Error setting up audio analyser:', error);
    }
  }, []);

  // Analyze frequency data for visualization
  const analyzeFrequency = useCallback(() => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const bars = Array.from(dataArray.slice(0, 64)).map(value => value / 255);
    setFrequencyData(bars);

    if (isPlayingRef.current) {
      animationIdRef.current = requestAnimationFrame(analyzeFrequency);
    }
  }, []);

  // Start/stop frequency analysis based on play state
  useEffect(() => {
    if (isPlaying) {
      setupAudioAnalyser();
      analyzeFrequency();
    } else if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
  }, [isPlaying, setupAudioAnalyser, analyzeFrequency]);

  // Render canvas visualization
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (isPlaying && frequencyData.length > 0) {
      // Frequency visualization while playing
      const barCount = frequencyData.length;
      const barWidth = width / barCount;

      frequencyData.forEach((value, index) => {
        const barHeight = Math.max(3, value * height * 0.8);
        const x = index * barWidth;

        const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height);
        gradient.addColorStop(0, primaryColor);
        gradient.addColorStop(1, primaryColor + '80');

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);
      });
    } else if (waveformData.length > 0) {
      // Static waveform visualization
      const barWidth = width / waveformData.length;
      const progress = duration > 0 ? currentTime / duration : 0;

      waveformData.forEach((value, index) => {
        const barHeight = Math.max(2, value * height * 2);
        const x = index * barWidth;
        const isPast = index < waveformData.length * progress;

        // Use primary color for played portion, muted for unplayed
        ctx.fillStyle = isPast ? primaryColor : 'hsl(var(--muted-foreground) / 0.3)';
        ctx.fillRect(x, (height - barHeight) / 2, barWidth - 2, barHeight);
      });
    }
  }, [waveformData, frequencyData, currentTime, duration, primaryColor, isPlaying]);

  // Toggle play/pause
  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio || isLoading) return;

    if (isPlaying) {
      audio.pause();
      isPlayingRef.current = false;
      setIsPlaying(false);
    } else {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      isPlayingRef.current = true;
      audio.play();
      setIsPlaying(true);
    }
  };

  // Handle canvas click for seeking
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const audio = audioRef.current;
    const canvas = canvasRef.current;
    if (!audio || !canvas || duration === 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    audio.currentTime = percentage * duration;
    setCurrentTime(percentage * duration);
  };

  return (
    <div className={cn('flex items-center gap-2 max-w-[280px]', className)}>
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlayPause}
        disabled={isLoading}
        className={cn(
          'widget-audio-play-button',
          'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0',
          'text-white transition-all duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'hover:scale-105 active:scale-95',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          isPlaying && 'widget-audio-playing'
        )}
        style={{ backgroundColor: primaryColor }}
        aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
      >
        {isLoading ? (
          <WidgetSpinner size="sm" className="text-white" />
        ) : isPlaying ? (
          <PauseCircle size={20} className="relative z-10" />
        ) : (
          <PlayCircle size={20} className="ml-0.5 relative z-10" />
        )}
      </button>

      {/* Waveform and Time Display */}
      <div className="flex-1 flex flex-col gap-1">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={200}
            height={40}
            className="w-full h-[40px] rounded-sm cursor-pointer"
            onClick={handleCanvasClick}
            role="slider"
            aria-label="Audio progress"
            aria-valuemin={0}
            aria-valuemax={duration}
            aria-valuenow={currentTime}
          />
          {/* Glow effect while playing */}
          {isPlaying && (
            <div
              className="absolute -top-0.5 -bottom-0.5 left-0 right-0 pointer-events-none widget-audio-glow"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${primaryColor}15 50%, transparent 100%)`,
              }}
            />
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>
      </div>
    </div>
  );
};

export default WidgetAudioPlayer;
