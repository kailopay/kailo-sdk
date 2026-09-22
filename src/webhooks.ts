import { createHmac, timingSafeEqual } from "node:crypto";

export interface VerifyKailoWebhookOptions {
  readonly rawBody: string | Uint8Array;
  readonly timestamp: string;
  readonly signature: string;
  readonly secret: string;
  readonly toleranceSeconds?: number;
  readonly now?: number;
}

const DEFAULT_TOLERANCE_SECONDS = 300;

export function verifyKailoWebhook(options: VerifyKailoWebhookOptions): boolean {
  if (options.secret.length === 0 || !/^\d+$/.test(options.timestamp)) return false;
  if (!/^v1=[0-9a-f]{64}$/i.test(options.signature)) return false;

  const timestamp = Number(options.timestamp);
  const now = options.now ?? Math.floor(Date.now() / 1000);
  const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (!Number.isSafeInteger(timestamp) || !Number.isSafeInteger(now)) return false;
  if (!Number.isInteger(tolerance) || tolerance < 0) return false;
  if (Math.abs(now - timestamp) > tolerance) return false;

  const expected = createHmac("sha256", options.secret)
    .update(`${options.timestamp}.`, "utf8")
    .update(options.rawBody)
    .digest();
  const received = Buffer.from(options.signature.slice(3), "hex");
  return received.length === expected.length && timingSafeEqual(received, expected);
}

