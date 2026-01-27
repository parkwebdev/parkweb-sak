
Goal
- Fix “Full Resync says no changes” for WordPress property listings when communities work, and ensure mapped fields (especially those under `property_meta.*`) actually arrive in the payload used by the sync.

What happened (root cause)
- Your `property_field_mappings` are pointing at fields like:
  - `property_meta.fave_property_address`
  - `property_meta.fave_property_price`
  - etc.
- On this WordPress site, those fields exist and are arrays (confirmed via `?_fields=...`):
  - `property_meta.fave_property_address: ["18162 Pondview Dr, Foley, AL"]`
  - `property_meta.fave_property_zip: ["36535"]`
- However, the sync function currently fetches properties with:
  - `.../wp-json/wp/v2/<endpoint>?per_page=100&page=N&_embed`
  - It does NOT request `property_meta` explicitly.
- Many WP setups only expose meta fields like `property_meta` when explicitly requested (via `_fields=property_meta` or similar). So the sync receives no `property_meta` → `getValueByPath()` returns `null` for mapped meta fields → the DB rows get updated/hashed with `null`s → the content hash doesn’t change between runs → resync shows “no changes”.

Key observation that supports this
- In your DB, properties exist (66 rows) and their `address/city/state/zip/beds/baths/...` are all `NULL` while `listing_url` is populated.
- That pattern is consistent with the sync never seeing the mapped meta payload, not with a DB write failure.

Solution approach
A) Update the property fetch request to include the root keys needed by mappings (especially `property_meta`)
- In `supabase/functions/sync-wordpress-homes/index.ts`:
  1. Add a small helper to derive required top-level fields from `property_field_mappings`:
     - For each mapping path like `property_meta.fave_property_address`, take the first segment (`property_meta`)
     - Collect into a set
  2. Build a `_fields=` list that includes:
     - Always-needed fields for the sync: `id,slug,link,title,content,excerpt,status,_embedded,home_community,acf,yoast_head_json`
     - Plus any discovered top-level mapping roots (e.g. `property_meta`, `agency_meta`, etc.)
     - Plus taxonomy arrays if you rely on them: `property_city,property_state,property_status` (optional, but safe)
  3. Update `fetchWordPressHomes()` to accept a `fields?: string[]` parameter and append:
     - `&_fields=${encodeURIComponent(fields.join(','))}`
     - Keep `_embed` (and ensure `_embedded` is included in `_fields`, otherwise `_embed` becomes pointless because `_embedded` is filtered out)
  4. Call `fetchWordPressHomes()` from the sync handler with the computed fields list when field mappings exist.

Why this fixes “no changes”
- Once `property_meta` is actually present in the fetched JSON, your existing mapping logic + array-first-element handling will produce real values (address/zip/beds/price/etc).
- Those values will change the `content_hash`, causing updates to register during the resync and the DB columns to populate.

B) Improve sync feedback so “errors but no changes” can’t be silent
Even though this specific issue is “missing fields in payload”, it’s still possible for a sync to have per-record errors and show “No changes” today because the UI toast only looks at created/updated/deleted.
- In `sync-wordpress-homes/index.ts`:
  - Add a log line at the end: `errors: ${result.errors.length}` and optionally log the first 3 errors.
- In `src/hooks/useWordPressHomes.ts`:
  - If `data.errors?.length > 0`, show a warning toast like “Sync completed with warnings” and include the first error, or show a dialog listing errors.
  - (This prevents “it says no changes” from masking the true cause in future cases.)

C) Optional: Make taxonomy-term mappings more user-proof (future)
Right now your mapping uses:
- `city: property_city` (but that’s `[11]`, a taxonomy term ID, not the string “Foley”)
- `state: property_state` (array of term IDs, often empty)
This doesn’t block meta extraction, but it does mean “city/state” mappings won’t produce human-readable text unless you resolve term IDs → term names.
Two options:
1) Recommend mapping city/state from meta (if present) and keep taxonomy fields only for location matching.
2) Add term resolution in the edge function:
   - Build a cached map of termId → termName by fetching taxonomy endpoints once per sync.
   - Convert `property_city[0]` into the term name string.

Implementation steps (sequenced)
1) Update `fetchWordPressHomes()` signature and request building
   - Add optional `_fields` support
   - Ensure `_embedded` is included when `_fields` is used
2) Compute required fields from `wpConfig.property_field_mappings`
3) Pass those fields into the fetch call (only when mappings exist, or always—your choice; conditional keeps payload smaller)
4) Add targeted logs: whether `_fields` is being used and which top-level roots were requested
5) Update UI toast behavior to surface `errors[]` (warnings) even when created/updated/deleted are 0
6) Retest: run Full Resync
   - Expect: properties get populated `address/zip/beds/baths/price/...`
   - Expect: resync reports updated count > 0 the first time after fix
   - Expect: subsequent resyncs report unchanged count > 0 (or “No changes”), which is correct once data is stable

Files that will change
- Backend
  - `supabase/functions/sync-wordpress-homes/index.ts`
- Frontend (recommended, for visibility)
  - `src/hooks/useWordPressHomes.ts`

Validation / testing plan
- Confirm the WordPress response used by the sync includes `property_meta` by logging presence for 1 sample home (guarded, do not log entire payload).
- Run Full Resync:
  - Verify the properties table has non-null `address`, `zip`, `beds`, `baths`, `price` for several rows.
- Run Full Resync again:
  - Verify it now correctly reports “no changes” (or unchanged count) because hashes match.

Risks / edge cases
- Using `_fields` can accidentally remove fields you rely on if the list is incomplete (especially `_embedded`). We’ll explicitly include `_embedded` whenever `_embed` is used.
- Some WP sites may block meta exposure entirely; in that case, we’ll need an alternate source (e.g. ACF under `acf.*` or a custom JSON feed endpoint). But your site clearly exposes `property_meta` when requested, so this should work.