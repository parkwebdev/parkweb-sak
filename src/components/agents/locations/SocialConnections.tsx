/**
 * SocialConnections Component
 * 
 * Displays social account connection options for a location.
 * Shows Facebook, Instagram, and X (Twitter) with coming soon status.
 * 
 * @module components/agents/locations/SocialConnections
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Facebook, Instagram } from '@ridemountainpig/svgl-react';

// X Logo component
const XLogo = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 1200 1227" fill="none">
    <path 
      fill="currentColor" 
      d="M714.163 519.284 1160.89 0h-105.86L667.137 450.887 357.328 0H0l468.492 681.821L0 1226.37h105.866l409.625-476.152 327.181 476.152H1200L714.137 519.284h.026ZM569.165 687.828l-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721H892.476L569.165 687.854v-.026Z"
    />
  </svg>
);

interface SocialConnectionsProps {
  locationId: string;
  agentId: string;
}

interface SocialPlatform {
  id: string;
  name: string;
  icon: React.ReactNode;
  comingSoon: boolean;
}

const socialPlatforms: SocialPlatform[] = [
  {
    id: 'facebook',
    name: 'Facebook',
    icon: <Facebook className="h-4 w-4" />,
    comingSoon: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    icon: <Instagram className="h-4 w-4" />,
    comingSoon: true,
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    icon: <XLogo className="h-3.5 w-3.5" />,
    comingSoon: true,
  },
];

export function SocialConnections({ locationId, agentId }: SocialConnectionsProps) {
  return (
    <div className="space-y-4">
      {/* Connect Buttons */}
      <div className="flex flex-wrap gap-2">
        {socialPlatforms.map((platform) => (
          <Button
            key={platform.id}
            variant="outline"
            size="sm"
            disabled={platform.comingSoon}
            className="gap-2"
          >
            {platform.icon}
            {platform.name}
            {platform.comingSoon && (
              <Badge variant="secondary" size="sm" className="ml-1">
                Soon
              </Badge>
            )}
          </Button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        Connect social accounts to manage messages from Facebook, Instagram, and X.
      </p>
    </div>
  );
}
