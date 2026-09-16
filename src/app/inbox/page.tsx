import { InboxClient } from "@/components/inbox-client";
import { inboxAuthorized } from "@/lib/auth";
import { listSignatures } from "@/lib/signatures";
import Link from "next/link";

export default async function InboxPage() {
  const authorized = await inboxAuthorized();
  const initialRows = authorized ? await listSignatures() : [];

  return (
    <div className="min-h-dvh bg-[#f3eee4] text-stone-900">
      <main className="mx-auto w-full max-w-lg px-5 py-8 sm:py-12">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-stone-500 uppercase">
          Document owner
        </p>
        <h1 className="font-heading mt-3 text-3xl font-semibold">Inbox</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Signatures submitted from the phone link land here. Download the PNG
          or place it on the original PDF.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/" className="underline underline-offset-4">
            Signing page
          </Link>
          <span className="mx-2 text-stone-400">·</span>
          <Link href="/stamp" className="underline underline-offset-4">
            Stamp PDF
          </Link>
        </p>
        <section className="mt-8">
          <InboxClient authorized={authorized} initialRows={initialRows} />
        </section>
      </main>
    </div>
  );
}
