"use client";

import { useState } from "react";
import { CalendarCheck, CheckCircle2, LoaderCircle, ShieldCheck, X } from "lucide-react";
import { renewSubscription } from "@/services/billing";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SubscriptionModal({ isOpen, onClose, onSuccess }: SubscriptionModalProps) {
  const [status, setStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  if (!isOpen) return null;

  const close = () => {
    setStatus("idle");
    setMessage("");
    onClose();
  };

  const proceed = async () => {
    try {
      setStatus("pending");
      const result = await renewSubscription();
      if (result.status === "pending") {
        setMessage("Your payment is being confirmed. Your access will update automatically.");
        return;
      }
      setStatus("success");
      setMessage(`${result.daysAdded} days of learning access have been added.`);
      window.setTimeout(() => onSuccess?.(), 900);
    } catch (failure) {
      setStatus("error");
      setMessage(failure instanceof Error ? failure.message : "We could not start your renewal.");
    }
  };

  return <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/60 p-4" role="dialog" aria-modal="true" aria-labelledby="subscription-title">
    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-indigo-50 p-2.5 text-[var(--primary-color)]"><CalendarCheck className="h-5 w-5"/></span><h2 id="subscription-title" className="text-lg font-semibold text-slate-900">Renew learning access</h2></div><button type="button" onClick={close} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Close renewal dialog"><X className="h-5 w-5"/></button></div>
      <div className="p-6">
        {status === "success" ? <div className="py-5 text-center"><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500"/><h3 className="mt-4 text-xl font-semibold text-slate-900">Access renewed</h3><p className="mt-2 text-sm leading-6 text-slate-500">{message}</p></div> : <>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Student plan</p><div className="mt-2 flex items-end justify-between"><p className="text-2xl font-bold text-slate-900">₦1,000</p><p className="text-sm text-slate-500">30 days</p></div></div>
          <div className="my-5 space-y-3 text-sm text-slate-600">{["All available curriculum lessons", "Lesson notes and CBT practice", "Secure, immediate activation"].map((item)=><p key={item} className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600"/>{item}</p>)}</div>
          {message && <p role="status" className={`mb-4 rounded-xl p-3 text-sm ${status==="error"?"bg-red-50 text-red-700":"bg-amber-50 text-amber-800"}`}>{message}</p>}
          <div className="flex gap-3"><button type="button" onClick={close} disabled={status==="pending"} className="min-h-11 flex-1 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 disabled:opacity-50">Cancel</button><button type="button" onClick={()=>void proceed()} disabled={status==="pending"} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--primary-color)] px-4 text-sm font-semibold text-white disabled:opacity-60">{status==="pending"?<><LoaderCircle className="h-4 w-4 animate-spin"/>Processing</>:"Proceed"}</button></div>
        </>}
      </div>
    </div>
  </div>;
}
