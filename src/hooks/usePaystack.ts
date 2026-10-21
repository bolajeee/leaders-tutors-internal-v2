/**
 * usePaystack Hook
 * Custom hook for handling Paystack payments
 */

import { useState, useEffect, useCallback } from "react";
import {
  loadPaystackScript,
  initializePaystackPayment,
  type PaystackConfig,
} from "@/services/paystack";

interface UsePaystackOptions {
  publicKey: string;
  onSuccess: (reference: string) => void;
  onClose?: () => void;
  onPending?: (reference: string) => void;
}

interface UsePaystackReturn {
  initiatePayment: (
    config: Omit<PaystackConfig, "publicKey" | "onSuccess" | "onClose" | "onPending">,
  ) => void;
  isLoading: boolean;
  error: string | null;
}

export const usePaystack = ({
  publicKey,
  onSuccess,
  onClose,
  onPending,
}: UsePaystackOptions): UsePaystackReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const loadScript = async () => {
      try {
        await loadPaystackScript();
        setScriptLoaded(true);
      } catch {
        setError("Failed to load payment system. Please refresh the page.");
      }
    };

    loadScript();
  }, []);

  const initiatePayment = useCallback(
    (
      config: Omit<PaystackConfig, "publicKey" | "onSuccess" | "onClose" | "onPending">,
    ) => {
      if (!scriptLoaded) {
        setError("Payment system is still loading. Please wait...");
        return;
      }

      if (!publicKey) {
        setError("Payment configuration error. Please contact support.");
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        initializePaystackPayment({
          ...config,
          publicKey,
          onSuccess: (reference) => {
            setIsLoading(false);
            onSuccess(reference);
          },
          onClose: () => {
            setIsLoading(false);
            onClose?.();
          },
          onPending: (reference) => {
            setIsLoading(false);
            if (onPending) onPending(reference);
            else onClose?.();
          },
        });
      } catch {
        setIsLoading(false);
        setError("Failed to initialize payment. Please try again.");
      }
    },
    [scriptLoaded, publicKey, onSuccess, onClose, onPending],
  );

  return {
    initiatePayment,
    isLoading,
    error,
  };
};
