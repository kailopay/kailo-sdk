import { KailoPayError } from "./errors.js";
import type {
  ExactAmount,
  FiatAmount,
  ListOrdersResponse,
  MinorAmount,
  Order,
  OrderResponse,
  Quote,
  QuotePreviewResponse,
  StellarAsset,
} from "./types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasString(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === "string";
}

function isMinorAmount(value: unknown): value is MinorAmount {
  return typeof value === "string" && /^[1-9]\d*$/.test(value);
}

function isExactAmount(value: unknown): value is ExactAmount {
  return typeof value === "string" && /^\d+\.\d{1,7}$/.test(value);
}

function isFiatAmount(value: unknown): value is FiatAmount {
  return isRecord(value) && value.currency === "IDR" && isMinorAmount(value.amount_minor);
}

function isStellarAsset(value: unknown): value is StellarAsset {
  return isRecord(value) && value.network === "stellar_testnet" && value.code === "XLM" && isExactAmount(value.amount);
}

function isQuote(value: unknown): value is Quote {
  if (!isRecord(value)) return false;
  if (value.direction !== "buy" && value.direction !== "sell") return false;
  if (value.environment !== "sandbox" || value.network !== "stellar_testnet") return false;
  if (!isFiatAmount(value.fiat)) return false;
  if (!isRecord(value.asset) || value.asset.code !== "XLM" || !isExactAmount(value.asset.amount)) return false;
  if (!hasString(value, "rate") || !hasString(value, "adjusted_rate") || typeof value.spread_bps !== "number") return false;
  return hasString(value, "source_at") && hasString(value, "expires_at");
}

function isOrder(value: unknown): value is Order {
  if (!isRecord(value)) return false;
  if (!hasString(value, "id") || !hasString(value, "status") || !hasString(value, "environment")) return false;
  if (!hasString(value, "network") || !hasString(value, "created_at") || !hasString(value, "updated_at")) return false;
  if (!isFiatAmount(value.fiat) || !isStellarAsset(value.asset)) return false;
  if (!isRecord(value.quote)) return false;
  if (!hasString(value.quote, "rate") || !hasString(value.quote, "adjusted_rate") || typeof value.quote.spread_bps !== "number") return false;
  if (!hasString(value.quote, "source_at") || !hasString(value.quote, "expires_at")) return false;
  if (!isRecord(value.stellar_destination) || !hasString(value.stellar_destination, "account")) return false;
  return true;
}

function invalidResponse(): KailoPayError {
  return new KailoPayError("kailopay returned an invalid response", {
    status: 502,
    code: "INVALID_RESPONSE",
  });
}

export function decodeOrderResponse(value: unknown): OrderResponse {
  if (!isRecord(value) || !isOrder(value.order)) throw invalidResponse();
  return { order: value.order };
}

export function decodeListOrdersResponse(value: unknown): ListOrdersResponse {
  if (!isRecord(value) || !Array.isArray(value.orders) || !value.orders.every(isOrder) || !hasString(value, "next_cursor")) {
    throw invalidResponse();
  }
  if (typeof value.next_cursor !== "string") throw invalidResponse();
  return { orders: value.orders, next_cursor: value.next_cursor };
}

export function decodeQuotePreviewResponse(value: unknown): QuotePreviewResponse {
  if (!isRecord(value) || !isQuote(value.quote)) throw invalidResponse();
  return { quote: value.quote };
}
