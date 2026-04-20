import { describe, expect, it } from 'vitest';
import { CommentBubble, type CommentBubbleProps } from './CommentBubble';

describe('CommentBubble module', () => {
  it('exports the component', () => {
    expect(typeof CommentBubble).toBe('function');
  });

  it('props type includes required rect fields', () => {
    const props: CommentBubbleProps = {
      selector: '#x',
      tag: 'div',
      outerHTML: '<div/>',
      rect: { top: 0, left: 0, width: 1, height: 1 },
      onClose: () => {},
      onSaveNote: () => {},
      onSendToClaude: () => {},
    };
    expect(props.rect.top).toBe(0);
  });
});
