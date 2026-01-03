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
  size = 14 
}: StageProgressIconProps) {
  const center = size / 2;
  const radius = (size / 2) - 1;
  
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
  
  // Last stage = fully filled circle
  if (stageIndex === totalStages - 1) {
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill={color}
        />
      </svg>
    );
  }
  
  // Middle stages: filled pie chart
  // Calculate fill percentage based on stage position
  const fillPercentage = stageIndex / (totalStages - 1);
  const angle = fillPercentage * 360;
  
  // Convert angle to radians and calculate arc endpoint
  // Start from top (12 o'clock position) and go clockwise
  const startAngle = -90; // Start from top
  const endAngle = startAngle + angle;
  const endAngleRad = (endAngle * Math.PI) / 180;
  
  const x = center + radius * Math.cos(endAngleRad);
  const y = center + radius * Math.sin(endAngleRad);
  
  // Large arc flag: 1 if angle > 180, else 0
  const largeArcFlag = angle > 180 ? 1 : 0;
  
  // Create pie slice path: move to center, line to top, arc to end, close
  const pathD = [
    `M ${center} ${center}`, // Move to center
    `L ${center} ${center - radius}`, // Line to top
    `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x} ${y}`, // Arc clockwise
    'Z' // Close path back to center
  ].join(' ');
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle outline */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        opacity={0.4}
      />
      {/* Filled pie segment */}
      <path
        d={pathD}
        fill={color}
      />
    </svg>
  );
}
