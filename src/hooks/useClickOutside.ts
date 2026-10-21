import { RefObject, useEffect } from "react";

type Handler = (event: MouseEvent | TouchEvent) => void;

/**
 * Hook that handles clicks outside of the specified element
 * @param ref - React ref object for the element to detect clicks outside of
 * @param handler - Callback function to execute when a click outside is detected
 * @param enabled - Optional boolean to enable/disable the click outside detection
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  ref: RefObject<T>,
  handler: Handler,
  enabled: boolean = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const listener = (event: MouseEvent | TouchEvent) => {
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }

      handler(event);
    };

    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, enabled]);
}
