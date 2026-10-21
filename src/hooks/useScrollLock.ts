import { useEffect } from "react";

interface UseScrollLockProps {
  isOpen: boolean;
}

export const useScrollLock = ({ isOpen }: UseScrollLockProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);
};
