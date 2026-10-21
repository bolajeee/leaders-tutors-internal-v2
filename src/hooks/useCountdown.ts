import { useCallback, useEffect, useState } from "react";

/** Counts down once per second from `seconds`; `restart` starts it over. */
export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (remaining <= 0) return;
    const timer = window.setTimeout(() => setRemaining((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [remaining]);

  const restart = useCallback(() => setRemaining(seconds), [seconds]);
  return { remaining, done: remaining <= 0, restart };
}
