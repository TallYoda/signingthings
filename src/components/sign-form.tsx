"use client";

import { useRef, useState } from "react";
import {
  SignaturePad,
  type SignaturePadHandle,
} from "@/components/signature-pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DOCUMENT } from "@/lib/document";
import { Check, Download, Eraser, LoaderCircle, PenLine, Share2 } from "lucide-react";

function dataUrlToFile(dataUrl: string, filename: string) {
  const [header, body] = dataUrl.split(",");
  const mime = header.match(/data:(.*?);/)?.[1] ?? "image/png";
  const bytes = Uint8Array.from(atob(body), (char) => char.charCodeAt(0));
  return new File([bytes], filename, { type: mime });
}

export function SignForm() {
  const pad = useRef<SignaturePadHandle | null>(null);
  const [name, setName] = useState<string>(DOCUMENT.defaultSigner);
  const [empty, setEmpty] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{
    png: string;
    name: string;
    inboxOk: boolean;
  } | null>(null);

  async function submit() {
    setError(null);
    const png = pad.current?.toCroppedPng();
    if (!png) {
      setError("Please sign in the box first.");
      return;
    }
    if (!name.trim()) {
      setError("Please type the full name next to the signature.");
      return;
    }
    setBusy(true);
    let inboxOk = false;
    try {
      const response = await fetch("/api/signatures", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signerName: name.trim(), pngBase64: png }),
      });
      inboxOk = response.ok;
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(
          payload?.error ??
            "Saved on this phone, but the inbox did not receive it. Use Send below.",
        );
      }
    } catch {
      setError(
        "Saved on this phone, but the inbox did not receive it. Use Send below.",
      );
    } finally {
      setBusy(false);
      setSaved({ png, name: name.trim(), inboxOk });
    }
  }

  async function share() {
    if (!saved) return;
    const file = dataUrlToFile(
      saved.png,
      `${saved.name.replace(/\s+/g, "_")}_signature.png`,
    );
    const payload = {
      files: [file],
      title: `${saved.name} signature`,
      text: `${saved.name} signed ${DOCUMENT.title} (${DOCUMENT.datedShort}).`,
    };
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share(payload);
      return;
    }
    download();
  }

  function download() {
    if (!saved) return;
    const link = document.createElement("a");
    link.href = saved.png;
    link.download = `${saved.name.replace(/\s+/g, "_")}_signature.png`;
    link.click();
  }

  if (saved) {
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-emerald-950">
          <p className="flex items-center gap-2 font-semibold">
            <Check className="size-4" />
            Signature captured
          </p>
          <p className="mt-1 font-amharic text-sm">ፊርማው ተቀብሏል። እናመሰግናለን።</p>
          <p className="mt-2 text-sm leading-6">
            {saved.inboxOk
              ? "It is now in the inbox. You can also send the PNG from this phone."
              : "Please send the PNG from this phone so it can be placed on the PDF."}
          </p>
        </div>
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={saved.png}
            alt={`${saved.name} signature`}
            className="mx-auto max-h-36 object-contain"
          />
          <p className="mt-3 text-center text-sm text-stone-500">{saved.name}</p>
        </div>
        <div className="grid gap-2">
          <Button size="lg" className="h-12 w-full" onClick={share}>
            <Share2 />
            Send signature
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 w-full"
            onClick={download}
          >
            <Download />
            Download PNG
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-2">
        <Label htmlFor="signer">Full name / ሙሉ ስም</Label>
        <Input
          id="signer"
          value={name}
          onChange={(event) => setName(event.target.value)}
          autoComplete="name"
          className="h-11 bg-white"
        />
      </div>

      <div className="grid gap-2">
        <div className="flex items-end justify-between gap-3">
          <Label>Signature / ፊርማ</Label>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-500"
            onClick={() => pad.current?.clear()}
          >
            <Eraser className="size-3.5" />
            Clear
          </button>
        </div>
        <div className="relative h-52 overflow-hidden rounded-2xl border border-dashed border-stone-400 bg-[linear-gradient(to_bottom,transparent_51px,rgba(148,163,184,0.35)_52px),linear-gradient(#fff,#fff)] bg-[length:100%_52px,100%_100%] bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
          <p className="pointer-events-none absolute top-3 left-4 font-amharic text-xs text-stone-400">
            እባክዎ ፊርማዎን እዚህ ያስቀምጡ
          </p>
          <SignaturePad handleRef={pad} onEmptyChange={setEmpty} />
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <Button
        size="lg"
        className="h-12 w-full"
        disabled={busy || empty}
        onClick={submit}
      >
        {busy ? <LoaderCircle className="animate-spin" /> : <PenLine />}
        Submit signature
      </Button>
    </div>
  );
}
