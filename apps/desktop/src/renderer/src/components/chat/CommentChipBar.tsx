import { useT } from '@open-codesign/i18n';
import { MessageSquareText, X } from 'lucide-react';
import { useCodesignStore } from '../../store';

/**
 * Row of chips representing comments with kind='edit' + status='pending'.
 * Sits directly above SkillChipBar in the Sidebar composer area and
 * collapses to nothing when empty so the prompt area stays compact.
 *
 * Click a chip body → reopen the bubble for that comment.
 * Click the × → delete the comment (pin disappears too).
 */
export function CommentChipBar() {
  const t = useT();
  const comments = useCodesignStore((s) => s.comments);
  const openCommentBubble = useCodesignStore((s) => s.openCommentBubble);
  const removeComment = useCodesignStore((s) => s.removeComment);
  const previewZoom = useCodesignStore((s) => s.previewZoom);

  const pending = comments.filter((c) => c.kind === 'edit' && c.status === 'pending');
  if (pending.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-[var(--space-1_5)]" aria-label={t('commentChip.empty')}>
      {pending.map((c) => (
        <li
          key={c.id}
          className="inline-flex max-w-full items-center gap-[var(--space-1_5)] rounded-full border border-[var(--color-accent)] bg-[var(--color-surface)] py-[var(--space-0_5)] pl-[var(--space-2)] pr-[var(--space-1)] text-[var(--text-2xs)] text-[var(--color-text-primary)] shadow-[var(--shadow-soft)]"
        >
          <button
            type="button"
            onClick={() =>
              openCommentBubble({
                selector: c.selector,
                tag: c.tag,
                outerHTML: c.outerHTML,
                rect: {
                  top: c.rect.top * (previewZoom / 100),
                  left: c.rect.left * (previewZoom / 100),
                  width: c.rect.width * (previewZoom / 100),
                  height: c.rect.height * (previewZoom / 100),
                },
                existingCommentId: c.id,
                initialText: c.text,
              })
            }
            className="inline-flex min-w-0 items-center gap-[var(--space-1)]"
            title={c.text}
          >
            <MessageSquareText
              className="h-[var(--size-icon-xs)] w-[var(--size-icon-xs)] shrink-0 text-[var(--color-accent)]"
              aria-hidden
            />
            <span className="truncate max-w-[180px]">{c.text}</span>
          </button>
          <button
            type="button"
            onClick={() => void removeComment(c.id)}
            className="inline-flex items-center justify-center rounded-full text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            aria-label={t('commentChip.dismiss')}
          >
            <X className="h-[var(--size-icon-xs)] w-[var(--size-icon-xs)]" />
          </button>
        </li>
      ))}
    </ul>
  );
}
