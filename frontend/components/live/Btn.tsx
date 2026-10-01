'use client';
// A design button that runs an action. The boards draw buttons as <span>/<div> with classes (d-btn, dx-bigbtn,
// …); this keeps that exact element and styling and adds button semantics: role, focus, Enter/Space, disabled.
// Clicks don't bubble to ScreenShell, so an action button never also triggers a design link.
import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from 'react';

export default function Btn({
  as: Tag = 'span',
  className,
  style,
  onClick,
  disabled,
  busy,
  children,
  title,
  testId,
}: {
  as?: 'span' | 'div';
  className?: string;
  style?: CSSProperties;
  onClick: () => void;
  disabled?: boolean;
  busy?: boolean;
  children: ReactNode;
  title?: string;
  testId?: string;
}) {
  const off = Boolean(disabled || busy);
  const run = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!off) onClick();
  };
  return (
    <Tag
      role="button"
      tabIndex={off ? -1 : 0}
      aria-disabled={off || undefined}
      aria-busy={busy || undefined}
      className={className}
      style={off ? { ...style, opacity: 0.6, cursor: 'default' } : { ...style, cursor: 'pointer' }}
      title={title}
      data-testid={testId}
      onClick={run}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ' ') run(e);
      }}
    >
      {children}
    </Tag>
  );
}
