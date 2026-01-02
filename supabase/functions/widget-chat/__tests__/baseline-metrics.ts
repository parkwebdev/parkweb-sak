/**
 * Widget-Chat Baseline Performance Metrics
 * 
 * Phase 0.3 Pre-Refactoring Performance Capture
 * 
 * This tool captures baseline performance metrics before refactoring.
 * Run this before any extraction begins and save the output.
 * 
 * Run with: deno run --allow-all supabase/functions/widget-chat/__tests__/baseline-metrics.ts
 * 
 * @module widget-chat/__tests__/baseline-metrics
 */

import { createBaseRequest, MESSAGES } from './fixtures.ts';
import { getTestContext, makeRequest, measureRequest } from './test-utils.ts';

// ============================================
// TYPES
// ============================================

interface PerformanceMetrics {
  timestamp: string;
  coldStartMs: number;
  warmRequestCacheMissMs: number[];
  warmRequestCacheHitMs: number[];
  averageCacheMissMs: number;
  averageCacheHitMs: number;
  p95CacheMissMs: number;
  p95CacheHitMs: number;
  bundleSizeBytes: number | null;
  notes: string[];
}

// ============================================
// HELPERS
// ============================================

function calculateP95(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.floor(sorted.length * 0.95);
  return sorted[Math.min(index, sorted.length - 1)];
}

function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// METRIC COLLECTION
// ============================================

async function measureColdStart(): Promise<number> {
  console.log('\n📊 Measuring cold start time...');
  console.log('   (First request after idle period)');
  
  // Wait to simulate cold state (Deno edge functions have warm instances)
  await delay(5000);
  
  const request = createBaseRequest({
    messages: [{ role: 'user', content: '__GREETING_REQUEST__' }],
  });
  
  const { localDurationMs } = await measureRequest(request);
  console.log(`   Cold start: ${localDurationMs.toFixed(0)}ms`);
  
  return localDurationMs;
}

async function measureWarmRequestsCacheMiss(count: number = 10): Promise<number[]> {
  console.log(`\n📊 Measuring ${count} warm requests (cache miss)...`);
  
  const durations: number[] = [];
  
  for (let i = 0; i < count; i++) {
    // Use unique queries to avoid cache hits
    const uniqueQuery = `Tell me about home features ${Date.now()}-${i}`;
    const request = createBaseRequest({
      messages: [{ role: 'user', content: uniqueQuery }],
    });
    
    const { localDurationMs } = await measureRequest(request);
    durations.push(localDurationMs);
    console.log(`   Request ${i + 1}: ${localDurationMs.toFixed(0)}ms`);
    
    // Small delay between requests
    await delay(500);
  }
  
  return durations;
}

async function measureWarmRequestsCacheHit(count: number = 10): Promise<number[]> {
  console.log(`\n📊 Measuring ${count} warm requests (potential cache hit)...`);
  
  // First, prime the cache with a specific query
  const cacheableQuery = 'What are your business hours?';
  const primeRequest = createBaseRequest({
    messages: [{ role: 'user', content: cacheableQuery }],
  });
  await makeRequest(primeRequest);
  await delay(1000); // Wait for cache to populate
  
  const durations: number[] = [];
  
  for (let i = 0; i < count; i++) {
    const request = createBaseRequest({
      messages: [{ role: 'user', content: cacheableQuery }],
    });
    
    const { result, localDurationMs } = await measureRequest(request);
    durations.push(localDurationMs);
    
    const isCached = 'cached' in result.body && (result.body as { cached?: boolean }).cached;
    console.log(`   Request ${i + 1}: ${localDurationMs.toFixed(0)}ms ${isCached ? '(CACHED)' : ''}`);
    
    await delay(300);
  }
  
  return durations;
}

// ============================================
// MAIN EXECUTION
// ============================================

async function collectBaseline(): Promise<PerformanceMetrics> {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('       Widget-Chat Baseline Performance Metrics (Phase 0.3)    ');
  console.log('═══════════════════════════════════════════════════════════════');
  
  const notes: string[] = [];
  
  // Verify environment
  try {
    getTestContext();
    console.log('\n✓ Environment configured correctly');
  } catch (error) {
    console.error('\n✗ Environment error:', error);
    throw error;
  }
  
  // Collect metrics
  const coldStartMs = await measureColdStart();
  const warmRequestCacheMissMs = await measureWarmRequestsCacheMiss(10);
  const warmRequestCacheHitMs = await measureWarmRequestsCacheHit(10);
  
  // Calculate statistics
  const averageCacheMissMs = calculateAverage(warmRequestCacheMissMs);
  const averageCacheHitMs = calculateAverage(warmRequestCacheHitMs);
  const p95CacheMissMs = calculateP95(warmRequestCacheMissMs);
  const p95CacheHitMs = calculateP95(warmRequestCacheHitMs);
  
  // Bundle size (not directly measurable in edge functions)
  notes.push('Bundle size requires checking Supabase dashboard');
  notes.push('Memory usage requires Deno deploy metrics');
  
  const metrics: PerformanceMetrics = {
    timestamp: new Date().toISOString(),
    coldStartMs,
    warmRequestCacheMissMs,
    warmRequestCacheHitMs,
    averageCacheMissMs,
    averageCacheHitMs,
    p95CacheMissMs,
    p95CacheHitMs,
    bundleSizeBytes: null,
    notes,
  };
  
  return metrics;
}

function printMetrics(metrics: PerformanceMetrics): void {
  console.log('\n');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('                    BASELINE METRICS SUMMARY                    ');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`
Timestamp: ${metrics.timestamp}

┌─────────────────────────────────────────────────────────────────┐
│ METRIC                          │ VALUE                         │
├─────────────────────────────────┼───────────────────────────────┤
│ Cold Start                      │ ${metrics.coldStartMs.toFixed(0).padStart(8)} ms                  │
├─────────────────────────────────┼───────────────────────────────┤
│ Warm Request (Cache Miss)       │                               │
│   - Average                     │ ${metrics.averageCacheMissMs.toFixed(0).padStart(8)} ms                  │
│   - P95                         │ ${metrics.p95CacheMissMs.toFixed(0).padStart(8)} ms                  │
├─────────────────────────────────┼───────────────────────────────┤
│ Warm Request (Cache Hit)        │                               │
│   - Average                     │ ${metrics.averageCacheHitMs.toFixed(0).padStart(8)} ms                  │
│   - P95                         │ ${metrics.p95CacheHitMs.toFixed(0).padStart(8)} ms                  │
├─────────────────────────────────┼───────────────────────────────┤
│ Bundle Size                     │ ${metrics.bundleSizeBytes ? `${(metrics.bundleSizeBytes / 1024).toFixed(1)} KB` : 'N/A (check dashboard)'.padStart(8)}       │
└─────────────────────────────────┴───────────────────────────────┘

Notes:
${metrics.notes.map(n => `  • ${n}`).join('\n')}

═══════════════════════════════════════════════════════════════════
                     SAVE THIS OUTPUT!
  Compare these values after each extraction step to detect
  performance regressions. Any degradation >20% is a red flag.
═══════════════════════════════════════════════════════════════════
`);
}

function exportMetricsJson(metrics: PerformanceMetrics): string {
  return JSON.stringify(metrics, null, 2);
}

// ============================================
// ENTRY POINT
// ============================================

if (import.meta.main) {
  try {
    const metrics = await collectBaseline();
    printMetrics(metrics);
    
    // Output JSON for automated comparison
    console.log('\n📄 JSON Output (for automated comparison):');
    console.log(exportMetricsJson(metrics));
    
    // Save to file
    const filename = `baseline-metrics-${new Date().toISOString().split('T')[0]}.json`;
    await Deno.writeTextFile(filename, exportMetricsJson(metrics));
    console.log(`\n✓ Metrics saved to: ${filename}`);
    
  } catch (error) {
    console.error('Failed to collect baseline metrics:', error);
    Deno.exit(1);
  }
}

// Export for use in other tests
export { collectBaseline, type PerformanceMetrics };
