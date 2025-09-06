import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface ClientAvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ClientAvatar: React.FC<ClientAvatarProps> = ({ 
  name, 
  src,
  size = 'sm' 
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base'
  };

  return (
    <Avatar className={sizeClasses[size]}>
      <AvatarImage src={src} alt={name} />
      <AvatarFallback className="font-medium">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
};