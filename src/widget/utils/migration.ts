/**
 * LocalStorage Migration Utility
 * 
 * Migrates chatpad_* localStorage keys to pilot_* keys for existing users.
 * Runs once per browser and preserves all existing user data during rebrand.
 * 
 * @module widget/utils/migration
 */

const MIGRATION_KEY = 'pilot_migration_v1';

/**
 * Key prefix mappings from old ChatPad branding to new Pilot branding
 */
const KEY_PREFIX_MAPPINGS = [
  { old: 'chatpad_session_id', new: 'pilot_session_id' },
  { old: 'chatpad_user_', new: 'pilot_user_' },
  { old: 'chatpad_visitor_id_', new: 'pilot_visitor_id_' },
  { old: 'chatpad_last_read_', new: 'pilot_last_read_' },
  { old: 'chatpad_sound_enabled_', new: 'pilot_sound_enabled_' },
  { old: 'chatpad_referrer_journey_', new: 'pilot_referrer_journey_' },
  { old: 'chatpad_page_visits_', new: 'pilot_page_visits_' },
  { old: 'chatpad_location_', new: 'pilot_location_' },
  { old: 'chatpad_takeover_noticed_', new: 'pilot_takeover_noticed_' },
];

/**
 * Migrates all chatpad_* localStorage keys to pilot_* keys.
 * Only runs once - subsequent calls are no-ops.
 * 
 * @example
 * ```ts
 * // Call at widget initialization
 * migrateLocalStorage();
 * ```
 */
export function migrateLocalStorage(): void {
  // Skip if already migrated
  if (localStorage.getItem(MIGRATION_KEY)) return;
  
  try {
    const allKeys = Object.keys(localStorage);
    let migratedCount = 0;
    
    for (const key of allKeys) {
      for (const mapping of KEY_PREFIX_MAPPINGS) {
        if (key.startsWith(mapping.old)) {
          const newKey = key.replace(mapping.old, mapping.new);
          const value = localStorage.getItem(key);
          if (value !== null) {
            localStorage.setItem(newKey, value);
            localStorage.removeItem(key);
            migratedCount++;
          }
          break; // Found matching prefix, no need to check others
        }
      }
    }
    
    // Mark migration complete
    localStorage.setItem(MIGRATION_KEY, Date.now().toString());
    
    if (migratedCount > 0) {
      console.info(`[Pilot] Migrated ${migratedCount} localStorage keys`);
    }
  } catch (e) {
    console.warn('[Pilot] localStorage migration failed:', e);
  }
}
