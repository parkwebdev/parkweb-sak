/**
 * Type Definitions Index
 * 
 * Central export point for all shared type definitions.
 * Import from this module to access metadata types, error utilities,
 * team types, and webhook configurations.
 * 
 * @module types
 * 
 * @example
 * ```typescript
 * // Import specific types
 * import { 
 *   ConversationMetadata, 
 *   MessageMetadata,
 *   AgentDeploymentConfig 
 * } from '@/types';
 * 
 * // Use with Supabase data
 * const metadata = conversation.metadata as ConversationMetadata;
 * const leadName = metadata.lead_name ?? 'Anonymous';
 * 
 * // Type-safe message handling
 * const msgMeta = message.metadata as MessageMetadata;
 * const reactions = msgMeta.reactions ?? [];
 * ```
 * 
 * @example
 * ```typescript
 * // Error handling utilities
 * import { getErrorMessage, isAppError } from '@/types';
 * 
 * try {
 *   await someOperation();
 * } catch (error) {
 *   console.error(getErrorMessage(error));
 * }
 * ```
 */

export * from './metadata';
export * from './webhooks';
export * from './errors';
export * from './team';
export * from './report';
