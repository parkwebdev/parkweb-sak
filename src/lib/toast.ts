import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

type ToastFunction = {
  (options: ToastOptions): void;
  success: (message: string, options?: { description?: string; duration?: number }) => void;
  error: (message: string, options?: { description?: string; duration?: number }) => void;
  warning: (message: string, options?: { description?: string; duration?: number }) => void;
};

const toastImpl = (options: ToastOptions) => {
  const message = options.description || options.title || '';
  const title = options.title;

  if (options.variant === 'destructive') {
    sonnerToast.error(title || 'Error', {
      description: options.description,
    });
  } else {
    sonnerToast.success(title || 'Success', {
      description: options.description,
    });
  }
};

// Extend with direct methods for better sonner compatibility
toastImpl.success = (message: string, options?: { description?: string; duration?: number }) => {
  sonnerToast.success(message, options);
};

toastImpl.error = (message: string, options?: { description?: string; duration?: number }) => {
  sonnerToast.error(message, options);
};

toastImpl.warning = (message: string, options?: { description?: string; duration?: number }) => {
  sonnerToast.warning(message, options);
};

export const toast = toastImpl as ToastFunction;
