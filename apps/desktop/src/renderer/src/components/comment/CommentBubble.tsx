import { useT } from '@open-codesign/i18n';
import { MessageSquareText, Sparkles, X } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface CommentBubbleProps {
  selector: string;
  tag: string;
  outerHTML: string;
  rect: { top: number; left: number; width: number; height: number };
  initialText?: string;
  onClose: () => void;
  /** Save as a sticky note (no LLM call). */
  onSaveNote: (text: string) => Promise<void> | void;
  /** Save as a pending edit chip that surfaces in the prompt composer. */
  onSendToClaude: (text: string) => Promise<void> | void;
}

/**
 * Floating composer anchored at the clicked element. Portaled to body so the
 * bubble escapes the iframe-scaled preview parent (otherwise the zoom wrapper
 * would shrink the text to unreadable sizes).
 */
export function CommentBubble({
  selector,
  tag,
  outerHTML,
  rect,
  initialText,
  onClose,
  onSaveNote,
  onSendToClaude,
}: CommentBubbleProps) {
  const t = useT();
  const [draft, setDraft] = useState(initialText ?? '');
  const [pending, setPending] = useState<'note' | 'edit' | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleId = useId();

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current) return;
      if (e.target instanceof Node && rootRef.current.contains(e.target)) return;
      onClose();
    }
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDocClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDocClick);
    };
  }, [onClose]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
  }, []);

  async function handleSave(kind: 'note' | 'edit') {
    const text = draft.trim();
    if (!text || pending) return;
    setPending(kind);
    try {
      if (kind === 'note') await onSaveNote(text);
      else await onSendToClaude(text);
    } finally {
      setPending(null);
    }
  }

  const preview = outerHTML.slice(0, 80);
  const anchorTop = Math.max(rect.top + rect.height + 8, 12);
  const anchorLeft = Math.max(rect.left, 12);

  return createPortal(
    <div
      ref={rootRef}
      // biome-ignore lint/a11y/useSemanticElements: floating popover should not steal Tab order like native <dialog>.
      role="dialog"
      aria-labelledby={titleId}
      aria-modal="false"
      className="fixed z-[60] w-[min(360px,90vw)] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-elevated)]"
      style={{ top: `${anchorTop}px`, left: `${anchorLeft}px` }}
    >
      <div className="flex items-start justify-between gap-[var(--space-2)] border-b border-[var(--color-border-muted)] px-[var(--space-3)] py-[var(--space-2)]">
        <div className="min-w-0">
          <div
            id={titleId}
            className="inline-flex items-center gap-[var(--space-2)] text-[var(--text-xs)] font-medium text-[var(--color-text-primary)]"
          >
            <MessageSquareText
              className="h-[var(--size-icon-sm)] w-[var(--size-icon-sm)] text-[var(--color-accent)]"
              aria-hidden
            />
            {t('commentBubble.title')} <code className="text-[var(--text-xs)]">{tag}</code>
          </div>
          <p
            className="mt-[var(--space-0_5)] truncate font-mono text-[10px] text-[var(--color-text-muted)]"
            title={selector}
          >
            {preview}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-[var(--radius-md)] p-[var(--space-1)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
          aria-label={t('commentBubble.close')}
        >
          <X className="h-[var(--size-icon-sm)] w-[var(--size-icon-sm)]" />
        </button>
      </div>

      <div className="space-y-[var(--space-2)] p-[var(--space-3)]">
        <textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            const el = e.currentTarget;
            el.style.height = 'auto';
            el.style.height = `${Math.min(el.scrollHeight, 96)}px`;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void handleSave('edit');
            }
          }}
          placeholder={t('commentBubble.placeholder')}
          rows={1}
          disabled={pending !== null}
          className="block w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-background)] px-[var(--space-2_5)] py-[var(--space-2)] text-[var(--text-sm)] leading-[1.5] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:shadow-[0_0_0_3px_var(--color-focus-ring)]"
        />
        <div className="flex items-center justify-end gap-[var(--space-2)]">
          <button
            type="button"
            onClick={() => void handleSave('note')}
            disabled={!draft.trim() || pending !== null}
            className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-2_5)] py-[var(--space-1_5)] text-[var(--text-xs)] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-hover)] disabled:pointer-events-none disabled:opacity-40"
          >
            <MessageSquareText
              className="h-[var(--size-icon-xs)] w-[var(--size-icon-xs)]"
              aria-hidden
            />
            {pending === 'note' ? t('commentBubble.saving') : t('commentBubble.saveNote')}
          </button>
          <button
            type="button"
            onClick={() => void handleSave('edit')}
            disabled={!draft.trim() || pending !== null}
            className="inline-flex items-center gap-[var(--space-1)] rounded-[var(--radius-md)] bg-[var(--color-accent)] px-[var(--space-2_5)] py-[var(--space-1_5)] text-[var(--text-xs)] font-medium text-white shadow-[var(--shadow-soft)] transition-colors hover:bg-[var(--color-accent-hover)] disabled:pointer-events-none disabled:opacity-40"
          >
            <Sparkles className="h-[var(--size-icon-xs)] w-[var(--size-icon-xs)]" aria-hidden />
            {pending === 'edit' ? t('commentBubble.sending') : t('commentBubble.sendToClaude')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
