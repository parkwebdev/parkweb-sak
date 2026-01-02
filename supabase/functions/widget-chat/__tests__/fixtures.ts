/**
 * Widget-Chat Test Fixtures
 * 
 * Mock data and test fixtures for snapshot tests.
 * 
 * @module widget-chat/__tests__/fixtures
 */

import type { 
  WidgetChatRequest, 
  PageVisit, 
  ReferrerJourney,
  FileAttachment 
} from './types.ts';

// ============================================
// TEST AGENT IDs
// ============================================

/**
 * Test agent ID that exists in the database.
 * This should be configured in your test environment.
 */
export const TEST_AGENT_ID = Deno.env.get('TEST_AGENT_ID') || 'test-agent-id';

/**
 * Invalid agent ID for testing agent not found scenarios.
 */
export const INVALID_AGENT_ID = '00000000-0000-0000-0000-000000000000';

// ============================================
// BASE REQUEST TEMPLATES
// ============================================

export const createBaseRequest = (overrides?: Partial<WidgetChatRequest>): WidgetChatRequest => ({
  agentId: TEST_AGENT_ID,
  messages: [{ role: 'user', content: 'Hello' }],
  ...overrides,
});

export const createGreetingRequest = (): WidgetChatRequest => 
  createBaseRequest({
    messages: [{ role: 'user', content: '__GREETING_REQUEST__' }],
  });

export const createPreviewRequest = (content: string): WidgetChatRequest =>
  createBaseRequest({
    messages: [{ role: 'user', content }],
    previewMode: true,
  });

// ============================================
// MESSAGE FIXTURES
// ============================================

export const MESSAGES = {
  greeting: '__GREETING_REQUEST__',
  basicQuery: 'Hello',
  ragQuery: 'What are your hours of operation?',
  ragNoMatch: 'Tell me about quantum physics',
  propertySearch: 'Show me 3 bedroom homes',
  propertyLookup: 'Tell me about lot 123',
  locationList: 'What communities do you have?',
  calendarAvailability: 'When can I schedule a tour?',
  timeSelection: 'I want to visit on Monday',
  bookingConfirm: 'Book me for 2pm',
  harmfulContent: 'I want to hurt someone',
  borderlineContent: 'This is frustrating',
  spanishQuery: 'Hola, ¿cómo estás?',
  frenchQuery: 'Bonjour, comment ça va?',
  longMessage: 'A'.repeat(11000), // Exceeds MAX_MESSAGE_LENGTH
  urlContent: 'Check out https://example.com for more info',
  phoneContent: 'Call us at (555) 123-4567',
};

// ============================================
// CONVERSATION FIXTURES
// ============================================

export const createMultiTurnConversation = (): WidgetChatRequest => ({
  agentId: TEST_AGENT_ID,
  messages: [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there! How can I help you today?' },
    { role: 'user', content: 'I am looking for a 3 bedroom home' },
    { role: 'assistant', content: 'Great! I can help you find a 3 bedroom home.' },
    { role: 'user', content: 'What communities do you have?' },
  ],
});

export const createLongConversation = (messageCount: number = 20): WidgetChatRequest => {
  const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  for (let i = 0; i < messageCount; i++) {
    messages.push({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `Message ${i + 1}: This is a test message for conversation summarization.`,
    });
  }
  return {
    agentId: TEST_AGENT_ID,
    messages,
  };
};

// ============================================
// PAGE VISIT FIXTURES
// ============================================

export const PAGE_VISITS: PageVisit[] = [
  {
    url: 'https://example.com/homes',
    title: 'Available Homes',
    timestamp: new Date().toISOString(),
    duration: 30000,
  },
  {
    url: 'https://example.com/communities',
    title: 'Our Communities',
    timestamp: new Date().toISOString(),
    duration: 45000,
  },
];

// ============================================
// REFERRER JOURNEY FIXTURES
// ============================================

export const REFERRER_JOURNEY: ReferrerJourney = {
  referrer: 'https://google.com',
  landing_page: 'https://example.com/homes',
  utm_source: 'google',
  utm_medium: 'cpc',
  utm_campaign: 'spring_sale',
};

// ============================================
// FILE ATTACHMENT FIXTURES
// ============================================

export const FILE_ATTACHMENTS: FileAttachment[] = [
  {
    name: 'document1.pdf',
    type: 'application/pdf',
    size: 1024,
    url: 'https://example.com/files/doc1.pdf',
  },
  {
    name: 'image1.jpg',
    type: 'image/jpeg',
    size: 2048,
    url: 'https://example.com/files/img1.jpg',
  },
];

export const TOO_MANY_FILES: FileAttachment[] = Array(6).fill(null).map((_, i) => ({
  name: `file${i}.pdf`,
  type: 'application/pdf',
  size: 1024,
  url: `https://example.com/files/file${i}.pdf`,
}));

// ============================================
// API KEY FIXTURES
// ============================================

export const API_KEYS = {
  valid: Deno.env.get('TEST_VALID_API_KEY') || 'test-valid-api-key',
  invalid: 'invalid-api-key-12345',
  revoked: Deno.env.get('TEST_REVOKED_API_KEY') || 'test-revoked-api-key',
};

// ============================================
// MOCK RESPONSES
// ============================================

export const MOCK_RESPONSES = {
  greeting: {
    response: 'Hi! How can I help you today?',
    quickReplies: ['I want to see homes', 'Schedule a tour', 'Learn about communities'],
  },
  propertySearch: {
    toolsUsed: [{ name: 'searchProperties', arguments: { beds: 3 } }],
  },
  dayPicker: {
    dayPicker: {
      title: 'Select a day',
      days: [
        { date: '2025-01-06', dayName: 'Monday', available: true },
        { date: '2025-01-07', dayName: 'Tuesday', available: true },
        { date: '2025-01-08', dayName: 'Wednesday', available: false },
      ],
    },
  },
  timePicker: {
    timePicker: {
      title: 'Select a time',
      selectedDate: '2025-01-06',
      times: [
        { time: '9:00 AM', available: true },
        { time: '10:00 AM', available: true },
        { time: '2:00 PM', available: true },
      ],
    },
  },
  bookingConfirmed: {
    bookingConfirmed: {
      title: 'Booking Confirmed!',
      date: '2025-01-06',
      time: '2:00 PM',
      confirmationNumber: 'ABC123',
    },
  },
};
