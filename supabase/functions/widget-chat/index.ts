import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================
// OBSERVABILITY: ERROR CODES & REQUEST LIMITS
// ============================================

const ErrorCodes = {
  MESSAGE_TOO_LONG: 'MESSAGE_TOO_LONG',
  TOO_MANY_FILES: 'TOO_MANY_FILES',
  INVALID_REQUEST: 'INVALID_REQUEST',
  AGENT_NOT_FOUND: 'AGENT_NOT_FOUND',
  RATE_LIMITED: 'RATE_LIMITED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  EMBEDDING_ERROR: 'EMBEDDING_ERROR',
  TOOL_EXECUTION_ERROR: 'TOOL_EXECUTION_ERROR',
  CONVERSATION_CLOSED: 'CONVERSATION_CLOSED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Request size limits
const MAX_MESSAGE_LENGTH = 10000; // 10,000 characters
const MAX_FILES_PER_MESSAGE = 5;

// ============================================
// OBSERVABILITY: STRUCTURED LOGGING
// ============================================

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  requestId: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  durationMs?: number;
}

/**
 * Create a structured logger bound to a specific requestId.
 * All logs are JSON-formatted for easy parsing in log aggregators.
 */
function createLogger(requestId: string) {
  const log = (level: LogLevel, message: string, data?: Record<string, unknown>) => {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      requestId,
      level,
      message,
      ...(data && { data }),
    };
    const logStr = JSON.stringify(entry);
    
    switch (level) {
      case 'error':
        console.error(logStr);
        break;
      case 'warn':
        console.warn(logStr);
        break;
      case 'debug':
        console.debug(logStr);
        break;
      default:
        console.log(logStr);
    }
  };

  return {
    debug: (message: string, data?: Record<string, unknown>) => log('debug', message, data),
    info: (message: string, data?: Record<string, unknown>) => log('info', message, data),
    warn: (message: string, data?: Record<string, unknown>) => log('warn', message, data),
    error: (message: string, data?: Record<string, unknown>) => log('error', message, data),
  };
}

/**
 * Create an error response with consistent structure.
 */
function createErrorResponse(
  requestId: string,
  code: ErrorCode,
  message: string,
  status: number,
  durationMs?: number
): Response {
  return new Response(
    JSON.stringify({ 
      error: message,
      code,
      requestId,
      ...(durationMs !== undefined && { durationMs: Math.round(durationMs) }),
    }),
    { 
      status, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// Local type for conversation metadata (edge functions can't import from src/)
interface ShownProperty {
  index: number;
  id: string;
  address: string;
  city: string;
  state: string;
  beds: number | null;
  baths: number | null;
  price: number | null;
  price_formatted: string;
  community: string | null;
  location_id: string | null; // For direct booking without location lookup
}

interface ConversationMetadata {
  lead_name?: string;
  lead_email?: string;
  custom_fields?: Record<string, string | number | boolean>;
  country?: string;
  city?: string;
  device_type?: string;
  browser?: string;
  os?: string;
  referrer?: string;
  landing_page?: string;
  visited_pages?: string[];
  session_id?: string;
  ip_address?: string;
  last_message_at?: string;
  last_message_role?: string;
  last_user_message_at?: string;
  admin_last_read_at?: string;
  lead_id?: string;
  // Property context memory for multi-property scenarios
  shown_properties?: ShownProperty[];
  last_property_search_at?: string;
  // PHASE 2: Conversation summarization for context continuity
  conversation_summary?: string;
  summary_generated_at?: string;
  // Language detection
  detected_language?: string;
  detected_language_code?: string;
  // Language re-evaluation tracking
  language_mismatch_count?: number;
  language_detection_source?: 'browser' | 'character' | 'ai';
  language_last_reevaluated_at?: string;
}

// URL regex for extracting links from content
const URL_REGEX = /https?:\/\/[^\s<>"')\]]+/gi;

// US Phone number regex (matches: (xxx) xxx-xxxx, xxx-xxx-xxxx, xxx.xxx.xxxx, +1 xxx xxx xxxx, etc.)
const PHONE_REGEX = /\b(?:\+?1[-.\s]?)?\(?([2-9][0-9]{2})\)?[-.\s]?([2-9][0-9]{2})[-.\s]?([0-9]{4})\b/g;

// Extract phone numbers from content and format for call buttons
interface CallAction {
  phoneNumber: string;      // For tel: href (E.164 or raw)
  displayNumber: string;    // Human-readable format
  locationName?: string;    // Context from location data
}

function extractPhoneNumbers(content: string, locationContext?: { name?: string; phone?: string }): CallAction[] {
  const matches: CallAction[] = [];
  const seenNumbers = new Set<string>();
  
  // Reset regex lastIndex to avoid stale state from previous invocations
  PHONE_REGEX.lastIndex = 0;
  
  let match;
  while ((match = PHONE_REGEX.exec(content)) !== null) {
    const rawNumber = match[0].replace(/[^0-9+]/g, ''); // Strip to digits
    const normalizedNumber = rawNumber.startsWith('+') ? rawNumber : rawNumber.replace(/^1/, '');
    
    // Avoid duplicates
    if (seenNumbers.has(normalizedNumber)) continue;
    seenNumbers.add(normalizedNumber);
    
    // Format display number as (xxx) xxx-xxxx
    const areaCode = match[1];
    const prefix = match[2];
    const line = match[3];
    const displayNumber = `(${areaCode}) ${prefix}-${line}`;
    
    // Check if this matches the location phone for context
    let locationName: string | undefined;
    if (locationContext?.phone) {
      const locationNormalized = locationContext.phone.replace(/[^0-9]/g, '').replace(/^1/, '');
      if (normalizedNumber === locationNormalized || normalizedNumber.endsWith(locationNormalized)) {
        locationName = locationContext.name;
      }
    }
    
    matches.push({
      phoneNumber: rawNumber.startsWith('+') ? rawNumber : `+1${normalizedNumber}`,
      displayNumber,
      locationName,
    });
  }
  
  return matches.slice(0, 3); // Max 3 call buttons
}

// Simple SHA-256 hash function for API key validation
async function hashApiKey(key: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Fetch link previews for URLs in content (max 3)
async function fetchLinkPreviews(content: string, supabaseUrl: string, supabaseKey: string): Promise<any[]> {
  const urls = Array.from(new Set(content.match(URL_REGEX) || [])).slice(0, 3);
  if (urls.length === 0) return [];
  
  console.log(`Fetching link previews for ${urls.length} URLs`);
  
  const previews = await Promise.all(
    urls.map(async (url) => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(`${supabaseUrl}/functions/v1/fetch-link-preview`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.error(`Failed to fetch preview for ${url}: ${response.status}`);
          return null;
        }
        
        const data = await response.json();
        // Only include valid previews (has title or is video)
        if (data && (data.title || data.videoType)) {
          return data;
        }
        return null;
      } catch (error) {
        console.error(`Error fetching preview for ${url}:`, error.message);
        return null;
      }
    })
  );
  
  return previews.filter(p => p !== null);
}

// Qwen3 embedding model via OpenRouter (1024 dimensions - truncated from 4096 via MRL)
const EMBEDDING_MODEL = 'qwen/qwen3-embedding-8b';
const EMBEDDING_DIMENSIONS = 1024;

// PHASE 6: Context Window Optimization Constants
const MAX_CONVERSATION_HISTORY = 10; // Limit to last 10 messages to reduce input tokens
const MAX_RAG_CHUNKS = 3; // Limit RAG context to top 3 most relevant chunks
const SUMMARIZATION_THRESHOLD = 15; // Only summarize if over this many messages (worth the extra API call)

// PHASE 8: Response Formatting Rules for Digestible AI Responses (with chunking)
const RESPONSE_FORMATTING_RULES = `

RESPONSE FORMATTING (CRITICAL - Follow these rules):

MESSAGE CHUNKING (IMPORTANT):
- Use ||| to separate your response into 1-2 message chunks for a conversational feel
- Chunk 1: Answer the question directly (1-2 sentences max)
- Chunk 2 (optional): Relevant links on their own line
- Simple answers should be 1 chunk (no delimiter needed)
- Max 2 chunks total

CHUNKING EXAMPLES:
Good: "We have 3 plans: Starter $29/mo, Pro $99/mo, and Enterprise (custom). ||| https://example.com/pricing"
Good: "Yes, we support that feature!"
Bad: "I'd be happy to help! Here's everything..." (preamble, too wordy)

OTHER RULES:
- Be CONCISE: Max 1-2 short sentences per chunk
- Skip preamble like "I'd be happy to help" - just answer directly
- Put links on their OWN LINE - never bury links in paragraphs
- Use BULLET POINTS for any list of 3+ items
- Lead with the ANSWER first, then add brief context if needed
- If you're writing more than 30 words without a break, STOP and restructure`;

// ============================================
// LANGUAGE DETECTION
// ============================================

// Browser language code to name mapping (ISO 639-1 codes)
const BROWSER_LANGUAGE_NAMES: Record<string, string> = {
  'es': 'Spanish',
  'pt': 'Portuguese',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'nl': 'Dutch',
  'pl': 'Polish',
  'ru': 'Russian',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'he': 'Hebrew',
  'hi': 'Hindi',
  'th': 'Thai',
  'el': 'Greek',
  'uk': 'Ukrainian',
  'vi': 'Vietnamese',
  'tr': 'Turkish',
  'sv': 'Swedish',
  'da': 'Danish',
  'no': 'Norwegian',
  'fi': 'Finnish',
  'cs': 'Czech',
  'ro': 'Romanian',
  'hu': 'Hungarian',
  'id': 'Indonesian',
  'ms': 'Malay',
  'tl': 'Filipino',
};

// Character-based patterns for languages with unique scripts (100% reliable)
// Word-based patterns for Latin-alphabet languages are handled by AI detection
const CHARACTER_BASED_PATTERNS: Array<{ code: string; name: string; pattern: RegExp }> = [
  { code: 'ru', name: 'Russian', pattern: /[а-яА-ЯёЁ]/ },
  { code: 'zh', name: 'Chinese', pattern: /[\u4e00-\u9fff]|[\u3400-\u4dbf]/ },
  { code: 'ja', name: 'Japanese', pattern: /[\u3040-\u309f]|[\u30a0-\u30ff]/ },
  { code: 'ko', name: 'Korean', pattern: /[\uac00-\ud7af]|[\u1100-\u11ff]/ },
  { code: 'ar', name: 'Arabic', pattern: /[\u0600-\u06ff]/ },
  { code: 'he', name: 'Hebrew', pattern: /[\u0590-\u05ff]/ },
  { code: 'hi', name: 'Hindi', pattern: /[\u0900-\u097f]/ },
  { code: 'th', name: 'Thai', pattern: /[\u0e00-\u0e7f]/ },
  { code: 'el', name: 'Greek', pattern: /[\u0370-\u03ff]/ },
  { code: 'uk', name: 'Ukrainian', pattern: /[їієґ]/i },
  { code: 'vi', name: 'Vietnamese', pattern: /[ảạăằẳẵắặẩẫậẻẹềểễệỉịỏọổỗộơờởỡớợủụưừửữứựỷỵđ]/i },
];

/**
 * Parse browser language code and return language info.
 * Handles formats like "es", "es-ES", "pt-BR", etc.
 * Only returns non-English languages (since English is the default).
 */
function parseBrowserLanguage(browserLang: string | null | undefined): { code: string; name: string } | null {
  if (!browserLang) return null;
  
  // Extract base language code (e.g., "es-ES" → "es")
  const langCode = browserLang.split('-')[0].toLowerCase();
  
  // Skip English (default fallback language)
  if (langCode === 'en') return null;
  
  const langName = BROWSER_LANGUAGE_NAMES[langCode];
  if (langName) {
    return { code: langCode, name: langName };
  }
  
  return null;
}

/**
 * Fast character-based language detection for unique scripts.
 * Returns null for Latin-alphabet languages (handled by AI detection).
 */
function detectLanguageByCharacters(text: string): { code: string; name: string } | null {
  if (!text || text.length < 3) return null;
  
  for (const lang of CHARACTER_BASED_PATTERNS) {
    if (lang.pattern.test(text)) {
      return { code: lang.code, name: lang.name };
    }
  }
  return null;
}

/**
 * Detect language using AI via OpenRouter (uses lite tier for cost efficiency).
 * Only called when character-based detection doesn't match.
 * Cost: ~50-100 tokens per call (~$0.000001 per detection)
 */
async function detectLanguageWithAI(
  text: string, 
  openrouterKey: string
): Promise<{ code: string; name: string } | null> {
  if (!text || text.length < 10) return null;
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chatpad.ai',
        'X-Title': 'ChatPad Language Detection',
      },
      body: JSON.stringify({
        model: MODEL_TIERS.lite, // google/gemini-2.5-flash-lite - cheapest tier
        messages: [
          {
            role: 'system',
            content: `Detect the primary language of the user's message. Return ONLY a JSON object: {"code":"xx","name":"Language Name"}

Common codes: en=English, es=Spanish, pt=Portuguese, fr=French, de=German, it=Italian, nl=Dutch, pl=Polish, tr=Turkish, sv=Swedish, da=Danish, no=Norwegian, fi=Finnish, cs=Czech, ro=Romanian, hu=Hungarian, id=Indonesian, ms=Malay, tl=Filipino.
If the text is primarily English or you're unsure, return: {"code":"en","name":"English"}
Handle misspellings naturally - "necessito" is Spanish even though misspelled.
Respond ONLY with the JSON object, no explanation.`
          },
          { role: 'user', content: text.substring(0, 500) }
        ],
        max_tokens: 30,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.warn('[Language Detection] OpenRouter API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    
    // Parse JSON response - handle potential markdown wrapping
    let jsonStr = content;
    if (content.includes('```')) {
      jsonStr = content.replace(/```json?\s*/g, '').replace(/```/g, '').trim();
    }
    
    const parsed = JSON.parse(jsonStr);
    if (parsed.code && parsed.name && parsed.code !== 'en') {
      console.log(`[Language Detection] AI detected: ${parsed.name} (${parsed.code})`);
      return { code: parsed.code, name: parsed.name };
    }
    return null;
  } catch (error) {
    console.warn('[Language Detection] AI detection error:', error);
    return null;
  }
}

/**
 * Detect language of a single message for re-evaluation purposes.
 * Uses character-based detection first, falls back to AI.
 * Returns null if language matches English (default).
 */
async function detectMessageLanguage(
  messageText: string,
  openrouterKey: string
): Promise<{ code: string; name: string } | null> {
  if (!messageText || messageText.length < 10) return null;
  
  // Try fast character-based detection first
  const charDetected = detectLanguageByCharacters(messageText);
  if (charDetected) {
    return charDetected;
  }
  
  // Fall back to AI for Latin-script languages
  return await detectLanguageWithAI(messageText, openrouterKey);
}

// US State abbreviation to full name mapping for bidirectional search
const STATE_ABBREVIATIONS: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
};

// Helper to normalize state input (abbreviation or full name → full name)
function normalizeState(stateInput: string): string {
  const stateUpper = stateInput.toUpperCase().trim();
  // If it's an abbreviation, convert to full name; otherwise use as-is
  return STATE_ABBREVIATIONS[stateUpper] || stateInput;
}

// Model tiers for smart routing (cost optimization)
const MODEL_TIERS = {
  lite: 'google/gemini-2.5-flash-lite',     // $0.015/M input, $0.06/M output - simple lookups
  standard: 'google/gemini-2.5-flash',       // $0.15/M input, $0.60/M output - balanced
  // premium uses agent's configured model
} as const;

// ============================================
// PHASE 6: BOOKING TOOLS DEFINITIONS
// ============================================
// BOOKING UI TRANSFORMATION TYPES & FUNCTIONS
// ============================================

// Types for booking UI components (must match src/widget/types.ts)
interface BookingDay {
  date: string;
  dayName: string;
  dayNumber: number;
  hasAvailability: boolean;
  isToday?: boolean;
}

interface BookingTime {
  time: string;
  datetime: string;
  available: boolean;
}

interface DayPickerData {
  locationName: string;
  locationId: string;
  phoneNumber?: string;
  days: BookingDay[];
}

interface TimePickerData {
  locationName: string;
  locationId: string;
  phoneNumber?: string;
  selectedDate: string;
  selectedDayDisplay: string;
  times: BookingTime[];
}

interface BookingConfirmationData {
  locationName: string;
  address?: string;
  phoneNumber?: string;
  date: string;
  time: string;
  startDateTime?: string;
  endDateTime?: string;
  confirmationId?: string;
}

/**
 * Transform check_calendar_availability result to DayPicker format
 * Groups available slots by date and returns days with availability
 */
function transformToDayPickerData(toolResult: any): DayPickerData | null {
  if (!toolResult?.available_slots?.length || !toolResult?.location) return null;
  
  const today = new Date().toISOString().split('T')[0];
  const dayMap = new Map<string, BookingDay>();
  
  for (const slot of toolResult.available_slots) {
    const date = new Date(slot.start);
    const dateKey = date.toISOString().split('T')[0];
    
    if (!dayMap.has(dateKey)) {
      dayMap.set(dateKey, {
        date: dateKey,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        hasAvailability: true,
        isToday: dateKey === today,
      });
    }
  }
  
  // Sort by date and limit to 14 days
  const days = Array.from(dayMap.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 14);
  
  return {
    locationName: toolResult.location.name || 'Office',
    locationId: toolResult.location.id || '',
    phoneNumber: toolResult.location.phone || undefined,
    days,
  };
}

/**
 * Transform check_calendar_availability result to TimePicker format for a specific date
 */
function transformToTimePickerData(toolResult: any, selectedDate: string): TimePickerData | null {
  if (!toolResult?.available_slots?.length || !toolResult?.location) return null;
  
  const times = toolResult.available_slots
    .filter((slot: any) => slot.start.startsWith(selectedDate))
    .map((slot: any) => ({
      time: new Date(slot.start).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }),
      datetime: slot.start,
      available: true,
    }));
  
  if (times.length === 0) return null;
  
  const date = new Date(selectedDate);
  return {
    locationName: toolResult.location.name || 'Office',
    locationId: toolResult.location.id || '',
    phoneNumber: toolResult.location.phone || undefined,
    selectedDate,
    selectedDayDisplay: date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    }),
    times,
  };
}

/**
 * Transform book_appointment result to BookingConfirmed format
 */
function transformToBookingConfirmedData(toolResult: any): BookingConfirmationData | null {
  if (!toolResult?.booking) return null;
  
  const booking = toolResult.booking;
  const startDate = new Date(booking.start_time);
  
  return {
    locationName: booking.location_name || 'Office',
    address: booking.location_address || undefined,
    phoneNumber: booking.location_phone || undefined,
    date: startDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    }),
    time: startDate.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    }),
    startDateTime: booking.start_time,
    endDateTime: booking.end_time,
    confirmationId: booking.id,
  };
}

/**
 * Detect if user has selected a specific date from recent messages
 * Looks for patterns like "Monday, December 16" or "Dec 16" in recent user messages
 */
function detectSelectedDateFromMessages(messages: any[]): string | null {
  // Get last 3 user messages
  const recentUserMessages = messages
    .filter((m: any) => m.role === 'user')
    .slice(-3)
    .map((m: any) => m.content?.toLowerCase() || '');
  
  const fullContent = recentUserMessages.join(' ');
  
  // Pattern 1: "Monday, December 16" or "December 16"
  const monthDayPattern = /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i;
  const match = fullContent.match(monthDayPattern);
  
  if (match) {
    const monthName = match[1];
    const dayNum = parseInt(match[2], 10);
    const monthIndex = ['january', 'february', 'march', 'april', 'may', 'june', 
                        'july', 'august', 'september', 'october', 'november', 'december']
      .indexOf(monthName.toLowerCase());
    
    if (monthIndex !== -1) {
      const year = new Date().getFullYear();
      const selectedDate = new Date(year, monthIndex, dayNum);
      return selectedDate.toISOString().split('T')[0];
    }
  }
  
  // Pattern 2: Day of week (e.g., "monday" or "this monday")
  const dayOfWeekPattern = /(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/i;
  const dayMatch = fullContent.match(dayOfWeekPattern);
  
  if (dayMatch) {
    const dayName = dayMatch[1].toLowerCase();
    const targetDay = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      .indexOf(dayName);
    
    if (targetDay !== -1) {
      const today = new Date();
      const currentDay = today.getDay();
      let daysUntil = targetDay - currentDay;
      if (daysUntil <= 0) daysUntil += 7;
      
      const selectedDate = new Date(today.getTime() + daysUntil * 24 * 60 * 60 * 1000);
      return selectedDate.toISOString().split('T')[0];
    }
  }
  
  return null;
}

// ============================================

const BOOKING_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'search_properties',
      description: `Search for available properties/homes in the database.

TRIGGERS - Use this tool when user:
• Asks about available homes, units, properties, rentals, or listings
• Says "what do you have", "show me homes", "looking for a place"
• Mentions price range, bedrooms, location preferences
• Asks "what's available in [city/community]"
• Wants to browse or see options

EXAMPLES:
• "Do you have any 3-bedroom homes?" → search_properties(min_beds: 3)
• "What's available under $1500?" → search_properties(max_price: 150000)
• "Show me homes in Clearview" → search_properties(city: "Clearview") or use location_id

WORKFLOW:
• This is typically the FIRST tool in the property journey
• AFTER: User may ask about a specific property → use lookup_property
• AFTER: User may want to schedule a tour → use check_calendar_availability

DO NOT USE when:
• User asks about a SPECIFIC property they already mentioned (use lookup_property)
• User asks for contact info only (use get_locations)
• User is ready to book (use book_appointment)`,
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string', description: 'City to search in' },
          state: { type: 'string', description: 'State to search in' },
          min_price: { type: 'number', description: 'Minimum price' },
          max_price: { type: 'number', description: 'Maximum price' },
          min_beds: { type: 'integer', description: 'Minimum bedrooms' },
          status: { 
            type: 'string', 
            enum: ['available', 'pending', 'all'],
            description: 'Property status filter (default: available)'
          },
          location_id: { type: 'string', description: 'Specific location/community ID to search in' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'lookup_property',
      description: `Get detailed information about a SPECIFIC property by address, lot number, or ID.

TRIGGERS - Use this tool when user:
• References a specific property from search results ("tell me more about the first one")
• Uses ordinal references ("the second home", "the cheapest one", "that $1200 one")
• Asks about a specific address or lot number they know
• Says "more details", "tell me about", "what about" a specific home
• Wants full description, features, or photos of ONE property

EXAMPLES:
• "Tell me more about lot 42" → lookup_property(lot_number: "42")
• "What about the first one?" → lookup_property(property_id: [id from previous search])
• "Details on 123 Oak Street" → lookup_property(address: "123 Oak Street")

WORKFLOW:
• BEFORE: User typically did search_properties first
• AFTER: User may want to schedule a tour → use check_calendar_availability

DO NOT USE when:
• User wants to browse multiple properties (use search_properties)
• User hasn't specified WHICH property they mean
• User asks about communities, not specific homes (use get_locations)`,
      parameters: {
        type: 'object',
        properties: {
          address: { type: 'string', description: 'Property address to look up' },
          property_id: { type: 'string', description: 'Property ID' },
          lot_number: { type: 'string', description: 'Lot number' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_locations',
      description: `Get list of communities/locations with CONTACT INFO (phone numbers, emails, addresses, business hours).

TRIGGERS - Use this tool when user:
• Asks for phone number, email, or contact info for a community
• Says "how do I reach", "call", "contact", "phone number for"
• Asks about office hours or location addresses
• Needs to choose between communities ("which locations do you have")
• Asks "where are you located" or about community names

EXAMPLES:
• "What's the phone for Clearview Estates?" → get_locations, find Clearview, provide phone
• "How do I contact your office?" → get_locations, provide relevant contact
• "What communities do you have?" → get_locations, list all

WORKFLOW:
• Can be used ANYTIME - standalone for contact info
• BEFORE search_properties: To help user pick a community to search in
• Provides location_id needed for check_calendar_availability and book_appointment

DO NOT USE when:
• User asks about specific properties (use search_properties or lookup_property)
• User is already discussing a specific community you know the ID for

CRITICAL: You have phone numbers - NEVER tell users to "check the website" for contact info!`,
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_calendar_availability',
      description: `Check available appointment times for property tours, viewings, or visits.

TRIGGERS - Use this tool when user:
• Wants to schedule, book, or arrange a tour/visit
• Says "when can I come by", "schedule a viewing", "book a tour"
• Asks "what times are available", "when are you open for tours"
• Mentions specific dates they're interested in visiting
• Says "I'd like to see it", "can I visit"

EXAMPLES:
• "Can I schedule a tour?" → check_calendar_availability(location_id, date_from: today)
• "What's available this weekend?" → check_calendar_availability with weekend dates
• "I'd like to visit Clearview on Friday" → get location_id first, then check availability

WORKFLOW:
• BEFORE: Get location_id from get_locations if not known
• BEFORE: User may have searched/viewed properties first
• AFTER: User selects a time → use book_appointment to confirm

DO NOT USE when:
• User is just browsing properties (use search_properties)
• User already selected a time and wants to confirm (use book_appointment)
• You don't have a location_id yet (use get_locations first)`,
      parameters: {
        type: 'object',
        properties: {
          location_id: { type: 'string', description: 'Location ID for the appointment' },
          date_from: { type: 'string', description: 'Start date to check (YYYY-MM-DD format)' },
          date_to: { type: 'string', description: 'End date to check (YYYY-MM-DD format)' },
          duration_minutes: { type: 'integer', description: 'Appointment duration in minutes (default: 30)' }
        },
        required: ['location_id']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'book_appointment',
      description: `Book/confirm a tour or appointment. This is the FINAL step after user selects a time.

TRIGGERS - Use this tool when user:
• Confirms a specific time slot ("yes, book me for 2pm", "that works")
• Says "confirm", "book it", "schedule me", "I'll take that slot"
• Provides their name/contact info for the booking
• Explicitly agrees to a proposed appointment time

EXAMPLES:
• User: "Yes, book me for 2pm on Friday" → book_appointment with that time
• User: "That 10am slot works" → book_appointment with the slot they referenced

WORKFLOW:
• BEFORE: MUST have used check_calendar_availability to show available times
• BEFORE: User MUST have selected/confirmed a specific time
• This is the END of the booking flow

DO NOT USE when:
• User is still browsing times (use check_calendar_availability)
• User hasn't confirmed a specific slot yet
• You don't have visitor_name (ask for it first)
• User is asking about availability, not confirming

REQUIRED: location_id, start_time, visitor_name - collect these before booking!`,
      parameters: {
        type: 'object',
        properties: {
          location_id: { type: 'string', description: 'Location ID' },
          start_time: { type: 'string', description: 'Appointment start time (ISO 8601 format)' },
          end_time: { type: 'string', description: 'Appointment end time (ISO 8601 format, optional)' },
          duration_minutes: { type: 'integer', description: 'Appointment duration if end_time not provided (default: 30)' },
          visitor_name: { type: 'string', description: 'Visitor full name' },
          visitor_email: { type: 'string', description: 'Visitor email address' },
          visitor_phone: { type: 'string', description: 'Visitor phone number' },
          property_address: { type: 'string', description: 'Specific property address to view (if applicable)' },
          notes: { type: 'string', description: 'Additional notes or special requests' }
        },
        required: ['location_id', 'start_time', 'visitor_name']
      }
    }
  }
];

// ============================================
// PHASE 6: BOOKING TOOL HANDLERS
// ============================================

async function searchProperties(
  supabase: any,
  agentId: string,
  args: {
    city?: string;
    state?: string;
    min_price?: number;
    max_price?: number;
    min_beds?: number;
    status?: string;
    location_id?: string;
  }
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    let query = supabase
      .from('properties')
      .select(`
        id, address, lot_number, city, state, zip,
        price, price_type, beds, baths, sqft, status,
        description, features, listing_url,
        location_id, locations(name)
      `)
      .eq('agent_id', agentId);

    // Apply filters
    if (args.location_id) {
      query = query.eq('location_id', args.location_id);
    }
    if (args.city) {
      query = query.ilike('city', `%${args.city}%`);
    }
    if (args.state) {
      const normalizedState = normalizeState(args.state);
      console.log('State normalization:', { input: args.state, normalized: normalizedState });
      query = query.ilike('state', `%${normalizedState}%`);
    }
    if (args.min_price) {
      query = query.gte('price', args.min_price);
    }
    if (args.max_price) {
      query = query.lte('price', args.max_price);
    }
    if (args.min_beds) {
      query = query.gte('beds', args.min_beds);
    }
    if (args.status && args.status !== 'all') {
      query = query.eq('status', args.status);
    } else if (!args.status) {
      query = query.eq('status', 'available');
    }

    query = query.order('price', { ascending: true }).limit(10);

    const { data, error } = await query;

    if (error) {
      console.error('Property search error:', error);
      return { success: false, error: 'Failed to search properties' };
    }

    if (!data || data.length === 0) {
      return { 
        success: true, 
        result: { 
          properties: [], 
          message: 'No properties found matching your criteria.',
          suggestion: 'Try adjusting your search filters or ask about our other communities.'
        } 
      };
    }

    const properties = data.map((p: any, idx: number) => ({
      id: p.id,
      index: idx + 1, // 1-indexed for user-friendly referencing
      address: p.address || `Lot ${p.lot_number}`,
      city: p.city,
      state: p.state,
      price: p.price,
      // Prices are stored in cents, convert to dollars for display
      price_formatted: p.price ? `$${(p.price / 100).toLocaleString()}${p.price_type === 'rent_monthly' ? '/mo' : ''}` : 'Contact for pricing',
      beds: p.beds,
      baths: p.baths,
      sqft: p.sqft,
      status: p.status,
      community: p.locations?.name || null,
      listing_url: p.listing_url,
      location_id: p.location_id || null, // Include for direct booking
    }));

    // Create shown_properties array for conversation context memory (limit to 5)
    const shownProperties: ShownProperty[] = properties.slice(0, 5).map((p: any) => ({
      index: p.index,
      id: p.id,
      address: p.address,
      city: p.city,
      state: p.state,
      beds: p.beds,
      baths: p.baths,
      price: p.price,
      price_formatted: p.price_formatted,
      community: p.community,
      location_id: p.location_id || null, // Include for direct booking
    }));

    return { 
      success: true, 
      result: { 
        properties,
        shownProperties, // Include for metadata storage
        count: properties.length,
        message: `Found ${properties.length} ${args.status === 'all' ? '' : 'available '}properties.`
      } 
    };
  } catch (error) {
    console.error('searchProperties error:', error);
    return { success: false, error: error.message || 'Search failed' };
  }
}

async function lookupProperty(
  supabase: any,
  agentId: string,
  conversationId: string,
  args: {
    address?: string;
    property_id?: string;
    lot_number?: string;
  }
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    let query = supabase
      .from('properties')
      .select(`
        id, address, lot_number, city, state, zip,
        price, price_type, beds, baths, sqft, year_built,
        status, description, features, listing_url, images,
        updated_at,
        location_id, locations(id, name, timezone, phone, email)
      `)
      .eq('agent_id', agentId);

    if (args.property_id) {
      query = query.eq('id', args.property_id);
    } else if (args.address) {
      query = query.ilike('address', `%${args.address}%`);
    } else if (args.lot_number) {
      query = query.ilike('lot_number', `%${args.lot_number}%`);
    } else {
      return { success: false, error: 'Please provide an address, property ID, or lot number' };
    }

    const { data, error } = await query.limit(1).single();

    if (error || !data) {
      return { 
        success: true, 
        result: { 
          found: false, 
          message: 'Property not found. Please check the address or lot number and try again.'
        } 
      };
    }

    // Update conversation with location context if property has a location
    if (data.location_id && conversationId) {
      const { data: conv } = await supabase
        .from('conversations')
        .select('metadata')
        .eq('id', conversationId)
        .single();
      
      if (conv) {
        await supabase
          .from('conversations')
          .update({
            location_id: data.location_id,
            metadata: {
              ...conv.metadata,
              detected_location_id: data.location_id,
              detected_location_name: data.locations?.name,
              property_context: data.address || `Lot ${data.lot_number}`,
            },
          })
          .eq('id', conversationId);
      }
    }

    // Calculate recency for status display (e.g., "just went pending")
    const updatedAt = data.updated_at ? new Date(data.updated_at) : null;
    const daysSinceUpdate = updatedAt 
      ? Math.floor((Date.now() - updatedAt.getTime()) / (1000 * 60 * 60 * 24)) 
      : null;

    // Build status message with recency context
    let statusMessage: string;
    let suggestAlternatives = false;
    
    if (data.status === 'available') {
      statusMessage = 'This home is currently available!';
    } else if (data.status === 'pending') {
      suggestAlternatives = true;
      if (daysSinceUpdate !== null && daysSinceUpdate <= 3) {
        statusMessage = daysSinceUpdate === 0
          ? 'This home just went under contract today.'
          : daysSinceUpdate === 1
            ? 'This home just went under contract yesterday.'
            : `This home went under contract ${daysSinceUpdate} days ago.`;
      } else {
        statusMessage = 'This home is pending - an offer has been accepted but not yet closed.';
      }
    } else if (data.status === 'sold') {
      suggestAlternatives = true;
      if (daysSinceUpdate !== null && daysSinceUpdate <= 7) {
        statusMessage = daysSinceUpdate === 0
          ? 'This home just sold today.'
          : daysSinceUpdate === 1
            ? 'This home just sold yesterday.'
            : `This home sold ${daysSinceUpdate} days ago.`;
      } else {
        statusMessage = 'This home has been sold.';
      }
    } else {
      suggestAlternatives = true;
      statusMessage = 'This home is no longer available.';
    }

    const property = {
      id: data.id,
      address: data.address || `Lot ${data.lot_number}`,
      full_address: [data.address, data.city, data.state, data.zip].filter(Boolean).join(', '),
      price: data.price,
      // Prices are stored in cents, convert to dollars for display
      price_formatted: data.price ? `$${(data.price / 100).toLocaleString()}${data.price_type === 'rent_monthly' ? '/mo' : ''}` : 'Contact for pricing',
      beds: data.beds,
      baths: data.baths,
      sqft: data.sqft,
      year_built: data.year_built,
      status: data.status,
      status_message: statusMessage,
      suggest_alternatives: suggestAlternatives,
      description: data.description,
      features: data.features || [],
      listing_url: data.listing_url,
      community: data.locations ? {
        id: data.locations.id,
        name: data.locations.name,
        phone: data.locations.phone,
        email: data.locations.email,
      } : null,
    };

    return { success: true, result: { found: true, property } };
  } catch (error) {
    console.error('lookupProperty error:', error);
    return { success: false, error: error.message || 'Lookup failed' };
  }
}

async function getLocations(
  supabase: any,
  agentId: string
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('locations')
      .select('id, name, city, state, phone, email, timezone')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .order('name');

    if (error) {
      console.error('Get locations error:', error);
      return { success: false, error: 'Failed to get locations' };
    }

    if (!data || data.length === 0) {
      return { 
        success: true, 
        result: { 
          locations: [], 
          message: 'No locations configured for this agent.'
        } 
      };
    }

    const locations = data.map((l: any) => ({
      id: l.id,
      name: l.name,
      city: l.city,
      state: l.state,
      full_location: [l.city, l.state].filter(Boolean).join(', '),
      phone: l.phone,
      email: l.email,
    }));

    return { 
      success: true, 
      result: { 
        locations,
        count: locations.length,
        message: `We have ${locations.length} communities. Which one are you interested in?`
      } 
    };
  } catch (error) {
    console.error('getLocations error:', error);
    return { success: false, error: error.message || 'Failed to get locations' };
  }
}

async function checkCalendarAvailability(
  supabaseUrl: string,
  args: {
    location_id: string;
    date_from?: string;
    date_to?: string;
    duration_minutes?: number;
  }
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/check-calendar-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify(args),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { 
        success: false, 
        error: errorData.message || errorData.error || 'Failed to check availability' 
      };
    }

    const data = await response.json();
    
    if (data.available_slots && data.available_slots.length > 0) {
      return { 
        success: true, 
        result: {
          location: data.location,
          available_slots: data.available_slots,
          message: `I found ${data.available_slots.length} available times at ${data.location.name}. Here are some options:`
        }
      };
    } else {
      return { 
        success: true, 
        result: {
          location: data.location,
          available_slots: [],
          message: data.message || 'No available times found for the selected dates. Would you like to check different dates?'
        }
      };
    }
  } catch (error) {
    console.error('checkCalendarAvailability error:', error);
    return { success: false, error: error.message || 'Failed to check availability' };
  }
}

async function bookAppointment(
  supabaseUrl: string,
  conversationId: string,
  conversationMetadata: any,
  args: {
    location_id: string;
    start_time: string;
    end_time?: string;
    duration_minutes?: number;
    visitor_name: string;
    visitor_email?: string;
    visitor_phone?: string;
    property_address?: string;
    notes?: string;
  }
): Promise<{ success: boolean; result?: any; error?: string }> {
  try {
    // Try to fill in visitor info from conversation metadata if not provided
    const visitorName = args.visitor_name || conversationMetadata?.lead_name || 'Guest';
    const visitorEmail = args.visitor_email || conversationMetadata?.lead_email;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/book-appointment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        ...args,
        visitor_name: visitorName,
        visitor_email: visitorEmail,
        conversation_id: conversationId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (errorData.slot_taken) {
        return { 
          success: false, 
          error: 'This time slot is no longer available. Please choose another time.',
          result: { slot_taken: true }
        };
      }
      
      if (errorData.fallback) {
        return { 
          success: false, 
          error: errorData.error,
          result: { no_calendar: true }
        };
      }
      
      return { 
        success: false, 
        error: errorData.error || 'Failed to book appointment' 
      };
    }

    const data = await response.json();
    
    return { 
      success: true, 
      result: {
        booking: data.booking,
        message: data.booking.confirmation_message
      }
    };
  } catch (error) {
    console.error('bookAppointment error:', error);
    return { success: false, error: error.message || 'Failed to book appointment' };
  }
}

// Model capability definitions - which parameters each model supports
interface ModelCapability {
  supported: boolean;
}

interface ModelCapabilities {
  temperature: ModelCapability;
  topP: ModelCapability;
  presencePenalty: ModelCapability;
  frequencyPenalty: ModelCapability;
  topK: ModelCapability;
}

const MODEL_CAPABILITIES: Record<string, ModelCapabilities> = {
  'google/gemini-2.5-flash': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true },
  },
  'google/gemini-2.5-flash-lite': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true },
  },
  'google/gemini-2.5-pro': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true },
  },
  'anthropic/claude-sonnet-4': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true },
  },
  'anthropic/claude-3.5-haiku': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: false },
    frequencyPenalty: { supported: false },
    topK: { supported: true },
  },
  'openai/gpt-4o': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: true },
    frequencyPenalty: { supported: true },
    topK: { supported: false },
  },
  'openai/gpt-4o-mini': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: true },
    frequencyPenalty: { supported: true },
    topK: { supported: false },
  },
  'meta-llama/llama-3.3-70b-instruct': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: true },
    frequencyPenalty: { supported: true },
    topK: { supported: true },
  },
  'deepseek/deepseek-chat': {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: true },
    frequencyPenalty: { supported: true },
    topK: { supported: false },
  },
};

// Get model capabilities with fallback to permissive defaults
function getModelCapabilities(model: string): ModelCapabilities {
  return MODEL_CAPABILITIES[model] || {
    temperature: { supported: true },
    topP: { supported: true },
    presencePenalty: { supported: true },
    frequencyPenalty: { supported: true },
    topK: { supported: false },
  };
}

// Select optimal model based on query complexity and RAG results
function selectModelTier(
  query: string,
  ragSimilarity: number,
  conversationLength: number,
  requiresTools: boolean,
  agentModel: string
): { model: string; tier: 'lite' | 'standard' | 'premium' } {
  const wordCount = query.split(/\s+/).length;
  
  // Tier 1: Cheapest - simple lookups with high RAG match, no tools
  // OPTIMIZED: Lowered threshold from 0.65 to 0.60 based on observed similarity distribution
  if (ragSimilarity > 0.60 && wordCount < 15 && !requiresTools && conversationLength < 5) {
    return { model: MODEL_TIERS.lite, tier: 'lite' };
  }
  
  // Tier 3: Premium - complex reasoning needed
  if (ragSimilarity < 0.35 || conversationLength > 10 || requiresTools) {
    return { model: agentModel || MODEL_TIERS.standard, tier: 'premium' };
  }
  
  // Tier 2: Default balanced
  return { model: MODEL_TIERS.standard, tier: 'standard' };
}

// ============================================
// PHASE 2: INTELLIGENT CONVERSATION SUMMARIZATION
// ============================================

interface SummarizationResult {
  summary: string;
  keptMessages: any[];
  wasNeeded: boolean;
}

/**
 * Summarize older messages instead of hard truncation.
 * Uses a cheap LLM to create a context summary before truncating.
 * Only triggers when message count exceeds SUMMARIZATION_THRESHOLD.
 */
async function summarizeConversationHistory(
  messages: any[],
  keepCount: number,
  openrouterKey: string,
  existingSummary?: string
): Promise<SummarizationResult> {
  // If under threshold, no summarization needed
  if (!messages || messages.length <= keepCount + 5) {
    return { 
      summary: existingSummary || '', 
      keptMessages: messages || [],
      wasNeeded: false 
    };
  }
  
  // Don't re-summarize if we already have a recent summary and messages aren't too long
  if (existingSummary && messages.length < SUMMARIZATION_THRESHOLD) {
    return {
      summary: existingSummary,
      keptMessages: messages.slice(-keepCount),
      wasNeeded: false
    };
  }
  
  const olderMessages = messages.slice(0, -keepCount);
  const recentMessages = messages.slice(-keepCount);
  
  // Format older messages for summarization (exclude tool messages for cleaner summary)
  const messagesToSummarize = olderMessages
    .filter(m => m.role !== 'tool' && !m.tool_calls)
    .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${typeof m.content === 'string' ? m.content.substring(0, 500) : '[non-text content]'}`)
    .join('\n');
  
  // Skip if nothing meaningful to summarize
  if (!messagesToSummarize || messagesToSummarize.length < 100) {
    return {
      summary: existingSummary || '',
      keptMessages: recentMessages,
      wasNeeded: false
    };
  }
  
  console.log(`Summarizing ${olderMessages.length} older messages (keeping ${recentMessages.length})`);
  
  try {
    const summaryPrompt = `Summarize this conversation history in 3-5 concise bullet points. Focus on:
• What the user is looking for (properties, locations, features, price range)
• Properties/options shown (include addresses or lot numbers if mentioned)
• Any stated preferences (beds, baths, location, budget)
• Actions taken (bookings, inquiries, decisions made)
• Current status of their inquiry

Conversation:
${messagesToSummarize}

Return ONLY the bullet points, no introduction or conclusion.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chatpad.ai',
        'X-Title': 'ChatPad Conversation Summary',
      },
      body: JSON.stringify({
        model: MODEL_TIERS.lite, // Use cheapest model for summaries
        messages: [{ role: 'user', content: summaryPrompt }],
        max_tokens: 300,
        temperature: 0.3, // Low temperature for consistent summaries
      }),
    });

    if (!response.ok) {
      console.error(`Summarization API error: ${response.status}`);
      // Fall back to hard truncation on error
      return {
        summary: existingSummary || '',
        keptMessages: recentMessages,
        wasNeeded: false
      };
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim() || '';
    
    if (summary) {
      console.log(`Generated conversation summary (${summary.length} chars)`);
      return {
        summary,
        keptMessages: recentMessages,
        wasNeeded: true
      };
    }
  } catch (error) {
    console.error('Summarization error:', error);
  }
  
  // Fall back to hard truncation on any error
  return {
    summary: existingSummary || '',
    keptMessages: recentMessages,
    wasNeeded: false
  };
}

/**
 * Store conversation summary in metadata for future reference
 */
async function storeConversationSummary(
  supabase: any,
  conversationId: string,
  summary: string,
  currentMetadata: any
): Promise<void> {
  try {
    await supabase.from('conversations').update({
      metadata: {
        ...currentMetadata,
        conversation_summary: summary,
        summary_generated_at: new Date().toISOString(),
      }
    }).eq('id', conversationId);
    
    console.log('Stored conversation summary in metadata');
  } catch (error) {
    console.error('Error storing conversation summary:', error);
  }
}

// ============================================
// PHASE 1: DATABASE-FIRST MESSAGE FETCHING & TOOL PERSISTENCE
// ============================================

interface DbMessage {
  id: string;
  role: string;
  content: string;
  metadata: any;
  created_at: string;
  tool_call_id: string | null;
  tool_name: string | null;
  tool_arguments: any | null;
  tool_result: any | null;
}

/**
 * Fetch conversation history from database and convert to OpenAI message format.
 * This is the source of truth - we no longer trust client-provided message history.
 */
async function fetchConversationHistory(
  supabase: any,
  conversationId: string,
  limit: number = 50
): Promise<any[]> {
  const { data: dbMessages, error } = await supabase
    .from('messages')
    .select('id, role, content, metadata, created_at, tool_call_id, tool_name, tool_arguments, tool_result')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching conversation history:', error);
    return [];
  }

  if (!dbMessages || dbMessages.length === 0) {
    return [];
  }

  // Convert database messages to OpenAI format
  return convertDbMessagesToOpenAI(dbMessages);
}

/**
 * Convert database messages to OpenAI API format.
 * Handles regular messages, tool calls, and tool results.
 */
function convertDbMessagesToOpenAI(dbMessages: DbMessage[]): any[] {
  const openAIMessages: any[] = [];

  for (const msg of dbMessages) {
    // Tool result message (response from tool execution)
    if (msg.role === 'tool' && msg.tool_call_id) {
      openAIMessages.push({
        role: 'tool',
        tool_call_id: msg.tool_call_id,
        content: msg.content,
      });
      continue;
    }

    // Assistant message with tool calls
    if (msg.role === 'assistant' && msg.tool_name && msg.tool_arguments) {
      // This is a tool call message - the assistant requested a tool
      const toolCallId = msg.tool_call_id || `call_${msg.id}`;
      openAIMessages.push({
        role: 'assistant',
        content: msg.content || null,
        tool_calls: [{
          id: toolCallId,
          type: 'function',
          function: {
            name: msg.tool_name,
            arguments: typeof msg.tool_arguments === 'string' 
              ? msg.tool_arguments 
              : JSON.stringify(msg.tool_arguments),
          }
        }]
      });
      continue;
    }

    // Regular user/assistant message
    openAIMessages.push({
      role: msg.role,
      content: msg.content,
    });
  }

  return openAIMessages;
}

/**
 * Persist a tool call to the database.
 * Called when AI requests a tool execution.
 */
async function persistToolCall(
  supabase: any,
  conversationId: string,
  toolCallId: string,
  toolName: string,
  toolArguments: any
): Promise<string | null> {
  const { data, error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'assistant',
    content: '', // Tool call messages have empty content
    tool_call_id: toolCallId,
    tool_name: toolName,
    tool_arguments: toolArguments,
    metadata: { 
      source: 'ai',
      message_type: 'tool_call',
    }
  }).select('id').single();

  if (error) {
    console.error('Error persisting tool call:', error);
    return null;
  }

  console.log(`Persisted tool call: ${toolName} (${toolCallId})`);
  return data?.id || null;
}

/**
 * Persist a tool result to the database.
 * Called after tool execution completes.
 */
async function persistToolResult(
  supabase: any,
  conversationId: string,
  toolCallId: string,
  toolName: string,
  result: any,
  success: boolean
): Promise<string | null> {
  const { data, error } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    role: 'tool',
    content: typeof result === 'string' ? result : JSON.stringify(result),
    tool_call_id: toolCallId,
    tool_name: toolName,
    tool_result: result,
    metadata: { 
      source: 'tool',
      tool_success: success,
    }
  }).select('id').single();

  if (error) {
    console.error('Error persisting tool result:', error);
    return null;
  }

  console.log(`Persisted tool result: ${toolName} (${toolCallId}) - success: ${success}`);
  return data?.id || null;
}

// ============================================
// PHASE 3: REDUNDANT TOOL CALL PREVENTION
// ============================================

interface CachedToolResult {
  toolName: string;
  arguments: any;
  result: any;
  success: boolean;
  timestamp: string;
}

/**
 * Normalize tool arguments for comparison.
 * Sorts object keys and handles common variations.
 */
function normalizeToolArgs(args: any): string {
  if (!args || typeof args !== 'object') {
    return JSON.stringify(args || {});
  }
  
  // Sort keys and normalize values
  const sorted: Record<string, any> = {};
  const keys = Object.keys(args).sort();
  
  for (const key of keys) {
    let value = args[key];
    
    // Normalize string values (lowercase, trim)
    if (typeof value === 'string') {
      value = value.toLowerCase().trim();
    }
    
    // Skip undefined/null values
    if (value !== undefined && value !== null && value !== '') {
      sorted[key] = value;
    }
  }
  
  return JSON.stringify(sorted);
}

/**
 * Check if a tool call is redundant (same tool + similar args within time window).
 * Returns cached result if found, null otherwise.
 */
function findCachedToolResult(
  dbMessages: DbMessage[],
  toolName: string,
  toolArgs: any,
  maxAgeMinutes: number = 10
): CachedToolResult | null {
  const normalizedArgs = normalizeToolArgs(toolArgs);
  const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000);
  
  // Look through messages for matching tool calls and their results
  for (let i = dbMessages.length - 1; i >= 0; i--) {
    const msg = dbMessages[i];
    
    // Skip if not a tool call
    if (msg.role !== 'assistant' || !msg.tool_name || !msg.tool_arguments) {
      continue;
    }
    
    // Skip if older than max age
    const msgTime = new Date(msg.created_at);
    if (msgTime < cutoffTime) {
      continue;
    }
    
    // Skip if different tool
    if (msg.tool_name !== toolName) {
      continue;
    }
    
    // Check if arguments match
    const storedNormalizedArgs = normalizeToolArgs(msg.tool_arguments);
    if (storedNormalizedArgs !== normalizedArgs) {
      continue;
    }
    
    // Found matching tool call - now find the corresponding result
    // The result should be the next 'tool' role message with matching tool_call_id
    const toolCallId = msg.tool_call_id;
    
    for (let j = i + 1; j < dbMessages.length; j++) {
      const resultMsg = dbMessages[j];
      if (resultMsg.role === 'tool' && resultMsg.tool_call_id === toolCallId) {
        console.log(`PHASE 3: Found cached result for ${toolName} (${maxAgeMinutes}min window)`);
        return {
          toolName: msg.tool_name,
          arguments: msg.tool_arguments,
          result: resultMsg.tool_result,
          success: resultMsg.metadata?.tool_success !== false,
          timestamp: msg.created_at,
        };
      }
    }
  }
  
  return null;
}

/**
 * Get all recent tool results from conversation history for cache lookup.
 */
async function getRecentToolCalls(
  supabase: any,
  conversationId: string,
  maxAgeMinutes: number = 10
): Promise<DbMessage[]> {
  const cutoffTime = new Date(Date.now() - maxAgeMinutes * 60 * 1000).toISOString();
  
  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, role, content, metadata, created_at, tool_call_id, tool_name, tool_arguments, tool_result')
    .eq('conversation_id', conversationId)
    .gte('created_at', cutoffTime)
    .in('role', ['assistant', 'tool'])
    .order('created_at', { ascending: true });
  
  if (error) {
    console.error('Error fetching recent tool calls:', error);
    return [];
  }
  
  return messages || [];
}

// ============================================
// PHASE 4: SEMANTIC MEMORY STORE
// ============================================

interface SemanticMemory {
  memory_id: string;
  memory_type: string;
  content: string;
  confidence: number;
  similarity: number;
}

/**
 * Search for relevant memories based on the current query.
 * Retrieves memories for this agent (and optionally lead) that are semantically similar.
 */
async function searchSemanticMemories(
  supabase: any,
  agentId: string,
  leadId: string | null,
  queryEmbedding: number[],
  matchThreshold: number = 0.6,
  matchCount: number = 5
): Promise<SemanticMemory[]> {
  const embeddingVector = `[${queryEmbedding.join(',')}]`;
  
  const { data, error } = await supabase.rpc('search_conversation_memories', {
    p_agent_id: agentId,
    p_lead_id: leadId,
    p_query_embedding: embeddingVector,
    p_match_threshold: matchThreshold,
    p_match_count: matchCount,
  });
  
  if (error) {
    console.error('Error searching semantic memories:', error);
    return [];
  }
  
  // Update access stats for retrieved memories
  if (data && data.length > 0) {
    const memoryIds = data.map((m: SemanticMemory) => m.memory_id);
    supabase
      .from('conversation_memories')
      .update({ 
        last_accessed_at: new Date().toISOString(),
        access_count: supabase.rpc('increment', { x: 1 })
      })
      .in('id', memoryIds)
      .then(() => {})
      .catch(() => {});
  }
  
  return data || [];
}

/**
 * Extract memories from a conversation exchange using the AI model.
 * Called after generating a response to persist important information.
 */
async function extractAndStoreMemories(
  supabase: any,
  agentId: string,
  leadId: string | null,
  conversationId: string,
  userMessage: string,
  assistantResponse: string,
  apiKey: string
): Promise<void> {
  try {
    // Use a fast model for extraction
    const extractionPrompt = `Analyze this conversation exchange and extract any important facts, preferences, or information that should be remembered for future conversations.

USER MESSAGE: "${userMessage}"

ASSISTANT RESPONSE: "${assistantResponse}"

Extract ONLY if there's genuinely memorable information. Output JSON array of memories:
[
  {
    "type": "fact" | "preference" | "entity" | "context" | "goal",
    "content": "concise statement of the memory",
    "confidence": 0.0-1.0
  }
]

Types:
- fact: Specific information stated by user (e.g., "User has 3 children", "User lives in Florida")
- preference: User preferences or likes/dislikes (e.g., "User prefers 2-bedroom homes", "User wants a quiet neighborhood")
- entity: Named entities important to user (e.g., "User's dog is named Max", "User works at ABC Corp")
- context: Situational context (e.g., "User is relocating for work", "User is a first-time buyer")
- goal: User's objectives or intentions (e.g., "User wants to schedule a tour this week", "User is comparing 3 communities")

Rules:
- Only extract genuinely useful, specific information
- Skip greetings, pleasantries, generic questions
- Skip information already implied by the conversation flow
- Confidence: 1.0 = explicitly stated, 0.7 = strongly implied, 0.5 = somewhat inferred
- Return empty array [] if nothing memorable

Output ONLY valid JSON array, no other text.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://chatpad.ai',
        'X-Title': 'ChatPad',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{ role: 'user', content: extractionPrompt }],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Memory extraction API error:', response.status);
      return;
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content || '[]';
    
    // Parse the JSON response
    let memories: Array<{ type: string; content: string; confidence: number }> = [];
    try {
      // Handle potential markdown code blocks
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim();
      memories = JSON.parse(jsonStr);
    } catch (e) {
      console.log('No memories to extract or invalid JSON');
      return;
    }

    if (!Array.isArray(memories) || memories.length === 0) {
      return;
    }

    console.log(`PHASE 4: Extracted ${memories.length} memories from conversation`);

    // Generate embeddings and store memories
    for (const memory of memories) {
      if (!memory.content || !memory.type) continue;
      
      try {
        // Generate embedding for the memory
        const embedding = await generateEmbedding(memory.content);
        const embeddingVector = `[${embedding.join(',')}]`;
        
        // Check for duplicate memories (same content)
        const { data: existing } = await supabase
          .from('conversation_memories')
          .select('id')
          .eq('agent_id', agentId)
          .eq('content', memory.content)
          .maybeSingle();
        
        if (existing) {
          console.log(`PHASE 4: Skipping duplicate memory: "${memory.content.substring(0, 50)}..."`);
          continue;
        }
        
        // Store the memory
        const { error: insertError } = await supabase
          .from('conversation_memories')
          .insert({
            agent_id: agentId,
            lead_id: leadId,
            conversation_id: conversationId,
            memory_type: memory.type,
            content: memory.content,
            embedding: embeddingVector,
            confidence: memory.confidence || 0.8,
          });
        
        if (insertError) {
          console.error('Error storing memory:', insertError);
        } else {
          console.log(`PHASE 4: Stored ${memory.type} memory: "${memory.content.substring(0, 50)}..."`);
        }
      } catch (embedError) {
        console.error('Error generating memory embedding:', embedError);
      }
    }
  } catch (error) {
    console.error('Memory extraction error:', error);
  }
}

/**
 * Format memories for injection into system prompt.
 */
function formatMemoriesForPrompt(memories: SemanticMemory[]): string {
  if (!memories || memories.length === 0) return '';
  
  const grouped: Record<string, string[]> = {};
  for (const mem of memories) {
    if (!grouped[mem.memory_type]) {
      grouped[mem.memory_type] = [];
    }
    grouped[mem.memory_type].push(mem.content);
  }
  
  const sections: string[] = [];
  
  if (grouped.fact?.length) {
    sections.push(`Known Facts: ${grouped.fact.join('; ')}`);
  }
  if (grouped.preference?.length) {
    sections.push(`Preferences: ${grouped.preference.join('; ')}`);
  }
  if (grouped.entity?.length) {
    sections.push(`Important Entities: ${grouped.entity.join('; ')}`);
  }
  if (grouped.goal?.length) {
    sections.push(`Goals: ${grouped.goal.join('; ')}`);
  }
  if (grouped.context?.length) {
    sections.push(`Context: ${grouped.context.join('; ')}`);
  }
  
  return sections.join('\n');
}

// Normalize query for cache lookup (lowercase, trim, remove extra whitespace)
function normalizeQuery(query: string): string {
  return query.toLowerCase().trim().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '');
}

// Split AI response into message chunks using ||| delimiter
function splitResponseIntoChunks(response: string, maxChunks = 4): string[] {
  const DELIMITER = '|||';
  
  // If no delimiter, return as single chunk
  if (!response.includes(DELIMITER)) {
    return [response.trim()];
  }
  
  // Split on delimiter
  const chunks = response
    .split(DELIMITER)
    .map(chunk => chunk.trim())
    .filter(chunk => chunk.length > 0);
  
  // Cap at maxChunks
  return chunks.slice(0, maxChunks);
}

// Hash query for cache key
async function hashQuery(query: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(query);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check query embedding cache
async function getCachedEmbedding(supabase: any, queryHash: string, agentId: string): Promise<number[] | null> {
  const { data, error } = await supabase
    .from('query_embedding_cache')
    .select('embedding')
    .eq('query_hash', queryHash)
    .eq('agent_id', agentId)
    .single();
  
  if (error || !data?.embedding) return null;
  
  // Update hit count and last used
  supabase
    .from('query_embedding_cache')
    .update({ hit_count: supabase.rpc('increment', { x: 1 }), last_used_at: new Date().toISOString() })
    .eq('query_hash', queryHash)
    .eq('agent_id', agentId)
    .then(() => {})
    .catch(() => {});
  
  // Parse embedding string to array
  try {
    const embeddingStr = data.embedding as string;
    const matches = embeddingStr.match(/[\d.-]+/g);
    return matches ? matches.map(Number) : null;
  } catch {
    return null;
  }
}

// Cache query embedding with 7-day TTL
async function cacheQueryEmbedding(supabase: any, queryHash: string, normalized: string, embedding: number[], agentId: string): Promise<void> {
  try {
    const embeddingVector = `[${embedding.join(',')}]`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days TTL
    const { error } = await supabase
      .from('query_embedding_cache')
      .upsert({
        query_hash: queryHash,
        query_normalized: normalized,
        embedding: embeddingVector,
        agent_id: agentId,
        expires_at: expiresAt, // Add TTL for cache cleanup
      }, { onConflict: 'query_hash' });
    
    if (error) {
      console.error('Failed to cache embedding:', error);
    }
  } catch (err) {
    console.error('Failed to cache embedding:', err);
  }
}

// Check response cache for high-confidence cached responses
async function getCachedResponse(supabase: any, queryHash: string, agentId: string): Promise<{ content: string; similarity: number } | null> {
  const { data, error } = await supabase
    .from('response_cache')
    .select('response_content, similarity_score')
    .eq('query_hash', queryHash)
    .eq('agent_id', agentId)
    .gt('expires_at', new Date().toISOString())
    .single();
  
  if (error || !data) return null;
  
  // Update hit count
  supabase
    .from('response_cache')
    .update({ hit_count: supabase.rpc('increment', { x: 1 }), last_used_at: new Date().toISOString() })
    .eq('query_hash', queryHash)
    .eq('agent_id', agentId)
    .then(() => {})
    .catch(() => {});
  
  console.log('Cache HIT for response, similarity:', data.similarity_score);
  return { content: data.response_content, similarity: data.similarity_score };
}

// Cache high-confidence response (AGGRESSIVE CACHING - lowered threshold)
async function cacheResponse(supabase: any, queryHash: string, agentId: string, content: string, similarity: number): Promise<void> {
  try {
    // COST OPTIMIZATION: Cache responses with moderate+ similarity (was 0.92, now 0.60)
    // OPTIMIZED: Lowered from 0.65 to 0.60 based on observed 77% of cached responses in 0.65-0.70 range
    if (similarity < 0.60) return;
    
    const { error } = await supabase
      .from('response_cache')
      .upsert({
        query_hash: queryHash,
        agent_id: agentId,
        response_content: content,
        similarity_score: similarity,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days (was 7)
      }, { onConflict: 'query_hash,agent_id' });
    
    if (error) {
      console.error('Failed to cache response:', error);
    }
  } catch (err) {
    console.error('Failed to cache response:', err);
  }
}

// Generate embedding using Qwen3 via OpenRouter (consolidated billing)
async function generateEmbedding(query: string): Promise<number[]> {
  const openrouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const response = await fetch('https://openrouter.ai/api/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://chatpad.ai',
      'X-Title': 'ChatPad',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: query,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Embedding generation error:', error);
    throw new Error('Failed to generate embedding');
  }

  const data = await response.json();
  const fullEmbedding = data.data[0].embedding;
  
  // Qwen3 returns 4096 dimensions - truncate to 1024 via Matryoshka (MRL)
  // This maintains quality while reducing storage and compute costs
  return fullEmbedding.slice(0, EMBEDDING_DIMENSIONS);
}

// Search for relevant knowledge chunks (with fallback to legacy document search)
async function searchKnowledge(
  supabase: any,
  agentId: string,
  queryEmbedding: number[],
  matchThreshold: number = 0.7,
  matchCount: number = 5
): Promise<{ content: string; source: string; type: string; similarity: number; chunkIndex?: number; sourceUrl?: string }[]> {
  const embeddingVector = `[${queryEmbedding.join(',')}]`;
  const results: { content: string; source: string; type: string; similarity: number; chunkIndex?: number; sourceUrl?: string }[] = [];

  // Try new chunk-level search first
  const { data: chunkData, error: chunkError } = await supabase.rpc('search_knowledge_chunks', {
    p_agent_id: agentId,
    p_query_embedding: embeddingVector,
    p_match_threshold: matchThreshold,
    p_match_count: matchCount,
  });

  if (!chunkError && chunkData && chunkData.length > 0) {
    console.log(`Found ${chunkData.length} relevant chunks via chunk-level search`);
    
    // Get source URLs for the chunks
    const sourceIds = [...new Set(chunkData.map((c: any) => c.source_id))];
    const { data: sourceData } = await supabase
      .from('knowledge_sources')
      .select('id, source, type')
      .in('id', sourceIds);
    
    const sourceMap = new Map(sourceData?.map((s: any) => [s.id, s]) || []);
    
    results.push(...chunkData.map((chunk: any) => {
      const sourceInfo = sourceMap.get(chunk.source_id);
      // Include the source URL for URL-type sources
      const sourceUrl = sourceInfo?.type === 'url' ? sourceInfo.source : undefined;
      return {
        content: chunk.content,
        source: chunk.source_name,
        type: chunk.source_type,
        similarity: chunk.similarity,
        chunkIndex: chunk.chunk_index,
        sourceUrl,
      };
    }));
  } else {
    // Fallback to legacy document-level search for backwards compatibility
    console.log('Falling back to document-level search');
    const { data, error } = await supabase.rpc('search_knowledge_sources', {
      p_agent_id: agentId,
      p_query_embedding: embeddingVector,
      p_match_threshold: matchThreshold,
      p_match_count: matchCount,
    });

    if (!error && data) {
      results.push(...data.map((d: any) => ({
        content: d.content,
        source: d.source,
        type: d.type,
        similarity: d.similarity,
        // For URL sources, the source IS the URL
        sourceUrl: d.type === 'url' ? d.source : undefined,
      })));
    }
  }

  // Also search Help Articles for RAG
  try {
    console.log(`Searching help articles with threshold: ${matchThreshold}`);
    const { data: helpArticles, error: helpError } = await supabase.rpc('search_help_articles', {
      p_agent_id: agentId,
      p_query_embedding: embeddingVector,
      p_match_threshold: matchThreshold,
      p_match_count: MAX_RAG_CHUNKS, // Phase 6: Limit help articles to top chunks
    });

    if (helpError) {
      console.error('Help article search RPC error:', helpError);
    } else if (!helpArticles || helpArticles.length === 0) {
      console.log('No help articles found above threshold');
    } else {
      console.log(`Found ${helpArticles.length} relevant help articles:`, 
        helpArticles.map((a: any) => ({ title: a.title, similarity: a.similarity?.toFixed(3) })));
      results.push(...helpArticles.map((article: any) => ({
        content: article.content,
        source: `Help: ${article.title}${article.category_name ? ` (${article.category_name})` : ''}`,
        type: 'help_article',
        similarity: article.similarity,
        // Help articles don't have external URLs
      })));
    }
  } catch (helpSearchError) {
    console.error('Help article search error (continuing without):', helpSearchError);
  }

  // PHASE 6: Sort combined results by similarity and return top MAX_RAG_CHUNKS (3 chunks)
  return results
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MAX_RAG_CHUNKS);
}

// Geo-IP lookup using ip-api.com (free, no API key needed)
async function getLocationFromIP(ip: string): Promise<{ country: string; city: string; countryCode: string; region: string }> {
  if (!ip || ip === 'unknown') {
    return { country: 'Unknown', city: '', countryCode: '', region: '' };
  }
  
  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=country,countryCode,city,regionName,status`, {
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    const data = await response.json();
    if (data.status === 'success') {
      console.log(`Geo-IP lookup for ${ip}: ${data.city}, ${data.regionName}, ${data.country} (${data.countryCode})`);
      return { 
        country: data.country || 'Unknown', 
        city: data.city || '',
        countryCode: data.countryCode || '',
        region: data.regionName || '',
      };
    }
  } catch (error) {
    console.error('Geo-IP lookup failed:', error);
  }
  return { country: 'Unknown', city: '', countryCode: '', region: '' };
}

// Parse user agent string for device info
function parseUserAgent(userAgent: string | null): { device: string; browser: string; os: string } {
  if (!userAgent) return { device: 'unknown', browser: 'unknown', os: 'unknown' };
  
  let device = 'desktop';
  if (/mobile/i.test(userAgent)) device = 'mobile';
  else if (/tablet|ipad/i.test(userAgent)) device = 'tablet';
  
  let browser = 'unknown';
  if (/chrome/i.test(userAgent) && !/edge/i.test(userAgent)) browser = 'Chrome';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/firefox/i.test(userAgent)) browser = 'Firefox';
  else if (/edge/i.test(userAgent)) browser = 'Edge';
  
  let os = 'unknown';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad/i.test(userAgent)) os = 'iOS';
  
  return { device, browser, os };
}

// Check if request is from widget (has valid widget origin)
function isWidgetRequest(req: Request): boolean {
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  return !!(origin || referer);
}

// ============================================
// CUSTOM TOOL SECURITY & RELIABILITY
// ============================================

// SSRF Protection: Block access to private IPs, localhost, and cloud metadata endpoints
const BLOCKED_URL_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\.\d+\.\d+\.\d+/i,
  /^https?:\/\/0\.0\.0\.0/i, // Bind-all address
  /^https?:\/\/10\.\d+\.\d+\.\d+/i,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+/i,
  /^https?:\/\/192\.168\.\d+\.\d+/i,
  /^https?:\/\/169\.254\.\d+\.\d+/i, // Link-local
  /^https?:\/\/\[::1\]/i, // IPv6 localhost
  /^https?:\/\/\[fe80:/i, // IPv6 link-local
  /^https?:\/\/\[fc00:/i, // IPv6 unique local address
  /^https?:\/\/fd00:/i, // Private IPv6
  /^https?:\/\/metadata\.google\.internal/i,
  /^https?:\/\/metadata\.goog/i, // GCP alternative
  /^https?:\/\/instance-data/i, // AWS alternative hostname
  /^https?:\/\/169\.254\.169\.254/i, // AWS/GCP metadata
  /^https?:\/\/100\.100\.100\.200/i, // Alibaba metadata
];

/**
 * Check if a URL is blocked for SSRF protection
 */
function isBlockedUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    // Block non-HTTP(S) protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return true;
    }
    // Check against blocked patterns
    return BLOCKED_URL_PATTERNS.some(pattern => pattern.test(url));
  } catch {
    return true; // Invalid URLs are blocked
  }
}

// Response size limit (1MB) to prevent memory issues
const MAX_RESPONSE_SIZE_BYTES = 1 * 1024 * 1024;

// Retry configuration
const MAX_RETRIES = 2;
const INITIAL_RETRY_DELAY_MS = 500;

// Headers that should be masked in logs
const SENSITIVE_HEADER_PATTERNS = [
  /^authorization$/i,
  /^x-api-key$/i,
  /^api-key$/i,
  /^bearer$/i,
  /^token$/i,
  /^secret$/i,
  /^password$/i,
  /^credential/i,
];

/**
 * Mask sensitive header values for logging
 */
function maskHeadersForLogging(headers: Record<string, string>): Record<string, string> {
  const masked: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    const isSensitive = SENSITIVE_HEADER_PATTERNS.some(pattern => pattern.test(key));
    masked[key] = isSensitive ? `***${value.slice(-4)}` : value;
  }
  return masked;
}

/**
 * Delay helper for retry backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Call a tool endpoint with retry logic, SSRF protection, and response size limits
 */
async function callToolEndpoint(
  tool: { name: string; endpoint_url: string; headers: any; timeout_ms: number },
  args: any
): Promise<{ success: boolean; result?: any; error?: string }> {
  // SSRF Protection: Validate URL before making request
  if (isBlockedUrl(tool.endpoint_url)) {
    console.error(`Tool ${tool.name} blocked: URL fails SSRF validation`, { url: tool.endpoint_url });
    return { success: false, error: 'Tool endpoint URL is not allowed (security restriction)' };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(tool.headers || {}),
  };

  // Log with masked headers for security
  const maskedHeaders = maskHeadersForLogging(headers);
  console.log(`Calling tool ${tool.name} at ${tool.endpoint_url}`, { 
    args, 
    headers: maskedHeaders,
    timeout_ms: tool.timeout_ms 
  });

  let lastError: string = 'Unknown error';
  
  // Retry loop with exponential backoff
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Add backoff delay for retries
      if (attempt > 0) {
        const backoffMs = INITIAL_RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Tool ${tool.name} retry ${attempt}/${MAX_RETRIES} after ${backoffMs}ms`);
        await delay(backoffMs);
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), tool.timeout_ms || 10000);

      const response = await fetch(tool.endpoint_url, {
        method: 'POST',
        headers,
        body: JSON.stringify(args),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check response size from Content-Length header first
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE_BYTES) {
        console.error(`Tool ${tool.name} response too large: ${contentLength} bytes`);
        return { success: false, error: `Response too large (max ${MAX_RESPONSE_SIZE_BYTES / 1024 / 1024}MB)` };
      }

      if (!response.ok) {
        const errorText = await response.text();
        lastError = `HTTP ${response.status}: ${errorText.substring(0, 200)}`;
        
        // Only retry on 5xx errors or network issues, not on 4xx client errors
        if (response.status >= 500 && attempt < MAX_RETRIES) {
          console.warn(`Tool ${tool.name} server error (attempt ${attempt + 1}):`, response.status);
          continue;
        }
        
        console.error(`Tool ${tool.name} returned error:`, response.status, errorText.substring(0, 500));
        return { success: false, error: lastError };
      }

      // Read response with size limit
      const reader = response.body?.getReader();
      if (!reader) {
        return { success: false, error: 'No response body' };
      }

      let totalBytes = 0;
      const chunks: Uint8Array[] = [];
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        totalBytes += value.length;
        if (totalBytes > MAX_RESPONSE_SIZE_BYTES) {
          reader.cancel();
          console.error(`Tool ${tool.name} response exceeded size limit during read`);
          return { success: false, error: `Response too large (max ${MAX_RESPONSE_SIZE_BYTES / 1024 / 1024}MB)` };
        }
        
        chunks.push(value);
      }

      // Combine chunks and parse JSON
      const combined = new Uint8Array(totalBytes);
      let offset = 0;
      for (const chunk of chunks) {
        combined.set(chunk, offset);
        offset += chunk.length;
      }
      
      const responseText = new TextDecoder().decode(combined);
      const result = JSON.parse(responseText);
      
      console.log(`Tool ${tool.name} returned successfully`, { 
        responseSize: totalBytes,
        attempts: attempt + 1 
      });
      return { success: true, result };
      
    } catch (error) {
      if (error.name === 'AbortError') {
        lastError = 'Request timed out';
        console.error(`Tool ${tool.name} timed out after ${tool.timeout_ms}ms (attempt ${attempt + 1})`);
        // Retry on timeout
        if (attempt < MAX_RETRIES) continue;
      } else if (error instanceof SyntaxError) {
        // JSON parse error - don't retry
        console.error(`Tool ${tool.name} returned invalid JSON:`, error.message);
        return { success: false, error: 'Invalid JSON response from tool' };
      } else {
        lastError = error.message || 'Unknown error';
        console.error(`Tool ${tool.name} error (attempt ${attempt + 1}):`, error);
        // Retry on network errors
        if (attempt < MAX_RETRIES) continue;
      }
    }
  }

  // All retries exhausted
  console.error(`Tool ${tool.name} failed after ${MAX_RETRIES + 1} attempts:`, lastError);
  return { success: false, error: lastError };
}

serve(async (req) => {
  // Generate unique request ID for tracing
  const requestId = crypto.randomUUID();
  const startTime = performance.now();
  const log = createLogger(requestId);
  const timings: Record<string, number> = {};
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, conversationId, messages, leadId, pageVisits, referrerJourney, visitorId, previewMode, browserLanguage } = await req.json();

    // Log incoming request
    log.info('Request received', {
      agentId,
      conversationId: conversationId || 'new',
      messagesCount: messages?.length || 0,
      pageVisitsCount: pageVisits?.length || 0,
      hasReferrerJourney: !!referrerJourney,
      visitorId: visitorId || null,
      previewMode: !!previewMode,
      browserLanguage: browserLanguage || null,
    });

    // Validate required fields
    if (!agentId) {
      return createErrorResponse(
        requestId,
        ErrorCodes.INVALID_REQUEST,
        'Agent ID is required',
        400,
        performance.now() - startTime
      );
    }

    // Validate message size limits
    const userMessage = messages?.[0];
    if (userMessage?.content && userMessage.content.length > MAX_MESSAGE_LENGTH) {
      log.warn('Message too long', { 
        length: userMessage.content.length, 
        maxLength: MAX_MESSAGE_LENGTH 
      });
      return createErrorResponse(
        requestId,
        ErrorCodes.MESSAGE_TOO_LONG,
        `Message too long. Maximum ${MAX_MESSAGE_LENGTH.toLocaleString()} characters allowed.`,
        400,
        performance.now() - startTime
      );
    }

    // Validate file count
    if (userMessage?.files && userMessage.files.length > MAX_FILES_PER_MESSAGE) {
      log.warn('Too many files', { 
        count: userMessage.files.length, 
        maxFiles: MAX_FILES_PER_MESSAGE 
      });
      return createErrorResponse(
        requestId,
        ErrorCodes.TOO_MANY_FILES,
        `Too many files. Maximum ${MAX_FILES_PER_MESSAGE} files allowed.`,
        400,
        performance.now() - startTime
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check authentication - widget requests bypass API key validation
    const authHeader = req.headers.get('authorization');
    const isFromWidget = isWidgetRequest(req);
    
    // Widget requests are allowed through without API key validation
    if (isFromWidget) {
      log.debug('Widget origin detected - bypassing API key validation');
    } else if (authHeader && authHeader.startsWith('Bearer ')) {
      // Non-widget requests with API key - validate it
      const apiKey = authHeader.substring(7);
      
      // Hash the API key for comparison
      const keyHash = await hashApiKey(apiKey);
      
      // Validate API key and check rate limits
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_api_key', { p_key_hash: keyHash, p_agent_id: agentId });
      
      if (validationError) {
        log.error('API key validation error', { error: validationError.message });
        return createErrorResponse(
          requestId,
          ErrorCodes.INTERNAL_ERROR,
          'API key validation failed',
          500,
          performance.now() - startTime
        );
      }
      
      const validation = validationResult?.[0];
      
      if (!validation?.valid) {
        log.warn('Invalid API key attempt', { agentId });
        return createErrorResponse(
          requestId,
          ErrorCodes.UNAUTHORIZED,
          validation?.error_message || 'Invalid API key',
          401,
          performance.now() - startTime
        );
      }
      
      if (validation.rate_limited) {
        log.warn('Rate limited API key', { keyId: validation.key_id });
        return createErrorResponse(
          requestId,
          ErrorCodes.RATE_LIMITED,
          validation.error_message || 'Rate limit exceeded',
          429,
          performance.now() - startTime
        );
      }
      
      log.info('API key authenticated', { keyId: validation.key_id });
    } else {
      // No API key and not from widget - reject
      log.warn('Rejected - no API key and not from widget origin');
      return createErrorResponse(
        requestId,
        ErrorCodes.UNAUTHORIZED,
        'API key required. Include Authorization: Bearer <api_key> header.',
        401,
        performance.now() - startTime
      );
    }

    // Get agent configuration and user_id
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('system_prompt, model, user_id, temperature, max_tokens, deployment_config')
      .eq('id', agentId)
      .single();

    if (agentError) throw agentError;

    const deploymentConfig = (agent.deployment_config || {}) as { embedded_chat?: Record<string, unknown> };

    // Fetch enabled custom tools for this agent
    const { data: agentTools, error: toolsError } = await supabase
      .from('agent_tools')
      .select('id, name, description, parameters, endpoint_url, headers, timeout_ms')
      .eq('agent_id', agentId)
      .eq('enabled', true);

    if (toolsError) {
      console.error('Error fetching tools:', toolsError);
    }

    // Filter to only tools with valid endpoint URLs
    const enabledTools = (agentTools || []).filter(tool => tool.endpoint_url);
    console.log(`Found ${enabledTools.length} enabled tools with endpoints for agent ${agentId}`);

    // Check if agent has locations (enables booking tools)
    const { data: agentLocations } = await supabase
      .from('locations')
      .select('id')
      .eq('agent_id', agentId)
      .eq('is_active', true)
      .limit(1);
    
    const hasLocations = agentLocations && agentLocations.length > 0;
    console.log(`Agent has locations: ${hasLocations}`);

    // Format tools for OpenAI/Lovable AI API
    // Include booking tools if agent has locations configured
    const userDefinedTools = enabledTools.length > 0 ? enabledTools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters || { type: 'object', properties: {} },
      }
    })) : [];
    
    const formattedTools = hasLocations 
      ? [...userDefinedTools, ...BOOKING_TOOLS]
      : userDefinedTools.length > 0 ? userDefinedTools : undefined;

    // Capture request metadata
    const ipAddress = req.headers.get('cf-connecting-ip') || 
                      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      req.headers.get('x-real-ip') || 
                      'unknown';
    const userAgent = req.headers.get('user-agent');
    const referer = req.headers.get('referer') || null;
    const { device, browser, os } = parseUserAgent(userAgent);
    
    // Get location from IP address via geo-IP lookup
    const { country, city, countryCode, region } = await getLocationFromIP(ipAddress);

    // Create or get conversation (skip for preview mode)
    let activeConversationId = conversationId;
    
    // Preview mode: skip all persistence, use ephemeral conversation
    if (previewMode) {
      log.info('Preview mode - skipping conversation persistence');
      activeConversationId = `preview-${crypto.randomUUID()}`;
    } else if (!activeConversationId || activeConversationId === 'new' || activeConversationId.startsWith('conv_') || activeConversationId.startsWith('migrated_')) {
      // Create a new conversation in the database
      const conversationMetadata: any = {
        ip_address: ipAddress,
        country,
        city,
        country_code: countryCode,
        region,
        device,
        browser,
        os,
        referer_url: referer,
        session_started_at: new Date().toISOString(),
        lead_id: leadId || null,
        tags: [],
        messages_count: 0,
        visited_pages: [] as Array<{ url: string; entered_at: string; duration_ms: number }>,
        visitor_id: visitorId || null,
      };

      // Add referrer journey if provided
      if (referrerJourney) {
        conversationMetadata.referrer_journey = {
          referrer_url: referrerJourney.referrer_url || null,
          landing_page: referrerJourney.landing_page || null,
          utm_source: referrerJourney.utm_source || null,
          utm_medium: referrerJourney.utm_medium || null,
          utm_campaign: referrerJourney.utm_campaign || null,
          utm_term: referrerJourney.utm_term || null,
          utm_content: referrerJourney.utm_content || null,
          entry_type: referrerJourney.entry_type || 'direct',
        };
        console.log('Added referrer journey to new conversation:', conversationMetadata.referrer_journey);
      }

      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          agent_id: agentId,
          user_id: agent.user_id,
          status: 'active',
          metadata: conversationMetadata,
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Error creating conversation:', createError);
        throw createError;
      }

      activeConversationId = newConversation.id;
      console.log(`Created new conversation: ${activeConversationId}`);
    }

    // Check conversation status (for human takeover) - skip for preview mode
    let conversation: { status: string; metadata: any } | null = null;
    if (!previewMode) {
      const { data: convData } = await supabase
        .from('conversations')
        .select('status, metadata')
        .eq('id', activeConversationId)
        .single();
      conversation = convData;

      if (conversation?.status === 'human_takeover') {
        // Don't call AI - just save the user message and return
        if (messages && messages.length > 0) {
          const lastUserMessage = messages[messages.length - 1];
          if (lastUserMessage.role === 'user') {
            await supabase.from('messages').insert({
              conversation_id: activeConversationId,
              role: 'user',
              content: lastUserMessage.content,
              metadata: { 
                source: 'widget',
                files: lastUserMessage.files || undefined,
              }
            });

            // Update conversation metadata
            const currentMetadata = conversation.metadata || {};
            await supabase
              .from('conversations')
              .update({
                metadata: {
                  ...currentMetadata,
                  messages_count: (currentMetadata.messages_count || 0) + 1,
                },
                updated_at: new Date().toISOString(),
              })
              .eq('id', activeConversationId);
          }
        }

        // Fetch the team member who took over
        let takenOverBy = null;
        const { data: takeover } = await supabase
          .from('conversation_takeovers')
          .select('taken_over_by')
          .eq('conversation_id', activeConversationId)
          .is('returned_to_ai_at', null)
          .order('taken_over_at', { ascending: false })
          .limit(1)
          .single();
        
        if (takeover?.taken_over_by) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('display_name, avatar_url')
            .eq('user_id', takeover.taken_over_by)
            .single();
          
          if (profile) {
            takenOverBy = {
              name: profile.display_name || 'Team Member',
              avatar: profile.avatar_url,
            };
          }
        }

        return new Response(
          JSON.stringify({
            conversationId: activeConversationId,
            status: 'human_takeover',
            takenOverBy,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      // Check if conversation is closed - save message but return friendly notice
      if (conversation?.status === 'closed') {
        console.log('Conversation is closed, saving message but not calling AI');
        
        // Still save the user message for context
        if (messages && messages.length > 0) {
          const lastUserMessage = messages[messages.length - 1];
          if (lastUserMessage.role === 'user') {
            await supabase.from('messages').insert({
              conversation_id: activeConversationId,
              role: 'user',
              content: lastUserMessage.content,
              metadata: { 
                source: 'widget',
                files: lastUserMessage.files || undefined,
              }
            });
          }
        }

        return new Response(
          JSON.stringify({
            conversationId: activeConversationId,
            status: 'closed',
            response: 'This conversation has been closed. Please start a new conversation if you need further assistance.',
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Check if this is a greeting request (special message to trigger AI greeting)
    const isGreetingRequest = messages && messages.length === 1 && 
      messages[0].role === 'user' && 
      messages[0].content === '__GREETING_REQUEST__';
    
    // Save the user message to database (skip for greeting requests and preview mode)
    let userMessageId: string | undefined;
    if (messages && messages.length > 0 && !isGreetingRequest && !previewMode) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage.role === 'user') {
        const { data: userMsg, error: msgError } = await supabase.from('messages').insert({
          conversation_id: activeConversationId,
          role: 'user',
          content: lastUserMessage.content,
          metadata: { 
            source: 'widget',
            files: lastUserMessage.files || undefined,
          }
        }).select('id').single();
        
        if (msgError) {
          console.error('Error saving user message:', msgError);
        } else {
          userMessageId = userMsg?.id;
        }
        
        // Update last_user_message_at immediately when user message is saved
        const currentMeta = conversation?.metadata || {};
        await supabase
          .from('conversations')
          .update({
            metadata: {
              ...currentMeta,
              last_user_message_at: new Date().toISOString(),
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', activeConversationId);
      }
    }

    // ============================================
    // PHASE 1: DATABASE-FIRST MESSAGE FETCHING
    // Fetch conversation history from database (source of truth)
    // instead of trusting client-provided message history
    // (Skip for preview mode - ephemeral, no history)
    // ============================================
    let dbConversationHistory: any[] = [];
    if (activeConversationId && !isGreetingRequest && !previewMode) {
      dbConversationHistory = await fetchConversationHistory(supabase, activeConversationId);
      console.log(`Fetched ${dbConversationHistory.length} messages from database (including ${dbConversationHistory.filter((m: any) => m.role === 'tool').length} tool results)`);
    }
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id, plans(limits)')
      .eq('user_id', agent.user_id)
      .eq('status', 'active')
      .maybeSingle();

    // Default free plan limit
    let maxApiCalls = 1000;
    
    if (subscription?.plans) {
      const plan = subscription.plans as { limits?: { max_api_calls_per_month?: number } };
      const limits = plan.limits;
      maxApiCalls = limits?.max_api_calls_per_month || 1000;
    }

    // Get current month's API usage
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const { data: usageMetrics } = await supabase
      .from('usage_metrics')
      .select('api_calls_count')
      .eq('user_id', agent.user_id)
      .gte('period_start', firstDayOfMonth.toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentApiCalls = usageMetrics?.api_calls_count || 0;

    // Hard limit enforcement
    if (currentApiCalls >= maxApiCalls) {
      return new Response(
        JSON.stringify({ 
          error: 'API call limit exceeded for this month. Please upgrade your plan or wait until next month.',
          limit_reached: true,
          current: currentApiCalls,
          limit: maxApiCalls,
          conversationId: activeConversationId,
        }),
        {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Soft limit warning (80% threshold)
    const usagePercentage = (currentApiCalls / maxApiCalls) * 100;
    console.log(`API usage: ${currentApiCalls}/${maxApiCalls} (${usagePercentage.toFixed(1)}%)`);

    // Get OpenRouter API key
    const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
    if (!OPENROUTER_API_KEY) {
      throw new Error('OPENROUTER_API_KEY is not configured');
    }

    let systemPrompt = agent.system_prompt || 'You are a helpful AI assistant.';
    let sources: any[] = [];
    let queryHash: string | null = null;
    let maxSimilarity = 0;
    // PHASE 4: Track semantic memories for prompt injection
    let retrievedMemories: SemanticMemory[] = [];
    let queryEmbeddingForMemory: number[] | null = null;

    // RAG: Search knowledge base if there are user messages (skip for greeting requests)
    if (messages && messages.length > 0 && !isGreetingRequest) {
      // Get the last user message for RAG search
      const lastUserMessage = messages.filter((m: any) => m.role === 'user').pop();
      
      if (lastUserMessage && lastUserMessage.content) {
        try {
          const queryContent = lastUserMessage.content;
          const normalizedQuery = normalizeQuery(queryContent);
          queryHash = await hashQuery(normalizedQuery + ':' + agentId);
          
          console.log('Query normalized for cache lookup:', normalizedQuery.substring(0, 50));
          
          // COST OPTIMIZATION: Check response cache first (AGGRESSIVE - lowered from 0.92 to 0.70)
          // Skip cache for preview mode - always call AI
          const cachedResponse = previewMode ? null : await getCachedResponse(supabase, queryHash, agentId);
          if (cachedResponse && cachedResponse.similarity > 0.70) {
            console.log('CACHE HIT: Returning cached response, skipping AI call entirely');
            
            // Save user message (skip for preview mode)
            if (messages && messages.length > 0 && !previewMode) {
              await supabase.from('messages').insert({
                conversation_id: activeConversationId,
                role: 'user',
                content: queryContent,
                metadata: { source: 'widget' }
              });
            }
            
            // Save cached response as assistant message (skip for preview mode)
            if (!previewMode) {
              await supabase.from('messages').insert({
                conversation_id: activeConversationId,
                role: 'assistant',
                content: cachedResponse.content,
                metadata: { source: 'cache', cache_similarity: cachedResponse.similarity }
              });
            }
            
            return new Response(
              JSON.stringify({
                conversationId: previewMode ? null : activeConversationId,
                response: cachedResponse.content,
                cached: true,
                similarity: cachedResponse.similarity,
              }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          // COST OPTIMIZATION: Check embedding cache before generating new embedding
          let queryEmbedding = await getCachedEmbedding(supabase, queryHash, agentId);
          
          if (queryEmbedding) {
            console.log('Embedding CACHE HIT - saved 1 embedding API call');
          } else {
            console.log('Generating new embedding for query:', queryContent.substring(0, 100));
            queryEmbedding = await generateEmbedding(queryContent);
            
            // Cache the embedding for future use
            cacheQueryEmbedding(supabase, queryHash, normalizedQuery, queryEmbedding, agentId);
          }
          
          // RAG threshold tuned for Qwen3 embeddings (industry standard: 0.40-0.50)
          // Higher thresholds (0.70+) cause most semantically relevant content to be missed
          const queryLength = queryContent.split(' ').length;
          const matchThreshold = queryLength < 5 ? 0.50 : queryLength < 15 ? 0.45 : 0.40;
          // PHASE 6: Limit match count to MAX_RAG_CHUNKS (3) to reduce input tokens
          const matchCount = MAX_RAG_CHUNKS;
          
          console.log(`Dynamic RAG params: threshold=${matchThreshold}, count=${matchCount} (query length: ${queryLength} words)`);
          
          // Search for relevant knowledge sources
          const knowledgeResults = await searchKnowledge(
            supabase,
            agentId,
            queryEmbedding,
            matchThreshold,
            matchCount
          );

          console.log(`Found ${knowledgeResults.length} relevant knowledge sources`);
          
          // PHASE 4: Search for semantic memories related to this query
          const leadId = (conversation?.metadata as ConversationMetadata)?.lead_id;
          const semanticMemories = await searchSemanticMemories(
            supabase,
            agentId,
            leadId || null,
            queryEmbedding,
            0.6, // Memory match threshold
            5    // Max memories to retrieve
          );
          
          if (semanticMemories.length > 0) {
            console.log(`PHASE 4: Found ${semanticMemories.length} relevant semantic memories`);
            retrievedMemories = semanticMemories;
          }
          
          // Store embedding for potential memory extraction later
          queryEmbeddingForMemory = queryEmbedding;

          // If relevant knowledge found, inject into system prompt
          if (knowledgeResults && knowledgeResults.length > 0) {
            // Track max similarity for response caching decision
            maxSimilarity = Math.max(...knowledgeResults.map((r: any) => r.similarity));
            
            sources = knowledgeResults.map((result: any) => ({
              source: result.source,
              type: result.type,
              similarity: result.similarity,
              url: result.sourceUrl, // Include source URL for AI to reference
            }));

            // Secondary filter: exclude very low relevance matches
            const relevantChunks = knowledgeResults.filter((r: any) => r.similarity > 0.35);
            
            if (relevantChunks.length > 0) {
              const knowledgeContext = relevantChunks
                .map((result: any, index: number) => {
                  const chunkInfo = result.chunkIndex !== undefined ? ` - Section ${result.chunkIndex + 1}` : '';
                  const urlInfo = result.sourceUrl ? ` | URL: ${result.sourceUrl}` : '';
                  return `[Source ${index + 1}: ${result.source}${chunkInfo}${urlInfo} (${result.type}, relevance: ${(result.similarity * 100).toFixed(0)}%)]
${result.content}`;
                })
                .join('\n\n---\n\n');

              systemPrompt = `${agent.system_prompt || 'You are a helpful AI assistant.'}

KNOWLEDGE BASE CONTEXT:
The following information from our knowledge base may be relevant to answering the user's question. Use this context to provide accurate, informed responses. If the context doesn't contain relevant information for the user's question, you can answer based on your general knowledge but mention that you're not finding specific information in the knowledge base.

${knowledgeContext}

---

IMPORTANT GUIDELINES FOR RESPONSES:
1. When referencing information from sources, cite naturally (e.g., "According to our docs...").
2. **LINKS ON THEIR OWN LINE**: Put source URLs on a separate line, never buried in paragraphs:
   ✓ "Learn more: https://example.com"
   ✗ "You can read about this at https://example.com to learn more."
3. Include links for EVERY knowledge source referenced.
4. Multiple relevant sources = multiple links on separate lines.`;
            }
          }
        } catch (ragError) {
          // Log RAG errors but don't fail the request
          console.error('RAG error (continuing without knowledge):', ragError);
        }
      }
    }

    // Extract user context from conversation metadata (lead form data)
    const conversationMetadata = (conversation?.metadata || {}) as ConversationMetadata;
    let userContextSection = '';
    
    // Detect initial message/inquiry from custom fields
    // These are fields where the user explains why they're reaching out
    let initialUserMessage: string | null = null;
    const messageFieldPatterns = /message|question|help|inquiry|reason|about|need|looking for|interest|details|describe|explain|issue|problem|request|comment/i;
    
    // Create a copy of custom fields to process
    const processedCustomFields: Record<string, string> = {};
    
    if (conversationMetadata.custom_fields) {
      for (const [label, value] of Object.entries(conversationMetadata.custom_fields)) {
        if (value && typeof value === 'string' && value.trim()) {
          // Check if this looks like an initial message field
          // Typically these are longer text fields where user explains their need
          const isMessageField = messageFieldPatterns.test(label) && value.length > 20;
          
          if (isMessageField && !initialUserMessage) {
            initialUserMessage = value as string;
            console.log(`Detected initial user message from field "${label}": "${value.substring(0, 50)}..."`);
          } else {
            processedCustomFields[label] = value;
          }
        }
      }
    }
    
    // Check if we have meaningful user context to add
    const hasUserName = conversationMetadata.lead_name;
    const hasCustomFields = Object.keys(processedCustomFields).length > 0;
    
    if (hasUserName || hasCustomFields || initialUserMessage) {
      userContextSection = `

USER INFORMATION (from contact form):`;
      
      if (conversationMetadata.lead_name) {
        userContextSection += `\n- Name: ${conversationMetadata.lead_name}`;
      }
      if (conversationMetadata.lead_email) {
        userContextSection += `\n- Email: ${conversationMetadata.lead_email}`;
      }
      
      // Add location if available
      const location = conversationMetadata.city && conversationMetadata.country 
        ? `${conversationMetadata.city}, ${conversationMetadata.country}` 
        : conversationMetadata.country || null;
      if (location) {
        userContextSection += `\n- Location: ${location}`;
      }
      
      // Add remaining custom fields (excluding the initial message)
      for (const [label, value] of Object.entries(processedCustomFields)) {
        userContextSection += `\n- ${label}: ${value}`;
      }
      
      userContextSection += `

Use this information to personalize your responses when appropriate (e.g., address them by name, reference their company or interests). Be natural about it - don't force personalization if it doesn't fit the conversation.`;
      
      // Add initial user inquiry as a distinct, prominent section
      if (initialUserMessage) {
        userContextSection += `

INITIAL USER INQUIRY (from contact form):
"${initialUserMessage}"

This is what the user wanted to discuss when they started the chat. Treat this as their first question - address it directly in your response. Do NOT ask "how can I help?" when they've already told you what they need.`;
      }
      
      console.log('Added user context to system prompt', { hasInitialMessage: !!initialUserMessage });
    }

    // Append user context to system prompt
    if (userContextSection) {
      systemPrompt = systemPrompt + userContextSection;
    }
    
    // PHASE 4: Inject semantic memories into system prompt
    if (retrievedMemories.length > 0) {
      const memoriesContext = formatMemoriesForPrompt(retrievedMemories);
      if (memoriesContext) {
        systemPrompt = systemPrompt + `

REMEMBERED CONTEXT (from previous conversations):
${memoriesContext}

Use this remembered information naturally when relevant. Don't explicitly say "I remember you said..." unless it's conversationally appropriate.`;
        console.log(`PHASE 4: Injected ${retrievedMemories.length} memories into system prompt`);
      }
    }
    
    // PHASE 8: Append formatting rules for digestible responses
    systemPrompt = systemPrompt + RESPONSE_FORMATTING_RULES;

    // LANGUAGE MATCHING: Always respond in the user's language
    systemPrompt += `

LANGUAGE: Always respond in the same language the user is writing in. If they write in Spanish, respond in Spanish. If they write in Portuguese, respond in Portuguese. Match their language naturally without mentioning that you're doing so.`;

    // PROPERTY TOOLS INSTRUCTIONS: When agent has locations, instruct AI to use property tools
    if (hasLocations) {
      // Check if we have shown properties in context for reference resolution
      const shownProperties = conversationMetadata?.shown_properties as ShownProperty[] | undefined;
      let shownPropertiesContext = '';
      
      if (shownProperties && shownProperties.length > 0) {
        shownPropertiesContext = `

RECENTLY SHOWN PROPERTIES (use these for booking/reference):
${shownProperties.map(p => 
  `${p.index}. ${p.address}, ${p.city}, ${p.state} - ${p.beds || '?'}bed/${p.baths || '?'}bath ${p.price_formatted} (ID: ${p.id})${p.community ? ` [${p.community}]` : ''}${p.location_id ? ` (Location: ${p.location_id})` : ''}`
).join('\n')}

PROPERTY REFERENCE RESOLUTION:
When the user refers to a previously shown property (e.g., "the first one", "the 2-bed", "the one on Main St"):
1. Match their reference to one of the RECENTLY SHOWN PROPERTIES above
2. Match by: index number (1st, 2nd, first, second), address substring, beds/baths, price, or community
3. Use the property's ID directly for booking - do NOT ask user to confirm the address you already showed them
4. If truly unclear which property they mean, ask for clarification with the numbered list

DIRECT BOOKING WITH LOCATION_ID:
When scheduling a tour for a shown property:
- If the property has a Location ID in parentheses above, use it DIRECTLY with book_appointment (location_id parameter)
- This enables instant booking without needing to call check_calendar_availability first
- If no Location ID is shown, use check_calendar_availability with the property's city/state to find the right location

Examples:
- "I'd like to tour the first one" → Use property #1's ID and location_id from the list above
- "What about the 2-bedroom?" → Match to property with 2 beds from the list
- "Schedule a tour for the one on Oak Street" → Match by address containing "Oak", use its location_id
- "How about the cheaper one?" → Match to lowest priced property in the list`;
        console.log(`Injected ${shownProperties.length} shown properties into context`);
      }
      
      // Tools are now self-documenting with TRIGGERS, EXAMPLES, WORKFLOW, and DO NOT USE sections
      // No need for redundant manual instructions here - the AI reads tool descriptions directly
      systemPrompt += `

PROPERTY & BOOKING TOOLS AVAILABLE:
You have access to real-time tools for properties, locations, and bookings. Each tool's description contains:
• TRIGGERS: When to use it
• EXAMPLES: Sample queries
• WORKFLOW: How it fits with other tools
• DO NOT USE: When to avoid it

Read each tool's description carefully to understand when and how to use it.
DO NOT rely solely on knowledge base context - use the tools for live data.${shownPropertiesContext}`;
      
      console.log('Added property tool instructions to system prompt');
    }

    // PHASE 1: Use database conversation history (source of truth) instead of client messages
    // PHASE 2: Intelligent summarization instead of hard truncation
    const rawHistory = dbConversationHistory.length > 0 ? dbConversationHistory : messages;
    
    // Get existing summary from conversation metadata if available
    const existingSummary = conversationMetadata?.conversation_summary as string | undefined;
    
    // Summarize if conversation is long (preserves context that would otherwise be lost)
    const { summary: conversationSummary, keptMessages, wasNeeded: summaryGenerated } = 
      await summarizeConversationHistory(
        rawHistory,
        MAX_CONVERSATION_HISTORY,
        OPENROUTER_API_KEY,
        existingSummary
      );
    
    let messagesToSend = keptMessages;
    
    // Store summary in conversation metadata for future use
    if (summaryGenerated && conversationSummary && activeConversationId) {
      await storeConversationSummary(
        supabase,
        activeConversationId,
        conversationSummary,
        conversationMetadata
      );
    }
    
    // Inject conversation summary into system prompt for context continuity
    if (conversationSummary) {
      systemPrompt = systemPrompt + `

EARLIER CONVERSATION SUMMARY:
The following summarizes earlier parts of this conversation that are no longer in the immediate message history:
${conversationSummary}

Use this context to maintain continuity - the user may reference things from earlier in the conversation.`;
      console.log(`Injected conversation summary (${conversationSummary.length} chars) into system prompt`);
    }
    
    // For greeting requests, add a special instruction and use empty messages
    if (isGreetingRequest) {
      console.log('Handling greeting request - generating personalized welcome', { hasInitialMessage: !!initialUserMessage });
      
      if (initialUserMessage) {
        // User already told us what they need - respond directly to their inquiry
        systemPrompt = systemPrompt + `

GREETING REQUEST WITH INITIAL INQUIRY:
The user has already told you what they need in the contact form: "${initialUserMessage}"

Your response should:
- Greet them briefly by name if available (one short greeting)
- IMMEDIATELY address their inquiry - provide a helpful, substantive response
- Do NOT ask "how can I help?" or "what can I assist you with?" - they already told you
- Be direct and efficient - they're waiting for real help, not pleasantries
- If you need clarification, ask a specific follow-up question about their inquiry`;
        
        // Replace with a message that prompts the AI to respond to their inquiry
        messagesToSend = [{ role: 'user', content: initialUserMessage }];
      } else {
        // No initial message - use standard greeting
        systemPrompt = systemPrompt + `

GREETING REQUEST:
This is the start of a new conversation. The user has just filled out a contact form and is ready to chat.
Generate a warm, personalized greeting using the user information provided above (if available).
- If you know their name, address them personally
- If you know their company or interests from custom fields, briefly acknowledge it
- Keep it concise (1-2 sentences) and end with an invitation to ask questions
- Be natural and friendly, not overly formal
- Do NOT start with "Hello!" or "Hi there!" - be more creative and personal`;
        
        // Replace the greeting request with a user message asking for a greeting
        messagesToSend = [{ role: 'user', content: 'Please greet me and ask how you can help.' }];
      }
    }

    // SMART MODEL ROUTING: Select optimal model based on query complexity
    const hasUserTools = formattedTools && formattedTools.length > 0;
    const conversationLength = messagesToSend.length;
    const lastUserQuery = messagesToSend.filter((m: any) => m.role === 'user').pop()?.content || '';
    
    const { model: selectedModel, tier: modelTier } = selectModelTier(
      lastUserQuery,
      maxSimilarity,
      conversationLength,
      hasUserTools,
      agent.model || 'google/gemini-2.5-flash'
    );
    
    console.log(`Model routing: tier=${modelTier}, model=${selectedModel}, ragSimilarity=${maxSimilarity.toFixed(2)}, hasTools=${hasUserTools}`);

    // Build the initial AI request with only SUPPORTED behavior settings
    const modelCaps = getModelCapabilities(selectedModel);
    const aiRequestBody: any = {
      model: selectedModel,
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messagesToSend,
      ],
      stream: false,
      temperature: agent.temperature || 0.7,
      max_completion_tokens: agent.max_tokens || 2000,
    };

    // Only add parameters the model supports
    if (modelCaps.topP.supported) {
      aiRequestBody.top_p = deploymentConfig.top_p || 1.0;
    }
    if (modelCaps.presencePenalty.supported) {
      aiRequestBody.presence_penalty = deploymentConfig.presence_penalty || 0;
    }
    if (modelCaps.frequencyPenalty.supported) {
      aiRequestBody.frequency_penalty = deploymentConfig.frequency_penalty || 0;
    }
    if (modelCaps.topK.supported && deploymentConfig.top_k) {
      aiRequestBody.top_k = deploymentConfig.top_k;
    }
    
    console.log(`Model capabilities applied: topP=${modelCaps.topP.supported}, penalties=${modelCaps.presencePenalty.supported}, topK=${modelCaps.topK.supported}`);

    // PHASE 7: Skip quick replies for lite model tier (reduces tool call overhead)
    // Also check agent config for enable_quick_replies setting (defaults to true)
    const enableQuickReplies = deploymentConfig.enable_quick_replies !== false;
    const shouldIncludeQuickReplies = enableQuickReplies && modelTier !== 'lite';
    
    // Built-in quick replies tool (conditional based on tier and config)
    const quickRepliesTool = shouldIncludeQuickReplies ? {
      type: 'function',
      function: {
        name: 'suggest_quick_replies',
        description: 'IMPORTANT: Always provide your full response text first, then call this tool to suggest follow-up options. Suggest 2-4 relevant follow-up questions or actions based on your response. Never call this tool without also providing response content in the same message.',
        parameters: {
          type: 'object',
          properties: {
            suggestions: {
              type: 'array',
              description: 'Array of 2-4 short, actionable suggestions (max 40 characters each)',
              items: {
                type: 'string'
              },
              minItems: 2,
              maxItems: 4
            }
          },
          required: ['suggestions']
        }
      }
    } : null;

    // Built-in tool to mark conversation as complete (triggers satisfaction rating)
    // Calculate conversation length for context (user messages only)
    const userMessageCount = messages.filter((m: any) => m.role === 'user').length;
    
    const markCompleteTool = {
      type: 'function',
      function: {
        name: 'mark_conversation_complete',
        description: `Intelligently determine if a conversation has reached a natural conclusion. Current conversation has ${userMessageCount} user messages.

CONTEXT REQUIREMENTS:
- Minimum 3 user message exchanges before considering HIGH confidence completion
- Short conversations (1-2 exchanges) should use MEDIUM confidence at most

HIGH CONFIDENCE SIGNALS (multiple should apply):
- User expresses gratitude WITH finality: "thanks, that's exactly what I needed!", "perfect, you've been very helpful!", "great, I'm all set now"
- No pending questions or unresolved topics from the user
- User's original inquiry has been addressed
- Last user message does NOT contain a follow-up question
- Conversation has sufficient depth (3+ exchanges)

NEGATIVE SIGNALS (DO NOT mark complete if present):
- "Thanks" or "got it" followed by "but...", "however...", "one more thing...", or a new question
- User expressing confusion, frustration, or dissatisfaction
- Conversation ends mid-topic without resolution
- User says "thanks" but immediately asks another question
- Any explicit "I have another question" or "Also..." or "What about..."
- Questions marks in the user's last message after acknowledgment

MEDIUM CONFIDENCE (log only, no rating prompt):
- Single acknowledgment words without elaboration: just "ok", "thanks", "got it"
- Short conversations (under 3 user exchanges) even with positive signals
- User appears satisfied but hasn't explicitly confirmed resolution

NEVER mark complete when:
- User is frustrated or upset (negative sentiment)
- There are unanswered questions
- The conversation is still actively exploring a topic
- User gave perfunctory acknowledgment mid-conversation`,
        parameters: {
          type: 'object',
          properties: {
            reason: {
              type: 'string',
              description: 'Detailed explanation of why the conversation appears complete, referencing specific user signals observed'
            },
            confidence: {
              type: 'string',
              enum: ['high', 'medium'],
              description: 'HIGH: Clear resolution with explicit satisfaction AND 3+ exchanges. MEDIUM: Likely complete but ambiguous signals or short conversation.'
            },
            user_signal: {
              type: 'string',
              description: 'The specific phrase or message from the user that indicates completion (quote directly)'
            },
            sentiment: {
              type: 'string',
              enum: ['satisfied', 'neutral', 'uncertain', 'frustrated'],
              description: 'Overall sentiment of the user based on their final messages'
            },
            has_pending_questions: {
              type: 'boolean',
              description: 'Whether the user has any unanswered questions or unresolved topics'
            }
          },
          required: ['reason', 'confidence', 'user_signal', 'sentiment']
        }
      }
    };

    // Combine built-in tools with user-defined tools (only include quick replies if enabled)
    const allTools = [
      ...(quickRepliesTool ? [quickRepliesTool] : []),
      markCompleteTool, // Always include mark_conversation_complete
      ...(formattedTools || [])
    ];
    
    // PHASE 7: Only add tools if there are any (skip entirely for lite model with no user tools)
    if (allTools.length > 0) {
      aiRequestBody.tools = allTools;
      aiRequestBody.tool_choice = 'auto';
    }
    
    console.log(`Quick replies: ${shouldIncludeQuickReplies ? 'enabled' : 'disabled'} (tier=${modelTier}, config=${enableQuickReplies})`);

    // Call OpenRouter API
    let response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://chatpad.ai',
        'X-Title': 'ChatPad',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(aiRequestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.', conversationId: activeConversationId }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Credits exhausted. Please add funds to continue.', conversationId: activeConversationId }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error('AI Gateway error');
    }

    let aiResponse = await response.json();
    let assistantMessage = aiResponse.choices?.[0]?.message;
    let assistantContent = assistantMessage?.content || '';
    const toolsUsed: { name: string; success: boolean }[] = [];
    let quickReplies: string[] = [];
    let aiMarkedComplete = false; // Track if AI called mark_conversation_complete with high confidence
    // Track shown properties - declared OUTSIDE if-block so it persists to final metadata update
    let storedShownProperties: ShownProperty[] | undefined;
    
    // Track booking tool results for UI component transformation
    let lastCalendarResult: any = null;
    let lastBookingResult: any = null;

    // Handle tool calls if AI decided to use tools
    if (assistantMessage?.tool_calls && assistantMessage.tool_calls.length > 0) {
      console.log(`AI requested ${assistantMessage.tool_calls.length} tool call(s)`);
      
      // PHASE 3: Fetch recent tool calls for redundancy check
      const recentToolMessages = await getRecentToolCalls(supabase, activeConversationId, 10);
      let redundantCallsSkipped = 0;
      
      const toolResults: any[] = [];
      
      for (const toolCall of assistantMessage.tool_calls) {
        const toolName = toolCall.function?.name;
        const toolArgs = JSON.parse(toolCall.function?.arguments || '{}');
        
        // Handle built-in quick replies tool
        if (toolName === 'suggest_quick_replies') {
          console.log('AI suggested quick replies:', toolArgs.suggestions);
          quickReplies = (toolArgs.suggestions || []).slice(0, 4).map((s: string) => 
            s.length > 40 ? s.substring(0, 37) + '...' : s
          );
          // Don't add to toolResults - this is a client-side only tool
          continue;
        }
        
        // Handle built-in mark_conversation_complete tool
        if (toolName === 'mark_conversation_complete') {
          console.log('AI called mark_conversation_complete:', JSON.stringify(toolArgs, null, 2));
          
          const sentiment = toolArgs.sentiment || 'neutral';
          const hasPendingQuestions = toolArgs.has_pending_questions || false;
          const userSignal = toolArgs.user_signal || '';
          
          // Validation: require minimum exchanges for high confidence
          const meetsMinimumExchanges = userMessageCount >= 3;
          const hasPositiveSentiment = sentiment === 'satisfied' || sentiment === 'neutral';
          const noPendingQuestions = !hasPendingQuestions;
          
          // Additional signal validation: check for question marks or "but" patterns in user signal
          const hasNegativePattern = /\?|but\s|however\s|also\s|what about|one more/i.test(userSignal);
          
          if (toolArgs.confidence === 'high' && meetsMinimumExchanges && hasPositiveSentiment && noPendingQuestions && !hasNegativePattern) {
            aiMarkedComplete = true;
            console.log('Conversation marked complete with HIGH confidence', {
              reason: toolArgs.reason,
              userSignal,
              sentiment,
              userMessageCount,
              hasPendingQuestions,
            });
            
            // Update conversation metadata with rich completion context
            const currentMeta = conversation?.metadata || {};
            await supabase
              .from('conversations')
              .update({
                metadata: {
                  ...currentMeta,
                  ai_marked_complete: true,
                  ai_complete_reason: toolArgs.reason,
                  ai_complete_at: new Date().toISOString(),
                  ai_complete_signal: userSignal,
                  ai_complete_sentiment: sentiment,
                  ai_complete_exchange_count: userMessageCount,
                },
              })
              .eq('id', activeConversationId);
          } else {
            // Log detailed reason for not triggering
            const rejectionReasons = [];
            if (toolArgs.confidence !== 'high') rejectionReasons.push(`confidence=${toolArgs.confidence}`);
            if (!meetsMinimumExchanges) rejectionReasons.push(`only ${userMessageCount} exchanges (need 3+)`);
            if (!hasPositiveSentiment) rejectionReasons.push(`negative sentiment: ${sentiment}`);
            if (hasPendingQuestions) rejectionReasons.push('has pending questions');
            if (hasNegativePattern) rejectionReasons.push(`negative pattern in signal: "${userSignal}"`);
            
            console.log('Completion not triggered:', {
              confidence: toolArgs.confidence,
              rejectionReasons,
              userSignal,
              sentiment,
              userMessageCount,
            });
          }
          // Don't add to toolResults - this is a client-side only tool
          continue;
        }
        
        // Handle built-in booking tools
        if (toolName === 'search_properties') {
          // PHASE 3: Check for cached result before executing
          const cachedResult = findCachedToolResult(recentToolMessages, toolName, toolArgs, 10);
          if (cachedResult) {
            console.log(`PHASE 3: Reusing cached search_properties result (${cachedResult.timestamp})`);
            redundantCallsSkipped++;
            toolsUsed.push({ name: toolName, success: cachedResult.success });
            
            // Restore shown properties from cached result if present
            if (cachedResult.success && cachedResult.result?.shownProperties?.length > 0) {
              storedShownProperties = cachedResult.result.shownProperties;
            }
            
            const { shownProperties, ...resultForAI } = cachedResult.result || {};
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(resultForAI || {}),
            });
            continue;
          }
          
          // PHASE 1: Persist tool call to database
          await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
          
          const result = await searchProperties(supabase, agentId, toolArgs);
          toolsUsed.push({ name: toolName, success: result.success });
          
          // Store shown properties for later metadata update (don't update now, will be overwritten)
          if (result.success && result.result?.shownProperties?.length > 0) {
            storedShownProperties = result.result.shownProperties;
            console.log(`Will store ${storedShownProperties.length} shown properties in final metadata update`);
          }
          
          // Remove shownProperties from the result sent to AI (it's for metadata only)
          const { shownProperties, ...resultForAI } = result.result || {};
          const resultContent = JSON.stringify(resultForAI || { error: result.error });
          
          // PHASE 1: Persist tool result to database
          await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, resultForAI || { error: result.error }, result.success);
          
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: resultContent,
          });
          continue;
        }
        
        if (toolName === 'lookup_property') {
          // PHASE 3: Check for cached result before executing
          const cachedResult = findCachedToolResult(recentToolMessages, toolName, toolArgs, 10);
          if (cachedResult) {
            console.log(`PHASE 3: Reusing cached lookup_property result (${cachedResult.timestamp})`);
            redundantCallsSkipped++;
            toolsUsed.push({ name: toolName, success: cachedResult.success });
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(cachedResult.result || {}),
            });
            continue;
          }
          
          // PHASE 1: Persist tool call to database
          await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
          
          const result = await lookupProperty(supabase, agentId, activeConversationId, toolArgs);
          toolsUsed.push({ name: toolName, success: result.success });
          const resultData = result.result || { error: result.error };
          
          // PHASE 1: Persist tool result to database
          await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, resultData, result.success);
          
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(resultData),
          });
          continue;
        }
        
        if (toolName === 'get_locations') {
          // PHASE 3: Check for cached result before executing
          const cachedResult = findCachedToolResult(recentToolMessages, toolName, toolArgs, 10);
          if (cachedResult) {
            console.log(`PHASE 3: Reusing cached get_locations result (${cachedResult.timestamp})`);
            redundantCallsSkipped++;
            toolsUsed.push({ name: toolName, success: cachedResult.success });
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(cachedResult.result || {}),
            });
            continue;
          }
          
          // PHASE 1: Persist tool call to database
          await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
          
          const result = await getLocations(supabase, agentId);
          toolsUsed.push({ name: toolName, success: result.success });
          const resultData = result.result || { error: result.error };
          
          // PHASE 1: Persist tool result to database
          await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, resultData, result.success);
          
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(resultData),
          });
          continue;
        }
        
        if (toolName === 'check_calendar_availability') {
          // PHASE 3: Check for cached result (shorter window - 5 mins for time-sensitive data)
          const cachedResult = findCachedToolResult(recentToolMessages, toolName, toolArgs, 5);
          if (cachedResult) {
            console.log(`PHASE 3: Reusing cached check_calendar_availability result (${cachedResult.timestamp})`);
            redundantCallsSkipped++;
            toolsUsed.push({ name: toolName, success: cachedResult.success });
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(cachedResult.result || {}),
            });
            continue;
          }
          
          // PHASE 1: Persist tool call to database
          await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
          
          const result = await checkCalendarAvailability(supabaseUrl, toolArgs);
          toolsUsed.push({ name: toolName, success: result.success });
          const resultData = result.result || { error: result.error };
          
          // Store for booking UI transformation
          if (result.success && result.result) {
            lastCalendarResult = result.result;
          }
          
          // PHASE 1: Persist tool result to database
          await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, resultData, result.success);
          
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(resultData),
          });
          continue;
        }
        
        if (toolName === 'book_appointment') {
          // NOTE: Never cache book_appointment - each booking is unique and must execute
          // PHASE 1: Persist tool call to database
          await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
          
          const result = await bookAppointment(supabaseUrl, activeConversationId, conversationMetadata, toolArgs);
          toolsUsed.push({ name: toolName, success: result.success });
          const resultData = result.result || { error: result.error };
          
          // Store for booking UI transformation
          if (result.success && result.result) {
            lastBookingResult = result.result;
          }
          
          // PHASE 1: Persist tool result to database
          await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, resultData, result.success);
          
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(resultData),
          });
          continue;
        }

        // Find the user-defined tool configuration
        const tool = enabledTools.find(t => t.name === toolName);
        
        if (tool && tool.endpoint_url) {
          // PHASE 3: Check for cached result for user-defined tools
          const cachedResult = findCachedToolResult(recentToolMessages, toolName, toolArgs, 10);
          if (cachedResult) {
            console.log(`PHASE 3: Reusing cached ${toolName} result (${cachedResult.timestamp})`);
            redundantCallsSkipped++;
            toolsUsed.push({ name: toolName, success: cachedResult.success });
            toolResults.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(cachedResult.result || {}),
            });
            continue;
          }
          
          // PHASE 1: Persist tool call to database (skip for preview mode)
          if (!previewMode) {
            await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
          }
          
          const result = await callToolEndpoint({
            name: tool.name,
            endpoint_url: tool.endpoint_url,
            headers: tool.headers || {},
            timeout_ms: tool.timeout_ms || 10000,
          }, toolArgs);

          toolsUsed.push({ name: toolName, success: result.success });
          const resultData = result.success ? result.result : { error: result.error };
          
          // PHASE 1: Persist tool result to database (skip for preview mode)
          if (!previewMode) {
            await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, resultData, result.success);
          }

          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(resultData),
          });
        } else {
          console.error(`Tool ${toolName} not found or has no endpoint`);
          const errorResult = { error: `Tool ${toolName} is not configured` };
          
          // PHASE 1: Persist even failed tool calls for debugging (skip for preview mode)
          if (!previewMode) {
            await persistToolCall(supabase, activeConversationId, toolCall.id, toolName, toolArgs);
            await persistToolResult(supabase, activeConversationId, toolCall.id, toolName, errorResult, false);
          }
          
          toolResults.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(errorResult),
          });
          toolsUsed.push({ name: toolName, success: false });
        }
      }
      
      // PHASE 3: Log redundancy stats
      if (redundantCallsSkipped > 0) {
        console.log(`PHASE 3: Skipped ${redundantCallsSkipped} redundant tool call(s) using cached results`);
      }

      // If AI only provided quick replies or marked complete without content, force a follow-up call to get actual response
      const needsContentFollowUp = !assistantContent && (quickReplies.length > 0 || aiMarkedComplete) && toolResults.length === 0;
      
      // Call AI again if there were actual tool results OR if we need content
      if (toolResults.length > 0 || needsContentFollowUp) {
        // Call AI again with tool results (or to get content if only quick replies were provided)
        const followUpMessages = needsContentFollowUp 
          ? aiRequestBody.messages // Just use original messages if we only need content
          : [
              ...aiRequestBody.messages,
              assistantMessage,
              ...toolResults,
            ];

        console.log(needsContentFollowUp 
          ? 'AI only provided quick replies/completion signal, making follow-up call for content'
          : 'Calling AI with tool results for final response');

        const followUpResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'HTTP-Referer': 'https://chatpad.ai',
            'X-Title': 'ChatPad',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...aiRequestBody,
            messages: followUpMessages,
            tools: undefined, // Don't pass tools again
            tool_choice: undefined,
          }),
        });

        if (followUpResponse.ok) {
          const followUpData = await followUpResponse.json();
          assistantContent = followUpData.choices?.[0]?.message?.content || assistantContent || 'I apologize, but I was unable to generate a response.';
        } else {
          console.error('Follow-up AI call failed:', await followUpResponse.text());
          assistantContent = assistantContent || 'I apologize, but I encountered an error processing the tool results.';
        }
      }
    }

    // Fallback if no content
    if (!assistantContent) {
      assistantContent = 'I apologize, but I was unable to generate a response.';
    }

    // Add natural typing delay before responding (2-3 seconds, varied for realism)
    const minDelay = 2000; // 2 seconds
    const maxDelay = 3000; // 3 seconds
    const typingDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
    console.log(`Adding natural typing delay: ${typingDelay}ms`);
    await new Promise(resolve => setTimeout(resolve, typingDelay));

    // COST OPTIMIZATION: Cache responses with moderate+ similarity (AGGRESSIVE - lowered from 0.92, removed sources requirement)
    if (queryHash && maxSimilarity > 0.65) {
      console.log(`Caching response with similarity ${maxSimilarity.toFixed(2)} for future reuse`);
      cacheResponse(supabase, queryHash, agentId, assistantContent, maxSimilarity);
    }

    // Split response into chunks for staggered display
    const chunks = splitResponseIntoChunks(assistantContent);
    console.log(`Splitting response into ${chunks.length} chunks`);

    // Fetch link previews for the full response (will be attached to last chunk)
    const linkPreviews = await fetchLinkPreviews(assistantContent, supabaseUrl, supabaseKey);
    console.log(`Cached ${linkPreviews.length} link previews for assistant message`);

    // Save each chunk as a separate message with offset timestamps (skip for preview mode)
    const assistantMessageIds: string[] = [];
    if (!previewMode) {
      for (let i = 0; i < chunks.length; i++) {
        const chunkTimestamp = new Date(Date.now() + (i * 100)); // 100ms offset for ordering
        const isLastChunk = i === chunks.length - 1;
        
        const { data: msg, error: msgError } = await supabase.from('messages').insert({
          conversation_id: activeConversationId,
          role: 'assistant',
          content: chunks[i],
          created_at: chunkTimestamp.toISOString(),
          metadata: { 
            source: 'ai',
            model: selectedModel,
            model_tier: modelTier,
            chunk_index: i,
            chunk_total: chunks.length,
            knowledge_sources: isLastChunk && sources.length > 0 ? sources : undefined,
            tools_used: isLastChunk && toolsUsed.length > 0 ? toolsUsed : undefined,
            link_previews: isLastChunk && linkPreviews.length > 0 ? linkPreviews : undefined,
          }
        }).select('id').single();
        
        if (msgError) {
          console.error(`Error saving chunk ${i}:`, msgError);
        }
        if (msg) assistantMessageIds.push(msg.id);
      }
    }

    const assistantMessageId = assistantMessageIds[assistantMessageIds.length - 1];

    // Update conversation metadata (skip for preview mode)
    if (!previewMode) {
      const currentMetadata = conversation?.metadata || {};
      
      // Merge page visits (keep existing ones, add new ones)
      let mergedPageVisits = currentMetadata.visited_pages || [];
      if (pageVisits && Array.isArray(pageVisits)) {
        // Only add page visits that aren't already tracked
        const existingUrls = new Set(mergedPageVisits.map((v: any) => `${v.url}-${v.entered_at}`));
        const newVisits = pageVisits.filter((v: any) => !existingUrls.has(`${v.url}-${v.entered_at}`));
        mergedPageVisits = [...mergedPageVisits, ...newVisits];
        console.log(`Merged ${newVisits.length} new page visits, total: ${mergedPageVisits.length}`);
      }
      
      // Detect language from user input if not already detected
      // Priority: 1) Browser language 2) Character-based detection 3) AI detection
      // Also handles language re-evaluation if user switches languages
      let languageMetadata: { 
        detected_language?: string; 
        detected_language_code?: string;
        language_detection_source?: 'browser' | 'character' | 'ai';
        language_mismatch_count?: number;
        language_last_reevaluated_at?: string;
      } = {};
      
      const currentLanguageCode = currentMetadata.detected_language_code;
      
      // === CASE 1: First-time language detection ===
      if (!currentLanguageCode) {
        // Step 1: Try browser language first (most reliable for user preference)
        const browserLangResult = parseBrowserLanguage(browserLanguage);
        if (browserLangResult) {
          console.log(`[Language Detection] Browser language: ${browserLangResult.name} (${browserLangResult.code}) from "${browserLanguage}"`);
          languageMetadata = {
            detected_language: browserLangResult.name,
            detected_language_code: browserLangResult.code,
            language_detection_source: 'browser',
            language_mismatch_count: 0,
          };
        }
        
        // Only fall back to text analysis if browser language didn't provide a non-English result
        if (!languageMetadata.detected_language_code) {
          // Collect all user text for detection
          const textsToCheck: string[] = [];
          
          // Priority 1: Contact form Message field
          const contactFormMessage = currentMetadata.custom_fields?.Message;
          if (contactFormMessage && typeof contactFormMessage === 'string') {
            textsToCheck.push(contactFormMessage);
          }
          
          // Priority 2: Current user message being processed
          const currentUserMessage = messages?.filter((m: any) => m.role === 'user').pop()?.content;
          if (currentUserMessage) {
            textsToCheck.push(currentUserMessage);
          }
          
          // Priority 3: Previous user messages
          const userMessages = messages?.filter((m: any) => m.role === 'user') || [];
          for (const msg of userMessages) {
            if (msg.content && typeof msg.content === 'string') {
              textsToCheck.push(msg.content);
            }
          }
          
          // Combine texts for detection (max 1000 chars)
          const combinedText = textsToCheck.join(' ').substring(0, 1000);
          
          // Step 2: Try fast character-based detection
          const detected = detectLanguageByCharacters(combinedText);
          if (detected) {
            console.log(`[Language Detection] Character-based: ${detected.name} (${detected.code})`);
            languageMetadata = {
              detected_language: detected.name,
              detected_language_code: detected.code,
              language_detection_source: 'character',
              language_mismatch_count: 0,
            };
          } else if (combinedText.length >= 10) {
            // Step 3: Use AI detection via OpenRouter
            const aiDetected = await detectLanguageWithAI(combinedText, OPENROUTER_API_KEY);
            if (aiDetected) {
              console.log(`[Language Detection] AI-based: ${aiDetected.name} (${aiDetected.code})`);
              languageMetadata = {
                detected_language: aiDetected.name,
                detected_language_code: aiDetected.code,
                language_detection_source: 'ai',
                language_mismatch_count: 0,
              };
            }
          }
        }
      }
      // === CASE 2: Language re-evaluation (language already detected) ===
      else {
        // Get the current user message (most recent)
        const currentUserMessage = messages?.filter((m: any) => m.role === 'user').pop()?.content;
        
        if (currentUserMessage && currentUserMessage.length >= 10) {
          // Rate limit: Only re-evaluate every 5 minutes max
          const lastReevaluated = currentMetadata.language_last_reevaluated_at;
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          const canReevaluate = !lastReevaluated || new Date(lastReevaluated).getTime() < fiveMinutesAgo;
          
          if (canReevaluate) {
            // Detect language of THIS message
            const messageLanguage = await detectMessageLanguage(currentUserMessage, OPENROUTER_API_KEY);
            
            if (messageLanguage) {
              // Compare to stored language
              if (messageLanguage.code !== currentLanguageCode) {
                // Language mismatch detected! Increment counter
                const mismatchCount = (currentMetadata.language_mismatch_count || 0) + 1;
                console.log(`[Language Re-eval] Mismatch #${mismatchCount}: message="${messageLanguage.name}", stored="${currentMetadata.detected_language}"`);
                
                if (mismatchCount >= 3) {
                  // 3+ consecutive mismatches: UPDATE the language!
                  console.log(`[Language Re-eval] Switching from ${currentMetadata.detected_language} to ${messageLanguage.name}`);
                  languageMetadata = {
                    detected_language: messageLanguage.name,
                    detected_language_code: messageLanguage.code,
                    language_detection_source: 'ai',
                    language_mismatch_count: 0, // Reset counter
                    language_last_reevaluated_at: new Date().toISOString(),
                  };
                } else {
                  // Not enough mismatches yet, just update counter
                  languageMetadata = {
                    language_mismatch_count: mismatchCount,
                    language_last_reevaluated_at: new Date().toISOString(),
                  };
                }
              } else {
                // Language matches! Reset mismatch counter if needed
                if ((currentMetadata.language_mismatch_count || 0) > 0) {
                  console.log(`[Language Re-eval] Language matches again, resetting mismatch counter`);
                  languageMetadata = { 
                    language_mismatch_count: 0,
                    language_last_reevaluated_at: new Date().toISOString(),
                  };
                }
              }
            }
          }
        }
      }
      
      await supabase
        .from('conversations')
        .update({
          metadata: {
            ...currentMetadata,
            messages_count: (currentMetadata.messages_count || 0) + 2, // user + assistant
            first_message_at: currentMetadata.first_message_at || new Date().toISOString(),
            visited_pages: mergedPageVisits,
            // Store last message preview for conversation list
            last_message_preview: assistantContent.substring(0, 60),
            last_message_role: 'assistant',
            last_message_at: new Date().toISOString(),
            // Track when the visitor/user last sent a message (for unread badge logic)
            last_user_message_at: new Date().toISOString(),
            // Preserve shown_properties: use new ones from this request, or keep existing
            shown_properties: storedShownProperties?.length 
              ? storedShownProperties 
              : currentMetadata.shown_properties,
            // Update timestamp only if we have new properties
            ...(storedShownProperties?.length && {
              last_property_search_at: new Date().toISOString(),
            }),
            // Add language detection if detected
            ...languageMetadata,
          },
          updated_at: new Date().toISOString(),
        })
        .eq('id', activeConversationId);

      // Track API call usage (fire and forget - don't wait)
      const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      supabase
        .from('usage_metrics')
        .upsert({
          user_id: agent.user_id,
          period_start: firstDayOfMonth.toISOString(),
          period_end: lastDayOfMonth.toISOString(),
          api_calls_count: currentApiCalls + 1,
        }, {
          onConflict: 'user_id,period_start',
        })
        .then(() => console.log('API usage tracked'))
        .catch(err => console.error('Failed to track usage:', err));

      // PHASE 4: Extract and store semantic memories (fire and forget - don't block response)
      // Only extract from substantive conversations, not greetings
      if (!isGreetingRequest && messages && messages.length > 0) {
        const lastUserMsg = messages.filter((m: any) => m.role === 'user').pop();
        if (lastUserMsg?.content && assistantContent) {
          const leadId = conversationMetadata?.lead_id as string | undefined;
          extractAndStoreMemories(
            supabase,
            agentId,
            leadId || null,
            activeConversationId,
            lastUserMsg.content,
            assistantContent,
            OPENROUTER_API_KEY
          ).catch(err => console.error('Memory extraction error:', err));
        }
      }
    }

    // Calculate final timing
    const totalDuration = performance.now() - startTime;
    
    // Log request completion with timing breakdown
    log.info('Request completed', {
      conversationId: activeConversationId,
      durationMs: Math.round(totalDuration),
      model: selectedModel,
      tier: modelTier,
      chunksCount: chunks.length,
      hasToolsUsed: toolsUsed.length > 0,
      hasLinkPreviews: linkPreviews.length > 0,
    });

    // Build booking UI component data from tracked tool results
    let dayPicker: DayPickerData | undefined;
    let timePicker: TimePickerData | undefined;
    let bookingConfirmed: BookingConfirmationData | undefined;

    // Check if we have calendar availability results to transform
    if (lastCalendarResult?.available_slots?.length > 0) {
      // Detect if user already selected a day from message context
      const userSelectedDate = detectSelectedDateFromMessages(messagesToSend);
      
      if (userSelectedDate) {
        // User mentioned a specific date - show time picker for that date
        timePicker = transformToTimePickerData(lastCalendarResult, userSelectedDate) || undefined;
        // If no times for that date, fall back to day picker
        if (!timePicker) {
          dayPicker = transformToDayPickerData(lastCalendarResult) || undefined;
        }
      } else {
        // No specific date mentioned - show day picker
        dayPicker = transformToDayPickerData(lastCalendarResult) || undefined;
      }
    }

    // Check if we have a booking confirmation to transform
    if (lastBookingResult?.booking) {
      bookingConfirmed = transformToBookingConfirmedData(lastBookingResult) || undefined;
    }

    // Return the response with chunked messages for staggered display
    return new Response(
      JSON.stringify({
        conversationId: previewMode ? null : activeConversationId, // No conversationId for preview mode
        requestId, // Include for client-side correlation
        // New: array of message chunks for staggered display
        messages: chunks.map((content, i) => ({
          id: previewMode ? `preview-${i}` : assistantMessageIds[i],
          content,
          chunkIndex: i,
        })),
        // Legacy: keep single response for backward compatibility
        response: assistantContent,
        userMessageId: previewMode ? undefined : userMessageId,
        assistantMessageId: previewMode ? undefined : assistantMessageId,
        sources: sources.length > 0 ? sources : undefined,
        toolsUsed: toolsUsed.length > 0 ? toolsUsed : undefined,
        linkPreviews: linkPreviews.length > 0 ? linkPreviews : undefined,
        quickReplies: quickReplies.length > 0 ? quickReplies : undefined,
        callActions: (() => {
          const callActionsResult = extractPhoneNumbers(assistantContent);
          if (callActionsResult.length > 0) {
            log.debug('Phone numbers detected', { 
              count: callActionsResult.length,
              numbers: callActionsResult.map(a => a.displayNumber) 
            });
          }
          return callActionsResult.length > 0 ? callActionsResult : undefined;
        })(),
        // Booking UI components
        dayPicker,
        timePicker,
        bookingConfirmed,
        aiMarkedComplete, // Signal to widget to show rating prompt
        durationMs: Math.round(totalDuration),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const totalDuration = performance.now() - startTime;
    log.error('Request failed', { 
      error: error.message,
      durationMs: Math.round(totalDuration),
    });
    
    // Create agent error notification (fire and forget)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const errorSupabase = createClient(supabaseUrl, supabaseServiceKey);
      
      // Try to get agent info from request body for notification
      const body = await new Response(error.body).json().catch(() => ({}));
      if (body.agentId) {
        const { data: agent } = await errorSupabase
          .from('agents')
          .select('user_id, name')
          .eq('id', body.agentId)
          .single();
        
        if (agent) {
          await errorSupabase.from('notifications').insert({
            user_id: agent.user_id,
            type: 'agent',
            title: 'Agent Error',
            message: `Agent "${agent.name}" encountered an error while responding`,
            data: { agent_id: body.agentId, error: error.message, requestId },
            read: false
          });
          log.info('Agent error notification created');
        }
      }
    } catch (notifError) {
      log.error('Failed to create error notification', { error: notifError.message });
    }
    
    return createErrorResponse(
      requestId,
      ErrorCodes.INTERNAL_ERROR,
      error.message || 'An error occurred',
      500,
      totalDuration
    );
  }
});
