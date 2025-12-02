import { toast as sonnerToast, ExternalToast } from 'sonner';

interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastOptions extends Omit<ExternalToast, 'action' | 'cancel'> {
  description?: string;
  action?: ToastAction;
  cancel?: ToastAction;
}

interface PromiseOptions<T> {
  loading: string;
  success: string | ((data: T) => string);
  error: string | ((error: any) => string);
  description?: string;
  finally?: () => void;
}

interface ProgressToast {
  id: string | number;
  update: (message: string, progress?: number) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  dismiss: () => void;
}

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

// Convert our action format to Sonner's format
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

export const toast = toastImpl as ToastFunction;

// Helper function for progress toasts
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
