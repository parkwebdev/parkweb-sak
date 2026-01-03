import React from 'react';

interface StageProgressIconProps {
  stageIndex: number;
  totalStages: number;
  color: string;
  size?: number;
}

export function StageProgressIcon({ 
  stageIndex, 
  totalStages, 
  color, 
  size = 16 
}: StageProgressIconProps) {
  const center = size / 2;
  const radius = (size / 2) - 2;
  const circumference = 2 * Math.PI * radius;
  
  // First stage (index 0) = dashed empty circle
  if (stageIndex === 0) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          strokeDasharray="2 2"
        />
      </svg>
    );
  }
  
  // Calculate fill percentage based on stage position
  // Stage 1 = 25%, Stage 2 = 50%, etc., last stage = 100%
  const fillPercentage = stageIndex / (totalStages - 1);
  const dashOffset = circumference * (1 - fillPercentage);
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.25}
      />
      {/* Progress arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        style={{ 
          transform: 'rotate(-90deg)', 
          transformOrigin: 'center' 
        }}
      />
    </svg>
  );
}
