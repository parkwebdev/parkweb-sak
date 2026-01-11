/**
 * Navigation Icon Mapping
 * 
 * Centralized icon mapping from route config iconName to actual components.
 * Used by Sidebar and page TopBar components for consistency.
 * 
 * @module lib/navigation-icons
 */

import type { ComponentType } from 'react';
import { Settings04 as Settings, Grid01 as Grid, User03, PieChart01, Calendar, Circle, BookOpen01 } from '@untitledui/icons';
import AriAgentsIcon from '@/components/icons/AriAgentsIcon';
import { DashboardIcon, DashboardIconFilled } from '@/components/icons/DashboardIcon';
import { InboxOutline, InboxFilled, PlannerFilled, LeadsFilled, AnalyticsFilled, SettingsFilled, KnowledgeBaseFilled } from '@/components/icons/SidebarIcons';

type IconComponent = ComponentType<{ size?: number; className?: string }>;

/** Icon mapping from route config iconName to component */
export const NAVIGATION_ICON_MAP: Record<string, IconComponent> = {
  Dashboard: DashboardIcon,
  AriLogo: AriAgentsIcon,
  MessageChatSquare: InboxOutline,
  Calendar: Calendar,
  Users01: User03,
  TrendUp01: PieChart01,
  Circle: Circle,
  Settings01: Settings,
  BookOpen01: BookOpen01,
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
};

/** Get icon component from iconName, with fallback */
export function getNavigationIcon(iconName: string | undefined): IconComponent {
  return NAVIGATION_ICON_MAP[iconName ?? ''] ?? Grid;
}

/** Get active (filled) icon component from iconName */
export function getActiveNavigationIcon(iconName: string | undefined): IconComponent | undefined {
  return ACTIVE_ICON_MAP[iconName ?? ''];
}
