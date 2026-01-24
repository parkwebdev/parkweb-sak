/**
 * RichTextEditorWrapper
 * 
 * Lazy-loading wrapper for the RichTextEditor component.
 * Defers loading of Tiptap (~100KB) until the editor is needed.
 * 
 * @module components/ui/RichTextEditorWrapper
 */

import { lazy, Suspense } from 'react';
import { Skeleton } from './skeleton';

const RichTextEditor = lazy(() =>
  import('./rich-text-editor').then((m) => ({ default: m.RichTextEditor }))
);

interface RichTextEditorWrapperProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  agentId?: string;
  userId?: string;
  className?: string;
  minHeight?: string;
  /** When true, only show Bold, Italic, and Link buttons. Disables image upload. */
  minimalMode?: boolean;
}

export function RichTextEditorWrapper(props: RichTextEditorWrapperProps) {
  return (
    <Suspense fallback={<Skeleton className={props.className} style={{ minHeight: props.minHeight || '200px' }} />}>
      <RichTextEditor {...props} />
    </Suspense>
  );
}
