import { StampClient } from "@/components/stamp-client";
import Link from "next/link";

export default async function StampPage({
  searchParams,
}: {
  searchParams: Promise<{ sig?: string }>;
}) {
  const { sig } = await searchParams;

  return (
    <div className="min-h-dvh bg-[#f3eee4] text-stone-900">
      <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:py-12">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-stone-500 uppercase">
          Document owner
        </p>
        <h1 className="font-heading mt-3 text-3xl font-semibold">
          Place signature on PDF
        </h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Upload{" "}
          <span className="font-medium">
            Getachew_Signed_Team meeting minute_10 year SP_ 15_07_2026.pdf
          </span>
          , drop in the PNG, drag it into place, and download the stamped file.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/" className="underline underline-offset-4">
            Signing page
          </Link>
          <span className="mx-2 text-stone-400">·</span>
          <Link href="/inbox" className="underline underline-offset-4">
            Inbox
          </Link>
        </p>
        <section className="mt-8">
          <StampClient initialSigId={sig} />
        </section>
      </main>
    </div>
  );
}
