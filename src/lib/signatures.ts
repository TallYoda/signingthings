import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type SignatureRecord = {
  id: string;
  signerName: string;
  createdAt: string;
  pngBase64: string;
};

type StoredMeta = Omit<SignatureRecord, "pngBase64">;

function blobStoreEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function dataDir() {
  if (process.env.VERCEL) {
    return "/tmp/signatures";
  }
  return path.join(process.cwd(), "data", "signatures");
}

function decodePng(pngBase64: string) {
  const raw = pngBase64.includes(",")
    ? pngBase64.split(",")[1]
    : pngBase64;
  return Buffer.from(raw, "base64");
}

export async function saveSignature(input: {
  signerName: string;
  pngBase64: string;
}): Promise<SignatureRecord> {
  const record: SignatureRecord = {
    id: crypto.randomUUID(),
    signerName: input.signerName.trim() || "Unsigned name",
    createdAt: new Date().toISOString(),
    pngBase64: input.pngBase64.includes(",")
      ? input.pngBase64
      : `data:image/png;base64,${input.pngBase64}`,
  };

  if (blobStoreEnabled()) {
    const { put } = await import("@vercel/blob");
    const png = decodePng(record.pngBase64);
    const meta: StoredMeta = {
      id: record.id,
      signerName: record.signerName,
      createdAt: record.createdAt,
    };
    await Promise.all([
      put(`signatures/${record.id}.png`, png, {
        access: "public",
        addRandomSuffix: false,
        contentType: "image/png",
      }),
      put(`signatures/${record.id}.json`, JSON.stringify(meta), {
        access: "public",
        addRandomSuffix: false,
        contentType: "application/json",
      }),
    ]);
    return record;
  }

  const dir = dataDir();
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, `${record.id}.json`),
    JSON.stringify({
      id: record.id,
      signerName: record.signerName,
      createdAt: record.createdAt,
    } satisfies StoredMeta),
  );
  await writeFile(
    path.join(dir, `${record.id}.png`),
    decodePng(record.pngBase64),
  );
  return record;
}

async function recordFromFs(id: string): Promise<SignatureRecord | null> {
  const dir = dataDir();
  try {
    const meta = JSON.parse(
      await readFile(path.join(dir, `${id}.json`), "utf8"),
    ) as StoredMeta;
    const png = await readFile(path.join(dir, `${id}.png`));
    return {
      ...meta,
      pngBase64: `data:image/png;base64,${png.toString("base64")}`,
    };
  } catch {
    return null;
  }
}

async function listFromFs(): Promise<SignatureRecord[]> {
  const dir = dataDir();
  try {
    const files = await readdir(dir);
    const ids = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(/\.json$/, ""));
    const records = await Promise.all(ids.map((id) => recordFromFs(id)));
    return records
      .filter((row): row is SignatureRecord => row !== null)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

async function listFromBlob(): Promise<SignatureRecord[]> {
  const { list } = await import("@vercel/blob");
  const { blobs } = await list({ prefix: "signatures/" });
  const metas = blobs.filter((blob) => blob.pathname.endsWith(".json"));
  const records = await Promise.all(
    metas.map(async (blob) => {
      const meta = (await fetch(blob.url).then((res) => res.json())) as StoredMeta;
      const pngBlob = blobs.find(
        (item) => item.pathname === `signatures/${meta.id}.png`,
      );
      if (!pngBlob) return null;
      const bytes = await fetch(pngBlob.url).then((res) => res.arrayBuffer());
      const png = Buffer.from(new Uint8Array(bytes));
      return {
        ...meta,
        pngBase64: `data:image/png;base64,${png.toString("base64")}`,
      } satisfies SignatureRecord;
    }),
  );
  return records
    .filter((row): row is SignatureRecord => row !== null)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function listSignatures(): Promise<SignatureRecord[]> {
  if (blobStoreEnabled()) return listFromBlob();
  return listFromFs();
}
