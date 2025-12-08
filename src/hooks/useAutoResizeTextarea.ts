import { useEffect, RefObject } from 'react';

interface UseAutoResizeTextareaOptions {
  minRows?: number;
  maxRows?: number;
  lineHeight?: number;
}

/**
 * Hook for automatically resizing a textarea based on content.
 * Adjusts height between min and max rows as user types.
 * 
 * @param {RefObject<HTMLTextAreaElement>} textareaRef - Ref to the textarea element
 * @param {string} value - Current textarea value (triggers resize on change)
 * @param {UseAutoResizeTextareaOptions} options - Resize options
 * @param {number} [options.minRows=1] - Minimum number of rows
 * @param {number} [options.maxRows=5] - Maximum number of rows
 * @param {number} [options.lineHeight=20] - Line height in pixels
 */
export function useAutoResizeTextarea(
  textareaRef: RefObject<HTMLTextAreaElement>,
  value: string,
  options: UseAutoResizeTextareaOptions = {}
) {
  const { minRows = 1, maxRows = 5, lineHeight = 20 } = options;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate min and max heights
    const minHeight = minRows * lineHeight + 16; // 16px for padding
    const maxHeight = maxRows * lineHeight + 16;

    // Get the scroll height and clamp it
    const scrollHeight = textarea.scrollHeight;
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);

    textarea.style.height = `${newHeight}px`;
    textarea.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, minRows, maxRows, lineHeight]);
}
