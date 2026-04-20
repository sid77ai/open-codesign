import { CommentsTabContent } from './CommentsTabContent';

/**
 * Comments tab body — lists pending edits / notes / applied edits. The
 * sidebar owns the tab strip + scroll container; this component just
 * renders the sectioned list (or the empty state).
 */
export function CommentsTab() {
  return <CommentsTabContent />;
}
