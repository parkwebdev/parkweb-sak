import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
}

export const toast = (options: ToastOptions) => {
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
