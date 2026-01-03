/**
 * @fileoverview Configuration for Kanban card field visibility.
 * Defines which fields can be shown/hidden on lead cards.
 */

import { 
  User01, 
  Users01,
  Mail01, 
  Phone, 
  MarkerPin01, 
  Globe01, 
  Flag01, 
  Tag01, 
  Calendar, 
  Clock, 
  Edit05
} from "@untitledui/icons";

/** Available field keys for Kanban card display */
export type CardFieldKey = 
  | 'firstName' 
  | 'lastName' 
  | 'email' 
  | 'phone' 
  | 'location' 
  | 'entryPage' 
  | 'priority' 
  | 'tags' 
  | 'createdAt' 
  | 'lastUpdated' 
  | 'notes'
  | 'assignee';

/** Field group for organizing in dropdown */
export type FieldGroup = 'contact' | 'session' | 'organization' | 'timestamps' | 'notes';

/** Configuration for a single card field */
export interface CardFieldConfig {
  key: CardFieldKey;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  defaultVisible: boolean;
  group: FieldGroup;
}

/** Group labels for the dropdown */
export const FIELD_GROUP_LABELS: Record<FieldGroup, string> = {
  contact: 'Contact Info',
  session: 'Session Details',
  organization: 'Organization',
  timestamps: 'Timestamps',
  notes: 'Notes',
};

/** All available card fields with their configuration */
export const CARD_FIELDS: CardFieldConfig[] = [
  // Contact Info
  { key: 'firstName', label: 'First Name', icon: User01, defaultVisible: true, group: 'contact' },
  { key: 'lastName', label: 'Last Name', icon: User01, defaultVisible: false, group: 'contact' },
  { key: 'email', label: 'Email', icon: Mail01, defaultVisible: true, group: 'contact' },
  { key: 'phone', label: 'Phone', icon: Phone, defaultVisible: true, group: 'contact' },
  
  // Session Details
  { key: 'location', label: 'Location', icon: MarkerPin01, defaultVisible: false, group: 'session' },
  { key: 'entryPage', label: 'Entry Page', icon: Globe01, defaultVisible: false, group: 'session' },
  
  // Organization
  { key: 'priority', label: 'Priority', icon: Flag01, defaultVisible: true, group: 'organization' },
  { key: 'tags', label: 'Tags', icon: Tag01, defaultVisible: true, group: 'organization' },
  { key: 'assignee', label: 'Assignee', icon: Users01, defaultVisible: true, group: 'organization' },
  
  // Timestamps
  { key: 'createdAt', label: 'Created', icon: Calendar, defaultVisible: false, group: 'timestamps' },
  { key: 'lastUpdated', label: 'Last Updated', icon: Clock, defaultVisible: false, group: 'timestamps' },
  
  // Notes
  { key: 'notes', label: 'Internal Notes', icon: Edit05, defaultVisible: false, group: 'notes' },
];

/** Get fields grouped by their group */
export const getFieldsByGroup = (): Record<FieldGroup, CardFieldConfig[]> => {
  return CARD_FIELDS.reduce((acc, field) => {
    if (!acc[field.group]) {
      acc[field.group] = [];
    }
    acc[field.group].push(field);
    return acc;
  }, {} as Record<FieldGroup, CardFieldConfig[]>);
};

/** Get default visible fields */
export const getDefaultVisibleFields = (): Set<CardFieldKey> => {
  return new Set(CARD_FIELDS.filter(f => f.defaultVisible).map(f => f.key));
};

/** LocalStorage key for persisting field visibility */
export const KANBAN_FIELDS_STORAGE_KEY = 'kanban-card-fields';
