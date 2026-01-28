# WordPress Data Integration - COMPLETED

## Status: ✅ FULLY IMPLEMENTED

All sync functions now properly extract and save data to dedicated database columns.

---

## What Was Fixed

### 1. AI Extraction Schema (`wordpress-extraction.ts`)
- ✅ Added `manufacturer`, `model`, `lot_rent`, `virtual_tour_url`, `community_type` to `ExtractedPropertyData`
- ✅ Added `age_category`, `utilities_included` to `ExtractedCommunityData`  
- ✅ Updated Claude tool schema with all new fields and extraction instructions

### 2. Properties Sync (`sync-wordpress-homes/index.ts`)
- ✅ New field variables initialized
- ✅ Priority 1: Field mappings extraction
- ✅ Priority 2: AI extraction fallback
- ✅ Priority 3: ACF keyword fallback
- ✅ Fields included in content hash
- ✅ Fields saved to `propertyData` object

### 3. Communities Sync (`sync-wordpress-communities/index.ts`)
- ✅ New field variables: `amenities`, `petPolicy`, `utilitiesIncluded`
- ✅ Priority 1: Field mappings extraction (handles repeater arrays)
- ✅ Priority 2: AI extraction fallback
- ✅ Priority 3: ACF keyword fallback
- ✅ `description` and `age_category` moved from metadata to proper columns
- ✅ `metadata` now only contains lat/lng
- ✅ All new fields included in hash and saved to database

---

## New Fields by Table

### `properties` table
| Field | Type | Extraction Sources |
|-------|------|-------------------|
| `manufacturer` | TEXT | mappings → AI → ACF (manufacturer, make, builder, brand) |
| `model` | TEXT | mappings → AI → ACF (model, model_name, home_model) |
| `lot_rent` | INTEGER (cents) | mappings → AI → ACF (lot_rent, space_rent, site_rent, lot_fee) |
| `virtual_tour_url` | TEXT | mappings → AI → ACF (virtual_tour, tour_url, matterport, 3d_tour, video_tour) |
| `community_type` | TEXT | mappings → AI → ACF (community_type, age_restriction, age_category, 55_plus) |

### `locations` table
| Field | Type | Extraction Sources |
|-------|------|-------------------|
| `description` | TEXT | mappings → AI → existing ACF logic |
| `age_category` | TEXT | mappings → AI → ACF (age, age_category, age_restriction) |
| `amenities` | TEXT[] | mappings → AI → ACF repeater (community_amenities_repeater, amenities) |
| `pet_policy` | TEXT | mappings → AI → ACF (pet_policy, pets, pet_rules, pet_friendly) |
| `utilities_included` | JSONB | mappings → ACF (water_trash_electric, utilities) |

---

## Testing

Run a **Full Resync** for both Properties and Communities to populate the new fields.
