/**
 * Edge Components Index
 * 
 * Exports all custom edge types for the automation flow editor.
 * 
 * @module components/automations/edges
 */

import { ConditionalEdge } from './ConditionalEdge';

export { ConditionalEdge };

/**
 * Edge types mapping for React Flow.
 * Register custom edge types here.
 */
export const edgeTypes = {
  conditional: ConditionalEdge,
} as const;
