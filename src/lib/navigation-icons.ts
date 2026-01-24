/**
 * Navigation Icon Mapping
 * 
 * Centralized icon mapping from route config iconName to actual components.
 * Used by Sidebar, GlobalSearch, and page TopBar components for consistency.
 * Single source of truth for icon resolution across the application.
 * 
 * @module lib/navigation-icons
 */

import type { ComponentType } from 'react';
import { 
  Settings04 as Settings, 
  Grid01 as Grid, 
  User03, 
  User01,
  Users02,
  PieChart01, 
  Calendar, 
  Circle, 
  BookOpen01,
  Database01,
  Announcement01,
  File02,
  File06,
  Key01,
  FolderClosed,
  Palette,
  MessageTextSquare01,
  MarkerPin01,
  Terminal as TerminalIcon,
  // Analytics section icons
  MessageChatCircle,
  Zap,
  Share07,
  Globe01,
  BarChart01,
  // Admin section icons
  LayoutAlt01,
  CreditCard01,
  Mail01,
  TrendUp01,
  LineChartUp03,
  ClipboardCheck,
  Shield01,
  TypeSquare,
} from '@untitledui/icons';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { DashboardIcon, DashboardIconFilled } from '@/components/icons/DashboardIcon';
import { InboxOutline, InboxFilled, PlannerFilled, LeadsFilled, AnalyticsFilled, SettingsFilled, HelpCenterFilled } from '@/components/icons/SidebarIcons';
import * as AriMenuIcons from '@/components/icons/AriMenuIcons';
import { 
  OverviewFilled as AdminOverviewFilled,
  AccountsFilled as AdminAccountsFilled,
  TextInputFilled as AdminTextInputFilled,
  PilotTeamFilled as AdminPilotTeamFilled,
  MailFilled as AdminMailFilled,
  TrendUpFilled as AdminTrendUpFilled,
  ClipboardCheckFilled as AdminClipboardCheckFilled,
} from '@/components/icons/AdminSidebarIcons';
import { CreditCardIconFilled as AdminCreditCardFilled } from '@/components/ui/settings-icon';
import { BookOpenFilled as AdminBookOpenFilled } from '@/components/icons/AriMenuIcons';
type IconComponent = ComponentType<{ size?: number; className?: string }>;

/** Icon mapping from route config iconName to component - Single source of truth */
export const NAVIGATION_ICON_MAP: Record<string, IconComponent> = {
  // Main sidebar navigation icons
  Dashboard: DashboardIcon,
  AriLogo: AriAgentsIcon,
  MessageChatSquare: InboxOutline,
  Calendar: Calendar,
  Users01: User03,
  TrendUp01: PieChart01,
  Circle: Circle,
  Settings01: Settings,
  BookOpen01: BookOpen01,
  
  // Team/Group icons
  UserGroup: Users02,
  
  // Ari section icons - AI Configuration
  File02: File02,
  
  // Ari section icons - Widget
  Palette: Palette,
  MessageTextSquare01: MessageTextSquare01,
  User01: User01,
  
  // Ari section icons - Knowledge
  Database01: Database01,
  MarkerPin01: MarkerPin01,
  
  // Ari section icons - Content
  Announcement01: Announcement01,
  File06: File06,
  
  // Ari section icons - Tools
  CodeBrowser: AriMenuIcons.CodeBrowser,
  Webhook: AriMenuIcons.Webhook,
  DataFlow: AriMenuIcons.DataFlow,
  Key01: Key01,
  Terminal: TerminalIcon,
  
  // Analytics section icons
  MessageChatCircle: MessageChatCircle,
  Zap: Zap,
  Share07: Share07,
  Globe01: Globe01,
  BarChart01: BarChart01,
  
  // Utility icons
  FolderClosed: FolderClosed,
};

/** Active icon mapping from route config iconName to filled component */
export const ACTIVE_ICON_MAP: Record<string, IconComponent | undefined> = {
  Dashboard: DashboardIconFilled,
  MessageChatSquare: InboxFilled,
  Calendar: PlannerFilled,
  Users01: LeadsFilled,
  TrendUp01: AnalyticsFilled,
  Settings01: SettingsFilled,
  BookOpen01: HelpCenterFilled,
  
  // Ari section filled icons
  File02: AriMenuIcons.FileFilled,
  Palette: AriMenuIcons.PaletteFilled,
  MessageTextSquare01: AriMenuIcons.MessageSquareFilled,
  User01: AriMenuIcons.UserFilled,
  Database01: AriMenuIcons.DatabaseFilled,
  MarkerPin01: AriMenuIcons.MarkerPinFilled,
  Announcement01: AriMenuIcons.AnnouncementFilled,
  File06: AriMenuIcons.NewsFilled,
  CodeBrowser: AriMenuIcons.CodeBrowserFilled,
  Webhook: AriMenuIcons.WebhookFilled,
  DataFlow: AriMenuIcons.DataFlowFilled,
  Key01: AriMenuIcons.KeyFilled,
  Terminal: AriMenuIcons.TerminalFilled,
};

/** Admin sidebar icon mapping from ADMIN_SECTIONS iconName to component */
export const ADMIN_ICON_MAP: Record<string, IconComponent> = {
  LayoutAlt01: LayoutAlt01,
  Users01: User03,
  TypeSquare: TypeSquare,
  CreditCard01: CreditCard01,
  UserGroup: Users02,
  BookOpen01: BookOpen01,
  Mail01: Mail01,
  TrendUp01: LineChartUp03,
  ClipboardCheck: ClipboardCheck,
  Shield01: Shield01,
};

/** Admin sidebar active (filled) icon mapping from ADMIN_SECTIONS iconName to component */
export const ADMIN_ACTIVE_ICON_MAP: Record<string, IconComponent> = {
  LayoutAlt01: AdminOverviewFilled,
  Users01: AdminAccountsFilled,
  TypeSquare: AdminTextInputFilled,
  CreditCard01: AdminCreditCardFilled,
  UserGroup: AdminPilotTeamFilled,
  BookOpen01: AdminBookOpenFilled,
  Mail01: AdminMailFilled,
  TrendUp01: AdminTrendUpFilled,
  ClipboardCheck: AdminClipboardCheckFilled,
};

/** Get icon component from iconName, with fallback */
export function getNavigationIcon(iconName: string | undefined): IconComponent {
  return NAVIGATION_ICON_MAP[iconName ?? ''] ?? Grid;
}

/** Get active (filled) icon component from iconName */
export function getActiveNavigationIcon(iconName: string | undefined): IconComponent | undefined {
  return ACTIVE_ICON_MAP[iconName ?? ''];
}
