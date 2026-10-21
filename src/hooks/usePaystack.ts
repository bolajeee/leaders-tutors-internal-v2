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
}

interface UsePaystackReturn {
  initiatePayment: (
    config: Omit<PaystackConfig, "publicKey" | "onSuccess" | "onClose">,
  ) => void;
  isLoading: boolean;
  error: string | null;
}

export const usePaystack = ({
  publicKey,
  onSuccess,
  onClose,
}: UsePaystackOptions): UsePaystackReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const loadScript = async () => {
      try {
        await loadPaystackScript();
        setScriptLoaded(true);
      } catch (err) {
        setError("Failed to load payment system. Please refresh the page.");
        console.error("Paystack script loading error:", err);
      }
    };

    loadScript();
  }, []);

  const initiatePayment = useCallback(
    (config: Omit<PaystackConfig, "publicKey" | "onSuccess" | "onClose">) => {
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
        });
      } catch (err) {
        setIsLoading(false);
        setError("Failed to initialize payment. Please try again.");
        console.error("Payment initialization error:", err);
      }
    },
    [scriptLoaded, publicKey, onSuccess, onClose],
  );

  return {
    initiatePayment,
    isLoading,
    error,
  };
};
