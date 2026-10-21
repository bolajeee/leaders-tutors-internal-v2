"use client";
import { ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { queryClient } from "@/lib/query-client";
import { ToastContainerWrapper } from "@/components/toast";
import { DialogProvider } from "@/components/dialog-box/DialogProvider";
import MockCheckoutHost from "@/components/payment/MockCheckoutHost";

function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ToastContainerWrapper />
      <DialogProvider />
      <MockCheckoutHost />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default Providers;
