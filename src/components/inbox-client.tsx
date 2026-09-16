"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SignatureRecord } from "@/lib/signatures";
import { cn } from "@/lib/utils";
import { Download, FilePenLine, LoaderCircle, RefreshCw } from "lucide-react";

function downloadPng(record: SignatureRecord) {
  const link = document.createElement("a");
  link.href = record.pngBase64;
  link.download = `${record.signerName.replace(/\s+/g, "_")}_signature.png`;
  link.click();
}

export function InboxClient({
  authorized,
  initialRows,
}: {
  authorized: boolean;
  initialRows: SignatureRecord[];
}) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<SignatureRecord[]>(initialRows);

  async function load() {
    const response = await fetch("/api/signatures/list");
    if (!response.ok) {
      setRows([]);
      return;
    }
    const payload = (await response.json()) as { signatures: SignatureRecord[] };
    setRows(payload.signatures);
  }

  async function unlock() {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    setBusy(false);
    if (!response.ok) {
      setError("Wrong PIN.");
      return;
    }
    router.refresh();
  }

  if (!authorized) {
    return (
      <form
        className="grid gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          void unlock();
        }}
      >
        <Label htmlFor="pin">Inbox PIN</Label>
        <Input
          id="pin"
          type="password"
          inputMode="numeric"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          className="h-11 bg-white"
          autoFocus
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" className="h-11" disabled={busy || !pin}>
          {busy ? <LoaderCircle className="animate-spin" /> : null}
          Open inbox
        </Button>
      </form>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-stone-500">
          {rows.length} signature{rows.length === 1 ? "" : "s"}
        </p>
        <Button variant="outline" size="sm" onClick={() => void load()}>
          <RefreshCw />
          Refresh
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-4 py-8 text-center text-sm leading-6 text-stone-600">
          No signatures yet. Send your dad the home page link. When he submits,
          tap Refresh.
        </div>
      ) : (
        rows.map((row) => (
          <article
            key={row.id}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="font-medium">{row.signerName}</h2>
                <p className="text-xs text-stone-500">
                  {new Date(row.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.pngBase64}
              alt={`${row.signerName} signature`}
              className="mt-4 max-h-28 bg-[linear-gradient(45deg,#eee_25%,transparent_25%,transparent_75%,#eee_75%),linear-gradient(45deg,#eee_25%,transparent_25%,transparent_75%,#eee_75%)] bg-size-[16px_16px] bg-position-[0_0,8px_8px] object-contain"
            />
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => downloadPng(row)}>
                <Download />
                PNG
              </Button>
              <Link
                href={`/stamp?sig=${row.id}`}
                className={cn(buttonVariants(), "inline-flex h-8")}
              >
                <FilePenLine />
                Place on PDF
              </Link>
            </div>
          </article>
        ))
      )}
    </div>
  );
}
