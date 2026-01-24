/**
 * Hook for managing admin global search dialog state.
 * 
 * @deprecated Use useUnifiedSearch from @/contexts/UnifiedSearchContext directly.
 * This re-export is kept for backwards compatibility.
 * 
 * @returns {Object} Search dialog state
 * @returns {boolean} open - Whether search dialog is open
 * @returns {Function} setOpen - Toggle search dialog
 * @returns {boolean} isAdminMode - Whether in admin mode
 */
export { useUnifiedSearch as useAdminGlobalSearch } from '@/contexts/UnifiedSearchContext';
