import type { ReactNode } from 'react';

/** The text box under the scene: a short line of narration, then the question or result. */
export function DialogBox({ narration, count, timer, children }: { narration: string; count?: string; timer?: string; children?: ReactNode }) {
  return (
    <div className="dialog" role="status">
      <div className="dialog-head">
        <span className="dialog-count">{count}</span>
        {timer && <span className="timer">{timer}</span>}
      </div>
      <p className="dialog-narr">{narration}</p>
      {children}
      <span className="dialog-next" aria-hidden="true" />
    </div>
  );
}
