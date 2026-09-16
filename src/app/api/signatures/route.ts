import { NextResponse } from "next/server";
import { saveSignature } from "@/lib/signatures";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { signerName?: string; pngBase64?: string }
    | null;

  const signerName = body?.signerName?.trim();
  const pngBase64 = body?.pngBase64?.trim();

  if (!signerName || !pngBase64?.startsWith("data:image/png")) {
    return NextResponse.json(
      { error: "A name and PNG signature are required." },
      { status: 400 },
    );
  }

  if (pngBase64.length > 1_800_000) {
    return NextResponse.json(
      { error: "That signature image is too large. Clear and sign again." },
      { status: 413 },
    );
  }

  const record = await saveSignature({ signerName, pngBase64 });
  return NextResponse.json({
    id: record.id,
    signerName: record.signerName,
    createdAt: record.createdAt,
  });
}
