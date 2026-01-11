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
} from '@untitledui/icons';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { DashboardIcon, DashboardIconFilled } from '@/components/icons/DashboardIcon';
import { InboxOutline, InboxFilled, PlannerFilled, LeadsFilled, AnalyticsFilled, SettingsFilled, KnowledgeBaseFilled } from '@/components/icons/SidebarIcons';
import * as AriMenuIcons from '@/components/icons/AriMenuIcons';

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
  BookOpen01: KnowledgeBaseFilled,
  
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

/** Get icon component from iconName, with fallback */
export function getNavigationIcon(iconName: string | undefined): IconComponent {
  return NAVIGATION_ICON_MAP[iconName ?? ''] ?? Grid;
}

/** Get active (filled) icon component from iconName */
export function getActiveNavigationIcon(iconName: string | undefined): IconComponent | undefined {
  return ACTIVE_ICON_MAP[iconName ?? ''];
}
