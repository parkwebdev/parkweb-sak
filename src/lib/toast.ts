/**
 * Toast Notification Utilities
 * 
 * Provides a structured wrapper around the Sonner toast library with
 * consistent action formatting and a progress toast helper for long operations.
 * 
 * @module lib/toast
 * @see https://sonner.dev
 */

import { toast as sonnerToast, ExternalToast } from 'sonner';

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
 * Options for promise-based toasts
 * @template T - Type of the promise result
 */
interface PromiseOptions<T> {
  /** Message shown while loading */
  loading: string;
  /** Message shown on success (or function receiving result) */
  success: string | ((data: T) => string);
  /** Message shown on error (or function receiving error) */
  error: string | ((error: any) => string);
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
  promise: <T>(promise: Promise<T>, options: PromiseOptions<T>) => Promise<T>;
  dismiss: (id?: string | number) => void;
  update: (id: string | number, message: string, options?: ToastOptions) => void;
};

/**
 * Converts our action format to Sonner's expected format
 * @internal
 */
const formatAction = (action?: ToastAction) => 
  action ? { label: action.label, onClick: action.onClick } : undefined;

const toastImpl = (message: string, options?: ToastOptions) => {
  return sonnerToast(message, {
    ...options,
    action: formatAction(options?.action),
    cancel: formatAction(options?.cancel),
  });
};

toastImpl.success = (message: string, options?: ToastOptions) => {
  return sonnerToast.success(message, {
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
  sonnerToast.dismiss(id);
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
