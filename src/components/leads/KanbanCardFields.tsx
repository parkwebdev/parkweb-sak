/**
 * @fileoverview Configuration for Kanban card field visibility.
 * Defines which fields can be shown/hidden on lead cards.
 */

import { Mail01, Phone, Building02, Calendar, MessageChatCircle } from "@untitledui/icons";

/** Available field keys for Kanban card display */
export type CardFieldKey = 'email' | 'phone' | 'company' | 'createdAt' | 'conversation';

/** Configuration for a single card field */
export interface CardFieldConfig {
  key: CardFieldKey;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  defaultVisible: boolean;
}

/** All available card fields with their configuration */
export const CARD_FIELDS: CardFieldConfig[] = [
  { key: 'email', label: 'Email', icon: Mail01, defaultVisible: true },
  { key: 'phone', label: 'Phone', icon: Phone, defaultVisible: true },
  { key: 'company', label: 'Company', icon: Building02, defaultVisible: true },
  { key: 'createdAt', label: 'Created Date', icon: Calendar, defaultVisible: true },
  { key: 'conversation', label: 'Has Conversation', icon: MessageChatCircle, defaultVisible: false },
];

/** Get default visible fields */
export const getDefaultVisibleFields = (): Set<CardFieldKey> => {
  return new Set(CARD_FIELDS.filter(f => f.defaultVisible).map(f => f.key));
};

/** LocalStorage key for persisting field visibility */
export const KANBAN_FIELDS_STORAGE_KEY = 'kanban-card-fields';
