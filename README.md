# Signature request

A small Next.js app you can host on Vercel and send to a phone. Your dad opens the link, signs with his finger, and that signature PNG is sent back so you can place it on the original PDF.

Built for the **Team meeting minutes — 10 year Strategic Plan** document dated **15 July 2026**.

## How it works

1. You send him the site URL. That page is the signing screen.
2. He types his name (defaults to Getachew), signs, and taps **Submit signature**.
3. On his phone he taps **Send signature**. That opens the share sheet so he can WhatsApp or email you the PNG.
4. The same PNG is also saved to **Inbox** (`/inbox`, PIN `1597` unless you change it).
5. On your computer open **Place on PDF** (`/stamp`), upload the original minutes PDF, drop in the PNG, drag it into place, and download the stamped file.

## Run locally

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:43147](http://127.0.0.1:43147).

Inbox PIN defaults to `1597` (from the document date). Change it with `INBOX_PIN` in `.env.local`.

## Deploy on Vercel

1. Push this repo and import it in [Vercel](https://vercel.com/new).
2. Set environment variable `INBOX_PIN` to a PIN only you know.
3. Optional but recommended: in the Vercel project, create a **Blob** store. That keeps submitted signatures after the serverless function sleeps. Without Blob, still use **Send signature** on the phone — that always works.
4. Deploy, then send your dad the production URL. Do not send him `/inbox` or `/stamp`.

## Pages

| URL | Who | Purpose |
| --- | --- | --- |
| `/` | Your dad | Sign on a phone |
| `/inbox` | You | See submitted PNGs |
| `/stamp` | You | Overlay a PNG onto the PDF |

The original Windows file is not in this repo. Upload it yourself on `/stamp`:

`Getachew_Signed_Team meeting minute_10 year SP_ 15_07_2026.pdf`
