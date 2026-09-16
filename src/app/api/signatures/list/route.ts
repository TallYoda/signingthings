import { NextResponse } from "next/server";
import { inboxAuthorized } from "@/lib/auth";
import { listSignatures } from "@/lib/signatures";

export const runtime = "nodejs";

export async function GET() {
  if (!(await inboxAuthorized())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const records = await listSignatures();
  return NextResponse.json({
    signatures: records,
  });
}
