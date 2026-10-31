"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText } from "lucide-react";
import ModalShell from "@/components/ui/ModalShell";
import { useAuthStore } from "@/store/authStore";
import type { LessonMaterial } from "@/types/curriculum";

type PdfDocument = Awaited<ReturnType<typeof import("pdfjs-dist")["getDocument"]>["promise"]>;

export default function MaterialPreviewModal({
  material,
  onClose,
}: {
  material: LessonMaterial | null;
  onClose: () => void;
}) {
  const token = useAuthStore((state) => state.token);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [document, setDocument] = useState<PdfDocument | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [viewportWidth, setViewportWidth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!material) return;
    let current = true;
    let task: ReturnType<typeof import("pdfjs-dist")["getDocument"]> | undefined;
    setDocument(null);
    setPageNumber(1);
    setError("");
    setLoading(true);

    void import("pdfjs-dist")
      .then((pdfjs) => {
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        task = pdfjs.getDocument({
          url: material.url,
          httpHeaders: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: false,
        });
        return task.promise;
      })
      .then((pdf) => {
        if (current) setDocument(pdf);
      })
      .catch((cause: unknown) => {
        if (current) setError(cause instanceof Error ? cause.message : "The material could not be opened.");
      })
      .finally(() => {
        if (current) setLoading(false);
      });

    return () => {
      current = false;
      void task?.destroy();
    };
  }, [material, token]);

  useEffect(() => {
    const container = viewportRef.current;
    if (!container) return;
    const update = () => setViewportWidth(container.clientWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, [material]);

  useEffect(() => {
    if (!document || !viewportWidth) return;
    let current = true;
    let renderTask: { cancel: () => void; promise: Promise<unknown> } | undefined;

    void document.getPage(pageNumber).then((page) => {
      if (!current || !canvasRef.current) return;
      const baseViewport = page.getViewport({ scale: 1 });
      const displayScale = Math.min(2, Math.max(0.25, (viewportWidth - 32) / baseViewport.width));
      const viewport = page.getViewport({ scale: displayScale });
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) return;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
        transform: outputScale === 1 ? undefined : [outputScale, 0, 0, outputScale, 0, 0],
      });
      return renderTask.promise;
    }).catch((cause: unknown) => {
      if (current && (cause as { name?: string })?.name !== "RenderingCancelledException") {
        setError(cause instanceof Error ? cause.message : "This page could not be displayed.");
      }
    });

    return () => {
      current = false;
      renderTask?.cancel();
    };
  }, [document, pageNumber, viewportWidth]);

  return (
    <ModalShell
      isOpen={Boolean(material)}
      title={material?.title ?? "Tutorial material"}
      onClose={onClose}
      closeLabel="Close material preview"
      icon={<FileText className="h-5 w-5" aria-hidden />}
      maxWidth="max-w-5xl"
      mobileFullScreen
    >
      <div className="flex min-h-full flex-col bg-slate-900 text-white" onContextMenu={(event) => event.preventDefault()}>
        <div ref={viewportRef} className="flex min-h-[60dvh] flex-1 items-start justify-center overflow-auto p-4 select-none">
          {loading ? (
            <div role="status" className="mt-20 text-center text-sm text-white/80">Loading material…</div>
          ) : error ? (
            <div role="alert" className="mt-20 max-w-md rounded-2xl bg-red-950/60 p-6 text-center text-sm">
              <p className="font-semibold">The material could not be previewed.</p>
              <p className="mt-2 text-white/75">{error}</p>
            </div>
          ) : (
            <canvas ref={canvasRef} aria-label={`Page ${pageNumber} of ${document?.numPages ?? 1}`} className="bg-white shadow-2xl" />
          )}
        </div>

        {document && !error && (
          <div className="flex shrink-0 items-center justify-center gap-4 border-t border-white/10 bg-slate-950 px-4 py-3">
            <button
              type="button"
              onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
              disabled={pageNumber <= 1}
              aria-label="Previous page"
              className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 disabled:opacity-35"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </button>
            <p className="min-w-24 text-center text-sm font-semibold">Page {pageNumber} of {document.numPages}</p>
            <button
              type="button"
              onClick={() => setPageNumber((page) => Math.min(document.numPages, page + 1))}
              disabled={pageNumber >= document.numPages}
              aria-label="Next page"
              className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 disabled:opacity-35"
            >
              <ChevronRight className="h-5 w-5" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </ModalShell>
  );
}
