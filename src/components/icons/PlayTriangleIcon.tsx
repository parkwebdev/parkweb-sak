interface PlayTriangleIconProps {
  size?: number;
  className?: string;
}

export function PlayTriangleIcon({ 
  size = 24, 
  className 
}: PlayTriangleIconProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M8 5.14v13.72c0 .94 1.04 1.52 1.84 1.02l10.16-6.86c.7-.48.7-1.58 0-2.04L9.84 4.12C9.04 3.62 8 4.2 8 5.14z"
        fill="currentColor"
      />
    </svg>
  );
}
