import { 
  BookOpen01, 
  HelpCircle, 
  User01, 
  CreditCard01, 
  Settings01, 
  Mail01, 
  Phone01, 
  Shield01, 
  Rocket01, 
  Star01,
  Tool01,
  Lightbulb01,
  File06,
  Home01,
  ShoppingBag01
} from '@untitledui/icons';

// Curated set of 15 icons that cover 99% of use cases
export const CATEGORY_ICONS = {
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
} as const;

export type CategoryIconName = keyof typeof CATEGORY_ICONS;

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
];

interface CategoryIconProps {
  name?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const CategoryIcon = ({ name = 'book', className, style }: CategoryIconProps) => {
  const IconComponent = CATEGORY_ICONS[name as CategoryIconName] || CATEGORY_ICONS.book;
  return <IconComponent className={className} style={style} />;
};
