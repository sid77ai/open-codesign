import { useT } from '@open-codesign/i18n';
import type { CommentRow } from '@open-codesign/shared';
import { MessageSquareText, Sparkles, Trash2 } from 'lucide-react';
import { useCodesignStore } from '../../store';

interface Group {
  label: string;
  icon: typeof MessageSquareText;
  rows: CommentRow[];
}

/**
 * Tab body for the Comments sidebar tab. Lists all comments bucketed into
 * three categories so the user can eyeball what will ride along with the
 * next prompt, vs. what's already been applied, vs. standalone notes.
 */
export function CommentsTabContent() {
  const t = useT();
  const comments = useCodesignStore((s) => s.comments);
  const currentSnapshotId = useCodesignStore((s) => s.currentSnapshotId);
  const removeComment = useCodesignStore((s) => s.removeComment);

  const pendingEdits = comments.filter(
    (c) => c.kind === 'edit' && c.status === 'pending' && c.snapshotId === currentSnapshotId,
  );
  const notes = comments.filter((c) => c.kind === 'note');
  const appliedEdits = comments.filter((c) => c.kind === 'edit' && c.status === 'applied');

  const groups: Group[] = [
    { label: t('commentsTab.pendingEdits'), icon: Sparkles, rows: pendingEdits },
    { label: t('commentsTab.notes'), icon: MessageSquareText, rows: notes },
    { label: t('commentsTab.appliedEdits'), icon: Sparkles, rows: appliedEdits },
  ];

  const empty = comments.length === 0;
  if (empty) {
    return (
      <div className="px-[var(--space-4)] py-[var(--space-6)] text-[var(--text-sm)] text-[var(--color-text-muted)] leading-[var(--leading-body)]">
        {t('commentsTab.empty')}
      </div>
    );
  }

  return (
    <div className="px-[var(--space-4)] py-[var(--space-3)] space-y-[var(--space-4)]">
      {groups.map((group) => {
        if (group.rows.length === 0) return null;
        const Icon = group.icon;
        return (
          <section key={group.label} className="space-y-[var(--space-2)]">
            <h3 className="flex items-center gap-[var(--space-1_5)] text-[var(--text-2xs)] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              <Icon className="h-[var(--size-icon-xs)] w-[var(--size-icon-xs)]" aria-hidden />
              {group.label}
              <span className="ml-[var(--space-1)] text-[var(--color-text-muted)]">
                {group.rows.length}
              </span>
            </h3>
            <ul className="space-y-[var(--space-1_5)]">
              {group.rows.map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-[var(--space-2)] rounded-[var(--radius-md)] border border-[var(--color-border-muted)] bg-[var(--color-surface)] px-[var(--space-2_5)] py-[var(--space-2)]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[var(--text-xs)] leading-[1.4] text-[var(--color-text-primary)]">
                      {c.text}
                    </p>
                    <p className="mt-[var(--space-0_5)] font-mono text-[10px] text-[var(--color-text-muted)] truncate">
                      {c.tag} · {c.selector}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeComment(c.id)}
                    className="shrink-0 rounded-[var(--radius-md)] p-[var(--space-1)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
                    aria-label={t('commentsTab.delete')}
                  >
                    <Trash2 className="h-[var(--size-icon-xs)] w-[var(--size-icon-xs)]" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
