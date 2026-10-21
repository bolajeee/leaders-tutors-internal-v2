import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False during server rendering and the hydration pass, true afterwards.
 * Lets persisted client state (the session) be read without a hydration mismatch.
 */
export const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
