"use client";

import {
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
} from "react";

type Point = { x: number; y: number };

type SignaturePadProps = {
  onEmptyChange?: (empty: boolean) => void;
};

export type SignaturePadHandle = {
  clear: () => void;
  isEmpty: () => boolean;
  toCroppedPng: () => string | null;
};

export function SignaturePad({
  onEmptyChange,
  handleRef,
}: SignaturePadProps & {
  handleRef: MutableRefObject<SignaturePadHandle | null>;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const last = useRef<Point | null>(null);
  const empty = useRef(true);
  const ratioRef = useRef(1);

  const notify = useCallback(() => {
    onEmptyChange?.(empty.current);
  }, [onEmptyChange]);

  const cssPoint = (event: PointerEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const stroke = (from: Point, to: Point) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  };

  const setupContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const ratio = ratioRef.current;
    ctx.scale(ratio, ratio);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#172554";
    ctx.lineWidth = 2.6;
  }, []);

  const fitCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(window.devicePixelRatio || 1, 2);
    ratioRef.current = ratio;
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    setupContext();
    empty.current = true;
    notify();
  }, [notify, setupContext]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setupContext();
    empty.current = true;
    last.current = null;
    notify();
  }, [notify, setupContext]);

  const isEmpty = useCallback(() => empty.current, []);

  const toCroppedPng = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || empty.current) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    const { width, height } = canvas;
    const image = ctx.getImageData(0, 0, width, height);
    const { data } = image;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 18) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < minX || maxY < minY) return null;
    const pad = Math.round(24 * ratioRef.current);
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(width - 1, maxX + pad);
    maxY = Math.min(height - 1, maxY + pad);
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const cropped = document.createElement("canvas");
    cropped.width = cropW;
    cropped.height = cropH;
    const cropCtx = cropped.getContext("2d")!;
    cropCtx.putImageData(ctx.getImageData(minX, minY, cropW, cropH), 0, 0);
    return cropped.toDataURL("image/png");
  }, []);

  useEffect(() => {
    handleRef.current = { clear, isEmpty, toCroppedPng };
    return () => {
      handleRef.current = null;
    };
  }, [clear, handleRef, isEmpty, toCroppedPng]);

  useEffect(() => {
    fitCanvas();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onPointerDown = (event: PointerEvent) => {
      event.preventDefault();
      canvas.setPointerCapture(event.pointerId);
      drawing.current = true;
      last.current = cssPoint(event);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!drawing.current || !last.current) return;
      event.preventDefault();
      const point = cssPoint(event);
      stroke(last.current, point);
      last.current = point;
      if (empty.current) {
        empty.current = false;
        notify();
      }
    };

    const endStroke = (event: PointerEvent) => {
      if (!drawing.current) return;
      event.preventDefault();
      drawing.current = false;
      last.current = null;
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", endStroke);
    canvas.addEventListener("pointercancel", endStroke);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", endStroke);
      canvas.removeEventListener("pointercancel", endStroke);
    };
  }, [fitCanvas, notify]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full touch-none bg-transparent"
      style={{ touchAction: "none" }}
    />
  );
}
