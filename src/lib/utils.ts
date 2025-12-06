/**
 * Core Utility Functions
 * 
 * Provides fundamental utilities used throughout the application.
 * @module lib/utils
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges class names using clsx and tailwind-merge for optimized Tailwind CSS class handling.
 * Combines conditional class logic with Tailwind's conflict resolution.
 * 
 * @param inputs - Class values to merge (strings, objects, arrays, or conditionals)
 * @returns Merged and deduplicated class string
 * 
 * @example
 * // Basic usage
 * cn('px-4 py-2', 'bg-primary')
 * // => 'px-4 py-2 bg-primary'
 * 
 * @example
 * // With conditionals
 * cn('base-class', isActive && 'active-class', { 'error': hasError })
 * // => 'base-class active-class' (if isActive is true)
 * 
 * @example
 * // Tailwind conflict resolution
 * cn('px-4', 'px-6')
 * // => 'px-6' (later value wins)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
