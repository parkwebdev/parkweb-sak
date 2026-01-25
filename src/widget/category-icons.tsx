/**
 * Category Icons
 * 
 * Static icon imports for help center categories.
 * Uses direct imports since these icons are already in the widget bundle.
 * 
 * @module widget/category-icons
 */

import { memo } from 'react';

// Static imports - these are already bundled via other widget imports
import { BookOpen01 } from '@untitledui/icons/BookOpen01';
import { HelpCircle } from '@untitledui/icons/HelpCircle';
import { User01 } from '@untitledui/icons/User01';
import { CreditCard01 } from '@untitledui/icons/CreditCard01';
import { Settings01 } from '@untitledui/icons/Settings01';
import { Mail01 } from '@untitledui/icons/Mail01';
import { Phone01 } from '@untitledui/icons/Phone01';
import { Shield01 } from '@untitledui/icons/Shield01';
import { Rocket01 } from '@untitledui/icons/Rocket01';
import { Star01 } from '@untitledui/icons/Star01';
import { Tool01 } from '@untitledui/icons/Tool01';
import { Lightbulb01 } from '@untitledui/icons/Lightbulb01';
import { File06 } from '@untitledui/icons/File06';
import { Home01 } from '@untitledui/icons/Home01';
import { ShoppingBag01 } from '@untitledui/icons/ShoppingBag01';
import { Calendar } from '@untitledui/icons/Calendar';
import { Globe01 } from '@untitledui/icons/Globe01';
import { DownloadCloud01 } from '@untitledui/icons/DownloadCloud01';
import { Link01 } from '@untitledui/icons/Link01';
import { PlayCircle } from '@untitledui/icons/PlayCircle';
import { Gift01 } from '@untitledui/icons/Gift01';
import { Truck01 } from '@untitledui/icons/Truck01';
import { Clock } from '@untitledui/icons/Clock';
import { MessageChatCircle } from '@untitledui/icons/MessageChatCircle';
import { Building07 } from '@untitledui/icons/Building07';
import { Heart } from '@untitledui/icons/Heart';
import { Zap } from '@untitledui/icons/Zap';
import { Wallet01 } from '@untitledui/icons/Wallet01';
import { Users01 } from '@untitledui/icons/Users01';
import { Trophy01 } from '@untitledui/icons/Trophy01';
import { GraduationHat01 } from '@untitledui/icons/GraduationHat01';
import { MedicalCross } from '@untitledui/icons/MedicalCross';
import { Map01 } from '@untitledui/icons/Map01';
import { Package } from '@untitledui/icons/Package';
import { Camera01 } from '@untitledui/icons/Camera01';
import { Target01 } from '@untitledui/icons/Target01';
import { Briefcase01 } from '@untitledui/icons/Briefcase01';

// Icon name to component mapping
const iconComponents: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  book: BookOpen01,
  help: HelpCircle,
  user: User01,
  billing: CreditCard01,
  settings: Settings01,
  email: Mail01,
  phone: Phone01,
  security: Shield01,
  rocket: Rocket01,
  star: Star01,
  tools: Tool01,
  idea: Lightbulb01,
  docs: File06,
  home: Home01,
  shop: ShoppingBag01,
  calendar: Calendar,
  globe: Globe01,
  download: DownloadCloud01,
  link: Link01,
  video: PlayCircle,
  gift: Gift01,
  shipping: Truck01,
  clock: Clock,
  chat: MessageChatCircle,
  company: Building07,
  heart: Heart,
  zap: Zap,
  wallet: Wallet01,
  team: Users01,
  trophy: Trophy01,
  education: GraduationHat01,
  medical: MedicalCross,
  map: Map01,
  package: Package,
  camera: Camera01,
  target: Target01,
  briefcase: Briefcase01,
};

export type CategoryIconName = keyof typeof iconComponents;

interface CategoryIconProps {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Category icon component.
 * Renders the appropriate icon based on name.
 */
export const CategoryIcon = memo(({ name = 'book', className, style }: CategoryIconProps) => {
  const Icon = iconComponents[name] || iconComponents.book;
  return <Icon className={className} style={style} />;
});

CategoryIcon.displayName = 'CategoryIcon';

// Export icon options for admin UI (still needed for category configuration)
export const CATEGORY_ICON_OPTIONS: Array<{ value: CategoryIconName; label: string }> = [
  { value: 'book', label: 'Getting Started' },
  { value: 'help', label: 'Help & FAQ' },
  { value: 'user', label: 'Account' },
  { value: 'billing', label: 'Billing' },
  { value: 'settings', label: 'Settings' },
  { value: 'email', label: 'Contact' },
  { value: 'phone', label: 'Support' },
  { value: 'security', label: 'Security' },
  { value: 'rocket', label: 'Features' },
  { value: 'star', label: 'Highlights' },
  { value: 'tools', label: 'Tools' },
  { value: 'idea', label: 'Tips' },
  { value: 'docs', label: 'Documentation' },
  { value: 'home', label: 'General' },
  { value: 'shop', label: 'Shopping' },
  { value: 'calendar', label: 'Scheduling' },
  { value: 'globe', label: 'International' },
  { value: 'download', label: 'Downloads' },
  { value: 'link', label: 'Integrations' },
  { value: 'video', label: 'Tutorials' },
  { value: 'gift', label: 'Promotions' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'clock', label: 'Hours' },
  { value: 'chat', label: 'Messaging' },
  { value: 'company', label: 'Company' },
  { value: 'heart', label: 'Favorites / Pets' },
  { value: 'zap', label: 'Quick Actions' },
  { value: 'wallet', label: 'Payments' },
  { value: 'team', label: 'Team / Community' },
  { value: 'trophy', label: 'Rewards' },
  { value: 'education', label: 'Learning' },
  { value: 'medical', label: 'Health / Medical' },
  { value: 'map', label: 'Locations' },
  { value: 'package', label: 'Orders' },
  { value: 'camera', label: 'Photos' },
  { value: 'target', label: 'Goals' },
  { value: 'briefcase', label: 'Business' },
];
