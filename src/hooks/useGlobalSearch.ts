/**
 * Hook for managing global search dialog state.
 * Re-exports from GlobalSearchContext for backwards compatibility.
 * 
 * @returns {Object} Search dialog state
 * @returns {boolean} open - Whether search dialog is open
 * @returns {Function} setOpen - Toggle search dialog
 */
export { useGlobalSearch } from '@/contexts/GlobalSearchContext';