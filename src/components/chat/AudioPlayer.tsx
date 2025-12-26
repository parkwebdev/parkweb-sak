import { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle as Play, PauseCircle as Pause } from '@untitledui/icons';
import { formatDuration } from '@/lib/audio-recording';
import { logger } from '@/utils/logger';

/** Window interface extended with webkit AudioContext for Safari compatibility */
interface WindowWithWebkit extends Window {
  webkitAudioContext?: typeof AudioContext;
}

interface AudioPlayerProps {
  audioUrl: string;
  primaryColor: string;
}

export function AudioPlayer({ audioUrl, primaryColor }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
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

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
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

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioUrl]);

  const setupAudioAnalyser = () => {
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
      logger.error('Error setting up audio analyser:', error);
    }
  };

  const generateWaveform = async () => {
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
      logger.error('Error generating waveform:', error);
    }
  };

  const analyzeFrequency = () => {
    if (!analyserRef.current) return;

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const bars = Array.from(dataArray.slice(0, 64)).map(value => value / 255);
    setFrequencyData(bars);

    if (isPlayingRef.current) {
      animationIdRef.current = requestAnimationFrame(analyzeFrequency);
    }
  };

  useEffect(() => {
    if (isPlaying) {
      setupAudioAnalyser();
      analyzeFrequency();
    } else if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    if (isPlaying && frequencyData.length > 0) {
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
      const barWidth = width / waveformData.length;
      const progress = duration > 0 ? currentTime / duration : 0;

      // Use CSS variable for muted waveform color (matches design system)
      const mutedColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--muted')
        .trim();
      const waveformMutedColor = mutedColor ? `hsl(${mutedColor})` : 'hsl(220 14.3% 95.9%)';
      
      waveformData.forEach((value, index) => {
        const barHeight = Math.max(2, value * height * 2);
        const x = index * barWidth;
        const isPast = index < waveformData.length * progress;

        ctx.fillStyle = isPast ? primaryColor : waveformMutedColor;
        ctx.fillRect(x, (height - barHeight) / 2, barWidth - 2, barHeight);
      });
    }
  }, [waveformData, frequencyData, currentTime, duration, primaryColor, isPlaying]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

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

  return (
    <div className="flex items-center gap-2 max-w-[280px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="transition-transform duration-150 hover:scale-105 active:scale-95">
        <Button
          size="sm"
          onClick={togglePlayPause}
          style={{ backgroundColor: primaryColor }}
          className="h-10 w-10 p-0 text-white flex-shrink-0 relative overflow-hidden"
        >
          {isPlaying && (
            <div className="absolute inset-0 bg-white/20 animate-audio-pulse" />
          )}
          {isPlaying ? (
            <Pause className="h-5 w-5 relative z-10" />
          ) : (
            <Play className="h-5 w-5 ml-0.5 relative z-10" />
          )}
        </Button>
      </div>

      <div className="flex-1 flex flex-col gap-1">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={200}
            height={40}
            className="w-full h-[40px] rounded-sm"
          />
          {isPlaying && (
            <div
              className="absolute -top-0.5 -bottom-0.5 left-0 right-0 pointer-events-none animate-audio-glow"
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
