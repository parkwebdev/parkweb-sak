/**
 * Toast Notification Utilities
 * 
 * Provides a structured wrapper around the Sonner toast library with
 * consistent action formatting, progress toast helper, undo pattern,
 * deduplication, and persistent notifications.
 * 
 * ## API Reference
 * 
 * | Method | Description | Duration |
 * |--------|-------------|----------|
 * | `toast.success(msg)` | Success feedback | 3s |
 * | `toast.error(msg)` | Error notification | 4s |
 * | `toast.warning(msg)` | Warning notification | 4s |
 * | `toast.info(msg)` | Info notification | 4s |
 * | `toast.loading(msg)` | Loading state | Until dismissed |
 * | `toast.saving(msg)` | Auto-save indicator | Min 2s |
 * | `toast.undo(msg, { onUndo })` | Destructive action with undo | 5s |
 * | `toast.dedupe(key, msg)` | Prevent spam (2s window) | 4s |
 * | `toast.persistent(msg)` | Critical, manual dismiss | Infinite |
 * | `toast.promise(promise, opts)` | Async operation tracker | Auto |
 * | `toast.dismiss(id?)` | Dismiss specific or all | - |
 * 
 * @module lib/toast
 * @see https://sonner.dev
 */

import { toast as sonnerToast, ExternalToast } from 'sonner';

/** Minimum time saving toasts should be visible (2 seconds) */
const SAVING_MIN_DURATION_MS = 2000;

/** Window for deduplication (2 seconds) */
const DEDUPE_WINDOW_MS = 2000;

/** Default duration for undo toasts (5 seconds) */
const UNDO_DURATION_MS = 5000;

/** Default duration for success toasts (3 seconds) */
const SUCCESS_DURATION_MS = 3000;

/** Track when saving toasts were created to enforce minimum duration */
const savingToastStartedAt = new Map<string | number, number>();

/** Track recent toasts for deduplication */
const recentToasts = new Map<string, { id: string | number; expiry: number }>();

/**
 * Action button configuration for toast notifications
 */
interface ToastAction {
  /** Button label text */
  label: string;
  /** Click handler function */
  onClick: () => void;
}

/**
 * Options for toast notifications
 */
interface ToastOptions extends Omit<ExternalToast, 'action' | 'cancel'> {
  /** Secondary description text */
  description?: string;
  /** Primary action button */
  action?: ToastAction;
  /** Cancel/dismiss button */
  cancel?: ToastAction;
}

/**
 * Options for undo toasts (destructive action recovery)
 */
interface UndoOptions extends Omit<ToastOptions, 'action'> {
  /** Called when user clicks Undo button */
  onUndo: () => void | Promise<void>;
  /** Duration before auto-close (default: 5000ms) */
  duration?: number;
}

/**
 * Options for promise-based toasts
 * @template T - Type of the promise result
 */
interface PromiseOptions<T> {
  /** Message shown while loading */
  loading: string;
  /** Message shown on success (or function receiving result) */
  success: string | ((data: T) => string);
  /** Message shown on error (or function receiving error) */
  error: string | ((error: unknown) => string);
  /** Optional description */
  description?: string;
  /** Callback run after promise settles */
  finally?: () => void;
}

/**
 * Progress toast controller for tracking long-running operations
 */
interface ProgressToast {
  /** Toast ID for updates */
  id: string | number;
  /** Update the loading message and optional progress percentage */
  update: (message: string, progress?: number) => void;
  /** Mark operation as successful */
  success: (message: string) => void;
  /** Mark operation as failed */
  error: (message: string) => void;
  /** Dismiss the toast */
  dismiss: () => void;
}

/**
 * Toast function type with all available methods
 */
type ToastFunction = {
  (message: string, options?: ToastOptions): string | number;
  success: (message: string, options?: ToastOptions) => string | number;
  error: (message: string, options?: ToastOptions) => string | number;
  warning: (message: string, options?: ToastOptions) => string | number;
  info: (message: string, options?: ToastOptions) => string | number;
  loading: (message: string, options?: ToastOptions) => string | number;
  saving: (message?: string) => string | number;
  promise: <T>(promise: Promise<T>, options: PromiseOptions<T>) => Promise<T>;
  dismiss: (id?: string | number) => void;
  update: (id: string | number, message: string, options?: ToastOptions) => void;
  /** Show toast with undo action for destructive operations */
  undo: (message: string, options: UndoOptions) => string | number;
  /** Show toast with deduplication (prevents spam within 2s window) */
  dedupe: (key: string, message: string, options?: ToastOptions) => string | number;
  /** Show persistent toast that requires manual dismissal */
  persistent: (message: string, options?: ToastOptions) => string | number;
};

/**
 * Converts our action format to Sonner's expected format
 * @internal
 */
const formatAction = (action?: ToastAction) => 
  action ? { label: action.label, onClick: action.onClick } : undefined;

/**
 * Clean up expired entries from the dedupe map
 * @internal
 */
const cleanupDedupeMap = () => {
  const now = Date.now();
  for (const [key, value] of recentToasts.entries()) {
    if (value.expiry <= now) {
      recentToasts.delete(key);
    }
  }
};

const toastImpl = (message: string, options?: ToastOptions) => {
  return sonnerToast(message, {
    ...options,
    action: formatAction(options?.action),
    cancel: formatAction(options?.cancel),
  });
};

toastImpl.success = (message: string, options?: ToastOptions) => {
  return sonnerToast.success(message, {
    duration: SUCCESS_DURATION_MS,
    ...options,
    action: formatAction(options?.action),
    cancel: formatAction(options?.cancel),
  });
};

toastImpl.error = (message: string, options?: ToastOptions) => {
  return sonnerToast.error(message, {
    ...options,
    action: formatAction(options?.action),
    cancel: formatAction(options?.cancel),
  });
};

toastImpl.warning = (message: string, options?: ToastOptions) => {
  return sonnerToast.warning(message, {
    ...options,
    action: formatAction(options?.action),
    cancel: formatAction(options?.cancel),
  });
};

toastImpl.info = (message: string, options?: ToastOptions) => {
  return sonnerToast.info(message, {
    ...options,
    action: formatAction(options?.action),
    cancel: formatAction(options?.cancel),
  });
};

toastImpl.loading = (message: string, options?: ToastOptions) => {
  return sonnerToast.loading(message, {
    ...options,
    action: formatAction(options?.action),
    cancel: formatAction(options?.cancel),
  });
};

toastImpl.saving = (message: string = 'Saving...') => {
  const id = sonnerToast.loading(message, {
    duration: Infinity, // Never auto-dismiss, we control it
  });
  savingToastStartedAt.set(id, Date.now());
  return id;
};

toastImpl.promise = <T>(promise: Promise<T>, options: PromiseOptions<T>): Promise<T> => {
  sonnerToast.promise(promise, {
    loading: options.loading,
    success: options.success,
    error: options.error,
    description: options.description,
    finally: options.finally,
  });
  return promise;
};

toastImpl.dismiss = (id?: string | number) => {
  // If no id, dismiss all toasts immediately
  if (id === undefined) {
    savingToastStartedAt.clear();
    sonnerToast.dismiss();
    return;
  }

  // Check if this is a saving toast that needs minimum duration
  const startTime = savingToastStartedAt.get(id);
  if (startTime !== undefined) {
    const elapsed = Date.now() - startTime;
    const remainingTime = SAVING_MIN_DURATION_MS - elapsed;

    if (remainingTime > 0) {
      // Delay dismissal to meet minimum duration
      setTimeout(() => {
        savingToastStartedAt.delete(id);
        sonnerToast.dismiss(id);
      }, remainingTime);
    } else {
      // Already met minimum duration, dismiss immediately
      savingToastStartedAt.delete(id);
      sonnerToast.dismiss(id);
    }
  } else {
    // Not a saving toast, dismiss immediately
    sonnerToast.dismiss(id);
  }
};

toastImpl.update = (id: string | number, message: string, options?: ToastOptions) => {
  sonnerToast.loading(message, { 
    id, 
    ...options,
    action: formatAction(options?.action),
    cancel: formatAction(options?.cancel),
  });
};

/**
 * Show a toast with an undo action for destructive operations.
 * 
 * @param message - The message to display
 * @param options - Options including the onUndo callback
 * @returns The toast ID
 * 
 * @example
 * ```tsx
 * const handleDelete = async () => {
 *   const deletedItem = await softDelete(itemId);
 *   toast.undo('Item deleted', {
 *     onUndo: () => restore(deletedItem),
 *     description: 'Click undo to restore',
 *   });
 * };
 * ```
 */
toastImpl.undo = (message: string, options: UndoOptions) => {
  const { onUndo, duration = UNDO_DURATION_MS, ...rest } = options;
  
  return sonnerToast(message, {
    duration,
    ...rest,
    action: {
      label: 'Undo',
      onClick: async () => {
        await onUndo();
      },
    },
    cancel: formatAction(rest.cancel),
  });
};

/**
 * Show a toast with deduplication to prevent spamming.
 * If the same key is used within 2 seconds, the toast is not shown again.
 * 
 * @param key - Unique key for deduplication
 * @param message - The message to display
 * @param options - Standard toast options
 * @returns The toast ID (existing if deduplicated)
 * 
 * @example
 * ```tsx
 * // Only shows one "Connection lost" toast every 2 seconds
 * toast.dedupe('connection-lost', 'Connection lost', { 
 *   description: 'Retrying...' 
 * });
 * ```
 */
toastImpl.dedupe = (key: string, message: string, options?: ToastOptions) => {
  const now = Date.now();
  const existing = recentToasts.get(key);
  
  // If same key was toasted recently, return existing ID
  if (existing && existing.expiry > now) {
    return existing.id;
  }
  
  // Clean up expired entries periodically
  cleanupDedupeMap();
  
  const id = sonnerToast(message, {
    ...options,
    action: formatAction(options?.action),
    cancel: formatAction(options?.cancel),
  });
  
  recentToasts.set(key, { id, expiry: now + DEDUPE_WINDOW_MS });
  return id;
};

/**
 * Show a persistent toast that requires manual dismissal.
 * Use for critical notifications that the user must acknowledge.
 * 
 * @param message - The message to display
 * @param options - Standard toast options
 * @returns The toast ID
 * 
 * @example
 * ```tsx
 * // Show critical error that must be acknowledged
 * const id = toast.persistent('Session expired', {
 *   description: 'Please log in again',
 *   action: { label: 'Log in', onClick: () => navigate('/login') }
 * });
 * 
 * // Manually dismiss when resolved
 * toast.dismiss(id);
 * ```
 */
toastImpl.persistent = (message: string, options?: ToastOptions) => {
  return sonnerToast(message, {
    ...options,
    duration: Infinity,
    dismissible: true,
    action: formatAction(options?.action),
    cancel: formatAction(options?.cancel),
  });
};

/**
 * Toast notification API with multiple notification types.
 * 
 * @example
 * // Simple notifications
 * toast.success('Saved successfully');
 * toast.error('Failed to save');
 * toast.warning('Please review');
 * toast.info('New update available');
 * 
 * @example
 * // With action buttons
 * toast.error('Failed to save', {
 *   action: { label: 'Retry', onClick: () => save() },
 *   cancel: { label: 'Dismiss', onClick: () => {} }
 * });
 * 
 * @example
 * // Undo pattern for destructive actions
 * toast.undo('Item deleted', {
 *   onUndo: () => restoreItem(),
 *   description: 'Click undo to restore'
 * });
 * 
 * @example
 * // Deduplication to prevent spam
 * toast.dedupe('network-error', 'Connection failed');
 * 
 * @example
 * // Persistent for critical messages
 * toast.persistent('Action required', {
 *   action: { label: 'Fix now', onClick: () => fix() }
 * });
 * 
 * @example
 * // Promise-based
 * toast.promise(saveData(), {
 *   loading: 'Saving...',
 *   success: 'Saved!',
 *   error: 'Failed to save'
 * });
 */
export const toast = toastImpl as ToastFunction;

/**
 * Creates a progress toast for tracking long-running operations.
 * Returns a controller object for updating, completing, or dismissing the toast.
 * 
 * @param initialMessage - Initial loading message to display
 * @returns ProgressToast controller object
 * 
 * @example
 * const progress = createProgressToast('Uploading files...');
 * 
 * try {
 *   for (let i = 0; i < files.length; i++) {
 *     await uploadFile(files[i]);
 *     progress.update('Uploading files...', ((i + 1) / files.length) * 100);
 *   }
 *   progress.success('All files uploaded!');
 * } catch (error) {
 *   progress.error('Upload failed');
 * }
 */
export const createProgressToast = (initialMessage: string): ProgressToast => {
  const id = sonnerToast.loading(initialMessage);
  
  return {
    id,
    update: (message: string, progress?: number) => {
      const displayMessage = progress !== undefined 
        ? `${message} (${Math.round(progress)}%)`
        : message;
      sonnerToast.loading(displayMessage, { id });
    },
    success: (message: string) => {
      sonnerToast.success(message, { id });
    },
    error: (message: string) => {
      sonnerToast.error(message, { id });
    },
    dismiss: () => {
      sonnerToast.dismiss(id);
    },
  };
};

// Re-export types for consumers
export type { ToastOptions, UndoOptions, PromiseOptions, ProgressToast, ToastAction };
