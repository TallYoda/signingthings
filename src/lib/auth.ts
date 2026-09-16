import { cookies } from "next/headers";

export const INBOX_PIN = process.env.INBOX_PIN ?? "1597";

export const PIN_COOKIE = "inbox_pin";

export function pinIsValid(pin: string | undefined | null) {
  return Boolean(pin) && pin === INBOX_PIN;
}

export async function inboxAuthorized() {
  const store = await cookies();
  return pinIsValid(store.get(PIN_COOKIE)?.value);
}
