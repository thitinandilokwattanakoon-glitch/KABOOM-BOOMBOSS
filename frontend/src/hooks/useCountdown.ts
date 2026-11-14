import { useEffect, useState } from 'react';

/** Seconds left until `deadlineMs` (server clock). Ticks 5 times a second; null when there is no deadline. */
export function useCountdown(deadlineMs: number | null, serverNow: () => number): number | null {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    if (deadlineMs === null) {
      setLeft(null);
      return;
    }
    const tick = () => setLeft(Math.max(0, Math.ceil((deadlineMs - serverNow()) / 1000)));
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [deadlineMs, serverNow]);

  return left;
}
