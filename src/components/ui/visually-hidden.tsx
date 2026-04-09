import * as React from 'react';

/**
 * Screen-reader-only content. Visually hidden but read by assistive tech.
 * Used for required radix-ui DialogTitle/SheetTitle when we don't want to
 * show the title visually.
 */
export const VisuallyHidden = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(function VisuallyHidden({ children, ...props }, ref) {
  return (
    <span
      ref={ref}
      {...props}
      style={{
        position: 'absolute',
        border: 0,
        width: 1,
        height: 1,
        padding: 0,
        margin: -1,
        overflow: 'hidden',
        clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap',
        wordWrap: 'normal',
      }}
    >
      {children}
    </span>
  );
});
