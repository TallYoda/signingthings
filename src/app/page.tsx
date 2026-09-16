import { SignForm } from "@/components/sign-form";
import { DOCUMENT } from "@/lib/document";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-dvh bg-[#f3eee4] text-stone-900">
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 py-8 sm:py-12">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-stone-500 uppercase">
          Signature request
        </p>
        <h1 className="font-heading mt-3 text-3xl leading-tight font-semibold text-slate-900">
          {DOCUMENT.title}
        </h1>
        <p className="mt-1 text-lg text-stone-600">{DOCUMENT.subtitle}</p>
        <p className="mt-3 text-sm text-stone-500">Dated {DOCUMENT.dated}</p>
        <p className="font-amharic mt-5 text-base leading-7 text-stone-700">
          እባክዎ ከታች ፊርማዎን ያስቀምጡ። ፊርማው ለሰነዱ ብቻ ይውላል።
        </p>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Please sign in the box with your finger, check that your name is
          correct, then submit. The PNG will be sent so it can be placed on the
          PDF.
        </p>

        <section className="mt-8 rounded-3xl border border-stone-200 bg-[#fbfaf6] p-5 shadow-sm">
          <SignForm />
        </section>

        <p className="mt-auto pt-10 text-center text-xs text-stone-400">
          <Link href="/inbox" className="underline-offset-4 hover:underline">
            {DOCUMENT.collectorLabel} inbox
          </Link>
          <span className="mx-2">·</span>
          <Link href="/stamp" className="underline-offset-4 hover:underline">
            Place on PDF
          </Link>
        </p>
      </main>
    </div>
  );
}
