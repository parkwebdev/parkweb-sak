/**
 * Browser Tab Notification Utilities
 * 
 * Provides utilities for browser tab notifications:
 * - Title flashing with unread count
 * - Dynamic favicon badge with count overlay
 * - Visibility-aware notification clearing
 * 
 * @module lib/tab-notifications
 */

let originalTitle = '';
let originalFaviconHref = '';
let flashInterval: ReturnType<typeof setInterval> | null = null;
let currentBadgeCount = 0;

/**
 * Initialize original values (call once on app load)
 */
export function initTabNotifications(): void {
  originalTitle = document.title;
  const faviconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (faviconLink) {
    originalFaviconHref = faviconLink.href;
  }
}

/**
 * Check if the browser tab is currently focused/visible
 */
export function isTabFocused(): boolean {
  return document.visibilityState === 'visible';
}

/**
 * Set unread count in the page title
 * Format: "(3) Original Title"
 */
export function setUnreadTitle(count: number): void {
  if (!originalTitle) {
    originalTitle = document.title.replace(/^\(\d+\)\s*/, '');
  }
  
  if (count > 0) {
    document.title = `(${count}) ${originalTitle}`;
  } else {
    document.title = originalTitle;
  }
}

/**
 * Flash the title between a message and original title
 * Used to get user attention when tab is not focused
 */
export function flashTitle(message: string, intervalMs = 1000): void {
  // Don't flash if tab is focused
  if (isTabFocused()) return;
  
  // Clear any existing flash
  stopFlashTitle();
  
  if (!originalTitle) {
    originalTitle = document.title.replace(/^\(\d+\)\s*/, '');
  }
  
  let showMessage = true;
  flashInterval = setInterval(() => {
    document.title = showMessage ? message : originalTitle;
    showMessage = !showMessage;
  }, intervalMs);
}

/**
 * Stop the title flashing
 */
export function stopFlashTitle(): void {
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
  }
}

/**
 * Clear all title notifications and restore original
 */
export function clearTitleNotification(): void {
  stopFlashTitle();
  if (originalTitle) {
    document.title = originalTitle;
  }
}

/**
 * Set a badge overlay on the favicon with the given count
 * Uses canvas API to draw a red circle with count
 */
export function setFaviconBadge(count: number): void {
  if (count === currentBadgeCount) return;
  currentBadgeCount = count;
  
  if (count <= 0) {
    clearFaviconBadge();
    return;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  const img = new Image();
  img.crossOrigin = 'anonymous';
  
  img.onload = () => {
    // Draw original favicon
    ctx.drawImage(img, 0, 0, 32, 32);
    
    // Draw red badge circle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(24, 8, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw white border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw count text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count > 9 ? '9+' : String(count), 24, 8);
    
    // Update favicon link
    updateFaviconLink(canvas.toDataURL('image/png'));
  };
  
  img.onerror = () => {
    // If image fails to load, just draw the badge without base image
    ctx.fillStyle = '#6366f1'; // Indigo as fallback background
    ctx.fillRect(0, 0, 32, 32);
    
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(24, 8, 8, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(count > 9 ? '9+' : String(count), 24, 8);
    
    updateFaviconLink(canvas.toDataURL('image/png'));
  };
  
  // Use the original favicon or fallback
  img.src = originalFaviconHref || '/favicon.ico';
}

/**
 * Clear the favicon badge and restore original
 */
export function clearFaviconBadge(): void {
  currentBadgeCount = 0;
  if (originalFaviconHref) {
    updateFaviconLink(originalFaviconHref);
  }
}

/**
 * Update the favicon link element
 */
function updateFaviconLink(href: string): void {
  let faviconLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  
  if (!faviconLink) {
    faviconLink = document.createElement('link');
    faviconLink.rel = 'icon';
    document.head.appendChild(faviconLink);
  }
  
  faviconLink.href = href;
}

/**
 * Clear all tab notifications (title and favicon)
 */
export function clearAllTabNotifications(): void {
  clearTitleNotification();
  clearFaviconBadge();
}
