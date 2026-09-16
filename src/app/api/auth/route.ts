import { NextResponse } from "next/server";
import { PIN_COOKIE, pinIsValid } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { pin?: string } | null;
  if (!pinIsValid(body?.pin?.trim())) {
    return NextResponse.json({ error: "Wrong PIN." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(PIN_COOKIE, body!.pin!.trim(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.VERCEL === "1",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(PIN_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
