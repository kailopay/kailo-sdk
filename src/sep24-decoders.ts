import { KailoPayError } from "./errors.js";
import type {
  SEP24AssetInfo,
  SEP24InfoResponse,
  SEP24InteractiveResponse,
  SEP24StartResponse,
  SEP24Transaction,
  SEP24TransactionListResponse,
  SEP24TransactionResponse,
} from "./sep24-types.js";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function hasString(record: Record<string, unknown>, key: string): boolean {
  return typeof record[key] === "string";
}

function isAssetInfo(value: unknown): value is SEP24AssetInfo {
  if (!isRecord(value)) return false;
  if (typeof value.enabled !== "boolean" || typeof value.min_amount !== "number" || typeof value.max_amount !== "number") return false;
  if (value.amount_unit !== "XLM" && value.amount_unit !== "idr_minor") return false;
  return value.fiat_currency === "IDR";
}

function isTransaction(value: unknown): value is SEP24Transaction {
  if (!isRecord(value)) return false;
  if (!hasString(value, "id") || !hasString(value, "started_at") || !hasString(value, "updated_at")) return false;
  if (value.kind !== "deposit" && value.kind !== "withdrawal") return false;
  return value.status === "pending_user_transfer_start"
    || value.status === "pending_anchor"
    || value.status === "pending_external"
    || value.status === "completed"
    || value.status === "expired"
    || value.status === "error";
}

function invalidResponse(): KailoPayError {
  return new KailoPayError("kailopay returned an invalid SEP-24 response", {
    status: 502,
    code: "INVALID_RESPONSE",
  });
}

export function decodeSEP24Info(value: unknown): SEP24InfoResponse {
  if (!isRecord(value) || !isRecord(value.deposit) || !isAssetInfo(value.deposit.XLM)) throw invalidResponse();
  if (!isRecord(value.withdraw) || !isAssetInfo(value.withdraw.XLM)) throw invalidResponse();
  if (!isRecord(value.fee)) throw invalidResponse();
  return {
    deposit: { XLM: value.deposit.XLM },
    withdraw: { XLM: value.withdraw.XLM },
    fee: value.fee,
  };
}

export function decodeSEP24Start(value: unknown): SEP24StartResponse {
  if (!isRecord(value)) throw invalidResponse();
  if (value.type !== "interactive_customer_info_needed" || !hasString(value, "url") || !hasString(value, "id")) throw invalidResponse();
  if (typeof value.kyc_required !== "boolean" || value.environment !== "sandbox" || value.network !== "stellar_testnet") throw invalidResponse();
  if (value.payment_link_url !== undefined && typeof value.payment_link_url !== "string") throw invalidResponse();
  const url = value.url;
  const id = value.id;
  if (typeof url !== "string" || typeof id !== "string") throw invalidResponse();
  const response: SEP24StartResponse = {
    type: "interactive_customer_info_needed",
    url,
    id,
    kyc_required: value.kyc_required,
    environment: "sandbox",
    network: "stellar_testnet",
  };
  if (value.payment_link_url !== undefined) return { ...response, payment_link_url: value.payment_link_url };
  return response;
}

export function decodeSEP24Transaction(value: unknown): SEP24TransactionResponse {
  if (!isRecord(value) || !isTransaction(value.transaction)) throw invalidResponse();
  return { transaction: value.transaction };
}

export function decodeSEP24TransactionList(value: unknown): SEP24TransactionListResponse {
  if (!isRecord(value) || !Array.isArray(value.transactions) || !value.transactions.every(isTransaction)) throw invalidResponse();
  return { transactions: value.transactions };
}

export function decodeSEP24Interactive(value: unknown): SEP24InteractiveResponse {
  if (!isRecord(value)) throw invalidResponse();
  if (value.environment !== "sandbox" || value.network !== "stellar_testnet" || typeof value.kyc_required !== "boolean") throw invalidResponse();
  const interactive = value.interactive;
  const transaction = value.transaction;
  if (interactive !== undefined && !isRecord(interactive)) throw invalidResponse();
  if (transaction !== undefined && !isTransaction(transaction)) throw invalidResponse();
  return {
    environment: "sandbox",
    network: "stellar_testnet",
    kyc_required: value.kyc_required,
    ...(interactive === undefined ? {} : { interactive }),
    ...(transaction === undefined ? {} : { transaction }),
  };
}
