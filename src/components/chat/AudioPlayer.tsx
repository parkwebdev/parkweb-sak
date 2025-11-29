import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle as Play, PauseCircle as Pause } from '@untitledui/icons';
import { formatDuration } from '@/lib/audio-recording';

interface AudioPlayerProps {
  audioUrl: string;
  primaryColor: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ audioUrl, primaryColor }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationIdRef = useRef<number | null>(null);

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

  const generateWaveform = async () => {
    if (!audioRef.current) return;

    try {
      audioContextRef.current = new AudioContext();
      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);

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
    } catch (error) {
      console.error('Error generating waveform:', error);
    }
  };

  useEffect(() => {
    if (!canvasRef.current || waveformData.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const barWidth = width / waveformData.length;
    const progress = duration > 0 ? currentTime / duration : 0;

    ctx.clearRect(0, 0, width, height);

    waveformData.forEach((value, index) => {
      const barHeight = Math.max(2, value * height * 2);
      const x = index * barWidth;
      const isPast = index < waveformData.length * progress;

      ctx.fillStyle = isPast ? primaryColor : '#e5e7eb';
      ctx.fillRect(x, (height - barHeight) / 2, barWidth - 2, barHeight);
    });
  }, [waveformData, currentTime, duration, primaryColor]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="flex items-center gap-2 max-w-[280px]">
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <Button
        size="sm"
        onClick={togglePlayPause}
        style={{ backgroundColor: primaryColor }}
        className="h-10 w-10 p-0 text-white flex-shrink-0"
      >
        {isPlaying ? (
          <Pause className="h-5 w-5" />
        ) : (
          <Play className="h-5 w-5 ml-0.5" />
        )}
      </Button>

      <div className="flex-1 flex flex-col gap-1">
        <canvas
          ref={canvasRef}
          width={200}
          height={40}
          className="w-full h-[40px]"
        />
        <span className="text-xs text-muted-foreground">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>
      </div>
    </div>
  );
};
