/**
 * Inline CSS for ChatPad Widget
 * This CSS is injected into the Shadow DOM to ensure style isolation
 */

export const WIDGET_STYLES = `
/* Reset and Base Styles */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

:host {
  all: initial;
  display: block;
}

/* CSS Variables - Light Theme */
:root, #chatpad-widget-root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  --radius: 0.5rem;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: hsl(var(--foreground));
}

/* Tailwind Utility Classes */
.fixed { position: fixed; }
.absolute { position: absolute; }
.relative { position: relative; }
.inset-0 { top: 0; right: 0; bottom: 0; left: 0; }
.bottom-4 { bottom: 1rem; }
.right-4 { right: 1rem; }
.bottom-20 { bottom: 5rem; }
.left-4 { left: 1rem; }
.top-0 { top: 0; }
.-top-1 { top: -0.25rem; }
.-right-1 { right: -0.25rem; }
.-top-2 { top: -0.5rem; }
.-right-2 { right: -0.5rem; }
.top-1 { top: 0.25rem; }
.right-1 { right: 0.25rem; }
.z-50 { z-index: 50; }
.z-10 { z-index: 10; }

.flex { display: flex; }
.inline-flex { display: inline-flex; }
.grid { display: grid; }
.hidden { display: none; }
.flex-col { flex-direction: column; }
.flex-row { flex-direction: row; }
.items-center { align-items: center; }
.items-start { align-items: flex-start; }
.justify-center { justify-content: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.space-y-2 > * + * { margin-top: 0.5rem; }
.space-y-3 > * + * { margin-top: 0.75rem; }
.space-y-4 > * + * { margin-top: 1rem; }
.-space-x-2 > * + * { margin-left: -0.5rem; }

.flex-1 { flex: 1 1 0%; }
.flex-shrink-0 { flex-shrink: 0; }

.w-full { width: 100%; }
.w-11 { width: 2.75rem; }
.w-14 { width: 3.5rem; }
.w-10 { width: 2.5rem; }
.w-8 { width: 2rem; }
.w-6 { width: 1.5rem; }
.w-5 { width: 1.25rem; }
.w-4 { width: 1rem; }
.w-3 { width: 0.75rem; }
.w-16 { width: 4rem; }
.w-96 { width: 24rem; }
.w-80 { width: 20rem; }
.max-w-full { max-width: 100%; }
.max-w-xs { max-width: 20rem; }
.max-w-sm { max-width: 24rem; }
.max-w-md { max-width: 28rem; }

.h-full { height: 100%; }
.h-11 { height: 2.75rem; }
.h-14 { height: 3.5rem; }
.h-10 { height: 2.5rem; }
.h-8 { height: 2rem; }
.h-6 { height: 1.5rem; }
.h-5 { height: 1.25rem; }
.h-4 { height: 1rem; }
.h-3 { height: 0.75rem; }
.h-16 { height: 4rem; }
.h-auto { height: auto; }
.h-\[600px\] { height: 600px; }
.h-\[500px\] { height: 500px; }
.h-\[400px\] { height: 400px; }
.min-h-0 { min-height: 0; }

.p-0 { padding: 0; }
.p-1 { padding: 0.25rem; }
.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }
.px-2 { padding-left: 0.5rem; padding-right: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.px-4 { padding-left: 1rem; padding-right: 1rem; }
.px-6 { padding-left: 1.5rem; padding-right: 1.5rem; }
.py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.py-3 { padding-top: 0.75rem; padding-bottom: 0.75rem; }
.py-4 { padding-top: 1rem; padding-bottom: 1rem; }
.py-6 { padding-top: 1.5rem; padding-bottom: 1.5rem; }
.pb-16 { padding-bottom: 4rem; }
.pt-16 { padding-top: 4rem; }
.pt-20 { padding-top: 5rem; }

.m-0 { margin: 0; }
.m-2 { margin: 0.5rem; }
.mx-auto { margin-left: auto; margin-right: auto; }
.mb-2 { margin-bottom: 0.5rem; }
.mb-3 { margin-bottom: 0.75rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-1 { margin-top: 0.25rem; }
.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.mr-2 { margin-right: 0.5rem; }
.ml-2 { margin-left: 0.5rem; }
.mt-0\.5 { margin-top: 0.125rem; }

.rounded { border-radius: 0.25rem; }
.rounded-md { border-radius: 0.375rem; }
.rounded-lg { border-radius: 0.5rem; }
.rounded-xl { border-radius: 0.75rem; }
.rounded-2xl { border-radius: 1rem; }
.rounded-full { border-radius: 9999px; }
.rounded-t-lg { border-top-left-radius: 0.5rem; border-top-right-radius: 0.5rem; }
.rounded-b-lg { border-bottom-left-radius: 0.5rem; border-bottom-right-radius: 0.5rem; }

.border { border-width: 1px; }
.border-2 { border-width: 2px; }
.border-t { border-top-width: 1px; }
.border-b { border-bottom-width: 1px; }
.border-solid { border-style: solid; }
.border-background { border-color: hsl(var(--background)); }
.border-border { border-color: hsl(var(--border)); }
.border-input { border-color: hsl(var(--input)); }

.bg-background { background-color: hsl(var(--background)); }
.bg-card { background-color: hsl(var(--card)); }
.bg-primary { background-color: hsl(var(--primary)); }
.bg-secondary { background-color: hsl(var(--secondary)); }
.bg-muted { background-color: hsl(var(--muted)); }
.bg-accent { background-color: hsl(var(--accent)); }
.bg-destructive { background-color: hsl(var(--destructive)); }
.bg-white { background-color: white; }
.bg-black { background-color: black; }
.bg-red-500 { background-color: rgb(239 68 68); }
.bg-white\/10 { background-color: rgb(255 255 255 / 0.1); }
.bg-white\/20 { background-color: rgb(255 255 255 / 0.2); }

.text-foreground { color: hsl(var(--foreground)); }
.text-primary { color: hsl(var(--primary)); }
.text-primary-foreground { color: hsl(var(--primary-foreground)); }
.text-muted-foreground { color: hsl(var(--muted-foreground)); }
.text-secondary-foreground { color: hsl(var(--secondary-foreground)); }
.text-destructive { color: hsl(var(--destructive)); }
.text-white { color: white; }
.text-black { color: black; }

.text-xs { font-size: 0.75rem; line-height: 1rem; }
.text-sm { font-size: 0.875rem; line-height: 1.25rem; }
.text-base { font-size: 1rem; line-height: 1.5rem; }
.text-lg { font-size: 1.125rem; line-height: 1.75rem; }
.text-xl { font-size: 1.25rem; line-height: 1.75rem; }
.text-2xl { font-size: 1.5rem; line-height: 2rem; }
.text-3xl { font-size: 1.875rem; line-height: 2.25rem; }

.font-normal { font-weight: 400; }
.font-medium { font-weight: 500; }
.font-semibold { font-weight: 600; }
.font-bold { font-weight: 700; }

.text-left { text-align: left; }
.text-center { text-align: center; }
.text-right { text-align: right; }

.overflow-hidden { overflow: hidden; }
.overflow-y-auto { overflow-y: auto; }
.overflow-x-auto { overflow-x: auto; }

.shadow { box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1); }
.shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1); }
.shadow-lg { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1); }
.shadow-xl { box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1); }

.cursor-pointer { cursor: pointer; }
.pointer-events-none { pointer-events: none; }

.select-none { user-select: none; }

.transition { transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.transition-transform { transition-property: transform; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
.duration-200 { transition-duration: 200ms; }

.opacity-0 { opacity: 0; }
.opacity-50 { opacity: 0.5; }
.opacity-100 { opacity: 1; }

.hover\:bg-accent:hover { background-color: hsl(var(--accent)); }
.hover\:bg-white\/10:hover { background-color: rgb(255 255 255 / 0.1); }
.hover\:bg-destructive\/90:hover { background-color: hsl(var(--destructive) / 0.9); }
.hover\:text-accent-foreground:hover { color: hsl(var(--accent-foreground)); }
.hover\:opacity-100:hover { opacity: 1; }
.hover\:scale-110:hover { transform: scale(1.1); }
.hover\:scale-105:hover { transform: scale(1.05); }

.focus\:outline-none:focus { outline: 2px solid transparent; outline-offset: 2px; }
.focus\:ring-2:focus { box-shadow: 0 0 0 2px hsl(var(--ring)); }

.disabled\:pointer-events-none:disabled { pointer-events: none; }
.disabled\:opacity-50:disabled { opacity: 0.5; }

.group:hover .group-hover\:opacity-100 { opacity: 1; }

/* Animations */
@keyframes subtle-ring {
  0% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.15); opacity: 0.1; }
  100% { transform: scale(1); opacity: 0.3; }
}

@keyframes slow-pulse {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.1); opacity: 0.2; }
}

.animate-subtle-ring {
  animation: subtle-ring 2s ease-in-out infinite;
}

.animate-slow-pulse {
  animation: slow-pulse 3s ease-in-out infinite;
}

/* Button Styles */
button {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  border: none;
  background: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  font-weight: 500;
  transition: all 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

button:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 2px;
}

button:disabled {
  pointer-events: none;
  opacity: 0.5;
}

.btn-primary {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  padding: 0.5rem 1rem;
}

.btn-primary:hover {
  background-color: hsl(var(--primary) / 0.9);
}

.btn-secondary {
  background-color: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
  padding: 0.5rem 1rem;
}

.btn-secondary:hover {
  background-color: hsl(var(--secondary) / 0.8);
}

.btn-ghost {
  background-color: transparent;
  padding: 0.5rem 1rem;
}

.btn-ghost:hover {
  background-color: hsl(var(--accent));
  color: hsl(var(--accent-foreground));
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
}

.btn-icon {
  padding: 0.5rem;
  width: 2rem;
  height: 2rem;
}

/* Input Styles */
input, textarea, select {
  font-family: inherit;
  font-size: inherit;
  line-height: inherit;
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid hsl(var(--input));
  background-color: hsl(var(--background));
  padding: 0.5rem 0.75rem;
  color: hsl(var(--foreground));
}

input:focus, textarea:focus, select:focus {
  outline: none;
  box-shadow: 0 0 0 2px hsl(var(--ring));
}

input::placeholder, textarea::placeholder {
  color: hsl(var(--muted-foreground));
}

textarea {
  resize: vertical;
  min-height: 80px;
}

/* Avatar Styles */
.avatar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
  border-radius: 9999px;
  width: 2.5rem;
  height: 2.5rem;
  background-color: hsl(var(--muted));
}

.avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Scrollbar Styles */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: hsl(var(--muted) / 0.3);
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}

/* Utility Classes */
.truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.object-cover {
  object-fit: cover;
}

.whitespace-pre-wrap {
  white-space: pre-wrap;
}

.break-words {
  overflow-wrap: break-word;
}

/* Message Bubble Styles */
.message-bubble {
  max-width: 80%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  word-wrap: break-word;
}

.message-bubble-user {
  background-color: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  margin-left: auto;
  border-bottom-right-radius: 0.25rem;
}

.message-bubble-assistant {
  background-color: hsl(var(--muted));
  color: hsl(var(--foreground));
  border-bottom-left-radius: 0.25rem;
}
`;
