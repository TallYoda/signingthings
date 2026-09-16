"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SignatureRecord } from "@/lib/signatures";
import { Download, LoaderCircle } from "lucide-react";

type Overlay = {
  x: number;
  y: number;
  width: number;
};

export function StampClient({ initialSigId }: { initialSigId?: string }) {
  const pageCanvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [fileName, setFileName] = useState("signed.pdf");
  const [pageCount, setPageCount] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const [signature, setSignature] = useState<string | null>(null);
  const [overlay, setOverlay] = useState<Overlay>({ x: 48, y: 48, width: 180 });
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!initialSigId) return;
    void (async () => {
      const response = await fetch("/api/signatures/list");
      if (!response.ok) return;
      const payload = (await response.json()) as { signatures: SignatureRecord[] };
      const match = payload.signatures.find((row) => row.id === initialSigId);
      if (match) setSignature(match.pngBase64);
    })();
  }, [initialSigId]);

  async function loadPdfJs() {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    return pdfjs;
  }

  async function renderPage(bytes: ArrayBuffer, index: number) {
    const pdfjs = await loadPdfJs();
    const pdf = await pdfjs.getDocument({ data: bytes.slice(0) }).promise;
    const page = await pdf.getPage(index + 1);
    const unscaled = page.getViewport({ scale: 1 });
    const canvas = pageCanvas.current;
    if (!canvas) return;
    const maxWidth = Math.min(720, canvas.parentElement?.clientWidth ?? 720);
    const ratio = maxWidth / unscaled.width;
    const viewport = page.getViewport({ scale: ratio });
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(viewport.width * dpr);
    canvas.height = Math.floor(viewport.height * dpr);
    canvas.style.width = `${viewport.width}px`;
    canvas.style.height = `${viewport.height}px`;
    const ctx = canvas.getContext("2d")!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, viewport.width, viewport.height);
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    setPageCount(pdf.numPages);
    setOverlay((current) => ({
      ...current,
      x: Math.round(viewport.width * 0.12),
      y: Math.round(viewport.height * 0.72),
      width: Math.round(viewport.width * 0.28),
    }));
  }

  async function onPdf(file: File | undefined) {
    if (!file) return;
    setError(null);
    const bytes = await file.arrayBuffer();
    setPdfBytes(bytes);
    setFileName(file.name.replace(/\.pdf$/i, "") + "-signed.pdf");
    setPageIndex(0);
    await renderPage(bytes, 0);
  }

  async function onSignatureFile(file: File | undefined) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSignature(String(reader.result));
    reader.readAsDataURL(file);
  }

  useEffect(() => {
    if (!pdfBytes) return;
    void renderPage(pdfBytes, pageIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  function onDragStart(event: React.PointerEvent<HTMLDivElement>) {
    if (!stage.current) return;
    const rect = stage.current.getBoundingClientRect();
    setDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
    dragOffset.current = {
      x: event.clientX - rect.left - overlay.x,
      y: event.clientY - rect.top - overlay.y,
    };
  }

  function onDrag(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragging || !stage.current) return;
    const rect = stage.current.getBoundingClientRect();
    const x = event.clientX - rect.left - dragOffset.current.x;
    const y = event.clientY - rect.top - dragOffset.current.y;
    setOverlay((current) => ({
      ...current,
      x: Math.min(Math.max(0, x), rect.width - current.width),
      y: Math.min(Math.max(0, y), rect.height - 40),
    }));
  }

  async function downloadSigned() {
    if (!pdfBytes || !signature) {
      setError("Upload the original PDF and a signature PNG first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const pdf = await PDFDocument.load(pdfBytes.slice(0));
      const png = await pdf.embedPng(signature);
      const page = pdf.getPage(pageIndex);
      const { width, height } = page.getSize();
      const canvas = pageCanvas.current!;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = reject;
        el.src = signature;
      });
      const aspect = img.height / img.width;
      const sigWidth = (overlay.width / displayWidth) * width;
      const sigHeight = sigWidth * aspect;
      const pdfX = (overlay.x / displayWidth) * width;
      const pdfY =
        height - (overlay.y / displayHeight) * height - sigHeight;
      page.drawImage(png, {
        x: pdfX,
        y: pdfY,
        width: sigWidth,
        height: sigHeight,
      });
      const out = await pdf.save();
      const blob = new Blob([new Uint8Array(out)], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not stamp the PDF.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="pdf">Original PDF</Label>
          <Input
            id="pdf"
            type="file"
            accept="application/pdf"
            className="h-11 bg-white"
            onChange={(event) => void onPdf(event.target.files?.[0])}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="sig">Signature PNG</Label>
          <Input
            id="sig"
            type="file"
            accept="image/png"
            className="h-11 bg-white"
            onChange={(event) => void onSignatureFile(event.target.files?.[0])}
          />
        </div>
      </div>

      {pageCount > 1 ? (
        <div className="flex items-center gap-2 text-sm">
          <Button
            variant="outline"
            disabled={pageIndex === 0}
            onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
          >
            Previous page
          </Button>
          <span>
            Page {pageIndex + 1} of {pageCount}
          </span>
          <Button
            variant="outline"
            disabled={pageIndex >= pageCount - 1}
            onClick={() => setPageIndex((i) => i + 1)}
          >
            Next page
          </Button>
        </div>
      ) : null}

      <div
        ref={stage}
        className="relative overflow-auto rounded-2xl border border-stone-200 bg-stone-200/60"
      >
        <canvas ref={pageCanvas} className="block w-full bg-white" />
        {signature && pdfBytes ? (
          <div
            className="absolute cursor-grab touch-none active:cursor-grabbing"
            style={{
              left: overlay.x,
              top: overlay.y,
              width: overlay.width,
            }}
            onPointerDown={onDragStart}
            onPointerMove={onDrag}
            onPointerUp={() => setDragging(false)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={signature}
              alt="Signature overlay"
              className="pointer-events-none w-full select-none"
              draggable={false}
            />
          </div>
        ) : (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-stone-500">
            Upload the meeting-minutes PDF and a signature to position it.
          </div>
        )}
      </div>

      {signature ? (
        <div className="grid gap-2">
          <Label htmlFor="width">Signature size</Label>
          <input
            id="width"
            type="range"
            min={80}
            max={360}
            value={overlay.width}
            onChange={(event) =>
              setOverlay((current) => ({
                ...current,
                width: Number(event.target.value),
              }))
            }
          />
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <Button
        size="lg"
        className="h-12"
        disabled={busy || !pdfBytes || !signature}
        onClick={() => void downloadSigned()}
      >
        {busy ? <LoaderCircle className="animate-spin" /> : <Download />}
        Download signed PDF
      </Button>

      <p className="text-sm text-stone-500">
        Drag the signature onto the right spot, then download. Need a PNG first?{" "}
        <Link href="/inbox" className="underline underline-offset-4">
          Open the inbox
        </Link>
        .
      </p>
    </div>
  );
}
